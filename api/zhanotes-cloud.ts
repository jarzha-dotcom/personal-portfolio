// api/zhanotes-cloud.ts
//
// Sinkron otomatis ZhaNotes antar perangkat (satu pemilik per deployment).
//
// Pembagian tugas:
//   - Vercel Blob  : isi catatan / PDF / rekaman yang SUDAH TERENKRIPSI di peramban, dipotong
//                    jadi bagian <= 3 MB (batas body fungsi serverless Vercel ~4,5 MB).
//   - Upstash Redis: indeks dokumen { kunci -> rev, daftar potongan, ukuran, penanda hapus }.
//   - Fungsi ini   : pintu masuk + autentikasi token + pengendali konflik (compare-and-set
//                    pada nomor revisi). Server TIDAK PERNAH melihat isi catatan maupun
//                    kata sandi enkripsi (AES-GCM dilakukan di peramban).
//
// Variabel lingkungan (Vercel -> Settings -> Environment Variables):
//   ZHANOTES_TOKEN          wajib. Rahasia pemilik; dikirim klien lewat header x-zhanotes-token.
//   BLOB_READ_WRITE_TOKEN   wajib. Dibuat otomatis saat Vercel Blob dihubungkan ke proyek.
//   UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN   wajib (atau KV_REST_API_URL / KV_REST_API_TOKEN
//                           kalau Redis dipasang lewat integrasi Vercel Marketplace).
//   ZHANOTES_MAX_MB         opsional, batas ukuran satu dokumen (default 200).
//   ZHANOTES_PREFIX         opsional, awalan kunci Redis & folder Blob (default "zhanotes").
//   ZHANOTES_BLOB_HOST      opsional tapi disarankan. Hostname Blob store milikmu, mis.
//                           "abc123.public.blob.vercel-storage.com" (lihat URL salah satu blob di dashboard).
//                           Bila diisi, proxy sync-read HANYA mau mengambil dari host itu.
//
// Endpoint (semua lewat /api/zhanotes-cloud?action=...):
//   GET  status                 (tanpa token) -> { configured, maxMb }
//   GET  sync-config            -> { config: { salt, check } | null }
//   POST sync-config            body { salt, check }  -> { ok }  (hanya bila belum ada; 409 bila sudah ada)
//   GET  sync-index             -> { docs: { [kunci]: { rev, chunks[], size, deleted, updatedAt } } }
//   POST chunk&id=&i=           body byte mentah (<= 4 MB) -> { url }
//   POST sync-push              body { key, baseRev, uid, chunks[], size, deleted? } -> { ok, rev } | 409 { head }
//   POST abort                  body { id, chunks[] }  -> { ok }   (bersihkan unggahan yang gagal)
//   GET  sync-read&u=<url>      -> byte mentah potongan (cadangan bila unduhan langsung diblokir CORS)
//   POST sync-reset             -> { ok }  (hapus SEMUA data sinkron + konfigurasi enkripsi)

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHash, timingSafeEqual } from 'node:crypto';
import { del, list, put } from '@vercel/blob';

export const maxDuration = 30;

const PREFIX = (process.env.ZHANOTES_PREFIX || 'zhanotes').replace(/[^a-z0-9_-]/gi, '') || 'zhanotes';
const DOCS = `${PREFIX}:sync:docs`;
const CFG = `${PREFIX}:sync:config`;
const MAX_MB = Math.min(1000, Math.max(5, Number(process.env.ZHANOTES_MAX_MB) || 200));
const MAX_CHUNK_BYTES = 4 * 1024 * 1024;
const BLOB_HOST = (process.env.ZHANOTES_BLOB_HOST || '').trim().toLowerCase();
const FAIL_LIMIT = 5;
const FAIL_WINDOW_S = 10 * 60;
const MAX_CHUNKS = Math.ceil((MAX_MB * 1024 * 1024) / (3 * 1024 * 1024)) + 2;
const ID_RE = /^[a-z0-9-]{8,64}$/;
const KEY_RE = /^(meta|(n|pdf|rec):[A-Za-z0-9_-]{1,40})$/;

interface Doc {
    rev: number;
    chunks: string[];
    size: number;
    deleted: boolean;
    updatedAt: number;
}

// Compare-and-set atomik: tulis hanya bila rev saat ini == baseRev.
const CAS_LUA = `
local cur = redis.call('HGET', KEYS[1], ARGV[1])
local rev = 0
if cur then rev = cjson.decode(cur).rev end
if rev ~= tonumber(ARGV[2]) then return {0, cur or ''} end
redis.call('HSET', KEYS[1], ARGV[1], ARGV[3])
return {1, cur or ''}
`;

const redisUrl = () => process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '';
const redisToken = () => process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '';
// Token pendek = mudah ditebak; batas percobaan hanya memperlambat, kekuatan token yang melindungi.
let weakWarned = false;
const warnWeakToken = () => {
    if (weakWarned) return;
    weakWarned = true;
    if (String(process.env.ZHANOTES_TOKEN || '').length < 32) {
        console.warn('[zhanotes-cloud] ZHANOTES_TOKEN kurang dari 32 karakter. Ganti dengan string acak panjang (mis. `openssl rand -base64 32`).');
    }
};
const isConfigured = () =>
    Boolean(process.env.ZHANOTES_TOKEN && process.env.BLOB_READ_WRITE_TOKEN && redisUrl() && redisToken());
// Hanya NAMA variabel yang belum terisi (tidak pernah nilainya) — membantu diagnosis saat sinkron "belum aktif".
const missingEnv = (): string[] => {
    const m: string[] = [];
    if (!process.env.ZHANOTES_TOKEN) m.push('ZHANOTES_TOKEN');
    if (!process.env.BLOB_READ_WRITE_TOKEN) m.push('BLOB_READ_WRITE_TOKEN');
    if (!redisUrl()) m.push('UPSTASH_REDIS_REST_URL (atau KV_REST_API_URL)');
    if (!redisToken()) m.push('UPSTASH_REDIS_REST_TOKEN (atau KV_REST_API_TOKEN)');
    return m;
};

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

const parseDoc = (raw: unknown): Doc | null => {
    try {
        const d = JSON.parse(String(raw)) as Doc;
        return d && Number.isInteger(d.rev) && Array.isArray(d.chunks) ? d : null;
    } catch {
        return null;
    }
};

async function readDocs(): Promise<Record<string, Doc>> {
    const [flat] = (await redis([['HGETALL', DOCS]])) as [unknown];
    const out: Record<string, Doc> = {};
    if (Array.isArray(flat)) {
        for (let i = 0; i + 1 < flat.length; i += 2) {
            const d = parseDoc(flat[i + 1]);
            if (d) out[String(flat[i])] = d;
        }
    } else if (flat && typeof flat === 'object') {
        for (const [k, v] of Object.entries(flat as Record<string, unknown>)) {
            const d = parseDoc(v);
            if (d) out[k] = d;
        }
    }
    return out;
}

const blobUrlOk = (u: unknown): u is string => {
    if (typeof u !== 'string') return false;
    try {
        const p = new URL(u);
        if (p.protocol !== 'https:' || p.username || p.password || p.port) return false;
        const hostOk = BLOB_HOST ? p.hostname === BLOB_HOST : p.hostname.endsWith('.blob.vercel-storage.com');
        return hostOk && p.pathname.startsWith(`/${PREFIX}/`);
    } catch {
        return false;
    }
};

// Hanya URL Blob milik unggahan ini yang boleh disimpan/dihapus.
const isOwnChunkUrl = (u: unknown, id: string): u is string =>
    blobUrlOk(u) && new URL(u as string).pathname.startsWith(`/${PREFIX}/${id}/`);

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

// Percobaan token salah per IP. Lapisan 1: in-memory (cepat, per instance). Lapisan 2: Redis (dibagi antar
// instance serverless, jadi penyerang tidak bisa menghindar dengan memicu instance baru).
const failures = new Map<string, number[]>();
const pruneFailures = (now: number) => {
    if (failures.size < 500) return;
    for (const [k, v] of failures) if (!v.some((t) => now - t < FAIL_WINDOW_S * 1000)) failures.delete(k);
};
async function redisFailCount(ip: string): Promise<number> {
    try {
        const k = `${PREFIX}:auth:fail:${createHash('sha256').update(ip).digest('hex').slice(0, 16)}`;
        const [n] = await redis([['INCR', k], ['EXPIRE', k, FAIL_WINDOW_S]]);
        return Number(n) || 0;
    } catch {
        return 0; // Redis gangguan: andalkan lapisan in-memory
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    let authed = false;
    try {
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        const action = String(req.query?.action || '');
        // Log server: setiap respons gagal (kecuali 409 bentrok revisi, yang normal) tercatat di log Vercel.
        // Hanya aksi, status, dan metode; tidak pernah token, isi, atau kunci.
        const origStatus = res.status.bind(res);
        res.status = ((code: number) => {
            if (code >= 400 && code !== 409) console.warn(`[zhanotes-cloud] action=${action.slice(0, 24)} method=${req.method} status=${code}`);
            return origStatus(code);
        }) as typeof res.status;

        if (req.method === 'GET' && action === 'status') {
            return res.status(200).json({ configured: isConfigured(), maxMb: MAX_MB, missing: isConfigured() ? [] : missingEnv() });
        }

        warnWeakToken();
        if (!isConfigured()) return res.status(503).json({ error: 'NOT_CONFIGURED', detail: 'Sinkron awan belum dikonfigurasi di server ini.' });

        // ── Autentikasi ────────────────────────────────────────────────────────
        const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 'unknown';
        const now = Date.now();
        pruneFailures(now);
        const fails = (failures.get(ip) || []).filter((t) => now - t < FAIL_WINDOW_S * 1000);
        if (fails.length >= FAIL_LIMIT) {
            res.setHeader('Retry-After', String(FAIL_WINDOW_S));
            return res.status(429).json({ error: 'TOO_MANY_ATTEMPTS', detail: 'Terlalu banyak percobaan token. Coba lagi beberapa menit lagi.' });
        }

        const given = String(req.headers['x-zhanotes-token'] || '');
        const a = createHash('sha256').update(given).digest();
        const b = createHash('sha256').update(String(process.env.ZHANOTES_TOKEN)).digest();
        if (!given || !timingSafeEqual(a, b)) {
            fails.push(now);
            failures.set(ip, fails);
            const shared = await redisFailCount(ip);
            if (shared > FAIL_LIMIT) {
                res.setHeader('Retry-After', String(FAIL_WINDOW_S));
                return res.status(429).json({ error: 'TOO_MANY_ATTEMPTS', detail: 'Terlalu banyak percobaan token. Coba lagi beberapa menit lagi.' });
            }
            return res.status(401).json({ error: 'INVALID_TOKEN', detail: 'Token akses salah.' });
        }
        failures.delete(ip);
        authed = true;

        // ── GET sync-config ────────────────────────────────────────────────────
        if (req.method === 'GET' && action === 'sync-config') {
            const [raw] = await redis([['GET', CFG]]);
            let config: unknown = null;
            try {
                config = raw ? JSON.parse(String(raw)) : null;
            } catch {
                config = null;
            }
            return res.status(200).json({ config });
        }

        // ── GET sync-index ─────────────────────────────────────────────────────
        if (req.method === 'GET' && action === 'sync-index') {
            return res.status(200).json({ docs: await readDocs() });
        }

        // ── GET sync-read : proxy potongan (cadangan bila CORS langsung gagal) ─
        if (req.method === 'GET' && action === 'sync-read') {
            const u = String(req.query?.u || '');
            if (!blobUrlOk(u)) return res.status(400).json({ error: 'BAD_REQUEST' });
            const r = await fetch(u, { redirect: 'error' });
            if (!r.ok) return res.status(404).json({ error: 'NOT_FOUND' });
            if (Number(r.headers.get('content-length') || 0) > MAX_CHUNK_BYTES) return res.status(413).json({ error: 'TOO_LARGE' });
            const buf = Buffer.from(await r.arrayBuffer());
            if (buf.length > MAX_CHUNK_BYTES) return res.status(413).json({ error: 'TOO_LARGE' });
            res.setHeader('Content-Type', 'application/octet-stream');
            return res.status(200).send(buf);
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
                return res.status(413).json({ error: 'TOO_LARGE', detail: 'Potongan terlalu besar.' });
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

        // ── POST sync-config : simpan salt + verifikator kata sandi (sekali saja) ─
        if (action === 'sync-config') {
            const salt = String(body.salt || '');
            const check = String(body.check || '');
            if (!salt || !check || salt.length > 200 || check.length > 400) return res.status(400).json({ error: 'BAD_REQUEST' });
            const [set] = await redis([['SET', CFG, JSON.stringify({ salt, check }), 'NX']]);
            if (set !== 'OK') {
                const [raw] = await redis([['GET', CFG]]);
                return res.status(409).json({ error: 'CONFIG_EXISTS', config: raw ? JSON.parse(String(raw)) : null });
            }
            return res.status(200).json({ ok: true });
        }

        // ── POST sync-push : compare-and-set pada nomor revisi ──────────────────
        if (action === 'sync-push') {
            const key = String(body.key || '');
            const baseRev = Number(body.baseRev);
            const uid = String(body.uid || '');
            const deleted = body.deleted === true;
            const chunks = Array.isArray(body.chunks) ? body.chunks : [];
            const size = Number(body.size) || 0;
            if (!KEY_RE.test(key) || !Number.isInteger(baseRev) || baseRev < 0) return res.status(400).json({ error: 'BAD_REQUEST' });
            if (!deleted) {
                if (!ID_RE.test(uid) || chunks.length === 0 || chunks.length > MAX_CHUNKS || new Set(chunks).size !== chunks.length || !chunks.every((u) => isOwnChunkUrl(u, uid))) {
                    return res.status(400).json({ error: 'BAD_REQUEST', detail: 'Data push tidak valid.' });
                }
                if (size <= 0 || size > MAX_MB * 1024 * 1024) return res.status(413).json({ error: 'TOO_LARGE', detail: `Dokumen melebihi batas ${MAX_MB} MB.` });
            }
            const doc: Doc = { rev: baseRev + 1, chunks: deleted ? [] : (chunks as string[]), size: deleted ? 0 : size, deleted, updatedAt: Date.now() };
            const [r] = (await redis([['EVAL', CAS_LUA, 1, DOCS, key, baseRev, JSON.stringify(doc)]])) as [unknown[]];
            const ok = Number(r?.[0]) === 1;
            const prev = parseDoc(r?.[1]);
            if (!ok) {
                // Potongan yang baru diunggah tidak terpakai: bersihkan.
                if (!deleted) await del(chunks as string[]).catch(() => undefined);
                return res.status(409).json({ error: 'CONFLICT', head: prev });
            }
            if (prev && prev.chunks.length) await del(prev.chunks).catch(() => undefined);
            return res.status(200).json({ ok: true, rev: doc.rev });
        }

        // ── POST abort : bersihkan potongan dari unggahan yang gagal ───────────
        if (action === 'abort') {
            const id = String(body.id || '');
            const chunks = Array.isArray(body.chunks) ? body.chunks.filter((u) => isOwnChunkUrl(u, id)) : [];
            if (ID_RE.test(id) && chunks.length) await del(chunks as string[]).catch(() => undefined);
            return res.status(200).json({ ok: true });
        }

        // ── POST sync-reset : hapus semua data sinkron & konfigurasi enkripsi ──
        if (action === 'sync-reset') {
            const docs = await readDocs();
            const urls = Object.values(docs).flatMap((d) => d.chunks);
            for (let i = 0; i < urls.length; i += 100) await del(urls.slice(i, i + 100)).catch(() => undefined);
            // Sapu juga blob yatim (unggahan yang terputus sebelum push) di folder khusus ZhaNotes.
            let orphans = 0;
            try {
                let cursor: string | undefined;
                for (let guard = 0; guard < 50; guard++) {
                    const page = await list({ prefix: `${PREFIX}/`, cursor, limit: 500 });
                    const found = page.blobs.map((b) => b.url);
                    if (found.length) {
                        await del(found).catch(() => undefined);
                        orphans += found.length;
                    }
                    if (!page.hasMore) break;
                    cursor = page.cursor;
                }
            } catch (e) {
                console.warn('[zhanotes-cloud] sapu blob yatim gagal');
            }
            await redis([['DEL', DOCS], ['DEL', CFG]]);
            return res.status(200).json({ ok: true, removed: Object.keys(docs).length, orphans });
        }

        return res.status(400).json({ error: 'UNKNOWN_ACTION' });
    } catch (err: any) {
        console.error('[zhanotes-cloud] error:', err);
        const detail = authed ? String(err?.message || err).slice(0, 300) : 'Kesalahan server.';
        return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', detail });
    }
}