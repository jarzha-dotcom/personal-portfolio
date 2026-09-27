/**
 * ttsQuota.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Tracking pemakaian karakter TTS per tier (Chirp 3 HD / WaveNet), per bulan,
 * pakai Upstash Redis (via Vercel Marketplace integration).
 *
 * Kenapa gak andalkan GCP budget alert:
 * Billing data GCP ada lag (bisa jam-an) sebelum "sadar" berapa yang udah
 * kepake, jadi gak cukup presisi buat switch "begitu kuota gratis abis,
 * langsung pindah tier" pada chatbot yang dipanggil live & terus-menerus.
 * Di sini kita cek & catat pemakaian sendiri SEBELUM manggil API GCP.
 *
 * Kenapa INCRBY dulu baru dicek (bukan GET dulu baru INCR belakangan):
 * INCRBY di Redis itu atomic. Kalau polanya "baca nilai, baru putuskan,
 * baru tulis" sebagai 2 langkah terpisah di application code, banyak
 * request paralel (wajar buat chatbot live) bisa semua "lolos" cek
 * bersamaan sebelum satupun sempat nulis, jadi tetap overshoot dari limit.
 * Reserve-dulu (incrby) baru rollback (decrby) kalau ternyata kelewat itu
 * cara yang race-condition-safe di level database.
 *
 * Reset bulanan otomatis: key Redis dinamai per-bulan (mis. "tts:chirp:2026-09"),
 * dikasih TTL sampai awal bulan depan. Gak perlu logic reset manual sama
 * sekali -- bulan baru = key baru, otomatis mulai dari 0.
 */

import { Redis } from '@upstash/redis';

// Redis.fromEnv() otomatis baca UPSTASH_REDIS_REST_URL & UPSTASH_REDIS_REST_TOKEN
// dari environment variable -- otomatis ke-inject Vercel begitu integration
// "Upstash for Redis" di-connect ke project (Vercel Marketplace).
const redis = Redis.fromEnv();

export type TtsTier = 'chirp' | 'wavenet' | 'standard';

const MONTHLY_LIMIT_ENV_VAR: Record<TtsTier, string> = {
  chirp: 'TTS_CHIRP_MONTHLY_LIMIT',
  wavenet: 'TTS_WAVENET_MONTHLY_LIMIT',
  standard: 'TTS_STANDARD_MONTHLY_LIMIT',
};

// Default 80% dari kuota gratis resmi GCP masing-masing tier:
// Chirp 3 HD = 1.000.000 karakter/bulan, WaveNet & Standard = 4.000.000
// karakter/bulan masing-masing (GCP sekarang nyamain kuota gratis &
// harga per-karakter WaveNet dengan Standard -- dulu WaveNet cuma 1 juta).
const DEFAULT_MONTHLY_LIMIT: Record<TtsTier, number> = {
  chirp: 800_000,
  wavenet: 3_200_000,
  standard: 3_200_000,
};

/**
 * Limit bulanan per tier, dibaca dari env var (bisa dioverride di Vercel),
 * default 80% dari kuota gratis resmi GCP -- buffer biar ada jarak aman
 * meski ada sedikit selisih hitungan karakter antara Redis & billing GCP
 * yang sebenarnya. Satu sumber ini dipakai bareng oleh tts.ts (buat quota
 * gate) dan tts-usage.ts (buat nampilin persentase pemakaian), biar gak ada
 * risiko dua tempat itu punya angka limit yang beda-beda/nyimpang.
 */
export function getMonthlyLimit(tier: TtsTier): number {
  return Number(process.env[MONTHLY_LIMIT_ENV_VAR[tier]]) || DEFAULT_MONTHLY_LIMIT[tier];
}

function monthKey(tier: TtsTier): string {
  const now = new Date();
  const ym = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  return `tts:${tier}:${ym}`;
}

function secondsUntilNextMonth(): number {
  const now = new Date();
  const nextMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0),
  );
  return Math.ceil((nextMonth.getTime() - now.getTime()) / 1000);
}

/**
 * Reservasi `chars` karakter untuk `tier` ini secara atomic.
 * - true  → kuota cukup, counter Redis SUDAH dinaikkan (dianggap "terpakai").
 * - false → kuota gak cukup, counter DIKEMBALIKAN ke nilai semula (rollback
 *           otomatis di dalam fungsi ini, pemanggil gak perlu ngapa-ngapain).
 *
 * Panggil ini SEBELUM manggil GCP TTS API, bukan sesudahnya.
 */
export async function reserveQuota(
  tier: TtsTier,
  chars: number,
  monthlyLimit: number,
): Promise<boolean> {
  const key = monthKey(tier);

  const newTotal = await redis.incrby(key, chars);

  if (newTotal === chars) {
    // Ini increment pertama buat key bulan ini → key baru dibuat.
    // Kasih TTL biar otomatis "kadaluarsa" begitu bulan depan mulai
    // (+1 hari buffer buat jaga-jaga selisih jam server/UTC).
    await redis.expire(key, secondsUntilNextMonth() + 24 * 60 * 60);
  }

  if (newTotal > monthlyLimit) {
    // Kelewat limit -- rollback, jangan biarkan reservasi ini "nyangkut".
    await redis.decrby(key, chars);
    return false;
  }

  return true;
}

/**
 * Lepaskan reservasi yang sudah dibuat reserveQuota(), dipanggil kalau
 * ternyata pemanggilan GCP TTS-nya gagal total di tier ini (supaya
 * karakter yang gagal disintesis gak ikut kehitung "kepake beneran").
 */
export async function releaseQuota(tier: TtsTier, chars: number): Promise<void> {
  await redis.decrby(monthKey(tier), chars);
}

/** Buat keperluan monitoring/debug -- lihat pemakaian bulan berjalan. */
export async function getUsage(tier: TtsTier): Promise<number> {
  const val = await redis.get<number>(monthKey(tier));
  return val ?? 0;
}