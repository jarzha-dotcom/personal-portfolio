/**
 * ttsQuota.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Tracking pemakaian karakter TTS per tier (Chirp 3 HD / WaveNet), per bulan,
 * pakai Upstash Redis (via Vercel Marketplace integration).
 *
 * Prinsip: SEBELUM memanggil GCP, karakter direservasi dulu secara atomic
 * (INCRBY lalu cek hasilnya, rollback DECRBY kalau kelewat). Pola "baca dulu,
 * putuskan, tulis belakangan" tidak race-safe untuk request paralel.
 *
 * Semua keputusan di sini sengaja KONSERVATIF (lebih baik menolak yang
 * sebenarnya masih muat daripada meloloskan yang kelewat kuota gratis):
 *   - limit di-clamp ke maksimum 90% kuota gratis walau env var diset lebih besar,
 *   - bulan mengikuti zona waktu Pasifik (zona penagihan Google Cloud). Pergantian
 *     bulan di sini TIDAK PERNAH lebih awal daripada di GCP, jadi tidak ada
 *     jendela beberapa jam di awal bulan UTC saat counter sudah 0 padahal
 *     kuota GCP bulan lama masih berjalan,
 *   - kalau rollback gagal, counter dibiarkan terlalu tinggi (bukan terlalu rendah).
 */

import { Redis } from '@upstash/redis';

// Dibuat LAZY: Redis.fromEnv() membaca UPSTASH_REDIS_REST_URL & _TOKEN. Kalau env
// belum ada, error terjadi di dalam fungsi yang dipanggil dari try/catch tts.ts
// (bukan saat modul di-load, yang akan membuat seluruh /api/tts 500).
let redisClient: Redis | null = null;
function getRedis(): Redis {
  if (!redisClient) redisClient = Redis.fromEnv();
  return redisClient;
}

// Standard TIDAK dipakai lagi: kuota gratisnya (4 juta) tampaknya satu kolam
// dengan WaveNet, jadi memakai keduanya berisiko melewati jatah gratis.
export type TtsTier = 'chirp' | 'wavenet';

const MONTHLY_LIMIT_ENV_VAR: Record<TtsTier, string> = {
  chirp: 'TTS_CHIRP_MONTHLY_LIMIT',
  wavenet: 'TTS_WAVENET_MONTHLY_LIMIT',
};

// Kuota gratis resmi GCP per bulan (cek berkala di cloud.google.com/text-to-speech/pricing).
const FREE_TIER_CHARS: Record<TtsTier, number> = {
  chirp: 1_000_000,
  wavenet: 4_000_000,
};
const DEFAULT_RATIO = 0.8; // default: 80% kuota gratis
const MAX_RATIO = 0.9; // env var TIDAK boleh melewati 90%

/**
 * Limit bulanan per tier. Default 80% kuota gratis; bisa dioverride lewat env var
 * (mis. TTS_WAVENET_MONTHLY_LIMIT=800000 kalau ingin lebih hemat), tapi selalu
 * di-clamp ke 90%. Nilai "0" mematikan tier itu. Nilai tidak valid -> default.
 */
export function getMonthlyLimit(tier: TtsTier): number {
  const def = Math.floor(FREE_TIER_CHARS[tier] * DEFAULT_RATIO);
  const cap = Math.floor(FREE_TIER_CHARS[tier] * MAX_RATIO);
  const raw = process.env[MONTHLY_LIMIT_ENV_VAR[tier]];
  if (raw === undefined || raw.trim() === '') return def;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return def;
  return Math.min(Math.floor(n), cap);
}

const PT_MONTH = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Los_Angeles',
  year: 'numeric',
  month: '2-digit',
});

function monthKey(tier: TtsTier): string {
  const parts = PT_MONTH.formatToParts(new Date());
  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  return `tts:${tier}:${year}-${month}`;
}

// Key sudah dinamai per bulan, jadi TTL hanya untuk membersihkan key lama.
const KEY_TTL_SECONDS = 40 * 24 * 60 * 60;

/**
 * Reservasi `chars` karakter untuk `tier` secara atomic.
 * - true  → kuota cukup, counter SUDAH dinaikkan.
 * - false → kuota tidak cukup, counter dikembalikan (rollback otomatis).
 * Melempar error kalau Redis bermasalah -- pemanggil WAJIB memperlakukannya
 * sebagai "tidak boleh memanggil GCP" (fail-closed).
 *
 * Panggil SEBELUM memanggil GCP TTS API, bukan sesudahnya.
 */
export async function reserveQuota(
  tier: TtsTier,
  chars: number,
  monthlyLimit: number,
): Promise<boolean> {
  // Tanpa menyentuh Redis: tier dimatikan, input aneh, atau satu request saja sudah kelewat limit.
  if (!(monthlyLimit > 0) || !(chars > 0) || chars > monthlyLimit) return false;

  const redis = getRedis();
  const key = monthKey(tier);

  const newTotal = await redis.incrby(key, chars);

  if (newTotal === chars) {
    // Increment pertama bulan ini -> pasang TTL. Kegagalan di sini tidak fatal.
    try {
      await redis.expire(key, KEY_TTL_SECONDS);
    } catch (err) {
      console.warn('[ttsQuota] expire gagal (diabaikan):', err);
    }
  }

  if (newTotal > monthlyLimit) {
    // Kelewat limit -- rollback. Kalau decrby gagal, error dilempar dan counter
    // tetap terlalu tinggi: aman (lebih ketat), bukan lebih longgar.
    await redis.decrby(key, chars);
    return false;
  }

  return true;
}

/**
 * Lepaskan reservasi. HANYA panggil kalau GCP jelas-jelas menolak request
 * (mis. HTTP 4xx, tidak ditagih). Untuk timeout / error jaringan / 5xx,
 * JANGAN release: GCP mungkin sudah memproses dan menghitung karakternya.
 */
export async function releaseQuota(tier: TtsTier, chars: number): Promise<void> {
  await getRedis().decrby(monthKey(tier), chars);
}

/** Pemakaian bulan berjalan (untuk modal monitoring). */
export async function getUsage(tier: TtsTier): Promise<number> {
  const val = await getRedis().get<number>(monthKey(tier));
  return Number(val ?? 0);
}