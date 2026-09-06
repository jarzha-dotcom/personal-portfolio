import type { VercelRequest, VercelResponse } from '@vercel/node';

// ── API Keys ────────────────────────────────────────────────────────────────
// Primary  : AI Studio key (GEMINI_API_KEY)
// Fallback : GCP Gemini key (GOOGLE_CLOUD_GEMINI_API_KEY)
const AISTUDIO_API_KEY = process.env.GEMINI_API_KEY;
const GCP_GEMINI_API_KEY = process.env.GOOGLE_CLOUD_GEMINI_API_KEY;

// ── Antigravity Agent config ────────────────────────────────────────────────
// Antigravity = Google's agentic model in Google AI Studio
// Model name : antigravity-preview-05-2026
// Endpoint   : /v1beta/interactions (Interactions API)
// Quota      : 100 requests per day (RPD) di preview tier — ideal sebagai primary autonomous assistant
const ANTIGRAVITY_MODEL = 'antigravity-preview-05-2026';
const ANTIGRAVITY_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions';

// ── Gemini model fallback list (semua verified tersedia di AI Studio) ────────
const GEMINI_MODELS = [
    { name: 'gemini-3.8-flash', priority: 1 },  // Primary fallback — paling modern
    { name: 'gemini-3.7-flash', priority: 2 },  // Secondary — advanced, latensi rendah
    { name: 'gemini-3.6-flash', priority: 3 },  // Tertiary — balanced speed & kualitas
    { name: 'gemini-3.5-flash', priority: 4 },  // Fallback — efisien, stabil
    { name: 'gemini-3.5-flash-lite', priority: 5 }, // Lite — ultra hemat kuota
    { name: 'gemini-3.1-pro-preview', priority: 6 }, // Pro — reasoning mendalam
    { name: 'gemini-3.1-flash-lite', priority: 7 }, // Last resort — paling stabil
] as const;

// ── GCP fallback models (subset yang paling stabil) ─────────────────────────
const GCP_FALLBACK_MODELS = [
    { name: 'gemini-3.8-flash', priority: 1 },
    { name: 'gemini-3.7-flash', priority: 2 },
    { name: 'gemini-3.5-flash', priority: 3 },
] as const;

type GeminiModelName = typeof GEMINI_MODELS[number]['name'];

export type BotPersona = 'zannah' | 'rajendra' | 'kania';

// ── Upload file (input) & Attachment (output) types ──────────────────────────
// Upload: user kirim foto/PDF/CSV dari widget → base64 di body request.
// Attachment: file hasil kerja Antigravity Agent (mis. RAB.xlsx, laporan.pdf)
// yang diextract dari sandbox-nya lalu dikirim balik sebagai base64 supaya
// frontend bisa langsung bikin link download (data URI), tanpa perlu storage
// eksternal (S3/Blob) sama sekali.
interface UploadedFile {
    mimeType: string;
    data: string; // base64, tanpa prefix "data:...;base64,"
    name?: string;
}

interface Attachment {
    name: string;
    mimeType: string;
    base64: string;
}

// Mime type yang boleh di-upload user. Gambar buat dianalisis Gemini/Antigravity,
// PDF & CSV buat dokumen (mis. BOQ, data proyek) yang mau diringkas/diolah.
const ALLOWED_UPLOAD_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf', 'text/csv'];
const MAX_UPLOAD_FILES = 3;
const MAX_UPLOAD_FILE_BYTES = 6 * 1024 * 1024; // ~6MB per file (raw, sebelum base64)

function sanitizeUploadedFiles(files: unknown): UploadedFile[] {
    if (!Array.isArray(files)) return [];
    return files
        .filter((f): f is UploadedFile =>
            !!f &&
            typeof (f as any).data === 'string' &&
            typeof (f as any).mimeType === 'string' &&
            ALLOWED_UPLOAD_MIME_TYPES.includes((f as any).mimeType)
        )
        .filter((f) => {
            // Estimasi ukuran asli dari panjang base64 (base64 ≈ 4/3 dari ukuran asli)
            const approxBytes = f.data.length * 0.75;
            return approxBytes > 0 && approxBytes <= MAX_UPLOAD_FILE_BYTES;
        })
        .slice(0, MAX_UPLOAD_FILES)
        .map((f) => ({
            mimeType: f.mimeType,
            data: f.data,
            name: (f.name || 'file').slice(0, 120),
        }));
}

// ── Persona 1: Zannah (ChatWidget - Asisten Konsultatif Sales & Proyek) ────────
const SYSTEM_INSTRUCTION_ZANNAH = `Kamu adalah "Zannah", AI Tech Consultant & Business Assistant pribadi dari K. Arzhaning Jagad (Arzha) — Indie Developer & Data Specialist berpengalaman 7+ tahun di Cibitung, Bekasi.

PERAN & KARAKTER UTAMA:
- Nama kamu adalah "Zannah". Kamu adalah wanita konsultan teknologi yang ramah, santai (panggil "Kak"), cerdas, dan punya insting sales konsultatif (consultative selling) tingkat tinggi.
- Gaya bicaramu luwes seperti teman ngobrol tech yang solutif: hangat, solutif, transparan, dan tidak kaku/robotik.
- Misimu: Membantu pengunjung memahami solusi teknis terbaik untuk ide/bisnis mereka, sekaligus secara halus & elegan mengarahkan mereka untuk menggunakan jasa pengembangan dari Mas Arzha.

KEAHLIAN & PRODUCT KNOWLEDGE LENGKAP:
1. Profil & Keunikan Arzha (USP):
   - Menggabungkan ketelitian audit korporat 7+ tahun (data akurat 99%, 100+ audit SOP terselesaikan) dengan kapabilitas modern software engineering.
   - Keuntungan Klien: Aplikasi tidak cuma cantik, tapi logic bisnis rapi, minim bug, data aman, dan arsitektur scalable.

2. Portofolio Live & Bukti Nyata:
   - Zannah AI (Living Proof) → Chatbot AI interaktif di website ini adalah bukti langsung kemampuan Mas Arzha membangun sistem AI cerdas, serverless, responsif, hemat kuota, dan aman dari jailbreak.
   - B-Games (https://bgames.byarzhaning.online/) → Platform multiplayer board game realtime (Ludo, Ular Tangga, Tic Tac Toe) dengan lobby room, state sync, haptic audio. Stack: React Native/Expo, boardgame.io, Node.js/Koa, Supabase, WebSockets.
   - Rajendra Pintar (https://rajendrapintar.byarzhaning.online/) → App edukasi anak dwibahasa (ID/EN) dengan fitur Text-to-Speech (TTS), quiz interaktif, PWA offline & Android Capacitor.
   - Assets GMP (https://assets-gmp.vercel.app/) → Sistem manajemen & audit inventaris aset internal perusahaan, pelacakan mutasi, audit log, export report Excel/PDF.

3. Layanan, Estimasi Pengerjaan & Harga:
   - AI Chatbot Custom (Web / Bisnis): Mulai Rp1.500.000 (1-2 minggu)
   - Landing Page / Web Profil Bisnis: Mulai Rp800.000 (1-2 minggu)
   - Company Profile / Web App Sederhana: Mulai Rp2.500.000 (2-3 minggu)
   - Web App Custom / Dashboard Operasional: Mulai Rp6.000.000 (3-6 minggu)
   - Mobile App (Android / Cross-platform): Mulai Rp6.000.000 (3-6 minggu)
   - Realtime Game / Platform Interaktif: Mulai Rp12.000.000 (4-8 minggu)
   - Garansi: Gratis maintenance 1 bulan + promo diskon 15% untuk 5 klien pertama bulan ini!

STRATEGI SALES CERDAS & HALUS (SMART SOFT-SELLING):
1. Formula Jawaban: Berikan saran teknis bernilai (1-3 kalimat) -> kaitkan ke pengalaman Arzha -> akhiri dengan 1 pertanyaan pancingan/ajakan diskusi.
2. Jika butuh kontak WhatsApp, buatkan link WhatsApp Mas Arzha (+6282312312734) dengan brief URL-encoded:
   Format: [💬 Lanjut Diskusi ke WhatsApp Mas Arzha](https://wa.me/6282312312734?text=Halo%20Mas%20Arzha,%20saya%20tadi%20diskusi%20dengan%20Zannah%20tentang%20proyek%20<NAMA_PROYEK>.<DETAIL_SINGKAT_URL_ENCODED>)
3. Jika user meminta rangkuman obrolan/file/resume diskusi atau ingin lanjut ngobrol langsung ke Mas Arzha:
   Informasikan bahwa sistem telah menyiapkan file rangkuman yang siap diunduh di bawah pesan ini (atau tombol "Unduh Rangkuman" di header widget) untuk langsung dibawa ke WhatsApp Mas Arzha.
4. Panjang respon ideal: 2-4 kalimat padat, to-the-point, dan berbobot.`;

// ── Persona 2: Rajendra (AIChatbotShowcase - Asisten Portofolio & Tech Demo) ───
const SYSTEM_INSTRUCTION_RAJENDRA = `Kamu adalah "Rajendra", AI Portfolio Assistant & Tech Demonstrator pribadi dari K. Arzhaning Jagad (Arzha) — Indie Developer & Data Specialist berpengalaman 7+ tahun di Cibitung, Bekasi.

PERAN & KARAKTER UTAMA:
- Nama kamu adalah "Rajendra" (panggilan akrab: Rajendra / Jendra). JANGAN PERNAH menyebut dirimu Zannah atau Kania! Jika ditanya siapa namamu, tegaskan bahwa kamu adalah Rajendra.
- Kamu adalah asisten pria yang cerdas, tech-savvy, hangat, solutif, dan punya wawasan teknis mendalam (panggil lawan bicara "Kak").
- Gaya bicaramu asyik seperti tech engineer & solution consultant: lugas, percaya diri, informatif, dan tidak kaku/robotik.
- Misimu: Memandu pengunjung mengeksplorasi portofolio Mas Arzha, memamerkan keunggulan live demo arsitektur AI (Multi-LLM & Antigravity Agent), menjelaskan estimasi proyek, dan menghubungkan mereka ke kontak kerja sama.

KEAHLIAN & PRODUCT KNOWLEDGE LENGKAP:
1. Profil & Keunikan Arzha (USP):
   - Menggabungkan ketelitian audit korporat 7+ tahun (data akurat 99%, 100+ audit SOP terselesaikan) dengan kapabilitas modern software engineering.
   - Keuntungan Klien: Aplikasi tidak cuma cantik, tapi logic bisnis rapi, minim bug, data aman, dan arsitektur scalable.

2. Portofolio Live & Bukti Nyata:
   - Rajendra Pintar (https://rajendrapintar.byarzhaning.online/) → App edukasi anak dwibahasa (ID/EN) dengan fitur Text-to-Speech (TTS), quiz interaktif, PWA offline & Android Capacitor. (Nama saya terinspirasi dari app ini!).
   - B-Games (https://bgames.byarzhaning.online/) → Platform multiplayer board game realtime (Ludo, Ular Tangga, Tic Tac Toe) dengan lobby room, state sync, haptic audio. Stack: React Native/Expo, boardgame.io, Node.js/Koa, Supabase, WebSockets.
   - Assets GMP (https://assets-gmp.vercel.app/) → Sistem manajemen & audit inventaris aset internal perusahaan, pelacakan mutasi, audit log, export report Excel/PDF.
   - AI Chatbot Showcase & Multi-LLM System → Showcase interaktif ini adalah bukti nyata kemampuan Mas Arzha mengintegrasikan Antigravity Agent, kaskade Gemini Flash, auto-failover, dan speech synthesis.

3. Layanan & Kisaran Harga:
   - AI Chatbot Custom (Web / Bisnis): Mulai Rp1.500.000 (1-2 minggu)
   - Landing Page / Web Profil Bisnis: Mulai Rp800.000 (1-2 minggu)
   - Company Profile / Web App Sederhana: Mulai Rp2.500.000 (2-3 minggu)
   - Web App Custom / Dashboard Operasional: Mulai Rp6.000.000 (3-6 minggu)
   - Mobile App (Android / Cross-platform): Mulai Rp6.000.000 (3-6 minggu)
   - Realtime Game / Platform Interaktif: Mulai Rp12.000.000 (4-8 minggu)
   - Garansi: Gratis maintenance 1 bulan + promo diskon 15% untuk 5 klien pertama bulan ini!

STRATEGI KOMUNIKASI RAJENDRA:
- Jika ditanya "Siapa namamu?", jawab dengan bangga bahwa kamu adalah **Rajendra**, AI Portfolio Assistant buatan Mas Arzha.
- Berikan saran teknis yang berbobot terlebih dahulu, lalu hubungkan secara natural ke keahlian atau portofolio Mas Arzha.
- Di akhir respon, berikan 1 pertanyaan pancingan atau ajakan diskusi fitur spesifik.
- Jika user butuh kontak WhatsApp, sediakan link WhatsApp Mas Arzha (+6282312312734) yang sudah URL-encoded:
  Format: [💬 Lanjut Diskusi ke WhatsApp Mas Arzha](https://wa.me/6282312312734?text=Halo%20Mas%20Arzha,%20saya%20tadi%20diskusi%20dengan%20Rajendra%20tentang%20proyek%20<NAMA_PROYEK>.<DETAIL_SINGKAT_URL_ENCODED>)
- Jika user meminta rangkuman obrolan/file atau ingin lanjut diskusi langsung dengan Mas Arzha:
  Informasikan bahwa sistem melampirkan file rangkuman yang bisa langsung diunduh lewat tombol attachment hijau di bawah atau tombol "Unduh Rangkuman Diskusi" di atas, yang bisa diteruskan ke WhatsApp Mas Arzha.
- Format respon: 2-4 kalimat padat, to-the-point, dan berbobot.`;

// ── Persona 3: Kania (ChatWidgetCV - Asisten Virtual Halaman CV untuk HRD) ──────
const SYSTEM_INSTRUCTION_KANIA = `Kamu adalah "Kania", asisten virtual profesional Arzha (K. Arzhaning Jagad) yang dirancang khusus untuk menjawab pertanyaan HRD, rekruter, dan pewawancara.

PROFIL ARZHA:
- Nama Lengkap: K. Arzhaning Jagad (akrab dipanggil Arzha)
- Domisili: Cibitung, Bekasi — siap kerja di Jabodetabek & Hybrid
- Pengalaman: 7+ tahun korporat, saat ini Staff Audit Internal di PT Global Multipart (Agustus 2019 - sekarang)
- Background sebelumnya: Admin & Kasir, Sales Promotion Boy, Operator Finishing PT Bintang Sempurna (2014-2019)

KOMPETENSI UTAMA:
- Audit Internal: SOP compliance, risk assessment, laporan audit, verifikasi aset
- ERP: SAP Business One (inventory, purchasing, sales order, verifikasi jurnal)
- Office: Excel expert (VLOOKUP, XLOOKUP, Pivot, IF-nested), Word, PowerPoint
- Tech (Side Project): React, TypeScript, Node.js, React Native — 3 proyek live
- Soft Skill: Teliti, detail-oriented, problem solving, komunikasi efektif, bekerja under pressure

KETERSEDIAAN:
- Terbuka untuk posisi audit internal, administrasi bisnis, atau peran yang memanfaatkan kombinasi skill korporat + teknologi
- Siap penempatan Jabodetabek & Hybrid/Remote

PEDOMAN JAWABAN:
- Nama kamu adalah "Kania". JANGAN PERNAH menyebut dirimu Zannah atau Rajendra!
- Jawab dengan singkat, padat, profesional namun ramah (1-3 kalimat cukup).
- Gunakan bahasa Indonesia formal-santai.
- Jika ditanya kontak atau undangan wawancara, arahkan ke WhatsApp Mas Arzha (+6282312312734).
- Tutup dengan 1 kalimat tawaran bantuan singkat seputar CV/pengalaman Mas Arzha.`;

function getSystemInstruction(persona: BotPersona): string {
    switch (persona) {
        case 'rajendra':
            return SYSTEM_INSTRUCTION_RAJENDRA;
        case 'kania':
            return SYSTEM_INSTRUCTION_KANIA;
        case 'zannah':
        default:
            return SYSTEM_INSTRUCTION_ZANNAH;
    }
}

// ── Rate limiting per IP ────────────────────────────────────────────────────
interface RateLimitRecord {
    count: number;
    resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();
const RATE_LIMIT_PER_MODEL = 5; // 5 RPM per model per IP (safe untuk free tier)
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

// Cleanup berkala tanpa menahan proses Node.js / build exit
if (typeof setInterval !== 'undefined') {
    const timer = setInterval(cleanupOldRateLimits, 5 * 60 * 1000);
    if (typeof timer.unref === 'function') {
        timer.unref();
    }
}

// ── Deteksi kapan pertanyaan butuh Antigravity Agent ─────────────────────────
// Sebelumnya Antigravity dicoba untuk SEMUA chat (boros kuota 100 RPD & bikin
// balasan lebih lambat tanpa manfaat, karena cuma dipakai buat jawab teks
// biasa). Sekarang hanya dipicu untuk 2 kondisi:
//   1. Persona showcase (Rajendra) secara eksplisit minta mode agent (tombol
//      "Live Demo" di frontend → agentMode: true di body request)
//   2. Pesan user mengandung pola yang jelas butuh riset web / eksekusi kode /
//      generate konten — bukan sekadar tanya-jawab biasa.
const AGENT_TRIGGER_PATTERNS: RegExp[] = [
    /\b(cari|riset|research)\b.{0,20}\b(terbaru|kompetitor|tren|data|harga\s*pasar)\b/i,
    /\b(jalankan|eksekusi|run|coba)\b.{0,20}\b(kode|code|script|fungsi)\b/i,
    /\b(buatkan|generate|bikin)\b.{0,20}\b(kode|fungsi|function|script)\b.{0,20}\b(jalankan|run|eksekusi)\b/i,
    /\bbandingkan\b|\bcompare\b/i,
    /\bhitung(kan)?\b.{0,20}\b(data|angka|statistik)\b/i,
    // Minta file downloadable (RAB, invoice, laporan, dst) — ini butuh sandbox
    // Antigravity buat bikin file beneran (xlsx/pdf/dst), bukan sekadar teks.
    /\b(buatkan|generate|bikin|susun|export)\b.{0,25}\b(rab|anggaran|invoice|proposal|laporan|excel|spreadsheet|pdf|dokumen)\b/i,
];

function shouldUseAgent(message: string): boolean {
    return AGENT_TRIGGER_PATTERNS.some((pattern) => pattern.test(message));
}

// Label ramah untuk tiap tipe step yang dikembalikan Antigravity, dipakai
// frontend untuk animasi trace ("🔎 Mencari di web...", dst). Nama field step
// (`type`, `tool_name`) mengikuti dokumentasi Interactions API per rilis
// preview ini — karena API masih preview, cek ulang dengan console.log(data.steps)
// kalau Google mengubah skema-nya di kemudian hari.
interface AgentStep {
    type: string;
    label: string;
}

function labelForStep(step: any): string {
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


// ── Download & extract file hasil kerja Antigravity dari sandbox-nya ─────────
// Google belum nyediain endpoint per-file (per dokumentasi Interactions API
// per rilis ini) — cuma bisa download SELURUH environment sebagai satu file
// .tar via /v1beta/files/environment-{id}:download. Jadi strategi kita:
// 1. Download tar snapshot penuh.
// 2. Extract semua entry di memori (pakai `tar-stream`, pure-JS, gak butuh
//    binary `tar` di sistem — aman dipakai di Vercel serverless).
// 3. Filter cuma file yang "layak" jadi attachment: ekstensi dokumen/gambar
//    yang lazim (xlsx, pdf, docx, csv, png, dst), skip folder sistem/dependency
//    (node_modules, .git, __pycache__, /usr, /proc, dst), dan batasi ukuran +
//    jumlah supaya response JSON gak membengkak.
//
// ⚠️ CATATAN PENTING: karena Antigravity masih preview & endpoint file
// download ini belum pernah dites langsung ke API asli di sesi ini (sandbox
// saya gak punya akses ke generativelanguage.googleapis.com), struktur path
// di dalam tar (root folder, dst) BELUM di-verifikasi. Sebelum production,
// coba log `entries.map(e => e.name)` dulu buat lihat struktur asli sandbox,
// terus sesuaikan SKIP_PATH_SEGMENTS/DELIVERABLE_EXTENSIONS kalau perlu.
const DELIVERABLE_EXTENSIONS = ['.pdf', '.xlsx', '.xls', '.docx', '.pptx', '.csv', '.png', '.jpg', '.jpeg', '.html', '.zip', '.txt', '.md', '.json'];
const SKIP_PATH_SEGMENTS = ['node_modules/', '.git/', '__pycache__/', '.cache/', '.npm/', '/proc/', '/sys/', '/usr/', '/lib/', '/bin/', '/sbin/', '/etc/', '/var/', '.venv/'];
const MAX_ATTACHMENTS = 4;
const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024; // 8MB per file hasil (base64-nya dikirim di JSON, jangan kegedean)

function guessMimeTypeFromName(filename: string): string {
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

/**
 * Generate file dokumen rangkuman percakapan/diskusi proyek secara terstruktur (.txt)
 * agar user/klien bisa mendownload ringkasan obrolan dan melanjutkannya langsung ke Mas Arzha via WhatsApp/Email.
 */
function generateSummaryAttachment(
    history: Array<{ role: string; parts: { text: string }[] }>,
    userMessage: string,
    botReply: string,
    botName: string
): Attachment {
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const lines: string[] = [
        '================================================================',
        '  RANGKUMAN DISKUSI PROYEK - K. ARZHANING JAGAD (ARZHA)',
        '================================================================',
        `Waktu Sesi    : ${dateStr}, ${timeStr} WIB`,
        `Asisten AI    : ${botName} (AI Tech Consultant & Portfolio Assistant)`,
        'Situs Web     : https://',
        '',
        '----------------------------------------------------------------',
        '1. RINGKASAN DISKUSI & TRANSKRIP:',
        '----------------------------------------------------------------',
    ];

    if (history && history.length > 0) {
        for (const h of history) {
            const sender = h.role === 'user' ? 'Klien' : botName;
            const text = h.parts?.[0]?.text || '';
            if (text.trim()) {
                lines.push(`[${sender}]:\n${text.trim()}\n`);
            }
        }
    }
    if (userMessage.trim()) {
        lines.push(`[Klien]:\n${userMessage.trim()}\n`);
    }
    if (botReply.trim()) {
        lines.push(`[${botName}]:\n${botReply.trim()}\n`);
    }

    lines.push('----------------------------------------------------------------');
    lines.push('2. INFORMASI KONTAK PENGEMBANG (LANJUTKAN DISKUSI LANGSUNG):');
    lines.push('----------------------------------------------------------------');
    lines.push('Nama Pengembang : K. Arzhaning Jagad (Arzha)');
    lines.push('Spesialisasi    : Web, Mobile Apps, Realtime System & AI Integration');
    lines.push('Pengalaman      : 7+ Tahun Profesional (Audit Korporat + Full-Stack)');
    lines.push('WhatsApp        : 0823-1231-2734 (+6282312312734)');
    lines.push('Email           : Jarzha@gmail.com');
    lines.push('Lokasi          : Cibitung, Bekasi, Jawa Barat');
    lines.push('');
    lines.push('Link WhatsApp Langsung:');
    lines.push('https://wa.me/6282312312734?text=Halo%20Mas%20Arzha,%20saya%20sudah%20konsultasi%20di%20web%20dan%20ingin%20lanjut%20diskusi%20proyek.');
    lines.push('================================================================');

    const content = lines.join('\n');
    const dateSlug = now.toISOString().slice(0, 10);
    return {
        name: `Rangkuman-Diskusi-${botName}-${dateSlug}.txt`,
        mimeType: 'text/plain;charset=utf-8',
        base64: Buffer.from(content, 'utf-8').toString('base64'),
    };
}

// Extract semua entry file dari buffer .tar, pakai lib `tar-stream` (pure JS).
// PERLU: `npm install tar-stream` (+ `npm i -D @types/tar-stream` kalau strict TS).
async function extractTarEntries(buffer: Buffer): Promise<Array<{ name: string; data: Buffer; mtime: number }>> {
    // Import dinamis biar file ini tetap bisa di-lint/build walau dependency
    // belum ke-install saat pertama kali nge-copy kode ini ke project.
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

async function downloadAntigravityFiles(apiKey: string, environmentId: string): Promise<Attachment[]> {
    if (!environmentId) return [];

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/files/environment-${environmentId}:download?alt=media`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s, jangan sampai nge-block balasan chat kelamaan

        const response = await fetch(url, {
            headers: { 'x-goog-api-key': apiKey },
            signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            console.warn(`[chat.ts] Gagal download environment snapshot (${response.status}), skip attachment.`);
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
            .sort((a, b) => b.mtime - a.mtime) // file paling baru dibuat/diubah duluan
            .slice(0, MAX_ATTACHMENTS);

        console.log(`[chat.ts] 📦 Ketemu ${candidates.length} file layak-download dari sandbox Antigravity.`);

        return candidates.map((c) => ({
            name: c.name.split('/').pop() || c.name,
            mimeType: guessMimeTypeFromName(c.name),
            base64: c.data.toString('base64'),
        }));
    } catch (error: unknown) {
        console.warn('[chat.ts] Error saat download/extract file sandbox Antigravity:', error);
        return [];
    }
}

async function callAntigravity(
    apiKey: string,
    message: string,
    history: Array<{ role: string; parts: { text: string }[] }>,
    ip: string,
    systemInstruction: string,
    botName: string,
    files: UploadedFile[] = [],
): Promise<{ reply: string; model: string; remainingQuota: number; agentSteps: AgentStep[]; attachments: Attachment[] } | null> {
    // Rate limit check untuk Antigravity
    const rateLimitStatus = checkRateLimit(ip, 'antigravity');
    if (!rateLimitStatus.allowed) {
        console.log('[chat.ts] Antigravity rate limited locally, skipping...');
        return null;
    }

    // Format prompt dengan System Instruction & percakapan sebelumnya
    const historyText = history
        .map((h) => `${h.role === 'user' ? 'User' : botName}: ${h.parts?.[0]?.text || ''}`)
        .filter(Boolean)
        .join('\n');

    const prompt = `[SYSTEM INSTRUCTION]\n${systemInstruction}\n\n[CONVERSATION HISTORY]\n${historyText ? historyText + '\n\n' : ''}User: ${message}\n${botName}:`;

    // Kalau ada file yang diupload user (foto/PDF/CSV), input dikirim sebagai
    // array of content block (bukan cuma string) — format ini sesuai skema
    // Interactions API: {"type":"text","text":...} / {"type":"image","data":...,
    // "mime_type":...} / {"type":"document","data":...,"mime_type":...}.
    // Kalau gak ada file, tetap kirim string biasa (lebih ringkas & sudah
    // terbukti jalan di versi sebelumnya).
    const antigravityInput =
        files.length > 0
            ? [
                { type: 'text', text: prompt },
                ...files.map((f) =>
                    f.mimeType.startsWith('image/')
                        ? { type: 'image', data: f.data, mime_type: f.mimeType }
                        : { type: 'document', data: f.data, mime_type: f.mimeType } // PDF / CSV
                ),
            ]
            : prompt;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s — dinaikkan dikit karena task dengan file (mis. generate RAB.xlsx) makan waktu lebih lama dari sekadar riset teks

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
            console.warn(`[chat.ts] Antigravity error ${response.status}:`, err?.error?.message || response.statusText);

            // 429 = rate limited (100 RPD tercapai), gracefully fallback ke Gemini cascade
            if (response.status === 429) return null;
            return null;
        }

        const data = await response.json();

        // Ekstraksi text + jejak langkah (agentSteps) dari response steps Antigravity.
        // agentSteps dipakai frontend untuk animasi trace visual (lihat AIChatbotShowcase.tsx).
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
                // Cuma catat step yang bermakna buat ditampilkan (skip user_input,
                // dan skip duplikat label berturut-turut biar trace tidak berulang).
                if (step.type && step.type !== 'user_input') {
                    const label = labelForStep(step);
                    if (agentSteps[agentSteps.length - 1]?.label !== label) {
                        agentSteps.push({ type: step.type, label });
                    }
                }
            }
        }

        // Bersihkan prefix botName jika model mengulang label tersebut
        reply = reply.replace(new RegExp(`^(?:${botName}):\\s*`, 'i'), '').trim();

        if (!reply) {
            console.warn('[chat.ts] Antigravity returned empty response');
            return null;
        }

        // Kalau agent bikin file di sandbox-nya (mis. RAB.xlsx, laporan.pdf),
        // ambil sekalian supaya bisa ditawarin download ke user. Ini best-effort:
        // kalau gagal/timeout, chat tetap jalan normal tanpa attachment — jangan
        // sampai fitur download bikin balasan teks yang udah berhasil ikut gagal.
        let attachments: Attachment[] = [];
        const environmentId: string | undefined = data.environment_id;
        if (environmentId) {
            attachments = await downloadAntigravityFiles(apiKey, environmentId);
        }

        console.log(`[chat.ts] ✅ Antigravity Agent responded successfully for ${botName}${attachments.length ? ` (+${attachments.length} file)` : ''}`);
        return {
            reply,
            model: ANTIGRAVITY_MODEL,
            remainingQuota: rateLimitStatus.remaining,
            agentSteps,
            attachments,
        };
    } catch (error: unknown) {
        const isTimeout = error instanceof Error && error.name === 'AbortError';
        console.warn(`[chat.ts] Antigravity ${isTimeout ? 'timeout' : 'error'}:`, error);
        return null;
    }
}

// ── Gemini model call (standard generateContent) ────────────────────────────
async function callGeminiModel(
    apiKey: string,
    modelName: string,
    contents: Array<{ role: string; parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> }>,
    ip: string,
    apiSource: 'aistudio' | 'gcp',
    systemInstruction: string,
): Promise<{ reply: string; model: string; remainingQuota: number; apiSource: 'aistudio' | 'gcp' } | null> {
    const rateLimitStatus = checkRateLimit(ip, `${apiSource}:${modelName}`);
    if (!rateLimitStatus.allowed) {
        console.log(`[chat.ts] [${apiSource}] Model ${modelName} rate limited locally, skipping...`);
        return null;
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

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
                console.log(`[chat.ts] [${apiSource}] Model ${modelName} hit Google rate limit, trying next...`);
                return null;
            }

            throw new Error(err.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!reply) {
            throw new Error('Empty response from Gemini');
        }

        console.log(`[chat.ts] ✅ [${apiSource}] Model ${modelName} responded successfully`);
        return {
            reply: reply.trim(),
            model: modelName,
            remainingQuota: rateLimitStatus.remaining,
            apiSource,
        };
    } catch (error: unknown) {
        const isTimeout = error instanceof Error && error.name === 'AbortError';
        console.error(`[chat.ts] [${apiSource}] Error with model ${modelName}:`, isTimeout ? 'timeout' : error);
        return null;
    }
}

// ── Main handler ────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
    // ── Origin & Domain Security Guard ──────────────────────────────────────────
    // Mengunci endpoint agar hanya melayani domain resmi K. Arzhaning Jagad dan localhost
    const originHeader = (req.headers.origin as string) || '';
    const refererHeader = (req.headers.referer as string) || '';
    const clientSource = originHeader || refererHeader;

    const isOriginAllowed = () => {
        if (!clientSource) return true; // Server-to-server / curl testing
        try {
            const parsed = new URL(clientSource);
            const host = parsed.hostname.toLowerCase();
            // Izinkan localhost & dev environment
            if (host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.')) return true;
            // Izinkan domain resmi K. Arzhaning Jagad
            if (host === 'byarzhaning.online' || host.endsWith('.byarzhaning.online')) return true;
            // Izinkan preview deployment resmi Vercel (personal-portfolio)
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

    // API keys dinamis dari environment
    const aiStudioKey = process.env.GEMINI_API_KEY || AISTUDIO_API_KEY;
    const gcpKey = process.env.GOOGLE_CLOUD_GEMINI_API_KEY || GCP_GEMINI_API_KEY;

    // Pastikan minimal satu key tersedia
    if (!aiStudioKey && !gcpKey) {
        return res.status(503).json({ error: 'AI_UNAVAILABLE', detail: 'No API keys configured' });
    }

    const { history, message, model: requestedModel, persona = 'zannah', agentMode, files: rawFiles } = req.body as {
        history?: Array<{ role: string; parts: { text: string }[] }>;
        message?: string;
        model?: string;
        persona?: BotPersona;
        agentMode?: boolean;
        files?: unknown;
    };

    if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Pesan tidak valid' });
    }

    // File upload (foto/PDF/CSV) — divalidasi tipe & ukurannya, sisanya dibuang diam-diam
    const sanitizedFiles = sanitizeUploadedFiles(rawFiles);

    // Resolusi Persona bot (Zannah = ChatWidget, Rajendra = Showcase, Kania = CV)
    const activePersona: BotPersona = (persona === 'rajendra' || persona === 'kania') ? persona : 'zannah';
    const systemInstruction = getSystemInstruction(activePersona);
    const botName = activePersona === 'rajendra' ? 'Rajendra' : activePersona === 'kania' ? 'Kania' : 'Zannah';

    // IP untuk rate limiting
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 'unknown';

    // Sanitasi input
    const sanitizedMessage = message.slice(0, 1000);
    const sanitizedHistory = (history || []).slice(-12).map((h) => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: String(h.parts?.[0]?.text || '').slice(0, 1000) }],
    }));

    // Kalau ada file upload, tempel sebagai inlineData part tambahan di giliran
    // user paling akhir — format ini yang dipakai generateContent (beda dari
    // skema Interactions API yang dipakai Antigravity, lihat callAntigravity).
    const userParts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
        { text: sanitizedMessage },
    ];
    for (const f of sanitizedFiles) {
        userParts.push({ inlineData: { mimeType: f.mimeType, data: f.data } });
    }

    const contents = [
        ...sanitizedHistory,
        { role: 'user', parts: userParts },
    ];

    // ── Tentukan urutan model Gemini ─────────────────────────────────────────
    const requestedModelIsValid = GEMINI_MODELS.some((m) => m.name === requestedModel);
    const orderedGeminiModels = requestedModelIsValid
        ? [
            GEMINI_MODELS.find((m) => m.name === requestedModel)!,
            ...GEMINI_MODELS.filter((m) => m.name !== requestedModel),
        ]
        : [...GEMINI_MODELS];

    // Deteksi apakah user meminta file rangkuman / resume / ekspor obrolan untuk diskusi lanjutan
    const isSummaryRequested =
        /\b(rangkum(an)?|resume|ringkas(an)?|export|unduh|download|file|dokumen)\b.{0,30}\b(obrolan|chat|diskusi|percakapan|proyek|project|rab|pembahasan)\b/i.test(sanitizedMessage) ||
        /\b(buatkan|generate|bikin|minta|kirim)\b.{0,25}\b(file|rangkuman|resume|dokumen|txt)\b/i.test(sanitizedMessage);

    const enrichWithSummaryAttachment = (resData: any) => {
        if (!isSummaryRequested || !resData) return resData;
        const existingAtts = resData.attachments || [];
        if (existingAtts.length === 0) {
            const summaryAtt = generateSummaryAttachment(
                sanitizedHistory,
                sanitizedMessage,
                resData.reply || '',
                botName
            );
            return {
                ...resData,
                attachments: [summaryAtt],
            };
        }
        return resData;
    };

    // ═══════════════════════════════════════════════════════════════════════
    // LAYER 1: Antigravity Agent — dipicu untuk Rajendra (showcase) & Zannah
    // (ChatWidget) kalau ada trigger manual ATAU heuristic (riset/kode/bikin
    // file downloadable). Kania (CV/HRD) sengaja TIDAK diikutkan: konteksnya
    // wawancara/HR yang butuh respons cepat, dan gak ada use-case realistis
    // buat generate file di situ — jadi biar tetap ringan & gak makan kuota
    // 100 RPD bareng-bareng dari persona yang gak butuh-butuh amat.
    // ═══════════════════════════════════════════════════════════════════════
    const agentTriggeredByUser = agentMode === true;
    const agentTriggeredByHeuristic = shouldUseAgent(sanitizedMessage);
    const agentEligiblePersona = activePersona === 'rajendra' || activePersona === 'zannah';
    const wantsAgent = agentEligiblePersona && (agentTriggeredByUser || agentTriggeredByHeuristic);
    const isAntigravityTarget = wantsAgent && (!requestedModel || requestedModel === ANTIGRAVITY_MODEL);
    if (aiStudioKey && isAntigravityTarget) {
        console.log(`[chat.ts] Agent mode triggered (${agentTriggeredByUser ? 'manual' : 'heuristic'}) — trying Antigravity as ${botName}...`);
        const antigravityResult = await callAntigravity(
            aiStudioKey,
            sanitizedMessage,
            sanitizedHistory,
            ip,
            systemInstruction,
            botName,
            sanitizedFiles,
        );

        if (antigravityResult) {
            return res.status(200).json(enrichWithSummaryAttachment({
                ...antigravityResult,
                apiSource: 'aistudio',
                usedAgent: true,
                agentTriggerReason: agentTriggeredByUser ? 'manual' : 'heuristic',
            }));
        }

        console.log('[chat.ts] Antigravity unavailable, falling back to Gemini models...');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // LAYER 2: Gemini model cascade (AI Studio key)
    // ═══════════════════════════════════════════════════════════════════════
    if (aiStudioKey) {
        for (const modelConfig of orderedGeminiModels) {
            const result = await callGeminiModel(
                aiStudioKey,
                modelConfig.name,
                contents,
                ip,
                'aistudio',
                systemInstruction,
            );
            if (result) {
                return res.status(200).json(enrichWithSummaryAttachment(result));
            }
        }

        console.log('[chat.ts] All AI Studio models failed. Switching to GCP fallback...');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // LAYER 3: GCP fallback (GOOGLE_CLOUD_GEMINI_API_KEY)
    // ═══════════════════════════════════════════════════════════════════════
    if (gcpKey) {
        console.log('[chat.ts] 🔄 Using GCP API key as fallback...');

        for (const modelConfig of GCP_FALLBACK_MODELS) {
            const result = await callGeminiModel(
                gcpKey,
                modelConfig.name,
                contents,
                ip,
                'gcp',
                systemInstruction,
            );
            if (result) {
                return res.status(200).json(enrichWithSummaryAttachment(result));
            }
        }

        console.error('[chat.ts] All GCP fallback models also failed.');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // LAYER 4: Semua gagal → client fallback ke Radit FAQ bot
    // ═══════════════════════════════════════════════════════════════════════
    console.error('[chat.ts] ❌ All layers exhausted. No AI available.');
    return res.status(502).json({
        error: 'ALL_MODELS_FAILED',
        detail: 'Semua model AI tidak tersedia. Silakan coba lagi beberapa saat.',
    });
}