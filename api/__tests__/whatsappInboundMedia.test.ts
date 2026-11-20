/**
 * api/__tests__/whatsappInboundMedia.test.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Fase 3: webhook /api/whatsapp mengarsipkan lampiran masuk ke Google Drive saat
 * pesan diterima, mencatat metadata ke transkrip Inbox, dan tetap aman bila Drive
 * belum dikonfigurasi / gagal. Semua jaringan di-mock (`fetch`).
 */

import { createHmac, generateKeyPairSync } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetGoogleDriveCacheForTests } from '../_lib/googleDrive.js';
import {
    addSkipPhones,
    getWaFullTranscript,
    getWaHistory,
    listInboxContacts,
    pausePhoneForHumanTakeover,
    resetWaMemoryStoreForTests,
} from '../_lib/whatsappState.js';
import { resetVertexTokenCacheForTests } from '../_lib/whatsappAi.js';
import handler from '../whatsapp.js';

const TEST_RSA = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});
const TEST_SERVICE_ACCOUNT = JSON.stringify({
    type: 'service_account',
    project_id: 'arzha-wa-vertex-test',
    client_email: 'zannah-wa@arzha-wa-vertex-test.iam.gserviceaccount.com',
    private_key: TEST_RSA.privateKey,
    token_uri: 'https://oauth2.google.com/token',
});

const APP_SECRET = 'rahasia-meta-app-secret-test';
const ACCESS_TOKEN = 'EAABtestAccessToken';
const PHONE_ID = '109876543210';
const OWNER_PHONE = '6282312312734';
const CLIENT = '6281399990000';
const REPLY = 'Halo, saya Zannah asistennya Mas Arzha. File sudah saya terima ya 🙏';

interface FakeMedia {
    mime: string;
    size?: number;
    body?: Buffer;
}

function makeRes() {
    return {
        statusCode: 200,
        headers: {} as Record<string, string>,
        body: undefined as unknown,
        setHeader(k: string, v: string) {
            this.headers[k] = v;
            return this;
        },
        status(c: number) {
            this.statusCode = c;
            return this;
        },
        json(b: unknown) {
            this.body = b;
            return this;
        },
        send(b: unknown) {
            this.body = b;
            return this;
        },
        end() {
            return this;
        },
    };
}

function makeSignedPostReq(payload: unknown) {
    const rawBody = Buffer.from(JSON.stringify(payload), 'utf8');
    const signature = `sha256=${createHmac('sha256', APP_SECRET).update(rawBody).digest('hex')}`;
    return {
        method: 'POST',
        query: {},
        body: rawBody,
        headers: { 'content-type': 'application/json', 'x-hub-signature-256': signature },
        socket: { remoteAddress: '127.0.0.1' },
    } as any;
}

function inboundPayload(message: Record<string, unknown>, from = CLIENT) {
    return {
        object: 'whatsapp_business_account',
        entry: [
            {
                changes: [
                    {
                        field: 'messages',
                        value: {
                            metadata: { display_phone_number: '15557499583', phone_number_id: PHONE_ID },
                            contacts: [{ wa_id: from, profile: { name: 'Klien Uji' } }],
                            messages: [{ from, timestamp: '1760000001', ...message }],
                        },
                    },
                ],
            },
        ],
    };
}

const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('Fase 3: arsip media masuk di webhook /api/whatsapp', () => {
    let fetchMock: ReturnType<typeof vi.fn>;
    let mediaTable: Record<string, FakeMedia>;
    let driveTokenStatus: number;

    const calls = () => fetchMock.mock.calls.map(([u]) => String(u));
    const driveUploads = () => calls().filter((u) => u.includes('/upload/drive/v3/files'));
    const vertexBodies = () =>
        fetchMock.mock.calls
            .filter(([u]) => String(u).includes('aiplatform.googleapis.com'))
            .map(([, init]) => JSON.parse((init as { body: string }).body));
    const outboundTexts = () =>
        fetchMock.mock.calls
            .filter(([u]) => String(u).includes(`/${PHONE_ID}/messages`))
            .map(([, init]) => JSON.parse((init as { body: string }).body))
            .filter((b) => b.type === 'text');

    function enableDrive() {
        vi.stubEnv('GDRIVE_CLIENT_ID', 'client-id');
        vi.stubEnv('GDRIVE_CLIENT_SECRET', 'client-secret');
        vi.stubEnv('GDRIVE_REFRESH_TOKEN', 'refresh-token');
    }

    beforeEach(() => {
        resetWaMemoryStoreForTests();
        resetVertexTokenCacheForTests();
        resetGoogleDriveCacheForTests();
        driveTokenStatus = 200;
        mediaTable = {
            MEDIA_FOTO_1: { mime: 'image/jpeg', body: Buffer.from([0xff, 0xd8, 0xff, 0xd9]) },
            MEDIA_PDF_1: { mime: 'application/pdf', body: Buffer.from('%PDF-1.4 isi') },
            MEDIA_VIDEO_1: { mime: 'video/mp4', body: Buffer.from('fake-mp4-bytes') },
            MEDIA_BESAR_1: { mime: 'application/pdf', size: 40 * 1024 * 1024, body: Buffer.from('x') },
        };

        for (const k of ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'KV_REST_API_URL', 'KV_REST_API_TOKEN']) {
            vi.stubEnv(k, '');
        }
        for (const k of ['GDRIVE_CLIENT_ID', 'GDRIVE_CLIENT_SECRET', 'GDRIVE_REFRESH_TOKEN', 'GDRIVE_FOLDER_ID', 'GDRIVE_SHARE_EMAIL', 'WA_MEDIA_MAX_MB']) {
            vi.stubEnv(k, '');
        }
        vi.stubEnv('WA_VERIFY_TOKEN', 'verifikasi-test');
        vi.stubEnv('WA_APP_SECRET', APP_SECRET);
        vi.stubEnv('WA_ACCESS_TOKEN', ACCESS_TOKEN);
        vi.stubEnv('WA_PHONE_NUMBER_ID', PHONE_ID);
        vi.stubEnv('WA_OWNER_PHONE', OWNER_PHONE);
        vi.stubEnv('WA_SMART_DELAY_MS', '30');
        vi.stubEnv('WA_MONTHLY_MESSAGE_LIMIT', '950');
        vi.stubEnv('WA_MONTHLY_BUDGET_IDR', '5000');
        vi.stubEnv('WA_NOTIFY_OWNER', 'false');
        vi.stubEnv('GCP_SERVICE_ACCOUNT_JSON', TEST_SERVICE_ACCOUNT);
        vi.stubEnv('GCP_VERTEX_LOCATION', 'us-central1');
        vi.stubEnv('TTS_USAGE_PIN', '9876');
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        fetchMock = vi.fn(async (input: unknown, init?: RequestInit) => {
            const url = String(input);
            const method = (init?.method || 'GET').toUpperCase();

            // Vertex AI
            if (url === 'https://oauth2.google.com/token') return json({ access_token: 'ya29.vertex', expires_in: 3600 });
            if (url.includes('aiplatform.googleapis.com') && url.includes(':generateContent')) {
                return json({
                    candidates: [{ content: { parts: [{ text: REPLY }] }, finishReason: 'STOP' }],
                    usageMetadata: { promptTokenCount: 900, candidatesTokenCount: 40 },
                });
            }

            // Meta Graph: kirim pesan
            if (url.includes('graph.facebook.com') && url.endsWith('/messages')) {
                return json({ messages: [{ id: 'wamid.OUT_1' }] });
            }
            // Meta Graph: metadata media
            const mediaId = Object.keys(mediaTable).find((id) => url.endsWith(`/${id}`));
            if (url.includes('graph.facebook.com') && mediaId) {
                const m = mediaTable[mediaId];
                return json({
                    url: `https://lookaside.fbsbx.com/whatsapp_business/attachments/?mid=${mediaId}`,
                    mime_type: m.mime,
                    file_size: m.size ?? m.body?.length ?? 10,
                });
            }
            if (url.startsWith('https://lookaside.fbsbx.com/')) {
                const id = /mid=([A-Za-z0-9_]+)/.exec(url)?.[1] ?? '';
                return new Response(new Uint8Array(mediaTable[id]?.body ?? Buffer.from('?')), { status: 200 });
            }

            // Google Drive
            if (url.startsWith('https://oauth2.googleapis.com/token')) {
                if (driveTokenStatus !== 200) return json({ error: 'invalid_grant', error_description: 'Token has been expired or revoked.' }, driveTokenStatus);
                return json({ access_token: 'ya29.drive', expires_in: 3600 });
            }
            if (method === 'GET' && url.includes('/drive/v3/files?q=')) return json({ files: [{ id: 'FOLDER123456789' }] });
            if (url.includes('/upload/drive/v3/files')) {
                const body = Buffer.from(init?.body as Uint8Array).toString('latin1');
                const name = /"name":"([^"]+)"/.exec(body)?.[1] ?? 'x';
                return json({
                    id: 'DRIVEFILE1234567890',
                    name,
                    mimeType: 'application/octet-stream',
                    size: '12',
                    webViewLink: 'https://drive.google.com/file/d/DRIVEFILE1234567890/view',
                });
            }

            return json({ error: { message: `tidak di-mock: ${url}` } }, 404);
        });
        vi.stubGlobal('fetch', fetchMock);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllEnvs();
        vi.unstubAllGlobals();
    });

    it('mengarsipkan foto ke Drive, mencatat metadata di transkrip Inbox, & Gemini tetap menerima gambar', async () => {
        enableDrive();
        const res = makeRes();
        await handler(
            makeSignedPostReq(
                inboundPayload({
                    id: 'wamid.FOTO_1',
                    type: 'image',
                    image: { id: 'MEDIA_FOTO_1', mime_type: 'image/jpeg', caption: 'Ini foto denah rumahnya' },
                })
            ),
            res as any
        );
        expect(res.statusCode).toBe(200);

        expect(driveUploads()).toHaveLength(1);
        expect(outboundTexts().some((b) => b.to === CLIENT && b.text.body === REPLY)).toBe(true);
        expect(vertexBodies()[0].contents.at(-1).parts[0].inlineData.mimeType).toBe('image/jpeg');

        const transcript = await getWaFullTranscript(CLIENT);
        const userTurn = transcript.find((t) => t.role === 'user');
        expect(userTurn?.media).toHaveLength(1);
        expect(userTurn?.media?.[0]).toMatchObject({
            type: 'image',
            driveFileId: 'DRIVEFILE1234567890',
            mimeType: 'image/jpeg',
            caption: 'Ini foto denah rumahnya',
        });

        const contacts = await listInboxContacts();
        expect(contacts[0].lastMessage).toBe('Ini foto denah rumahnya');
    });

    it('memakai label pratinjau Inbox untuk dokumen tanpa caption', async () => {
        enableDrive();
        await handler(
            makeSignedPostReq(
                inboundPayload({
                    id: 'wamid.PDF_1',
                    type: 'document',
                    document: { id: 'MEDIA_PDF_1', mime_type: 'application/pdf', filename: 'Spesifikasi.pdf' },
                })
            ),
            makeRes() as any
        );

        const contacts = await listInboxContacts();
        expect(contacts[0].lastMessage).toBe('[📄 Dokumen: Spesifikasi.pdf]');
        const userTurn = (await getWaFullTranscript(CLIENT)).find((t) => t.role === 'user');
        expect(userTurn?.media?.[0]).toMatchObject({ type: 'document', fileName: 'Spesifikasi.pdf' });
    });

    it('menangani video: diarsipkan ke Drive, TIDAK dikirim ke Gemini, bot tetap membalas', async () => {
        enableDrive();
        await handler(
            makeSignedPostReq(
                inboundPayload({
                    id: 'wamid.VID_1',
                    type: 'video',
                    video: { id: 'MEDIA_VIDEO_1', mime_type: 'video/mp4', caption: 'Kondisi lapangan' },
                })
            ),
            makeRes() as any
        );

        expect(driveUploads()).toHaveLength(1);
        const parts = vertexBodies()[0].contents.at(-1).parts as Array<Record<string, unknown>>;
        expect(parts.some((p) => 'inlineData' in p)).toBe(false);
        expect(outboundTexts().some((b) => b.to === CLIENT)).toBe(true);
        const userTurn = (await getWaFullTranscript(CLIENT)).find((t) => t.role === 'user');
        expect(userTurn?.media?.[0].type).toBe('video');
    });

    it('bot di-pause: lampiran tetap diarsipkan & tampil di Inbox, tetapi tidak ada balasan AI', async () => {
        enableDrive();
        await pausePhoneForHumanTakeover(CLIENT);

        await handler(
            makeSignedPostReq(
                inboundPayload({
                    id: 'wamid.FOTO_PAUSE',
                    type: 'image',
                    image: { id: 'MEDIA_FOTO_1', mime_type: 'image/jpeg' },
                })
            ),
            makeRes() as any
        );

        expect(driveUploads()).toHaveLength(1);
        expect(vertexBodies()).toHaveLength(0);
        expect(outboundTexts()).toHaveLength(0);

        const transcript = await getWaFullTranscript(CLIENT);
        expect(transcript).toHaveLength(1);
        expect(transcript[0].media?.[0].driveFileId).toBe('DRIVEFILE1234567890');
        // Konteks AI tidak tercemar: riwayat percakapan tetap kosong
        expect(await getWaHistory(CLIENT)).toHaveLength(0);
    });

    it('pesan teks saat bot di-pause tetap diabaikan seperti sebelumnya (tanpa unduh/arsip)', async () => {
        enableDrive();
        await pausePhoneForHumanTakeover(CLIENT);
        await handler(
            makeSignedPostReq(inboundPayload({ id: 'wamid.TXT_PAUSE', type: 'text', text: { body: 'halo' } })),
            makeRes() as any
        );
        expect(driveUploads()).toHaveLength(0);
        expect(vertexBodies()).toHaveLength(0);
        expect(await getWaFullTranscript(CLIENT)).toHaveLength(0);
    });

    it('nomor di Skip List tidak pernah diunduh/diarsipkan', async () => {
        enableDrive();
        await addSkipPhones([CLIENT]);
        await handler(
            makeSignedPostReq(
                inboundPayload({
                    id: 'wamid.FOTO_SKIP',
                    type: 'image',
                    image: { id: 'MEDIA_FOTO_1', mime_type: 'image/jpeg' },
                })
            ),
            makeRes() as any
        );
        expect(calls().filter((u) => u.includes('MEDIA_FOTO_1'))).toHaveLength(0);
        expect(driveUploads()).toHaveLength(0);
    });

    it('Drive belum dikonfigurasi: perilaku lama utuh (tidak ada unduhan arsip, bot tetap membalas)', async () => {
        await handler(
            makeSignedPostReq(
                inboundPayload({
                    id: 'wamid.FOTO_NODRIVE',
                    type: 'image',
                    image: { id: 'MEDIA_FOTO_1', mime_type: 'image/jpeg' },
                })
            ),
            makeRes() as any
        );

        expect(driveUploads()).toHaveLength(0);
        // Hanya SATU unduhan metadata media (jalur Gemini lama), bukan dua
        expect(calls().filter((u) => u.endsWith('/MEDIA_FOTO_1'))).toHaveLength(1);
        expect(outboundTexts().some((b) => b.to === CLIENT && b.text.body === REPLY)).toBe(true);
        const userTurn = (await getWaFullTranscript(CLIENT)).find((t) => t.role === 'user');
        expect(userTurn?.media).toBeUndefined();
    });

    it('file melebihi batas: tidak diarsipkan & Zannah diberi konteks agar menjawab sopan', async () => {
        enableDrive();
        vi.stubEnv('WA_MEDIA_MAX_MB', '15');
        await handler(
            makeSignedPostReq(
                inboundPayload({
                    id: 'wamid.BESAR_1',
                    type: 'document',
                    document: { id: 'MEDIA_BESAR_1', mime_type: 'application/pdf', filename: 'Besar.pdf' },
                })
            ),
            makeRes() as any
        );

        expect(driveUploads()).toHaveLength(0);
        const parts = vertexBodies()[0].contents.at(-1).parts as Array<{ text?: string }>;
        const text = parts.map((p) => p.text || '').join('\n');
        expect(text).toContain('melebihi batas penyimpanan 15 MB');
        expect(outboundTexts().some((b) => b.to === CLIENT)).toBe(true);
    });

    it('invalid_grant: bot tetap membalas & Mas Arzha diberi peringatan maksimal 1x per hari', async () => {
        enableDrive();
        vi.stubEnv('WA_SKIP_SAVED_CONTACTS', 'false');
        vi.stubEnv('WA_NOTIFY_OWNER', 'true'); // peringatan Drive mengikuti saklar notifikasi owner yang sudah ada
        driveTokenStatus = 400;

        for (const [i, from] of [CLIENT, '6281377770000'].entries()) {
            await handler(
                makeSignedPostReq(
                    inboundPayload(
                        { id: `wamid.IG_${i}`, type: 'image', image: { id: 'MEDIA_FOTO_1', mime_type: 'image/jpeg' } },
                        from
                    )
                ),
                makeRes() as any
            );
        }

        const toClient = outboundTexts().filter((b) => b.to !== OWNER_PHONE);
        const warnings = outboundTexts().filter(
            (b) => b.to === OWNER_PHONE && String(b.text.body).includes('Google Drive')
        );
        expect(toClient).toHaveLength(2);
        expect(warnings).toHaveLength(1);
        expect(driveUploads()).toHaveLength(0);
    });
});
