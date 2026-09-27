import { Attachment } from './documentGenerator.js';
import { checkRateLimit } from './rateLimiter.js';

export const ANTIGRAVITY_MODEL = 'antigravity-preview-05-2026';
export const ANTIGRAVITY_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions';

export interface AgentStep {
    type: string;
    label: string;
}

export interface UploadedFile {
    mimeType: string;
    data: string;
    name?: string;
}

export const DELIVERABLE_EXTENSIONS = [
    '.pdf', '.xlsx', '.xls', '.docx', '.pptx', '.csv',
    '.png', '.jpg', '.jpeg', '.html', '.zip', '.txt', '.md', '.json'
];

export const SKIP_PATH_SEGMENTS = [
    'node_modules/', '.git/', '__pycache__/', '.cache/',
    '.npm/', '/proc/', '/sys/', '/usr/', '/lib/', '/bin/', '/sbin/', '/etc/', '/var/', '.venv/'
];

export const MAX_ATTACHMENTS = 4;
export const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024; // 8MB per file

export function guessMimeTypeFromName(filename: string): string {
    const ext = filename.toLowerCase().split('.').pop() || '';
    const map: Record<string, string> = {
        pdf: 'application/pdf',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        xls: 'application/vnd.ms-excel',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        csv: 'text/csv',
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        html: 'text/html',
        zip: 'application/zip',
        txt: 'text/plain',
        md: 'text/markdown',
        json: 'application/json',
    };
    return map[ext] || 'application/octet-stream';
}

export function labelForStep(step: any): string {
    const toolName: string | undefined = step?.function_call?.name || step?.tool_name || step?.tool;
    if (step?.type === 'thought') return '🧠 Menyusun rencana...';
    if (step?.type === 'function_call') {
        if (toolName?.includes('search')) return '🔎 Mencari di web...';
        if (toolName?.includes('code')) return '💻 Menjalankan kode...';
        if (toolName?.includes('url')) return '📄 Membaca halaman...';
        if (toolName?.includes('file')) return '📁 Mengelola file...';
        return '🛠️ Menjalankan tool...';
    }
    if (step?.type === 'model_output') return '✍️ Menyusun jawaban...';
    return '⚙️ Memproses...';
}

export async function extractTarEntries(
    buffer: Buffer
): Promise<Array<{ name: string; data: Buffer; mtime: number }>> {
    const tar = await import('tar-stream');
    const { Readable } = await import('stream');

    return new Promise((resolve, reject) => {
        const extract = tar.extract();
        const entries: Array<{ name: string; data: Buffer; mtime: number }> = [];

        extract.on('entry', (header: any, stream: any, next: any) => {
            if (header.type !== 'file') {
                stream.resume();
                return next();
            }
            const chunks: Buffer[] = [];
            stream.on('data', (c: Buffer) => chunks.push(c));
            stream.on('end', () => {
                entries.push({
                    name: header.name,
                    data: Buffer.concat(chunks),
                    mtime: header.mtime ? new Date(header.mtime).getTime() : 0,
                });
                next();
            });
            stream.resume();
        });

        extract.on('finish', () => resolve(entries));
        extract.on('error', reject);

        Readable.from(buffer).pipe(extract);
    });
}

export async function downloadAntigravityFiles(
    apiKey: string,
    environmentId: string
): Promise<Attachment[]> {
    if (!environmentId) return [];

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/files/environment-${environmentId}:download?alt=media`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(url, {
            headers: { 'x-goog-api-key': apiKey },
            signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            console.warn(`[antigravity] Gagal download environment snapshot (${response.status}), skip attachment.`);
            return [];
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const entries = await extractTarEntries(buffer);

        const candidates = entries
            .filter((e) => {
                const lower = e.name.toLowerCase();
                if (SKIP_PATH_SEGMENTS.some((seg) => lower.includes(seg))) return false;
                if (!DELIVERABLE_EXTENSIONS.some((ext) => lower.endsWith(ext))) return false;
                if (e.data.length === 0 || e.data.length > MAX_ATTACHMENT_BYTES) return false;
                return true;
            })
            .sort((a, b) => b.mtime - a.mtime)
            .slice(0, MAX_ATTACHMENTS);

        return candidates.map((c) => ({
            name: c.name.split('/').pop() || c.name,
            mimeType: guessMimeTypeFromName(c.name),
            base64: c.data.toString('base64'),
        }));
    } catch (error: unknown) {
        console.warn('[antigravity] Error download/extract sandbox:', error);
        return [];
    }
}

export async function callAntigravity(
    apiKey: string,
    message: string,
    history: Array<{ role: string; parts: { text: string }[] }>,
    ip: string,
    systemInstruction: string,
    botName: string,
    files: UploadedFile[] = []
): Promise<{
    reply: string;
    model: string;
    remainingQuota: number;
    agentSteps: AgentStep[];
    attachments: Attachment[];
} | null> {
    const rateLimitStatus = checkRateLimit(ip, 'antigravity');
    if (!rateLimitStatus.allowed) {
        console.log('[antigravity] Rate limited locally, skipping...');
        return null;
    }

    const historyText = history
        .map((h) => `${h.role === 'user' ? 'User' : botName}: ${h.parts?.[0]?.text || ''}`)
        .filter(Boolean)
        .join('\n');

    const prompt = `[SYSTEM INSTRUCTION]\n${systemInstruction}\n\n[CONVERSATION HISTORY]\n${historyText ? historyText + '\n\n' : ''}User: ${message}\n${botName}:`;

    const antigravityInput =
        files.length > 0
            ? [
                { type: 'text', text: prompt },
                ...files.map((f) =>
                    f.mimeType.startsWith('image/')
                        ? { type: 'image', data: f.data, mime_type: f.mimeType }
                        : { type: 'document', data: f.data, mime_type: f.mimeType }
                ),
            ]
            : prompt;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);

        const response = await fetch(ANTIGRAVITY_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey,
            },
            signal: controller.signal,
            body: JSON.stringify({
                agent: ANTIGRAVITY_MODEL,
                input: antigravityInput,
                environment: 'remote',
            }),
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            console.warn(`[antigravity] Error ${response.status}:`, err?.error?.message || response.statusText);
            return null;
        }

        const data = await response.json();

        let reply = '';
        const agentSteps: AgentStep[] = [];
        if (data.steps && Array.isArray(data.steps)) {
            for (const step of data.steps) {
                if (step.content && Array.isArray(step.content)) {
                    for (const item of step.content) {
                        if (item.text) {
                            reply += item.text;
                        }
                    }
                }
                if (step.type && step.type !== 'user_input') {
                    const label = labelForStep(step);
                    if (agentSteps[agentSteps.length - 1]?.label !== label) {
                        agentSteps.push({ type: step.type, label });
                    }
                }
            }
        }

        reply = reply.replace(new RegExp(`^(?:${botName}):\\s*`, 'i'), '').trim();
        if (!reply) {
            console.warn('[antigravity] Empty response from agent');
            return null;
        }

        let attachments: Attachment[] = [];
        const environmentId: string | undefined = data.environment_id;
        if (environmentId) {
            attachments = await downloadAntigravityFiles(apiKey, environmentId);
        }

        return {
            reply,
            model: ANTIGRAVITY_MODEL,
            remainingQuota: rateLimitStatus.remaining,
            agentSteps,
            attachments,
        };
    } catch (error: unknown) {
        const isTimeout = error instanceof Error && error.name === 'AbortError';
        console.warn(`[antigravity] ${isTimeout ? 'timeout' : 'error'}:`, error);
        return null;
    }
}
