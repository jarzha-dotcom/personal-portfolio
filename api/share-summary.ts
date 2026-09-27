/**
 * POST /api/share-summary
 * ────────────────────────────────────────────────────────────────────────
 * Dipanggil oleh services/shareSummaryService.ts, HANYA saat user menekan
 * tombol "Chat via WhatsApp" di ChatWidget.tsx (opt-in, bukan otomatis tiap
 * pesan — lihat Kebijakan Privasi §2 & §4a di index.html).
 *
 * Body: { botName: string; messages: { sender: 'user'|'bot'; text: string; timestamp: string }[] }
 * Response 201: { id: string; url: string }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'crypto';
import { saveSummary, StoredSummaryMessage } from './lib/summaryStore';

// Batas jaga-jaga: cegah payload raksasa/disalahgunakan buat nyimpen data
// gede-gede an di KV. Percakapan chat widget ini secara wajar gak akan
// sepanjang ini — kalau kepotong, itu tanda ada yang gak beres di pemanggil.
const MAX_MESSAGES = 60;
const MAX_TEXT_LENGTH = 4000;
const MAX_BOTNAME_LENGTH = 30;

function isValidIncomingMessage(m: unknown): m is StoredSummaryMessage {
  if (!m || typeof m !== 'object') return false;
  const msg = m as Record<string, unknown>;
  return (
    (msg.sender === 'user' || msg.sender === 'bot') &&
    typeof msg.text === 'string' &&
    msg.text.trim().length > 0 &&
    typeof msg.timestamp === 'string'
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body ?? {};
    const { botName, messages } = body as { botName?: unknown; messages?: unknown };

    if (typeof botName !== 'string' || botName.trim().length === 0) {
      return res.status(400).json({ error: 'botName wajib diisi' });
    }
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages wajib berupa array yang tidak kosong' });
    }

    const cleanMessages: StoredSummaryMessage[] = messages
      .slice(-MAX_MESSAGES)
      .filter(isValidIncomingMessage)
      .map((m) => ({
        sender: m.sender,
        text: m.text.slice(0, MAX_TEXT_LENGTH),
        timestamp: m.timestamp.slice(0, 20),
      }));

    if (cleanMessages.length === 0) {
      return res.status(400).json({ error: 'Tidak ada pesan valid untuk disimpan' });
    }

    // 10 karakter hex dari UUID cukup unik untuk link berumur pendek (7 hari)
    // & tidak dimaksudkan untuk ditebak-tebak — ini bukan ID publik permanen.
    const id = randomUUID().replace(/-/g, '').slice(0, 10);

    await saveSummary(id, {
      botName: botName.trim().slice(0, MAX_BOTNAME_LENGTH),
      messages: cleanMessages,
      createdAt: new Date().toISOString(),
    });

    const host = req.headers.host;
    const origin = process.env.PUBLIC_SITE_URL || (host ? `https://${host}` : '');

    return res.status(201).json({ id, url: `${origin}/api/ringkasan/${id}` });
  } catch (err) {
    console.error('[api/share-summary] error:', err);
    return res.status(500).json({ error: 'Gagal menyimpan ringkasan' });
  }
}
