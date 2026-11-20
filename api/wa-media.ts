/**
 * api/wa-media.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Proxy ber-PIN: men-stream lampiran WhatsApp yang diarsipkan di Google Drive
 * ke Inbox admin. File klien TIDAK dibuat publik; hanya endpoint ini yang bisa
 * membukanya, dan hanya untuk pemegang PIN.
 *
 * Rute:
 *   GET /api/wa-media?id=<driveFileId>               → inline (gambar/PDF/audio/video)
 *   GET /api/wa-media?id=<driveFileId>&download=1    → paksa unduh
 *
 * Header: `x-tts-usage-pin` (sama dengan wa-inbox). Mendukung `Range`
 * (video/audio bisa di-seek) dan di-stream agar tidak terkena batas 4,5 MB
 * respons non-streaming milik Vercel Function.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Readable } from 'node:stream';
import type { ReadableStream as NodeWebStream } from 'node:stream/web';
import { verifyWaAdminPin } from './_lib/waAuth.js';
import { GoogleDriveError, fetchDriveFileContent, getDriveFileMetadata } from './_lib/googleDrive.js';
import { sanitizeDriveFileName, waMediaKindFromMime } from './_lib/whatsappMedia.js';

export const config = { api: { bodyParser: false } };

// ── Util ─────────────────────────────────────────────────────────────────────

/** Hanya satu rentang sederhana: `bytes=0-99`, `bytes=100-`, `bytes=-500`. */
const RANGE_RE = /^bytes=(\d*)-(\d*)$/;

function parseRange(raw: string | string[] | undefined): { header?: string; invalid: boolean } {
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (!value) return { invalid: false };
    const m = RANGE_RE.exec(value.trim());
    if (!m || (m[1] === '' && m[2] === '')) return { invalid: true };
    return { header: value.trim(), invalid: false };
}

/** Jenis yang aman ditampilkan langsung di browser admin. */
function isInlineSafe(mimeType: string): boolean {
    const base = mimeType.split(';')[0].trim().toLowerCase();
    if (base === 'application/pdf') return true;
    const kind = waMediaKindFromMime(base);
    return kind === 'image' || kind === 'video' || kind === 'audio';
}

function buildContentDisposition(disposition: 'inline' | 'attachment', fileName: string): string {
    const safe = sanitizeDriveFileName(fileName, 'berkas');
    const ascii = safe.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '_');
    return `${disposition}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(safe)}`;
}

function sendError(res: VercelResponse, err: unknown): void {
    if (err instanceof GoogleDriveError) {
        if (err.code === 'invalid_file_id') {
            res.status(400).json({ error: 'ID file tidak valid.' });
        } else if (err.status === 404) {
            res.status(404).json({ error: 'File tidak ditemukan di Drive.' });
        } else if (err.code === 'not_configured') {
            res.status(503).json({ error: 'Google Drive belum dikonfigurasi.' });
        } else if (err.code === 'invalid_grant') {
            res.status(502).json({ error: 'Akses Google Drive kedaluwarsa. Jalankan ulang `npm run google:auth`.' });
        } else if (err.status === 504) {
            res.status(504).json({ error: 'Google Drive timeout.' });
        } else {
            res.status(502).json({ error: 'Gagal membaca file dari Google Drive.' });
        }
        return;
    }
    console.error('[wa-media] Galat tak terduga:', err);
    res.status(500).json({ error: 'Terjadi kesalahan internal.' });
}

// ── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
    res.setHeader('Access-Control-Allow-Origin', process.env.VITE_APP_URL || 'https://arzhaning.my.id');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'x-tts-usage-pin, range');
    res.setHeader('Access-Control-Expose-Headers', 'content-range, accept-ranges, content-length, content-disposition');
    if (req.method === 'OPTIONS') { res.status(204).end(); return; }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.status(405).json({ error: 'Method not allowed.' });
        return;
    }

    if (!verifyWaAdminPin(req, res)) return;

    const id = typeof req.query.id === 'string' ? req.query.id.trim() : '';
    if (!id) { res.status(400).json({ error: 'Parameter id wajib diisi.' }); return; }

    const range = parseRange(req.headers.range);
    if (range.invalid) {
        res.status(416).setHeader('Content-Range', '*/0').json({ error: 'Rentang tidak valid.' });
        return;
    }

    try {
        const meta = await getDriveFileMetadata(id);

        // Validasi ulang MIME dari metadata Drive (pertahanan berlapis; whitelist juga dipakai saat arsip).
        const mimeBase = meta.mimeType.split(';')[0].trim().toLowerCase();
        if (!waMediaKindFromMime(mimeBase)) {
            res.status(415).json({ error: 'Tipe file tidak didukung untuk ditampilkan.' });
            return;
        }

        const forceDownload = req.query.download === '1' || !isInlineSafe(mimeBase);

        res.setHeader('Content-Type', mimeBase);
        res.setHeader('Content-Disposition', buildContentDisposition(forceDownload ? 'attachment' : 'inline', meta.fileName));
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
        res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
        res.setHeader('Cache-Control', 'private, max-age=300');
        res.setHeader('Accept-Ranges', 'bytes');

        if (req.method === 'HEAD') {
            if (meta.sizeBytes !== undefined) res.setHeader('Content-Length', String(meta.sizeBytes));
            res.status(200).end();
            return;
        }

        const upstream = await fetchDriveFileContent(id, range.header);

        // Drive menjawab 416 sebagai error biasa → sudah dilempar fetchDriveFileContent.
        const status = upstream.status === 206 ? 206 : 200;
        const contentLength = upstream.headers.get('content-length');
        const contentRange = upstream.headers.get('content-range');
        if (contentLength) res.setHeader('Content-Length', contentLength);
        if (status === 206 && contentRange) res.setHeader('Content-Range', contentRange);
        res.status(status);

        if (!upstream.body) { res.end(); return; }

        const nodeStream = Readable.fromWeb(upstream.body as unknown as NodeWebStream);
        // Klien menutup koneksi (mis. pindah thread/seek video) → hentikan unduhan dari Drive.
        res.on('close', () => { if (!nodeStream.destroyed) nodeStream.destroy(); });
        nodeStream.on('error', (e) => {
            console.warn('[wa-media] Stream terputus:', e);
            if (!res.writableEnded) res.destroy(e);
        });
        nodeStream.pipe(res);
    } catch (err) {
        if (res.headersSent) { res.destroy(); return; }
        // Header file yang sudah dipasang tidak boleh bocor ke respons galat.
        for (const h of ['Content-Disposition', 'Content-Length', 'Content-Range', 'Cache-Control']) res.removeHeader(h);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        sendError(res, err);
    }
}
