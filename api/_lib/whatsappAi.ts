/**
 * api/_lib/whatsappAi.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Klien AI khusus jalur WhatsApp Zannah yang TERISOLASI PENUH dari API key
 * gratis landing page (`GEMINI_API_KEY`).
 *
 * Urutan rute:
 *   1. Google Cloud Vertex AI (`GCP_SERVICE_ACCOUNT_JSON`) — DIREKOMENDASIKAN:
 *      - Otomatis memotong kredit gratis $300 GCP (90 hari), lalu saldo deposit Rp200rb.
 *      - Privasi kelas Enterprise (Zero Data Training — aman untuk foto kurir & voice note).
 *      - Tanpa tambahan package npm (JWT RS256 murni dengan `node:crypto`).
 *   2. Dedicated Gemini API Key (`WA_GEMINI_API_KEY`) dari project GCP terpisah.
 *   3. Shared fallback ke `GEMINI_API_KEY` HANYA jika `WA_ALLOW_SHARED_GEMINI_KEY=true`
 *      disetel eksplisit (secara default MATI demi menjaga kuota web & privasi WA).
 */

import { createSign } from 'node:crypto';

export interface WaAiPart {
    text?: string;
    inlineData?: {
        mimeType: string;
        data: string;
    };
}

export interface WaAiContent {
    role: 'user' | 'model';
    parts: WaAiPart[];
}

export interface WaAiResult {
    reply: string;
    model: string;
    provider: 'vertex' | 'aistudio_dedicated' | 'aistudio_shared';
    promptTokens: number;
    outputTokens: number;
    estimatedCostIdr: number;
}

interface ServiceAccountCredentials {
    project_id: string;
    client_email: string;
    private_key: string;
    token_uri?: string;
}

let cachedVertexToken: { accessToken: string; expiresAtMs: number; clientEmail: string } | null = null;

function base64UrlEncode(input: Buffer | string): string {
    const buf = Buffer.isBuffer(input) ? input : Buffer.from(input, 'utf8');
    return buf
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

function stripOuterQuotes(val: string): string {
    const t = val.trim();
    if ((t.startsWith("'") && t.endsWith("'")) || (t.startsWith('"') && t.endsWith('"'))) {
        return t.slice(1, -1).trim();
    }
    return t;
}

/**
 * Membaca kredensial Service Account GCP dari `GCP_SERVICE_ACCOUNT_JSON`
 * (mendukung JSON mentah, terbungkus tanda kutip, maupun string Base64 agar aman di Vercel Env Vars).
 */
export function parseServiceAccountEnv(): ServiceAccountCredentials | null {
    const raw = stripOuterQuotes(process.env.GCP_SERVICE_ACCOUNT_JSON || '');
    if (!raw) return null;

    let jsonStr = raw;
    if (!raw.startsWith('{')) {
        try {
            jsonStr = Buffer.from(raw, 'base64').toString('utf8');
        } catch {
            return null;
        }
    }

    try {
        const parsed = JSON.parse(jsonStr) as Partial<ServiceAccountCredentials>;
        if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
            return null;
        }
        return {
            project_id: parsed.project_id.trim(),
            client_email: parsed.client_email.trim(),
            private_key: parsed.private_key.replace(/\\n/g, '\n'),
            token_uri: parsed.token_uri || 'https://oauth2.google.com/token',
        };
    } catch {
        return null;
    }
}

export function resetVertexTokenCacheForTests(): void {
    cachedVertexToken = null;
}

async function getVertexAccessToken(sa: ServiceAccountCredentials): Promise<string> {
    const nowMs = Date.now();
    if (
        cachedVertexToken &&
        cachedVertexToken.clientEmail === sa.client_email &&
        nowMs < cachedVertexToken.expiresAtMs - 5 * 60 * 1000
    ) {
        return cachedVertexToken.accessToken;
    }

    const nowSec = Math.floor(nowMs / 1000);
    const tokenUri = sa.token_uri || 'https://oauth2.google.com/token';

    const header = base64UrlEncode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const payload = base64UrlEncode(
        JSON.stringify({
            iss: sa.client_email,
            scope: 'https://www.googleapis.com/auth/cloud-platform',
            aud: tokenUri,
            iat: nowSec,
            exp: nowSec + 3600,
        })
    );

    const unsignedJwt = `${header}.${payload}`;
    const signer = createSign('RSA-SHA256');
    signer.update(unsignedJwt);
    signer.end();
    const signature = base64UrlEncode(signer.sign(sa.private_key));
    const assertion = `${unsignedJwt}.${signature}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
        const res = await fetch(tokenUri, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            signal: controller.signal,
            body: new URLSearchParams({
                grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                assertion,
            }).toString(),
        });

        if (!res.ok) {
            const errBody = await res.text().catch(() => '');
            throw new Error(`Vertex OAuth gagal (${res.status}): ${errBody.slice(0, 200)}`);
        }

        const data = (await res.json()) as { access_token?: string; expires_in?: number };
        if (!data.access_token) {
            throw new Error('Vertex OAuth tidak mengembalikan access_token');
        }

        const ttlSec = typeof data.expires_in === 'number' && data.expires_in > 60 ? data.expires_in : 3600;
        cachedVertexToken = {
            accessToken: data.access_token,
            expiresAtMs: nowMs + ttlSec * 1000,
            clientEmail: sa.client_email,
        };
        return data.access_token;
    } finally {
        clearTimeout(timer);
    }
}

/**
 * Menentukan mode provider AI yang aktif saat ini dan apakah privasi Enterprise
 * terpenuhi untuk mengunggah media masuk (foto paket kurir / voice note klien).
 */
export function getWaAiConfigStatus(): {
    configured: boolean;
    mode: 'vertex' | 'aistudio_dedicated' | 'aistudio_shared' | 'unconfigured';
    privacySafeForMedia: boolean;
    dedicatedApiKeyForHelper: string | null;
} {
    const sa = parseServiceAccountEnv();
    if (sa) {
        const helperKey = (process.env.WA_GEMINI_API_KEY || '').trim() || null;
        return {
            configured: true,
            mode: 'vertex',
            privacySafeForMedia: true, // Vertex AI menjamin Zero Data Training
            dedicatedApiKeyForHelper: helperKey,
        };
    }

    const dedicatedKey = (process.env.WA_GEMINI_API_KEY || '').trim();
    if (dedicatedKey) {
        const isPaid = (process.env.WA_GEMINI_KEY_IS_PAID || '').trim().toLowerCase() === 'true';
        return {
            configured: true,
            mode: 'aistudio_dedicated',
            privacySafeForMedia: isPaid,
            dedicatedApiKeyForHelper: dedicatedKey,
        };
    }

    const allowShared = (process.env.WA_ALLOW_SHARED_GEMINI_KEY || '').trim().toLowerCase() === 'true';
    const sharedKey = (process.env.GEMINI_API_KEY || '').trim();
    if (allowShared && sharedKey) {
        return {
            configured: true,
            mode: 'aistudio_shared',
            privacySafeForMedia: false, // Key gratis landing page -> dilarang upload foto/dokumen WA pribadi
            dedicatedApiKeyForHelper: sharedKey,
        };
    }

    return {
        configured: false,
        mode: 'unconfigured',
        privacySafeForMedia: false,
        dedicatedApiKeyForHelper: null,
    };
}

/**
 * Estimasi biaya aktual dalam Rupiah (kurs konservatif Rp16.500/USD).
 */
export function estimateGeminiCostIdr(
    model: string,
    promptTokens: number,
    outputAndThoughtTokens: number,
    isFreeTierKey = false
): number {
    if (isFreeTierKey) return 0;
    const USD_TO_IDR = 16_500;
    const isLite = model.includes('lite');
    const inRatePerMillion = isLite ? 0.10 : 0.30;
    const outRatePerMillion = isLite ? 0.40 : 2.50;

    const usd =
        (Math.max(0, promptTokens) / 1_000_000) * inRatePerMillion +
        (Math.max(0, outputAndThoughtTokens) / 1_000_000) * outRatePerMillion;

    return Math.max(0.5, Math.round(usd * USD_TO_IDR * 100) / 100);
}

function extractReplyFromParts(parts: unknown): string {
    if (!Array.isArray(parts)) return '';
    return parts
        .filter((p): p is { text: string; thought?: boolean } => Boolean(p && typeof p === 'object' && !(p as { thought?: boolean }).thought && typeof (p as { text?: unknown }).text === 'string'))
        .map((p) => p.text)
        .join('')
        .trim();
}

function getVertexModelCandidates(): string[] {
    const custom = (process.env.WA_VERTEX_MODELS || '')
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean);
    if (custom.length > 0) return custom;
    return ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-3.7-flash', 'gemini-3.8-flash'];
}

function getAiStudioModelCandidates(): string[] {
    const custom = (process.env.WA_GEMINI_MODELS || '')
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean);
    if (custom.length > 0) return custom;
    return ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-3.7-flash', 'gemini-3.8-flash'];
}

/**
 * Memanggil model AI khusus WhatsApp Zannah (Vertex AI / Agent Platform sebagai jalur utama,
 * atau WA_GEMINI_API_KEY terpisah jika disetel).
 */
export async function generateWaAiReply(
    contents: WaAiContent[],
    systemInstruction: string
): Promise<WaAiResult | null> {
    const sa = parseServiceAccountEnv();

    // ── Jalur 1: Google Cloud Agent Platform / Vertex AI (Kredit $300 GCP -> Saldo Rp200rb) ─
    if (sa) {
        const configuredLocation = stripOuterQuotes(process.env.GCP_VERTEX_LOCATION || 'global') || 'global';
        // Model Gemini 3.x di Google Cloud Agent Platform berada di lokasi `global`.
        // Tetap sertakan `configuredLocation` sebagai cadangan jika user memakai endpoint regional khusus.
        const locations = configuredLocation === 'global' ? ['global'] : ['global', configuredLocation];
        const projectId = (stripOuterQuotes(process.env.GCP_PROJECT_ID || '') || sa.project_id).trim();

        let accessToken: string;
        try {
            accessToken = await getVertexAccessToken(sa);
        } catch (err) {
            console.error('[whatsappAi] Gagal autentikasi ke Vertex AI:', err);
            accessToken = '';
        }

        if (accessToken) {
            for (const location of locations) {
                const host = location === 'global'
                    ? 'https://aiplatform.googleapis.com'
                    : `https://${location}-aiplatform.googleapis.com`;

                for (const model of getVertexModelCandidates()) {
                    const url = `${host}/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`;
                    const controller = new AbortController();
                    const timer = setTimeout(() => controller.abort(), 14000);
                    try {
                        const res = await fetch(url, {
                            method: 'POST',
                            headers: {
                                Authorization: `Bearer ${accessToken}`,
                                'Content-Type': 'application/json',
                            },
                            signal: controller.signal,
                            body: JSON.stringify({
                                systemInstruction: { role: 'system', parts: [{ text: systemInstruction }] },
                                contents,
                                generationConfig: {
                                    temperature: 0.75,
                                    maxOutputTokens: 4096,
                                    topP: 0.9,
                                },
                                safetySettings: [
                                    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                                    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                                ],
                            }),
                        });

                        if (!res.ok) {
                            const errTxt = await res.text().catch(() => '');
                            console.warn(`[whatsappAi][vertex:${location}] ${model} gagal (${res.status}): ${errTxt.slice(0, 180)}`);
                            continue;
                        }

                        const data = (await res.json()) as {
                            candidates?: Array<{ content?: { parts?: unknown[] } }>;
                            usageMetadata?: {
                                promptTokenCount?: number;
                                candidatesTokenCount?: number;
                                thoughtsTokenCount?: number;
                            };
                        };

                        const reply = extractReplyFromParts(data.candidates?.[0]?.content?.parts);
                        if (!reply) continue;

                        const promptTokens = data.usageMetadata?.promptTokenCount ?? 0;
                        const outputTokens =
                            (data.usageMetadata?.candidatesTokenCount ?? 0) +
                            (data.usageMetadata?.thoughtsTokenCount ?? 0);

                        return {
                            reply,
                            model,
                            provider: 'vertex',
                            promptTokens,
                            outputTokens,
                            estimatedCostIdr: estimateGeminiCostIdr(model, promptTokens, outputTokens, false),
                        };
                    } catch (err) {
                        console.warn(`[whatsappAi][vertex:${location}] Error memanggil ${model}:`, err);
                    } finally {
                        clearTimeout(timer);
                    }
                }
            }
        }
    }

    // ── Jalur 2: Dedicated WA_GEMINI_API_KEY (Project Terpisah dari Website) ──
    const dedicatedKey = (process.env.WA_GEMINI_API_KEY || '').trim();
    const allowShared = (process.env.WA_ALLOW_SHARED_GEMINI_KEY || '').trim().toLowerCase() === 'true';
    const fallbackSharedKey = allowShared ? (process.env.GEMINI_API_KEY || '').trim() : '';

    const apiKey = dedicatedKey || fallbackSharedKey;
    if (!apiKey) return null;

    const provider: 'aistudio_dedicated' | 'aistudio_shared' = dedicatedKey
        ? 'aistudio_dedicated'
        : 'aistudio_shared';
    const isPaidKey =
        provider === 'aistudio_dedicated' &&
        (process.env.WA_GEMINI_KEY_IS_PAID || '').trim().toLowerCase() === 'true';

    // Demi privasi: jika key bukan Paid Tier, buang inlineData biner jika sempat lolos
    const safeContents: WaAiContent[] = isPaidKey
        ? contents
        : contents.map((turn) => {
              const textOnly = turn.parts.filter((p) => typeof p.text === 'string' && p.text.length > 0);
              return {
                  role: turn.role,
                  parts: textOnly.length > 0 ? textOnly : [{ text: '[Pengirim melampirkan berkas media]' }],
              };
          });

    for (const model of getAiStudioModelCandidates()) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 13000);
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: systemInstruction }] },
                    contents: safeContents,
                    generationConfig: {
                        temperature: 0.75,
                        maxOutputTokens: 4096,
                        topP: 0.9,
                    },
                    safetySettings: [
                        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                    ],
                }),
            });

            if (!res.ok) {
                console.warn(`[whatsappAi][${provider}] ${model} gagal (${res.status})`);
                continue;
            }

            const data = (await res.json()) as {
                candidates?: Array<{ content?: { parts?: unknown[] } }>;
                usageMetadata?: {
                    promptTokenCount?: number;
                    candidatesTokenCount?: number;
                    thoughtsTokenCount?: number;
                };
            };

            const reply = extractReplyFromParts(data.candidates?.[0]?.content?.parts);
            if (!reply) continue;

            const promptTokens = data.usageMetadata?.promptTokenCount ?? 0;
            const outputTokens =
                (data.usageMetadata?.candidatesTokenCount ?? 0) +
                (data.usageMetadata?.thoughtsTokenCount ?? 0);

            return {
                reply,
                model,
                provider,
                promptTokens,
                outputTokens,
                estimatedCostIdr: estimateGeminiCostIdr(model, promptTokens, outputTokens, !isPaidKey),
            };
        } catch (err) {
            console.warn(`[whatsappAi][${provider}] Error memanggil ${model}:`, err);
        } finally {
            clearTimeout(timer);
        }
    }

    return null;
}

