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
}

export type BotPersona = 'zannah' | 'rajendra' | 'kania';

export async function sendMessageToGemini(
    history: ChatMessage[],
    newUserMessage: string,
    model?: string,
    persona?: BotPersona,
    agentMode?: boolean,
    files?: OutgoingFile[]
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