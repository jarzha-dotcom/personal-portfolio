/**
 * api/__tests__/waMediaProxy.test.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Fase 4: proxy ber-PIN /api/wa-media (stream file Drive ke Inbox).
 * Jaringan Google di-mock lewat `fetch` global.
 */

import { Writable } from 'node:stream';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetGoogleDriveCacheForTests } from '../_lib/googleDrive.js';
import handler from '../wa-media.js';

const PIN = '654321';
const FILE_ID = 'FILEID1234567890';

interface FakeDriveFile {
    name: string;
    mimeType: string;
    body: Buffer;
}

function makeRes() {
    const chunks: Buffer[] = [];
    const res: any = new Writable({
        write(chunk, _enc, cb) {
            chunks.push(Buffer.from(chunk));
            cb();
        },
    });
    res.statusCode = 200;
    res.headers = {} as Record<string, string>;
    res.jsonBody = undefined;
    res.headersSent = false;
    res.setHeader = (k: string, v: string) => { res.headers[k.toLowerCase()] = String(v); return res; };
    res.removeHeader = (k: string) => { delete res.headers[k.toLowerCase()]; };
    res.status = (c: number) => { res.statusCode = c; return res; };
    res.json = (b: unknown) => {
        res.jsonBody = b;
        res.headers['content-type'] ??= 'application/json';
        res.end();
        return res;
    };
    res.getBody = () => Buffer.concat(chunks);
    res.done = new Promise<void>((resolve) => res.on('finish', () => resolve()));
    return res;
}

function makeReq(opts: { query?: Record<string, string>; pin?: string | null; method?: string; range?: string } = {}) {
    const headers: Record<string, string> = {};
    if (opts.pin !== null) headers['x-tts-usage-pin'] = opts.pin ?? PIN;
    if (opts.range) headers.range = opts.range;
    return { method: opts.method ?? 'GET', headers, query: opts.query ?? { id: FILE_ID } } as any;
}

function installFakeDrive(file: FakeDriveFile | null, opts: { metaStatus?: number } = {}) {
    const calls = { media: [] as Array<{ range: string | null }>, meta: 0 };
    const fn = vi.fn(async (input: unknown, init?: RequestInit) => {
        const url = String(input);
        if (url.startsWith('https://oauth2.googleapis.com/token')) {
            return new Response(JSON.stringify({ access_token: 'ya29.fake', expires_in: 3600 }), { status: 200 });
        }
        if (url.includes('alt=media')) {
            const range = new Headers(init?.headers).get('range');
            calls.media.push({ range });
            if (!file) return new Response(JSON.stringify({ error: { message: 'not found' } }), { status: 404 });
            if (range) {
                const m = /^bytes=(\d*)-(\d*)$/.exec(range)!;
                const start = Number(m[1] || 0);
                const end = m[2] ? Number(m[2]) : file.body.length - 1;
                const slice = file.body.subarray(start, end + 1);
                return new Response(new Uint8Array(slice), {
                    status: 206,
                    headers: {
                        'content-length': String(slice.length),
                        'content-range': `bytes ${start}-${end}/${file.body.length}`,
                    },
                });
            }
            return new Response(new Uint8Array(file.body), {
                status: 200,
                headers: { 'content-length': String(file.body.length) },
            });
        }
        if (url.includes('/drive/v3/files/')) {
            calls.meta++;
            if (opts.metaStatus || !file) {
                return new Response(JSON.stringify({ error: { message: 'File not found' } }), { status: opts.metaStatus ?? 404 });
            }
            return new Response(
                JSON.stringify({ id: FILE_ID, name: file.name, mimeType: file.mimeType, size: String(file.body.length) }),
                { status: 200 }
            );
        }
        return new Response('{}', { status: 404 });
    });
    vi.stubGlobal('fetch', fn);
    return calls;
}

describe('api/wa-media (proxy Drive ber-PIN)', () => {
    beforeEach(() => {
        resetGoogleDriveCacheForTests();
        process.env.TTS_USAGE_PIN = PIN;
        process.env.GDRIVE_CLIENT_ID = 'cid';
        process.env.GDRIVE_CLIENT_SECRET = 'csecret';
        process.env.GDRIVE_REFRESH_TOKEN = 'rtoken';
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        delete process.env.TTS_USAGE_PIN;
        delete process.env.GDRIVE_CLIENT_ID;
        delete process.env.GDRIVE_CLIENT_SECRET;
        delete process.env.GDRIVE_REFRESH_TOKEN;
    });

    it('menolak tanpa PIN / PIN salah (401) dan tidak menyentuh Drive', async () => {
        const calls = installFakeDrive({ name: 'a.jpg', mimeType: 'image/jpeg', body: Buffer.from('x') });
        const res1 = makeRes();
        await handler(makeReq({ pin: null }), res1);
        expect(res1.statusCode).toBe(401);
        const res2 = makeRes();
        await handler(makeReq({ pin: '000000' }), res2);
        expect(res2.statusCode).toBe(401);
        expect(calls.meta).toBe(0);
    });

    it('503 bila TTS_USAGE_PIN belum diset', async () => {
        delete process.env.TTS_USAGE_PIN;
        const res = makeRes();
        await handler(makeReq(), res);
        expect(res.statusCode).toBe(503);
    });

    it('menolak method selain GET/HEAD (405)', async () => {
        const res = makeRes();
        await handler(makeReq({ method: 'POST' }), res);
        expect(res.statusCode).toBe(405);
    });

    it('400 bila id kosong atau tidak valid', async () => {
        installFakeDrive(null);
        const r1 = makeRes();
        await handler(makeReq({ query: {} }), r1);
        expect(r1.statusCode).toBe(400);

        const r2 = makeRes();
        await handler(makeReq({ query: { id: '../../etc/passwd' } }), r2);
        expect(r2.statusCode).toBe(400);
    });

    it('men-stream gambar inline dengan header keamanan', async () => {
        const body = Buffer.from('JPEGDATA-1234567890');
        installFakeDrive({ name: '2026-11-21_0030_628123_foto.jpg', mimeType: 'image/jpeg', body });
        const res = makeRes();
        await handler(makeReq(), res);
        await res.done;

        expect(res.statusCode).toBe(200);
        expect(res.getBody().equals(body)).toBe(true);
        expect(res.headers['content-type']).toBe('image/jpeg');
        expect(res.headers['content-disposition']).toMatch(/^inline;/);
        expect(res.headers['x-content-type-options']).toBe('nosniff');
        expect(res.headers['content-security-policy']).toContain("default-src 'none'");
        expect(res.headers['cache-control']).toMatch(/^private/);
        expect(res.headers['accept-ranges']).toBe('bytes');
        expect(res.headers['content-length']).toBe(String(body.length));
    });

    it('PDF tampil inline, tetapi ?download=1 memaksa attachment', async () => {
        const body = Buffer.from('%PDF-1.4 fake');
        installFakeDrive({ name: 'RAB V1.pdf', mimeType: 'application/pdf', body });

        const r1 = makeRes();
        await handler(makeReq(), r1);
        await r1.done;
        expect(r1.headers['content-disposition']).toMatch(/^inline;/);

        const r2 = makeRes();
        await handler(makeReq({ query: { id: FILE_ID, download: '1' } }), r2);
        await r2.done;
        expect(r2.headers['content-disposition']).toMatch(/^attachment;/);
        expect(r2.headers['content-disposition']).toContain('filename*=UTF-8');
    });

    it('dokumen Office selalu attachment (tidak pernah inline)', async () => {
        installFakeDrive({
            name: 'Spesifikasi.docx',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            body: Buffer.from('PK-docx'),
        });
        const res = makeRes();
        await handler(makeReq(), res);
        await res.done;
        expect(res.headers['content-disposition']).toMatch(/^attachment;/);
    });

    it('meneruskan Range dan menjawab 206 dengan Content-Range', async () => {
        const body = Buffer.from('0123456789ABCDEFGHIJ');
        const calls = installFakeDrive({ name: 'klip.mp4', mimeType: 'video/mp4', body });
        const res = makeRes();
        await handler(makeReq({ range: 'bytes=5-9' }), res);
        await res.done;

        expect(calls.media[0].range).toBe('bytes=5-9');
        expect(res.statusCode).toBe(206);
        expect(res.getBody().toString()).toBe('56789');
        expect(res.headers['content-range']).toBe('bytes 5-9/20');
        expect(res.headers['content-length']).toBe('5');
    });

    it('416 untuk header Range yang tidak valid, tanpa memanggil Drive', async () => {
        const calls = installFakeDrive({ name: 'klip.mp4', mimeType: 'video/mp4', body: Buffer.from('abc') });
        for (const bad of ['bytes=0-1,5-9', 'items=0-1', 'bytes=-']) {
            const res = makeRes();
            await handler(makeReq({ range: bad }), res);
            expect(res.statusCode).toBe(416);
        }
        expect(calls.meta).toBe(0);
    });

    it('415 untuk MIME di luar whitelist (mis. HTML / SVG) dan tidak mengalirkan isi', async () => {
        const calls = installFakeDrive({ name: 'x.html', mimeType: 'text/html', body: Buffer.from('<script>alert(1)</script>') });
        const res = makeRes();
        await handler(makeReq(), res);
        expect(res.statusCode).toBe(415);
        expect(calls.media).toHaveLength(0);

        installFakeDrive({ name: 'x.svg', mimeType: 'image/svg+xml', body: Buffer.from('<svg/>') });
        const res2 = makeRes();
        await handler(makeReq(), res2);
        expect(res2.statusCode).toBe(415);
    });

    it('404 bila file tidak ada di Drive, tanpa header file yang bocor', async () => {
        installFakeDrive(null);
        const res = makeRes();
        await handler(makeReq(), res);
        expect(res.statusCode).toBe(404);
        expect(res.headers['content-disposition']).toBeUndefined();
    });

    it('502 dengan pesan jelas saat refresh token dicabut (invalid_grant)', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(async () => new Response(JSON.stringify({ error: 'invalid_grant', error_description: 'Token has been expired or revoked.' }), { status: 400 }))
        );
        const res = makeRes();
        await handler(makeReq(), res);
        expect(res.statusCode).toBe(502);
        expect(String((res.jsonBody as any).error)).toContain('google:auth');
    });

    it('503 bila Drive belum dikonfigurasi', async () => {
        delete process.env.GDRIVE_REFRESH_TOKEN;
        installFakeDrive(null);
        const res = makeRes();
        await handler(makeReq(), res);
        expect(res.statusCode).toBe(503);
    });

    it('HEAD hanya mengembalikan header (ukuran dari metadata), tanpa mengunduh isi', async () => {
        const body = Buffer.from('JPEGDATA');
        const calls = installFakeDrive({ name: 'a.jpg', mimeType: 'image/jpeg', body });
        const res = makeRes();
        await handler(makeReq({ method: 'HEAD' }), res);
        await res.done;
        expect(res.statusCode).toBe(200);
        expect(res.headers['content-length']).toBe(String(body.length));
        expect(calls.media).toHaveLength(0);
        expect(res.getBody().length).toBe(0);
    });
});
