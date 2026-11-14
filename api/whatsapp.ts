/**
 * api/whatsapp.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Endpoint Webhook Resmi Meta WhatsApp Business Cloud API (Mode Coexistence)
 * & API Panel Admin Ber-PIN untuk Zannah AI.
 *
 * Rute:
 *   - GET  /api/whatsapp?hub.mode=subscribe&...  → Verifikasi Webhook Meta
 *   - GET  /api/whatsapp?view=admin              → Status kuota & kontrol (header x-tts-usage-pin)
 *   - POST /api/whatsapp?action=admin            → Toggle ON/OFF & kelola Skip List (header x-tts-usage-pin)
 *   - POST /api/whatsapp                         → Event Webhook Meta (`messages`, `smb_message_echoes`, `smb_app_state_sync`)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHash, timingSafeEqual } from 'node:crypto';
import {
    addSkipPhones,
    appendWaHistory,
    checkSenderRateLimit,
    claimMessageDedup,
    clearPendingBubbles,
    clearPhonePause,
    clearWaHistory,
    drainPendingBubbles,
    enqueuePendingBubble,
    getSmartDelayMs,
    getWaAdminSnapshot,
    getWaFullTranscript,
    getWaHistory,
    hasAiBudgetRemaining,
    isLatestBurstBubble,
    isPhoneInSyncedContacts,
    isPhonePaused,
    isPhoneSkipped,
    isWaBotEnabled,
    normalizeWaPhone,
    pausePhoneForHumanTakeover,
    recordAiSpendIdr,
    recordLastSelfCommand,
    releaseMetaReplyQuota,
    removeSkipPhones,
    reserveMetaReplyQuota,
    setWaBotEnabled,
    shouldSkipSavedContacts,
    syncPhoneContacts,
    type PendingBubble,
} from './_lib/whatsappState.js';
import {
    buildZannahWaSystemInstruction,
    formatForWhatsApp,
    parseOwnerSelfCommand,
} from './_lib/whatsappPrompt.js';
import {
    generateWaAiReply,
    getWaAiConfigStatus,
    type WaAiContent,
    type WaAiPart,
} from './_lib/whatsappAi.js';
import {
    downloadWhatsAppMediaAsBase64,
    getOwnerWaPhone,
    getWaGraphCredentials,
    markMessageReadAndTyping,
    sendWhatsAppTextReply,
    verifyMetaWebhookSignature,
} from './_lib/whatsappGraph.js';
import {
    buildAgentDocumentAttachment,
    narrateOutcome,
} from './_lib/documentGenerator.js';

// Matikan body parser bawaan agar byte mentah utuh untuk verifikasi HMAC-SHA256 Meta
export const config = {
    api: {
        bodyParser: false,
    },
};

export const maxDuration = 60;

const MAX_RAW_BODY_BYTES = 1024 * 1024; // 1 MB cukup untuk payload JSON webhook Meta
const PIN_FAIL_WINDOW_MS = 5 * 60 * 1000;
const PIN_MAX_FAILS = 5;
const pinFailures = new Map<string, number[]>();

// ── Utilitas HTTP, Keamanan PIN, & Background Execution Vercel ────────────────

function safeSecretEqual(a: string, b: string): boolean {
    if (!a || !b) return false;
    const hashA = createHash('sha256').update(a).digest();
    const hashB = createHash('sha256').update(b).digest();
    return timingSafeEqual(hashA, hashB);
}

function getClientIp(req: VercelRequest): string {
    const xff = req.headers['x-forwarded-for'];
    const raw = Array.isArray(xff) ? xff[0] : xff;
    return (raw || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
}

function verifyAdminPin(req: VercelRequest, res: VercelResponse): boolean {
    const expectedPin = (process.env.TTS_USAGE_PIN || '').trim();
    if (!expectedPin) {
        res.status(503).json({ error: 'TTS_USAGE_PIN belum diset di server.' });
        return false;
    }

    const ip = getClientIp(req);
    const now = Date.now();
    const recentFails = (pinFailures.get(ip) || []).filter((t) => now - t < PIN_FAIL_WINDOW_MS);
    if (recentFails.length >= PIN_MAX_FAILS) {
        pinFailures.set(ip, recentFails);
        res.status(429).json({ error: 'Terlalu banyak percobaan PIN gagal. Tunggu 5 menit.' });
        return false;
    }

    const headerPinRaw = req.headers['x-tts-usage-pin'];
    const providedPin = (Array.isArray(headerPinRaw) ? headerPinRaw[0] : headerPinRaw || '').trim();

    if (!safeSecretEqual(providedPin, expectedPin)) {
        recentFails.push(now);
        pinFailures.set(ip, recentFails);
        res.status(401).json({ error: 'PIN salah.' });
        return false;
    }

    pinFailures.delete(ip);
    return true;
}

async function readRawBody(req: VercelRequest): Promise<Buffer> {
    if (Buffer.isBuffer(req.body)) return req.body;
    if (typeof req.body === 'string') return Buffer.from(req.body, 'utf8');
    if (req.body && typeof req.body === 'object' && Object.keys(req.body as object).length > 0) {
        return Buffer.from(JSON.stringify(req.body), 'utf8');
    }

    const chunks: Buffer[] = [];
    let total = 0;
    if (req && typeof (req as unknown as AsyncIterable<Buffer>)[Symbol.asyncIterator] === 'function') {
        for await (const chunk of req as unknown as AsyncIterable<Buffer | string>) {
            const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            total += buf.length;
            if (total > MAX_RAW_BODY_BYTES) {
                throw new Error('PAYLOAD_TOO_LARGE');
            }
            chunks.push(buf);
        }
    }
    return Buffer.concat(chunks);
}

/**
 * Menjalankan pemrosesan webhook di background menggunakan konteks runtime Vercel
 * (`waitUntil`) jika tersedia sehingga Meta langsung menerima HTTP 200 dalam <50ms.
 * Jika tidak tersedia (mis. saat unit test / dev lokal), fungsi di-await dengan aman.
 */
function getVercelWaitUntil(): ((promise: Promise<unknown>) => void) | null {
    const symbols = [
        Symbol.for('@vercel/request-context'),
        Symbol.for('@next/request-context'),
    ];
    const g = globalThis as Record<symbol, { get?: () => { waitUntil?: (p: Promise<unknown>) => void } } | undefined>;
    for (const sym of symbols) {
        const ctx = g[sym]?.get?.();
        if (ctx && typeof ctx.waitUntil === 'function') {
            return ctx.waitUntil.bind(ctx);
        }
    }
    return null;
}

function sleep(ms: number): Promise<void> {
    if (ms <= 0) return Promise.resolve();
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Struktur Payload Webhook Meta ─────────────────────────────────────────────

interface MetaContactSyncItem {
    type?: string;
    action?: 'add' | 'remove' | string;
    contact?: {
        phone_number?: string;
        full_name?: string;
        first_name?: string;
    };
}

interface MetaMessageEcho {
    from?: string;
    to?: string;
    id?: string;
    timestamp?: string;
    type?: string;
    text?: { body?: string };
}

interface MetaInboundMessage {
    from?: string;
    id?: string;
    timestamp?: string;
    type?: string;
    text?: { body?: string };
    image?: { id?: string; mime_type?: string; caption?: string };
    audio?: { id?: string; mime_type?: string; voice?: boolean };
    document?: { id?: string; mime_type?: string; filename?: string; caption?: string };
    location?: { name?: string; address?: string; latitude?: number; longitude?: number };
    button?: { text?: string };
    interactive?: {
        type?: string;
        button_reply?: { title?: string };
        list_reply?: { title?: string; description?: string };
    };
}

interface MetaChangeValue {
    metadata?: {
        display_phone_number?: string;
        phone_number_id?: string;
    };
    contacts?: Array<{
        wa_id?: string;
        profile?: { name?: string };
    }>;
    messages?: MetaInboundMessage[];
    message_echoes?: MetaMessageEcho[];
    state_sync?: MetaContactSyncItem[];
}

interface MetaWebhookPayload {
    object?: string;
    entry?: Array<{
        id?: string;
        changes?: Array<{
            field?: string;
            value?: MetaChangeValue;
        }>;
    }>;
}

// ── Ekstraksi Pesan Masuk Menjadi PendingBubble ───────────────────────────────

function extractBubbleFromInbound(msg: MetaInboundMessage, senderName?: string): PendingBubble | null {
    const id = (msg.id || '').trim();
    const type = (msg.type || '').trim().toLowerCase();
    if (!id || !type) return null;

    // Abaikan event sistem, reaksi emoji, hapus pesan, status ephemeral, dsb.
    const IGNORED_TYPES = new Set(['reaction', 'system', 'ephemeral', 'unsupported', 'unknown', 'order', 'sticker']);
    if (IGNORED_TYPES.has(type)) return null;

    const timestamp = Number(msg.timestamp || '0') * 1000 || Date.now();

    if (type === 'text') {
        const body = (msg.text?.body || '').trim();
        if (!body) return null;
        return { id, timestamp, senderName, text: body };
    }

    if (type === 'image') {
        const caption = (msg.image?.caption || '').trim();
        return {
            id,
            timestamp,
            senderName,
            text: caption || '[Pengirim mengirimkan sebuah foto]',
            mediaId: msg.image?.id,
            mediaMimeType: msg.image?.mime_type || 'image/jpeg',
            mediaKind: 'image',
        };
    }

    if (type === 'audio') {
        const label = msg.audio?.voice ? '[Pengirim mengirimkan pesan suara / voice note]' : '[Pengirim mengirimkan berkas audio]';
        return {
            id,
            timestamp,
            senderName,
            text: label,
            mediaId: msg.audio?.id,
            mediaMimeType: msg.audio?.mime_type || 'audio/ogg',
            mediaKind: 'audio',
        };
    }

    if (type === 'document') {
        const fname = (msg.document?.filename || 'dokumen').trim();
        const caption = (msg.document?.caption || '').trim();
        return {
            id,
            timestamp,
            senderName,
            text: caption ? `[Lampiran dokumen: ${fname}] ${caption}` : `[Pengirim melampirkan dokumen: ${fname}]`,
            mediaId: msg.document?.id,
            mediaMimeType: msg.document?.mime_type || 'application/pdf',
            mediaKind: 'document',
            filename: fname,
        };
    }

    if (type === 'location') {
        const locInfo = [msg.location?.name, msg.location?.address].filter(Boolean).join(' - ');
        return {
            id,
            timestamp,
            senderName,
            text: locInfo ? `[Pengirim membagikan titik lokasi: ${locInfo}]` : '[Pengirim membagikan titik lokasi]',
        };
    }

    if (type === 'button') {
        const btn = (msg.button?.text || '').trim();
        return btn ? { id, timestamp, senderName, text: btn } : null;
    }

    if (type === 'interactive') {
        const title = (
            msg.interactive?.button_reply?.title ||
            msg.interactive?.list_reply?.title ||
            ''
        ).trim();
        return title ? { id, timestamp, senderName, text: title } : null;
    }

    return null;
}

// ── Penanganan 3 Jenis Webhook Coexistence ────────────────────────────────────

async function handleContactSync(items: MetaContactSyncItem[]): Promise<void> {
    const toAdd: string[] = [];
    const toRemove: string[] = [];

    for (const item of items) {
        if (item.type && item.type !== 'contact') continue;
        const phone = normalizeWaPhone(item.contact?.phone_number);
        if (!phone) continue;
        if (item.action === 'remove') {
            toRemove.push(phone);
        } else {
            toAdd.push(phone);
        }
    }

    if (toAdd.length > 0 || toRemove.length > 0) {
        await syncPhoneContacts(toAdd, toRemove);
    }
}

async function handleMessageEchoes(echoes: MetaMessageEcho[]): Promise<void> {
    const ownerPhone = getOwnerWaPhone();

    for (const echo of echoes) {
        const echoId = (echo.id || '').trim();
        if (echoId) {
            const firstTime = await claimMessageDedup(`echo:${echoId}`);
            if (!firstTime) continue;
        }

        const from = normalizeWaPhone(echo.from);
        const to = normalizeWaPhone(echo.to);
        if (!to) continue;

        // Skenario A: Mas Arzha mengetik di "Chat Diri Sendiri" (Remote Control Zannah)
        if (from === to || to === ownerPhone) {
            const cmd = parseOwnerSelfCommand(echo.text?.body);
            if (!cmd) continue;

            if (cmd.type === 'on') {
                await setWaBotEnabled(true);
            } else if (cmd.type === 'off') {
                await setWaBotEnabled(false);
            } else if (cmd.type === 'skip') {
                await addSkipPhones(cmd.phones);
                for (const p of cmd.phones) await clearPendingBubbles(p);
            } else if (cmd.type === 'unskip') {
                await removeSkipPhones(cmd.phones);
                for (const p of cmd.phones) await clearPhonePause(p);
            } else if (cmd.type === 'reset') {
                for (const p of cmd.phones) {
                    await clearWaHistory(p);
                    await clearPhonePause(p);
                    await clearPendingBubbles(p);
                }
            }

            await recordLastSelfCommand(cmd.raw);
            continue;
        }

        // Skenario B: Mas Arzha membalas manual ke orang lain dari HP -> Auto-Pause 24 jam!
        await pausePhoneForHumanTakeover(to);
        await clearPendingBubbles(to);
    }
}

async function handleSingleInboundMessage(
    msg: MetaInboundMessage,
    senderName: string | undefined,
    phoneNumberIdFallback: string,
    botDisplayPhone: string | undefined,
    hasBackgroundWaitUntil: boolean
): Promise<void> {
    const activeBotPhone = normalizeWaPhone(botDisplayPhone) || getOwnerWaPhone();
    const sender = normalizeWaPhone(msg.from);

    // 1. Cegah pesan dari grup, nomor tidak valid, atau nomor bot itu sendiri (anti-Error 131021)
    if (!sender || sender === activeBotPhone) return;

    const bubble = extractBubbleFromInbound(msg, senderName);
    if (!bubble) return;

    // 2. Deduplikasi idempotency jika Meta mengirim ulang webhook
    const isNewMessage = await claimMessageDedup(bubble.id);
    if (!isNewMessage) return;

    // 3. Gerbang Filter Berlapis (SEBELUM menyentuh Vertex AI / Gemini)
    if (!(await isWaBotEnabled())) return;
    if (await isPhoneSkipped(sender)) return;
    if (shouldSkipSavedContacts() && (await isPhoneInSyncedContacts(sender))) return;
    if (await isPhonePaused(sender)) return;
    if (!(await checkSenderRateLimit(sender))) return;

    const aiConfig = getWaAiConfigStatus();
    const graphCreds = getWaGraphCredentials();
    const phoneNumberId = graphCreds.phoneNumberId || phoneNumberIdFallback;

    if (!aiConfig.configured || !graphCreds.accessToken || !phoneNumberId) {
        console.warn('[whatsapp] Melewati balasan karena kredensial AI atau Graph API belum lengkap.');
        return;
    }

    // 4. Antrekan pesan ke buffer Burst Coalescing & jalankan Jeda Pintar
    const priorHistory = await getWaHistory(sender);
    const isOngoing = priorHistory.length > 0;
    await enqueuePendingBubble(sender, bubble);

    const rawDelayMs = getSmartDelayMs(isOngoing);
    // Jika berjalan tanpa waitUntil, batasi jeda maks 8 detik agar di bawah batas timeout webhook Meta (~20 dtk)
    const effectiveDelayMs = hasBackgroundWaitUntil ? rawDelayMs : Math.min(rawDelayMs, 8000);
    await sleep(effectiveDelayMs);

    // 5. Cek apakah selama jeda ada bubble susulan dari pengirim yang sama
    if (!(await isLatestBurstBubble(sender, bubble.id))) {
        return; // Biarkan eksekusi bubble paling baru yang merangkum semuanya sekaligus!
    }

    // 6. Cek ulang apakah Mas Arzha sudah membalas manual dari HP atau mematikan bot selama jeda
    if (
        !(await isWaBotEnabled()) ||
        (await isPhonePaused(sender)) ||
        (await isPhoneSkipped(sender))
    ) {
        await clearPendingBubbles(sender);
        return;
    }

    const coalescedBubbles = await drainPendingBubbles(sender);
    if (coalescedBubbles.length === 0) return;

    const lastBubble = coalescedBubbles[coalescedBubbles.length - 1];
    const effectiveSenderName = lastBubble.senderName || senderName;

    // 7. Penjaga Anggaran & Kuota Gratis Bulanan (Double Hard-Cap)
    if (!(await hasAiBudgetRemaining())) {
        console.warn('[whatsapp] Pagu anggaran AI bulanan (WA_MONTHLY_BUDGET_IDR) tercapai, Zannah berhenti membalas.');
        return;
    }
    if (!(await reserveMetaReplyQuota())) {
        console.warn('[whatsapp] Batas aman kuota balasan gratis Meta (WA_MONTHLY_MESSAGE_LIMIT) tercapai.');
        return;
    }

    let replyDelivered = false;
    try {
        // 8. Tampilkan centang biru + indikator "sedang mengetik..." di WA pengirim
        await markMessageReadAndTyping(phoneNumberId, graphCreds.accessToken, lastBubble.id);

        // 9. Susun bagian teks & lampiran media (maksimal 2 media per giliran, HANYA jika mode privasi aman)
        const combinedText = coalescedBubbles.map((b) => b.text).join('\n');
        const userParts: WaAiPart[] = [];

        if (aiConfig.privacySafeForMedia) {
            const mediaBubbles = coalescedBubbles.filter((b) => Boolean(b.mediaId)).slice(0, 2);
            for (const mb of mediaBubbles) {
                if (!mb.mediaId) continue;
                const downloaded = await downloadWhatsAppMediaAsBase64(
                    graphCreds.accessToken,
                    mb.mediaId,
                    mb.mediaMimeType
                );
                if (downloaded) {
                    userParts.push({ inlineData: downloaded });
                }
            }
        }

        userParts.push({ text: combinedText });

        const historyTurns: WaAiContent[] = priorHistory.map((h) => ({
            role: h.role,
            parts: h.parts.map((p) => ({ text: p.text })),
        }));

        const contents: WaAiContent[] = [
            ...historyTurns,
            { role: 'user', parts: userParts },
        ];

        // 10. Panggil Vertex AI / Dedicated Gemini
        const aiResult = await generateWaAiReply(
            contents,
            buildZannahWaSystemInstruction(effectiveSenderName)
        );

        if (!aiResult || !aiResult.reply) {
            return;
        }

        await recordAiSpendIdr(aiResult.estimatedCostIdr);

        let finalReplyText = aiResult.reply;

        // 11. Dukungan Proposal / RAB Otomatis (DevRAB Engine) jika penanda [[RAB_READY]] muncul
        const rabTriggered = /\[\[\s*RAB_READY\s*\]\]/i.test(finalReplyText);
        const helperKey = aiConfig.dedicatedApiKeyForHelper || (process.env.GEMINI_API_KEY || '').trim();

        if (rabTriggered && helperKey) {
            try {
                const fullTranscriptArr = await getWaFullTranscript(sender);
                const transcriptLines = [
                    `[Konteks Kanal WhatsApp — Nomor WhatsApp Klien: +${sender}${effectiveSenderName ? `, Nama Profil WA: ${effectiveSenderName}` : ''}]`,
                    ...fullTranscriptArr.map((t) => `${t.role === 'user' ? 'User' : 'Zannah'}: ${t.parts.map((p) => p.text).join(' ')}`),
                    `User: ${combinedText}`,
                ].join('\n');

                const docAttachment = await buildAgentDocumentAttachment(
                    helperKey,
                    finalReplyText,
                    'estimate',
                    combinedText,
                    transcriptLines,
                    `wa:${sender}`
                );

                if (docAttachment.facts) {
                    finalReplyText = await narrateOutcome(helperKey, finalReplyText, docAttachment.facts, 'first');
                }
            } catch (rabErr) {
                console.warn('[whatsapp] Gagal memproses lampiran DevRAB di WA, kirim balasan teks standar:', rabErr);
            }
        }

        const formattedWaBody = formatForWhatsApp(finalReplyText);
        if (!formattedWaBody) return;

        // 12. Kirim balasan ke WhatsApp pengirim
        const sendResult = await sendWhatsAppTextReply({
            phoneNumberId,
            accessToken: graphCreds.accessToken,
            to: sender,
            body: formattedWaBody,
            replyToMessageId: coalescedBubbles.length > 1 ? lastBubble.id : undefined,
            senderBotPhone: botDisplayPhone,
        });

        if (!sendResult.ok) {
            console.error('[whatsapp] Gagal kirim pesan WA:', sendResult);
            return;
        }

        replyDelivered = true;
        await appendWaHistory(sender, combinedText, formattedWaBody);
    } finally {
        // Jika pengiriman gagal sebelum benar-benar terkirim ke Meta, kembalikan kuota bulanan
        if (!replyDelivered) {
            await releaseMetaReplyQuota().catch(() => undefined);
        }
    }
}

async function processWebhookPayload(
    payload: MetaWebhookPayload,
    hasBackgroundWaitUntil: boolean
): Promise<void> {
    if (payload.object !== 'whatsapp_business_account' || !Array.isArray(payload.entry)) {
        return;
    }

    const tasks: Promise<void>[] = [];

    for (const entry of payload.entry) {
        for (const change of entry.changes ?? []) {
            const field = change.field;
            const value = change.value;
            if (!value) continue;

            if (field === 'smb_app_state_sync' && Array.isArray(value.state_sync)) {
                tasks.push(handleContactSync(value.state_sync));
                continue;
            }

            if (field === 'smb_message_echoes' && Array.isArray(value.message_echoes)) {
                tasks.push(handleMessageEchoes(value.message_echoes));
                continue;
            }

            if (field === 'messages' && Array.isArray(value.messages)) {
                const contactMap = new Map<string, string>();
                for (const c of value.contacts ?? []) {
                    const waId = normalizeWaPhone(c.wa_id);
                    const name = (c.profile?.name || '').trim();
                    if (waId && name) contactMap.set(waId, name);
                }

                const fallbackPhoneId = (value.metadata?.phone_number_id || '').trim();
                const botDisplayPhone = (value.metadata?.display_phone_number || '').trim();
                for (const msg of value.messages) {
                    const senderNorm = normalizeWaPhone(msg.from);
                    const senderName = senderNorm ? contactMap.get(senderNorm) : undefined;
                    tasks.push(
                        handleSingleInboundMessage(
                            msg,
                            senderName,
                            fallbackPhoneId,
                            botDisplayPhone,
                            hasBackgroundWaitUntil
                        )
                    );
                }
            }
        }
    }

    await Promise.allSettled(tasks);
}

// ── Respon Panel Admin Ber-PIN ────────────────────────────────────────────────

async function buildAdminStatusResponse() {
    const snapshot = await getWaAdminSnapshot();
    const ai = getWaAiConfigStatus();
    const graph = getWaGraphCredentials();
    return {
        ...snapshot,
        ownerPhone: getOwnerWaPhone(),
        aiMode: ai.mode,
        aiConfigured: ai.configured,
        privacySafeForMedia: ai.privacySafeForMedia,
        graphConfigured: graph.fullyConfigured,
        missingEnv: [
            ...graph.missing,
            ...(ai.configured ? [] : ['GCP_SERVICE_ACCOUNT_JSON / WA_GEMINI_API_KEY']),
        ],
    };
}

// ── Handler Utama Vercel Serverless ───────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const origin = (req.headers.origin as string) || '';
        const allowedOrigin =
            origin && (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.endsWith('arzhaning.my.id') || origin.endsWith('.vercel.app'))
                ? origin
                : 'https://arzhaning.my.id';

        res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-tts-usage-pin, x-hub-signature-256');

        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }

        // ── 1. GET: Verifikasi Challenge Meta ATAU Panel Admin Ber-PIN ────────────
        if (req.method === 'GET') {
            const view = req.query?.view;
            if (view === 'admin') {
                if (!verifyAdminPin(req, res)) return;
                const statusData = await buildAdminStatusResponse();
                res.setHeader('Cache-Control', 'no-store');
                return res.status(200).json(statusData);
            }

            const mode = req.query?.['hub.mode'];
            const token = String(req.query?.['hub.verify_token'] || '');
            const challenge = req.query?.['hub.challenge'];
            const { verifyToken } = getWaGraphCredentials();

            if (mode === 'subscribe' && verifyToken && safeSecretEqual(token, verifyToken)) {
                res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                return res.status(200).send(String(challenge ?? ''));
            }

            return res.status(403).json({ error: 'Verifikasi webhook gagal atau parameter tidak valid.' });
        }

        // ── 2. POST: Aksi Panel Admin Ber-PIN ATAU Webhook Resmi Meta ─────────────
        if (req.method === 'POST') {
            let rawBody: Buffer;
            try {
                rawBody = await readRawBody(req);
            } catch (err) {
                if (err instanceof Error && err.message === 'PAYLOAD_TOO_LARGE') {
                    return res.status(413).json({ error: 'Payload terlalu besar.' });
                }
                return res.status(400).json({ error: 'Gagal membaca body request.' });
            }

            // Cabang 2A: Kontrol dari Panel Admin (TtsQuotaModal)
            if (req.query?.action === 'admin') {
                if (!verifyAdminPin(req, res)) return;

                let bodyObj: Record<string, unknown> = {};
                try {
                    bodyObj = JSON.parse(rawBody.toString('utf8') || '{}') as Record<string, unknown>;
                } catch {
                    return res.status(400).json({ error: 'JSON tidak valid.' });
                }

                const op = String(bodyObj.op || '');
                if (op === 'toggle') {
                    await setWaBotEnabled(Boolean(bodyObj.enabled));
                } else if (op === 'add_skip') {
                    const phones = String(bodyObj.phone || '')
                        .split(/[\s,;]+/)
                        .filter(Boolean);
                    await addSkipPhones(phones);
                } else if (op === 'remove_skip') {
                    const phones = String(bodyObj.phone || '')
                        .split(/[\s,;]+/)
                        .filter(Boolean);
                    await removeSkipPhones(phones);
                    for (const p of phones) await clearPhonePause(p);
                } else if (op === 'reset_contact') {
                    const phone = normalizeWaPhone(String(bodyObj.phone || ''));
                    if (phone) {
                        await clearWaHistory(phone);
                        await clearPhonePause(phone);
                        await clearPendingBubbles(phone);
                    }
                } else {
                    return res.status(400).json({ error: 'Operasi admin tidak dikenal.' });
                }

                const updatedStatus = await buildAdminStatusResponse();
                return res.status(200).json(updatedStatus);
            }

            // Cabang 2B: Webhook Resmi Meta WhatsApp Cloud API (Wajib lolos HMAC-SHA256)
            const sigHeaderRaw = req.headers['x-hub-signature-256'];
            const sigHeader = Array.isArray(sigHeaderRaw) ? sigHeaderRaw[0] : sigHeaderRaw;
            const { appSecret } = getWaGraphCredentials();

            if (!verifyMetaWebhookSignature(rawBody, sigHeader, appSecret)) {
                return res.status(401).json({ error: 'Signature webhook tidak valid.' });
            }

            let payload: MetaWebhookPayload;
            try {
                payload = JSON.parse(rawBody.toString('utf8')) as MetaWebhookPayload;
            } catch {
                return res.status(400).json({ error: 'Payload JSON korup.' });
            }

            const waitUntil = getVercelWaitUntil();
            if (waitUntil) {
                waitUntil(
                    processWebhookPayload(payload, true).catch((err) =>
                        console.error('[whatsapp] Error background waitUntil:', err)
                    )
                );
                return res.status(200).json({ ok: true, mode: 'async' });
            }

            await processWebhookPayload(payload, false);
            return res.status(200).json({ ok: true, mode: 'sync' });
        }

        return res.status(405).json({ error: 'Method tidak diizinkan.' });
    } catch (err) {
        console.error('[whatsapp] Fatal handler error:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
