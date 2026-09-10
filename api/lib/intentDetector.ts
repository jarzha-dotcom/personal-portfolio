import { UploadedFile } from './antigravity.js';

export type AgentIntentAction = 'estimate' | 'research' | 'file_analysis' | 'live_demo';

export const ALLOWED_UPLOAD_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf', 'text/csv'];
export const MAX_UPLOAD_FILES = 3;
export const MAX_UPLOAD_FILE_BYTES = 6 * 1024 * 1024; // 6MB per file

export function sanitizeUploadedFiles(rawFiles: unknown): UploadedFile[] {
    if (!Array.isArray(rawFiles)) return [];
    const valid: UploadedFile[] = [];

    for (const f of rawFiles) {
        if (!f || typeof f !== 'object') continue;
        const { mimeType, data, name } = f as { mimeType?: unknown; data?: unknown; name?: unknown };

        if (typeof mimeType !== 'string' || !ALLOWED_UPLOAD_MIME_TYPES.includes(mimeType.toLowerCase())) continue;
        if (typeof data !== 'string') continue;

        const cleanData = data.replace(/^data:[^;]+;base64,/, '').trim();
        const byteLength = Math.floor((cleanData.length * 3) / 4);
        if (byteLength === 0 || byteLength > MAX_UPLOAD_FILE_BYTES) continue;

        valid.push({
            mimeType: mimeType.toLowerCase(),
            data: cleanData,
            name: typeof name === 'string' ? name.slice(0, 100) : undefined,
        });

        if (valid.length >= MAX_UPLOAD_FILES) break;
    }

    return valid;
}

export const AGENT_INTENT_PATTERNS: Array<{
    action: AgentIntentAction;
    pattern: RegExp;
    personas: Array<'rajendra' | 'zannah'>;
}> = [
    {
        action: 'live_demo',
        pattern: /\b(bisa|mampu|feasible)\b.{0,15}(gak|ga|nggak|kah)?\b.{0,25}\b(bikin|buat|develop|implementasi|realisasi|dibikin|dibuat)\b/i,
        personas: ['rajendra'],
    },
    {
        action: 'live_demo',
        pattern: /\bprototype\b|\bproof\s*of\s*concept\b|\bpoc\b/i,
        personas: ['rajendra'],
    },
    {
        action: 'research',
        pattern: /\b(cari|riset|research)\b.{0,20}\b(terbaru|kompetitor|tren|data|harga\s*pasar)\b/i,
        personas: ['zannah'],
    },
    {
        action: 'research',
        pattern: /\bbandingkan\b|\bcompare\b/i,
        personas: ['zannah'],
    },
    {
        action: 'estimate',
        pattern: /\b(buatkan|generate|bikin|susun|export)\b.{0,25}\b(rab|anggaran|invoice|proposal|laporan|excel|spreadsheet|pdf|dokumen)\b/i,
        personas: ['zannah'],
    },
    {
        action: 'estimate',
        pattern: /\bhitung(kan)?\b.{0,20}\b(data|angka|statistik)\b/i,
        personas: ['zannah'],
    },
];

export function detectAgentIntent(
    message: string,
    hasFilesThisTurn: boolean,
    persona: 'rajendra' | 'zannah'
): AgentIntentAction | null {
    if (hasFilesThisTurn) return 'file_analysis';
    for (const { action, pattern, personas } of AGENT_INTENT_PATTERNS) {
        if (!personas.includes(persona)) continue;
        if (pattern.test(message)) return action;
    }
    return null;
}

export function detectCrossPersonaIntent(
    message: string,
    persona: 'rajendra' | 'zannah'
): { action: AgentIntentAction; ownerPersona: 'rajendra' | 'zannah' } | null {
    for (const { action, pattern, personas } of AGENT_INTENT_PATTERNS) {
        if (personas.includes(persona)) continue;
        if (pattern.test(message)) return { action, ownerPersona: personas[0] };
    }
    return null;
}

export async function assessAgentReadiness(
    apiKey: string,
    contents: Array<{ role: string; parts: Array<{ text?: string; inlineData?: unknown }> }>,
    action: 'estimate' | 'research'
): Promise<boolean> {
    const criteria =
        action === 'estimate'
            ? `- Sudah jelas jenis aplikasi/proyek yang diinginkan (web app, mobile app, sistem internal, landing page, dst) — bukan cuma "mau bikin aplikasi" doang.
- Sudah disebutkan MINIMAL beberapa fitur/kebutuhan utama secara konkret (bukan sekadar ide samar tanpa detail apa pun).`
            : `- Ada topik, kompetitor, atau segmen pasar yang SPESIFIK disebut user (bukan permintaan generik "riset dong" tanpa arah).
- Ada indikasi user beneran serius mau pakai hasil riset ini buat proyeknya (bukan sekadar nanya iseng/hipotetis).`;

    const transcript = contents
        .slice(-10)
        .map((c) => `${c.role === 'user' ? 'USER' : 'ZANNAH'}: ${c.parts.map((p) => p.text || '').join(' ')}`)
        .join('\n')
        .slice(0, 4000);

    const prompt = `Kamu adalah pemeriksa kesiapan (readiness checker) internal untuk fitur AI Agent di sebuah chatbot konsultan tech bernama Zannah. Berdasarkan potongan percakapan di bawah, nilai APAKAH kedua kriteria berikut sudah terpenuhi:
${criteria}

Jawab TIDAK SIAP kalau salah satu kriteria di atas belum jelas terpenuhi — lebih baik ketat daripada terlalu longgar.

--- PERCAKAPAN ---
${transcript}
--- SELESAI ---

Balas HANYA dengan JSON valid, tanpa markdown/backtick/penjelasan tambahan, persis format ini:
{"ready": true} atau {"ready": false}`;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0, maxOutputTokens: 30 },
            }),
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.warn(`[intentDetector][readiness] HTTP ${response.status}, fallback ke ready=true`);
            return true;
        }

        const data = await response.json();
        const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) return true;

        const match = text.match(/"ready"\s*:\s*(true|false)/i);
        if (!match) {
            console.warn('[intentDetector][readiness] Response gak sesuai format, fallback ke ready=true');
            return true;
        }
        return match[1].toLowerCase() === 'true';
    } catch (error) {
        const isTimeout = error instanceof Error && error.name === 'AbortError';
        console.warn('[intentDetector][readiness] Error, fallback ke ready=true:', isTimeout ? 'timeout' : error);
        return true;
    }
}
