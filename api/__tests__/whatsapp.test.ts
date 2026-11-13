/**
 * api/__tests__/whatsapp.test.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Pengujian otomatis menyeluruh untuk integrasi Zannah AI ke WhatsApp Cloud API
 * (Mode Coexistence, Vertex AI RS256 JWT, Burst Coalescing, Filter Kontak,
 * Remote Control Chat Diri Sendiri, Auto-Pause Manual, & Double Hard-Cap).
 */

import { createHmac, generateKeyPairSync } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    getMetaRepliesUsed,
    normalizeWaPhone,
    resetWaMemoryStoreForTests,
} from '../_lib/whatsappState.js';
import {
    formatForWhatsApp,
    parseOwnerSelfCommand,
} from '../_lib/whatsappPrompt.js';
import {
    sanitizeMediaMimeType,
    sendWhatsAppTextReply,
} from '../_lib/whatsappGraph.js';
import { resetVertexTokenCacheForTests } from '../_lib/whatsappAi.js';
import handler from '../whatsapp.js';

// Pasangan kunci RSA sementara untuk menguji penandatanganan RS256 JWT Vertex AI asli
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
const VERIFY_TOKEN = 'verifikasi-webhook-zannah-test';
const ACCESS_TOKEN = 'EAABtestAccessToken';
const PHONE_ID = '109876543210';
const OWNER_PHONE = '6282312312734';
const ADMIN_PIN = '9876';

interface FakeRes {
    statusCode: number;
    headers: Record<string, string>;
    body: unknown;
    setHeader(k: string, v: string): FakeRes;
    status(c: number): FakeRes;
    json(b: unknown): FakeRes;
    send(b: unknown): FakeRes;
    end(): FakeRes;
}

function makeRes(): FakeRes {
    return {
        statusCode: 200,
        headers: {},
        body: undefined,
        setHeader(k, v) {
            this.headers[k] = v;
            return this;
        },
        status(c) {
            this.statusCode = c;
            return this;
        },
        json(b) {
            this.body = b;
            return this;
        },
        send(b) {
            this.body = b;
            return this;
        },
        end() {
            return this;
        },
    };
}

function signWebhookPayload(payload: unknown): { rawBody: Buffer; signature: string } {
    const rawBody = Buffer.from(JSON.stringify(payload), 'utf8');
    const hex = createHmac('sha256', APP_SECRET).update(rawBody).digest('hex');
    return { rawBody, signature: `sha256=${hex}` };
}

function makeSignedPostReq(payload: unknown, extraHeaders: Record<string, string> = {}) {
    const { rawBody, signature } = signWebhookPayload(payload);
    return {
        method: 'POST',
        query: {},
        body: rawBody,
        headers: {
            'content-type': 'application/json',
            'x-hub-signature-256': signature,
            ...extraHeaders,
        },
        socket: { remoteAddress: '127.0.0.1' },
    } as any;
}

describe('Unit Utilitas WhatsApp Zannah AI', () => {
    it('menormalisasi berbagai format nomor telepon Indonesia & menolak JID grup', () => {
        expect(normalizeWaPhone('0812-3456-7890')).toBe('6281234567890');
        expect(normalizeWaPhone('+62 812 3456 7890')).toBe('6281234567890');
        expect(normalizeWaPhone('85711223344')).toBe('6285711223344');
        expect(normalizeWaPhone('6282312312734@s.whatsapp.net')).toBe('6282312312734');
        expect(normalizeWaPhone('12036304123456789@g.us')).toBe('');
        expect(normalizeWaPhone('123')).toBe('');
    });

    it('mem-parsing perintah rahasia di Chat Diri Sendiri (#on, #off, #skip, #unskip, #reset)', () => {
        expect(parseOwnerSelfCommand('#off')).toEqual({ type: 'off', raw: '#off' });
        expect(parseOwnerSelfCommand('/on')).toEqual({ type: 'on', raw: '/on' });
        expect(parseOwnerSelfCommand('#skip 0812-1111-2222, +6285733334444')).toEqual({
            type: 'skip',
            phones: ['6281211112222', '6285733334444'],
            raw: '#skip 0812-1111-2222, +6285733334444',
        });
        expect(parseOwnerSelfCommand('#unskip 081211112222')).toEqual({
            type: 'unskip',
            phones: ['6281211112222'],
            raw: '#unskip 081211112222',
        });
        expect(parseOwnerSelfCommand('#reset 081211112222')).toEqual({
            type: 'reset',
            phones: ['6281211112222'],
            raw: '#reset 081211112222',
        });
        // Catatan belanja biasa di Chat Diri Sendiri harus diabaikan
        expect(parseOwnerSelfCommand('Beli kopi susu 2 bungkus sore nanti')).toBeNull();
    });

    it('memformat teks Markdown menjadi gaya WhatsApp yang bersih tanpa tag internal', () => {
        const dirty = [
            '### Estimasi Proyek',
            'Biaya mulai **Rp1.500.000** ya Kak.',
            '[📄 PDF Resmi](https://devrab.example.com/pdf/123)',
            '[💬 Lanjut ke WA Mas Arzha](https://wa.me/6282312312734?text=Halo)',
            'Nanti pas Kakak klik, ringkasan obrolan kita ini otomatis ikut kekirim ke Mas Arzha ya.',
            '[[RAB_READY]]',
        ].join('\n');

        const formatted = formatForWhatsApp(dirty);
        expect(formatted).toContain('*Estimasi Proyek*');
        expect(formatted).toContain('*Rp1.500.000*');
        expect(formatted).toContain('📄 PDF Resmi: https://devrab.example.com/pdf/123');
        expect(formatted).not.toContain('**');
        expect(formatted).not.toContain('wa.me/6282312312734');
        expect(formatted).not.toContain('[[RAB_READY]]');
    });

    it('membersihkan parameter codec pada MIME voice note WhatsApp agar diterima Vertex AI', () => {
        expect(sanitizeMediaMimeType('audio/ogg; codecs=opus')).toBe('audio/ogg');
        expect(sanitizeMediaMimeType('image/jpeg')).toBe('image/jpeg');
    });
});

describe('Integrasi Webhook /api/whatsapp & Kontrol Admin', () => {
    let fetchMock: ReturnType<typeof vi.fn>;
    let vertexReplyText: string;

    beforeEach(() => {
        resetWaMemoryStoreForTests();
        resetVertexTokenCacheForTests();
        vertexReplyText = 'Halo Pak, saya Zannah asistennya Mas Arzha. Pesannya sudah saya teruskan ke beliau ya 🙏';

        vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
        vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
        vi.stubEnv('KV_REST_API_URL', '');
        vi.stubEnv('KV_REST_API_TOKEN', '');

        vi.stubEnv('WA_VERIFY_TOKEN', VERIFY_TOKEN);
        vi.stubEnv('WA_APP_SECRET', APP_SECRET);
        vi.stubEnv('WA_ACCESS_TOKEN', ACCESS_TOKEN);
        vi.stubEnv('WA_PHONE_NUMBER_ID', PHONE_ID);
        vi.stubEnv('WA_OWNER_PHONE', OWNER_PHONE);
        vi.stubEnv('WA_SMART_DELAY_MS', '30'); // Dipercepat 30ms agar pengujian instan
        vi.stubEnv('WA_MONTHLY_MESSAGE_LIMIT', '950');
        vi.stubEnv('WA_MONTHLY_BUDGET_IDR', '5000');
        vi.stubEnv('GCP_SERVICE_ACCOUNT_JSON', TEST_SERVICE_ACCOUNT);
        vi.stubEnv('GCP_VERTEX_LOCATION', 'us-central1');
        vi.stubEnv('TTS_USAGE_PIN', ADMIN_PIN);

        fetchMock = vi.fn(async (input: string | URL) => {
            const url = String(input);

            if (url === 'https://oauth2.google.com/token') {
                return {
                    ok: true,
                    status: 200,
                    json: async () => ({ access_token: 'ya29.fake-vertex-token', expires_in: 3600 }),
                };
            }

            if (url.includes('aiplatform.googleapis.com') && url.includes(':generateContent')) {
                return {
                    ok: true,
                    status: 200,
                    json: async () => ({
                        candidates: [{ content: { parts: [{ text: vertexReplyText }] }, finishReason: 'STOP' }],
                        usageMetadata: { promptTokenCount: 950, candidatesTokenCount: 45 },
                    }),
                };
            }

            if (url.includes('graph.facebook.com') && url.endsWith('/messages')) {
                return {
                    ok: true,
                    status: 200,
                    json: async () => ({ messages: [{ id: 'wamid.OUTBOUND_1' }] }),
                };
            }

            if (url.includes('graph.facebook.com/v22.0/MEDIA_FOTO_KURIR')) {
                return {
                    ok: true,
                    status: 200,
                    json: async () => ({
                        url: 'https://lookaside.fbsbx.com/whatsapp_business/attachments/?mid=123',
                        mime_type: 'image/jpeg',
                        file_size: 1024,
                    }),
                };
            }

            if (url.includes('lookaside.fbsbx.com')) {
                return {
                    ok: true,
                    status: 200,
                    arrayBuffer: async () => new Uint8Array([0xff, 0xd8, 0xff, 0xd9]).buffer,
                };
            }

            return { ok: false, status: 404, text: async () => 'Not found', json: async () => ({}) };
        });

        vi.stubGlobal('fetch', fetchMock);
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        vi.unstubAllGlobals();
    });

    it('menjawab tantangan verifikasi GET webhook Meta dengan hub.challenge yang tepat', async () => {
        const okReq = {
            method: 'GET',
            query: {
                'hub.mode': 'subscribe',
                'hub.verify_token': VERIFY_TOKEN,
                'hub.challenge': '99887766',
            },
            headers: {},
        } as any;
        const okRes = makeRes();
        await handler(okReq, okRes as any);
        expect(okRes.statusCode).toBe(200);
        expect(okRes.body).toBe('99887766');

        const badReq = {
            method: 'GET',
            query: {
                'hub.mode': 'subscribe',
                'hub.verify_token': 'token-palsu',
                'hub.challenge': '99887766',
            },
            headers: {},
        } as any;
        const badRes = makeRes();
        await handler(badReq, badRes as any);
        expect(badRes.statusCode).toBe(403);
    });

    it('menolak POST webhook tanpa signature HMAC-SHA256 yang sah (401)', async () => {
        const req = {
            method: 'POST',
            query: {},
            body: Buffer.from('{"object":"whatsapp_business_account"}', 'utf8'),
            headers: { 'x-hub-signature-256': 'sha256=deadbeef' },
        } as any;
        const res = makeRes();
        await handler(req, res as any);
        expect(res.statusCode).toBe(401);
    });

    it('membalas chat & foto kurir paket via Vertex AI, mengirim typing indicator, & mencatat kuota', async () => {
        const payload = {
            object: 'whatsapp_business_account',
            entry: [
                {
                    id: 'WABA_1',
                    changes: [
                        {
                            field: 'messages',
                            value: {
                                metadata: { phone_number_id: PHONE_ID },
                                contacts: [{ wa_id: '6281399990000', profile: { name: 'Bang Kurir JNE' } }],
                                messages: [
                                    {
                                        from: '6281399990000',
                                        id: 'wamid.KURIR_FOTO_1',
                                        timestamp: '1760000001',
                                        type: 'image',
                                        image: {
                                            id: 'MEDIA_FOTO_KURIR',
                                            mime_type: 'image/jpeg',
                                            caption: 'Permisi Mas Arzha paket sudah di rak teras ya',
                                        },
                                    },
                                ],
                            },
                        },
                    ],
                },
            ],
        };

        const res = makeRes();
        await handler(makeSignedPostReq(payload), res as any);
        expect(res.statusCode).toBe(200);

        const graphCalls = fetchMock.mock.calls
            .filter(([u]) => String(u).includes(`/${PHONE_ID}/messages`))
            .map(([, init]) => JSON.parse((init as { body: string }).body));

        // Panggilan 1: Read receipt + Typing indicator
        expect(graphCalls[0]).toMatchObject({
            messaging_product: 'whatsapp',
            status: 'read',
            message_id: 'wamid.KURIR_FOTO_1',
            typing_indicator: { type: 'text' },
        });

        // Panggilan 2: Balasan teks Zannah
        expect(graphCalls[1]).toMatchObject({
            messaging_product: 'whatsapp',
            to: '6281399990000',
            type: 'text',
            text: { body: vertexReplyText },
        });

        // Verifikasi Vertex AI menerima inlineData foto dari kurir
        const vertexCall = fetchMock.mock.calls.find(([u]) => String(u).includes('aiplatform.googleapis.com'));
        expect(vertexCall).toBeTruthy();
        const vertexBody = JSON.parse((vertexCall![1] as { body: string }).body);
        expect(vertexBody.contents[0].parts[0].inlineData.mimeType).toBe('image/jpeg');

        expect(await getMetaRepliesUsed()).toBe(1);
    });

    it('menggabungkan rentetan bubble cepat (Burst Coalescing) menjadi 1 balasan tunggal hemat kuota', async () => {
        vi.stubEnv('WA_SMART_DELAY_MS', '80');

        const makeBubblePayload = (id: string, text: string) => ({
            object: 'whatsapp_business_account',
            entry: [
                {
                    changes: [
                        {
                            field: 'messages',
                            value: {
                                contacts: [{ wa_id: '6281577778888', profile: { name: 'Calon Klien' } }],
                                messages: [{ from: '6281577778888', id, timestamp: '1760000010', type: 'text', text: { body: text } }],
                            },
                        },
                    ],
                },
            ],
        });

        // Dua bubble dikirim hampir bersamaan (selisih 15ms < jeda 80ms)
        const p1 = handler(makeSignedPostReq(makeBubblePayload('wamid.B1', 'Malam Mas Arzha')), makeRes() as any);
        await new Promise((r) => setTimeout(r, 15));
        const p2 = handler(makeSignedPostReq(makeBubblePayload('wamid.B2', 'Mau tanya bikin web kasir berapa ya?')), makeRes() as any);

        await Promise.all([p1, p2]);

        const outboundTextCalls = fetchMock.mock.calls
            .filter(([u]) => String(u).includes(`/${PHONE_ID}/messages`))
            .map(([, init]) => JSON.parse((init as { body: string }).body))
            .filter((b) => b.type === 'text');

        // Hanya 1 pesan balasan yang keluar ke Meta (hemat kuota 1.000 pesan!)
        expect(outboundTextCalls).toHaveLength(1);
        expect(await getMetaRepliesUsed()).toBe(1);

        // Vertex AI menerima gabungan kedua bubble secara utuh
        const vertexCalls = fetchMock.mock.calls.filter(([u]) => String(u).includes('aiplatform.googleapis.com'));
        expect(vertexCalls).toHaveLength(1);
        const sentPrompt = JSON.parse((vertexCalls[0][1] as { body: string }).body).contents[0].parts[0].text;
        expect(sentPrompt).toBe('Malam Mas Arzha\nMau tanya bikin web kasir berapa ya?');
    });

    it('mengabaikan nomor kontak HP yang tersinkron lewat smb_app_state_sync', async () => {
        // 1. Meta menyinkronkan buku kontak HP Mas Arzha
        const syncPayload = {
            object: 'whatsapp_business_account',
            entry: [
                {
                    changes: [
                        {
                            field: 'smb_app_state_sync',
                            value: {
                                state_sync: [
                                    { type: 'contact', action: 'add', contact: { phone_number: '0811-2233-4455', full_name: 'Ibu Rumah' } },
                                ],
                            },
                        },
                    ],
                },
            ],
        };
        await handler(makeSignedPostReq(syncPayload), makeRes() as any);

        // 2. Kontak tersebut mengirim chat pribadi -> Zannah WAJIB diam & tidak memanggil Vertex AI
        const chatPayload = {
            object: 'whatsapp_business_account',
            entry: [
                {
                    changes: [
                        {
                            field: 'messages',
                            value: {
                                messages: [{ from: '6281122334455', id: 'wamid.FAM_1', type: 'text', text: { body: 'Lagi di mana nak?' } }],
                            },
                        },
                    ],
                },
            ],
        };
        await handler(makeSignedPostReq(chatPayload), makeRes() as any);

        expect(fetchMock).not.toHaveBeenCalled();
        expect(await getMetaRepliesUsed()).toBe(0);
    });

    it('mendukung saklar #off/#on di Chat Diri Sendiri & auto-pause 24 jam saat Mas Arzha balas manual', async () => {
        // 1. Mas Arzha ketik #off di Chat Diri Sendiri
        const selfOffPayload = {
            object: 'whatsapp_business_account',
            entry: [
                {
                    changes: [
                        {
                            field: 'smb_message_echoes',
                            value: {
                                message_echoes: [
                                    { from: OWNER_PHONE, to: OWNER_PHONE, id: 'wamid.ECHO_OFF', type: 'text', text: { body: '#off' } },
                                ],
                            },
                        },
                    ],
                },
            ],
        };
        await handler(makeSignedPostReq(selfOffPayload), makeRes() as any);

        // Tamu chat saat #off -> Zannah diam
        const guestMsg1 = {
            object: 'whatsapp_business_account',
            entry: [
                {
                    changes: [
                        {
                            field: 'messages',
                            value: {
                                messages: [{ from: '6281900001111', id: 'wamid.G1', type: 'text', text: { body: 'Halo' } }],
                            },
                        },
                    ],
                },
            ],
        };
        await handler(makeSignedPostReq(guestMsg1), makeRes() as any);
        expect(await getMetaRepliesUsed()).toBe(0);

        // 2. Mas Arzha nyalakan lagi dengan #on, lalu balas manual ke nomor 6281900002222
        const echoOnAndManualReply = {
            object: 'whatsapp_business_account',
            entry: [
                {
                    changes: [
                        {
                            field: 'smb_message_echoes',
                            value: {
                                message_echoes: [
                                    { from: OWNER_PHONE, to: OWNER_PHONE, id: 'wamid.ECHO_ON', type: 'text', text: { body: '#on' } },
                                    { from: OWNER_PHONE, to: '6281900002222', id: 'wamid.ECHO_MANUAL', type: 'text', text: { body: 'Siap Pak saya keluar sekarang' } },
                                ],
                            },
                        },
                    ],
                },
            ],
        };
        await handler(makeSignedPostReq(echoOnAndManualReply), makeRes() as any);

        // Nomor 6281900002222 membalas lagi -> Zannah diam karena Mas Arzha sudah ambil alih
        const pausedReply = {
            object: 'whatsapp_business_account',
            entry: [
                {
                    changes: [
                        {
                            field: 'messages',
                            value: {
                                messages: [{ from: '6281900002222', id: 'wamid.G2', type: 'text', text: { body: 'Oke ditunggu Mas' } }],
                            },
                        },
                    ],
                },
            ],
        };
        await handler(makeSignedPostReq(pausedReply), makeRes() as any);
        expect(await getMetaRepliesUsed()).toBe(0);
    });

    it('memblokir pengiriman pesan ke nomor utama sendiri (Penjaga Error 131021)', async () => {
        const res = await sendWhatsAppTextReply({
            phoneNumberId: PHONE_ID,
            accessToken: ACCESS_TOKEN,
            to: '0823-1231-2734',
            body: 'Tes kirim ke diri sendiri',
        });
        expect(res.ok).toBe(false);
        expect(res.errorCode).toBe(131021);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('menegakkan batas keras kuota bulanan Meta & mengizinkan manajemen lewat Panel Admin PIN', async () => {
        vi.stubEnv('WA_MONTHLY_MESSAGE_LIMIT', '1');

        const sendFrom = async (phone: string, id: string) => {
            const payload = {
                object: 'whatsapp_business_account',
                entry: [
                    {
                        changes: [
                            {
                                field: 'messages',
                                value: {
                                    messages: [{ from: phone, id, type: 'text', text: { body: 'Tes kuota' } }],
                                },
                            },
                        ],
                    },
                ],
            };
            await handler(makeSignedPostReq(payload), makeRes() as any);
        };

        await sendFrom('6281700000001', 'wamid.Q1');
        await sendFrom('6281700000002', 'wamid.Q2'); // Harus tertahan karena limit=1

        expect(await getMetaRepliesUsed()).toBe(1);

        // Cek endpoint Admin dengan PIN salah -> 401
        const badAdminRes = makeRes();
        await handler(
            { method: 'GET', query: { view: 'admin' }, headers: { 'x-tts-usage-pin': '0000' }, socket: { remoteAddress: '127.0.0.1' } } as any,
            badAdminRes as any
        );
        expect(badAdminRes.statusCode).toBe(401);

        // Tambah nomor pengecualian lewat POST Admin ber-PIN sah
        const adminPostRes = makeRes();
        await handler(
            {
                method: 'POST',
                query: { action: 'admin' },
                headers: { 'x-tts-usage-pin': ADMIN_PIN },
                body: JSON.stringify({ op: 'add_skip', phone: '0856-9988-7766' }),
                socket: { remoteAddress: '127.0.0.1' },
            } as any,
            adminPostRes as any
        );
        expect(adminPostRes.statusCode).toBe(200);
        expect((adminPostRes.body as any).skipList).toContain('6285699887766');
        expect((adminPostRes.body as any).aiMode).toBe('vertex');
    });

    it('memproses penanda [[RAB_READY]] dan membersihkan tag internal sebelum dikirim ke WhatsApp', async () => {
        vi.stubEnv('WA_GEMINI_API_KEY', 'dedicated-wa-helper-key');
        vertexReplyText = 'Siap Kak, Zannah coba proseskan RAB sekarang ya!\n[[RAB_READY]]';

        const payload = {
            object: 'whatsapp_business_account',
            entry: [
                {
                    changes: [
                        {
                            field: 'messages',
                            value: {
                                contacts: [{ wa_id: '6281812345678', profile: { name: 'Budi Klien' } }],
                                messages: [
                                    {
                                        from: '6281812345678',
                                        id: 'wamid.RAB_1',
                                        type: 'text',
                                        text: { body: 'Proses RAB sekarang ya, email saya budi@example.com' },
                                    },
                                ],
                            },
                        },
                    ],
                },
            ],
        };

        const res = makeRes();
        await handler(makeSignedPostReq(payload), res as any);
        expect(res.statusCode).toBe(200);

        const outboundTextCalls = fetchMock.mock.calls
            .filter(([u]) => String(u).includes(`/${PHONE_ID}/messages`))
            .map(([, init]) => JSON.parse((init as { body: string }).body))
            .filter((b) => b.type === 'text');

        expect(outboundTextCalls).toHaveLength(1);
        expect(outboundTextCalls[0].text.body).not.toContain('[[RAB_READY]]');
    });
});
