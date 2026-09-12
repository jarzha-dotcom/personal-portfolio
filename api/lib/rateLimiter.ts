// ── Rate limiting per IP & Global Antigravity Cap ─────────────────────────────

interface RateLimitRecord {
    count: number;
    resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();
export const RATE_LIMIT_PER_MODEL = 5; // 5 RPM per model per IP (safe untuk free tier)
export const RATE_WINDOW = 60 * 1000; // 1 menit

export function getRateLimitKey(ip: string, model: string): string {
    return `${ip}:${model}`;
}

export function checkRateLimit(ip: string, model: string): { allowed: boolean; remaining: number } {
    const key = getRateLimitKey(ip, model);
    const now = Date.now();
    const record = rateLimitMap.get(key);

    if (!record || now > record.resetAt) {
        rateLimitMap.set(key, { count: 1, resetAt: now + RATE_WINDOW });
        return { allowed: true, remaining: RATE_LIMIT_PER_MODEL - 1 };
    }

    if (record.count >= RATE_LIMIT_PER_MODEL) {
        return { allowed: false, remaining: 0 };
    }

    record.count += 1;
    return { allowed: true, remaining: RATE_LIMIT_PER_MODEL - record.count };
}

export function cleanupOldRateLimits(): void {
    const now = Date.now();
    for (const [key, record] of rateLimitMap.entries()) {
        if (now > record.resetAt) {
            rateLimitMap.delete(key);
        }
    }
}

// ── Cap harian GLOBAL khusus Antigravity ─────────────────────────────────────
export const ANTIGRAVITY_DAILY_CAP = 30; // sisa ~70 dari total 100 RPD jadi headroom testing/dev
let antigravityDayKey = '';
let antigravityDayCount = 0;

export function getAntigravityDailyStatus(): { allowed: boolean; remaining: number } {
    const todayKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
    if (todayKey !== antigravityDayKey) {
        antigravityDayKey = todayKey;
        antigravityDayCount = 0;
    }
    return {
        allowed: antigravityDayCount < ANTIGRAVITY_DAILY_CAP,
        remaining: Math.max(0, ANTIGRAVITY_DAILY_CAP - antigravityDayCount),
    };
}

/** Dipanggil HANYA setelah Antigravity beneran sukses dipanggil (bukan pas gagal/fallback). */
export function consumeAntigravityDailyQuota(): void {
    antigravityDayCount += 1;
}

// ── Rate limit & Cap harian khusus DevRAB Engine ──────────────────────────────
// DevRAB adalah infra terpisah (bukan Google) yang bisa punya cost nyata per-hit,
// jadi perlu double-layer protection:
//   1. Per-IP per-jam: mencegah 1 user spam tombol Generate RAB berulang-ulang
//      (hanya 3 generate/jam/IP cukup karena 1 RAB biasanya sudah final/hampir final)
//   2. Global daily cap: lindungi total budget/kuota DevRAB dari lonjakan trafik
//      showcase ramai (seluruh visitor berbagi 1 pool)

const devrabRateLimitMap = new Map<string, RateLimitRecord>();
export const DEVRAB_RATE_LIMIT_PER_HOUR = 3;   // max 3 generate per IP per jam
export const DEVRAB_RATE_WINDOW = 60 * 60 * 1000; // 1 jam
export const DEVRAB_DAILY_CAP = 20; // max 20 generate/hari global (konservatif, bisa dinaikan)

let devrabDayKey = '';
let devrabDayCount = 0;

export function checkDevRABRateLimit(ip: string): { allowed: boolean; remaining: number } {
    const key = `devrab:${ip}`;
    const now = Date.now();
    const record = devrabRateLimitMap.get(key);

    if (!record || now > record.resetAt) {
        devrabRateLimitMap.set(key, { count: 1, resetAt: now + DEVRAB_RATE_WINDOW });
        return { allowed: true, remaining: DEVRAB_RATE_LIMIT_PER_HOUR - 1 };
    }

    if (record.count >= DEVRAB_RATE_LIMIT_PER_HOUR) {
        return { allowed: false, remaining: 0 };
    }

    record.count += 1;
    return { allowed: true, remaining: DEVRAB_RATE_LIMIT_PER_HOUR - record.count };
}

export function getDevRABDailyStatus(): { allowed: boolean; remaining: number } {
    const todayKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
    if (todayKey !== devrabDayKey) {
        devrabDayKey = todayKey;
        devrabDayCount = 0;
    }
    return {
        allowed: devrabDayCount < DEVRAB_DAILY_CAP,
        remaining: Math.max(0, DEVRAB_DAILY_CAP - devrabDayCount),
    };
}

/** Dipanggil HANYA setelah DevRAB beneran sukses dipanggil (bukan pas gagal). */
export function consumeDevRABDailyQuota(): void {
    devrabDayCount += 1;
}
