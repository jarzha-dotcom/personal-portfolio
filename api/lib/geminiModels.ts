import { checkRateLimit } from './rateLimiter.js';

export const GEMINI_MODELS = [
    { name: 'gemini-3.8-flash', priority: 1 },
    { name: 'gemini-3.5-flash-lite', priority: 2 }, // 500 RPD, 15 RPM
    { name: 'gemini-3.7-flash', priority: 3 },
    { name: 'gemini-3.1-flash-lite', priority: 4 }, // 500 RPD, 15 RPM
    { name: 'gemini-3.6-flash', priority: 5 },
    { name: 'gemini-3.5-flash', priority: 6 },
] as const;

export const GEMMA_FALLBACK_MODELS = [
    { name: 'gemma-4-26b-a4b-it', priority: 1 }, // Active 4B MoE architecture: respons jauh lebih cepat & stabil (14.400 RPD)
    { name: 'gemma-4-31b-it', priority: 2 },     // Dense 31B parameters (14.400 RPD)
] as const;

export type GeminiModelName = (typeof GEMINI_MODELS)[number]['name'];
export type GemmaModelName = (typeof GEMMA_FALLBACK_MODELS)[number]['name'];

// In-memory cooldown tracker to immediately bypass models experiencing 429 quota exhaustion or 503 high demand spikes
const modelCooldownMap = new Map<string, number>();

export function isModelInCooldown(modelName: string): boolean {
    const expiresAt = modelCooldownMap.get(modelName);
    if (!expiresAt) return false;
    if (Date.now() > expiresAt) {
        modelCooldownMap.delete(modelName);
        return false;
    }
    return true;
}

export function setModelCooldown(modelName: string, durationMs = 3 * 60 * 1000): void {
    modelCooldownMap.set(modelName, Date.now() + durationMs);
}

export function clearModelCooldown(modelName: string): void {
    modelCooldownMap.delete(modelName);
}

export async function callGeminiModel(
    apiKey: string,
    modelName: string,
    contents: Array<{ role: string; parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> }>,
    ip: string,
    systemInstruction: string
): Promise<{ reply: string; model: string; remainingQuota: number; apiSource: 'aistudio' } | null> {
    if (isModelInCooldown(modelName)) {
        console.log(`[geminiModels] [aistudio] Model ${modelName} is in temporary cooldown (quota/spike), bypassing...`);
        return null;
    }

    const rateLimitStatus = checkRateLimit(ip, `aistudio:${modelName}`);
    if (!rateLimitStatus.allowed) {
        console.log(`[geminiModels] [aistudio] Model ${modelName} rate limited locally, skipping...`);
        return null;
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 detik toleransi untuk Gemini

        const response = await fetch(`${endpoint}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
                contents,
                systemInstruction: { parts: [{ text: systemInstruction }] },
                generationConfig: {
                    temperature: 0.85,
                    maxOutputTokens: 2048,
                    topP: 0.9,
                },
                safetySettings: [
                    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                ],
            }),
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            if (response.status === 429) {
                console.log(`[geminiModels] [aistudio] Model ${modelName} hit Google rate limit / quota (429), setting 3m cooldown...`);
                setModelCooldown(modelName, 3 * 60 * 1000);
                return null;
            }
            if (response.status === 503) {
                console.log(`[geminiModels] [aistudio] Model ${modelName} high demand spike (503), setting 2m cooldown...`);
                setModelCooldown(modelName, 2 * 60 * 1000);
                return null;
            }
            throw new Error(err.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!reply) {
            throw new Error('Empty response from Gemini');
        }

        clearModelCooldown(modelName);

        return {
            reply: reply.trim(),
            model: modelName,
            remainingQuota: rateLimitStatus.remaining,
            apiSource: 'aistudio',
        };
    } catch (error: unknown) {
        const isTimeout = error instanceof Error && error.name === 'AbortError';
        console.error(`[geminiModels] [aistudio] Error with model ${modelName}:`, isTimeout ? 'timeout' : error);
        return null;
    }
}

export async function callGemmaModel(
    apiKey: string,
    modelName: string,
    contents: Array<{ role: string; parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> }>,
    ip: string,
    systemInstruction: string
): Promise<{ reply: string; model: string; remainingQuota: number; apiSource: 'aistudio' } | null> {
    if (isModelInCooldown(modelName)) {
        console.log(`[geminiModels] [gemma] Model ${modelName} is in temporary cooldown, bypassing...`);
        return null;
    }

    const rateLimitStatus = checkRateLimit(ip, `gemma:${modelName}`);
    if (!rateLimitStatus.allowed) {
        console.log(`[geminiModels] [gemma] Model ${modelName} rate limited locally, skipping...`);
        return null;
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;

    // Gemma open-weight models only accept text parts (strip inlineData/multimodal if present)
    const sanitizedContents = contents.map((turn) => {
        const textParts = turn.parts.filter((p) => typeof p.text === 'string' && p.text.length > 0);
        return {
            role: turn.role,
            parts: textParts.length > 0 ? textParts : [{ text: '(Lampiran berkas)' }],
        };
    });

    try {
        const controller = new AbortController();
        // Gemma 4 melakukan internal reasoning (thoughts) sebelum jawaban akhir, butuh toleransi waktu ~20-22s
        const timeoutId = setTimeout(() => controller.abort(), 22000);

        const response = await fetch(`${endpoint}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemInstruction }] },
                contents: sanitizedContents,
                generationConfig: {
                    temperature: 0.85,
                    maxOutputTokens: 1024,
                    topP: 0.9,
                },
                safetySettings: [
                    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                ],
            }),
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            if (response.status === 429) {
                console.log(`[geminiModels] [gemma] Model ${modelName} hit Google rate limit (429), setting 1m cooldown...`);
                setModelCooldown(modelName, 60 * 1000);
                return null;
            }
            if (response.status === 503) {
                console.log(`[geminiModels] [gemma] Model ${modelName} high demand spike (503), setting 1m cooldown...`);
                setModelCooldown(modelName, 60 * 1000);
                return null;
            }
            if (response.status === 500) {
                console.log(`[geminiModels] [gemma] Model ${modelName} Google internal error (500), setting 1m cooldown...`);
                setModelCooldown(modelName, 60 * 1000);
                return null;
            }
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        const parts = data.candidates?.[0]?.content?.parts || [];
        // Filter out internal thoughts part ({ thought: true }), ambil jawaban utama final
        const answerPart = parts.find((p: any) => !p.thought && typeof p.text === 'string' && p.text.trim().length > 0) || parts[parts.length - 1];
        const reply = answerPart?.text;
        if (!reply) throw new Error('Empty response from Gemma');

        clearModelCooldown(modelName);

        return {
            reply: reply.trim(),
            model: modelName,
            remainingQuota: rateLimitStatus.remaining,
            apiSource: 'aistudio',
        };
    } catch (error: unknown) {
        const isTimeout = error instanceof Error && error.name === 'AbortError';
        console.error(`[geminiModels] [gemma] Error with model ${modelName}:`, isTimeout ? 'timeout' : error);
        return null;
    }
}
