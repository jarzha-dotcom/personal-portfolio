import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSystemInstruction, BotPersona } from './lib/prompts.js';
import {
    checkRateLimit,
    cleanupOldRateLimits,
    getAntigravityDailyStatus,
    consumeAntigravityDailyQuota,
    ANTIGRAVITY_DAILY_CAP,
} from './lib/rateLimiter.js';
import {
    buildAgentDocumentAttachment,
    generateSummaryAttachment,
} from './lib/documentGenerator.js';
import {
    pingDevRABEngine,
} from './lib/devrabClient.js';
import {
    callAntigravity,
    ANTIGRAVITY_MODEL,
} from './lib/antigravity.js';
import {
    detectAgentIntent,
    detectCrossPersonaIntent,
    assessAgentReadiness,
    sanitizeUploadedFiles,
    AgentIntentAction,
} from './lib/intentDetector.js';
import {
    handleFaqSemanticSearch,
} from './lib/semanticFaq.js';
import {
    GEMINI_MODELS,
    GCP_FALLBACK_MODELS,
    GEMMA_FALLBACK_MODELS,
    callGeminiModel,
    callGemmaModel,
} from './lib/geminiModels.js';

const AISTUDIO_API_KEY = process.env.GEMINI_API_KEY;
const GCP_GEMINI_API_KEY = process.env.GOOGLE_CLOUD_GEMINI_API_KEY;

// Cleanup berkala tanpa menahan proses Node.js
if (typeof setInterval !== 'undefined') {
    const timer = setInterval(cleanupOldRateLimits, 5 * 60 * 1000);
    if (typeof timer.unref === 'function') {
        timer.unref();
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        // ── Origin & Domain Security Guard ──────────────────────────────────────────
        const originHeader = (req.headers.origin as string) || '';
        const refererHeader = (req.headers.referer as string) || '';
        const clientSource = originHeader || refererHeader;

        const isOriginAllowed = () => {
            if (!clientSource) return true;
            try {
                const parsed = new URL(clientSource);
                const host = parsed.hostname.toLowerCase();
                if (host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.')) return true;
                if (host === 'byarzhaning.online' || host.endsWith('.byarzhaning.online')) return true;
                if (host.includes('personal-portfolio') && host.endsWith('.vercel.app')) return true;
                return false;
            } catch {
                return false;
            }
        };

        const isAllowed = isOriginAllowed();
        res.setHeader('Access-Control-Allow-Origin', isAllowed && originHeader ? originHeader : 'https://byarzhaning.online');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') return res.status(200).end();
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

        if (!isAllowed) {
            console.warn(`[chat.ts] 🛑 Unauthorized origin blocked: ${clientSource}`);
            return res.status(403).json({
                error: 'UNAUTHORIZED_DOMAIN',
                detail: 'Akses API Chatbot ditolak. Domain ini tidak memiliki lisensi resmi dari K. Arzhaning Jagad (https://byarzhaning.online).',
            });
        }

        const aiStudioKey = process.env.GEMINI_API_KEY || AISTUDIO_API_KEY;
        const gcpKey = process.env.GOOGLE_CLOUD_GEMINI_API_KEY || GCP_GEMINI_API_KEY;

        if (!aiStudioKey && !gcpKey) {
            return res.status(503).json({ error: 'AI_UNAVAILABLE', detail: 'No API keys configured on Vercel Environment Variables' });
        }

        let body = req.body;
        if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
            } catch {
                body = {};
            }
        }
        body = body || {};

        const {
            history,
            message,
            model: requestedModel,
            persona = 'zannah',
            agentMode,
            agentAction,
            files: rawFiles,
            analyticsEvent,
            faqSemanticSearch,
            stream: requestStream = false,
        } = body as {
            history?: Array<{ role: string; parts: { text: string }[] }>;
            message?: string;
            model?: string;
            persona?: BotPersona;
            agentMode?: boolean;
            agentAction?: AgentIntentAction;
            files?: unknown;
            analyticsEvent?: { type: string; action?: string; persona?: string };
            faqSemanticSearch?: { query: string };
            stream?: boolean;
        };

        // ── FAQ semantic search (Radit) ──────────────────────────────────────────
        if (faqSemanticSearch && typeof faqSemanticSearch.query === 'string') {
            const ipForFaq = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 'unknown';
            if (!aiStudioKey) return res.status(200).json({ matchedFaqId: null });
            const result = await handleFaqSemanticSearch(aiStudioKey, faqSemanticSearch.query, ipForFaq);
            return res.status(200).json(result);
        }

        // ── Analytics beacon ─────────────────────────────────────────────────────
        if (analyticsEvent && typeof analyticsEvent.type === 'string') {
            const ipForLog = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 'unknown';
            console.log(`[chat.ts][analytics] ${analyticsEvent.type} action=${analyticsEvent.action ?? '-'} persona=${analyticsEvent.persona ?? '-'} ip=${ipForLog}`);
            return res.status(200).json({ ok: true });
        }

        if (!message || typeof message !== 'string') {
            return res.status(400).json({ error: 'Pesan tidak valid' });
        }

        const sanitizedFiles = sanitizeUploadedFiles(rawFiles);
        const activePersona: BotPersona = persona === 'rajendra' || persona === 'kania' ? persona : 'zannah';
        const systemInstruction = getSystemInstruction(activePersona);
        const botName = activePersona === 'rajendra' ? 'Rajendra' : activePersona === 'kania' ? 'Kania' : 'Zannah';
        const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 'unknown';

        const sanitizedMessage = message.slice(0, 1000);
        const sanitizedHistory = (history || []).slice(-12).map((h) => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: String(h.parts?.[0]?.text || '').slice(0, 1000) }],
        }));

        const userParts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
            { text: sanitizedMessage },
        ];
        for (const f of sanitizedFiles) {
            userParts.push({ inlineData: { mimeType: f.mimeType, data: f.data } });
        }

        const contents = [...sanitizedHistory, { role: 'user', parts: userParts }];

        const requestedModelIsValid = GEMINI_MODELS.some((m) => m.name === requestedModel);
        const orderedGeminiModels = requestedModelIsValid
            ? [
                GEMINI_MODELS.find((m) => m.name === requestedModel)!,
                ...GEMINI_MODELS.filter((m) => m.name !== requestedModel),
            ]
            : [...GEMINI_MODELS];

        const isSummaryRequested =
            /\b(rangkum(an)?|resume|ringkas(an)?|export|unduh|download|file|dokumen)\b.{0,30}\b(obrolan|chat|diskusi|percakapan|proyek|project|rab|pembahasan)\b/i.test(sanitizedMessage) ||
            /\b(buatkan|generate|bikin|minta|kirim)\b.{0,25}\b(file|rangkuman|resume|dokumen|txt)\b/i.test(sanitizedMessage);

        const enrichWithSummaryAttachment = (resData: any) => {
            if (!isSummaryRequested || !resData) return resData;
            const existingAtts = resData.attachments || [];
            if (existingAtts.length === 0) {
                const summaryAtt = generateSummaryAttachment(sanitizedHistory, sanitizedMessage, resData.reply || '', botName);
                return { ...resData, attachments: [summaryAtt] };
            }
            return resData;
        };

        const agentTriggeredByUser = agentMode === true;
        const agentEligiblePersona = activePersona === 'rajendra' || activePersona === 'zannah';
        const wantsAgent = agentEligiblePersona && agentTriggeredByUser;
        const isAntigravityTarget = wantsAgent && (!requestedModel || requestedModel === ANTIGRAVITY_MODEL);

        // Susun riwayat lengkap percakapan dari awal agar kebutuhan/fitur proyek tidak terputus akibat 12 slice
        const fullSessionTranscript = (history || [])
            .map((h) => {
                const sender = h.role === 'user' ? 'Klien' : botName;
                const text = String(h.parts?.[0]?.text || '').trim();
                return text ? `[${sender}]: ${text}` : '';
            })
            .filter(Boolean)
            .join('\n');

        const enrichWithAgentDocument = async (resData: any) => {
            if (!resData || !agentTriggeredByUser) return resData;
            if (agentAction !== 'estimate' && agentAction !== 'research') return resData;
            if (!aiStudioKey) return resData;
            if (resData.attachments && resData.attachments.length > 0) return resData;

            const doc = await buildAgentDocumentAttachment(
                aiStudioKey,
                resData.reply || '',
                agentAction,
                sanitizedMessage,
                fullSessionTranscript
            );

            // Jika dokumen adalah draf kasar lokal (karena DevRAB offline/antre), tambahkan catatan transparan jika belum ada di teks
            if (doc && doc.name && doc.name.includes('Kasar')) {
                const warningNote = '\n\n*(Catatan: Server DevRAB Cloud Engine sedang mengalami antrean teknis, sehingga Zannah lampirkan draf estimasi kasar lokal terlebih dahulu. Kakak bisa meminta Zannah "Coba generate ulang ke DevRAB" kapan saja untuk mendapatkan proposal interaktif resminya.)*';
                if (!resData.reply?.includes('antrean teknis') && !resData.reply?.includes('DevRAB')) {
                    resData.reply = (resData.reply || '') + warningNote;
                }
            }

            // Checklist Nama/Email belum lengkap-valid → RAB resmi sengaja DITAHAN di kode
            // (lihat hasCompleteClientChecklist di documentGenerator.ts). Kasih tahu user
            // dengan sopan lewat balasan chat, jangan cuma diam-diam lampirkan file penjelasan.
            if (doc && doc.name && doc.name.includes('Checklist-Belum-Lengkap')) {
                const checklistNote = '\n\n*(Catatan: Zannah belum bisa memproses RAB resminya nih, Kak — checklist Nama Lengkap & Email aktif Kakak masih belum lengkap/valid. Boleh dilengkapi dulu, nanti Zannah langsung siapkan RAB-nya ya!)*';
                if (!resData.reply?.toLowerCase().includes('checklist')) {
                    resData.reply = (resData.reply || '') + checklistNote;
                }
            }

            return { ...resData, attachments: [doc] };
        };

        // Pre-warming silent ping ke DevRAB Engine saat topik proyek/estimasi/budget disentuh
        if (
            agentAction === 'estimate' ||
            /\b(rab|estimasi|biaya|budget|proyek|project|proposal|harga|bikin web|buat aplikasi)\b/i.test(sanitizedMessage)
        ) {
            pingDevRABEngine().catch(() => { });
        }

        const rawDetectedIntent: AgentIntentAction | null =
            agentEligiblePersona && !agentTriggeredByUser
                ? detectAgentIntent(sanitizedMessage, sanitizedFiles.length > 0, activePersona as 'rajendra' | 'zannah')
                : null;

        const crossPersonaIntent =
            agentEligiblePersona && !agentTriggeredByUser && !rawDetectedIntent && sanitizedFiles.length === 0
                ? detectCrossPersonaIntent(sanitizedMessage, activePersona as 'rajendra' | 'zannah')
                : null;

        if (crossPersonaIntent) {
            const otherPersona = crossPersonaIntent.ownerPersona;
            const otherBotHint =
                otherPersona === 'rajendra'
                    ? 'chatbot "Rajendra" di halaman AI Chatbot Showcase (punya mode Live Demo Antigravity Agent)'
                    : 'chatbot "Zannah" (ikon chat di pojok kanan bawah), yang bisa bantu riset kompetitor atau file RAB';
            const lastTurn = contents[contents.length - 1] as { role: string; parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> };
            if (lastTurn?.role === 'user') {
                lastTurn.parts.push({
                    text: `(Catatan sistem: pesan di atas cocok dengan kebutuhan "${crossPersonaIntent.action}" yang paling pas dibantu oleh ${otherBotHint}. Tetap jawab secara wajar, lalu di akhir arahkan singkat ke ${otherBotHint}.)`,
                });
            }
        }

        // ── Penawaran RAB proaktif kalau obrolan sudah panjang & belum pernah dibahas ──
        // Ditaruh khusus untuk persona Zannah (satu-satunya persona dengan protokol
        // checklist RAB di system prompt). Cuma dipicu SEKALI per percakapan: kita
        // cek riwayat balasan bot sebelumnya, kalau sudah pernah ada tawaran ini
        // (ditandai kalimat pembuka RAB_PROACTIVE_OFFER_MARKER persis di awal),
        // jangan diulang lagi supaya Zannah gak "ngotot" nawarin RAB tiap turn.
        const RAB_PROACTIVE_OFFER_MARKER = 'Ngomong-ngomong soal proyeknya';
        const conversationIsLongEnough = activePersona === 'zannah' && (history || []).length >= 12;
        const rabAlreadyOfferedBefore =
            conversationIsLongEnough &&
            (history || []).some(
                (h) => h.role !== 'user' && String(h.parts?.[0]?.text || '').includes(RAB_PROACTIVE_OFFER_MARKER)
            );
        const userAlreadyOnRabTrack =
            isSummaryRequested ||
            (agentTriggeredByUser && agentAction === 'estimate') ||
            rawDetectedIntent === 'estimate' ||
            /\b(rab|anggaran|sow|proposal|estimasi\s*(biaya|proyek)?)\b/i.test(sanitizedMessage);

        const shouldProactivelyOfferRab =
            conversationIsLongEnough && !rabAlreadyOfferedBefore && !userAlreadyOnRabTrack;

        if (shouldProactivelyOfferRab) {
            const lastTurn = contents[contents.length - 1] as { role: string; parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> };
            if (lastTurn?.role === 'user') {
                lastTurn.parts.push({
                    text: `(Catatan sistem: Obrolan sudah berjalan cukup panjang dan Kakak belum pernah diajak bahas RAB/estimasi proyek. Jawab dulu pesan di atas seperti biasa, lalu di akhir jawaban sisipkan tawaran SOPAN & singkat untuk mulai menyusun draf RAB. Kalimat tawaran itu WAJIB diawali persis dengan frasa "${RAB_PROACTIVE_OFFER_MARKER}" di awal kalimatnya — jangan diparafrase — supaya sistem tahu tawaran ini sudah pernah diberikan dan tidak mengulanginya lagi nanti. Ingatkan singkat bahwa RAB baru bisa diproses kalau ketujuh checklist, termasuk Nama Lengkap & Email Kakak, sudah lengkap.)`,
                });
            }
        }

        let detectedAgentIntent: AgentIntentAction | null = rawDetectedIntent;
        if ((rawDetectedIntent === 'estimate' || rawDetectedIntent === 'research') && aiStudioKey) {
            const ready = await assessAgentReadiness(aiStudioKey, contents, rawDetectedIntent);
            if (!ready) {
                detectedAgentIntent = null;
            }
        }


        const antigravityDailyStatusBeforeCall = agentEligiblePersona
            ? getAntigravityDailyStatus()
            : { allowed: true, remaining: ANTIGRAVITY_DAILY_CAP };

        const attachAgentMeta = (resData: any) => {
            if (!resData || !agentEligiblePersona) return resData;
            return {
                ...resData,
                ...(detectedAgentIntent ? { suggestedAgentAction: detectedAgentIntent } : {}),
                antigravityDailyRemaining: antigravityDailyStatusBeforeCall.remaining,
            };
        };

        // Helper untuk kirim respons streaming SSE jika diminta & memungkinkan
        const sendResponse = async (finalData: any) => {
            const enriched = await enrichWithAgentDocument(enrichWithSummaryAttachment(attachAgentMeta(finalData)));
            if (requestStream && res.socket && !res.headersSent) {
                res.setHeader('Content-Type', 'text/event-stream');
                res.setHeader('Cache-Control', 'no-cache, no-transform');
                res.setHeader('Connection', 'keep-alive');
                res.write(`data: ${JSON.stringify(enriched)}\n\n`);
                res.write('data: [DONE]\n\n');
                return res.end();
            }
            return res.status(200).json(enriched);
        };

        // LAYER 1: Antigravity Agent
        if (aiStudioKey && isAntigravityTarget) {
            if (!antigravityDailyStatusBeforeCall.allowed) {
                console.log('[chat.ts] Antigravity daily cap reached — falling back to Gemini biasa.');
                const lastTurn = contents[contents.length - 1] as { role: string; parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> };
                if (lastTurn?.role === 'user') {
                    lastTurn.parts.push({
                        text: '(Catatan sistem: kuota Live Demo/Antigravity Agent hari ini sudah habis. Jawab secara konseptual dan sebutkan bahwa demo langsung belum bisa dijalankan sekarang karena kuota harian penuh.)',
                    });
                }
            } else {
                console.log(`[chat.ts] Agent mode triggered — trying Antigravity as ${botName}...`);
                const antigravityResult = await callAntigravity(
                    aiStudioKey,
                    sanitizedMessage,
                    sanitizedHistory,
                    ip,
                    systemInstruction,
                    botName,
                    sanitizedFiles
                );

                if (antigravityResult) {
                    consumeAntigravityDailyQuota();
                    return sendResponse({
                        ...antigravityResult,
                        apiSource: 'aistudio',
                        usedAgent: true,
                        agentTriggerReason: 'manual',
                        antigravityDailyRemaining: getAntigravityDailyStatus().remaining,
                    });
                }
            }
        }

        // LAYER 2: Gemini model cascade (AI Studio key)
        if (aiStudioKey) {
            for (const modelConfig of orderedGeminiModels) {
                const result = await callGeminiModel(
                    aiStudioKey,
                    modelConfig.name,
                    contents,
                    ip,
                    'aistudio',
                    systemInstruction
                );
                if (result) {
                    return sendResponse(result);
                }
            }
        }

        // LAYER 3: GCP fallback
        if (gcpKey) {
            console.log('[chat.ts] 🔄 Using GCP API key as fallback...');
            for (const modelConfig of GCP_FALLBACK_MODELS) {
                const result = await callGeminiModel(
                    gcpKey,
                    modelConfig.name,
                    contents,
                    ip,
                    'gcp',
                    systemInstruction
                );
                if (result) {
                    return sendResponse(result);
                }
            }
        }

        // LAYER 3.5: Gemma fallback
        if (aiStudioKey) {
            console.log('[chat.ts] 🔄 Trying Gemma models fallback...');
            for (const modelConfig of GEMMA_FALLBACK_MODELS) {
                const result = await callGemmaModel(aiStudioKey, modelConfig.name, contents, ip, systemInstruction);
                if (result) {
                    return sendResponse(result);
                }
            }
        }

        // LAYER 4: Failure
        console.error('[chat.ts] ❌ All layers exhausted.');
        return res.status(502).json({
            error: 'ALL_MODELS_FAILED',
            detail: 'Semua model AI tidak tersedia. Silakan coba lagi beberapa saat.',
        });
    } catch (err: any) {
        console.error('[chat.ts] 💥 Unhandled handler error:', err);
        return res.status(500).json({
            error: 'INTERNAL_SERVER_ERROR',
            detail: err?.message || String(err),
        });
    }
}