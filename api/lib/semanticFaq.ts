import { FAQ_ITEMS } from '../../src/data/faqData.js';
import { checkRateLimit } from './rateLimiter';

export const EMBEDDING_MODEL = 'gemini-embedding-001';
export const EMBEDDING_OUTPUT_DIM = 768;
export const EMBEDDING_MATCH_THRESHOLD = 0.72;

export const EMBEDDING_DAILY_CAP = 700;
let embeddingDayKey = '';
let embeddingDayCount = 0;

export function getEmbeddingDailyStatus(): { allowed: boolean; remaining: number } {
    const todayKey = new Date().toISOString().slice(0, 10);
    if (todayKey !== embeddingDayKey) {
        embeddingDayKey = todayKey;
        embeddingDayCount = 0;
    }
    return {
        allowed: embeddingDayCount < EMBEDDING_DAILY_CAP,
        remaining: Math.max(0, EMBEDDING_DAILY_CAP - embeddingDayCount),
    };
}

export function consumeEmbeddingDailyQuota(n = 1): void {
    embeddingDayCount += n;
}

export function cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
}

export async function embedTexts(
    apiKey: string,
    texts: string[],
    taskType: 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY'
): Promise<number[][] | null> {
    if (texts.length === 0) return [];
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:batchEmbedContents?key=${apiKey}`;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
                requests: texts.map((text) => ({
                    model: `models/${EMBEDDING_MODEL}`,
                    content: { parts: [{ text }] },
                    taskType,
                    outputDimensionality: EMBEDDING_OUTPUT_DIM,
                })),
            }),
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.warn(`[semanticFaq][embedding] HTTP ${response.status} saat embed ${texts.length} teks`);
            return null;
        }

        const data = await response.json();
        const vectors: number[][] | undefined = data?.embeddings?.map((e: { values: number[] }) => e.values);

        if (!Array.isArray(vectors) || vectors.length !== texts.length) {
            console.warn('[semanticFaq][embedding] Response gak sesuai ekspektasi');
            return null;
        }

        return vectors;
    } catch (error) {
        const isTimeout = error instanceof Error && error.name === 'AbortError';
        console.warn('[semanticFaq][embedding] Error:', isTimeout ? 'timeout' : error);
        return null;
    }
}

let faqEmbeddingCache: Array<{ id: string; vector: number[] }> | null = null;

export async function getFaqEmbeddings(apiKey: string): Promise<Array<{ id: string; vector: number[] }> | null> {
    if (faqEmbeddingCache) return faqEmbeddingCache;

    const texts = FAQ_ITEMS.map((f) => `${f.quickLabel}\n${f.keywords.join(', ')}\n${f.answer}`);
    const vectors = await embedTexts(apiKey, texts, 'RETRIEVAL_DOCUMENT');
    if (!vectors) return null;

    faqEmbeddingCache = FAQ_ITEMS.map((f, i) => ({ id: f.id, vector: vectors[i] }));
    return faqEmbeddingCache;
}

export async function handleFaqSemanticSearch(
    apiKey: string,
    query: string,
    ip: string
): Promise<{ matchedFaqId: string | null; score?: number }> {
    const rl = checkRateLimit(ip, 'faq-embedding');
    if (!rl.allowed) return { matchedFaqId: null };

    const dailyStatus = getEmbeddingDailyStatus();
    if (!dailyStatus.allowed) return { matchedFaqId: null };

    const faqVectors = await getFaqEmbeddings(apiKey);
    if (!faqVectors) return { matchedFaqId: null };

    const queryText = query.slice(0, 300);
    const queryVectors = await embedTexts(apiKey, [queryText], 'RETRIEVAL_QUERY');
    if (!queryVectors || !queryVectors[0]) return { matchedFaqId: null };

    consumeEmbeddingDailyQuota();

    let best: { id: string | null; score: number } = { id: null, score: -1 };
    for (const item of faqVectors) {
        const score = cosineSimilarity(queryVectors[0], item.vector);
        if (score > best.score) best = { id: item.id, score };
    }

    if (best.score >= EMBEDDING_MATCH_THRESHOLD) {
        return { matchedFaqId: best.id, score: best.score };
    }
    return { matchedFaqId: null, score: best.score };
}
