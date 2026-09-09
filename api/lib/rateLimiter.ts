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
