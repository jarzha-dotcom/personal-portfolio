/**
 * api/_lib/googleDrive.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Klien ringan Google Drive API v3 (native `fetch`, tanpa library `googleapis`)
 * untuk mengarsipkan lampiran WhatsApp ke akun Google KHUSUS.
 *
 * Autentikasi: OAuth2 refresh token milik akun Gmail khusus tersebut.
 *   (Service Account TIDAK dipakai: ia tidak punya kuota storage pada My Drive
 *    Gmail biasa, sehingga upload gagal dengan "Service Accounts do not have
 *    storage quota".)
 *
 * Scope: `drive.file` — backend hanya bisa menyentuh file/folder yang dibuatnya
 * sendiri. Folder media dicari/dibuat otomatis berdasarkan nama, lalu (opsional)
 * dibagikan ke email pribadi pemilik agar bisa dibuka dari HP.
 *
 * Env:
 *   GDRIVE_CLIENT_ID, GDRIVE_CLIENT_SECRET, GDRIVE_REFRESH_TOKEN   (wajib)
 *   GDRIVE_FOLDER_NAME   (default "WhatsApp-Bot-Media")
 *   GDRIVE_FOLDER_ID     (opsional; hanya valid jika folder dibuat oleh OAuth client yang sama)
 *   GDRIVE_SHARE_EMAIL   (opsional; diberi akses Editor saat folder dibuat)
 */

import { randomBytes } from 'node:crypto';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3';
const FOLDER_MIME = 'application/vnd.google-apps.folder';
const DEFAULT_FOLDER_NAME = 'WhatsApp-Bot-Media';
const REQUEST_TIMEOUT_MS = 25000;
const TOKEN_SAFETY_MARGIN_MS = 60_000;
const FILE_FIELDS = 'id,name,mimeType,size,webViewLink,webContentLink,thumbnailLink,createdTime';
const DRIVE_FILE_ID_RE = /^[A-Za-z0-9_-]{10,128}$/;

// ── Tipe ─────────────────────────────────────────────────────────────────────

export class GoogleDriveError extends Error {
    readonly status: number;
    readonly code?: string;

    constructor(message: string, status: number, code?: string) {
        super(message);
        this.name = 'GoogleDriveError';
        this.status = status;
        this.code = code;
    }
}

export interface DriveFileInfo {
    fileId: string;
    fileName: string;
    mimeType: string;
    sizeBytes?: number;
    viewLink: string;
    downloadLink?: string;
    /** Thumbnail dibuat Google secara asinkron & berumur pendek; bisa kosong tepat setelah upload. */
    thumbnailLink?: string;
    createdTime?: string;
}

export interface GoogleDriveConfig {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
    folderId: string;
    folderName: string;
    shareEmail: string;
    configured: boolean;
    missing: string[];
}

// ── Konfigurasi ──────────────────────────────────────────────────────────────

function stripOuterQuotes(val: string): string {
    const t = val.trim();
    if ((t.startsWith("'") && t.endsWith("'")) || (t.startsWith('"') && t.endsWith('"'))) {
        return t.slice(1, -1).trim();
    }
    return t;
}

export function getGoogleDriveConfig(): GoogleDriveConfig {
    const clientId = stripOuterQuotes(process.env.GDRIVE_CLIENT_ID || '');
    const clientSecret = stripOuterQuotes(process.env.GDRIVE_CLIENT_SECRET || '');
    const refreshToken = stripOuterQuotes(process.env.GDRIVE_REFRESH_TOKEN || '');
    const folderId = stripOuterQuotes(process.env.GDRIVE_FOLDER_ID || '');
    const folderName = stripOuterQuotes(process.env.GDRIVE_FOLDER_NAME || '') || DEFAULT_FOLDER_NAME;
    const shareEmail = stripOuterQuotes(process.env.GDRIVE_SHARE_EMAIL || '');

    const missing: string[] = [];
    if (!clientId) missing.push('GDRIVE_CLIENT_ID');
    if (!clientSecret) missing.push('GDRIVE_CLIENT_SECRET');
    if (!refreshToken) missing.push('GDRIVE_REFRESH_TOKEN');

    return {
        clientId,
        clientSecret,
        refreshToken,
        folderId,
        folderName,
        shareEmail,
        configured: missing.length === 0,
        missing,
    };
}

export function isGoogleDriveConfigured(): boolean {
    return getGoogleDriveConfig().configured;
}

// ── Cache modul (bertahan selama instance serverless hangat) ─────────────────

let cachedToken: { value: string; expiresAt: number } | null = null;
let cachedFolderId: string | null = null;

export function resetGoogleDriveCacheForTests(): void {
    cachedToken = null;
    cachedFolderId = null;
}

// ── Util HTTP ────────────────────────────────────────────────────────────────

async function fetchWithTimeout(url: string, init: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
        return await fetch(url, { ...init, signal: controller.signal });
    } catch (err) {
        const aborted = err instanceof Error && err.name === 'AbortError';
        throw new GoogleDriveError(
            aborted ? 'Permintaan ke Google Drive timeout.' : `Gagal menghubungi Google: ${err instanceof Error ? err.message : String(err)}`,
            aborted ? 504 : 502
        );
    } finally {
        clearTimeout(timer);
    }
}

async function readGoogleError(res: Response): Promise<{ message: string; code?: string }> {
    const data = (await res.json().catch(() => ({}))) as {
        error?: string | { message?: string; status?: string; errors?: Array<{ reason?: string }> };
        error_description?: string;
    };
    if (typeof data.error === 'string') {
        return { message: data.error_description || data.error, code: data.error };
    }
    return {
        message: data.error?.message || `HTTP ${res.status}`,
        code: data.error?.errors?.[0]?.reason || data.error?.status,
    };
}

// ── Autentikasi ──────────────────────────────────────────────────────────────

/**
 * Menukar refresh token dengan access token (di-cache sampai ±1 menit sebelum kedaluwarsa).
 * Melempar GoogleDriveError(code: 'invalid_grant') jika refresh token dicabut/kedaluwarsa.
 */
export async function getGoogleDriveAccessToken(): Promise<string> {
    if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value;

    const cfg = getGoogleDriveConfig();
    if (!cfg.configured) {
        throw new GoogleDriveError(`Google Drive belum dikonfigurasi (kurang: ${cfg.missing.join(', ')}).`, 503, 'not_configured');
    }

    const res = await fetchWithTimeout(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: cfg.clientId,
            client_secret: cfg.clientSecret,
            refresh_token: cfg.refreshToken,
            grant_type: 'refresh_token',
        }).toString(),
    });

    if (!res.ok) {
        const err = await readGoogleError(res);
        throw new GoogleDriveError(`Gagal refresh token Google: ${err.message}`, res.status, err.code);
    }

    const data = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!data.access_token) {
        throw new GoogleDriveError('Respons token Google tidak berisi access_token.', 502);
    }

    const ttlMs = Math.max(30, Number(data.expires_in) || 3600) * 1000;
    cachedToken = { value: data.access_token, expiresAt: Date.now() + ttlMs - TOKEN_SAFETY_MARGIN_MS };
    return cachedToken.value;
}

/** Request ber-token; 401 sekali → buang cache token lalu coba ulang. */
async function driveRequest(url: string, init: RequestInit = {}): Promise<Response> {
    for (let attempt = 0; attempt < 2; attempt++) {
        const token = await getGoogleDriveAccessToken();
        const res = await fetchWithTimeout(url, {
            ...init,
            headers: { ...(init.headers as Record<string, string> | undefined), Authorization: `Bearer ${token}` },
        });
        if (res.status === 401 && attempt === 0) {
            cachedToken = null;
            continue;
        }
        return res;
    }
    throw new GoogleDriveError('Autentikasi Google Drive gagal.', 401);
}

async function driveJson<T>(url: string, init: RequestInit = {}): Promise<T> {
    const res = await driveRequest(url, init);
    if (!res.ok) {
        const err = await readGoogleError(res);
        throw new GoogleDriveError(`Google Drive error: ${err.message}`, res.status, err.code);
    }
    return (await res.json()) as T;
}

// ── Folder ───────────────────────────────────────────────────────────────────

function escapeDriveQueryValue(v: string): string {
    return v.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/**
 * Mengembalikan ID folder media. Urutan: GDRIVE_FOLDER_ID → cache → cari berdasarkan
 * nama → buat baru (+ bagikan ke GDRIVE_SHARE_EMAIL bila diisi).
 */
export async function ensureMediaFolder(): Promise<string> {
    const cfg = getGoogleDriveConfig();
    if (cfg.folderId) return cfg.folderId;
    if (cachedFolderId) return cachedFolderId;

    const q = `name='${escapeDriveQueryValue(cfg.folderName)}' and mimeType='${FOLDER_MIME}' and trashed=false and 'root' in parents`;
    const listUrl =
        `${DRIVE_API_URL}/files?q=${encodeURIComponent(q)}` +
        `&fields=${encodeURIComponent('files(id,name)')}&orderBy=createdTime&pageSize=1&spaces=drive`;
    const found = await driveJson<{ files?: Array<{ id: string }> }>(listUrl);
    if (found.files?.[0]?.id) {
        cachedFolderId = found.files[0].id;
        return cachedFolderId;
    }

    const created = await driveJson<{ id: string }>(`${DRIVE_API_URL}/files?fields=${encodeURIComponent('id,name')}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify({ name: cfg.folderName, mimeType: FOLDER_MIME }),
    });
    cachedFolderId = created.id;

    if (cfg.shareEmail) {
        try {
            await driveJson(
                `${DRIVE_API_URL}/files/${encodeURIComponent(created.id)}/permissions?sendNotificationEmail=false`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
                    body: JSON.stringify({ type: 'user', role: 'writer', emailAddress: cfg.shareEmail }),
                }
            );
        } catch (err) {
            // Berbagi folder bersifat nilai tambah; jangan gagalkan upload.
            console.warn('[googleDrive] Gagal membagikan folder ke GDRIVE_SHARE_EMAIL (diabaikan):', err);
        }
    }

    return created.id;
}

// ── Upload & Metadata ────────────────────────────────────────────────────────

interface RawDriveFile {
    id: string;
    name?: string;
    mimeType?: string;
    size?: string;
    webViewLink?: string;
    webContentLink?: string;
    thumbnailLink?: string;
    createdTime?: string;
}

function toDriveFileInfo(raw: RawDriveFile, fallbackName: string, fallbackMime: string): DriveFileInfo {
    const sizeNum = raw.size !== undefined ? Number(raw.size) : NaN;
    return {
        fileId: raw.id,
        fileName: raw.name || fallbackName,
        mimeType: raw.mimeType || fallbackMime,
        sizeBytes: Number.isFinite(sizeNum) ? sizeNum : undefined,
        viewLink: raw.webViewLink || `https://drive.google.com/file/d/${raw.id}/view`,
        downloadLink: raw.webContentLink,
        thumbnailLink: raw.thumbnailLink,
        createdTime: raw.createdTime,
    };
}

/**
 * Mengunggah buffer ke folder media (multipart upload, cocok untuk file ≤ ±25 MB).
 */
export async function uploadFileToDrive(params: {
    buffer: Buffer;
    fileName: string;
    mimeType: string;
    folderId?: string;
    description?: string;
}): Promise<DriveFileInfo> {
    if (!params.buffer || params.buffer.length === 0) {
        throw new GoogleDriveError('Isi file kosong.', 400, 'empty_file');
    }
    const fileName = params.fileName.trim();
    if (!fileName) throw new GoogleDriveError('Nama file kosong.', 400, 'empty_name');

    const folderId = params.folderId || (await ensureMediaFolder());
    const boundary = `wa-drive-${randomBytes(12).toString('hex')}`;
    const metadata = {
        name: fileName,
        parents: [folderId],
        ...(params.description ? { description: params.description.slice(0, 500) } : {}),
    };

    const payload = Buffer.concat([
        Buffer.from(
            `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
                `--${boundary}\r\nContent-Type: ${params.mimeType}\r\n\r\n`,
            'utf8'
        ),
        params.buffer,
        Buffer.from(`\r\n--${boundary}--`, 'utf8'),
    ]);

    const raw = await driveJson<RawDriveFile>(
        `${DRIVE_UPLOAD_URL}/files?uploadType=multipart&fields=${encodeURIComponent(FILE_FIELDS)}`,
        {
            method: 'POST',
            headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
            body: new Uint8Array(payload),
        }
    );

    return toDriveFileInfo(raw, fileName, params.mimeType);
}

function assertValidFileId(fileId: string): void {
    if (!DRIVE_FILE_ID_RE.test(fileId)) {
        throw new GoogleDriveError('ID file Google Drive tidak valid.', 400, 'invalid_file_id');
    }
}

export async function getDriveFileMetadata(fileId: string): Promise<DriveFileInfo> {
    assertValidFileId(fileId);
    const raw = await driveJson<RawDriveFile>(
        `${DRIVE_API_URL}/files/${encodeURIComponent(fileId)}?fields=${encodeURIComponent(FILE_FIELDS)}`
    );
    return toDriveFileInfo(raw, 'berkas', 'application/octet-stream');
}

/**
 * Membuka isi file sebagai Response mentah (untuk di-stream oleh endpoint proxy Inbox).
 * Mendukung header `Range` agar video/audio bisa di-seek.
 */
export async function fetchDriveFileContent(fileId: string, rangeHeader?: string): Promise<Response> {
    assertValidFileId(fileId);
    const res = await driveRequest(`${DRIVE_API_URL}/files/${encodeURIComponent(fileId)}?alt=media`, {
        method: 'GET',
        headers: rangeHeader ? { Range: rangeHeader } : undefined,
    });
    if (!res.ok) {
        const err = await readGoogleError(res);
        throw new GoogleDriveError(`Google Drive error: ${err.message}`, res.status, err.code);
    }
    return res;
}

// ── Fase 5b: upload langsung dari browser (resumable) & unduh ke Buffer ──────

/**
 * Membuka sesi upload resumable. Browser lalu mengirim `PUT <sessionUrl>` berisi berkas
 * langsung ke Google, sehingga tidak terkena batas body 4,5 MB Vercel. URL sesi sendiri
 * adalah kredensial sementara (berlaku ±1 minggu): hanya dikembalikan ke pemegang PIN.
 * `origin` wajib agar Google mengizinkan CORS dari halaman Inbox.
 */
export async function createResumableUploadSession(params: {
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    origin?: string;
    description?: string;
    folderId?: string;
}): Promise<string> {
    if (!Number.isFinite(params.sizeBytes) || params.sizeBytes <= 0) {
        throw new GoogleDriveError('Ukuran file tidak valid.', 400, 'empty_file');
    }
    const fileName = params.fileName.trim();
    if (!fileName) throw new GoogleDriveError('Nama file kosong.', 400, 'empty_name');

    const folderId = params.folderId || (await ensureMediaFolder());
    const headers: Record<string, string> = {
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': params.mimeType,
        'X-Upload-Content-Length': String(params.sizeBytes),
    };
    if (params.origin) headers.Origin = params.origin;

    const res = await driveRequest(
        `${DRIVE_UPLOAD_URL}/files?uploadType=resumable&fields=${encodeURIComponent(FILE_FIELDS)}`,
        {
            method: 'POST',
            headers,
            body: JSON.stringify({
                name: fileName,
                parents: [folderId],
                ...(params.description ? { description: params.description.slice(0, 500) } : {}),
            }),
        }
    );
    if (!res.ok) {
        const err = await readGoogleError(res);
        throw new GoogleDriveError(`Google Drive error: ${err.message}`, res.status, err.code);
    }
    const location = res.headers.get('location');
    if (!location || !location.startsWith('https://')) {
        throw new GoogleDriveError('Google tidak mengembalikan URL sesi upload.', 502);
    }
    return location;
}

/** Mengunduh isi file Drive ke Buffer dengan batas ukuran (dicek dari header dan isi sebenarnya). */
export async function downloadDriveFileBuffer(fileId: string, maxBytes: number): Promise<Buffer> {
    const res = await fetchDriveFileContent(fileId);
    const declared = Number(res.headers.get('content-length'));
    if (Number.isFinite(declared) && declared > maxBytes) {
        throw new GoogleDriveError('File melebihi batas ukuran.', 413, 'too_large');
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0) throw new GoogleDriveError('Isi file kosong.', 400, 'empty_file');
    if (buf.length > maxBytes) throw new GoogleDriveError('File melebihi batas ukuran.', 413, 'too_large');
    return buf;
}
