/**
 * api/__tests__/whatsappMedia.test.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Pengujian jembatan media WhatsApp → Google Drive (unduh Buffer, whitelist MIME,
 * batas ukuran, nama file aman, arsip Drive, & toleransi kegagalan Drive).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetGoogleDriveCacheForTests } from '../_lib/googleDrive.js';
import {
    buildDriveFileName,
    buildMediaPreviewLabel,
    downloadWhatsAppMediaBuffer,
    extensionForMime,
    getWaMediaMaxBytes,
    processInboundMedia,
    sanitizeDriveFileName,
    waMediaKindFromMime,
} from '../_lib/whatsappMedia.js';

const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const MEDIA_URL = 'https://lookaside.fbsbx.com/whatsapp_business/attachments/?mid=1';

interface FakeOptions {
    mime?: string;
    fileSize?: number;
    mediaUrl?: string;
    binary?: Buffer;
    metaStatus?: number;
    driveUploadStatus?: number;
}

function installFakeNetwork(opts: FakeOptions = {}) {
    const calls: string[] = [];
    const binary = opts.binary ?? Buffer.from('%PDF-FAKE-ISI');
    const fn = vi.fn(async (input: unknown, init?: RequestInit) => {
        const url = String(input);
        calls.push(url);
        const method = (init?.method || 'GET').toUpperCase();

        if (url.startsWith('https://graph.facebook.com/')) {
            if (opts.metaStatus) return json({ error: {} }, opts.metaStatus);
            return json({
                url: opts.mediaUrl ?? MEDIA_URL,
                mime_type: opts.mime ?? 'application/pdf',
                file_size: opts.fileSize ?? binary.length,
            });
        }
        if (url.startsWith('https://lookaside.fbsbx.com/') || url.startsWith('https://evil.example.com/')) {
            return new Response(new Uint8Array(binary), { status: 200 });
        }
        if (url.startsWith('https://oauth2.googleapis.com/token')) {
            return json({ access_token: 'ya29.fake', expires_in: 3600 });
        }
        if (url.includes('/upload/drive/v3/files')) {
            if (opts.driveUploadStatus) return json({ error: { message: 'quota' } }, opts.driveUploadStatus);
            const body = Buffer.from(init?.body as Uint8Array).toString('latin1');
            const name = /"name":"([^"]+)"/.exec(body)?.[1] ?? 'x';
            return json({
                id: 'DRIVEFILE1234567890',
                name,
                mimeType: opts.mime ?? 'application/pdf',
                size: String(binary.length),
                webViewLink: 'https://drive.google.com/file/d/DRIVEFILE1234567890/view',
            });
        }
        if (method === 'GET' && url.includes('/drive/v3/files?q=')) return json({ files: [{ id: 'FOLDER123456789' }] });
        return json({ error: { message: `tidak di-mock: ${url}` } }, 404);
    });
    vi.stubGlobal('fetch', fn);
    return { fn, calls };
}

function enableDrive() {
    vi.stubEnv('GDRIVE_CLIENT_ID', 'client-id');
    vi.stubEnv('GDRIVE_CLIENT_SECRET', 'client-secret');
    vi.stubEnv('GDRIVE_REFRESH_TOKEN', 'refresh-token');
}

beforeEach(() => {
    resetGoogleDriveCacheForTests();
    vi.stubEnv('GDRIVE_CLIENT_ID', '');
    vi.stubEnv('GDRIVE_CLIENT_SECRET', '');
    vi.stubEnv('GDRIVE_REFRESH_TOKEN', '');
    vi.stubEnv('GDRIVE_FOLDER_ID', '');
    vi.stubEnv('GDRIVE_SHARE_EMAIL', '');
    vi.stubEnv('WA_MEDIA_MAX_MB', '');
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
});

describe('helper nama file & MIME', () => {
    it('sanitizeDriveFileName membuang karakter berbahaya & titik awal', () => {
        const traversal = sanitizeDriveFileName('../../etc/passwd');
        expect(traversal).toBe('_.._etc_passwd');
        expect(traversal).not.toMatch(/[\\/]/);
        expect(sanitizeDriveFileName('.hidden.pdf')).toBe('hidden.pdf');
        expect(sanitizeDriveFileName('  RAB: v1?.pdf ')).toBe('RAB_ v1_.pdf');
        expect(sanitizeDriveFileName('\u0000\u0007')).toBe('berkas');
        expect(sanitizeDriveFileName(undefined, 'dokumen')).toBe('dokumen');
    });

    it('sanitizeDriveFileName memotong nama panjang tapi mempertahankan ekstensi', () => {
        const out = sanitizeDriveFileName('a'.repeat(300) + '.pdf');
        expect(out.length).toBe(100);
        expect(out.endsWith('.pdf')).toBe(true);
    });

    it('buildDriveFileName memakai jam WIB, nomor, dan menambah ekstensi dari MIME', () => {
        // 2026-11-20T17:30:00Z → 21 Nov 2026 00:30 WIB
        const now = Date.UTC(2026, 10, 20, 17, 30, 0);
        expect(buildDriveFileName({ phone: '+62 812-3456', fileName: 'foto', mimeType: 'image/jpeg', now })).toBe(
            '2026-11-21_0030_628123456_foto.jpg'
        );
        expect(buildDriveFileName({ phone: '6281', fileName: 'RAB.pdf', mimeType: 'application/pdf', now })).toBe(
            '2026-11-21_0030_6281_RAB.pdf'
        );
    });

    it('waMediaKindFromMime & extensionForMime mengikuti whitelist (parameter codec diabaikan)', () => {
        expect(waMediaKindFromMime('image/jpeg')).toBe('image');
        expect(waMediaKindFromMime('audio/ogg; codecs=opus')).toBe('audio');
        expect(waMediaKindFromMime('application/pdf')).toBe('document');
        expect(waMediaKindFromMime('video/mp4')).toBe('video');
        expect(waMediaKindFromMime('application/x-msdownload')).toBeNull();
        expect(extensionForMime('audio/ogg; codecs=opus')).toBe('ogg');
        expect(extensionForMime('application/zip')).toBe('bin');
    });

    it('buildMediaPreviewLabel', () => {
        expect(buildMediaPreviewLabel('image')).toBe('[📷 Foto]');
        expect(buildMediaPreviewLabel('video')).toBe('[🎥 Video]');
        expect(buildMediaPreviewLabel('audio')).toBe('[🎤 Audio]');
        expect(buildMediaPreviewLabel('document', 'RAB.pdf')).toBe('[📄 Dokumen: RAB.pdf]');
    });

    it('getWaMediaMaxBytes: default 15 MB, dapat diatur & dibatasi 1–25 MB', () => {
        expect(getWaMediaMaxBytes()).toBe(15 * 1024 * 1024);
        vi.stubEnv('WA_MEDIA_MAX_MB', '8');
        expect(getWaMediaMaxBytes()).toBe(8 * 1024 * 1024);
        vi.stubEnv('WA_MEDIA_MAX_MB', '999');
        expect(getWaMediaMaxBytes()).toBe(25 * 1024 * 1024);
    });
});

describe('downloadWhatsAppMediaBuffer', () => {
    it('mengunduh media sebagai Buffer', async () => {
        installFakeNetwork();
        const r = await downloadWhatsAppMediaBuffer('TOKEN', 'MEDIAID12345');
        expect(r.ok).toBe(true);
        if (r.ok) {
            expect(r.mimeType).toBe('application/pdf');
            expect(r.buffer.toString()).toBe('%PDF-FAKE-ISI');
            expect(r.sizeBytes).toBe(r.buffer.length);
        }
    });

    it('menolak media ID tidak valid tanpa jaringan', async () => {
        const { fn } = installFakeNetwork();
        expect(await downloadWhatsAppMediaBuffer('TOKEN', '../x')).toMatchObject({ ok: false, reason: 'invalid_media_id' });
        expect(await downloadWhatsAppMediaBuffer('', 'MEDIAID12345')).toMatchObject({ ok: false, reason: 'invalid_media_id' });
        expect(fn).not.toHaveBeenCalled();
    });

    it('menolak host unduhan yang tidak tepercaya', async () => {
        const { calls } = installFakeNetwork({ mediaUrl: 'https://evil.example.com/steal' });
        expect(await downloadWhatsAppMediaBuffer('TOKEN', 'MEDIAID12345')).toMatchObject({ ok: false, reason: 'untrusted_url' });
        expect(calls.some((u) => u.includes('evil.example.com'))).toBe(false);
    });

    it('menolak tipe MIME di luar whitelist sebelum mengunduh biner', async () => {
        const { calls } = installFakeNetwork({ mime: 'application/x-msdownload' });
        expect(await downloadWhatsAppMediaBuffer('TOKEN', 'MEDIAID12345')).toMatchObject({ ok: false, reason: 'unsupported_type' });
        expect(calls.some((u) => u.startsWith('https://lookaside'))).toBe(false);
    });

    it('menolak file di atas batas (berdasarkan metadata maupun isi sebenarnya)', async () => {
        installFakeNetwork({ fileSize: 20 * 1024 * 1024 });
        expect(await downloadWhatsAppMediaBuffer('TOKEN', 'MEDIAID12345')).toMatchObject({ ok: false, reason: 'too_large' });

        // Metadata berbohong (kecil), isi sebenarnya melebihi batas 1 KB
        installFakeNetwork({ fileSize: 10, binary: Buffer.alloc(2048, 1) });
        expect(await downloadWhatsAppMediaBuffer('TOKEN', 'MEDIAID12345', { maxBytes: 1024 })).toMatchObject({
            ok: false,
            reason: 'too_large',
        });
    });

    it('melaporkan error metadata Meta', async () => {
        installFakeNetwork({ metaStatus: 404 });
        expect(await downloadWhatsAppMediaBuffer('TOKEN', 'MEDIAID12345')).toMatchObject({
            ok: false,
            reason: 'meta_metadata_error',
            detail: 'HTTP 404',
        });
    });
});

describe('processInboundMedia', () => {
    const base = { accessToken: 'TOKEN', mediaId: 'MEDIAID12345', senderPhone: '628123456789' };

    it('mengarsipkan ke Drive dan membangun WaMediaAttachment', async () => {
        enableDrive();
        installFakeNetwork();
        const r = await processInboundMedia({ ...base, fileName: 'Spesifikasi.pdf', caption: ' Mohon dicek ' });

        expect(r.ok).toBe(true);
        if (!r.ok) return;
        expect(r.driveError).toBeUndefined();
        expect(r.kind).toBe('document');
        expect(r.buffer.length).toBeGreaterThan(0);
        expect(r.attachment).toMatchObject({
            type: 'document',
            driveFileId: 'DRIVEFILE1234567890',
            driveViewLink: 'https://drive.google.com/file/d/DRIVEFILE1234567890/view',
            fileName: 'Spesifikasi.pdf',
            mimeType: 'application/pdf',
            caption: 'Mohon dicek',
        });
    });

    it('nama file di Drive memuat nomor pengirim & nama asli', async () => {
        enableDrive();
        const { fn } = installFakeNetwork();
        await processInboundMedia({ ...base, fileName: 'Spesifikasi.pdf' });
        const upload = fn.mock.calls.find(([u]) => String(u).includes('/upload/drive/v3/files'))!;
        const body = Buffer.from((upload[1] as RequestInit).body as Uint8Array).toString('latin1');
        expect(body).toMatch(/"name":"\d{4}-\d{2}-\d{2}_\d{4}_628123456789_Spesifikasi\.pdf"/);
    });

    it('tetap mengembalikan Buffer saat Drive belum dikonfigurasi', async () => {
        installFakeNetwork();
        const r = await processInboundMedia(base);
        expect(r.ok).toBe(true);
        if (r.ok) {
            expect(r.attachment).toBeUndefined();
            expect(r.driveError).toMatch(/belum dikonfigurasi/);
            expect(r.buffer.length).toBeGreaterThan(0);
        }
    });

    it('tetap mengembalikan Buffer saat upload Drive gagal', async () => {
        enableDrive();
        installFakeNetwork({ driveUploadStatus: 403 });
        const r = await processInboundMedia(base);
        expect(r.ok).toBe(true);
        if (r.ok) {
            expect(r.attachment).toBeUndefined();
            expect(r.driveError).toMatch(/quota/);
            expect(r.buffer.length).toBeGreaterThan(0);
        }
    });

    it('meneruskan kegagalan unduhan apa adanya', async () => {
        enableDrive();
        installFakeNetwork({ mime: 'application/zip' });
        expect(await processInboundMedia(base)).toMatchObject({ ok: false, reason: 'unsupported_type' });
    });
});
