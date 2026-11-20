/**
 * api/__tests__/waReplyMedia.test.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Fase 5: aksi `reply_media` di /api/wa-inbox (kirim lampiran manual).
 * Jaringan Meta & Google di-mock lewat `fetch` global.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetGoogleDriveCacheForTests } from '../_lib/googleDrive.js';
import {
    getMetaRepliesUsed,
    getWaFullTranscript,
    getWaHistory,
    isPhonePaused,
    isWithinServiceWindow,
    resetWaMemoryStoreForTests,
    upsertInboxContact,
    WA_SERVICE_WINDOW_MS,
} from '../_lib/whatsappState.js';
import { waOutboundKindFromMime } from '../_lib/whatsappMedia.js';
import handler from '../wa-inbox.js';

const PIN = '654321';
const CLIENT = '6281399990000';
const PDF = Buffer.from('%PDF-1.4 fake isi');

const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { 'content-type': 'application/json' } });

function makeRes() {
    const res: any = { statusCode: 200, headers: {}, body: undefined };
    res.setHeader = (k: string, v: string) => { res.headers[k] = v; return res; };
    res.status = (c: number) => { res.statusCode = c; return res; };
    res.json = (b: unknown) => { res.body = b; return res; };
    res.end = () => res;
    return res;
}

function makeReq(body: Record<string, unknown>, pin: string | null = PIN) {
    const headers: Record<string, string> = {};
    if (pin !== null) headers['x-tts-usage-pin'] = pin;
    return { method: 'POST', headers, query: {}, body } as any;
}

function validBody(over: Record<string, unknown> = {}) {
    return {
        action: 'reply_media',
        phone: CLIENT,
        fileName: 'RAB_V1.pdf',
        mimeType: 'application/pdf',
        dataBase64: PDF.toString('base64'),
        ...over,
    };
}

interface NetOpts {
    uploadStatus?: number;
    sendStatus?: number;
    sendCode?: number;
    driveStatus?: number;
    /** Berkas yang sudah ada di Drive (jalur 5b). */
    driveFile?: { mime: string; body: Buffer };
}

function installNetwork(opts: NetOpts = {}) {
    const calls = { session: 0, sessionHeaders: undefined as Headers | undefined, sessionBody: undefined as any, upload: 0, send: 0, drive: 0, sendBody: undefined as any, uploadForm: undefined as FormData | undefined };
    const fn = vi.fn(async (input: unknown, init?: RequestInit) => {
        const url = String(input);
        if (url.endsWith('/media') && url.startsWith('https://graph.facebook.com/')) {
            calls.upload++;
            calls.uploadForm = init?.body as FormData;
            if (opts.uploadStatus) return json({ error: { code: 131053, message: 'upload fail' } }, opts.uploadStatus);
            return json({ id: 'META_MEDIA_ID_1' });
        }
        if (url.endsWith('/messages') && url.startsWith('https://graph.facebook.com/')) {
            calls.send++;
            calls.sendBody = JSON.parse(String(init?.body));
            if (opts.sendStatus) return json({ error: { code: opts.sendCode, message: 'send fail' } }, opts.sendStatus);
            return json({ messages: [{ id: 'wamid.OUT1' }] });
        }
        if (url.startsWith('https://oauth2.googleapis.com/token')) {
            return json({ access_token: 'ya29.fake', expires_in: 3600 });
        }
        if (url.includes('uploadType=resumable')) {
            calls.session++;
            calls.sessionHeaders = new Headers(init?.headers);
            calls.sessionBody = JSON.parse(String(init?.body));
            return new Response('{}', { status: 200, headers: { location: 'https://www.googleapis.com/upload/drive/v3/files?upload_id=SESSION1' } });
        }
        if (opts.driveFile && url.includes('/drive/v3/files/DRIVEBIG12345678')) {
            if (url.includes('alt=media')) return new Response(new Uint8Array(opts.driveFile.body), { status: 200 });
            return json({ id: 'DRIVEBIG12345678', name: 'x', mimeType: opts.driveFile.mime, size: String(opts.driveFile.body.length), webViewLink: 'https://drive.google.com/file/d/DRIVEBIG12345678/view' });
        }
        if (url.includes('/drive/v3/files') && !url.includes('/upload/') && (init?.method || 'GET') === 'GET') {
            return json({ files: [{ id: 'FOLDER1', name: 'WhatsApp-Bot-Media' }] });
        }
        if (url.includes('/upload/drive/v3/files')) {
            calls.drive++;
            if (opts.driveStatus) return json({ error: { message: 'quota' } }, opts.driveStatus);
            return json({ id: 'DRIVEOUT1234567', name: 'x', mimeType: 'application/pdf', size: String(PDF.length), webViewLink: 'https://drive.google.com/file/d/DRIVEOUT1234567/view' });
        }
        return json({}, 404);
    });
    vi.stubGlobal('fetch', fn);
    return calls;
}

async function seedInbound(minutesAgo = 5) {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.now() - minutesAgo * 60_000);
    await upsertInboxContact(CLIENT, 'Klien Uji', 'halo');
    vi.useRealTimers();
}

describe('reply_media (Fase 5)', () => {
    beforeEach(() => {
        resetWaMemoryStoreForTests();
        resetGoogleDriveCacheForTests();
        process.env.TTS_USAGE_PIN = PIN;
        process.env.WA_ACCESS_TOKEN = 'EAABtest';
        process.env.WA_PHONE_NUMBER_ID = '109876543210';
        process.env.GDRIVE_CLIENT_ID = 'cid';
        process.env.GDRIVE_CLIENT_SECRET = 'csecret';
        process.env.GDRIVE_REFRESH_TOKEN = 'rtoken';
    });
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.useRealTimers();
        for (const k of ['TTS_USAGE_PIN', 'WA_ACCESS_TOKEN', 'WA_PHONE_NUMBER_ID', 'GDRIVE_CLIENT_ID', 'GDRIVE_CLIENT_SECRET', 'GDRIVE_REFRESH_TOKEN', 'WA_MONTHLY_MESSAGE_LIMIT']) {
            delete process.env[k];
        }
    });

    it('menolak tanpa PIN (401) dan tidak menyentuh jaringan', async () => {
        const net = installNetwork();
        const res = makeRes();
        await handler(makeReq(validBody(), null), res);
        expect(res.statusCode).toBe(401);
        expect(net.upload + net.send).toBe(0);
    });

    it('sukses: upload Meta → kirim document dengan filename → arsip Drive → riwayat & pause', async () => {
        await seedInbound();
        const net = installNetwork();
        const res = makeRes();
        await handler(makeReq(validBody({ caption: 'Ini RAB-nya ya' })), res);

        expect(res.statusCode).toBe(200);
        expect(res.body).toMatchObject({ ok: true, messageId: 'wamid.OUT1', paused: true, archived: true });
        expect(net.upload).toBe(1);
        expect(net.uploadForm?.get('messaging_product')).toBe('whatsapp');
        expect(net.sendBody).toMatchObject({
            to: CLIENT,
            type: 'document',
            document: { id: 'META_MEDIA_ID_1', caption: 'Ini RAB-nya ya', filename: 'RAB_V1.pdf' },
        });
        expect(net.drive).toBe(1);

        const transcript = await getWaFullTranscript(CLIENT);
        const last = transcript[transcript.length - 1];
        expect(last.role).toBe('model');
        expect(last.parts[0].text).toContain('[Mas Arzha]:');
        expect(last.parts[0].text).toContain('Ini RAB-nya ya');
        expect(last.media?.[0].driveFileId).toBe('DRIVEOUT1234567');
        expect((await getWaHistory(CLIENT)).at(-1)?.media).toHaveLength(1);
        expect(await isPhonePaused(CLIENT)).toBe(true);
        expect(await getMetaRepliesUsed()).toBe(1);
    });

    it('gambar dikirim sebagai type image tanpa filename', async () => {
        await seedInbound();
        const net = installNetwork();
        const res = makeRes();
        await handler(makeReq(validBody({ fileName: 'foto.jpg', mimeType: 'image/jpeg', dataBase64: Buffer.from([0xff, 0xd8, 0xff, 0xe0]).toString('base64') })), res);
        expect(res.statusCode).toBe(200);
        expect(net.sendBody.type).toBe('image');
        expect(net.sendBody.image.filename).toBeUndefined();
    });

    it('di luar jendela 24 jam → 409 window_closed, tanpa upload & tanpa kuota terpakai', async () => {
        await seedInbound(25 * 60);
        const net = installNetwork();
        const res = makeRes();
        await handler(makeReq(validBody()), res);
        expect(res.statusCode).toBe(409);
        expect(res.body).toMatchObject({ code: 'window_closed' });
        expect(net.upload).toBe(0);
        expect(await getMetaRepliesUsed()).toBe(0);
    });

    it('tanpa catatan pesan masuk → 409 (jendela tak bisa dipastikan)', async () => {
        const net = installNetwork();
        const res = makeRes();
        await handler(makeReq(validBody()), res);
        expect(res.statusCode).toBe(409);
        expect(net.upload).toBe(0);
    });

    it('kuota habis → 429 tanpa upload', async () => {
        await seedInbound();
        process.env.WA_MONTHLY_MESSAGE_LIMIT = '0';
        const net = installNetwork();
        const res = makeRes();
        await handler(makeReq(validBody()), res);
        expect(res.statusCode).toBe(429);
        expect(net.upload).toBe(0);
    });

    it('upload Meta gagal → 502 dan kuota dikembalikan', async () => {
        await seedInbound();
        installNetwork({ uploadStatus: 400 });
        const res = makeRes();
        await handler(makeReq(validBody()), res);
        expect(res.statusCode).toBe(502);
        expect(res.body).toMatchObject({ code: 'meta_upload_failed' });
        expect(await getMetaRepliesUsed()).toBe(0);
    });

    it('kirim ditolak Meta 131047 → 409 window_closed dan kuota dikembalikan', async () => {
        await seedInbound();
        installNetwork({ sendStatus: 400, sendCode: 131047 });
        const res = makeRes();
        await handler(makeReq(validBody()), res);
        expect(res.statusCode).toBe(409);
        expect(res.body).toMatchObject({ code: 'window_closed' });
        expect(await getMetaRepliesUsed()).toBe(0);
    });

    it('arsip Drive gagal: pesan tetap sukses, riwayat memakai label teks', async () => {
        await seedInbound();
        installNetwork({ driveStatus: 500 });
        const res = makeRes();
        await handler(makeReq(validBody()), res);
        expect(res.statusCode).toBe(200);
        expect(res.body).toMatchObject({ ok: true, archived: false });
        const last = (await getWaFullTranscript(CLIENT)).at(-1)!;
        expect(last.media).toBeUndefined();
        expect(last.parts[0].text).toContain('[📄 Dokumen: RAB_V1.pdf]');
    });

    it('Drive belum dikonfigurasi: tetap terkirim', async () => {
        await seedInbound();
        delete process.env.GDRIVE_REFRESH_TOKEN;
        const net = installNetwork();
        const res = makeRes();
        await handler(makeReq(validBody()), res);
        expect(res.statusCode).toBe(200);
        expect(res.body).toMatchObject({ archived: false });
        expect(net.drive).toBe(0);
    });

    it('validasi: MIME tidak didukung 415, webp 415, terlalu besar 413, base64 rusak 400, audio+caption 400', async () => {
        await seedInbound();
        const net = installNetwork();
        const cases: Array<[Record<string, unknown>, number]> = [
            [{ mimeType: 'application/zip' }, 415],
            [{ mimeType: 'image/webp' }, 415],
            [{ dataBase64: 'A'.repeat(5 * 1024 * 1024) }, 413],
            [{ dataBase64: '###bukan-base64###' }, 400],
            [{ dataBase64: '' }, 400],
            [{ mimeType: 'audio/ogg; codecs=opus', caption: 'tidak boleh' }, 400],
            [{ caption: 'x'.repeat(1025) }, 400],
        ];
        for (const [over, status] of cases) {
            const res = makeRes();
            await handler(makeReq(validBody(over)), res);
            expect(res.statusCode, JSON.stringify(Object.keys(over))).toBe(status);
        }
        expect(net.upload + net.send).toBe(0);
        expect(await getMetaRepliesUsed()).toBe(0);
    });

    it('guard 131021: tidak mengirim ke nomor bot sendiri', async () => {
        await seedInbound();
        const net = installNetwork();
        const res = makeRes();
        await handler(makeReq(validBody({ phone: '15557499583' })), res);
        // jendela tak tercatat untuk nomor bot → ditolak sebelum jaringan
        expect(res.statusCode).toBe(409);
        expect(net.send).toBe(0);
    });
});

describe('Fase 5b: berkas besar via Drive & kuota teks', () => {
    beforeEach(() => {
        resetWaMemoryStoreForTests();
        resetGoogleDriveCacheForTests();
        process.env.TTS_USAGE_PIN = PIN;
        process.env.WA_ACCESS_TOKEN = 'EAABtest';
        process.env.WA_PHONE_NUMBER_ID = '109876543210';
        process.env.GDRIVE_CLIENT_ID = 'cid';
        process.env.GDRIVE_CLIENT_SECRET = 'csecret';
        process.env.GDRIVE_REFRESH_TOKEN = 'rtoken';
    });
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.useRealTimers();
        for (const k of ['TTS_USAGE_PIN', 'WA_ACCESS_TOKEN', 'WA_PHONE_NUMBER_ID', 'GDRIVE_CLIENT_ID', 'GDRIVE_CLIENT_SECRET', 'GDRIVE_REFRESH_TOKEN', 'WA_MONTHLY_MESSAGE_LIMIT']) {
            delete process.env[k];
        }
    });

    const prep = (over: Record<string, unknown> = {}) => ({
        action: 'prepare_upload', phone: CLIENT, fileName: 'Video Survey.mp4', mimeType: 'video/mp4', sizeBytes: 9 * 1024 * 1024, ...over,
    });

    it('prepare_upload: membuka sesi resumable dengan Origin & ukuran, mengembalikan sessionUrl', async () => {
        await seedInbound();
        const net = installNetwork();
        const res = makeRes();
        const req = makeReq(prep());
        req.headers.origin = 'https://arzhaning.my.id';
        await handler(req, res);
        expect(res.statusCode).toBe(200);
        expect(res.body).toMatchObject({ ok: true, kind: 'video', sessionUrl: 'https://www.googleapis.com/upload/drive/v3/files?upload_id=SESSION1' });
        expect(net.sessionHeaders?.get('origin')).toBe('https://arzhaning.my.id');
        expect(net.sessionHeaders?.get('x-upload-content-length')).toBe(String(9 * 1024 * 1024));
        expect(net.sessionBody.name).toMatch(/^\d{4}-\d{2}-\d{2}_\d{4}_6281399990000_keluar_Video Survey\.mp4$/);
        expect(net.send + net.upload).toBe(0);
    });

    it('prepare_upload: tolak di luar jendela 24 jam, terlalu besar per jenis, tipe salah, Drive belum ada', async () => {
        await seedInbound(25 * 60);
        let net = installNetwork();
        let res = makeRes();
        await handler(makeReq(prep()), res);
        expect(res.statusCode).toBe(409);
        expect(net.session).toBe(0);

        await seedInbound();
        net = installNetwork();
        const cases: Array<[Record<string, unknown>, number]> = [
            [{ mimeType: 'image/jpeg', sizeBytes: 6 * 1024 * 1024 }, 413], // gambar maks 5 MB
            [{ sizeBytes: 16 * 1024 * 1024 }, 413],                        // > WA_MEDIA_MAX_MB (15)
            [{ mimeType: 'application/zip' }, 415],
            [{ sizeBytes: 0 }, 400],
        ];
        for (const [over, status] of cases) {
            res = makeRes();
            await handler(makeReq(prep(over)), res);
            expect(res.statusCode, JSON.stringify(over)).toBe(status);
        }
        expect(net.session).toBe(0);

        delete process.env.GDRIVE_REFRESH_TOKEN;
        res = makeRes();
        await handler(makeReq(prep()), res);
        expect(res.statusCode).toBe(503);
    });

    it('reply_media via driveFileId: unduh dari Drive → Meta → kirim; tanpa arsip ulang', async () => {
        await seedInbound();
        const big = Buffer.alloc(4 * 1024 * 1024, 7);
        const net = installNetwork({ driveFile: { mime: 'video/mp4', body: big } });
        const res = makeRes();
        await handler(makeReq({ action: 'reply_media', phone: CLIENT, driveFileId: 'DRIVEBIG12345678', fileName: 'Video Survey.mp4', caption: 'Hasil survey' }), res);
        expect(res.statusCode).toBe(200);
        expect(res.body).toMatchObject({ ok: true, archived: true, attachment: { driveFileId: 'DRIVEBIG12345678', type: 'video' } });
        expect(net.sendBody).toMatchObject({ type: 'video', video: { id: 'META_MEDIA_ID_1', caption: 'Hasil survey' } });
        expect(net.drive).toBe(0);
        expect(await getMetaRepliesUsed()).toBe(1);
        const last = (await getWaFullTranscript(CLIENT)).at(-1)!;
        expect(last.media?.[0].driveFileId).toBe('DRIVEBIG12345678');
    });

    it('driveFileId: MIME dari Drive tidak didukung → 415; ID tidak valid → 400; di luar jendela → 409 tanpa unduh', async () => {
        await seedInbound();
        installNetwork({ driveFile: { mime: 'application/zip', body: Buffer.from('zip') } });
        let res = makeRes();
        await handler(makeReq({ action: 'reply_media', phone: CLIENT, driveFileId: 'DRIVEBIG12345678' }), res);
        expect(res.statusCode).toBe(415);

        res = makeRes();
        await handler(makeReq({ action: 'reply_media', phone: CLIENT, driveFileId: '../x' }), res);
        expect(res.statusCode).toBe(400);

        resetWaMemoryStoreForTests();
        const net = installNetwork({ driveFile: { mime: 'video/mp4', body: Buffer.from('v') } });
        res = makeRes();
        await handler(makeReq({ action: 'reply_media', phone: CLIENT, driveFileId: 'DRIVEBIG12345678' }), res);
        expect(res.statusCode).toBe(409);
        expect(net.upload).toBe(0);
    });

    it('balasan teks manual kini memakai kuota; habis → 429; gagal kirim → kuota dikembalikan', async () => {
        await seedInbound();
        installNetwork();
        let res = makeRes();
        await handler(makeReq({ action: 'reply', phone: CLIENT, message: 'Halo kak' }), res);
        expect(res.statusCode).toBe(200);
        expect(await getMetaRepliesUsed()).toBe(1);

        process.env.WA_MONTHLY_MESSAGE_LIMIT = '1';
        const net = installNetwork();
        res = makeRes();
        await handler(makeReq({ action: 'reply', phone: CLIENT, message: 'Lagi' }), res);
        expect(res.statusCode).toBe(429);
        expect(net.send).toBe(0);

        process.env.WA_MONTHLY_MESSAGE_LIMIT = '950';
        installNetwork({ sendStatus: 500 });
        res = makeRes();
        const before = await getMetaRepliesUsed();
        await handler(makeReq({ action: 'reply', phone: CLIENT, message: 'Gagal' }), res);
        expect(res.statusCode).toBe(502);
        expect(await getMetaRepliesUsed()).toBe(before);
    });
});

describe('helper Fase 5', () => {
    it('isWithinServiceWindow: batas 24 jam dengan margin 1 menit', () => {
        const now = 1_000_000_000_000;
        expect(isWithinServiceWindow(now - 60_000, now)).toBe(true);
        expect(isWithinServiceWindow(now - WA_SERVICE_WINDOW_MS + 30_000, now)).toBe(false);
        expect(isWithinServiceWindow(now - WA_SERVICE_WINDOW_MS - 1, now)).toBe(false);
        expect(isWithinServiceWindow(undefined, now)).toBe(false);
    });

    it('waOutboundKindFromMime: webp & zip ditolak, tipe lain dipetakan', () => {
        expect(waOutboundKindFromMime('image/webp')).toBeNull();
        expect(waOutboundKindFromMime('application/zip')).toBeNull();
        expect(waOutboundKindFromMime('image/png')).toBe('image');
        expect(waOutboundKindFromMime('application/pdf')).toBe('document');
        expect(waOutboundKindFromMime('audio/ogg; codecs=opus')).toBe('audio');
        expect(waOutboundKindFromMime('video/mp4')).toBe('video');
    });
});
