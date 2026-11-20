/**
 * api/wa-inbox.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * API Inbox Manual WhatsApp — ber-PIN, hanya untuk Mas Arzha.
 *
 * Rute:
 *   GET  /api/wa-inbox                → List thread terbaru (ber-PIN)
 *   GET  /api/wa-inbox?phone=628...   → Transkrip 1 thread (ber-PIN)
 *   POST /api/wa-inbox                → Kirim balas manual via Graph API (ber-PIN)
 *        action: reply | pause | resume | reply_media | prepare_upload (berkas besar → Drive langsung)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyWaAdminPin } from './_lib/waAuth.js';
import {
    listInboxContacts,
    markInboxRead,
    getWaFullTranscript,
    getInboxContact,
    isWithinServiceWindow,
    normalizeWaPhone,
    appendWaHistory,
    pausePhoneForHumanTakeover,
    clearPhonePause,
    isPhonePaused,
    reserveMetaReplyQuota,
    releaseMetaReplyQuota,
} from './_lib/whatsappState.js';
import {
    sendWhatsAppTextReply,
    sendWhatsAppMediaMessage,
    uploadMetaMedia,
    getWaGraphCredentials,
    getBotWaPhone,
} from './_lib/whatsappGraph.js';
import {
    GoogleDriveError,
    createResumableUploadSession,
    downloadDriveFileBuffer,
    getDriveFileMetadata,
    getGoogleDriveConfig,
} from './_lib/googleDrive.js';
import {
    WA_OUTBOUND_MAX_BYTES,
    buildDriveFileName,
    getOutboundLimitBytes,
    type WaMediaAttachment,
    type WaMediaKind,
    archiveOutboundMedia,
    buildMediaPreviewLabel,
    normalizeOutboundMime,
    sanitizeDriveFileName,
    waOutboundKindFromMime,
} from './_lib/whatsappMedia.js';

export const config = { api: { bodyParser: true } };
export const maxDuration = 60;

// ── Lampiran Keluar (reply_media) ────────────────────────────────────────────

/** Batas panjang string base64 untuk WA_OUTBOUND_MAX_BYTES (diperiksa SEBELUM didekode). */
const MAX_BASE64_CHARS = Math.ceil(WA_OUTBOUND_MAX_BYTES / 3) * 4;
const BASE64_RE = /^[A-Za-z0-9+/]+={0,2}$/;
const MAX_CAPTION_CHARS = 1024;
/** Kode galat Meta untuk pesan bebas di luar jendela 24 jam (re-engagement). */
const META_CODE_OUTSIDE_WINDOW = 131047;

interface ReplyMediaBody {
    phone?: string;
    fileName?: string;
    mimeType?: string;
    /** Sumber 1: berkas kecil (≤ 3 MB) sebagai base64. */
    dataBase64?: string;
    /** Sumber 2 (Fase 5b): berkas yang sudah diunggah browser langsung ke Drive via `prepare_upload`. */
    driveFileId?: string;
    sizeBytes?: number;
    caption?: string;
}

function fail(res: VercelResponse, status: number, code: string, error: string, extra: Record<string, unknown> = {}): void {
    res.status(status).json({ ok: false, code, error, ...extra });
}

function mapDriveError(res: VercelResponse, err: unknown): void {
    if (err instanceof GoogleDriveError) {
        if (err.code === 'invalid_grant') {
            return fail(res, 503, 'drive_auth', 'Token Google Drive tidak berlaku lagi. Jalankan `npm run google:auth` lalu perbarui GDRIVE_REFRESH_TOKEN.');
        }
        if (err.code === 'too_large' || err.status === 413) return fail(res, 413, 'too_large', 'Berkas melebihi batas ukuran.');
        if (err.status === 404) return fail(res, 404, 'drive_not_found', 'Berkas tidak ditemukan di Drive.');
        if (err.status === 400) return fail(res, 400, err.code || 'invalid', err.message);
        if (err.status === 503) return fail(res, 503, 'drive_not_configured', 'Google Drive belum dikonfigurasi.');
    }
    fail(res, 502, 'drive_error', err instanceof Error ? err.message : 'Galat Google Drive.');
}

// ── prepare_upload: sesi upload langsung ke Drive (Fase 5b) ──────────────────

async function handlePrepareUpload(
    norm: string,
    body: ReplyMediaBody,
    req: VercelRequest,
    res: VercelResponse
): Promise<void> {
    const mimeType = normalizeOutboundMime(body.mimeType);
    const kind = waOutboundKindFromMime(mimeType);
    if (!kind) return fail(res, 415, 'unsupported_type', 'Format berkas tidak didukung untuk dikirim lewat WhatsApp.');

    const size = Number(body.sizeBytes);
    if (!Number.isFinite(size) || size <= 0) return fail(res, 400, 'empty', 'Ukuran berkas tidak valid.');
    const limit = getOutboundLimitBytes(kind);
    if (size > limit) {
        const mb = (limit / (1024 * 1024)).toFixed(0);
        return fail(res, 413, 'too_large', `Berkas ${kind === 'document' ? 'dokumen' : kind} maksimal ${mb} MB.`, { maxBytes: limit });
    }
    if (!getGoogleDriveConfig().configured) {
        return fail(res, 503, 'drive_not_configured', 'Upload berkas besar butuh Google Drive (Fase 1 belum selesai).');
    }

    // Cek jendela 24 jam SEBELUM pengguna menunggu unggahan besar
    const contact = await getInboxContact(norm);
    if (!isWithinServiceWindow(contact?.lastAt)) return windowClosed(res, Boolean(contact));

    try {
        const fileName = buildDriveFileName({
            phone: norm,
            fileName: `keluar_${sanitizeDriveFileName(body.fileName, 'berkas')}`,
            mimeType,
        });
        const originHeader = req.headers.origin;
        const origin = (Array.isArray(originHeader) ? originHeader[0] : originHeader)
            || process.env.VITE_APP_URL
            || 'https://arzhaning.my.id';
        const sessionUrl = await createResumableUploadSession({
            fileName,
            mimeType,
            sizeBytes: size,
            origin,
            description: 'Lampiran keluar (upload langsung dari Inbox)',
        });
        res.status(200).json({ ok: true, sessionUrl, mimeType, kind, maxBytes: limit });
    } catch (err) {
        mapDriveError(res, err);
    }
}

function windowClosed(res: VercelResponse, hasContact: boolean): void {
    fail(
        res,
        409,
        'window_closed',
        hasContact
            ? 'Lebih dari 24 jam sejak pesan terakhir klien. WhatsApp menolak pesan bebas di luar jendela ini; tunggu klien membalas atau pakai template.'
            : 'Belum ada pesan masuk dari nomor ini yang tercatat, jadi jendela 24 jam tidak bisa dipastikan.'
    );
}

// ── reply_media ──────────────────────────────────────────────────────────────

interface ResolvedSource {
    buffer: Buffer;
    mimeType: string;
    kind: WaMediaKind;
    fileName: string;
    /** Terisi bila berkas sudah ada di Drive (jalur 5b): tidak perlu arsip ulang. */
    existing?: WaMediaAttachment;
}

async function handleReplyMedia(
    norm: string,
    body: ReplyMediaBody,
    res: VercelResponse
): Promise<void> {
    const caption = (body.caption || '').trim();
    if (caption.length > MAX_CAPTION_CHARS) {
        return fail(res, 400, 'caption_too_long', `Caption maksimal ${MAX_CAPTION_CHARS} karakter.`);
    }

    const viaDrive = typeof body.driveFileId === 'string' && body.driveFileId.trim() !== '';
    let inline: { buffer: Buffer; mimeType: string; kind: WaMediaKind; fileName: string } | null = null;

    // 1. Validasi input jalur inline (murah, sebelum menyentuh Meta/Redis/Drive)
    if (!viaDrive) {
        const mimeType = normalizeOutboundMime(body.mimeType);
        const kind = waOutboundKindFromMime(mimeType);
        if (!kind) {
            return fail(res, 415, 'unsupported_type', 'Format berkas tidak didukung untuk dikirim lewat WhatsApp (gambar JPEG/PNG, PDF/Office/TXT, video MP4/3GP, audio).');
        }
        const dataBase64 = typeof body.dataBase64 === 'string' ? body.dataBase64.trim() : '';
        if (!dataBase64) return fail(res, 400, 'empty', 'Berkas kosong.');
        if (dataBase64.length > MAX_BASE64_CHARS) return fail(res, 413, 'too_large', tooLargeMessage());
        if (!BASE64_RE.test(dataBase64)) return fail(res, 400, 'invalid_data', 'Data berkas tidak valid.');
        const buffer = Buffer.from(dataBase64, 'base64');
        if (buffer.length === 0) return fail(res, 400, 'empty', 'Berkas kosong.');
        if (buffer.length > WA_OUTBOUND_MAX_BYTES) return fail(res, 413, 'too_large', tooLargeMessage());
        inline = { buffer, mimeType, kind, fileName: sanitizeDriveFileName(body.fileName, 'berkas') };
        if (caption && kind === 'audio') {
            return fail(res, 400, 'caption_not_allowed', 'Pesan audio tidak mendukung caption. Kirim teks sebagai pesan terpisah.');
        }
    }

    // 2. Kredensial Meta
    const creds = getWaGraphCredentials();
    if (!creds.accessToken || !creds.phoneNumberId) {
        return fail(res, 503, 'meta_not_configured', 'Kredensial Meta Graph API belum dikonfigurasi.');
    }

    // 3. Jendela 24 jam
    const contact = await getInboxContact(norm);
    if (!isWithinServiceWindow(contact?.lastAt)) return windowClosed(res, Boolean(contact));

    // 4. Jalur Drive: ambil metadata (MIME/ukuran dari Drive, bukan dari klien) lalu unduh
    let source: ResolvedSource;
    if (inline) {
        source = inline;
    } else {
        try {
            const meta = await getDriveFileMetadata(body.driveFileId!.trim());
            const mimeType = normalizeOutboundMime(meta.mimeType);
            const kind = waOutboundKindFromMime(mimeType);
            if (!kind) return fail(res, 415, 'unsupported_type', 'Format berkas tidak didukung untuk dikirim lewat WhatsApp.');
            if (caption && kind === 'audio') {
                return fail(res, 400, 'caption_not_allowed', 'Pesan audio tidak mendukung caption. Kirim teks sebagai pesan terpisah.');
            }
            const limit = getOutboundLimitBytes(kind);
            if (typeof meta.sizeBytes === 'number' && meta.sizeBytes > limit) {
                return fail(res, 413, 'too_large', 'Berkas melebihi batas ukuran untuk jenis ini.');
            }
            const buffer = await downloadDriveFileBuffer(meta.fileId, limit);
            const fileName = sanitizeDriveFileName(body.fileName, 'berkas');
            source = {
                buffer,
                mimeType,
                kind,
                fileName,
                existing: {
                    type: kind,
                    driveFileId: meta.fileId,
                    driveViewLink: meta.viewLink,
                    driveThumbnailLink: meta.thumbnailLink,
                    fileName,
                    mimeType,
                    fileSizeBytes: meta.sizeBytes ?? buffer.length,
                    caption: caption.slice(0, 1000) || undefined,
                },
            };
        } catch (err) {
            return mapDriveError(res, err);
        }
    }
    const { buffer, mimeType, kind, fileName } = source;

    // 5. Kuota pesan keluar bulanan (setiap lampiran = 1 pesan)
    if (!(await reserveMetaReplyQuota())) {
        return fail(res, 429, 'quota_exhausted', 'Kuota pesan keluar bulan ini sudah habis (WA_MONTHLY_MESSAGE_LIMIT).');
    }

    // 6. Upload ke Meta → media id; 7. kirim pesan
    let messageId: string | undefined;
    try {
        const upload = await uploadMetaMedia({
            phoneNumberId: creds.phoneNumberId,
            accessToken: creds.accessToken,
            buffer,
            mimeType,
            fileName,
        });
        if (!upload.ok || !upload.mediaId) {
            await releaseMetaReplyQuota().catch(() => undefined);
            return fail(res, 502, 'meta_upload_failed', `Gagal mengunggah berkas ke WhatsApp: ${upload.errorMessage || 'galat tidak diketahui'}`, { metaCode: upload.errorCode });
        }

        const sent = await sendWhatsAppMediaMessage({
            phoneNumberId: creds.phoneNumberId,
            accessToken: creds.accessToken,
            to: norm,
            type: kind,
            mediaId: upload.mediaId,
            caption: caption || undefined,
            filename: kind === 'document' ? fileName : undefined,
            senderBotPhone: getBotWaPhone(),
        });
        if (!sent.ok) {
            await releaseMetaReplyQuota().catch(() => undefined);
            const outside = sent.errorCode === META_CODE_OUTSIDE_WINDOW;
            return fail(
                res,
                outside ? 409 : 502,
                outside ? 'window_closed' : 'meta_send_failed',
                outside
                    ? 'WhatsApp menolak: di luar jendela 24 jam sejak pesan terakhir klien.'
                    : `Gagal mengirim lampiran: ${sent.errorMessage || 'galat tidak diketahui'}`,
                { metaCode: sent.errorCode }
            );
        }
        messageId = sent.messageId;
    } catch (err) {
        await releaseMetaReplyQuota().catch(() => undefined);
        return fail(res, 502, 'meta_send_failed', err instanceof Error ? err.message : 'Gagal mengirim lampiran.');
    }

    // ── Pesan SUDAH terkirim. Langkah berikut tidak boleh membuat respons gagal. ──

    // 8. Salinan Drive: jalur 5b sudah ada di Drive; jalur inline diarsipkan sekarang
    let attachment = source.existing;
    let driveError: string | undefined;
    let driveErrorCode: string | undefined;
    if (!attachment) {
        const archive = await archiveOutboundMedia({
            phone: norm,
            buffer,
            mimeType,
            kind,
            fileName,
            caption: caption || undefined,
        });
        attachment = archive.attachment;
        driveError = archive.driveError;
        driveErrorCode = archive.driveErrorCode;
    }

    // 9. Riwayat/transkrip: label selalu ditulis (konteks AI + cadangan bila tak ada lampiran);
    //    UI menyembunyikan label itu saat lampiran tampil.
    const label = buildMediaPreviewLabel(kind, fileName);
    const historyText = `[Mas Arzha]: ${label}${caption ? `\n${caption}` : ''}`;
    try {
        await appendWaHistory(norm, '', historyText, undefined, attachment ? [attachment] : undefined);
        await pausePhoneForHumanTakeover(norm, 2 * 60 * 60);
        await markInboxRead(norm);
    } catch (err) {
        console.warn('[wa-inbox] Lampiran terkirim, tetapi pencatatan riwayat gagal:', err);
    }

    res.status(200).json({
        ok: true,
        messageId,
        paused: true,
        attachment,
        archived: Boolean(attachment),
        driveError,
        driveErrorCode,
    });
}

function tooLargeMessage(): string {
    const mb = (WA_OUTBOUND_MAX_BYTES / (1024 * 1024)).toFixed(0);
    return `Berkas melebihi ${mb} MB untuk jalur langsung; gunakan upload besar via Drive (prepare_upload).`;
}

// ── Handler Utama ─────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
    res.setHeader('Access-Control-Allow-Origin', process.env.VITE_APP_URL || 'https://arzhaning.my.id');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'x-tts-usage-pin, content-type');
    if (req.method === 'OPTIONS') { res.status(204).end(); return; }

    if (!verifyWaAdminPin(req, res)) return;

    // ── GET: list semua thread ATAU transkrip 1 nomor ─────────────────────────
    if (req.method === 'GET') {
        const phone = typeof req.query.phone === 'string' ? req.query.phone : '';

        if (phone) {
            // Ambil transkrip percakapan 1 nomor + status jeda bot
            const norm = normalizeWaPhone(phone);
            if (!norm) { res.status(400).json({ error: 'Nomor tidak valid.' }); return; }
            await markInboxRead(norm);
            const [turns, paused] = await Promise.all([
                getWaFullTranscript(norm),
                isPhonePaused(norm),
            ]);
            res.status(200).json({ phone: norm, paused, turns });
            return;
        }

        // List semua thread
        const contacts = await listInboxContacts();
        res.status(200).json({ contacts });
        return;
    }

    // ── POST: kirim balasan manual ATAU kontrol bot per nomor ─────────────────
    if (req.method === 'POST') {
        const body = (req.body || {}) as {
            action?: 'reply' | 'pause' | 'resume' | 'reply_media' | 'prepare_upload';
            phone?: string;
            message?: string;
        } & ReplyMediaBody;
        const action = body.action || 'reply';
        const phone = body.phone || '';

        const norm = normalizeWaPhone(phone);
        if (!norm) { res.status(400).json({ error: 'Nomor tidak valid.' }); return; }

        if (action === 'pause') {
            await pausePhoneForHumanTakeover(norm);
            res.status(200).json({ ok: true, paused: true });
            return;
        }

        if (action === 'resume') {
            await clearPhonePause(norm);
            res.status(200).json({ ok: true, paused: false });
            return;
        }

        if (action === 'prepare_upload') {
            await handlePrepareUpload(norm, body, req, res);
            return;
        }

        if (action === 'reply_media') {
            await handleReplyMedia(norm, body, res);
            return;
        }

        // Action: reply
        const message = body.message?.trim() || '';
        if (!message) {
            res.status(400).json({ error: 'Pesan balasan tidak boleh kosong.' });
            return;
        }

        const creds = getWaGraphCredentials();
        if (!creds.accessToken || !creds.phoneNumberId) {
            res.status(503).json({ error: 'Kredensial Meta Graph API belum dikonfigurasi.' });
            return;
        }

        // Balasan teks manual kini ikut menghitung kuota bulanan (sebelumnya hanya bot)
        if (!(await reserveMetaReplyQuota())) {
            res.status(429).json({
                ok: false,
                code: 'quota_exhausted',
                error: 'Kuota pesan keluar bulan ini sudah habis (WA_MONTHLY_MESSAGE_LIMIT).',
            });
            return;
        }

        const botPhone = getBotWaPhone();
        const result = await sendWhatsAppTextReply({
            phoneNumberId: creds.phoneNumberId,
            accessToken: creds.accessToken,
            to: norm,
            body: message,
            senderBotPhone: botPhone,
        });

        if (result.ok) {
            // Simpan ke riwayat sebagai model/asisten (ditandai Mas Arzha)
            await appendWaHistory(norm, '', `[Mas Arzha]: ${message}`);
            // Jeda bot selama 2 jam agar Mas Arzha leluasa ngobrol manual tanpa diselak bot
            await pausePhoneForHumanTakeover(norm, 2 * 60 * 60);
            await markInboxRead(norm);
            res.status(200).json({ ok: true, messageId: result.messageId, paused: true });
        } else {
            await releaseMetaReplyQuota().catch(() => undefined);
            res.status(502).json({ ok: false, error: result.errorMessage });
        }
        return;
    }

    res.status(405).json({ error: 'Method not allowed.' });
}
