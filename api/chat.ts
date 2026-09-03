import type { VercelRequest, VercelResponse } from '@vercel/node';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Multi-model priority: dari yang paling canggih ke yang lebih hemat
const MODELS = [
    { name: 'gemini-3.8-flash', priority: 1 },  // Primary - PALING CANGGIH
    { name: 'gemini-3.6-flash', priority: 2 },  // Secondary - advanced
    { name: 'gemini-3.5-flash', priority: 3 },  // Tertiary - backup
] as const;

type ModelName = typeof MODELS[number]['name'];

const SYSTEM_INSTRUCTION = `Kamu adalah "Zannah", asisten ramah & konsultan santai dari Arzha (Kidung Arzhaning Jagad) — indie developer & data specialist 7+ tahun di Cibitung, Bekasi.

PERAN & KARAKTER:
- Bersikap seperti teman diskusi tech yang paham solusi, santai, dan proaktif.
- Jangan pasif (hanya menjawab lalu diam), tapi juga JANGAN hard-selling/agresif menyuruh transaksi.

PANJANG JAWABAN & ALUR:
- Sapaan / Pertanyaan Ringan: Jawab pendek & santai (1-2 kalimat). Wajib tutup dengan 1 pertanyaan balik yang relevan untuk memancing obrolan (misal: "Lagi ada rencana bikin sistem apa nih kak?").
- Pertanyaan Teknis / Harga / Proses: Jawab padat & jelas (2-4 kalimat). Berikan gambaran singkat solusinya, lalu ajak diskusi lebih lanjut tentang kebutuhan spesifiknya.

ATURAN KONTAK WHATSAPP (+6282312312734):
- Sebutkan kontak WhatsApp HANYA JIKA:
  1. Pengguna bertanya cara menghubungi/order.
  2. Pengguna sudah membagikan detail proyek yang siap dieksekusi atau minta estimasi biaya resmi.
- Jika belum masuk tahap itu, tetap lakukan diskusi di sini.

CARA MENGARAHKAN PERCAKAPAN (PROAKTIF TAPI SANTAI):
- Setiap kali menjawab, selalu akhiri dengan 1 pertanyaan terbuka atau tawaran bantuan spesifik yang berkaitan dengan topik pengguna (misal: ingin lihat demo, diskusi alur fitur, atau cek ketersediaan tech stack).

KNOWLEDGE BASE:
- Portofolio Live:
  - B-Games (bgames.byarzhaning.online) — Board game multiplayer online.
  - Rajendra Pintar (rajendrapintar.byarzhaning.online) — App edukasi anak dwibahasa + audio TTS.
  - Assets GMP (assets-gmp.vercel.app) — Sistem inventaris & manajemen aset internal.

- Layanan & Harga:
  - Landing Page / Web Profil: Mulai Rp800rb (1-2 minggu)
  - Web App Custom / Dashboard: Mulai Rp6jt (3-6 minggu)
  - Mobile App (Android/iOS): Mulai Rp6jt
  - Game Realtime: Mulai Rp12jt
  - Keamanan Klien: Pembayaran bertahap per milestone (hasil jadi dulu baru bayar), garansi support 1 bulan.

- Promo Peluncuran: 5 klien pertama dapat diskon 15% + gratis technical support 1 bulan.

OBJECTION HANDLING (JANGAN MARAH/PASRAH):
- Kalau dibilang "ga percaya / ragu": Rangkul santai: "Hehe wajar banget kok kak kalau ragu 😊 Memang paling enak lihat buktinya langsung. Kakak bisa jajal 3 proyek live Arzha di portofolio (ada B-Games, Rajendra Pintar, Assets GMP). Plus bayarnya sistem termin per progress, jadi hasil kelihatan dulu baru bayar. Santai aja kak, gak ada paksaan sama sekali kok 🙏"

ATURAN UTAMA:
- Kalimat harus tuntas sampai tanda baca akhir (jangan sampai terpotong).
- jaga obrolan tetap menyenangkan, jujur, dan tidak berlebihan.`;

// Rate limiting per model per IP
interface RateLimitRecord {
    count: number;
    resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();
const RATE_LIMIT_PER_MODEL = 5; // 5 RPM per model (safe untuk free tier)
const RATE_WINDOW = 60 * 1000; // 1 menit

function getRateLimitKey(ip: string, model: string): string {
    return `${ip}:${model}`;
}

function checkRateLimit(ip: string, model: string): { allowed: boolean; remaining: number } {
    const key = getRateLimitKey(ip, model);
    const now = Date.now();
    const record = rateLimitMap.get(key);

    if (!record || now > record.resetAt) {
        rateLimitMap.set(key, { count: 1, resetAt: now + RATE_WINDOW });
        return { allowed: true, remaining: RATE_LIMIT_PER_MODEL - 1 };
    }

    if (record.count >= RATE_LIMIT_PER_MODEL) {
        return { allowed: false, remaining: 0 };
    }

    record.count += 1;
    return { allowed: true, remaining: RATE_LIMIT_PER_MODEL - record.count };
}

function cleanupOldRateLimits() {
    const now = Date.now();
    for (const [key, record] of rateLimitMap.entries()) {
        if (now > record.resetAt) {
            rateLimitMap.delete(key);
        }
    }
}

// Cleanup setiap 5 menit
setInterval(cleanupOldRateLimits, 5 * 60 * 1000);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS & method check
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    if (!GEMINI_API_KEY) {
        return res.status(503).json({ error: 'AI_UNAVAILABLE', detail: 'API key not configured' });
    }

    const { history, message } = req.body as {
        history?: Array<{ role: string; parts: { text: string }[] }>;
        message?: string;
    };

    if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Pesan tidak valid' });
    }

    // Sanitasi input
    const sanitizedMessage = message.slice(0, 1000);
    const sanitizedHistory = (history || []).slice(-12).map((h) => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: String(h.parts?.[0]?.text || '').slice(0, 1000) }],
    }));

    const contents = [
        ...sanitizedHistory,
        { role: 'user', parts: [{ text: sanitizedMessage }] },
    ];

    // IP untuk rate limiting
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 'unknown';

    // Try each model in priority order
    const errors: Array<{ model: string; error: string }> = [];

    for (const modelConfig of MODELS) {
        const model = modelConfig.name;

        // Check rate limit untuk model ini
        const rateLimitStatus = checkRateLimit(ip, model);
        if (!rateLimitStatus.allowed) {
            errors.push({ model, error: `Rate limited (${RATE_LIMIT_PER_MODEL} RPM)` });
            console.log(`[chat.ts] Model ${model} rate limited, trying next...`);
            continue;
        }

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

            const response = await fetch(`${endpoint}?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({
                    contents,
                    systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
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
                    errors.push({ model, error: 'Rate limited by Google API' });
                    console.log(`[chat.ts] Model ${model} hit Google rate limit, trying next...`);
                    continue; // Try next model
                }

                throw new Error(err.error?.message || `HTTP ${response.status}`);
            }

            const data = await response.json();
            const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!reply) {
                throw new Error('Empty response from Gemini');
            }

            // Success! Return dengan info model yang dipakai
            return res.status(200).json({
                reply: reply.trim(),
                model: model,
                remainingQuota: rateLimitStatus.remaining,
            });

        } catch (error: unknown) {
            console.error(`[chat.ts] Error with model ${model}:`, error);
            errors.push({ model, error: error instanceof Error ? error.message : 'Unknown error' });

            const isTimeout = error instanceof Error && error.name === 'AbortError';
            if (isTimeout) {
                errors[errors.length - 1].error = 'Request timeout';
            }

            // Continue to next model
            continue;
        }
    }

    // Semua model gagal
    console.error('[chat.ts] All models failed:', errors);

    // Cek apakah semua gagal karena rate limit
    const allRateLimited = errors.every(e => e.error.includes('Rate limited') || e.error.includes('rate limit'));

    if (allRateLimited) {
        return res.status(429).json({
            error: 'ALL_MODELS_RATE_LIMITED',
            detail: 'Semua model AI sedang overload. Silakan tunggu beberapa menit atau gunakan mode FAQ.',
            errors,
        });
    }

    return res.status(502).json({
        error: 'ALL_MODELS_FAILED',
        detail: 'Semua model AI tidak tersedia.',
        errors,
    });
}