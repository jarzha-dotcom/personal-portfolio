/**
 * api/_lib/whatsappMedia.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Jembatan antara media WhatsApp Cloud API (Meta) dan arsip Google Drive:
 *   - Unduh media masuk sebagai Buffer (validasi host, tipe MIME & ukuran)
 *   - Arsipkan ke Google Drive dan bangun metadata `WaMediaAttachment`
 *   - Helper nama file aman & label pratinjau untuk Inbox
 *
 * `processInboundMedia` mengembalikan Buffer-nya juga, sehingga pemanggil bisa
 * memakai ulang berkas yang sama untuk Gemini (base64) tanpa mengunduh dua kali.
 * Kegagalan Drive TIDAK menggagalkan pipeline: Buffer tetap dikembalikan.
 */

import {
    GRAPH_BASE_URL,
    isAllowedMetaMediaHost,
    sanitizeMediaMimeType,
} from './whatsappGraph.js';
import {
    getGoogleDriveConfig,
    GoogleDriveError,
    uploadFileToDrive,
    type DriveFileInfo,
} from './googleDrive.js';

// ── Tipe ─────────────────────────────────────────────────────────────────────

export type WaMediaKind = 'image' | 'document' | 'video' | 'audio';

export interface WaMediaAttachment {
    type: WaMediaKind;
    driveFileId: string;
    driveViewLink: string;
    driveThumbnailLink?: string;
    fileName?: string;
    mimeType: string;
    fileSizeBytes?: number;
    caption?: string;
}

export type MediaFailureReason =
    | 'invalid_media_id'
    | 'meta_metadata_error'
    | 'untrusted_url'
    | 'too_large'
    | 'empty'
    | 'unsupported_type'
    | 'download_error';

export type DownloadMediaResult =
    | { ok: true; buffer: Buffer; mimeType: string; sizeBytes: number }
    | { ok: false; reason: MediaFailureReason; detail?: string };

export type ProcessInboundMediaResult =
    | {
          ok: true;
          buffer: Buffer;
          mimeType: string;
          sizeBytes: number;
          kind: WaMediaKind;
          /** Terisi bila arsip Drive berhasil. */
          attachment?: WaMediaAttachment;
          /** Terisi bila Drive belum dikonfigurasi / upload gagal (media tetap tersedia di `buffer`). */
          driveError?: string;
          /** Kode galat Drive (mis. `invalid_grant` bila refresh token mati), bila ada. */
          driveErrorCode?: string;
      }
    | { ok: false; reason: MediaFailureReason; detail?: string };

// ── Konstanta & Whitelist MIME ───────────────────────────────────────────────

const DEFAULT_MAX_MB = 15;
const MIN_MAX_MB = 1;
const MAX_MAX_MB = 25;
const DOWNLOAD_TIMEOUT_MS = 25000;
const MEDIA_ID_RE = /^[A-Za-z0-9_.-]{4,128}$/;
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

/** Tipe yang didukung Meta untuk pesan masuk/keluar (+ webp untuk stiker/gambar). */
const MIME_TABLE: Record<string, { kind: WaMediaKind; ext: string }> = {
    'image/jpeg': { kind: 'image', ext: 'jpg' },
    'image/png': { kind: 'image', ext: 'png' },
    'image/webp': { kind: 'image', ext: 'webp' },
    'video/mp4': { kind: 'video', ext: 'mp4' },
    'video/3gpp': { kind: 'video', ext: '3gp' },
    'audio/ogg': { kind: 'audio', ext: 'ogg' },
    'audio/mpeg': { kind: 'audio', ext: 'mp3' },
    'audio/mp4': { kind: 'audio', ext: 'm4a' },
    'audio/aac': { kind: 'audio', ext: 'aac' },
    'audio/amr': { kind: 'audio', ext: 'amr' },
    'application/pdf': { kind: 'document', ext: 'pdf' },
    'application/msword': { kind: 'document', ext: 'doc' },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { kind: 'document', ext: 'docx' },
    'application/vnd.ms-excel': { kind: 'document', ext: 'xls' },
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { kind: 'document', ext: 'xlsx' },
    'application/vnd.ms-powerpoint': { kind: 'document', ext: 'ppt' },
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': { kind: 'document', ext: 'pptx' },
    'text/plain': { kind: 'document', ext: 'txt' },
};

export function getWaMediaMaxBytes(): number {
    const raw = Number((process.env.WA_MEDIA_MAX_MB || '').trim());
    const mb = Number.isFinite(raw) && raw > 0 ? Math.min(MAX_MAX_MB, Math.max(MIN_MAX_MB, raw)) : DEFAULT_MAX_MB;
    return Math.floor(mb * 1024 * 1024);
}

/** Mengembalikan jenis media untuk MIME yang didukung, atau null jika tidak didukung. */
export function waMediaKindFromMime(rawMime: string | undefined): WaMediaKind | null {
    const base = sanitizeMediaMimeType(rawMime, '');
    return MIME_TABLE[base]?.kind ?? null;
}

export function extensionForMime(rawMime: string | undefined): string {
    const base = sanitizeMediaMimeType(rawMime, '');
    return MIME_TABLE[base]?.ext ?? 'bin';
}

// ── Nama File ────────────────────────────────────────────────────────────────

/**
 * Membersihkan nama file dari karakter berbahaya/kontrol dan memotong panjangnya
 * (ekstensi dipertahankan).
 */
export function sanitizeDriveFileName(raw: string | undefined, fallback = 'berkas'): string {
    const cleaned = (raw || '')
        .normalize('NFKC')
        // eslint-disable-next-line no-control-regex
        .replace(/[\u0000-\u001f\u007f]/g, '')
        .replace(/[\\/:*?"<>|]+/g, '_')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/^\.+/, '');
    if (!cleaned) return fallback;

    const MAX_LEN = 100;
    if (cleaned.length <= MAX_LEN) return cleaned;

    const dot = cleaned.lastIndexOf('.');
    const ext = dot > 0 && cleaned.length - dot <= 10 ? cleaned.slice(dot) : '';
    return cleaned.slice(0, MAX_LEN - ext.length) + ext;
}

/**
 * Nama file di Drive: `YYYY-MM-DD_HHmm_<nomor>_<nama>` (jam WIB) agar urut & mudah dicari.
 * Ekstensi ditambahkan dari MIME jika nama asli tidak punya.
 */
export function buildDriveFileName(params: {
    phone: string;
    fileName?: string;
    mimeType: string;
    now?: number;
}): string {
    const wib = new Date((params.now ?? Date.now()) + WIB_OFFSET_MS).toISOString();
    const stamp = `${wib.slice(0, 10)}_${wib.slice(11, 13)}${wib.slice(14, 16)}`;
    const phone = params.phone.replace(/\D/g, '') || 'unknown';

    let name = sanitizeDriveFileName(params.fileName, 'berkas');
    if (!/\.[A-Za-z0-9]{1,8}$/.test(name)) {
        name = `${name}.${extensionForMime(params.mimeType)}`;
    }
    return `${stamp}_${phone}_${name}`;
}

/** Teks ringkas untuk pratinjau thread Inbox bila pesan tidak punya caption. */
export function buildMediaPreviewLabel(type: WaMediaKind, fileName?: string): string {
    switch (type) {
        case 'image':
            return '[📷 Foto]';
        case 'video':
            return '[🎥 Video]';
        case 'audio':
            return '[🎤 Audio]';
        case 'document':
            return fileName ? `[📄 Dokumen: ${sanitizeDriveFileName(fileName, 'dokumen')}]` : '[📄 Dokumen]';
    }
}

// ── Unduh dari Meta ──────────────────────────────────────────────────────────

/**
 * Mengunduh media WhatsApp (via media_id) sebagai Buffer. Memvalidasi ID, host unduhan,
 * tipe MIME (whitelist), dan ukuran (sebelum & sesudah unduh).
 */
export async function downloadWhatsAppMediaBuffer(
    accessToken: string,
    mediaId: string,
    opts: { fallbackMimeType?: string; maxBytes?: number } = {}
): Promise<DownloadMediaResult> {
    if (!accessToken || !MEDIA_ID_RE.test(mediaId || '')) {
        return { ok: false, reason: 'invalid_media_id' };
    }
    const maxBytes = opts.maxBytes ?? getWaMediaMaxBytes();

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);
    try {
        const metaRes = await fetch(`${GRAPH_BASE_URL}/${encodeURIComponent(mediaId)}`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${accessToken}` },
            signal: controller.signal,
        });
        if (!metaRes.ok) {
            return { ok: false, reason: 'meta_metadata_error', detail: `HTTP ${metaRes.status}` };
        }

        const meta = (await metaRes.json()) as { url?: string; mime_type?: string; file_size?: number };
        if (!meta.url || !isAllowedMetaMediaHost(meta.url)) {
            return { ok: false, reason: 'untrusted_url' };
        }

        const mimeType = sanitizeMediaMimeType(meta.mime_type || opts.fallbackMimeType, '');
        if (!MIME_TABLE[mimeType]) {
            return { ok: false, reason: 'unsupported_type', detail: mimeType || 'tidak diketahui' };
        }
        if (typeof meta.file_size === 'number' && meta.file_size > maxBytes) {
            return { ok: false, reason: 'too_large', detail: `${meta.file_size} B > ${maxBytes} B` };
        }

        const binRes = await fetch(meta.url, {
            method: 'GET',
            headers: { Authorization: `Bearer ${accessToken}` },
            signal: controller.signal,
        });
        if (!binRes.ok) {
            return { ok: false, reason: 'download_error', detail: `HTTP ${binRes.status}` };
        }

        const buffer = Buffer.from(await binRes.arrayBuffer());
        if (buffer.length === 0) return { ok: false, reason: 'empty' };
        if (buffer.length > maxBytes) {
            return { ok: false, reason: 'too_large', detail: `${buffer.length} B > ${maxBytes} B` };
        }

        return { ok: true, buffer, mimeType, sizeBytes: buffer.length };
    } catch (err) {
        return { ok: false, reason: 'download_error', detail: err instanceof Error ? err.message : String(err) };
    } finally {
        clearTimeout(timer);
    }
}

// ── Pipeline: Meta → Drive ───────────────────────────────────────────────────

/**
 * Unduh media masuk, lalu arsipkan ke Google Drive.
 * `ok: true` berarti unduhan berhasil; periksa `attachment` / `driveError` untuk status arsip.
 */
export async function processInboundMedia(params: {
    accessToken: string;
    mediaId: string;
    senderPhone: string;
    mimeType?: string;
    fileName?: string;
    caption?: string;
}): Promise<ProcessInboundMediaResult> {
    const dl = await downloadWhatsAppMediaBuffer(params.accessToken, params.mediaId, {
        fallbackMimeType: params.mimeType,
    });
    if (!dl.ok) return dl;

    const kind = waMediaKindFromMime(dl.mimeType) as WaMediaKind; // dijamin non-null oleh whitelist
    const base = { ok: true as const, buffer: dl.buffer, mimeType: dl.mimeType, sizeBytes: dl.sizeBytes, kind };

    if (!getGoogleDriveConfig().configured) {
        return { ...base, driveError: 'Google Drive belum dikonfigurasi.' };
    }

    try {
        const originalName = params.fileName
            ? sanitizeDriveFileName(params.fileName)
            : undefined;
        const info: DriveFileInfo = await uploadFileToDrive({
            buffer: dl.buffer,
            fileName: buildDriveFileName({
                phone: params.senderPhone,
                fileName: originalName,
                mimeType: dl.mimeType,
            }),
            mimeType: dl.mimeType,
            description: params.caption ? `Caption WA: ${params.caption}` : undefined,
        });

        const attachment: WaMediaAttachment = {
            type: kind,
            driveFileId: info.fileId,
            driveViewLink: info.viewLink,
            driveThumbnailLink: info.thumbnailLink,
            fileName: originalName,
            mimeType: dl.mimeType,
            fileSizeBytes: info.sizeBytes ?? dl.sizeBytes,
            caption: params.caption?.trim().slice(0, 1000) || undefined,
        };
        return { ...base, attachment };
    } catch (err) {
        console.warn('[whatsappMedia] Gagal arsip ke Google Drive (media tetap diproses):', err);
        return {
            ...base,
            driveError: err instanceof Error ? err.message : String(err),
            driveErrorCode: err instanceof GoogleDriveError ? err.code : undefined,
        };
    }
}

// ── Media Keluar (Fase 5): kirim manual dari Inbox ───────────────────────────

/**
 * Tipe yang boleh DIKIRIM sebagai pesan media. Lebih sempit dari whitelist masuk:
 * Meta hanya menerima JPEG/PNG sebagai pesan gambar (WebP hanya untuk stiker).
 */
const OUTBOUND_BLOCKED_MIME = new Set(['image/webp']);

/** Jenis pesan untuk MIME yang boleh dikirim, atau null jika tidak didukung. */
export function waOutboundKindFromMime(rawMime: string | undefined): WaMediaKind | null {
    const base = sanitizeMediaMimeType(rawMime, '');
    if (OUTBOUND_BLOCKED_MIME.has(base)) return null;
    return MIME_TABLE[base]?.kind ?? null;
}

/** MIME hasil normalisasi (tanpa parameter codec), dipakai konsisten ke Meta & Drive. */
export function normalizeOutboundMime(rawMime: string | undefined): string {
    return sanitizeMediaMimeType(rawMime, '');
}

/** Batas ukuran berkas mentah untuk unggahan dari Inbox (base64 dalam JSON ≤ 4,5 MB Vercel). */
export const WA_OUTBOUND_MAX_BYTES = 3 * 1024 * 1024;

export interface ArchiveOutboundResult {
    attachment?: WaMediaAttachment;
    driveError?: string;
    driveErrorCode?: string;
}

/**
 * Menyimpan salinan berkas yang dikirim Mas Arzha ke Drive. Tidak pernah melempar:
 * pesan sudah terkirim ke klien, jadi kegagalan arsip hanya dilaporkan.
 * Nama file di Drive diberi awalan `keluar_` agar mudah dibedakan dari lampiran klien.
 */
export async function archiveOutboundMedia(params: {
    phone: string;
    buffer: Buffer;
    mimeType: string;
    kind: WaMediaKind;
    fileName?: string;
    caption?: string;
}): Promise<ArchiveOutboundResult> {
    if (!getGoogleDriveConfig().configured) {
        return { driveError: 'Google Drive belum dikonfigurasi.' };
    }
    try {
        const originalName = params.fileName ? sanitizeDriveFileName(params.fileName) : undefined;
        const info: DriveFileInfo = await uploadFileToDrive({
            buffer: params.buffer,
            fileName: buildDriveFileName({
                phone: params.phone,
                fileName: `keluar_${originalName ?? 'berkas'}`,
                mimeType: params.mimeType,
            }),
            mimeType: params.mimeType,
            description: params.caption ? `Caption WA (keluar): ${params.caption}` : undefined,
        });
        return {
            attachment: {
                type: params.kind,
                driveFileId: info.fileId,
                driveViewLink: info.viewLink,
                driveThumbnailLink: info.thumbnailLink,
                fileName: originalName,
                mimeType: params.mimeType,
                fileSizeBytes: info.sizeBytes ?? params.buffer.length,
                caption: params.caption?.trim().slice(0, 1000) || undefined,
            },
        };
    } catch (err) {
        console.warn('[whatsappMedia] Gagal arsip media keluar ke Drive (pesan sudah terkirim):', err);
        return {
            driveError: err instanceof Error ? err.message : String(err),
            driveErrorCode: err instanceof GoogleDriveError ? err.code : undefined,
        };
    }
}

/**
 * Batas ukuran kirim per jenis (Meta: gambar 5 MB, audio/video 16 MB, dokumen 100 MB),
 * dibatasi lagi oleh WA_MEDIA_MAX_MB agar muat di waktu eksekusi fungsi.
 */
export function getOutboundLimitBytes(kind: WaMediaKind): number {
    const MB = 1024 * 1024;
    const perKind: Record<WaMediaKind, number> = { image: 5 * MB, audio: 16 * MB, video: 16 * MB, document: 100 * MB };
    return Math.min(getWaMediaMaxBytes(), perKind[kind]);
}
