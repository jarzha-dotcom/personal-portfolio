/**
 * api/_lib/whatsappGraph.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Klien komunikasi resmi Meta WhatsApp Cloud API (Graph API v22.0):
 *   - Verifikasi tanda tangan HMAC-SHA256 webhook (`x-hub-signature-256`)
 *   - Pengiriman centang biru (`read`) + animasi `typing_indicator`
 *   - Pengunduhan media masuk (foto kurir, voice note OGG Opus, PDF <= 4 MB)
 *     beserta sanitasi MIME type agar diterima mulus oleh Vertex AI Gemini
 *   - Pengiriman balasan teks dengan penjaga mutlak anti-Error `131021`
 */

import { createHmac, timingSafeEqual } from 'node:crypto';
import { normalizeWaPhone } from './whatsappState.js';

const GRAPH_API_VERSION = (process.env.WA_GRAPH_API_VERSION || 'v22.0').trim();
const GRAPH_BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;
const DEFAULT_OWNER_PHONE = '6282312312734';
const MAX_MEDIA_BYTES = 4 * 1024 * 1024; // 4 MB aman untuk memori Vercel & kuota token

export function getOwnerWaPhone(): string {
    return normalizeWaPhone(process.env.WA_OWNER_PHONE || DEFAULT_OWNER_PHONE) || DEFAULT_OWNER_PHONE;
}

export function getWaGraphCredentials(): {
    verifyToken: string;
    appSecret: string;
    accessToken: string;
    phoneNumberId: string;
    fullyConfigured: boolean;
    missing: string[];
} {
    const verifyToken = (process.env.WA_VERIFY_TOKEN || '').trim();
    const appSecret = (process.env.WA_APP_SECRET || '').trim();
    const accessToken = (process.env.WA_ACCESS_TOKEN || '').trim();
    const phoneNumberId = (process.env.WA_PHONE_NUMBER_ID || '').trim();

    const missing: string[] = [];
    if (!verifyToken) missing.push('WA_VERIFY_TOKEN');
    if (!appSecret) missing.push('WA_APP_SECRET');
    if (!accessToken) missing.push('WA_ACCESS_TOKEN');
    if (!phoneNumberId) missing.push('WA_PHONE_NUMBER_ID');

    return {
        verifyToken,
        appSecret,
        accessToken,
        phoneNumberId,
        fullyConfigured: missing.length === 0,
        missing,
    };
}

/**
 * Memverifikasi header `x-hub-signature-256` dari Meta atas byte mentah payload.
 */
export function verifyMetaWebhookSignature(
    rawBody: Buffer,
    signatureHeader: string | undefined,
    appSecret: string | undefined
): boolean {
    const secret = (appSecret || '').trim();
    const sig = (signatureHeader || '').trim();
    if (!secret || !sig.startsWith('sha256=')) return false;

    const expectedHex = createHmac('sha256', secret).update(rawBody).digest('hex');
    const expected = Buffer.from(`sha256=${expectedHex}`, 'utf8');
    const received = Buffer.from(sig, 'utf8');

    if (expected.length !== received.length) return false;
    return timingSafeEqual(expected, received);
}

/**
 * Mengirim status `read` (centang biru) sekaligus indikator `"sedang mengetik..."`
 * ke ruang chat pengirim tepat saat Zannah mulai menyusun jawaban.
 */
export async function markMessageReadAndTyping(
    phoneNumberId: string,
    accessToken: string,
    inboundMessageId: string
): Promise<void> {
    if (!phoneNumberId || !accessToken || !inboundMessageId) return;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
        await fetch(`${GRAPH_BASE_URL}/${encodeURIComponent(phoneNumberId)}/messages`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            signal: controller.signal,
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                status: 'read',
                message_id: inboundMessageId,
                typing_indicator: { type: 'text' },
            }),
        });
    } catch (err) {
        console.warn('[whatsappGraph] Gagal kirim typing indicator (diabaikan):', err);
    } finally {
        clearTimeout(timer);
    }
}

function isAllowedMetaMediaHost(rawUrl: string): boolean {
    try {
        const parsed = new URL(rawUrl);
        if (parsed.protocol !== 'https:') return false;
        const h = parsed.hostname.toLowerCase();
        return (
            h.endsWith('.fbsbx.com') ||
            h.endsWith('.whatsapp.net') ||
            h.endsWith('.fbcdn.net') ||
            h.endsWith('.facebook.com')
        );
    } catch {
        return false;
    }
}

/**
 * Membersihkan parameter codec dari MIME type WhatsApp (mis. "audio/ogg; codecs=opus" -> "audio/ogg")
 * agar tidak ditolak oleh Gemini / Vertex AI `inlineData.mimeType`.
 */
export function sanitizeMediaMimeType(rawMime: string | undefined, fallback = 'application/octet-stream'): string {
    if (!rawMime || typeof rawMime !== 'string') return fallback;
    const base = rawMime.split(';')[0]?.trim().toLowerCase() || '';
    const SUPPORTED_PREFIXES = ['image/jpeg', 'image/png', 'image/webp', 'audio/ogg', 'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/aac', 'application/pdf'];
    if (SUPPORTED_PREFIXES.includes(base)) return base;
    if (base === 'audio/opus') return 'audio/ogg';
    return base || fallback;
}

/**
 * Mengunduh berkas media dari WhatsApp Cloud API menjadi Base64 untuk dianalisis Vertex AI.
 */
export async function downloadWhatsAppMediaAsBase64(
    accessToken: string,
    mediaId: string,
    fallbackMimeType?: string
): Promise<{ mimeType: string; data: string } | null> {
    if (!accessToken || !mediaId || !/^[A-Za-z0-9_.-]{4,128}$/.test(mediaId)) return null;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
        // Langkah 1: Ambil URL unduhan sementara dari Graph API
        const metaRes = await fetch(`${GRAPH_BASE_URL}/${encodeURIComponent(mediaId)}`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${accessToken}` },
            signal: controller.signal,
        });
        if (!metaRes.ok) {
            console.warn(`[whatsappGraph] Gagal ambil metadata media ${mediaId}: HTTP ${metaRes.status}`);
            return null;
        }

        const metaJson = (await metaRes.json()) as {
            url?: string;
            mime_type?: string;
            file_size?: number;
        };

        if (!metaJson.url || !isAllowedMetaMediaHost(metaJson.url)) {
            console.warn('[whatsappGraph] URL media Meta tidak valid atau tidak dikenal.');
            return null;
        }
        if (typeof metaJson.file_size === 'number' && metaJson.file_size > MAX_MEDIA_BYTES) {
            console.warn(`[whatsappGraph] Ukuran media terlalu besar (${metaJson.file_size} B > 4 MB), dilewati.`);
            return null;
        }

        // Langkah 2: Unduh biner media
        const binRes = await fetch(metaJson.url, {
            method: 'GET',
            headers: { Authorization: `Bearer ${accessToken}` },
            signal: controller.signal,
        });
        if (!binRes.ok) {
            console.warn(`[whatsappGraph] Gagal unduh biner media: HTTP ${binRes.status}`);
            return null;
        }

        const arrayBuf = await binRes.arrayBuffer();
        if (arrayBuf.byteLength === 0 || arrayBuf.byteLength > MAX_MEDIA_BYTES) {
            return null;
        }

        const mimeType = sanitizeMediaMimeType(metaJson.mime_type || fallbackMimeType);
        return {
            mimeType,
            data: Buffer.from(arrayBuf).toString('base64'),
        };
    } catch (err) {
        console.warn('[whatsappGraph] Error saat unduh media WA:', err);
        return null;
    } finally {
        clearTimeout(timer);
    }
}

export interface SendWaTextResult {
    ok: boolean;
    status: number;
    messageId?: string;
    errorCode?: number;
    errorMessage?: string;
}

/**
 * Mengirim balasan teks ke nomor tujuan melalui WhatsApp Cloud API.
 * Dilengkapi pengaman keras mencegah pengiriman ke nomor pemilik sendiri (Error 131021).
 */
export async function sendWhatsAppTextReply(params: {
    phoneNumberId: string;
    accessToken: string;
    to: string;
    body: string;
    replyToMessageId?: string;
    /** Nomor pengirim milik bot saat ini (dari metadata.display_phone_number, mis. nomor uji +1 555...) */
    senderBotPhone?: string;
}): Promise<SendWaTextResult> {
    const recipient = normalizeWaPhone(params.to);
    const activeBotPhone = normalizeWaPhone(params.senderBotPhone) || getOwnerWaPhone();

    if (!recipient) {
        return { ok: false, status: 400, errorMessage: 'Nomor tujuan tidak valid' };
    }

    // Hard Guard terhadap Error 131021 ("Recipient cannot be sender")
    if (recipient === activeBotPhone) {
        console.warn('[whatsappGraph] Diblokir oleh penjaga 131021: percobaan kirim pesan ke nomor pengirim sendiri.');
        return {
            ok: false,
            status: 400,
            errorCode: 131021,
            errorMessage: 'Recipient cannot be sender (blocked by 131021 guard)',
        };
    }

    const cleanBody = params.body.trim();
    if (!cleanBody) {
        return { ok: false, status: 400, errorMessage: 'Isi pesan kosong' };
    }

    const payload: Record<string, unknown> = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: recipient,
        type: 'text',
        text: {
            preview_url: true,
            body: cleanBody.slice(0, 4000),
        },
    };

    if (params.replyToMessageId) {
        payload.context = { message_id: params.replyToMessageId };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
        const res = await fetch(`${GRAPH_BASE_URL}/${encodeURIComponent(params.phoneNumberId)}/messages`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${params.accessToken}`,
                'Content-Type': 'application/json',
            },
            signal: controller.signal,
            body: JSON.stringify(payload),
        });

        const data = (await res.json().catch(() => ({}))) as {
            messages?: Array<{ id?: string }>;
            error?: { code?: number; message?: string };
        };

        if (!res.ok) {
            return {
                ok: false,
                status: res.status,
                errorCode: data.error?.code,
                errorMessage: data.error?.message || `HTTP ${res.status}`,
            };
        }

        return {
            ok: true,
            status: res.status,
            messageId: data.messages?.[0]?.id,
        };
    } catch (err) {
        return {
            ok: false,
            status: 500,
            errorMessage: err instanceof Error ? err.message : String(err),
        };
    } finally {
        clearTimeout(timer);
    }
}

