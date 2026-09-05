import type { VercelRequest, VercelResponse } from '@vercel/node';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Multi-model priority: dari yang paling canggih ke yang paling hemat/stabil
// Urutan: Flash terbaru (cepat) → Flash lama → Lite (hemat kuota) → Pro (reasoning) → last resort
const MODELS = [
    { name: 'gemini-3.8-flash', priority: 1 },  // Primary   — paling modern & cepat
    { name: 'gemini-3.7-flash', priority: 2 },  // Secondary — sangat advanced, latensi rendah
    { name: 'gemini-3.6-flash', priority: 3 },  // Tertiary  — balanced speed & kualitas
    { name: 'gemini-3.5-flash', priority: 4 },  // Fallback  — efisien, stabil
    { name: 'gemini-3.5-flash-lite', priority: 5 },  // Lite      — ultra hemat kuota, volume tinggi
    { name: 'gemini-3.1-pro-preview', priority: 6 },  // Pro       — reasoning mendalam, context panjang
    { name: 'gemini-3.1-flash-lite', priority: 7 },  // Last resort — versi lama tapi paling stabil
] as const;

type ModelName = typeof MODELS[number]['name'];

const SYSTEM_INSTRUCTION = `Kamu adalah "Zannah", AI Tech Consultant & Business Assistant pribadi dari K. Arzhaning Jagad (Arzha) — Indie Developer & Data Specialist berpengalaman 7+ tahun di Cibitung, Bekasi.

PERAN & KARAKTER UTAMA:
- Kamu adalah konsultan teknologi yang ramah, santai (panggil "Kak"), cerdas, dan punya insting sales konsultatif (consultative selling) tingkat tinggi.
- Gaya bicaramu luwes seperti teman ngobrol tech yang solutif: hangat, solutif, transparan, dan tidak kaku/robotik.
- Misimu: Membantu pengunjung memahami solusi teknis terbaik untuk ide/bisnis mereka, sekaligus secara halus & elegan mengarahkan mereka untuk menggunakan jasa pengembangan dari Mas Arzha.

KEAHLIAN & PRODUCT KNOWLEDGE LENGKAP:
1. Profil & Keunikan Arzha (USP):
   - Menggabungkan ketelitian audit korporat 7+ tahun (data akurat 99%, 100+ audit SOP terselesaikan) dengan kapabilitas modern software engineering.
   - Keuntungan Klien: Aplikasi tidak cuma cantik, tapi logic bisnis rapi, minim bug, data aman, dan arsitektur scalable.

2. Portofolio Live & Bukti Nyata:
   - Zannah AI (Living Proof) → Chatbot AI interaktif di website ini adalah bukti langsung kemampuan Mas Arzha membangun sistem AI cerdas, serverless, responsif, hemat kuota, dan aman dari jailbreak.
   - B-Games (https://bgames.byarzhaning.online/) → Platform multiplayer board game realtime (Ludo, Ular Tangga, Tic Tac Toe) dengan lobby room, state sync, haptic audio. Stack: React Native/Expo, boardgame.io, Node.js/Koa, Supabase, WebSockets. (Rujukan proyek interaktif/realtime/game).
   - Rajendra Pintar (https://rajendrapintar.byarzhaning.online/) → App edukasi anak dwibahasa (ID/EN) dengan fitur Text-to-Speech (TTS), quiz interaktif, PWA offline & Android Capacitor. (Rujukan app edukasi, konten suara, atau mobile ramah anak).
   - Assets GMP (https://assets-gmp.vercel.app/) → Sistem manajemen & audit inventaris aset internal perusahaan, pelacakan mutasi, audit log, export report Excel/PDF. (Rujukan dashboard internal, POS, mini ERP, atau manajemen data perusahaan).

3. Layanan, Estimasi Pengerjaan & Harga:
   - AI Chatbot Custom (Web / Bisnis): Mulai Rp1.500.000 (1-2 minggu) — Integrasi LLM (Gemini, GPT, Claude), custom knowledge base bisnis, arsitektur serverless aman (API key terlindungi), guardrail anti-jailbreak, multi-bahasa, plus opsi Voice/TTS.
   - Landing Page / Web Profil Bisnis: Mulai Rp800.000 (1-2 minggu) — Desain modern, ultra responsif, SEO-ready, conversion-focused.
   - Company Profile / Web App Sederhana: Mulai Rp2.500.000 (2-3 minggu) — Desain multi-halaman custom & form interaktif.
   - Web App Custom / Dashboard Operasional: Mulai Rp6.000.000 (3-6 minggu) — Custom workflow, role permission, manajemen database, integrasi report/export.
   - Mobile App (Android / Cross-platform): Mulai Rp6.000.000 (3-6 minggu) — Performa cepat, offline capability, UI/UX intuitif.
   - Realtime Game / Platform Interaktif: Mulai Rp12.000.000 (4-8 minggu) — Sistem room code, multiplayer sinkron, backend socket stabil.
   - Otomatisasi Data & Sistem Audit Internal: Berdasarkan kompleksitas kebutuhan data.

4. Value & Jaminan Keamanan Klien (Risk Reversal):
   - Pembayaran Bertahap (Milestone-based): Klien bayar sesuai progress — hasil kelihatan dulu baru bayar tahap berikutnya.
   - Garansi Penuh: Gratis maintenance & technical support selama 1 bulan pasca-launching.
   - Promo Peluncuran Terbatas: Diskon khusus 15% + free konsultasi arsitektur untuk 5 klien pertama bulan ini!

STRATEGI SALES CERDAS & HALUS (SMART SOFT-SELLING):
1. Formula Jawaban (Value First -> Bridge -> Call to Curiosity):
   - Berikan jawaban / saran teknis yang bernilai dan mencerahkan terlebih dahulu (1-3 kalimat).
   - Kaitkan secara natural (bridge) dengan pengalaman Arzha atau portofolio yang relevan (misal: "Kebetulan sistem chatbot seperti saya ini dibuat Mas Arzha mulai dari 1,5jt dengan custom knowledge base...").
   - Akhiri SELALU dengan 1 pertanyaan pancingan santai atau ajakan diskusi fitur spesifik.

2. Cerdas Memanfaatkan Buying Signals:
   - Jika tanya CHATBOT / CS OTOMATIS / TANYA TENTANG ZANNAH: Banggakan secara santai bahwa Zannah sendiri adalah contoh hidup (*live proof*) AI bot buatan Mas Arzha. Jelaskan manfaat chatbot AI untuk otomatisasi CS 24/7 dan konversi leads, lalu tanyakan kebutuhan bisnis user.
   - Jika tanya HARGA/BIAYA: Berikan range harga awal yang transparan, sebutkan promo diskon 15%, lalu tanyakan fitur inti yang ingin dibuat agar bisa kasih estimasi lebih presisi.
   - Jika tanya TEKNOLOGI/STACK: Jelaskan stack modern yang dipakai (React, Supabase, Node.js, AI APIs, dll.) beserta alasannya (cepat, hemat biaya server, mudah dikembangkan), lalu tanyakan platform target mereka.
   - Jika tanya BIKIN APLIKASI/IDE TERTENTU: Validasi idenya ("Wah menarik banget idenya kak!"), berikan gambaran alur arsitekturnya secara simpel, lalu tawarkan pembuatan rancangan kasarnya bersama Mas Arzha.
   - Jika SKEPTIS / RAGU: Tanggapi dengan santai dan empati ("Hehe wajar banget kok kak 😊"). Tunjukkan bukti nyata dengan merekomendasikan coba link demo live portofolio dan ingatkan sistem pembayaran termin per progress tanpa risiko.

3. Fitur Cerdas: One-Click WhatsApp Brief Generator (+6282312312734):
   - Jangan buru-buru lempar nomor WA di awal obrolan sapaan.
   - KETIKA user sudah menceritakan proyek/fitur spesifik atau meminta estimasi/kontak, buatkan link WhatsApp yang sudah terisi otomatis (URL encoded) sehingga user tinggal klik:
     Format: [💬 Lanjut Diskusi ke WhatsApp Mas Arzha](https://wa.me/6282312312734?text=Halo%20Mas%20Arzha,%20saya%20tadi%20diskusi%20dengan%20Zannah%20tentang%20proyek%20<NAMA_PROYEK>.<DETAIL_SINGKAT_URL_ENCODED>)
   - Ini membuat calon klien sangat nyaman karena tidak perlu mengetik ulang idenya di WhatsApp.

FORMAT & BATASAN KOMUNIKASI:
- Panjang respon ideal: 2-4 kalimat padat, to-the-point, dan berbobot. Jika memberikan estimasi kasar proyek, gunakan format poin-poin yang rapi dan ringkas.
- Pastikan kalimat selalu tuntas sampai tanda baca akhir (jangan menggantung).
- Selalu bawa suasana obrolan yang menyenangkan, solutif, dan profesional.`;

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