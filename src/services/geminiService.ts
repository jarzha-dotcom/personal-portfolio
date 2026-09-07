export interface ChatMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
}

export interface AgentStep {
    type: string;
    label: string;
}

/** File hasil kerja Antigravity Agent (mis. RAB.xlsx, laporan.pdf) yang siap didownload user */
export interface Attachment {
    name: string;
    mimeType: string;
    base64: string;
}

/** File yang dikirim user bareng pesan (foto/PDF/CSV) */
export interface OutgoingFile {
    mimeType: string;
    data: string; // base64 tanpa prefix "data:...;base64,"
    name?: string;
}

export type AgentIntentAction = 'estimate' | 'research' | 'file_analysis' | 'live_demo';

export interface GeminiResponse {
    reply: string;
    model: string;
    remainingQuota: number;
    apiSource?: 'aistudio' | 'gcp'; // sumber API key yang digunakan
    /** True kalau balasan ini dijawab lewat Antigravity Agent, bukan Gemini biasa */
    usedAgent?: boolean;
    agentSteps?: AgentStep[];
    /** Antigravity sekarang HANYA dipicu lewat tombol opt-in eksplisit
     * (agentMode: true), jadi nilainya selalu 'manual' kalau usedAgent true —
     * heuristic tidak lagi bisa jadi alasan Antigravity kepanggil sendiri. */
    agentTriggerReason?: 'manual';
    /** File hasil kerja Antigravity yang bisa didownload (mis. RAB.xlsx, laporan.pdf) */
    attachments?: Attachment[];
    /** Niat agent yang disarankan backend dari heuristic pesan user (lihat
     * detectAgentIntent di chat.ts) — hanya dipakai frontend untuk
     * highlight/dahulukan tombol aksi agent yang relevan (agent_estimate/
     * agent_research/agent_file_analysis). TIDAK memicu Antigravity sendiri;
     * hanya muncul pada balasan Gemini biasa (usedAgent falsy), dan cuma
     * saat backend belum baru saja menjalankan Antigravity secara manual. */
    suggestedAgentAction?: AgentIntentAction | null;
    /** Sisa kuota harian GLOBAL Antigravity (dari cap internal, terpisah dari
     * rate limit per-IP di atas) — dipakai frontend buat nonaktifin/nyembunyiin
     * tombol agent LEBIH AWAL kalau kuota hari ini udah abis, bukan nunggu user
     * klik dulu baru dikasih tau gagal. Cuma ada di persona yang eligible
     * (zannah/rajendra); tidak ada artinya di persona lain. */
    antigravityDailyRemaining?: number;
}

export type BotPersona = 'zannah' | 'rajendra' | 'kania';

/**
 * Beacon analytics ringan buat ngukur efektivitas tombol AI Agent (dipakai
 * atau enggak). Numpang endpoint /api/chat yang sama (lihat handling
 * `analyticsEvent` di chat.ts) biar gak perlu bikin route/infra terpisah —
 * backend cuma nge-log ke server logs, TIDAK memanggil LLM & TIDAK mengurangi
 * kuota apa pun. Sengaja fire-and-forget: gagal kirim gak boleh ganggu alur
 * chat utama sama sekali.
 */
export function sendAgentAnalyticsEvent(
    type: 'agent_cta_shown' | 'agent_cta_clicked',
    action: AgentIntentAction,
    persona: BotPersona
): void {
    try {
        fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ analyticsEvent: { type, action, persona } }),
            keepalive: true, // biar tetap terkirim meski user langsung pindah halaman
        }).catch(() => { /* diem-diem aja, analytics gak boleh ganggu UX */ });
    } catch {
        // no-op — beacon analytics gak boleh pernah bikin chat utama error
    }
}

/**
 * Cari FAQ yang paling mirip MAKNANYA (bukan sekadar keyword) lewat Gemini
 * Embedding di backend — dipanggil Radit SEBELUM jatuh ke Fuse.js. Didesain
 * gak pernah throw untuk kondisi "gagal biasa" (network/timeout/no-quota):
 * cukup balikin `null` biar caller tinggal lanjut ke Fuse.js seperti biasa.
 * Timeout pendek (6s) sengaja dipasang biar Radit gak kelamaan nge-hang
 * nunggu embedding sebelum akhirnya fallback ke pencarian keyword lokal.
 */
export async function searchFaqSemantic(query: string): Promise<string | null> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({ faqSemanticSearch: { query } }),
        });

        clearTimeout(timeoutId);
        if (!response.ok) return null;

        const data: { matchedFaqId?: string | null } = await response.json();
        return data.matchedFaqId ?? null;
    } catch {
        // Timeout, offline, atau error apa pun — diem-diem aja, biar caller
        // fallback ke Fuse.js. Fitur ini emang gak boleh pernah bikin Radit
        // gagal total cuma gara-gara semantic search-nya sendiri error.
        return null;
    }
}

export async function sendMessageToGemini(
    history: ChatMessage[],
    newUserMessage: string,
    model?: string,
    persona?: BotPersona,
    agentMode?: boolean,
    files?: OutgoingFile[],
    agentAction?: AgentIntentAction
): Promise<GeminiResponse> {
    const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            history,
            message: newUserMessage,
            ...(model ? { model } : {}),
            ...(persona ? { persona } : {}),
            ...(agentMode ? { agentMode: true } : {}),
            ...(files && files.length > 0 ? { files } : {}),
            // Dikirim eksplisit (bukan ditebak backend dari isi prompt) biar
            // backend tau pasti kapan perlu generate dokumen RAB/riset
            // deterministik (lihat buildAgentDocumentAttachment di chat.ts).
            ...(agentMode && agentAction ? { agentAction } : {}),
        }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Server error: ${response.status}`);
    }

    const data: GeminiResponse = await response.json();

    if (!data.reply) throw new Error('Respons kosong dari server');

    return data;
}