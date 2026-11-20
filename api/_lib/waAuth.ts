/**
 * api/_lib/waAuth.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Autentikasi PIN bersama untuk endpoint admin WhatsApp (`wa-inbox`, `wa-media`).
 * Sebelumnya `verifyPin` disalin di dua file; Fase 5 mengekstraknya ke sini.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHash, timingSafeEqual } from 'node:crypto';

export function safeSecretEqual(a: string, b: string): boolean {
    if (!a || !b) return false;
    const h = (s: string) => createHash('sha256').update(s).digest();
    return timingSafeEqual(h(a), h(b));
}

/**
 * Memeriksa header `x-tts-usage-pin`. Mengembalikan `true` bila valid; bila tidak,
 * respons galat (503 belum dikonfigurasi / 401 PIN salah) sudah dikirim.
 */
export function verifyWaAdminPin(req: VercelRequest, res: VercelResponse): boolean {
    const expected = (process.env.TTS_USAGE_PIN || '').trim();
    if (!expected) {
        res.status(503).json({ error: 'TTS_USAGE_PIN belum dikonfigurasi.' });
        return false;
    }
    const headerRaw = req.headers['x-tts-usage-pin'];
    const provided = (Array.isArray(headerRaw) ? headerRaw[0] : headerRaw || '').trim();
    if (!safeSecretEqual(provided, expected)) {
        res.status(401).json({ error: 'PIN tidak valid.' });
        return false;
    }
    return true;
}
