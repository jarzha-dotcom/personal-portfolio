import { describe, it, expect } from 'vitest';
import {
    checkRateLimit,
    RATE_LIMIT_PER_MODEL,
    getAntigravityDailyStatus,
    consumeAntigravityDailyQuota,
    ANTIGRAVITY_DAILY_CAP,
    checkDevRABRateLimit,
    getDevRABDailyStatus,
    consumeDevRABDailyQuota,
    DEVRAB_RATE_LIMIT_PER_HOUR,
    DEVRAB_DAILY_CAP,
} from '../lib/rateLimiter';

describe('rateLimiter', () => {
    it('allows requests within limit and decrements remaining', () => {
        const ip = `test-ip-${Date.now()}`;
        const model = 'gemini-3.8-flash';

        const first = checkRateLimit(ip, model);
        expect(first.allowed).toBe(true);
        expect(first.remaining).toBe(RATE_LIMIT_PER_MODEL - 1);

        for (let i = 1; i < RATE_LIMIT_PER_MODEL; i++) {
            const res = checkRateLimit(ip, model);
            expect(res.allowed).toBe(true);
        }

        const exceeded = checkRateLimit(ip, model);
        expect(exceeded.allowed).toBe(false);
        expect(exceeded.remaining).toBe(0);
    });

    it('isolates rate limits by IP and model', () => {
        const ip1 = `ip1-${Date.now()}`;
        const ip2 = `ip2-${Date.now()}`;
        const model = 'gemini-3.5-flash';

        checkRateLimit(ip1, model);
        const res2 = checkRateLimit(ip2, model);
        expect(res2.allowed).toBe(true);
        expect(res2.remaining).toBe(RATE_LIMIT_PER_MODEL - 1);
    });

    it('tracks antigravity daily status and quota consumption', () => {
        const status = getAntigravityDailyStatus();
        expect(status.allowed).toBe(true);
        expect(status.remaining).toBeGreaterThan(0);
        expect(status.remaining).toBeLessThanOrEqual(ANTIGRAVITY_DAILY_CAP);

        consumeAntigravityDailyQuota();
        const afterStatus = getAntigravityDailyStatus();
        expect(afterStatus.remaining).toBe(status.remaining - 1);
    });

    it('tracks DevRAB rate limit per IP and daily quota consumption', () => {
        const ip = `devrab-ip-${Date.now()}`;
        const first = checkDevRABRateLimit(ip);
        expect(first.allowed).toBe(true);
        expect(first.remaining).toBe(DEVRAB_RATE_LIMIT_PER_HOUR - 1);

        for (let i = 1; i < DEVRAB_RATE_LIMIT_PER_HOUR; i++) {
            const res = checkDevRABRateLimit(ip);
            expect(res.allowed).toBe(true);
        }

        const exceeded = checkDevRABRateLimit(ip);
        expect(exceeded.allowed).toBe(false);
        expect(exceeded.remaining).toBe(0);

        const dailyStatus = getDevRABDailyStatus();
        expect(dailyStatus.allowed).toBe(true);
        expect(dailyStatus.remaining).toBeLessThanOrEqual(DEVRAB_DAILY_CAP);

        consumeDevRABDailyQuota();
        const afterDaily = getDevRABDailyStatus();
        expect(afterDaily.remaining).toBe(dailyStatus.remaining - 1);
    });
});
