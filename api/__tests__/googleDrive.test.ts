/**
 * api/__tests__/googleDrive.test.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Pengujian klien Google Drive (OAuth refresh token, folder otomatis, upload multipart).
 * Seluruh panggilan jaringan di-mock lewat `fetch` global.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    GoogleDriveError,
    ensureMediaFolder,
    fetchDriveFileContent,
    getDriveFileMetadata,
    getGoogleDriveConfig,
    isGoogleDriveConfigured,
    resetGoogleDriveCacheForTests,
    uploadFileToDrive,
} from '../_lib/googleDrive.js';

const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

interface FakeDriveOptions {
    existingFolderId?: string;
    tokenError?: { status: number; body: unknown };
    permissionStatus?: number;
}

function makeFakeDrive(opts: FakeDriveOptions = {}) {
    const state = {
        tokenCalls: 0,
        listCalls: 0,
        folderCreates: 0,
        permissions: [] as unknown[],
        uploads: [] as Array<{ text: string; contentType: string }>,
        authHeaders: [] as string[],
    };

    const fn = vi.fn(async (input: unknown, init?: RequestInit) => {
        const url = String(input);
        const method = (init?.method || 'GET').toUpperCase();

        if (url.startsWith('https://oauth2.googleapis.com/token')) {
            state.tokenCalls++;
            if (opts.tokenError) return json(opts.tokenError.body, opts.tokenError.status);
            return json({ access_token: 'ya29.fake-token', expires_in: 3600 });
        }

        state.authHeaders.push(new Headers(init?.headers).get('authorization') || '');

        if (url.includes('/upload/drive/v3/files')) {
            const body = Buffer.from(init?.body as Uint8Array);
            state.uploads.push({
                text: body.toString('latin1'),
                contentType: new Headers(init?.headers).get('content-type') || '',
            });
            return json({
                id: 'FILEID1234567890',
                name: 'test.pdf',
                mimeType: 'application/pdf',
                size: String(body.length),
                webViewLink: 'https://drive.google.com/file/d/FILEID1234567890/view',
                thumbnailLink: 'https://lh3.googleusercontent.com/thumb',
            });
        }
        if (/\/drive\/v3\/files\/[^/?]+\/permissions/.test(url)) {
            state.permissions.push(JSON.parse(String(init?.body)));
            if (opts.permissionStatus && opts.permissionStatus >= 400) return json({ error: { message: 'nope' } }, opts.permissionStatus);
            return json({ id: 'perm1' });
        }
        if (method === 'GET' && url.includes('/drive/v3/files?q=')) {
            state.listCalls++;
            return json({ files: opts.existingFolderId ? [{ id: opts.existingFolderId }] : [] });
        }
        if (method === 'POST' && url.includes('/drive/v3/files?')) {
            state.folderCreates++;
            return json({ id: 'NEWFOLDERID123456', name: 'WhatsApp-Bot-Media' });
        }
        if (method === 'GET' && url.includes('alt=media')) {
            return new Response('ISI-FILE', { status: 200, headers: { 'content-type': 'application/pdf' } });
        }
        if (method === 'GET' && /\/drive\/v3\/files\/[A-Za-z0-9_-]+\?/.test(url)) {
            return json({ id: 'FILEID1234567890', name: 'a.pdf', mimeType: 'application/pdf', size: '42' });
        }
        return json({ error: { message: `tidak di-mock: ${url}` } }, 404);
    });

    vi.stubGlobal('fetch', fn);
    return { fn, state };
}

beforeEach(() => {
    resetGoogleDriveCacheForTests();
    vi.stubEnv('GDRIVE_CLIENT_ID', 'client-id');
    vi.stubEnv('GDRIVE_CLIENT_SECRET', 'client-secret');
    vi.stubEnv('GDRIVE_REFRESH_TOKEN', 'refresh-token');
    vi.stubEnv('GDRIVE_FOLDER_ID', '');
    vi.stubEnv('GDRIVE_FOLDER_NAME', '');
    vi.stubEnv('GDRIVE_SHARE_EMAIL', '');
});

afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
});

describe('konfigurasi Google Drive', () => {
    it('mendeteksi variabel yang belum diisi', () => {
        vi.stubEnv('GDRIVE_REFRESH_TOKEN', '');
        const cfg = getGoogleDriveConfig();
        expect(cfg.configured).toBe(false);
        expect(cfg.missing).toEqual(['GDRIVE_REFRESH_TOKEN']);
        expect(isGoogleDriveConfigured()).toBe(false);
    });

    it('membuang tanda kutip pembungkus & memakai nama folder default', () => {
        vi.stubEnv('GDRIVE_CLIENT_ID', '"abc"');
        const cfg = getGoogleDriveConfig();
        expect(cfg.clientId).toBe('abc');
        expect(cfg.folderName).toBe('WhatsApp-Bot-Media');
        expect(cfg.configured).toBe(true);
    });
});

describe('access token', () => {
    it('hanya refresh sekali untuk beberapa request berurutan (cache)', async () => {
        const { state } = makeFakeDrive({ existingFolderId: 'FOLDER123456789' });
        await uploadFileToDrive({ buffer: Buffer.from('a'), fileName: 'a.pdf', mimeType: 'application/pdf' });
        await uploadFileToDrive({ buffer: Buffer.from('b'), fileName: 'b.pdf', mimeType: 'application/pdf' });
        expect(state.tokenCalls).toBe(1);
        expect(state.authHeaders.every((h) => h === 'Bearer ya29.fake-token')).toBe(true);
    });

    it('melempar GoogleDriveError(invalid_grant) jika refresh token dicabut', async () => {
        makeFakeDrive({ tokenError: { status: 400, body: { error: 'invalid_grant', error_description: 'Token has been expired or revoked.' } } });
        await expect(ensureMediaFolder()).rejects.toMatchObject({
            name: 'GoogleDriveError',
            code: 'invalid_grant',
            status: 400,
        });
    });

    it('melempar not_configured bila env belum lengkap', async () => {
        vi.stubEnv('GDRIVE_CLIENT_SECRET', '');
        makeFakeDrive();
        await expect(ensureMediaFolder()).rejects.toMatchObject({ code: 'not_configured', status: 503 });
    });
});

describe('ensureMediaFolder', () => {
    it('memakai GDRIVE_FOLDER_ID tanpa memanggil jaringan', async () => {
        vi.stubEnv('GDRIVE_FOLDER_ID', 'EXPLICITFOLDER12345');
        const { fn } = makeFakeDrive();
        expect(await ensureMediaFolder()).toBe('EXPLICITFOLDER12345');
        expect(fn).not.toHaveBeenCalled();
    });

    it('memakai ulang folder yang sudah ada & men-cache hasilnya', async () => {
        const { state } = makeFakeDrive({ existingFolderId: 'EXISTINGFOLDER123' });
        expect(await ensureMediaFolder()).toBe('EXISTINGFOLDER123');
        expect(await ensureMediaFolder()).toBe('EXISTINGFOLDER123');
        expect(state.listCalls).toBe(1);
        expect(state.folderCreates).toBe(0);
    });

    it('membuat folder baru lalu membagikannya ke GDRIVE_SHARE_EMAIL', async () => {
        vi.stubEnv('GDRIVE_SHARE_EMAIL', 'jarzha@gmail.com');
        const { state } = makeFakeDrive();
        expect(await ensureMediaFolder()).toBe('NEWFOLDERID123456');
        expect(state.folderCreates).toBe(1);
        expect(state.permissions).toEqual([{ type: 'user', role: 'writer', emailAddress: 'jarzha@gmail.com' }]);
    });

    it('tidak menggagalkan pembuatan folder jika berbagi gagal', async () => {
        vi.stubEnv('GDRIVE_SHARE_EMAIL', 'jarzha@gmail.com');
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        makeFakeDrive({ permissionStatus: 403 });
        await expect(ensureMediaFolder()).resolves.toBe('NEWFOLDERID123456');
    });
});

describe('uploadFileToDrive', () => {
    it('mengirim multipart berisi metadata (nama + parent) dan biner file', async () => {
        const { state } = makeFakeDrive({ existingFolderId: 'FOLDER123456789' });
        const info = await uploadFileToDrive({
            buffer: Buffer.from('%PDF-ISI-BINER'),
            fileName: 'RAB.pdf',
            mimeType: 'application/pdf',
        });

        expect(state.uploads).toHaveLength(1);
        const up = state.uploads[0];
        expect(up.contentType).toMatch(/^multipart\/related; boundary=wa-drive-/);
        expect(up.text).toContain('"name":"RAB.pdf"');
        expect(up.text).toContain('"parents":["FOLDER123456789"]');
        expect(up.text).toContain('Content-Type: application/pdf');
        expect(up.text).toContain('%PDF-ISI-BINER');

        expect(info).toMatchObject({
            fileId: 'FILEID1234567890',
            mimeType: 'application/pdf',
            viewLink: 'https://drive.google.com/file/d/FILEID1234567890/view',
            thumbnailLink: 'https://lh3.googleusercontent.com/thumb',
        });
        expect(info.sizeBytes).toBeGreaterThan(0);
    });

    it('menolak buffer kosong & nama kosong', async () => {
        makeFakeDrive();
        await expect(uploadFileToDrive({ buffer: Buffer.alloc(0), fileName: 'a', mimeType: 'text/plain' })).rejects.toMatchObject({ code: 'empty_file' });
        await expect(uploadFileToDrive({ buffer: Buffer.from('x'), fileName: '  ', mimeType: 'text/plain' })).rejects.toMatchObject({ code: 'empty_name' });
    });
});

describe('metadata & konten', () => {
    it('menolak ID file yang tidak valid sebelum memanggil jaringan', async () => {
        const { fn } = makeFakeDrive();
        await expect(getDriveFileMetadata('../../etc/passwd')).rejects.toBeInstanceOf(GoogleDriveError);
        await expect(fetchDriveFileContent('x')).rejects.toMatchObject({ code: 'invalid_file_id' });
        expect(fn).not.toHaveBeenCalled();
    });

    it('membaca metadata & membuka stream konten', async () => {
        makeFakeDrive();
        const meta = await getDriveFileMetadata('FILEID1234567890');
        expect(meta).toMatchObject({ fileId: 'FILEID1234567890', sizeBytes: 42 });

        const res = await fetchDriveFileContent('FILEID1234567890');
        expect(await res.text()).toBe('ISI-FILE');
    });
});
