// api/zhanotes-cloud.ts
//
// Sinkron otomatis ZhaNotes antar perangkat (satu pemilik per token; sampai 5 pemilik per deployment).
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
//   ZHANOTES_TOKEN_2 .. _5  opsional. Pemilik tambahan. Tiap token punya ruang data SENDIRI (kunci Redis, folder Blob,
//                           kata sandi enkripsi) yang terpisah total; token 1 memakai ruang lama (tanpa migrasi).
//   BLOB_READ_WRITE_TOKEN   wajib. Dibuat otomatis saat Vercel Blob dihubungkan ke proyek.
//   UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN   wajib (atau KV_REST_API_URL / KV_REST_API_TOKEN
//                           kalau Redis dipasang lewat integrasi Vercel Marketplace).
//   ZHANOTES_MAX_MB         opsional, batas ukuran satu dokumen (default 200).
//   ZHANOTES_PREFIX         opsional, awalan kunci Redis & folder Blob (default "zhanotes").
//   ZHANOTES_DEBUG          opsional. "1" = menyalakan tombol Log & pencatatan log sinkron di aplikasi klien (dan
//                           status menampilkan daftar variabel yang kurang). Tanpa ini semuanya mati. Perubahan
//                           baru berlaku setelah deploy ulang.
//   ZHANOTES_BLOB_HOST      opsional tapi disarankan. Hostname Blob store milikmu, mis.
//                           "abc123.public.blob.vercel-storage.com" (lihat URL salah satu blob di dashboard).
//                           Bila diisi, proxy sync-read HANYA mau mengambil dari host itu.
//
// Endpoint (semua lewat /api/zhanotes-cloud?action=...):
//   GET  status                 (tanpa token) -> { configured, maxMb, debug, missing }  (missing hanya terisi saat debug)
//   GET  sync-config            -> { config: { salt, check } | null }
//   POST sync-config            body { salt, check }  -> { ok }  (hanya bila belum ada; 409 bila sudah ada)
//   GET  sync-index             -> { docs: { [kunci]: { rev, chunks[], size, deleted, updatedAt } } }
//   POST chunk&id=&i=           body byte mentah (<= 4 MB) -> { url }
//   POST sync-push              body { key, baseRev, uid, chunks[], size, deleted? } -> { ok, rev } | 409 { head }
//   POST abort                  body { id, chunks[] }  -> { ok }   (bersihkan unggahan yang gagal)
//   GET  sync-read&u=<url>      -> byte mentah potongan (cadangan bila unduhan langsung diblokir CORS)
//   POST sync-reset             -> { ok }  (hapus SEMUA data sinkron + konfigurasi enkripsi, termasuk tautan bagi)
//
// Berbagi tautan baca-saja (edisi kustom). Isi catatan dienkripsi AES-GCM di peramban pemilik; kuncinya hanya ada di
// bagian # tautan (tidak pernah sampai ke server). Server hanya menyimpan byte terenkripsi + masa berlaku.
//   POST share-put&days=0|1|7|30  body byte terenkripsi (<= 3,5 MB, berawalan "ZS1") -> { id, at, exp }
//   GET  share-list               -> { shares: [{ id, at, exp, size }], max }        (kedaluwarsa dibersihkan)
//   POST share-revoke             body { id } -> { ok }
//   GET  share-get&id=            (TANPA token; dibatasi 60 baca/menit/IP) -> byte terenkripsi, atau 404
//                                 Header balasan: x-share-rev (nomor versi), x-share-edit ("1" bila tautan punya kunci tulis aktif)
// Tautan hidup & tautan edit bersama (edisi kustom):
//   POST share-put&id=<id>&baseRev=<n>[&force=1][&days=][&wh=<hex>|none]   (pemilik; body byte terenkripsi)
//        -> { id, rev, at, exp } | 409 { error: CONFLICT, rev } bila versi di server sudah berubah (mis. diedit penerima).
//        Tautan yang sama langsung menampilkan versi baru. Versi sebelumnya disimpan satu tingkat.
//        &wh=<sha256 hex dari kunci tulis> mengaktifkan hak edit untuk pemegang kunci tulis (hanya saat membuat/memperbarui).
//   POST share-edit&id=<id>&baseRev=<n>   (TANPA token pemilik; header x-zhanotes-write: kunci tulis; body byte terenkripsi)
//        -> { ok, rev } | 409 { error: CONFLICT, rev } | 403 { error: BAD_WRITE_KEY | EDIT_DISABLED }
//        Penerima tidak bisa menghapus, mencabut, atau memperpanjang tautan; hanya menulis versi baru.
//   POST share-opts               body { id, days?, edit?: false } -> { ok, rev, exp, edit }  (pemilik: ubah masa berlaku / matikan edit)
//   GET  share-prev&id=           (pemilik) -> byte terenkripsi versi sebelumnya; header x-share-rev = versi saat ini
// Pratinjau tautan (edisi kustom, perlu token):
//   GET  link-preview&u=<url>     -> { url, title, desc, site }  (hanya situs publik http/https; IP privat ditolak)

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { del, list, put } from '@vercel/blob';

export const maxDuration = 30;

const PREFIX = (process.env.ZHANOTES_PREFIX || 'zhanotes').replace(/[^a-z0-9_-]/gi, '') || 'zhanotes';
const MAX_USERS = 5;
// Ruang data per pemilik. Pemilik 1 memakai awalan lama (data yang sudah ada tetap terbaca); pemilik n>1 memakai
// `${PREFIX}-n`. Folder Blob `zhanotes-2/` tidak berawalan `zhanotes/`, jadi pemeriksaan URL & sapu yatim tidak bocor antar pemilik.
interface Space {
    n: number;
    prefix: string;
    docs: string;
    cfg: string;
}
const spaceFor = (n: number): Space => {
    const prefix = n === 1 ? PREFIX : `${PREFIX}-${n}`;
    return { n, prefix, docs: `${prefix}:sync:docs`, cfg: `${prefix}:sync:config` };
};
const tokenEnv = (n: number) => (n === 1 ? 'ZHANOTES_TOKEN' : `ZHANOTES_TOKEN_${n}`);
// [nomor pemilik, token] untuk semua slot yang terisi.
const tokens = (): [number, string][] => {
    const out: [number, string][] = [];
    for (let n = 1; n <= MAX_USERS; n++) {
        const t = String(process.env[tokenEnv(n)] || '');
        if (t) out.push([n, t]);
    }
    return out;
};
const DEBUG = () => process.env.ZHANOTES_DEBUG === '1';
const MAX_MB = Math.min(1000, Math.max(5, Number(process.env.ZHANOTES_MAX_MB) || 200));
const MAX_CHUNK_BYTES = 4 * 1024 * 1024;
const BLOB_HOST = (process.env.ZHANOTES_BLOB_HOST || '').trim().toLowerCase();
const FAIL_LIMIT = 5;
const FAIL_WINDOW_S = 10 * 60;
const MAX_CHUNKS = Math.ceil((MAX_MB * 1024 * 1024) / (3 * 1024 * 1024)) + 2;
const ID_RE = /^[a-z0-9-]{8,64}$/;
const KEY_RE = /^(meta|(n|pdf|rec):[A-Za-z0-9_-]{1,40})$/;
const SHARE_RE = /^[A-Za-z0-9_-]{16,32}$/;
const MAX_SHARE_BYTES = Math.floor(3.5 * 1024 * 1024);
const MAX_SHARES = 50;
const SHARE_DAYS = [0, 1, 7, 30]; // 0 = tanpa batas
const SHARE_READ_LIMIT = 60; // pembacaan per IP per menit
const SHARE_PATH_RE = new RegExp(`^/${PREFIX}(-[2-5])?/shares/`);
const MAX_PAGE_BYTES = 512 * 1024;

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
    for (const [n, t] of tokens()) {
        if (t.length < 32) console.warn(`[zhanotes-cloud] ${tokenEnv(n)} kurang dari 32 karakter. Ganti dengan string acak panjang (mis. \`openssl rand -base64 32\`).`);
    }
    const all = tokens().map(([, t]) => t);
    if (new Set(all).size !== all.length) console.warn('[zhanotes-cloud] Ada token yang sama di dua slot; slot bernomor lebih kecil yang dipakai. Buat token berbeda untuk tiap pemilik.');
};
const isConfigured = () => Boolean(tokens().length && process.env.BLOB_READ_WRITE_TOKEN && redisUrl() && redisToken());
// Hanya NAMA variabel yang belum terisi (tidak pernah nilainya) — membantu diagnosis saat sinkron "belum aktif".
const missingEnv = (): string[] => {
    const m: string[] = [];
    if (!tokens().length) m.push('ZHANOTES_TOKEN');
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

async function readDocs(sp: Space): Promise<Record<string, Doc>> {
    const [flat] = (await redis([['HGETALL', sp.docs]])) as [unknown];
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

const blobUrlOk = (u: unknown, sp: Space): u is string => {
    if (typeof u !== 'string') return false;
    try {
        const p = new URL(u);
        if (p.protocol !== 'https:' || p.username || p.password || p.port) return false;
        const hostOk = BLOB_HOST ? p.hostname === BLOB_HOST : p.hostname.endsWith('.blob.vercel-storage.com');
        return hostOk && p.pathname.startsWith(`/${sp.prefix}/`);
    } catch {
        return false;
    }
};

// Hanya URL Blob milik unggahan ini yang boleh disimpan/dihapus.
const isOwnChunkUrl = (u: unknown, id: string, sp: Space): u is string =>
    blobUrlOk(u, sp) && new URL(u as string).pathname.startsWith(`/${sp.prefix}/${id}/`);

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

// ── Berbagi tautan ────────────────────────────────────────────────────────
interface Share {
    url: string;
    at: number;
    exp: number; // ms epoch; 0 = tanpa batas
    size: number;
    rev?: number; // nomor versi; tautan lama tanpa rev dianggap 1
    up?: number; // waktu pembaruan terakhir (ms epoch)
    pu?: string; // URL blob versi sebelumnya (satu tingkat)
    wh?: string; // sha256 (hex) kunci tulis; ada = tautan edit bersama aktif. Kuncinya sendiri tidak pernah disimpan.
    sp?: string; // awalan ruang pemilik (agar penulis berbekal kunci tulis bisa menemukan indeks pemilik)
}
const HEX64 = /^[a-f0-9]{64}$/;
const WKEY_RE = /^[A-Za-z0-9_-]{43}$/;
const spaceOk = (sp: unknown): sp is string => typeof sp === 'string' && (sp === PREFIX || new RegExp(`^${PREFIX}-[2-5]$`).test(sp));
const sha256 = (s: string) => createHash('sha256').update(s).digest();
const sha256hex = (s: string) => sha256(s).toString('hex');
const SHARE_WRITE_LIMIT = 30; // penulisan per IP per menit
const SHARE_WRITE_FAIL_LIMIT = 10; // kunci tulis salah per IP per 10 menit

// Compare-and-set atomik untuk catatan bagi. ARGV: 1 id, 2 rev yang diharapkan (-1 = abaikan), 3 wh yang diharapkan ('' = abaikan),
// 4 patch JSON, 5 naikkan rev ('1'/'0'), 6 geser versi sekarang jadi "sebelumnya" ('1'/'0'), 7 waktu sekarang (ms).
// Kembali {kode, isi lama, isi baru}: 1 = berhasil, 0 = rev bentrok, 2 = catatan tidak ada, 3 = kunci tulis berubah.
const SHARE_LUA = `
local cur = redis.call('HGET', KEYS[1], ARGV[1])
if not cur then return {2, ''} end
local d = cjson.decode(cur)
local rev = d.rev or 1
if ARGV[2] ~= '-1' and rev ~= tonumber(ARGV[2]) then return {0, cur} end
if ARGV[3] ~= '' and d.wh ~= ARGV[3] then return {3, cur} end
local p = cjson.decode(ARGV[4])
if ARGV[6] == '1' then d.pu = d.url end
for k, v in pairs(p) do d[k] = v end
if p.nowh then d.wh = nil end
d.nowh = nil
if ARGV[5] == '1' then d.rev = rev + 1 else d.rev = rev end
local enc = cjson.encode(d)
redis.call('HSET', KEYS[1], ARGV[1], enc)
local ttl = 0
if d.exp and d.exp > 0 then ttl = math.max(60, math.ceil((d.exp - tonumber(ARGV[7])) / 1000) + 3600) end
if ttl > 0 then redis.call('SET', KEYS[2], enc, 'EX', ttl) else redis.call('SET', KEYS[2], enc) end
return {1, cur, enc}
`;
const shareKey = (id: string) => `${PREFIX}:share:${id}`;
const shareUrlOk = (u: unknown): u is string => {
    if (typeof u !== 'string') return false;
    try {
        const p = new URL(u);
        if (p.protocol !== 'https:' || p.username || p.password || p.port) return false;
        const hostOk = BLOB_HOST ? p.hostname === BLOB_HOST : p.hostname.endsWith('.blob.vercel-storage.com');
        return hostOk && SHARE_PATH_RE.test(p.pathname);
    } catch {
        return false;
    }
};
const parseShare = (raw: unknown): Share | null => {
    try {
        const s = JSON.parse(String(raw)) as Share;
        return s && typeof s.url === 'string' && Number.isFinite(s.at) && Number.isFinite(s.exp) ? s : null;
    } catch {
        return null;
    }
};
async function hgetall(key: string): Promise<Record<string, string>> {
    const [flat] = (await redis([['HGETALL', key]])) as [unknown];
    const out: Record<string, string> = {};
    if (Array.isArray(flat)) {
        for (let i = 0; i + 1 < flat.length; i += 2) out[String(flat[i])] = String(flat[i + 1]);
    } else if (flat && typeof flat === 'object') {
        for (const [k, v] of Object.entries(flat as Record<string, unknown>)) out[k] = String(v);
    }
    return out;
}
async function shareCas(hashKey: string, id: string, expRev: number, expWh: string, patch: Record<string, unknown>, bump: boolean, shift: boolean) {
    const [r] = (await redis([['EVAL', SHARE_LUA, 2, hashKey, shareKey(id), id, expRev, expWh, JSON.stringify(patch), bump ? '1' : '0', shift ? '1' : '0', Date.now()]])) as [unknown[]];
    let next: Share | null = null;
    try {
        next = r?.[2] ? (JSON.parse(String(r[2])) as Share) : null;
    } catch {
        next = null;
    }
    return { code: Number(r?.[0]), prev: parseShare(r?.[1]), next };
}
const shareBlobs = (s: Share | null | undefined): string[] => [s?.url, s?.pu].filter((u): u is string => !!u && shareUrlOk(u));
// Hapus tautan kedaluwarsa milik satu pemilik (blob + indeks), kembalikan yang masih aktif.
async function activeShares(sp: Space): Promise<Record<string, Share>> {
    const raw = await hgetall(`${sp.prefix}:shares`);
    const now = Date.now();
    const live: Record<string, Share> = {};
    const dead: string[] = [];
    for (const [id, v] of Object.entries(raw)) {
        const s = parseShare(v);
        if (s && (!s.exp || s.exp > now)) live[id] = s;
        else dead.push(id);
    }
    if (dead.length) {
        const urls = dead.flatMap((id) => shareBlobs(parseShare(raw[id])));
        if (urls.length) await del(urls).catch(() => undefined);
        await redis([['HDEL', `${sp.prefix}:shares`, ...dead], ...dead.map((id) => ['DEL', shareKey(id)])]);
    }
    return live;
}

// ── Pratinjau tautan ──────────────────────────────────────────────────────
const privV4 = (a: number[]) =>
    a.length !== 4 || a.some((x) => !(x >= 0 && x <= 255)) || a[0] === 0 || a[0] === 10 || a[0] === 127 ||
    (a[0] === 100 && a[1] >= 64 && a[1] <= 127) || (a[0] === 169 && a[1] === 254) || (a[0] === 172 && a[1] >= 16 && a[1] <= 31) ||
    (a[0] === 192 && a[1] === 168) || (a[0] === 192 && a[1] === 0 && a[2] === 0) || (a[0] === 198 && (a[1] === 18 || a[1] === 19)) || a[0] >= 224;
const isPrivateIp = (ip: string): boolean => {
    const v = isIP(ip);
    if (v === 4) return privV4(ip.split('.').map(Number));
    if (v === 6) {
        const s = ip.toLowerCase();
        return s === '::' || s === '::1' || /^fe[89ab]/.test(s) || /^f[cd]/.test(s) || s.startsWith('ff') || s.startsWith('::ffff:') || s.startsWith('64:ff9b:') || s.startsWith('2001:db8');
    }
    return true;
};
const badHost = (h: string) => h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') || h.endsWith('.internal') || h.endsWith('.lan') || (!h.includes('.') && !isIP(h));
// Ambil halaman HTML publik: hanya http/https port 80/443, tolak IP privat (termasuk hasil DNS dan tiap lompatan redirect).
// Catatan: DNS di-resolve sekali untuk pemeriksaan lalu fetch me-resolve lagi (celah DNS-rebinding kecil); endpoint ini
// hanya untuk pemilik bertoken dan hanya mengembalikan judul/deskripsi teks.
async function fetchPage(u: string): Promise<{ html: string; url: string }> {
    let cur = u;
    for (let hop = 0; hop < 4; hop++) {
        let p: URL;
        try {
            p = new URL(cur);
        } catch {
            throw new Error('URL_NOT_ALLOWED');
        }
        const host = p.hostname.replace(/^\[|\]$/g, '').toLowerCase();
        if (!/^https?:$/.test(p.protocol) || p.username || p.password || (p.port && p.port !== '80' && p.port !== '443') || !host || badHost(host)) throw new Error('URL_NOT_ALLOWED');
        if (isIP(host)) {
            if (isPrivateIp(host)) throw new Error('URL_NOT_ALLOWED');
        } else {
            const addrs = await lookup(host, { all: true });
            if (!addrs.length || addrs.some((a) => isPrivateIp(a.address))) throw new Error('URL_NOT_ALLOWED');
        }
        const ctl = new AbortController();
        const timer = setTimeout(() => ctl.abort(), 6000);
        let r: any;
        try {
            r = await fetch(cur, { redirect: 'manual', signal: ctl.signal, headers: { 'user-agent': 'Mozilla/5.0 (compatible; ZhaNotesPreview/1.0)', accept: 'text/html,application/xhtml+xml' } });
        } finally {
            clearTimeout(timer);
        }
        if (r.status >= 300 && r.status < 400) {
            const loc = r.headers.get('location');
            if (!loc) throw new Error('HTTP_' + r.status);
            cur = new URL(loc, cur).toString();
            continue;
        }
        if (!r.ok) throw new Error('HTTP_' + r.status);
        if (!/text\/html|application\/xhtml/i.test(String(r.headers.get('content-type') || ''))) throw new Error('NOT_HTML');
        const reader = r.body?.getReader?.();
        if (!reader) throw new Error('FETCH_FAILED');
        const parts: Uint8Array[] = [];
        let got = 0;
        while (got < MAX_PAGE_BYTES) {
            const { done, value } = await reader.read();
            if (done) break;
            parts.push(value);
            got += value.length;
        }
        try {
            await reader.cancel();
        } catch {
            /* abaikan */
        }
        return { html: new TextDecoder('utf-8').decode(Buffer.concat(parts)).slice(0, MAX_PAGE_BYTES), url: cur };
    }
    throw new Error('TOO_MANY_REDIRECTS');
}
const entDecode = (s: string) =>
    s.replace(/&(#x?[0-9a-f]+|amp|lt|gt|quot|apos|nbsp);/gi, (_m, g: string) => {
        const l = g.toLowerCase();
        if (l === 'amp') return '&';
        if (l === 'lt') return '<';
        if (l === 'gt') return '>';
        if (l === 'quot') return '"';
        if (l === 'apos') return "'";
        if (l === 'nbsp') return ' ';
        const n = l[1] === 'x' ? parseInt(l.slice(2), 16) : parseInt(l.slice(1), 10);
        return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : '';
    });
const cleanTxt = (s: string, max: number) => entDecode(s).replace(/\s+/g, ' ').trim().slice(0, max);
const metaOf = (h: string, keys: string[]): string => {
    const tags = h.match(/<meta\b[^>]*>/gi) || [];
    for (const k of keys) {
        for (const t of tags) {
            const nm = /(?:property|name)\s*=\s*["']([^"']+)["']/i.exec(t);
            if (!nm || nm[1].toLowerCase() !== k) continue;
            const c = /content\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(t);
            const v = c ? c[1] || c[2] || '' : '';
            if (v.trim()) return v;
        }
    }
    return '';
};
const parseMeta = (html: string) => {
    const head = html.slice(0, 300000);
    const tm = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(head);
    return {
        title: cleanTxt(metaOf(head, ['og:title', 'twitter:title']) || (tm ? tm[1] : ''), 200),
        desc: cleanTxt(metaOf(head, ['og:description', 'description', 'twitter:description']), 400),
        site: cleanTxt(metaOf(head, ['og:site_name']), 80),
    };
};
// Hanya untuk uji (uji/uji-server.mjs).
export const __test = { isPrivateIp, parseMeta, fetchPage };

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
            // Endpoint ini publik: daftar variabel yang kurang (nama env) hanya ditampilkan saat mode debug menyala.
            return res.status(200).json({ configured: isConfigured(), maxMb: MAX_MB, debug: DEBUG(), missing: DEBUG() && !isConfigured() ? missingEnv() : [] });
        }

        warnWeakToken();
        if (!isConfigured()) return res.status(503).json({ error: 'NOT_CONFIGURED', detail: 'Sinkron awan belum dikonfigurasi di server ini.' });

        // ── GET share-get : publik (tanpa token); isinya terenkripsi, kuncinya hanya ada di tautan ──────
        if (req.method === 'GET' && action === 'share-get') {
            const id = String(req.query?.id || '');
            if (!SHARE_RE.test(id)) return res.status(400).json({ error: 'BAD_REQUEST' });
            const ipH = createHash('sha256').update(String(req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim()).digest('hex').slice(0, 16);
            const rl = `${PREFIX}:share:rl:${ipH}`;
            const [cnt, , raw] = await redis([['INCR', rl], ['EXPIRE', rl, 60], ['GET', shareKey(id)]]);
            if (Number(cnt) > SHARE_READ_LIMIT) {
                res.setHeader('Retry-After', '60');
                return res.status(429).json({ error: 'TOO_MANY_REQUESTS', detail: 'Terlalu sering membuka tautan. Coba lagi sebentar.' });
            }
            const rec = parseShare(raw);
            if (!rec || (rec.exp && rec.exp < Date.now()) || !shareUrlOk(rec.url)) return res.status(404).json({ error: 'NOT_FOUND', detail: 'Tautan tidak ditemukan, sudah dicabut, atau sudah kedaluwarsa.' });
            const r = await fetch(rec.url, { redirect: 'error' });
            if (!r.ok) return res.status(404).json({ error: 'NOT_FOUND', detail: 'Tautan tidak ditemukan, sudah dicabut, atau sudah kedaluwarsa.' });
            const buf = Buffer.from(await r.arrayBuffer());
            if (buf.length > MAX_SHARE_BYTES + 1024) return res.status(413).json({ error: 'TOO_LARGE' });
            res.setHeader('Content-Type', 'application/octet-stream');
            res.setHeader('x-share-rev', String(rec.rev || 1));
            res.setHeader('x-share-edit', rec.wh && spaceOk(rec.sp) ? '1' : '0');
            return res.status(200).send(buf);
        }

        // ── POST share-edit : penulisan oleh pemegang kunci tulis (TANPA token pemilik) ─────────────
        if (req.method === 'POST' && action === 'share-edit') {
            const id = String(req.query?.id || '');
            const baseRev = Number(req.query?.baseRev);
            const wkey = String(req.headers['x-zhanotes-write'] || '');
            if (!SHARE_RE.test(id) || !Number.isInteger(baseRev) || baseRev < 1) return res.status(400).json({ error: 'BAD_REQUEST' });
            const ipH = createHash('sha256').update(String(req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim()).digest('hex').slice(0, 16);
            const wr = `${PREFIX}:share:wr:${ipH}`;
            const wf = `${PREFIX}:share:wf:${ipH}`;
            const [cnt, , failed, raw] = await redis([['INCR', wr], ['EXPIRE', wr, 60], ['GET', wf], ['GET', shareKey(id)]]);
            if (Number(cnt) > SHARE_WRITE_LIMIT || Number(failed) >= SHARE_WRITE_FAIL_LIMIT) {
                res.setHeader('Retry-After', '60');
                return res.status(429).json({ error: 'TOO_MANY_REQUESTS', detail: 'Terlalu sering menyimpan. Coba lagi sebentar.' });
            }
            const rec = parseShare(raw);
            if (!rec || (rec.exp && rec.exp < Date.now()) || !shareUrlOk(rec.url)) return res.status(404).json({ error: 'NOT_FOUND', detail: 'Tautan tidak ditemukan, sudah dicabut, atau sudah kedaluwarsa.' });
            if (!rec.wh || !HEX64.test(rec.wh) || !spaceOk(rec.sp)) return res.status(403).json({ error: 'EDIT_DISABLED', detail: 'Hak edit pada tautan ini tidak aktif.' });
            if (!WKEY_RE.test(wkey) || !timingSafeEqual(sha256(wkey), Buffer.from(rec.wh, 'hex'))) {
                await redis([['INCR', wf], ['EXPIRE', wf, 600]]);
                return res.status(403).json({ error: 'BAD_WRITE_KEY', detail: 'Kunci edit tidak cocok.' });
            }
            let data: Buffer;
            try {
                data = await readBody(req);
            } catch {
                return res.status(413).json({ error: 'TOO_LARGE', detail: 'Catatan terlalu besar.' });
            }
            if (data.length < 40 || data.length > MAX_SHARE_BYTES) return res.status(413).json({ error: 'TOO_LARGE', detail: `Catatan terlalu besar (maksimal ${(MAX_SHARE_BYTES / 1048576).toFixed(1)} MB).` });
            if (data[0] !== 90 || data[1] !== 83 || data[2] !== 49) return res.status(400).json({ error: 'BAD_REQUEST', detail: 'Format data tidak dikenal.' });
            const blob = await put(`${rec.sp}/shares/${id}.bin`, data, { access: 'public', contentType: 'application/octet-stream', addRandomSuffix: true });
            const c = await shareCas(`${rec.sp}:shares`, id, baseRev, rec.wh, { url: blob.url, size: data.length, up: Date.now() }, true, true);
            if (c.code !== 1) {
                await del(blob.url).catch(() => undefined);
                if (c.code === 0) return res.status(409).json({ error: 'CONFLICT', rev: c.prev?.rev || 1, detail: 'Catatan sudah diubah orang lain.' });
                if (c.code === 3) return res.status(403).json({ error: 'EDIT_DISABLED', detail: 'Hak edit pada tautan ini baru saja dimatikan.' });
                return res.status(404).json({ error: 'NOT_FOUND', detail: 'Tautan tidak ditemukan, sudah dicabut, atau sudah kedaluwarsa.' });
            }
            if (c.prev?.pu && shareUrlOk(c.prev.pu)) await del(c.prev.pu).catch(() => undefined);
            return res.status(200).json({ ok: true, rev: c.next?.rev || baseRev + 1 });
        }

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
        // Bandingkan ke SEMUA slot (tanpa berhenti di yang cocok) supaya waktu respons tidak membocorkan slot mana.
        let slot = 0;
        for (const [n, t] of tokens()) {
            if (timingSafeEqual(a, createHash('sha256').update(t).digest()) && !slot) slot = n;
        }
        if (!given || !slot) {
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
        const sp = spaceFor(slot);

        // ── GET sync-config ────────────────────────────────────────────────────
        if (req.method === 'GET' && action === 'sync-config') {
            const [raw] = await redis([['GET', sp.cfg]]);
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
            return res.status(200).json({ docs: await readDocs(sp) });
        }

        // ── GET sync-read : proxy potongan (cadangan bila CORS langsung gagal) ─
        if (req.method === 'GET' && action === 'sync-read') {
            const u = String(req.query?.u || '');
            if (!blobUrlOk(u, sp)) return res.status(400).json({ error: 'BAD_REQUEST' });
            const r = await fetch(u, { redirect: 'error' });
            if (!r.ok) return res.status(404).json({ error: 'NOT_FOUND' });
            if (Number(r.headers.get('content-length') || 0) > MAX_CHUNK_BYTES) return res.status(413).json({ error: 'TOO_LARGE' });
            const buf = Buffer.from(await r.arrayBuffer());
            if (buf.length > MAX_CHUNK_BYTES) return res.status(413).json({ error: 'TOO_LARGE' });
            res.setHeader('Content-Type', 'application/octet-stream');
            return res.status(200).send(buf);
        }

        // ── GET share-list ─────────────────────────────────────────────────────
        if (req.method === 'GET' && action === 'share-list') {
            const live = await activeShares(sp);
            const shares = Object.entries(live)
                .map(([id, s]) => ({ id, at: s.at, exp: s.exp, size: s.size, rev: s.rev || 1, up: s.up || s.at, edit: !!(s.wh && spaceOk(s.sp)), prev: !!(s.pu && shareUrlOk(s.pu)) }))
                .sort((a, b) => b.at - a.at);
            return res.status(200).json({ shares, max: MAX_SHARES });
        }

        // ── GET share-prev : versi sebelumnya (hanya pemilik) ──────────────────
        if (req.method === 'GET' && action === 'share-prev') {
            const id = String(req.query?.id || '');
            if (!SHARE_RE.test(id)) return res.status(400).json({ error: 'BAD_REQUEST' });
            const rec = parseShare((await hgetall(`${sp.prefix}:shares`))[id]);
            if (!rec || (rec.exp && rec.exp < Date.now())) return res.status(404).json({ error: 'NOT_FOUND', detail: 'Tautan tidak ditemukan.' });
            if (!rec.pu || !shareUrlOk(rec.pu)) return res.status(404).json({ error: 'NO_PREVIOUS', detail: 'Belum ada versi sebelumnya.' });
            const r = await fetch(rec.pu, { redirect: 'error' });
            if (!r.ok) return res.status(404).json({ error: 'NO_PREVIOUS', detail: 'Versi sebelumnya sudah tidak tersedia.' });
            const buf = Buffer.from(await r.arrayBuffer());
            if (buf.length > MAX_SHARE_BYTES + 1024) return res.status(413).json({ error: 'TOO_LARGE' });
            res.setHeader('Content-Type', 'application/octet-stream');
            res.setHeader('x-share-rev', String(rec.rev || 1));
            return res.status(200).send(buf);
        }

        // ── GET link-preview ───────────────────────────────────────────────────
        if (req.method === 'GET' && action === 'link-preview') {
            const u = String(req.query?.u || '').trim();
            if (!u || u.length > 2000) return res.status(400).json({ error: 'BAD_REQUEST', detail: 'Alamat tidak valid.' });
            try {
                const { html, url } = await fetchPage(u);
                return res.status(200).json({ url, ...parseMeta(html) });
            } catch (e: any) {
                const code = String(e?.message || '');
                if (code === 'URL_NOT_ALLOWED') return res.status(422).json({ error: code, detail: 'Alamat ini tidak diizinkan (hanya situs web publik).' });
                if (code === 'NOT_HTML') return res.status(422).json({ error: code, detail: 'Alamat itu bukan halaman web.' });
                if (code === 'TOO_MANY_REDIRECTS') return res.status(422).json({ error: code, detail: 'Terlalu banyak pengalihan alamat.' });
                if (/^HTTP_\d+$/.test(code)) return res.status(422).json({ error: code, detail: `Situs membalas dengan kesalahan (${code.replace('_', ' ')}).` });
                return res.status(502).json({ error: 'FETCH_FAILED', detail: 'Gagal mengambil halaman (situs tidak merespons).' });
            }
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
            const blob = await put(`${sp.prefix}/${id}/${String(i).padStart(4, '0')}.bin`, data, {
                access: 'public',
                contentType: 'application/octet-stream',
                addRandomSuffix: true, // URL tidak bisa ditebak; isinya pun sudah terenkripsi
            });
            return res.status(200).json({ url: blob.url });
        }

        // ── POST share-put : simpan catatan terenkripsi untuk dibagikan (baru), atau perbarui tautan yang sudah ada ─────────
        if (action === 'share-put') {
            const qid = String(req.query?.id || '');
            const upd = qid !== '';
            if (upd && !SHARE_RE.test(qid)) return res.status(400).json({ error: 'BAD_REQUEST' });
            const daysQ = req.query?.days;
            const days = Number(daysQ);
            if ((!upd || daysQ !== undefined) && !SHARE_DAYS.includes(days)) return res.status(400).json({ error: 'BAD_REQUEST', detail: 'Masa berlaku tidak valid.' });
            const whq = String(req.query?.wh || '');
            if (whq && whq !== 'none' && !HEX64.test(whq)) return res.status(400).json({ error: 'BAD_REQUEST', detail: 'Kunci tulis tidak valid.' });
            let data: Buffer;
            try {
                data = await readBody(req);
            } catch {
                return res.status(413).json({ error: 'TOO_LARGE', detail: 'Catatan terlalu besar untuk dibagikan.' });
            }
            if (data.length < 40 || data.length > MAX_SHARE_BYTES) return res.status(413).json({ error: 'TOO_LARGE', detail: `Catatan terlalu besar untuk dibagikan (maksimal ${(MAX_SHARE_BYTES / 1048576).toFixed(1)} MB termasuk gambar).` });
            // Pastikan berformat data terenkripsi klien ("ZS1"): server tidak menyimpan teks polos.
            if (data[0] !== 90 || data[1] !== 83 || data[2] !== 49) return res.status(400).json({ error: 'BAD_REQUEST', detail: 'Format data tidak dikenal.' });

            if (upd) {
                // Perbarui tautan yang sama. Hanya pemilik (token ruangnya) yang bisa: id harus ada di indeks ruang ini.
                const old = parseShare((await hgetall(`${sp.prefix}:shares`))[qid]);
                if (!old || !shareUrlOk(old.url) || (old.exp && old.exp <= Date.now())) return res.status(404).json({ error: 'NOT_FOUND', detail: 'Tautan sudah dicabut atau kedaluwarsa.' });
                const force = req.query?.force === '1';
                const baseRev = Number(req.query?.baseRev);
                if (!force && !(Number.isInteger(baseRev) && baseRev >= 1)) return res.status(400).json({ error: 'BAD_REQUEST', detail: 'Nomor versi (baseRev) wajib.' });
                const blob = await put(`${sp.prefix}/shares/${qid}.bin`, data, { access: 'public', contentType: 'application/octet-stream', addRandomSuffix: true });
                const patch: Record<string, unknown> = { url: blob.url, size: data.length, up: Date.now(), sp: sp.prefix };
                if (daysQ !== undefined) patch.exp = days ? Date.now() + days * 86400000 : 0;
                if (whq === 'none') patch.nowh = true;
                else if (whq) patch.wh = whq;
                const c = await shareCas(`${sp.prefix}:shares`, qid, force ? -1 : baseRev, '', patch, true, true);
                if (c.code !== 1) {
                    await del(blob.url).catch(() => undefined);
                    if (c.code === 0) return res.status(409).json({ error: 'CONFLICT', rev: c.prev?.rev || 1, detail: 'Tautan ini sudah diubah (mis. oleh penerima).' });
                    return res.status(404).json({ error: 'NOT_FOUND', detail: 'Tautan sudah dicabut atau kedaluwarsa.' });
                }
                if (c.prev?.pu && shareUrlOk(c.prev.pu)) await del(c.prev.pu).catch(() => undefined);
                return res.status(200).json({ id: qid, rev: c.next?.rev || 1, at: c.next?.at, exp: c.next?.exp ?? 0 });
            }

            const live = await activeShares(sp);
            if (Object.keys(live).length >= MAX_SHARES) return res.status(409).json({ error: 'SHARE_LIMIT', detail: `Batas ${MAX_SHARES} tautan aktif tercapai. Cabut sebagian dulu.` });
            const id = randomBytes(16).toString('base64url');
            const blob = await put(`${sp.prefix}/shares/${id}.bin`, data, { access: 'public', contentType: 'application/octet-stream', addRandomSuffix: true });
            const at = Date.now();
            const exp = days ? at + days * 86400000 : 0;
            const rec: Share = { url: blob.url, at, exp, size: data.length, rev: 1, up: at, sp: sp.prefix, ...(whq && whq !== 'none' ? { wh: whq } : {}) };
            await redis([
                ['SET', shareKey(id), JSON.stringify(rec), ...(days ? ['EX', days * 86400 + 3600] : [])],
                ['HSET', `${sp.prefix}:shares`, id, JSON.stringify(rec)],
            ]);
            return res.status(200).json({ id, at, exp, rev: 1 });
        }

        const body = jsonBody(req);

        // ── POST share-revoke ──────────────────────────────────────────────────
        if (action === 'share-revoke') {
            const id = String(body.id || '');
            if (!SHARE_RE.test(id)) return res.status(400).json({ error: 'BAD_REQUEST' });
            const raw = (await hgetall(`${sp.prefix}:shares`))[id];
            if (raw) {
                const urls = shareBlobs(parseShare(raw));
                if (urls.length) await del(urls).catch(() => undefined);
                await redis([['HDEL', `${sp.prefix}:shares`, id], ['DEL', shareKey(id)]]);
            }
            return res.status(200).json({ ok: true });
        }

        // ── POST share-opts : ubah masa berlaku / matikan hak edit (pemilik) ──────
        if (action === 'share-opts') {
            const id = String(body.id || '');
            if (!SHARE_RE.test(id)) return res.status(400).json({ error: 'BAD_REQUEST' });
            const old = parseShare((await hgetall(`${sp.prefix}:shares`))[id]);
            if (!old || (old.exp && old.exp <= Date.now())) return res.status(404).json({ error: 'NOT_FOUND', detail: 'Tautan tidak ditemukan.' });
            const patch: Record<string, unknown> = { sp: sp.prefix };
            if (body.days !== undefined) {
                const days = Number(body.days);
                if (!SHARE_DAYS.includes(days)) return res.status(400).json({ error: 'BAD_REQUEST', detail: 'Masa berlaku tidak valid.' });
                patch.exp = days ? Date.now() + days * 86400000 : 0;
            }
            const offEdit = body.edit === false;
            if (offEdit) patch.nowh = true;
            // Mematikan edit menaikkan nomor versi supaya penulis yang sedang membuka versi lama ditolak.
            const c = await shareCas(`${sp.prefix}:shares`, id, Number(old.rev || 1), '', patch, offEdit, false);
            if (c.code === 0) return res.status(409).json({ error: 'CONFLICT', rev: c.prev?.rev || 1, detail: 'Tautan baru saja berubah. Coba lagi.' });
            if (c.code !== 1) return res.status(404).json({ error: 'NOT_FOUND', detail: 'Tautan tidak ditemukan.' });
            return res.status(200).json({ ok: true, rev: c.next?.rev || 1, exp: c.next?.exp ?? 0, edit: !!c.next?.wh });
        }

        // ── POST sync-config : simpan salt + verifikator kata sandi (sekali saja) ─
        if (action === 'sync-config') {
            const salt = String(body.salt || '');
            const check = String(body.check || '');
            if (!salt || !check || salt.length > 200 || check.length > 400) return res.status(400).json({ error: 'BAD_REQUEST' });
            const [set] = await redis([['SET', sp.cfg, JSON.stringify({ salt, check }), 'NX']]);
            if (set !== 'OK') {
                const [raw] = await redis([['GET', sp.cfg]]);
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
                if (!ID_RE.test(uid) || chunks.length === 0 || chunks.length > MAX_CHUNKS || new Set(chunks).size !== chunks.length || !chunks.every((u) => isOwnChunkUrl(u, uid, sp))) {
                    return res.status(400).json({ error: 'BAD_REQUEST', detail: 'Data push tidak valid.' });
                }
                if (size <= 0 || size > MAX_MB * 1024 * 1024) return res.status(413).json({ error: 'TOO_LARGE', detail: `Dokumen melebihi batas ${MAX_MB} MB.` });
            }
            const doc: Doc = { rev: baseRev + 1, chunks: deleted ? [] : (chunks as string[]), size: deleted ? 0 : size, deleted, updatedAt: Date.now() };
            const [r] = (await redis([['EVAL', CAS_LUA, 1, sp.docs, key, baseRev, JSON.stringify(doc)]])) as [unknown[]];
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
            const chunks = Array.isArray(body.chunks) ? body.chunks.filter((u) => isOwnChunkUrl(u, id, sp)) : [];
            if (ID_RE.test(id) && chunks.length) await del(chunks as string[]).catch(() => undefined);
            return res.status(200).json({ ok: true });
        }

        // ── POST sync-reset : hapus semua data sinkron & konfigurasi enkripsi ──
        if (action === 'sync-reset') {
            const docs = await readDocs(sp);
            const urls = Object.values(docs).flatMap((d) => d.chunks);
            for (let i = 0; i < urls.length; i += 100) await del(urls.slice(i, i + 100)).catch(() => undefined);
            // Sapu juga blob yatim (unggahan yang terputus sebelum push) di folder khusus ZhaNotes.
            let orphans = 0;
            try {
                let cursor: string | undefined;
                for (let guard = 0; guard < 50; guard++) {
                    const page = await list({ prefix: `${sp.prefix}/`, cursor, limit: 500 });
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
            const shareIds = Object.keys(await hgetall(`${sp.prefix}:shares`));
            await redis([['DEL', sp.docs], ['DEL', sp.cfg], ['DEL', `${sp.prefix}:shares`], ...shareIds.map((sid) => ['DEL', shareKey(sid)])]);
            return res.status(200).json({ ok: true, removed: Object.keys(docs).length, orphans });
        }

        return res.status(400).json({ error: 'UNKNOWN_ACTION' });
    } catch (err: any) {
        console.error('[zhanotes-cloud] error:', err);
        const detail = authed ? String(err?.message || err).slice(0, 300) : 'Kesalahan server.';
        return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', detail });
    }
}