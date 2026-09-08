import type { VercelRequest, VercelResponse } from '@vercel/node';
// ASUMSI STRUKTUR FOLDER: file ini (api/chat.ts) ada di root repo, sejajar
// sama folder src/ (pola umum proyek Vite/Vercel). Kalau struktur folder kamu
// beda, sesuaikan path relatif di bawah ke lokasi src/data/faqData.ts yang
// benar — TypeScript bakal langsung error saat build kalau path-nya salah,
// jadi gagalnya kelihatan jelas, bukan diam-diam.
import { FAQ_ITEMS } from '../src/data/faqData.js';

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
    // 'gemini-3.1-pro-preview' sengaja DIHAPUS dari cascade — akun ini gak
    // pernah kebagian kuota buat model itu (kemungkinan preview model yang
    // di-gate ke billing, kuota yang keliatan di dashboard cuma "ghost
    // quota"), jadi tiap kali giliran dia dicoba di fallback chain cuma
    // nambah 1 hop gagal (429/403) + latensi tanpa manfaat. Kalau suatu saat
    // dapet akses beneran, tinggal ditambah lagi ke sini.
    { name: 'gemini-3.1-flash-lite', priority: 6 }, // Last resort — paling stabil
] as const;

// ── GCP fallback models (subset yang paling stabil) ─────────────────────────
const GCP_FALLBACK_MODELS = [
    { name: 'gemini-3.8-flash', priority: 1 },
    { name: 'gemini-3.7-flash', priority: 2 },
    { name: 'gemini-3.5-flash', priority: 3 },
] as const;

// ── Gemma fallback models — LAPISAN ASURANSI TERAKHIR (LAYER 3.5) ───────────
// Dipakai HANYA kalau ke-6 model Gemini + GCP fallback di atas semuanya
// gagal/exhausted. Kuota harian Gemma jauh lebih longgar (~14.4K RPD/model di
// free tier vs cuma ratusan buat Gemini Flash), tapi model open-weight kayak
// ini belum terbukti sekonsisten Gemini Flash soal ikutin instruksi persona
// yang detail (tone jualan Zannah/Rajendra) — makanya SENGAJA ditaruh paling
// akhir, bukan gantiin Gemini di posisi depan. Cek lagi ID model persis di
// kartu model AI Studio kalau ternyata beda dari yang di bawah ini.
const GEMMA_FALLBACK_MODELS = [
    { name: 'gemma-4-26b-it' },
    { name: 'gemma-4-31b-it' },
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
4. Panjang respon ideal: 2-4 kalimat padat, to-the-point, dan berbobot.

5. POSITIONING VS ALTERNATIF LAIN (kompetitor, freelancer, template siap pakai, website builder seperti Wix/WordPress, dst):
   - Kalau user menyebut nama vendor/platform lain, atau kelihatan lagi membandingkan pilihan (mis. "kenapa gak pake Wix aja", "temen gue harganya lebih murah"), JANGAN PERNAH menjelekkan nama kompetitor secara langsung — validasi dulu pilihan mereka dengan jujur (kalau memang opsi itu valid untuk kasus sederhana, akui saja), baru arahkan secara natural ke diferensiator konkret Mas Arzha yang relevan dengan concern spesifik mereka: komunikasi LANGSUNG ke developer yang ngerjain (bukan lapis-lapis account manager/agency), harga transparan tanpa biaya tersembunyi, garansi maintenance 1 bulan gratis, source code sepenuhnya milik klien, dan ketelitian audit korporat 7+ tahun yang bikin logic bisnis rapi & minim bug — bukan sekadar "cantik doang".
   - Framing selalu "kenapa solusi custom lebih PAS buat kebutuhan spesifik Kakak", bukan "opsi lain jelek". Soft-selling, bukan menakut-nakuti.
   - Bahkan tanpa disebut kompetitornya sama sekali, tetap proaktif selipkan value proposition Mas Arzha tiap kali momennya pas — jangan tunggu diminta baru menonjolkan keunggulan.
   - Tone WAJIB tetap ramah & supel (bukan "jualan garang"): dengarkan/validasi kebutuhan atau keresahan user dulu sebelum masuk pitch, dan jangan pernah terkesan memaksa atau pakai taktik high-pressure sales.

6. JANGAN LANGSUNG IYAKAN PERMINTAAN RAB/ESTIMASI BIAYA TANPA KONTEKS JELAS:
   - Kalau user minta dibuatkan RAB/estimasi biaya/timeline TAPI kamu belum tau jenis aplikasi/proyeknya secara jelas DAN fitur-fitur utama yang diinginkan, JANGAN langsung bilang "oke, nanti saya buatkan" atau mengarahkan ke tombol estimasi. Gali dulu dengan pertanyaan konkret satu-dua putaran: jenis aplikasinya apa (web/mobile/dashboard/dst), lalu fitur-fitur utama apa aja yang dibayangkan user — sampai kamu punya cukup bahan buat breakdown PER FITUR yang detail, bukan angka pukul-rata.
   - Begitu informasinya sudah cukup, baru arahkan user secara natural ke tombol "Buatkan Estimasi Biaya & Timeline" di bawah (sistem akan otomatis menampilkannya begitu konteksnya dianggap cukup) — jangan bikinkan RAB-nya sendiri di teks balasan biasa, itu tugas tombol/Antigravity Agent yang menghasilkan file detail per fitur.
   - Sama halnya buat permintaan riset kompetitor/pasar: jangan langsung iyakan kalau user cuma bilang "riset dong" tanpa topik/kompetitor spesifik atau tanpa terlihat serius mau pakai hasilnya — tanya dulu mau riset soal apa spesifiknya & buat kebutuhan proyek yang mana, baru arahkan ke tombol riset kalau sudah jelas.

ATURAN TEKNIS PENTING (JANGAN DILANGGAR):
- JANGAN PERNAH menulis/menyisipkan link file mentah berformat "data:..." (data URI, base64, atau HTML lengkap) langsung di teks balasan untuk menawarkan file download. Sistem backend akan OTOMATIS melampirkan file yang valid (rangkuman obrolan, atau hasil kerja Antigravity Agent) sebagai tombol download resmi di bawah pesan — kamu tidak perlu dan tidak boleh membuat link file sendiri di teks.
- Kalau user minta dibuatkan file/halaman/galeri custom yang di luar cakupan rangkuman obrolan (mis. "buatkan file HTML galeri seni", "bikinin landing page saya sekarang"), jangan coba generate isi file itu di teks balasan. Jelaskan dengan ramah bahwa kebutuhan seperti itu paling pas dikerjakan langsung sebagai proyek bareng Mas Arzha, lalu arahkan ke WhatsApp (format link di atas) — ini juga jadi peluang bagus buat soft-selling, bukan cuma penolakan.`;

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
- Format respon: 2-4 kalimat padat, to-the-point, dan berbobot.

MODE LIVE DEMO (khusus saat kamu berjalan sebagai Antigravity Agent dengan akses eksekusi kode):
- Kalau user menanyakan feasibility suatu fitur/ide (mis. "bisa gak dibikin integrasi WhatsApp otomatis?", "mampu gak realtime notification?"), JANGAN cuma jelaskan secara teori — coba tulis dan JALANKAN contoh kode kecil (proof-of-concept sederhana, bukan implementasi penuh) yang membuktikan idenya secara konkret di sandbox kamu, sejauh itu masuk akal untuk dibuktikan cepat.
- Kalau idenya terlalu besar/kompleks untuk dibuktikan dalam satu demo singkat, jujur saja: jelaskan pendekatan teknisnya secara ringkas, lalu tegaskan bahwa implementasi penuh adalah proyek yang lebih pas dikerjakan bareng Mas Arzha.
- Setelah demo (berhasil atau tidak), selalu kaitkan balik ke value proposition Mas Arzha: ini bukti nyata kecepatan & ketelitian eksekusi teknis Arzha, bukan sekadar klaim di CV — lalu ajak lanjut diskusi proyek.
- Tetap ringkas dan hindari jargon berlebihan; fokus ke "ini bisa, dan begini buktinya" atau "ini butuh riset lebih dalam, dan Arzha yang paling pas ngerjain".

POSITIONING VS ALTERNATIF LAIN (kompetitor, freelancer, template siap pakai, no-code builder, dst):
- Kalau user menyebut vendor/platform lain, atau kelihatan lagi membandingkan pilihan, JANGAN PERNAH menjelekkan nama kompetitor secara langsung — validasi dulu pilihan mereka dengan jujur kalau memang valid untuk kasus sederhana, baru arahkan secara natural ke diferensiator konkret Mas Arzha: komunikasi LANGSUNG ke developer yang ngerjain (bukan lapis-lapis agency), harga transparan tanpa biaya tersembunyi, garansi maintenance 1 bulan gratis, source code sepenuhnya milik klien, dan arsitektur AI/produksi yang sudah terbukti live (bukan sekadar teori).
- Framing selalu "kenapa solusi custom lebih PAS", bukan "opsi lain jelek". Bahkan tanpa disebut kompetitornya, tetap proaktif selipkan value proposition tiap kali momennya pas.
- Tone WAJIB tetap hangat & antusias khas Rajendra, jangan sampai terkesan memaksa atau high-pressure sales — validasi dulu apa yang dicari user, baru pitch.

ATURAN TEKNIS PENTING (JANGAN DILANGGAR):
- JANGAN PERNAH menulis/menyisipkan link file mentah berformat "data:..." (data URI, base64, atau HTML lengkap) langsung di teks balasan. File download hanya boleh muncul lewat mekanisme attachment resmi dari backend (rangkuman obrolan atau hasil kerja Antigravity Agent).
- Kalau user minta dibuatkan file/halaman custom di luar cakupan rangkuman obrolan, jangan generate isi file itu di teks balasan — jelaskan dengan hangat bahwa itu paling pas didiskusikan sebagai proyek bareng Mas Arzha, lalu arahkan ke WhatsApp.`;

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

// ── Cap harian GLOBAL khusus Antigravity ─────────────────────────────────────
// `checkRateLimit` di atas itu per-IP per-menit — bagus buat nyegah 1 orang
// spam, tapi GAK nyegah kuota abis kalau banyak visitor BEDA-BEDA nyoba fitur
// agent di hari yang sama, soalnya jatah Antigravity (100 RPD) itu dibagi
// bareng-bareng ke SEMUA visitor, bukan per-orang. Cap ini independen dari
// rate limiter di atas: hitungannya global (bukan per-IP) & per-hari (bukan
// per-menit), jadi proteksi utamanya justru di sini.
// Catatan: state in-memory ini reset kalau server cold-start/redeploy (khas
// serverless) — buat skala portofolio ini cukup, gak perlu infra tambahan
// (Redis/DB) cuma buat proteksi kasar begini.
const ANTIGRAVITY_DAILY_CAP = 30; // sisa ~70 dari total 100 RPD jadi headroom testing/dev & lonjakan tak terduga
let antigravityDayKey = '';
let antigravityDayCount = 0;

function getAntigravityDailyStatus(): { allowed: boolean; remaining: number } {
    const todayKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
    if (todayKey !== antigravityDayKey) {
        antigravityDayKey = todayKey;
        antigravityDayCount = 0;
    }
    return { allowed: antigravityDayCount < ANTIGRAVITY_DAILY_CAP, remaining: Math.max(0, ANTIGRAVITY_DAILY_CAP - antigravityDayCount) };
}

/** Dipanggil HANYA setelah Antigravity beneran sukses dipanggil (bukan pas gagal/fallback). */
function consumeAntigravityDailyQuota(): void {
    antigravityDayCount += 1;
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
// PERUBAHAN PENTING (lihat catatan di LAYER 1 pada handler di bawah):
// Heuristic ini DULU langsung meng-auto-invoke Antigravity begitu polanya
// cocok — meski frontend sudah punya tombol opt-in eksplisit (agent_estimate/
// agent_research/agent_file_analysis), jalur heuristic ini tetap bisa boros
// kuota 100 RPD secara diam-diam kalau user kebetulan ngetik kata kunci yang
// cocok di kolom chat biasa, tanpa klik tombol apa pun.
// Sekarang heuristic ini HANYA dipakai untuk mendeteksi *niat* user (estimate/
// research/file_analysis) dan niat itu dikirim balik ke frontend sebagai
// `suggestedAgentAction` supaya tombol yang relevan bisa di-highlight/
// didahulukan — bukan buat langsung memanggil Antigravity. Antigravity HANYA
// jalan kalau agentMode dikirim eksplisit dari tombol (agentTriggeredByUser).
export type AgentIntentAction = 'estimate' | 'research' | 'file_analysis' | 'live_demo';

const AGENT_INTENT_PATTERNS: Array<{ action: AgentIntentAction; pattern: RegExp; personas: Array<'rajendra' | 'zannah'> }> = [
    // Pertanyaan feasibility ("bisa gak bikin fitur X?") → khusus Rajendra
    // (showcase), karena cuma di situ ada mode "Live Demo" Antigravity yang
    // bisa nulis & menjalankan contoh kode kecil buat buktiin feasibility
    // on-the-spot. Diletakkan di urutan awal supaya gak "ketutup" pola lain
    // yang kebetulan overlap kata kerjanya (mis. "bikin").
    { action: 'live_demo', pattern: /\b(bisa|mampu|feasible)\b.{0,15}(gak|ga|nggak|kah)?\b.{0,25}\b(bikin|buat|develop|implementasi|realisasi|dibikin|dibuat)\b/i, personas: ['rajendra'] },
    { action: 'live_demo', pattern: /\bprototype\b|\bproof\s*of\s*concept\b|\bpoc\b/i, personas: ['rajendra'] },
    // Riset kompetitor/tren/harga pasar → khusus Zannah, cocok sama tombol
    // "Riset Kompetitor/Pasar" yang cuma ada di ChatWidget-nya. Dulu ini gak
    // digating sama sekali, jadi backend sempat "nyaranin" ke Rajendra padahal
    // dia gak punya tombol buat itu — saran ke-generate percuma tanpa efek
    // apa pun di frontend. Sekarang eksplisit di-scope biar konsisten.
    { action: 'research', pattern: /\b(cari|riset|research)\b.{0,20}\b(terbaru|kompetitor|tren|data|harga\s*pasar)\b/i, personas: ['zannah'] },
    { action: 'research', pattern: /\bbandingkan\b|\bcompare\b/i, personas: ['zannah'] },
    // Minta file downloadable (RAB, invoice, laporan, dst) → khusus Zannah,
    // cocok sama tombol "Estimasi Biaya & Timeline". Sama seperti di atas,
    // sebelumnya gak digating dan kebuang percuma di Rajendra.
    { action: 'estimate', pattern: /\b(buatkan|generate|bikin|susun|export)\b.{0,25}\b(rab|anggaran|invoice|proposal|laporan|excel|spreadsheet|pdf|dokumen)\b/i, personas: ['zannah'] },
    { action: 'estimate', pattern: /\bhitung(kan)?\b.{0,20}\b(data|angka|statistik)\b/i, personas: ['zannah'] },
];

/**
 * Deteksi niat agent dari pesan user, TANPA memanggil Antigravity sama sekali.
 * Kalau ada file yang baru diupload di giliran ini, prioritaskan 'file_analysis'
 * (paling relevan — user kemungkinan besar mau file itu diolah; berlaku buat
 * kedua persona karena keduanya sama-sama punya use-case analisis file).
 * Untuk pola lainnya, tiap action di-scope ke persona yang beneran punya
 * tombol/UI buat itu (lihat `personas` di AGENT_INTENT_PATTERNS) — supaya
 * gak ada saran yang ke-generate tapi kebuang percuma di frontend.
 */
function detectAgentIntent(message: string, hasFilesThisTurn: boolean, persona: 'rajendra' | 'zannah'): AgentIntentAction | null {
    if (hasFilesThisTurn) return 'file_analysis';
    for (const { action, pattern, personas } of AGENT_INTENT_PATTERNS) {
        if (!personas.includes(persona)) continue;
        if (pattern.test(message)) return action;
    }
    return null;
}

/**
 * Deteksi niat agent yang JUSTRU dilayani bot LAIN, bukan persona yang lagi
 * dipakai user sekarang (mis. user nanya soal feasibility/live demo ke
 * Zannah, padahal itu keahlian Rajendra — atau minta riset kompetitor ke
 * Rajendra, padahal itu keahliannya Zannah). Dipanggil HANYA kalau
 * `detectAgentIntent` di atas gak nemu niat yang cocok buat persona
 * sekarang, supaya bot tetap bisa kasih tau user ke mana harus pergi buat
 * kebutuhan itu — bukan diam-diam jawab generik seolah gak ngerti maksud
 * user. `file_analysis` sengaja dilewati karena kedua bot sama-sama support.
 */
function detectCrossPersonaIntent(
    message: string,
    persona: 'rajendra' | 'zannah'
): { action: AgentIntentAction; ownerPersona: 'rajendra' | 'zannah' } | null {
    for (const { action, pattern, personas } of AGENT_INTENT_PATTERNS) {
        if (personas.includes(persona)) continue; // udah dilayani persona sendiri, bukan urusan cross-persona
        if (pattern.test(message)) return { action, ownerPersona: personas[0] };
    }
    return null;
}

/**
 * Verifikasi TAMBAHAN di atas regex AGENT_INTENT_PATTERNS, khusus untuk
 * 'estimate' & 'research' (file_analysis gak butuh ini — konteksnya udah
 * jelas begitu ada file beneran di depan mata). Regex cuma nangkep kata
 * kunci di SATU pesan terakhir, gak tau apakah PERCAKAPANNYA sendiri udah
 * cukup detail buat hasil yang berkualitas — makanya user bisa "disuruh-
 * suruh" minta RAB/riset padahal belum ada konteks jelas sama sekali.
 * Dipanggil HANYA setelah regex match (bukan di tiap pesan), pakai model
 * kecil/murah, buat menilai:
 *   - estimate: udah jelas jenis app/proyeknya DAN minimal beberapa fitur
 *     utama disebutkan (bukan cuma "mau bikin aplikasi" doang).
 *   - research: ada topik/kompetitor/pasar SPESIFIK yang disebut DAN ada
 *     indikasi user beneran serius (bukan basa-basi/nanya iseng).
 * Kalau panggilan verifikasi ini SENDIRI gagal (network/timeout/parse
 * error), fallback ke `true` (anggap regex match aja cukup) — readiness
 * check ini sifatnya PENGETAT tambahan di atas fitur yang sudah ada, bukan
 * satu-satunya jalur; gak boleh bikin fitur mendadak mati total gara-gara 1
 * API call verifikasi goyang.
 */
async function assessAgentReadiness(
    apiKey: string,
    contents: Array<{ role: string; parts: Array<{ text?: string; inlineData?: unknown }> }>,
    action: 'estimate' | 'research',
): Promise<boolean> {
    const criteria = action === 'estimate'
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
            console.warn(`[chat.ts][readiness] HTTP ${response.status}, fallback ke ready=true`);
            return true;
        }

        const data = await response.json();
        const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) return true;

        const match = text.match(/"ready"\s*:\s*(true|false)/i);
        if (!match) {
            console.warn('[chat.ts][readiness] Response gak sesuai format, fallback ke ready=true. Raw:', text.slice(0, 100));
            return true;
        }
        return match[1].toLowerCase() === 'true';
    } catch (error) {
        const isTimeout = error instanceof Error && error.name === 'AbortError';
        console.warn('[chat.ts][readiness] Error, fallback ke ready=true:', isTimeout ? 'timeout' : error);
        return true;
    }
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

// ── Dokumen RAB / Riset deterministik (bukan mengandalkan Antigravity) ─────
// Antigravity DIMINTA lewat prompt untuk "menyediakan file yang bisa
// diunduh", tapi itu gak dijamin — tergantung apakah dia beneran manggil
// tool file-generation internalnya di response itu. Supaya user SELALU dapet
// dokumen nyata yang bisa didownload tiap kali RAB/riset berhasil dibuatkan
// (bukan cuma teks di chat yang MENGAKU ada file), backend generate sendiri
// dokumen HTML yang rapi & bisa langsung dibuka/di-print-to-PDF, terlepas
// dari apakah Antigravity sendiri melampirkan file atau tidak.
//
// Alurnya 2 langkah: (1) ekstrak balasan teks Antigravity/Gemini jadi data
// terstruktur (JSON) lewat 1 API call kecil — supaya dokumennya rapi & per
// fitur/temuan, bukan cuma nge-dump paragraf mentah; (2) render JSON itu jadi
// HTML dengan styling sendiri. Kalau langkah (1) gagal/parse error, fallback
// ke wrap teks mentahnya apa adanya dalam HTML sederhana — user tetap dapet
// SESUATU yang bisa diunduh, meski gak serapi versi terstruktur.
//
// CATATAN: ini masih format .html (bukan .pdf/.xlsx asli) — zero dependency
// tambahan, konsisten sama generateSummaryAttachment yang udah ada. User bisa
// buka langsung di browser lalu "Print > Save as PDF" kalau butuh format PDF
// asli. Upgrade ke PDF/XLSX native butuh library tambahan (mis. pdfkit/
// exceljs) — bisa ditambahkan kalau memang dibutuhkan.

interface RabFeature {
    name: string;
    description: string;
    estimatedCost: number;
    estimatedDuration: string;
}
interface RabDocumentData {
    projectName: string;
    features: RabFeature[];
    totalCost: number;
    totalDuration: string;
    notes?: string;
}
interface ResearchFinding {
    title: string;
    insight: string;
}
interface ResearchDocumentData {
    topic: string;
    findings: ResearchFinding[];
    recommendations: string[];
}

/** Panggil model kecil buat ekstrak teks bebas (balasan RAB/riset) jadi JSON
 * terstruktur. Return null kalau gagal di titik mana pun — caller WAJIB
 * punya fallback, jangan asumsikan ini selalu berhasil. */
async function extractStructuredDocument<T>(
    apiKey: string,
    extractionPrompt: string,
): Promise<T | null> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: extractionPrompt }] }],
                generationConfig: { temperature: 0, maxOutputTokens: 2048 },
            }),
        });

        clearTimeout(timeoutId);
        if (!response.ok) return null;

        const data = await response.json();
        const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) return null;

        // Model kadang tetap bungkus JSON dengan ```json ... ``` walau udah
        // diminta polos — bersihin dulu sebelum parse.
        const cleaned = text.replace(/```json\s*|```/g, '').trim();
        return JSON.parse(cleaned) as T;
    } catch (error) {
        console.warn('[chat.ts][extractStructuredDocument] Gagal:', error instanceof Error ? error.message : error);
        return null;
    }
}

function escapeHtml(str: string): string {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function formatRupiah(n: number): string {
    if (typeof n !== 'number' || Number.isNaN(n)) return '-';
    return `Rp${n.toLocaleString('id-ID')}`;
}

const DOCUMENT_HTML_STYLE = `
  body { font-family: -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; color: #1e293b; max-width: 800px; margin: 0 auto; padding: 32px 24px; line-height: 1.55; }
  h1 { font-size: 22px; color: #0f766e; margin-bottom: 4px; }
  .subtitle { color: #64748b; font-size: 13px; margin-bottom: 24px; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0 24px; font-size: 14px; }
  th, td { border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; vertical-align: top; }
  th { background: #f0fdfa; color: #0f766e; font-weight: 600; }
  tfoot td { font-weight: 700; background: #f8fafc; }
  .section-title { font-size: 15px; font-weight: 700; color: #0f172a; margin: 24px 0 8px; border-bottom: 2px solid #0f766e; padding-bottom: 4px; }
  ul { margin: 8px 0; padding-left: 20px; }
  .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }
  .footer a { color: #0f766e; }
  .notes { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 14px; font-size: 13px; margin-top: 12px; }
`;

function documentFooterHtml(): string {
    return `
  <div class="footer">
    <strong>K. Arzhaning Jagad (Arzha)</strong> — Indie Developer &amp; Data Specialist, 7+ tahun pengalaman<br/>
    WhatsApp: 0823-1231-2734 &middot; Email: Jarzha@gmail.com &middot; Cibitung, Bekasi<br/>
    <a href="https://wa.me/6282312312734?text=Halo%20Mas%20Arzha,%20saya%20mau%20diskusi%20soal%20dokumen%20ini.">Lanjut diskusi via WhatsApp →</a>
  </div>`;
}

function renderRabHtml(doc: RabDocumentData): string {
    const rows = doc.features.map((f) => `
      <tr>
        <td>${escapeHtml(f.name)}</td>
        <td>${escapeHtml(f.description)}</td>
        <td>${formatRupiah(f.estimatedCost)}</td>
        <td>${escapeHtml(f.estimatedDuration)}</td>
      </tr>`).join('');

    return `<!DOCTYPE html>
<html lang="id"><head><meta charset="UTF-8"><title>RAB - ${escapeHtml(doc.projectName)}</title>
<style>${DOCUMENT_HTML_STYLE}</style></head>
<body>
  <h1>📊 Rencana Anggaran Biaya (RAB)</h1>
  <div class="subtitle">Proyek: ${escapeHtml(doc.projectName)} &middot; Dibuat: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>

  <div class="section-title">Breakdown Biaya per Fitur</div>
  <table>
    <thead><tr><th>Fitur</th><th>Deskripsi</th><th>Estimasi Biaya</th><th>Estimasi Waktu</th></tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr><td colspan="2">TOTAL</td><td>${formatRupiah(doc.totalCost)}</td><td>${escapeHtml(doc.totalDuration)}</td></tr></tfoot>
  </table>

  ${doc.notes ? `<div class="notes"><strong>Catatan/Asumsi:</strong> ${escapeHtml(doc.notes)}</div>` : ''}
  ${documentFooterHtml()}
</body></html>`;
}

function renderResearchHtml(doc: ResearchDocumentData): string {
    const findings = doc.findings.map((f) => `
      <tr><td>${escapeHtml(f.title)}</td><td>${escapeHtml(f.insight)}</td></tr>`).join('');
    const recs = doc.recommendations.map((r) => `<li>${escapeHtml(r)}</li>`).join('');

    return `<!DOCTYPE html>
<html lang="id"><head><meta charset="UTF-8"><title>Riset - ${escapeHtml(doc.topic)}</title>
<style>${DOCUMENT_HTML_STYLE}</style></head>
<body>
  <h1>🔎 Riset Kompetitor / Pasar</h1>
  <div class="subtitle">Topik: ${escapeHtml(doc.topic)} &middot; Dibuat: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>

  <div class="section-title">Temuan Utama</div>
  <table>
    <thead><tr><th>Poin</th><th>Insight</th></tr></thead>
    <tbody>${findings}</tbody>
  </table>

  <div class="section-title">Rekomendasi</div>
  <ul>${recs}</ul>

  ${documentFooterHtml()}
</body></html>`;
}

/** Wrap teks mentah (fallback kalau ekstraksi terstruktur gagal) jadi HTML
 * sederhana — tetap ada dokumen yang bisa diunduh, meski gak serapi versi
 * terstruktur (paragraf apa adanya, bukan tabel per fitur). */
function renderPlainFallbackHtml(title: string, rawText: string): string {
    const paragraphs = rawText
        .split(/\n{2,}/)
        .map((p) => `<p>${escapeHtml(p.trim()).replace(/\n/g, '<br/>')}</p>`)
        .join('');
    return `<!DOCTYPE html>
<html lang="id"><head><meta charset="UTF-8"><title>${escapeHtml(title)}</title>
<style>${DOCUMENT_HTML_STYLE}</style></head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <div class="subtitle">Dibuat: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
  ${paragraphs}
  ${documentFooterHtml()}
</body></html>`;
}

/**
 * Orkestrasi penuh: ekstrak balasan teks agent jadi data terstruktur, render
 * jadi HTML, fallback ke wrap teks mentah kalau ekstraksinya gagal. Selalu
 * balikin sebuah Attachment yang valid (gak pernah null) — dokumen dijamin
 * ADA meski kualitasnya fallback ke versi sederhana.
 */
async function buildAgentDocumentAttachment(
    apiKey: string,
    replyText: string,
    action: 'estimate' | 'research',
): Promise<Attachment> {
    const dateSlug = new Date().toISOString().slice(0, 10);

    if (action === 'estimate') {
        const prompt = `Ekstrak teks RAB (Rencana Anggaran Biaya) di bawah ini menjadi JSON terstruktur. Balas HANYA dengan JSON valid, tanpa markdown/backtick/penjelasan tambahan, PERSIS format ini:
{"projectName": "<jenis/nama proyek singkat>", "features": [{"name": "<nama fitur>", "description": "<deskripsi singkat>", "estimatedCost": <angka rupiah tanpa simbol/titik>, "estimatedDuration": "<mis. '3-5 hari'>"}], "totalCost": <angka total rupiah>, "totalDuration": "<mis. '2-3 minggu'>", "notes": "<catatan/asumsi kalau ada, boleh string kosong>"}

Kalau teks di bawah gak menyebutkan breakdown per fitur secara eksplisit, buat estimasi wajar berdasarkan konteks yang ada & sebutkan itu di "notes".

--- TEKS RAB ---
${replyText.slice(0, 6000)}
--- SELESAI ---`;

        const doc = await extractStructuredDocument<RabDocumentData>(apiKey, prompt);
        if (doc && Array.isArray(doc.features) && doc.features.length > 0) {
            return {
                name: `RAB-Estimasi-${dateSlug}.html`,
                mimeType: 'text/html;charset=utf-8',
                base64: Buffer.from(renderRabHtml(doc), 'utf-8').toString('base64'),
            };
        }
        console.warn('[chat.ts][buildAgentDocumentAttachment] Ekstraksi RAB gagal/kosong, fallback ke plain HTML.');
        return {
            name: `RAB-Estimasi-${dateSlug}.html`,
            mimeType: 'text/html;charset=utf-8',
            base64: Buffer.from(renderPlainFallbackHtml('📊 Rencana Anggaran Biaya (RAB)', replyText), 'utf-8').toString('base64'),
        };
    }

    // action === 'research'
    const prompt = `Ekstrak teks hasil riset kompetitor/pasar di bawah ini menjadi JSON terstruktur. Balas HANYA dengan JSON valid, tanpa markdown/backtick/penjelasan tambahan, PERSIS format ini:
{"topic": "<topik riset singkat>", "findings": [{"title": "<judul temuan singkat>", "insight": "<penjelasan 1-2 kalimat>"}], "recommendations": ["<rekomendasi actionable>"]}

--- TEKS RISET ---
${replyText.slice(0, 6000)}
--- SELESAI ---`;

    const doc = await extractStructuredDocument<ResearchDocumentData>(apiKey, prompt);
    if (doc && Array.isArray(doc.findings) && doc.findings.length > 0) {
        return {
            name: `Riset-Kompetitor-Pasar-${dateSlug}.html`,
            mimeType: 'text/html;charset=utf-8',
            base64: Buffer.from(renderResearchHtml(doc), 'utf-8').toString('base64'),
        };
    }
    console.warn('[chat.ts][buildAgentDocumentAttachment] Ekstraksi riset gagal/kosong, fallback ke plain HTML.');
    return {
        name: `Riset-Kompetitor-Pasar-${dateSlug}.html`,
        mimeType: 'text/html;charset=utf-8',
        base64: Buffer.from(renderPlainFallbackHtml('🔎 Riset Kompetitor / Pasar', replyText), 'utf-8').toString('base64'),
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

/**
 * Panggil model Gemma (LAYER 3.5, asuransi terakhir) lewat endpoint
 * generateContent yang sama kayak Gemini. BEDA PENTING: setidaknya sampai
 * dokumentasi terakhir yang saya tahu, Gemma via Gemini API generateContent
 * gak selalu punya dukungan field `systemInstruction` terpisah sekuat/sestabil
 * Gemini — jadi instruksi persona di sini SENGAJA digabung sebagai giliran
 * user+model sintetis di awal riwayat percakapan (pola umum buat model yang
 * dukungan system-prompt-nya kurang eksplisit), bukan dikirim via
 * `systemInstruction`. VERIFIKASI LAGI pas nyoba live — kalau ternyata Gemma
 * 4 di akun kamu sudah full support `systemInstruction` kayak Gemini, boleh
 * disederhanakan jadi manggil `callGeminiModel` biasa dengan model name ini.
 */
async function callGemmaModel(
    apiKey: string,
    modelName: string,
    contents: Array<{ role: string; parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> }>,
    ip: string,
    systemInstruction: string,
): Promise<{ reply: string; model: string; remainingQuota: number; apiSource: 'aistudio' } | null> {
    const rateLimitStatus = checkRateLimit(ip, `gemma:${modelName}`);
    if (!rateLimitStatus.allowed) {
        console.log(`[chat.ts] [gemma] Model ${modelName} rate limited locally, skipping...`);
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
                console.log(`[chat.ts] [gemma] Model ${modelName} hit Google rate limit, trying next...`);
                return null;
            }
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!reply) throw new Error('Empty response from Gemma');

        console.log(`[chat.ts] ✅ [gemma] Model ${modelName} responded successfully`);
        return {
            reply: reply.trim(),
            model: modelName,
            remainingQuota: rateLimitStatus.remaining,
            apiSource: 'aistudio',
        };
    } catch (error: unknown) {
        const isTimeout = error instanceof Error && error.name === 'AbortError';
        console.error(`[chat.ts] [gemma] Error with model ${modelName}:`, isTimeout ? 'timeout' : error);
        return null;
    }
}


// Radit (fallback non-AI di ChatWidget.tsx) sebelumnya cuma cocokin pesan
// user ke FAQ_ITEMS pakai Fuse.js (keyword/fuzzy) di sisi frontend — bisa
// meleset kalau user nanya dengan kalimat yang maknanya sama tapi kata-kata
// beda dari `keywords` yang didaftarin manual. Sekarang ditambahin lapisan
// semantic search opsional lewat model ini: SEBELUM jatuh ke Fuse.js,
// frontend nyoba minta backend cariin FAQ yang paling mirip MAKNANYA lewat
// endpoint ini. Kalau gagal/gak yakin, frontend tetap fallback ke Fuse.js
// seperti biasa — jadi Radit gak pernah lebih "bodoh" dari sebelumnya, cuma
// berpotensi lebih pintar.
//
// PENTING: pakai model & quota terpisah dari chat generateContent (lihat
// GEMINI_MODELS di atas) — jadi endpoint ini TETAP bisa jalan meskipun
// kuota harian ke-7 model chat + GCP fallback abis semua (itu kondisi yang
// biasanya justru bikin Radit aktif). Verifikasi lagi ID model persis & nama
// field request/response di AI Studio/dokumentasi resmi sebelum deploy —
// signature di bawah disusun berdasarkan pola REST API embedding Gemini yang
// terdokumentasi, tapi belum sempat dites live dari sandbox ini (jaringannya
// gak bisa akses generativelanguage.googleapis.com).
const EMBEDDING_MODEL = 'gemini-embedding-001'; // cek lagi id persisnya di kartu model AI Studio kalau ternyata beda
const EMBEDDING_OUTPUT_DIM = 768; // MRL: fleksibel 128–3072, 768 udah cukup buat ~30 item FAQ & lebih hemat/cepat
const EMBEDDING_MATCH_THRESHOLD = 0.72; // ambang cosine similarity — mulai dari sini, tuning manual setelah lihat hasil nyata

// Cap harian kasar KHUSUS fitur ini (independen dari ANTIGRAVITY_DAILY_CAP di
// atas) — kuota Gemini Embedding di free tier keliatan tipis (~1K RPD dari
// dashboard), jadi dijaga biar gak abis diam-diam kalau lagi rame pas Radit
// aktif (justru saat trafik ke fitur ini paling tinggi).
const EMBEDDING_DAILY_CAP = 700;
let embeddingDayKey = '';
let embeddingDayCount = 0;

function getEmbeddingDailyStatus(): { allowed: boolean; remaining: number } {
    const todayKey = new Date().toISOString().slice(0, 10);
    if (todayKey !== embeddingDayKey) {
        embeddingDayKey = todayKey;
        embeddingDayCount = 0;
    }
    return { allowed: embeddingDayCount < EMBEDDING_DAILY_CAP, remaining: Math.max(0, EMBEDDING_DAILY_CAP - embeddingDayCount) };
}

function consumeEmbeddingDailyQuota(n = 1): void {
    embeddingDayCount += n;
}

function cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
}

/**
 * Embed beberapa teks sekaligus dalam SATU API call (batchEmbedContents) —
 * jauh lebih hemat kuota daripada embed satu-satu, terutama buat embed
 * seluruh FAQ_ITEMS sekali di awal.
 * `taskType` penting buat kualitas asymmetric retrieval: dokumen (jawaban
 * FAQ) pakai 'RETRIEVAL_DOCUMENT', pertanyaan user pakai 'RETRIEVAL_QUERY'.
 */
async function embedTexts(
    apiKey: string,
    texts: string[],
    taskType: 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY',
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
            console.warn(`[chat.ts][embedding] HTTP ${response.status} saat embed ${texts.length} teks`);
            return null;
        }

        const data = await response.json();
        const vectors: number[][] | undefined = data?.embeddings?.map((e: { values: number[] }) => e.values);

        if (!Array.isArray(vectors) || vectors.length !== texts.length) {
            console.warn('[chat.ts][embedding] Response gak sesuai ekspektasi (jumlah vector != jumlah teks)');
            return null;
        }

        return vectors;
    } catch (error) {
        const isTimeout = error instanceof Error && error.name === 'AbortError';
        console.warn('[chat.ts][embedding] Error:', isTimeout ? 'timeout' : error);
        return null;
    }
}

// Cache in-memory (per cold start serverless instance) buat embedding
// FAQ_ITEMS — cukup di-embed SEKALI per cold start (1 API call, batched),
// bukan di-embed ulang tiap ada pertanyaan user masuk.
let faqEmbeddingCache: Array<{ id: string; vector: number[] }> | null = null;

async function getFaqEmbeddings(apiKey: string): Promise<Array<{ id: string; vector: number[] }> | null> {
    if (faqEmbeddingCache) return faqEmbeddingCache;

    // Gabungin label + keywords + jawaban biar representasi vektornya kaya
    // konteks, gak cuma mengandalkan quickLabel yang pendek.
    const texts = FAQ_ITEMS.map((f) => `${f.quickLabel}\n${f.keywords.join(', ')}\n${f.answer}`);
    const vectors = await embedTexts(apiKey, texts, 'RETRIEVAL_DOCUMENT');
    if (!vectors) return null;

    faqEmbeddingCache = FAQ_ITEMS.map((f, i) => ({ id: f.id, vector: vectors[i] }));
    return faqEmbeddingCache;
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

    const { history, message, model: requestedModel, persona = 'zannah', agentMode, agentAction, files: rawFiles, analyticsEvent, faqSemanticSearch } = req.body as {
        history?: Array<{ role: string; parts: { text: string }[] }>;
        message?: string;
        model?: string;
        persona?: BotPersona;
        agentMode?: boolean;
        /** Aksi spesifik yang lagi dieksekusi kalau agentMode true — dikirim
         * eksplisit oleh frontend (bukan ditebak dari teks prompt), dipakai
         * buat mutusin perlu-gaknya generate dokumen RAB/riset deterministik
         * (lihat enrichWithAgentDocument di bawah). */
        agentAction?: AgentIntentAction;
        files?: unknown;
        analyticsEvent?: { type: string; action?: string; persona?: string };
        faqSemanticSearch?: { query: string };
    };

    // ── FAQ semantic search (Radit) ──────────────────────────────────────────
    // Dipanggil frontend SEBELUM jatuh ke Fuse.js keyword-match, buat nyari FAQ
    // yang paling mirip MAKNANYA lewat Gemini Embedding — independen dari kuota
    // chat generateContent (lihat GEMINI_MODELS), jadi tetap bisa jalan
    // meskipun semua model chat + GCP fallback lagi abis kuota (kondisi yang
    // justru biasanya bikin Radit aktif). Gagal di titik mana pun di sini =
    // balikin matchedFaqId: null, biar frontend tau harus fallback ke Fuse.js
    // sendiri — endpoint ini SENGAJA didesain gak pernah melempar error keras.
    if (faqSemanticSearch && typeof faqSemanticSearch.query === 'string') {
        const ipForFaq = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 'unknown';
        const key = aiStudioKey; // pakai key AI Studio yang sama dengan cascade chat di atas

        const bail = (reason: string) => {
            console.log(`[chat.ts][faq-embedding] skip: ${reason}`);
            return res.status(200).json({ matchedFaqId: null });
        };

        if (!key) return bail('no API key');

        const rl = checkRateLimit(ipForFaq, 'faq-embedding');
        if (!rl.allowed) return bail('rate limited (per-IP)');

        const dailyStatus = getEmbeddingDailyStatus();
        if (!dailyStatus.allowed) return bail('daily embedding cap reached');

        const faqVectors = await getFaqEmbeddings(key);
        if (!faqVectors) return bail('failed embedding FAQ_ITEMS');

        const queryText = faqSemanticSearch.query.slice(0, 300);
        const queryVectors = await embedTexts(key, [queryText], 'RETRIEVAL_QUERY');
        if (!queryVectors || !queryVectors[0]) return bail('failed embedding user query');

        // Baru dihitung SETELAH kedua embed call sukses — biar cap harian cuma
        // kepotong buat request yang beneran kepakai (query doang, 1 unit;
        // embed FAQ_ITEMS di-cache jadi cuma kena sekali per cold start).
        consumeEmbeddingDailyQuota();

        let best: { id: string | null; score: number } = { id: null, score: -1 };
        for (const item of faqVectors) {
            const score = cosineSimilarity(queryVectors[0], item.vector);
            if (score > best.score) best = { id: item.id, score };
        }

        if (best.score >= EMBEDDING_MATCH_THRESHOLD) {
            return res.status(200).json({ matchedFaqId: best.id, score: best.score });
        }
        return res.status(200).json({ matchedFaqId: null, score: best.score });
    }

    // ── Analytics beacon (opt-in CTA tracking) ───────────────────────────────
    // Fire-and-forget dari frontend tiap kali tombol agent (estimate/research/
    // file_analysis/live_demo) MUNCUL sebagai saran atau DIKLIK — numpang di
    // endpoint yang sama biar gak perlu bikin route/infra analytics terpisah.
    // Cukup nge-log ke server logs (Vercel/hosting) buat divalidasi manual;
    // TIDAK memanggil LLM sama sekali, TIDAK kena rate limiter model, dan
    // TIDAK ikut mengurangi kuota Antigravity harian.
    if (analyticsEvent && typeof analyticsEvent.type === 'string') {
        const ipForLog = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 'unknown';
        console.log(
            `[chat.ts][analytics] ${analyticsEvent.type} action=${analyticsEvent.action ?? '-'} persona=${analyticsEvent.persona ?? '-'} ip=${ipForLog}`
        );
        return res.status(200).json({ ok: true });
    }

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
    // LAYER 1: Antigravity Agent — HANYA dipicu oleh opt-in eksplisit (tombol
    // aksi agent di frontend → agentMode: true di body request). Kania
    // (CV/HRD) sengaja TIDAK diikutkan: konteksnya wawancara/HR yang butuh
    // respons cepat, dan gak ada use-case realistis buat generate file di
    // situ — jadi biar tetap ringan & gak makan kuota 100 RPD dari persona
    // yang gak butuh-butuh amat.
    //
    // CATATAN: heuristic (AGENT_INTENT_PATTERNS) SENGAJA tidak lagi dipakai
    // untuk auto-invoke di sini — itu dulu bikin Antigravity bisa kepanggil
    // diam-diam cuma karena user ngetik kata kunci tertentu di kolom chat
    // biasa, boros kuota buat percakapan yang belum tentu butuh file/riset.
    // Heuristic-nya sekarang cuma dipakai di LAYER 2/3 buat kasih *saran*
    // (suggestedAgentAction) supaya tombol yang relevan di-highlight — bukan
    // buat mengeksekusi Antigravity sendiri. User tetap yang mutusin lewat
    // klik tombol, konsisten sama pola opt-in yang udah diterapkan di UI.
    // ═══════════════════════════════════════════════════════════════════════
    const agentTriggeredByUser = agentMode === true;
    const agentEligiblePersona = activePersona === 'rajendra' || activePersona === 'zannah';
    const wantsAgent = agentEligiblePersona && agentTriggeredByUser;
    const isAntigravityTarget = wantsAgent && (!requestedModel || requestedModel === ANTIGRAVITY_MODEL);

    /**
     * Tempel dokumen RAB/riset deterministik (lihat buildAgentDocumentAttachment)
     * ke response — dipasang di SEMUA layer (Antigravity, Gemini cascade, GCP
     * fallback, Gemma) supaya user tetap dapet file yang bisa diunduh terlepas
     * dari layer mana yang akhirnya berhasil jawab permintaan RAB/riset-nya.
     * No-op cepat (return apa adanya) kalau bukan agentAction 'estimate'/
     * 'research', atau kalau Antigravity SENDIRI udah nyediain attachment
     * (jangan duplikat/tumpuk-tindih punya dia).
     */
    const enrichWithAgentDocument = async (resData: any) => {
        if (!resData || !agentTriggeredByUser) return resData;
        if (agentAction !== 'estimate' && agentAction !== 'research') return resData;
        if (!aiStudioKey) return resData;
        if (resData.attachments && resData.attachments.length > 0) return resData;

        const doc = await buildAgentDocumentAttachment(aiStudioKey, resData.reply || '', agentAction);
        return { ...resData, attachments: [doc] };
    };

    // Niat user (kalau ada) buat disarankan lewat tombol yang relevan di
    // frontend — dihitung sekali di sini, dipakai di LAYER 2 & 3 di bawah.
    // Kalau agent sudah eksplisit dipicu user (agentTriggeredByUser), gak
    // perlu saran lagi karena dia lagi otomatis diarahkan ke Antigravity.
    // Ini masih HASIL REGEX MENTAH (belum lolos readiness check) — dipakai
    // buat nentuin crossPersonaIntent di bawah, SEBELUM di-downgrade lewat
    // assessAgentReadiness (lihat blok setelah crossPersonaIntent).
    const rawDetectedIntent: AgentIntentAction | null =
        agentEligiblePersona && !agentTriggeredByUser
            ? detectAgentIntent(sanitizedMessage, sanitizedFiles.length > 0, activePersona as 'rajendra' | 'zannah')
            : null;

    // Kalau persona sekarang gak punya niat sendiri yang cocok (di atas),
    // cek apakah pesannya justru cocok sama kebutuhan yang cuma dilayani bot
    // LAIN (mis. user nanya feasibility/live-demo ke Zannah, padahal itu
    // keahlian Rajendra — atau sebaliknya minta riset/estimasi ke Rajendra).
    // File_analysis dilewati otomatis oleh detectCrossPersonaIntent karena
    // kedua bot sama-sama support, jadi gak ada "bot lain" yang perlu
    // direkomendasikan untuk itu.
    const crossPersonaIntent =
        agentEligiblePersona && !agentTriggeredByUser && !rawDetectedIntent && sanitizedFiles.length === 0
            ? detectCrossPersonaIntent(sanitizedMessage, activePersona as 'rajendra' | 'zannah')
            : null;

    if (crossPersonaIntent) {
        // Sisipkan catatan ephemeral ke giliran user terakhir (pola yang sama
        // dipakai buat catatan "kuota Antigravity abis" di bawah) supaya
        // modelnya tahu harus arahkan user ke bot yang lebih pas, TANPA
        // mengklaim bisa langsung eksekusi kebutuhan itu sendiri.
        const otherPersona = crossPersonaIntent.ownerPersona;
        const otherBotHint =
            otherPersona === 'rajendra'
                ? 'chatbot "Rajendra" di halaman AI Chatbot Showcase (punya mode Live Demo Antigravity Agent yang bisa nulis & menjalankan contoh kode kecil buat buktiin feasibility ide secara langsung)'
                : 'chatbot "Zannah" (ikon chat di pojok kanan bawah situs), yang bisa bantu riset kompetitor/tren pasar atau bikinin file estimasi biaya (RAB/invoice/proposal) yang siap diunduh';
        const lastTurn = contents[contents.length - 1] as { role: string; parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> };
        if (lastTurn?.role === 'user') {
            lastTurn.parts.push({
                text: `(Catatan sistem — jangan ditampilkan literal ke user: pesan di atas cocok dengan kebutuhan "${crossPersonaIntent.action}" yang sebenarnya paling pas dibantu oleh ${otherBotHint}, bukan oleh kamu. Tetap jawab pertanyaan user secara wajar sesuai kemampuanmu sendiri dulu, lalu di akhir jawaban, secara natural & singkat—bukan seperti disclaimer kaku—infokan bahwa untuk kebutuhan itu secara langsung, mereka bisa coba ${otherBotHint}.)`,
            });
        }
    }

    // Readiness gate TAMBAHAN khusus 'estimate'/'research' — regex di atas
    // cuma nangkep kata kunci di satu pesan, belum tentu percakapannya udah
    // cukup detail (lihat dokumentasi assessAgentReadiness). Kalau ternyata
    // BELUM cukup, downgrade jadi null — supaya tombolnya gak ditawarkan ke
    // frontend dulu, dan Zannah (lewat instruksi baru di system prompt) yang
    // bakal gali kebutuhannya lewat percakapan biasa alih-alih user disuruh
    // klik tombol yang hasilnya bakal generik/gak detail.
    let detectedAgentIntent: AgentIntentAction | null = rawDetectedIntent;
    if ((rawDetectedIntent === 'estimate' || rawDetectedIntent === 'research') && aiStudioKey) {
        const ready = await assessAgentReadiness(aiStudioKey, contents, rawDetectedIntent);
        if (!ready) {
            console.log(`[chat.ts][readiness] '${rawDetectedIntent}' terdeteksi regex tapi belum ready, tombol ditahan dulu.`);
            detectedAgentIntent = null;
        }
    }

    // Status cap harian global — dihitung di awal (belum dikonsumsi) supaya
    // bisa ditempel ke SEMUA jenis respons (termasuk yang gak pakai agent sama
    // sekali), biar frontend bisa nyembunyiin/nonaktifin tombol agent-nya
    // LEBIH AWAL kalau kuota hari ini udah abis, bukan nunggu user klik dulu
    // baru dikasih tau gagal.
    const antigravityDailyStatusBeforeCall = agentEligiblePersona ? getAntigravityDailyStatus() : { allowed: true, remaining: ANTIGRAVITY_DAILY_CAP };

    const attachAgentMeta = (resData: any) => {
        if (!resData || !agentEligiblePersona) return resData;
        return {
            ...resData,
            ...(detectedAgentIntent ? { suggestedAgentAction: detectedAgentIntent } : {}),
            antigravityDailyRemaining: antigravityDailyStatusBeforeCall.remaining,
        };
    };

    if (aiStudioKey && isAntigravityTarget) {
        if (!antigravityDailyStatusBeforeCall.allowed) {
            // Kuota harian abis — JANGAN panggil Antigravity sama sekali, tapi
            // tetap jawab lewat cascade Gemini biasa di bawah (LAYER 2/3) biar
            // user tetap dapet jawaban. Supaya model gak diam-diam ngabaikan
            // maksud "buktikan sekarang"-nya user, sisipkan catatan ephemeral
            // ke giliran terakhir supaya dia jujur & tetap membantu.
            console.log('[chat.ts] Antigravity daily cap reached — falling back to Gemini biasa dengan catatan konteks.');
            const lastTurn = contents[contents.length - 1] as { role: string; parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> };
            if (lastTurn?.role === 'user') {
                lastTurn.parts.push({
                    text: '(Catatan sistem — jangan ditampilkan literal ke user: kuota Live Demo/Antigravity Agent hari ini sudah habis. Jawab pertanyaan di atas seperti biasa secara konseptual, dan kalau relevan, sebutkan dengan jujur & santai bahwa demo langsungnya belum bisa dijalankan sekarang karena kuota harian penuh — tawarkan lanjut diskusi teknis detail bareng Mas Arzha.)',
                });
            }
        } else {
            console.log(`[chat.ts] Agent mode triggered (manual) — trying Antigravity as ${botName}...`);
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
                consumeAntigravityDailyQuota();
                return res.status(200).json(await enrichWithAgentDocument(enrichWithSummaryAttachment({
                    ...antigravityResult,
                    apiSource: 'aistudio',
                    usedAgent: true,
                    agentTriggerReason: 'manual',
                    antigravityDailyRemaining: getAntigravityDailyStatus().remaining,
                })));
            }

            console.log('[chat.ts] Antigravity unavailable, falling back to Gemini models...');
        }
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
                return res.status(200).json(await enrichWithAgentDocument(enrichWithSummaryAttachment(attachAgentMeta(result))));
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
                return res.status(200).json(await enrichWithAgentDocument(enrichWithSummaryAttachment(attachAgentMeta(result))));
            }
        }

        console.error('[chat.ts] All GCP fallback models also failed.');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // LAYER 3.5: Gemma fallback — asuransi terakhir sebelum nyerah total.
    // Kuota jauh lebih longgar (~14.4K RPD/model vs cuma ratusan buat Gemini
    // Flash), tapi kualitas ikut-instruksi & konsistensi persona belum
    // terbukti setara Gemini Flash — makanya ditaruh di URUTAN PALING AKHIR,
    // cuma dipakai kalau 6 model Gemini + GCP fallback semuanya udah
    // gagal/exhausted (kondisi yang jarang terjadi kalau sehari-hari).
    // ═══════════════════════════════════════════════════════════════════════
    if (aiStudioKey) {
        console.log('[chat.ts] 🔄 Semua Gemini gagal, coba Gemma sebagai asuransi terakhir...');

        for (const modelConfig of GEMMA_FALLBACK_MODELS) {
            const result = await callGemmaModel(aiStudioKey, modelConfig.name, contents, ip, systemInstruction);
            if (result) {
                return res.status(200).json(await enrichWithAgentDocument(enrichWithSummaryAttachment(attachAgentMeta(result))));
            }
        }

        console.error('[chat.ts] Gemma fallback juga gagal semua.');
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