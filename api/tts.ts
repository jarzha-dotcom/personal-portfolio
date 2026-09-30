import { timingSafeEqual } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { reserveQuota, releaseQuota, getMonthlyLimit, getUsage, type TtsTier } from './_lib/ttsQuota.js';

const GCP_API_KEY = process.env.GCP_API_KEY;

// ── Saklar on/off GCP TTS lewat .env ─────────────────────────────────────────
// Set GCP_TTS=true di .env / Vercel env vars untuk coba GCP TTS dulu (perilaku
// normal). Kalau GCP_TTS=false, kosong, atau tidak di-set sama sekali — handler
// langsung balas 503 tanpa memanggil GCP sama sekali, jadi frontend
// (voiceService.ts) langsung pakai Web Speech API browser. Berguna kalau
// billing GCP lagi nonaktif, jadi tidak buang waktu nunggu request GCP gagal.
const GCP_TTS_ENABLED = (process.env.GCP_TTS || '').trim().toLowerCase() === 'true';

// Suara resmi Google Cloud Text-to-Speech Chirp 3 HD untuk id-ID (Free tier 1M karakter/bulan).
// NB: cek ulang nama voice ini di GCP Console (Text-to-Speech > Voices, filter id-ID)
// sebelum deploy -- daftar & ketersediaan per-locale bisa berubah.
const DEFAULT_VOICE = 'id-ID-Chirp3-HD-Aoede';

// ── Fallback berjenjang kualitas suara ───────────────────────────────────────
// Chirp 3 HD (paling natural, kuota gratis 1M karakter/bulan) → WaveNet (kuota
// gratis 4M karakter/bulan) → (kalau semua habis/gagal) frontend fallback ke
// Web Speech browser, yang tidak makan biaya sama sekali.
//
// Voice Standard SENGAJA DIHAPUS: kuota gratis Standard dan WaveNet sama-sama
// 4M dan tampaknya satu kolam. Kalau dua tier di-gate terpisah masing-masing 80%,
// totalnya bisa melewati jatah gratis. Dengan hanya dua tier, tiap tier punya
// kuota gratis sendiri dan gate 80% benar-benar melindungi.
//
// Setiap tier di-gate quota tracking sendiri (ttsQuota.ts, Upstash Redis)
// SEBELUM GCP dipanggil. Index tier di bawah harus sinkron dengan TIER_NAMES.
const VOICE_TIERS: string[][] = [
  // Tier 0 — Chirp 3 HD
  [
    'id-ID-Chirp3-HD-Aoede',
    'id-ID-Chirp3-HD-Charon',
    'id-ID-Chirp3-HD-Despina',
    'id-ID-Chirp3-HD-Puck',
  ],
  // Tier 1 — WaveNet
  [
    'id-ID-Wavenet-A',
    'id-ID-Wavenet-B',
    'id-ID-Wavenet-C',
    'id-ID-Wavenet-D',
  ],
];

const TIER_NAMES: TtsTier[] = ['chirp', 'wavenet'];

// Satu sumber kebenaran: voice yang boleh diminta = semua voice di VOICE_TIERS.
const ALLOWED_VOICES = new Set<string>(([] as string[]).concat(...VOICE_TIERS));

function tierIndexOf(voiceName: string): number {
  return VOICE_TIERS.findIndex((tier) => tier.includes(voiceName));
}

// ── Gender voice (supaya fallback tier tidak menukar cowok <-> cewek) ────────
// Persona cowok (Charon/Puck) tidak boleh jatuh ke Wavenet-A yang bersuara cewek.
// Gender diambil dari GCP (voices:list, gratis, di-cache 24 jam). Kalau gagal,
// dipakai tabel statis di bawah -- VERIFIKASI tabel ini di GCP Console sekali.
type Gender = 'FEMALE' | 'MALE';
const STATIC_GENDER: Record<string, Gender> = {
  'id-ID-Chirp3-HD-Aoede': 'FEMALE',
  'id-ID-Chirp3-HD-Despina': 'FEMALE',
  'id-ID-Chirp3-HD-Charon': 'MALE',
  'id-ID-Chirp3-HD-Puck': 'MALE',
  'id-ID-Wavenet-A': 'FEMALE', 'id-ID-Wavenet-B': 'MALE', 'id-ID-Wavenet-C': 'MALE', 'id-ID-Wavenet-D': 'FEMALE',
};
const GENDER_TTL_MS = 24 * 60 * 60 * 1000;
let genderCache: Record<string, string> | null = null;
let genderCacheAt = 0;

async function getVoiceGenders(): Promise<Record<string, string>> {
  if (genderCache && Date.now() - genderCacheAt < GENDER_TTL_MS) return genderCache;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);
  try {
    const response = await fetch('https://texttospeech.googleapis.com/v1/voices?languageCode=id-ID', {
      headers: { 'X-Goog-Api-Key': GCP_API_KEY as string },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = (await response.json()) as { voices?: { name: string; ssmlGender?: string }[] };
    const map: Record<string, string> = { ...STATIC_GENDER };
    for (const v of data.voices ?? []) if (v.ssmlGender) map[v.name] = v.ssmlGender;
    genderCache = map;
    genderCacheAt = Date.now();
    return map;
  } catch (err) {
    console.warn('[tts.ts] voices:list gagal, pakai tabel gender statis:', err);
    return genderCache ?? STATIC_GENDER;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Urutan percobaan: voice yang diminta/default dulu, lalu turun tier satu per satu
// dengan voice BERGENDER SAMA. Generator ini malas: gender baru dicari kalau
// percobaan pertama gagal / kuotanya penuh, jadi jalur normal tanpa overhead.
async function* voiceCandidates(startVoice: string): AsyncGenerator<string> {
  yield startVoice;
  const startTier = tierIndexOf(startVoice);
  for (let t = startTier === -1 ? 0 : startTier + 1; t < VOICE_TIERS.length; t++) {
    const genders = await getVoiceGenders();
    const wanted = genders[startVoice];
    const pick =
      VOICE_TIERS[t].find((v) => v !== startVoice && wanted && genders[v] === wanted) ??
      VOICE_TIERS[t].find((v) => v !== startVoice);
    if (pick) yield pick;
  }
}

const MAX_CHARS = 800; // batasi panjang teks per request TTS
const MAX_INPUT_CHARS = MAX_CHARS * 3; // batas kasar SEBELUM sanitasi (cegah regex di body raksasa)
const PER_ATTEMPT_TIMEOUT_MS = 5000; // timeout satu percobaan ke GCP
const TOTAL_DEADLINE_MS = 8500; // batas total handler (di bawah batas durasi function Vercel)

// Kalau TTS_ALLOWED_ORIGINS diisi (pisah koma), hanya origin itu yang dibalas CORS.
// Kalau kosong, perilaku lama ('*') dipertahankan supaya tidak putus saat deploy.
const ALLOWED_ORIGINS = (process.env.TTS_ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

// ── Rate limiting per IP (pola sama seperti chat.ts) ────────────────────────────
interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();
const RATE_LIMIT_PER_IP = 10; // 10 request TTS / menit / IP
const RATE_WINDOW = 60 * 1000;

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_PER_IP - 1 };
  }

  if (record.count >= RATE_LIMIT_PER_IP) {
    return { allowed: false, remaining: 0 };
  }

  record.count += 1;
  return { allowed: true, remaining: RATE_LIMIT_PER_IP - record.count };
}

// ── Panggilan sintesis untuk satu voice tertentu ─────────────────────────────
// Error HTTP dari GCP. Status 4xx = request ditolak sebelum diproses (tidak ditagih),
// jadi reservasi kuota boleh dikembalikan. Error lain (timeout, jaringan, 5xx,
// respons kosong) dianggap MUNGKIN sudah dihitung GCP -> reservasi dipertahankan.
class GcpHttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function synthesizeWithVoice(
  voiceName: string,
  text: string,
  timeoutMs: number,
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(
      'https://texttospeech.googleapis.com/v1/text:synthesize',
      {
        method: 'POST',
        // API key di header (bukan query string) supaya tidak masuk URL/log.
        headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': GCP_API_KEY as string },
        signal: controller.signal,
        body: JSON.stringify({
          input: { text },
          voice: { languageCode: 'id-ID', name: voiceName },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 1.0,
            // pitch sengaja tidak dikirim: default 0, dan voice Chirp 3 HD tidak mendukung pitch.
          },
        }),
      },
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new GcpHttpError(response.status, err.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const audioContent = data.audioContent as string | undefined;

    if (!audioContent) {
      throw new Error('Empty audio response from GCP TTS');
    }

    return audioContent;
  } finally {
    clearTimeout(timeoutId);
  }
}

function cleanupOldRateLimits() {
  const now = Date.now();
  for (const map of [rateLimitMap, usageRateLimitMap]) {
    for (const [ip, record] of map.entries()) {
      if (now > record.resetAt) {
        map.delete(ip);
      }
    }
  }
}

// Cleanup berkala tanpa menahan proses Node.js / build exit
if (typeof setInterval !== 'undefined') {
  const timer = setInterval(cleanupOldRateLimits, 5 * 60 * 1000);
  if (typeof timer.unref === 'function') {
    timer.unref();
  }
}

// ── Sanitasi teks sebelum disintesis ──────────────────────────────────────────
// Server HANYA membersihkan markdown/emoji sebagai pengaman. Normalisasi
// pelafalan (angka, istilah teknis, singkatan) dilakukan sekali di frontend
// lewat speechNormalizer.ts -- jangan diulang di sini.
function sanitizeForSpeech(raw: string): string {
  return raw
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[_~]/g, '')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// ── Endpoint usage-check (GET /api/tts) ──────────────────────────────────────
// Digabung ke file yang sama dengan endpoint synthesize (POST /api/tts) --
// BUKAN file terpisah -- karena Vercel Hobby plan cuma boleh 12 Serverless
// Function per deployment, dan tiap file baru di dalam api/ (yang gak diawali
// "_") dihitung sebagai function tersendiri. Dibedain lewat req.method, bukan
// lewat file, biar gak nambah function baru sama sekali.
const TTS_USAGE_PIN = process.env.TTS_USAGE_PIN;

const usageRateLimitMap = new Map<string, RateLimitRecord>();
const USAGE_RATE_LIMIT_PER_IP = 8; // 8 percobaan / menit / IP
const USAGE_RATE_WINDOW = 60 * 1000;

function checkUsageRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = usageRateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    usageRateLimitMap.set(ip, { count: 1, resetAt: now + USAGE_RATE_WINDOW });
    return true;
  }
  if (record.count >= USAGE_RATE_LIMIT_PER_IP) return false;
  record.count += 1;
  return true;
}

// Perbandingan waktu-konstan supaya PIN tidak bisa ditebak lewat selisih waktu respons.
function pinMatches(provided: unknown): boolean {
  if (typeof provided !== 'string' || !TTS_USAGE_PIN) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(TTS_USAGE_PIN);
  return a.length === b.length && timingSafeEqual(a, b);
}

// ── Peringatan kuota mendekati batas ─────────────────────────────────────────
// Batas bulanan (getMonthlyLimit) sudah dijaga ketat oleh reserveQuota, tapi tanpa
// peringatan kuota Chirp bisa habis tiba-tiba dan semua pengguna mendadak turun ke
// suara WaveNet/browser. Log di bawah muncul di Vercel Logs (console.warn /
// console.error) supaya bisa dipantau atau dipasangi alert.
const QUOTA_WARN_RATIO = 0.8; // >= 80% dari batas -> console.warn
const QUOTA_CRITICAL_RATIO = 0.95; // >= 95% dari batas -> console.error
const QUOTA_CHECK_INTERVAL_MS = 10 * 60 * 1000; // baca Redis paling sering sekali / 10 menit / tier / instance
const lastQuotaCheckAt = new Map<TtsTier, number>();

const quotaPercent = (used: number, limit: number): number =>
  limit > 0 ? Math.round((used / limit) * 100) : 0;

/**
 * Cek pemakaian tier setelah sintesis sukses dan log peringatan kalau mendekati
 * batas. Tidak pernah melempar error: kegagalan Redis hanya di-log dan TIDAK boleh
 * mengganggu respons audio.
 */
async function warnIfQuotaNearLimit(tier: TtsTier): Promise<void> {
  const now = Date.now();
  if (now - (lastQuotaCheckAt.get(tier) ?? 0) < QUOTA_CHECK_INTERVAL_MS) return;
  lastQuotaCheckAt.set(tier, now); // ditandai dulu supaya request paralel tidak ikut membaca Redis

  try {
    const limit = getMonthlyLimit(tier);
    const used = await getUsage(tier);
    if (limit <= 0) return;

    const ratio = used / limit;
    const message = `[tts.ts] Kuota tier "${tier}" sudah ${quotaPercent(used, limit)}% (${used}/${limit} karakter bulan ini).`;
    if (ratio >= QUOTA_CRITICAL_RATIO) {
      console.error(`${message} KRITIS: sebentar lagi semua suara turun tier.`);
    } else if (ratio >= QUOTA_WARN_RATIO) {
      console.warn(`${message} Mendekati batas.`);
    }
  } catch (error) {
    console.error(`[tts.ts] warnIfQuotaNearLimit gagal baca usage tier "${tier}":`, error);
  }
}

function usageSummary(used: number, limit: number) {
  return {
    used,
    limit,
    percent: quotaPercent(used, limit),
    nearLimit: limit > 0 && used / limit >= QUOTA_WARN_RATIO,
  };
}

async function handleUsageCheck(req: VercelRequest, res: VercelResponse) {
  if (!TTS_USAGE_PIN) {
    // Belum di-setting -- tolak semua request daripada kebuka tanpa proteksi.
    return res.status(503).json({ error: 'TTS_USAGE_PIN belum dikonfigurasi di server' });
  }

  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 'unknown';
  if (!checkUsageRateLimit(ip)) {
    return res.status(429).json({ error: 'Terlalu banyak percobaan, coba lagi sebentar' });
  }

  if (!pinMatches(req.headers['x-tts-usage-pin'])) {
    return res.status(401).json({ error: 'PIN salah' });
  }

  try {
    const [chirpUsed, wavenetUsed] = await Promise.all([
      getUsage('chirp'),
      getUsage('wavenet'),
    ]);

    return res.status(200).json({
      chirp: usageSummary(chirpUsed, getMonthlyLimit('chirp')),
      wavenet: usageSummary(wavenetUsed, getMonthlyLimit('wavenet')),
    });
  } catch (error) {
    console.error('[tts.ts] handleUsageCheck gagal ambil usage dari Redis:', error);
    return res.status(502).json({ error: 'Gagal ambil data usage dari Redis' });
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS & method check
  const origin = typeof req.headers.origin === 'string' ? req.headers.origin : undefined;
  if (ALLOWED_ORIGINS.length === 0) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-tts-usage-pin');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET = usage-check (easter egg quota modal), POST = synthesize (perilaku lama)
  if (req.method === 'GET') return handleUsageCheck(req, res);
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!GCP_TTS_ENABLED) {
    // GCP_TTS bukan 'true' di .env — sengaja di-skip (mis. billing GCP nonaktif).
    // Frontend (voiceService.ts) otomatis fallback ke Web Speech API browser
    // begitu terima 503, sama seperti kasus GCP_API_KEY kosong di bawah.
    return res.status(503).json({
      error: 'TTS_DISABLED',
      detail: 'GCP TTS dinonaktifkan (GCP_TTS bukan "true" di .env)',
    });
  }

  if (!GCP_API_KEY) {
    // Bukan error fatal — frontend (voiceService.ts) otomatis fallback ke
    // Web Speech API browser kalau endpoint ini balas 503.
    return res.status(503).json({
      error: 'TTS_UNAVAILABLE',
      detail: 'GCP_API_KEY belum dikonfigurasi di server',
    });
  }

  const body = (req.body ?? {}) as { text?: unknown; voice?: unknown };
  const { text, voice } = body;

  if (typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Teks tidak valid' });
  }

  const selectedVoice = typeof voice === 'string' && ALLOWED_VOICES.has(voice) ? voice : DEFAULT_VOICE;
  const cleanText = sanitizeForSpeech(text.slice(0, MAX_INPUT_CHARS)).slice(0, MAX_CHARS);

  if (!cleanText) {
    return res.status(400).json({ error: 'Teks kosong setelah dibersihkan' });
  }

  // IP untuk rate limiting
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 'unknown';

  const rateLimitStatus = checkRateLimit(ip);
  if (!rateLimitStatus.allowed) {
    return res.status(429).json({
      error: 'TTS_RATE_LIMITED',
      detail: `Maksimal ${RATE_LIMIT_PER_IP} permintaan suara per menit. Coba lagi sebentar ya.`,
    });
  }

  const deadline = Date.now() + TOTAL_DEADLINE_MS;
  const attemptErrors: { voice: string; error: string }[] = [];
  // Dihitung dalam BYTE UTF-8: GCP menyatakan jumlah karakter tagihan <= jumlah byte,
  // jadi ini batas atas yang konservatif untuk reservasi kuota.
  const chars = Buffer.byteLength(cleanText, 'utf8');

  for await (const voiceName of voiceCandidates(selectedVoice)) {
    const tier = TIER_NAMES[tierIndexOf(voiceName)];

    const remainingMs = deadline - Date.now();
    if (remainingMs < 1500) {
      attemptErrors.push({ voice: voiceName, error: 'Batas waktu total habis' });
      break;
    }

    // ── Quota gate SEBELUM manggil GCP (FAIL-CLOSED) ──────────────────────
    // Tiap tier di-gate lewat Redis (reservasi atomic, lihat ttsQuota.ts).
    // GCP HANYA dipanggil kalau reservasi berhasil. Kuota penuh, Redis error,
    // atau tier tak dikenal -> semuanya berarti "jangan panggil GCP" dan lanjut
    // ke tier berikutnya. Kalau semua tier ditolak, handler balas 502 dan
    // frontend fallback ke Web Speech browser (gratis). Jadi tidak ada request
    // yang menembus ke GCP di luar kuota gratis, bahkan saat Redis sedang down.
    if (!tier) {
      attemptErrors.push({ voice: voiceName, error: 'Tier voice tidak dikenal' });
      continue;
    }

    let reserved = false;
    try {
      reserved = await reserveQuota(tier, chars, getMonthlyLimit(tier));
    } catch (quotaErr) {
      console.error(`[tts.ts] reserveQuota gagal (tier ${tier}), tier dilewati (fail-closed):`, quotaErr);
      attemptErrors.push({ voice: voiceName, error: `Cek kuota tier "${tier}" gagal` });
      continue;
    }
    if (!reserved) {
      attemptErrors.push({ voice: voiceName, error: `Kuota bulanan tier "${tier}" sudah penuh` });
      continue;
    }

    try {
      const audioContent = await synthesizeWithVoice(voiceName, cleanText, Math.min(PER_ATTEMPT_TIMEOUT_MS, remainingMs));

      await warnIfQuotaNearLimit(tier); // tidak pernah melempar error

      return res.status(200).json({
        audioContent,
        voice: voiceName,
        // true kalau yang akhirnya dipakai bukan pilihan/default awal, jadi
        // frontend bisa kasih tau user kalau kualitasnya turun tier
        degraded: voiceName !== selectedVoice,
        remainingQuota: rateLimitStatus.remaining,
      });
    } catch (error: unknown) {
      // Rollback reservasi HANYA kalau GCP jelas menolak (HTTP 4xx, tidak ditagih).
      // Timeout / error jaringan / 5xx / respons kosong: reservasi dipertahankan
      // karena GCP mungkin sudah menghitung karakternya (lebih baik over-count).
      if (error instanceof GcpHttpError && error.status >= 400 && error.status < 500) {
        try {
          await releaseQuota(tier, chars);
        } catch (releaseErr) {
          console.error(`[tts.ts] releaseQuota gagal (tier ${tier}):`, releaseErr);
        }
      }

      const isTimeout = error instanceof Error && error.name === 'AbortError';
      const message = isTimeout
        ? 'Request timeout ke GCP TTS'
        : error instanceof Error
          ? error.message
          : 'Unknown error';

      console.error(`[tts.ts] GCP TTS gagal untuk voice "${voiceName}":`, message);
      attemptErrors.push({ voice: voiceName, error: message });
      // lanjut ke voice/tier berikutnya di fallbackChain
    }
  }

  // Semua tier GCP (Chirp -> Wavenet) gagal / kuota penuh / waktu habis.
  // Balas 502 supaya frontend (voiceService.ts) fallback ke Web Speech API browser.
  return res.status(502).json({
    error: 'TTS_FAILED',
    detail: 'Semua tier suara GCP TTS gagal disintesis.',
    attempts: attemptErrors,
  });
}