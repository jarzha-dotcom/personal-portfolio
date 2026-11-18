/**
 * api/wa-inbox.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * API Inbox Manual WhatsApp — ber-PIN, hanya untuk Mas Arzha.
 *
 * Rute:
 *   GET  /api/wa-inbox                → List thread terbaru (ber-PIN)
 *   GET  /api/wa-inbox?phone=628...   → Transkrip 1 thread (ber-PIN)
 *   POST /api/wa-inbox                → Kirim balas manual via Graph API (ber-PIN)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHash, timingSafeEqual } from 'node:crypto';
import {
    listInboxContacts,
    markInboxRead,
    getWaFullTranscript,
    normalizeWaPhone,
    appendWaHistory,
    pausePhoneForHumanTakeover,
    clearPhonePause,
    isPhonePaused,
} from './_lib/whatsappState.js';
import {
    sendWhatsAppTextReply,
    getWaGraphCredentials,
    getBotWaPhone,
} from './_lib/whatsappGraph.js';

export const config = { api: { bodyParser: true } };
export const maxDuration = 20;

// ── Auth PIN ─────────────────────────────────────────────────────────────────

function safeSecretEqual(a: string, b: string): boolean {
    if (!a || !b) return false;
    const h = (s: string) => createHash('sha256').update(s).digest();
    return timingSafeEqual(h(a), h(b));
}

function verifyPin(req: VercelRequest, res: VercelResponse): boolean {
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

// ── Handler Utama ─────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
    res.setHeader('Access-Control-Allow-Origin', process.env.VITE_APP_URL || 'https://arzhaning.my.id');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'x-tts-usage-pin, content-type');
    if (req.method === 'OPTIONS') { res.status(204).end(); return; }

    if (!verifyPin(req, res)) return;

    // ── GET: list semua thread ATAU transkrip 1 nomor ─────────────────────────
    if (req.method === 'GET') {
        const phone = typeof req.query.phone === 'string' ? req.query.phone : '';

        if (phone) {
            // Ambil transkrip percakapan 1 nomor + status jeda bot
            const norm = normalizeWaPhone(phone);
            if (!norm) { res.status(400).json({ error: 'Nomor tidak valid.' }); return; }
            await markInboxRead(norm);
            const [turns, paused] = await Promise.all([
                getWaFullTranscript(norm),
                isPhonePaused(norm),
            ]);
            res.status(200).json({ phone: norm, paused, turns });
            return;
        }

        // List semua thread
        const contacts = await listInboxContacts();
        res.status(200).json({ contacts });
        return;
    }

    // ── POST: kirim balasan manual ATAU kontrol bot per nomor ─────────────────
    if (req.method === 'POST') {
        const body = (req.body || {}) as {
            action?: 'reply' | 'pause' | 'resume';
            phone?: string;
            message?: string;
        };
        const action = body.action || 'reply';
        const phone = body.phone || '';

        const norm = normalizeWaPhone(phone);
        if (!norm) { res.status(400).json({ error: 'Nomor tidak valid.' }); return; }

        if (action === 'pause') {
            await pausePhoneForHumanTakeover(norm);
            res.status(200).json({ ok: true, paused: true });
            return;
        }

        if (action === 'resume') {
            await clearPhonePause(norm);
            res.status(200).json({ ok: true, paused: false });
            return;
        }

        // Action: reply
        const message = body.message?.trim() || '';
        if (!message) {
            res.status(400).json({ error: 'Pesan balasan tidak boleh kosong.' });
            return;
        }

        const creds = getWaGraphCredentials();
        if (!creds.accessToken || !creds.phoneNumberId) {
            res.status(503).json({ error: 'Kredensial Meta Graph API belum dikonfigurasi.' });
            return;
        }

        const botPhone = getBotWaPhone();
        const result = await sendWhatsAppTextReply({
            phoneNumberId: creds.phoneNumberId,
            accessToken: creds.accessToken,
            to: norm,
            body: message,
            senderBotPhone: botPhone,
        });

        if (result.ok) {
            // Simpan ke riwayat sebagai model/asisten (ditandai Mas Arzha)
            await appendWaHistory(norm, '', `[Mas Arzha]: ${message}`);
            // Jeda bot selama 2 jam agar Mas Arzha leluasa ngobrol manual tanpa diselak bot
            await pausePhoneForHumanTakeover(norm, 2 * 60 * 60);
            await markInboxRead(norm);
            res.status(200).json({ ok: true, messageId: result.messageId, paused: true });
        } else {
            res.status(502).json({ ok: false, error: result.errorMessage });
        }
        return;
    }

    res.status(405).json({ error: 'Method not allowed.' });
}
