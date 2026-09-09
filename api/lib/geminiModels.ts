import { checkRateLimit } from './rateLimiter';

export const GEMINI_MODELS = [
    { name: 'gemini-3.8-flash', priority: 1 },
    { name: 'gemini-3.7-flash', priority: 2 },
    { name: 'gemini-3.5-flash-lite', priority: 3 },
    { name: 'gemini-3.6-flash', priority: 4 },
    { name: 'gemini-3.5-flash', priority: 5 },
    { name: 'gemini-3.1-flash-lite', priority: 6 },
] as const;

export const GCP_FALLBACK_MODELS = [
    { name: 'gemini-3.8-flash', priority: 1 },
    { name: 'gemini-3.7-flash', priority: 2 },
    { name: 'gemini-3.5-flash', priority: 3 },
] as const;

export const GEMMA_FALLBACK_MODELS = [
    { name: 'gemma-4-26b-it' },
    { name: 'gemma-4-31b-it' },
] as const;

export type GeminiModelName = (typeof GEMINI_MODELS)[number]['name'];

export async function callGeminiModel(
    apiKey: string,
    modelName: string,
    contents: Array<{ role: string; parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> }>,
    ip: string,
    apiSource: 'aistudio' | 'gcp',
    systemInstruction: string
): Promise<{ reply: string; model: string; remainingQuota: number; apiSource: 'aistudio' | 'gcp' } | null> {
    const rateLimitStatus = checkRateLimit(ip, `${apiSource}:${modelName}`);
    if (!rateLimitStatus.allowed) {
        console.log(`[geminiModels] [${apiSource}] Model ${modelName} rate limited locally, skipping...`);
        return null;
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

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
                console.log(`[geminiModels] [${apiSource}] Model ${modelName} hit Google rate limit, trying next...`);
                return null;
            }
            throw new Error(err.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!reply) {
            throw new Error('Empty response from Gemini');
        }

        return {
            reply: reply.trim(),
            model: modelName,
            remainingQuota: rateLimitStatus.remaining,
            apiSource,
        };
    } catch (error: unknown) {
        const isTimeout = error instanceof Error && error.name === 'AbortError';
        console.error(`[geminiModels] [${apiSource}] Error with model ${modelName}:`, isTimeout ? 'timeout' : error);
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
    const rateLimitStatus = checkRateLimit(ip, `gemma:${modelName}`);
    if (!rateLimitStatus.allowed) {
        console.log(`[geminiModels] [gemma] Model ${modelName} rate limited locally, skipping...`);
        return null;
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
    const contentsWithSystem = [
        { role: 'user', parts: [{ text: `[INSTRUKSI SISTEM — ikuti ini sepanjang percakapan, jangan pernah disebut literal ke user]\n${systemInstruction}` }] },
        { role: 'model', parts: [{ text: 'Baik, saya akan ikuti instruksi itu sepanjang percakapan.' }] },
        ...contents,
    ];

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(`${endpoint}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
                contents: contentsWithSystem,
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
            if (response.status === 429) {
                console.log(`[geminiModels] [gemma] Model ${modelName} hit Google rate limit, trying next...`);
                return null;
            }
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!reply) throw new Error('Empty response from Gemma');

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
