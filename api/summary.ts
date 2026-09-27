/**
 * /api/summary — SATU function yang menangani DUA hal, digabung sengaja
 * (bukan dipecah jadi 2 file kayak sebelumnya: api/share-summary.ts +
 * api/ringkasan/[id].ts) karena Vercel Hobby plan cuma boleh maks. 12
 * Serverless Functions per deployment, dan project ini sudah mepet/kepentok
 * limit itu. Kalau nanti masih nambah endpoint baru & mentok limit lagi,
 * opsinya cuma 2: gabungin lebih banyak function jadi satu file (kayak di
 * sini), atau upgrade ke plan Pro (limit-nya jauh lebih longgar).
 *
 * - POST  /api/summary        → simpan transkrip chat, balikin { id, url }
 * - GET   /api/summary?id=xxx → render halaman ringkasan (HTML) untuk Arzha
 *
 * Dipanggil oleh:
 *   - services/shareSummaryService.ts (POST, dari tombol "Chat via WhatsApp")
 *   - link yang di-generate di atas (GET, dibuka manual oleh Arzha di WhatsApp)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'crypto';
import { saveSummary, getSummary, StoredSummaryMessage } from './_lib/summaryStore';

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

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const EXPIRED_PAGE = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>Ringkasan Tidak Ditemukan</title>
</head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0f172a;color:#e2e8f0;font-family:system-ui,-apple-system,sans-serif;text-align:center;padding:24px;">
  <div>
    <h1 style="font-size:18px;margin-bottom:8px;">Link ringkasan ini sudah kedaluwarsa</h1>
    <p style="opacity:.65;font-size:13px;max-width:340px;margin:0 auto;">
      Ringkasan chat otomatis terhapus 7 hari setelah dibuat demi privasi, atau linknya memang tidak pernah ada.
    </p>
  </div>
</body>
</html>`;

// ── POST: buat ringkasan baru ────────────────────────────────────────────
async function handleCreate(req: VercelRequest, res: VercelResponse) {
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

  const id = randomUUID().replace(/-/g, '').slice(0, 10);

  await saveSummary(id, {
    botName: botName.trim().slice(0, MAX_BOTNAME_LENGTH),
    messages: cleanMessages,
    createdAt: new Date().toISOString(),
  });

  const host = req.headers.host;
  const origin = process.env.PUBLIC_SITE_URL || (host ? `https://${host}` : '');

  return res.status(201).json({ id, url: `${origin}/api/summary?id=${id}` });
}

// ── GET: render halaman ringkasan ────────────────────────────────────────
async function handleView(req: VercelRequest, res: VercelResponse) {
  const rawId = req.query.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.setHeader('Cache-Control', 'private, no-store');

  if (!id) {
    return res.status(400).send(EXPIRED_PAGE);
  }

  const summary = await getSummary(id).catch((err) => {
    console.error('[api/summary][GET] gagal ambil data:', err);
    return null;
  });

  if (!summary) {
    return res.status(410).send(EXPIRED_PAGE);
  }

  const bubblesHtml = summary.messages
    .map((m) => {
      const isUser = m.sender === 'user';
      const bubbleStyle = isUser
        ? 'background:#0d9488;color:#fff;border-bottom-right-radius:3px;'
        : 'background:#1e293b;color:#e2e8f0;border:1px solid #334155;border-bottom-left-radius:3px;';
      const label = isUser ? 'Calon Klien' : escapeHtml(summary.botName);
      return `
      <div style="display:flex;justify-content:${isUser ? 'flex-end' : 'flex-start'};margin:10px 0;">
        <div style="max-width:78%;padding:10px 14px;border-radius:16px;font-size:14px;line-height:1.55;white-space:pre-wrap;${bubbleStyle}">
          <div style="font-size:10px;opacity:.6;margin-bottom:4px;">${label} · ${escapeHtml(m.timestamp)}</div>
          ${escapeHtml(m.text).replace(/\n/g, '<br/>')}
        </div>
      </div>`;
    })
    .join('\n');

  const createdLabel = escapeHtml(
    new Date(summary.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
  );

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>Ringkasan Chat — ${escapeHtml(summary.botName)}</title>
</head>
<body style="margin:0;background:#0f172a;font-family:system-ui,-apple-system,sans-serif;padding:20px 16px 40px;">
  <div style="max-width:640px;margin:0 auto;">
    <h1 style="color:#5eead4;font-size:16px;margin:0 0 2px;">💬 Ringkasan Chat — ${escapeHtml(summary.botName)}</h1>
    <p style="color:#94a3b8;font-size:12px;margin:0 0 18px;">
      Dibuat: ${createdLabel} · Link privat untuk Arzha, kedaluwarsa otomatis 7 hari.
    </p>
    ${bubblesHtml}
  </div>
</body>
</html>`;

  return res.status(200).send(html);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'POST') return await handleCreate(req, res);
    if (req.method === 'GET') return await handleView(req, res);

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[api/summary] error:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
}
