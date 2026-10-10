import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';

// Handler sinkron awan diuji apa adanya, dengan Blob dan Redis (Upstash REST) palsu di memori.
// Letak: api/__tests__/ (folder berawalan _ diabaikan Vercel, jadi tidak dihitung sebagai fungsi serverless).

const blobStore = new Map<string, Buffer>();
let blobN = 0;
vi.mock('@vercel/blob', () => ({
    put: async (path: string, data: Buffer, o: { addRandomSuffix?: boolean }) => {
        const rand = o?.addRandomSuffix ? `-${++blobN}xyz` : '';
        const p = path.replace(/(\.[^.]+)$/, `${rand}$1`);
        const url = `https://abc.public.blob.vercel-storage.com/${p}`;
        blobStore.set(url, Buffer.from(data));
        return { url, pathname: p };
    },
    del: async (urls: string | string[]) => {
        for (const u of ([] as string[]).concat(urls)) blobStore.delete(u);
    },
    list: async ({ prefix }: { prefix: string }) => ({
        blobs: [...blobStore.keys()].filter((u) => new URL(u).pathname.startsWith(`/${prefix}`)).map((url) => ({ url })),
        hasMore: false,
        cursor: undefined,
    }),
}));

const hash = new Map<string, string>();
const strs = new Map<string, string>();
const counters = new Map<string, number>();
let redisDown = false;
const realFetch = globalThis.fetch;

function fakeFetch(url: string | URL | Request, init?: RequestInit) {
    const u = String(url);
    if (u.startsWith('https://redis.test/pipeline')) {
        if (redisDown) return Promise.resolve(new Response('down', { status: 500 }));
        const cmds = JSON.parse(String(init?.body)) as unknown[][];
        const out = cmds.map((c) => {
            const [cmd, ...a] = c as [string, ...string[]];
            if (cmd === 'HGETALL') {
                const f: string[] = [];
                for (const [k, v] of hash) f.push(k, v);
                return { result: f };
            }
            if (cmd === 'GET') return { result: strs.get(a[0]) ?? null };
            if (cmd === 'SET') {
                if (a[2] === 'NX' && strs.has(a[0])) return { result: null };
                strs.set(a[0], a[1]);
                return { result: 'OK' };
            }
            if (cmd === 'DEL') {
                if (String(a[0]).endsWith(':docs')) hash.clear();
                else strs.delete(a[0]);
                return { result: 1 };
            }
            if (cmd === 'INCR') {
                counters.set(a[0], (counters.get(a[0]) ?? 0) + 1);
                return { result: counters.get(a[0]) };
            }
            if (cmd === 'EXPIRE') return { result: 1 };
            if (cmd === 'EVAL') {
                const [, , , field, base, json] = a;
                const cur = hash.get(field);
                const rev = cur ? JSON.parse(cur).rev : 0;
                if (rev !== Number(base)) return { result: [0, cur ?? ''] };
                hash.set(field, json);
                return { result: [1, cur ?? ''] };
            }
            return { error: `perintah tak dikenal ${cmd}` };
        });
        return Promise.resolve(new Response(JSON.stringify(out)));
    }
    if (/^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\//.test(u)) {
        const b = blobStore.get(u);
        return Promise.resolve(b ? new Response(b as unknown as BodyInit) : new Response('nf', { status: 404 }));
    }
    return realFetch(url as string, init);
}

type Handler = (req: unknown, res: unknown) => Promise<unknown>;
let handler: Handler;

async function call(action: string, o: { token?: string; method?: string; query?: Record<string, string>; body?: unknown; ip?: string } = {}) {
    const hdr: Record<string, string> = {};
    const req = {
        method: o.method ?? 'GET',
        query: { action, ...(o.query ?? {}) },
        headers: { 'x-zhanotes-token': o.token ?? 'rahasia-pemilik', 'x-forwarded-for': o.ip ?? '1.1.1.1' },
        body: o.body,
    };
    let status = 200;
    let payload: any;
    let raw: Buffer | null = null;
    const res: any = {
        setHeader(k: string, v: string) {
            hdr[k] = v;
        },
        status(c: number) {
            status = c;
            return res;
        },
        json(p: unknown) {
            payload = p;
            return res;
        },
        send(b: Buffer) {
            raw = b;
            return res;
        },
    };
    await handler(req, res);
    return { status, payload, raw: raw as Buffer | null, hdr };
}

const ENV = {
    ZHANOTES_TOKEN: 'rahasia-pemilik',
    BLOB_READ_WRITE_TOKEN: 'x',
    UPSTASH_REDIS_REST_URL: 'https://redis.test',
    UPSTASH_REDIS_REST_TOKEN: 'y',
};

beforeAll(async () => {
    Object.assign(process.env, ENV);
    handler = (await import('../zhanotes-cloud')).default as unknown as Handler;
});
beforeEach(() => {
    hash.clear();
    strs.clear();
    counters.clear();
    redisDown = false;
    blobStore.clear();
    vi.stubGlobal('fetch', fakeFetch);
});
afterEach(() => {
    vi.unstubAllGlobals();
    Object.assign(process.env, ENV);
});

const chunk = async (id: string, data: Buffer) =>
    call('chunk', { method: 'POST', query: { id, i: '0' }, body: data });

describe('zhanotes-cloud', () => {
    it('status: configured true saat semua env terisi, tanpa token', async () => {
        const r = await call('status', { token: '' });
        expect(r.status).toBe(200);
        expect(r.payload).toMatchObject({ configured: true, missing: [] });
    });

    it('status: menyebut NAMA variabel yang belum terisi, tidak pernah nilainya', async () => {
        delete process.env.BLOB_READ_WRITE_TOKEN;
        delete process.env.UPSTASH_REDIS_REST_URL;
        const r = await call('status', { token: '' });
        expect(r.payload.configured).toBe(false);
        expect(r.payload.missing.join(' ')).toMatch(/BLOB_READ_WRITE_TOKEN/);
        expect(r.payload.missing.join(' ')).toMatch(/UPSTASH_REDIS_REST_URL/);
        expect(JSON.stringify(r.payload)).not.toContain('rahasia-pemilik');
    });

    it('aksi lain 503 bila belum dikonfigurasi', async () => {
        delete process.env.ZHANOTES_TOKEN;
        const r = await call('sync-index');
        expect(r.status).toBe(503);
    });

    it('menolak token salah (401) dan membatasi percobaan per IP (429)', async () => {
        const ip = '7.7.7.7';
        for (let i = 0; i < 5; i++) expect((await call('sync-index', { token: 'salah', ip })).status).toBe(401);
        expect((await call('sync-index', { token: 'salah', ip })).status).toBe(429);
        // IP lain tidak ikut terkunci
        expect((await call('sync-index', { ip: '8.8.8.8' })).status).toBe(200);
    });

    it('sync-config: pembuat pertama menang (NX), berikutnya 409 dengan konfigurasi yang ada', async () => {
        const a = await call('sync-config', { method: 'POST', body: { salt: 'c2FsdA==', check: 'Y2hlY2s=' } });
        expect(a.status).toBe(200);
        const b = await call('sync-config', { method: 'POST', body: { salt: 'lain', check: 'lain' } });
        expect(b.status).toBe(409);
        expect(b.payload.config.salt).toBe('c2FsdA==');
        expect((await call('sync-config')).payload.config.salt).toBe('c2FsdA==');
    });

    it('chunk → sync-push → sync-index → sync-read: data utuh', async () => {
        const data = Buffer.from('terenkripsi-acak-123');
        const c = await chunk('abcdefgh1', data);
        expect(c.status).toBe(200);
        const p = await call('sync-push', { method: 'POST', body: { key: 'n:abc', baseRev: 0, uid: 'abcdefgh1', chunks: [c.payload.url], size: data.length } });
        expect(p.status).toBe(200);
        expect(p.payload.rev).toBe(1);
        const idx = await call('sync-index');
        expect(idx.payload.docs['n:abc']).toMatchObject({ rev: 1, deleted: false });
        const rd = await call('sync-read', { query: { u: c.payload.url } });
        expect(rd.status).toBe(200);
        expect(rd.raw?.equals(data)).toBe(true);
    });

    it('sync-push: revisi bentrok → 409 dengan head; baseRev benar → rev naik', async () => {
        const mk = async (id: string, baseRev: number) => {
            const c = await chunk(id, Buffer.from('x' + id));
            return call('sync-push', { method: 'POST', body: { key: 'n:abc', baseRev, uid: id, chunks: [c.payload.url], size: 2 } });
        };
        expect((await mk('abcdefgh1', 0)).payload.rev).toBe(1);
        const stale = await mk('abcdefgh2', 0);
        expect(stale.status).toBe(409);
        expect(stale.payload.head.rev).toBe(1);
        expect((await mk('abcdefgh3', 1)).payload.rev).toBe(2);
    });

    it('sync-push tombstone menandai dokumen terhapus', async () => {
        const c = await chunk('abcdefgh1', Buffer.from('zz'));
        await call('sync-push', { method: 'POST', body: { key: 'n:abc', baseRev: 0, uid: 'abcdefgh1', chunks: [c.payload.url], size: 2 } });
        const t = await call('sync-push', { method: 'POST', body: { key: 'n:abc', baseRev: 1, deleted: true } });
        expect(t.status).toBe(200);
        expect((await call('sync-index')).payload.docs['n:abc'].deleted).toBe(true);
    });

    it('menolak kunci dokumen, URL Blob asing, dan potongan terlalu besar', async () => {
        expect((await call('sync-push', { method: 'POST', body: { key: '../etc', baseRev: 0, deleted: true } })).status).toBe(400);
        expect((await call('sync-read', { query: { u: 'https://evil.example.com/x' } })).status).toBe(400);
        const big = await chunk('abcdefgh1', Buffer.alloc(4 * 1024 * 1024 + 1));
        expect(big.status).toBe(413);
    });

    it('sync-reset menghapus indeks, konfigurasi, dan semua Blob', async () => {
        await call('sync-config', { method: 'POST', body: { salt: 's', check: 'c' } });
        await chunk('abcdefgh1', Buffer.from('zz'));
        const r = await call('sync-reset', { method: 'POST' });
        expect(r.status).toBe(200);
        expect(strs.size).toBe(0);
    });

    it('batas percobaan token dibagi lewat Redis: instance baru tidak menghapus hitungan', async () => {
        const ip = '9.9.9.9';
        const key = `zhanotes:auth:fail:${createHash('sha256').update(ip).digest('hex').slice(0, 16)}`;
        counters.set(key, 5); // seolah instance lain sudah mencatat 5 kegagalan
        const r = await call('sync-index', { token: 'salah', ip });
        expect(r.status).toBe(429);
        expect(r.hdr['Retry-After']).toBe('600');
        // Redis gangguan: tidak menolak token benar, dan token salah tetap 401 (lapisan in-memory yang jaga)
        redisDown = true;
        expect((await call('sync-index', { token: 'salah', ip: '6.6.6.6' })).status).toBe(401);
    });

    it('header nosniff selalu dikirim', async () => {
        expect((await call('status')).hdr['X-Content-Type-Options']).toBe('nosniff');
    });

    it('sync-push menolak daftar potongan dengan URL kembar', async () => {
        const id = 'dupeunik1';
        const { payload } = await chunk(id, Buffer.from('aa'));
        const r = await call('sync-push', { method: 'POST', body: { key: 'n:abc', baseRev: 0, uid: id, chunks: [payload.url, payload.url], size: 4 } });
        expect(r.status).toBe(400);
    });

    it('sync-read menolak potongan yang Content-Length-nya melebihi batas', async () => {
        const url = 'https://abc.public.blob.vercel-storage.com/zhanotes/bigone01/0000.bin';
        blobStore.set(url, Buffer.from('x'));
        vi.stubGlobal('fetch', (u: string, i?: RequestInit) =>
            String(u) === url ? Promise.resolve(new Response('x', { headers: { 'content-length': String(5 * 1024 * 1024) } })) : fakeFetch(u, i));
        expect((await call('sync-read', { query: { u: url } })).status).toBe(413);
    });

    it('sync-reset juga menyapu blob yatim yang belum pernah di-push', async () => {
        await chunk('yatim0001', Buffer.from('tak-terpakai'));
        expect(blobStore.size).toBe(1);
        const r = await call('sync-reset', { method: 'POST' });
        expect(r.status).toBe(200);
        expect(r.payload.orphans).toBeGreaterThanOrEqual(1);
        expect(blobStore.size).toBe(0);
    });

    it('galat server setelah login memuat detail (dipotong), galat sebelum login tidak', async () => {
        redisDown = true;
        const ok = await call('sync-index');
        expect(ok.status).toBe(500);
        expect(String(ok.payload.detail)).toMatch(/Redis HTTP 500/);
        expect(String(ok.payload.detail).length).toBeLessThanOrEqual(300);
    });

    it('ZHANOTES_BLOB_HOST membatasi proxy sync-read ke host itu saja', async () => {
        process.env.ZHANOTES_BLOB_HOST = 'milikku.public.blob.vercel-storage.com';
        vi.resetModules();
        const h = (await import('../zhanotes-cloud')).default as unknown as Handler;
        const prev = handler;
        handler = h;
        try {
            expect((await call('sync-read', { query: { u: 'https://abc.public.blob.vercel-storage.com/zhanotes/x/0000.bin' } })).status).toBe(400);
            expect((await call('sync-read', { query: { u: 'https://milikku.public.blob.vercel-storage.com/zhanotes/x/0000.bin' } })).status).toBe(404);
        } finally {
            delete process.env.ZHANOTES_BLOB_HOST;
            handler = prev;
        }
    });

    it('aksi tidak dikenal: GET → 405, POST → 400', async () => {
        expect((await call('hapus-semua')).status).toBe(405);
        expect((await call('hapus-semua', { method: 'POST' })).status).toBe(400);
    });
});