/**
 * GET /api/ringkasan/:id
 * ────────────────────────────────────────────────────────────────────────
 * Halaman privat (bukan file .html yang didownload, tapi halaman yang
 * di-render langsung) berisi transkrip chat yang dikirim lewat tombol
 * "Chat via WhatsApp". Link ke halaman ini yang otomatis ikut ke-embed di
 * teks WhatsApp (lihat api/share-summary.ts & services/shareSummaryService.ts).
 *
 * Sengaja noindex + no-store: ini berisi data pribadi calon klien, jangan
 * sampai ke-index Google atau ke-cache CDN publik (lihat Kebijakan Privasi
 * §4a & §7 di index.html).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSummary } from '../lib/summaryStore';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const rawId = req.query.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.setHeader('Cache-Control', 'private, no-store');

  if (!id) {
    return res.status(400).send(EXPIRED_PAGE);
  }

  const summary = await getSummary(id).catch((err) => {
    console.error('[api/ringkasan] gagal ambil data:', err);
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
