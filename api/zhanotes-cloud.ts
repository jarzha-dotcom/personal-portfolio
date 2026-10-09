// api/zhanotes-cloud.ts
//
// Cadangan awan untuk ZhaNotes (satu pemilik per deployment).
//
// Pembagian tugas:
//   - Vercel Blob  : potongan (chunk) cadangan yang SUDAH TERENKRIPSI di peramban.
//   - Upstash Redis: daftar cadangan (metadata + URL potongan), maksimal ZHANOTES_KEEP terakhir.
//   - Fungsi ini   : pintu masuk + autentikasi token. Server tidak pernah melihat isi catatan
//                    maupun kata sandi enkripsi (enkripsi AES-GCM dilakukan di peramban).
//
// Kenapa dipotong? Fungsi serverless Vercel membatasi body request ~4,5 MB, sedangkan ZIP
// cadangan (PDF, audio) bisa jauh lebih besar. Klien memotong jadi bagian ~3 MB.
//
// Variabel lingkungan (Vercel → Settings → Environment Variables):
//   ZHANOTES_TOKEN          wajib. Rahasia pemilik; dikirim klien lewat header x-zhanotes-token.
//   BLOB_READ_WRITE_TOKEN   wajib. Dibuat otomatis saat Vercel Blob dihubungkan ke proyek.
//   UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN   wajib (atau KV_REST_API_URL / KV_REST_API_TOKEN
//                           kalau Redis dipasang lewat integrasi Vercel Marketplace).
//   ZHANOTES_KEEP           opsional, jumlah cadangan terakhir yang disimpan (default 3).
//   ZHANOTES_MAX_MB         opsional, batas ukuran satu cadangan (default 200).
//   ZHANOTES_PREFIX         opsional, awalan kunci Redis & folder Blob (default "zhanotes").
//
// Endpoint (semua lewat /api/zhanotes-cloud?action=...):
//   GET    status   (tanpa token)  -> { configured, maxMb, keep }
//   GET    list                    -> { backups: [{ id, createdAt, size, notes, chunks[] }] }
//   POST   chunk&id=&i=            body: byte mentah (octet-stream, <= 4 MB) -> { url }
//   POST   commit                  body JSON { id, chunks[], size, notes }   -> { ok, kept }
//   POST   abort                   body JSON { id, chunks[] }                -> { ok }
//   POST   delete                  body JSON { id }                          -> { ok }

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHash, timingSafeEqual } from 'node:crypto';
import { del, put } from '@vercel/blob';

export const maxDuration = 30;

const PREFIX = (process.env.ZHANOTES_PREFIX || 'zhanotes').replace(/[^a-z0-9_-]/gi, '') || 'zhanotes';
const KEY = `${PREFIX}:backups`;
const KEEP = Math.min(20, Math.max(1, Number(process.env.ZHANOTES_KEEP) || 3));
const MAX_MB = Math.min(1000, Math.max(5, Number(process.env.ZHANOTES_MAX_MB) || 200));
const MAX_CHUNK_BYTES = 4 * 1024 * 1024;
const MAX_CHUNKS = Math.ceil((MAX_MB * 1024 * 1024) / (3 * 1024 * 1024)) + 2;
const ID_RE = /^[a-z0-9-]{8,64}$/;

interface BackupMeta {
    id: string;
    createdAt: number;
    size: number;
    notes: number;
    chunks: string[];
}

const redisUrl = () => process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '';
const redisToken = () => process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '';
const isConfigured = () =>
    Boolean(process.env.ZHANOTES_TOKEN && process.env.BLOB_READ_WRITE_TOKEN && redisUrl() && redisToken());

async function redis(commands: (string | number)[][]): Promise<unknown[]> {
    const r = await fetch(`${redisUrl().replace(/\/+$/, '')}/pipeline`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${redisToken()}`, 'content-type': 'application/json' },
        body: JSON.stringify(commands),
    });
    if (!r.ok) throw new Error(`Redis HTTP ${r.status}`);
    const out = (await r.json()) as { result?: unknown; error?: string }[];
    return out.map((o) => {
        if (o.error) throw new Error(`Redis: ${o.error}`);
        return o.result;
    });
}

const parseMeta = (raw: unknown): BackupMeta | null => {
    try {
        const m = JSON.parse(String(raw)) as BackupMeta;
        return m && ID_RE.test(m.id) && Array.isArray(m.chunks) ? m : null;
    } catch {
        return null;
    }
};

async function readAll(): Promise<{ raw: string; meta: BackupMeta }[]> {
    const [rows] = (await redis([['LRANGE', KEY, 0, -1]])) as [unknown[]];
    const out: { raw: string; meta: BackupMeta }[] = [];
    for (const raw of rows || []) {
        const meta = parseMeta(raw);
        if (meta) out.push({ raw: String(raw), meta });
    }
    return out;
}

// Hanya URL Blob milik cadangan ini yang boleh disimpan/dihapus.
const isOwnChunkUrl = (u: unknown, id: string): u is string => {
    if (typeof u !== 'string') return false;
    try {
        const p = new URL(u);
        return p.protocol === 'https:' && p.hostname.endsWith('.blob.vercel-storage.com') && p.pathname.startsWith(`/${PREFIX}/${id}/`);
    } catch {
        return false;
    }
};

async function readBody(req: VercelRequest): Promise<Buffer> {
    if (Buffer.isBuffer(req.body)) return req.body;
    const parts: Buffer[] = [];
    let total = 0;
    for await (const c of req as unknown as AsyncIterable<Buffer>) {
        total += c.length;
        if (total > MAX_CHUNK_BYTES) throw new Error('TOO_LARGE');
        parts.push(c);
    }
    return Buffer.concat(parts);
}

const jsonBody = (req: VercelRequest): Record<string, unknown> => {
    let b: unknown = req.body;
    if (Buffer.isBuffer(b)) b = b.toString('utf8');
    if (typeof b === 'string') {
        try {
            b = JSON.parse(b);
        } catch {
            b = {};
        }
    }
    return b && typeof b === 'object' ? (b as Record<string, unknown>) : {};
};

// Percobaan token salah per IP (in-memory, pengaman kasar -- sama seperti PIN di chat.ts).
const failures = new Map<string, number[]>();

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        res.setHeader('Cache-Control', 'no-store');
        const action = String(req.query?.action || '');

        if (req.method === 'GET' && action === 'status') {
            return res.status(200).json({ configured: isConfigured(), maxMb: MAX_MB, keep: KEEP });
        }

        if (!isConfigured()) return res.status(503).json({ error: 'NOT_CONFIGURED', detail: 'Cadangan awan belum dikonfigurasi di server ini.' });

        // ── Autentikasi ────────────────────────────────────────────────────────
        const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 'unknown';
        const now = Date.now();
        const fails = (failures.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
        if (fails.length >= 5) return res.status(429).json({ error: 'TOO_MANY_ATTEMPTS', detail: 'Terlalu banyak percobaan token. Coba lagi beberapa menit lagi.' });

        const given = String(req.headers['x-zhanotes-token'] || '');
        const a = createHash('sha256').update(given).digest();
        const b = createHash('sha256').update(String(process.env.ZHANOTES_TOKEN)).digest();
        if (!given || !timingSafeEqual(a, b)) {
            fails.push(now);
            failures.set(ip, fails);
            return res.status(401).json({ error: 'INVALID_TOKEN', detail: 'Token akses salah.' });
        }
        failures.delete(ip);

        // ── GET list ───────────────────────────────────────────────────────────
        if (req.method === 'GET' && action === 'list') {
            const all = await readAll();
            return res.status(200).json({ backups: all.map((x) => x.meta) });
        }

        if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

        // ── POST chunk ─────────────────────────────────────────────────────────
        if (action === 'chunk') {
            const id = String(req.query?.id || '');
            const i = Number(req.query?.i);
            if (!ID_RE.test(id) || !Number.isInteger(i) || i < 0 || i >= MAX_CHUNKS) return res.status(400).json({ error: 'BAD_REQUEST' });
            let data: Buffer;
            try {
                data = await readBody(req);
            } catch {
                return res.status(413).json({ error: 'TOO_LARGE', detail: 'Potongan cadangan terlalu besar.' });
            }
            if (data.length === 0 || data.length > MAX_CHUNK_BYTES) return res.status(413).json({ error: 'TOO_LARGE', detail: 'Ukuran potongan tidak valid.' });
            const blob = await put(`${PREFIX}/${id}/${String(i).padStart(4, '0')}.bin`, data, {
                access: 'public',
                contentType: 'application/octet-stream',
                addRandomSuffix: true, // URL tidak bisa ditebak; isinya pun sudah terenkripsi
            });
            return res.status(200).json({ url: blob.url });
        }

        const body = jsonBody(req);

        // ── POST commit ────────────────────────────────────────────────────────
        if (action === 'commit') {
            const id = String(body.id || '');
            const chunks = body.chunks;
            const size = Number(body.size);
            if (!ID_RE.test(id) || !Array.isArray(chunks) || chunks.length === 0 || chunks.length > MAX_CHUNKS || !chunks.every((u) => isOwnChunkUrl(u, id))) {
                return res.status(400).json({ error: 'BAD_REQUEST', detail: 'Data commit tidak valid.' });
            }
            if (!Number.isFinite(size) || size <= 0 || size > MAX_MB * 1024 * 1024) {
                return res.status(413).json({ error: 'TOO_LARGE', detail: `Cadangan melebihi batas ${MAX_MB} MB.` });
            }
            const meta: BackupMeta = {
                id,
                createdAt: Date.now(),
                size,
                notes: Math.max(0, Math.floor(Number(body.notes) || 0)),
                chunks: chunks as string[],
            };
            await redis([['LPUSH', KEY, JSON.stringify(meta)]]);

            // Buang cadangan yang melewati batas KEEP (blob dulu, baru daftar).
            const all = await readAll();
            const old = all.slice(KEEP);
            for (const o of old) {
                await del(o.meta.chunks).catch(() => undefined);
                await redis([['LREM', KEY, 1, o.raw]]);
            }
            return res.status(200).json({ ok: true, kept: Math.min(all.length, KEEP) });
        }

        // ── POST abort : bersihkan potongan dari unggahan yang gagal ───────────
        if (action === 'abort') {
            const id = String(body.id || '');
            const chunks = Array.isArray(body.chunks) ? body.chunks.filter((u) => isOwnChunkUrl(u, id)) : [];
            if (ID_RE.test(id) && chunks.length) await del(chunks as string[]).catch(() => undefined);
            return res.status(200).json({ ok: true });
        }

        // ── POST delete ────────────────────────────────────────────────────────
        if (action === 'delete') {
            const id = String(body.id || '');
            if (!ID_RE.test(id)) return res.status(400).json({ error: 'BAD_REQUEST' });
            const target = (await readAll()).find((x) => x.meta.id === id);
            if (!target) return res.status(404).json({ error: 'NOT_FOUND' });
            await del(target.meta.chunks).catch(() => undefined);
            await redis([['LREM', KEY, 1, target.raw]]);
            return res.status(200).json({ ok: true });
        }

        return res.status(400).json({ error: 'UNKNOWN_ACTION' });
    } catch (err: any) {
        console.error('[zhanotes-cloud] error:', err);
        return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', detail: err?.message || String(err) });
    }
}
