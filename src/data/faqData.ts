// ─── Data FAQ Fallback (dipakai Radit di ChatWidget.tsx & semantic search di
// api/chat.ts) — dipindah ke sini dari ChatWidget.tsx biar SATU sumber data
// yang dipakai bareng frontend & backend, jadi gak ada risiko drift antara
// FAQ yang ditampilkan ke user vs yang di-embed buat semantic search.
// ─────────────────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  label: string;
}

export interface FAQItem {
  id: string;
  categoryId: string;
  quickLabel: string;
  keywords: string[];
  answer: string;
}

export const CATEGORIES: Category[] = [
  { id: 'harga', label: '💰 Harga & Paket' },
  { id: 'proses', label: '⏱️ Alur & Garansi' },
  { id: 'tech', label: '🛠️ Skill & Teknis' },
  { id: 'portfolio', label: '📂 Bukti Proyek' },
  { id: 'kontak', label: '📞 Kontak & Konsultasi' },
];

export const FAQ_ITEMS: FAQItem[] = [
  // ── 💰 Harga & Paket ──
  {
    id: 'harga-landing',
    categoryId: 'harga',
    quickLabel: 'Harga landing page / profil?',
    keywords: ['harga landing page', 'biaya landing page', 'landing page berapa', 'halaman tunggal', 'company profile 1 halaman', 'web profil'],
    answer: 'Landing page (1 halaman responsif) mulai dari Rp800rb. Cocok buat UMKM, event, atau portofolio bisnis. Desain custom, cepat, dan mobile-friendly! 🎯',
  },
  {
    id: 'harga-webapp',
    categoryId: 'harga',
    quickLabel: 'Harga web app / dashboard?',
    keywords: ['harga web app', 'biaya dashboard', 'harga sistem internal', 'harga aplikasi web', 'web app berapa', 'sistem kasir', 'crm'],
    answer: 'Web app custom (dashboard admin, sistem manajemen inventaris, portal internal) mulai dari Rp6 juta, tergantung kompleksitas fitur dan database yang dibutuhkan.',
  },
  {
    id: 'harga-mobile',
    categoryId: 'harga',
    quickLabel: 'Harga aplikasi mobile?',
    keywords: ['harga aplikasi mobile', 'biaya bikin app', 'harga app android', 'harga aplikasi ios', 'mobile app berapa', 'bikin aplikasi hp'],
    answer: 'Aplikasi mobile custom (Android & iOS) mulai dari Rp6 juta. Dibangun pakai React Native / Expo sehingga performa kencang dan bisa langsung dua platform sekaligus.',
  },
  {
    id: 'harga-game',
    categoryId: 'harga',
    quickLabel: 'Harga pembuatan game?',
    keywords: ['harga game', 'biaya bikin game', 'harga platform multiplayer', 'game berapa', 'harga board game'],
    answer: 'Game / platform multiplayer realtime online mulai dari Rp12 juta. Backend menggunakan boardgame.io + WebSockets untuk sinkronisasi antar pemain tanpa lag.',
  },
  {
    id: 'harga-ecommerce',
    categoryId: 'harga',
    quickLabel: 'Bisa bikin toko online?',
    keywords: ['toko online', 'ecommerce', 'e-commerce', 'olshop', 'jual beli online', 'katalog produk'],
    answer: 'Bisa banget! Toko online custom tanpa potongan komisi marketplace. Bisa integrasi checkout via WhatsApp otomatis atau Payment Gateway otomatis (QRIS, VA, Kartu Kredit).',
  },
  {
    id: 'harga-promo',
    categoryId: 'harga',
    quickLabel: 'Ada promo apa sekarang?',
    keywords: ['promo', 'diskon', 'harga spesial', 'promo peluncuran', 'potongan harga'],
    answer: '🔥 Ada promo peluncuran khusus 5 klien pertama: Diskon 15% (jika bersedia jadi studi kasus portofolio), GRATIS technical support 1 bulan, dan tambahan 2x revisi mayor gratis!',
  },
  {
    id: 'objection-mahal',
    categoryId: 'harga',
    quickLabel: 'Budget terbatas, bisa nego?',
    keywords: ['mahal', 'kemahalan', 'kurang murah', 'bisa nego', 'budget minim', 'diskon dong', 'ada potongan', 'bisa cicil', 'uang pas-pasan'],
    answer: 'Bisa banget diobrolin kok kak! Fitur dan budget bisa kita sesuaikan. Kita bisa mulai dari versi MVP (fitur inti dulu) biar hemat biaya tapi bisnis kakak langsung bisa jalan 😊',
  },
  // ── ⏱️ Alur & Garansi ──
  {
    id: 'proses-durasi',
    categoryId: 'proses',
    quickLabel: 'Berapa lama pengerjaan?',
    keywords: ['berapa lama', 'durasi pengerjaan', 'estimasi waktu', 'lama proyek', 'timeline', 'bisa cepat'],
    answer: 'Estimasi standar: Landing page 1-2 minggu, Web App / Mobile App 3-6 minggu, Game 6-10 minggu. Kalau butuh timeline ekspres/mepet, bisa disepakati di awal konsultasi.',
  },
  {
    id: 'proses-alur',
    categoryId: 'proses',
    quickLabel: 'Gimana tahapan alur kerjanya?',
    keywords: ['alur kerja', 'proses kerja', 'tahapan proyek', 'cara kerja', 'workflow', 'step by step'],
    answer: 'Ada 4 tahap transparan: 1) Diskusi Kebutuhan & Desain, 2) Development & Coding, 3) Testing bareng klien, 4) Deployment & Serah Terima. Progres di-update rutin via WhatsApp.',
  },
  {
    id: 'proses-pembayaran',
    categoryId: 'proses',
    quickLabel: 'Sistem pembayarannya gimana?',
    keywords: ['pembayaran', 'dp', 'cicilan', 'bayar gimana', 'termin', 'sistem bayar', 'skema pembayaran'],
    answer: 'Sistemnya bertahap per milestone (DP awal, termin tengah saat fitur jadi, pelunasan saat rilis). Jadi Kakak lihat progres nyata dulu baru bayar. Aman & nol risiko!',
  },
  {
    id: 'proses-garansi',
    categoryId: 'proses',
    quickLabel: 'Ada garansi kalau ada bug?',
    keywords: ['garansi', 'bug', 'error', 'rusak', 'maintenance', 'support', 'after sales'],
    answer: 'Pasti ada! Setiap proyek dapat garansi technical support gratis 1 bulan pasca rilis. Kalau ada bug atau kendala teknis, Arzha beresin tuntas tanpa biaya tambahan.',
  },
  {
    id: 'proses-sourcecode',
    categoryId: 'proses',
    quickLabel: 'Source code dikasih ke klien?',
    keywords: ['source code', 'kodingan', 'repo', 'github', 'hak milik', 'milik siapa', 'dapet kodingan'],
    answer: '100% dikasih! Seluruh source code, repositori GitHub, dan aset project diserahkan penuh jadi hak milik Kakak tanpa biaya lisensi tersembunyi.',
  },
  {
    id: 'proses-hosting',
    categoryId: 'proses',
    quickLabel: 'Hosting & domain gimana?',
    keywords: ['hosting', 'domain', 'server', 'pasang web', 'deploy', 'cloud'],
    answer: 'Bisa dibantu setup sampai live! Mau pakai cloud modern hemat biaya (Vercel, Cloudflare, Supabase) atau server/hosting milik Kakak sendiri, semuanya siap dikonfigurasi.',
  },
  {
    id: 'objection-trust',
    categoryId: 'proses',
    quickLabel: 'Kenapa bisa percaya sama Arzha?',
    keywords: ['ga percaya', 'tidak percaya', 'ragu', 'takut ditipu', 'penipuan', 'aman ga', 'terpercaya', 'bukti kerja', 'ga mau', 'kabur'],
    answer: 'Hehe wajar banget kalau ragu di awal kak 😊 Arzha punya latar belakang 7+ tahun pengalaman di operasional dan audit korporat yang terbiasa kerja disiplin dan berintegritas tinggi. Plus ada 3 proyek live nyata yang bisa dicoba langsung, dan sistem bayarnya bertahap (hasil kelihatan dulu baru bayar).',
  },
  // ── 🛠️ Skill & Teknis ──
  {
    id: 'tech-stack',
    categoryId: 'tech',
    quickLabel: 'Teknologi yang dipakai apa saja?',
    keywords: ['teknologi', 'tech stack', 'pakai bahasa apa', 'framework', 'react node', 'koding pake apa', 'ai stack'],
    answer: 'Frontend: React 19, TypeScript, Tailwind CSS v4, Vite. Backend: Node.js, Vercel Serverless, Supabase, PostgreSQL. AI: Google Antigravity Agent, Gemini 3.8/3.7/3.5, Gemma 4, Embeddings. Mobile & Game: React Native, Expo, Capacitor, boardgame.io, WebSockets. Cepat, modern, dan scalable!',
  },
  {
    id: 'tech-custom',
    categoryId: 'tech',
    quickLabel: 'Bisa request fitur khusus/custom?',
    keywords: ['bisa bikin seperti', 'custom request', 'fitur khusus', 'bisa nggak', 'request fitur'],
    answer: 'Sangat bisa! Mau integrasi AI Agent dengan tool calling, upload file, ekspor laporan Excel/PDF, sistem notifikasi WhatsApp, sampai dashboard analitik bisa dibuat sesuai kebutuhan.',
  },
  {
    id: 'tech-payment',
    categoryId: 'tech',
    quickLabel: 'Bisa pasang payment gateway?',
    keywords: ['payment gateway', 'midtrans', 'xendit', 'qris', 'bayar otomatis', 'transfer bank otomatis'],
    answer: 'Bisa banget! Arzha bisa integrasikan sistem pembayaran otomatis seperti Midtrans atau Xendit untuk terima QRIS, Virtual Account, dan kartu kredit secara realtime.',
  },
  {
    id: 'objection-keunggulan',
    categoryId: 'tech',
    quickLabel: 'Apa keunggulan jasa Arzha?',
    keywords: ['keunggulan', 'kelebihan', 'kenapa harus arzha', 'bedanya apa', 'keistimewaan'],
    answer: '3 poin unggulan: 1) Ketelitian & kedisiplinan 7+ tahun pengalaman di operasional dan audit korporat (anti-ngilang), 2) Tech stack modern & kencang tanpa bloatware (React 19 + AI Agent), 3) Pendampingan teknis ramah & garansi support 1 bulan.',
  },
  // ── 📂 Bukti Proyek ──
  {
    id: 'portfolio-proyek',
    categoryId: 'portfolio',
    quickLabel: 'Apa saja contoh proyek yang sudah rilis?',
    keywords: ['portfolio', 'contoh kerjaan', 'proyek apa aja', 'pernah bikin apa', 'demo', 'hasil karya'],
    answer: 'Ada 6 proyek live yang bisa dicoba langsung: 1) B-Games (multiplayer realtime board game Skia 60 FPS), 2) Rajendra Pintar (platform edukasi anak kurikulum 5 usia + TTS dwibahasa full-offline), 3) Assets DEMO (sistem manajemen aset serverless zero-cost klien PT Global Multiparts), 4) ZhaNotes (PKM & Canvas Workspace offline-first tanpa server), 5) Issue Tracker (sistem pelacakan keluhan & portal vendor terisolasi zero-cost), 6) AI Chatbot Showcase (multi-agent Gemini & Antigravity). Cek demonya di bagian Proyek ya!',
  },
  {
    id: 'portfolio-bgames',
    categoryId: 'portfolio',
    quickLabel: 'Tentang proyek B-Games?',
    keywords: ['bgames', 'b-games', 'game multiplayer', 'ludo', 'ular tangga', 'hexagon'],
    answer: 'B-Games adalah arena board game klasik digital realtime 100% bebas iklan: Ludo Classic, Ludo Hexagon (hingga 6 pemain), Ular Tangga 3D, dan Tic-Tac-Toe. Dilengkapi kode room instan, Smart Bot AI Anti-AFK takeover otomatis, 4 tema papan (Wood, Marble, Grass, Sand), akun Google OAuth & Supabase Cloud Save. Demo: bgames.arzhaning.my.id',
  },
  {
    id: 'portfolio-rajendra',
    categoryId: 'portfolio',
    quickLabel: 'Tentang proyek Rajendra Pintar?',
    keywords: ['rajendra', 'rajendra pintar', 'edukasi anak', 'aplikasi anak', 'tts', 'flashcard'],
    answer: 'Rajendra Pintar (Pintar Ceria Kids) adalah platform edukasi anak usia 4-8 tahun 100% bebas iklan dengan kurikulum adaptif 5 usia, 9 kategori tematik, Flashcard TTS dwibahasa (ID/EN), kuis ceria + confetti, 6 maskot interaktif, Parent Gate, serta 100% full offline PWA & Android Capacitor. Demo: rapin.arzhaning.my.id',
  },
  {
    id: 'portfolio-assets',
    categoryId: 'portfolio',
    quickLabel: 'Tentang proyek Assets (Klien)?',
    keywords: ['assets', 'assets demo', 'klien', 'pt global multiparts', 'gmp', 'manajemen aset', 'inventaris', 'sistem internal'],
    answer: 'Assets DEMO adalah sistem manajemen inventaris aset korporat multi-platform untuk klien PT Global Multiparts dengan arsitektur Serverless Zero-Cost (Google Apps Script + Google Sheets/Drive). Fitur: QR/Barcode scanner via kamera fisik, depresiasi garis lurus otomatis, multi-foto kompresi cerdas, offline queue, dan ekspor laporan resmi PDF/Excel otomatis ke email. Versi publik simulasi: assets.arzhaning.my.id',
  },
  {
    id: 'portfolio-zhanotes',
    categoryId: 'portfolio',
    quickLabel: 'Tentang proyek ZhaNotes?',
    keywords: ['zhanotes', 'zha notes', 'catatan', 'canvas workspace', 'notetaking', 'obsidian', 'pkm', 'pdf annotator', 'template', 'tabel hitung'],
    answer: 'ZhaNotes adalah workspace catatan visual & PKM modern Local-First tanpa server (Zero Server Cost) via IndexedDB. Fitur: 4 mode (Rich-Text Editor, Infinite Canvas dengan pengenal bentuk otomatis & minimap, Riset Terstruktur, PDF Annotator dengan stabilo & ekstrak catatan), 72 template siap pakai (tabel hitung otomatis, modul latihan anak acak berproteksi PIN orang tua), tugas berulang otomatis, filter cari canggih, Wiki Backlinks [[ ]], perekam audio memo berpenanda waktu, dan ekspor Word (.docx) murni via JSZip, PDF, serta ZIP. Coba langsung di: arzhaning.my.id/zhanotes/',
  },
  {
    id: 'portfolio-itrack',
    categoryId: 'portfolio',
    quickLabel: 'Tentang proyek Issue Tracker?',
    keywords: ['issue tracker', 'itrack', 'keluhan pelanggan', 'manajemen vendor', 'komplain', 'sla', 'customer service'],
    answer: 'Issue Tracker adalah sistem pelacakan keluhan pelanggan dan manajemen vendor dengan arsitektur Zero Server Cost (Google Apps Script + Google Sheets DB 12 sheet + Cloudflare Worker). Fitur: nomor urut otomatis CS-2026-xxxx, portal vendor terisolasi (nama pelanggan dirahasiakan), form balasan terstruktur akar masalah & tindakan perbaikan, batas waktu respon (SLA) otomatis, reminder email otomatis, knowledge base solusi serupa, laporan analitik PDF, dan PWA tahan offline. Coba langsung di: itrack.arzhaning.my.id',
  },
  // ── 📞 Kontak & Konsultasi ──
  {
    id: 'kontak-wa',
    categoryId: 'kontak',
    quickLabel: 'Kontak WhatsApp & Email?',
    keywords: ['kontak', 'whatsapp', 'nomor hp', 'email', 'hubungi', 'wa'],
    answer: 'Bisa langsung hubungi WhatsApp di +6282312312734 atau email ke admin@arzhaning.my.id. Mau tanya-tanya santai dulu atau langsung konsultasi ide proyek, siap dilayani!',
  },
  {
    id: 'kontak-konsultasi',
    categoryId: 'kontak',
    quickLabel: 'Konsultasi awal gratis gak?',
    keywords: ['konsultasi gratis', 'biaya konsultasi', 'tanya dulu', 'ngobrol dulu', 'bayar ga'],
    answer: '100% GRATIS! Kakak bisa curhat kebutuhan sistem, minta estimasi timeline, atau tanya-tanya budget tanpa ada kewajiban order apa pun kok',
  },
  {
    id: 'kontak-availability',
    categoryId: 'kontak',
    quickLabel: 'Masih buka untuk proyek baru?',
    keywords: ['masih buka', 'terima proyek', 'available', 'slot kosong', 'lagi kosong gak'],
    answer: 'Masih buka untuk proyek baru! Apalagi ada promo peluncuran potongan 15% buat klien awal. Yuk amankan slot kakak sebelum kuotanya habis!',
  },
  // ── 💰 Tambahan FAQ Paket & Biaya ──
  {
    id: 'harga-landing-scope',
    categoryId: 'harga',
    quickLabel: 'Dapat apa saja di paket Landing Page 800rb?',
    keywords: ['scope landing page', 'dapat apa saja landing page', 'fitur 800rb', 'paket 800rb', 'kelengkapan landing page', 'fasilitas web'],
    answer: 'Paket Landing Page Rp800rb sudah termasuk: 1 halaman custom responsif (mobile & desktop), copywriting terstruktur, galeri/portofolio, tombol chat WhatsApp otomatis, form kontak, setup domain/hosting, optimasi SEO dasar, dan garansi support 1 bulan!',
  },
  {
    id: 'harga-ai-bot',
    categoryId: 'harga',
    quickLabel: 'Berapa biaya buat AI Chatbot kustom?',
    keywords: ['biaya chatbot', 'harga ai bot', 'bikin bot ai', 'harga chatbot custom', 'biaya autonomous agent', 'chatbot web whatsapp'],
    answer: 'AI Chatbot & Autonomous Agent kustom mulai dari Rp1.500.000 (1-2 minggu). Bisa dilatih dengan data produk/SOP bisnismu, terintegrasi ke website atau WhatsApp, dilengkapi guardrails anti-halusinasi, dan hemat kuota API!',
  },
  {
    id: 'harga-pwa',
    categoryId: 'harga',
    quickLabel: 'Berapa biaya bikin Progressive Web App (PWA)?',
    keywords: ['harga pwa', 'biaya pwa', 'aplikasi pwa', 'progressive web app', 'web bisa diinstal'],
    answer: 'PWA terintegrasi biasanya mulai dari Rp2.500.000 (untuk web app sederhana) hingga Rp6.000.000 (untuk sistem kompleks). Keunggulannya: bisa diinstal langsung di layar utama smartphone tanpa lewat Play Store dan bisa diakses offline!',
  },
  {
    id: 'harga-maintenance',
    categoryId: 'harga',
    quickLabel: 'Biaya maintenance setelah garansi habis?',
    keywords: ['biaya maintenance', 'langganan maintenance', 'biaya perawatan web', 'support bulanan', 'biaya update'],
    answer: 'Setelah garansi 1 bulan selesai, maintenance sifatnya opsional: bisa sistem on-demand (bayar per perbaikan/fitur baru mulai Rp150rb-Rp300rb) atau paket retainer bulanan terjangkau sesuai kebutuhan skala bisnis.',
  },
  // ── ⏱️ Tambahan FAQ Alur & Legal ──
  {
    id: 'proses-revisi',
    categoryId: 'proses',
    quickLabel: 'Berapa kali batas revisi selama proyek?',
    keywords: ['berapa kali revisi', 'aturan revisi', 'jatah revisi', 'revisi gratis', 'kebijakan revisi'],
    answer: 'Setiap proyek mencakup 2-3 kali revisi mayor saat tahap development dan revisi minor tanpa batas (unlimited) untuk perbaikan bug dan penyesuaian teks/warna selama masa garansi 1 bulan pasca rilis.',
  },
  {
    id: 'proses-kontrak-spk',
    categoryId: 'proses',
    quickLabel: 'Ada kontrak kerja sama / SPK resmi?',
    keywords: ['spk', 'surat perjanjian kerja', 'kontrak kerja', 'surat kontrak', 'nda', 'perjanjian resmi', 'legalitas'],
    answer: 'Ada! Setiap kerja sama dapat dilengkapi Surat Perjanjian Kerja (SPK) / Scope of Work tertulis dan NDA (Non-Disclosure Agreement) resmi untuk menjamin kepastian timeline, spesifikasi fitur, dan kerahasiaan data bisnis Anda.',
  },
  {
    id: 'proses-tahapan-dp',
    categoryId: 'proses',
    quickLabel: 'Berapa persen DP awal yang harus dibayar?',
    keywords: ['berapa dp', 'persen dp', 'dp berapa', 'uang muka', 'pembayaran awal', 'skema termin'],
    answer: 'Umumnya skema pembayaran adalah 3 termin aman: DP awal 30-40% saat kesepakatan SPK, 30% setelah demo fungsionalitas diuji coba, dan pelunasan 30-40% saat serah terima source code dan deployment live.',
  },
  {
    id: 'proses-luar-kota',
    categoryId: 'proses',
    quickLabel: 'Bisa melayani klien di luar kota / luar pulau?',
    keywords: ['luar kota', 'luar daerah', 'luar pulau', 'bukan jakarta', 'jarak jauh', 'remote', 'apakah bisa dari jauh'],
    answer: 'Sangat bisa! Sebagian besar klien Arzha bekerja secara remote. Koordinasi rutin berjalan mulus via Google Meet, Zoom, dan grup WhatsApp terdedikasi dengan laporan progres berkala.',
  },
  // ── 🛠️ Tambahan FAQ Teknis & Keamanan ──
  {
    id: 'tech-playstore',
    categoryId: 'tech',
    quickLabel: 'Bisa dibantu rilis ke Google Play Store?',
    keywords: ['play store', 'upload playstore', 'google play', 'app store', 'rilis aplikasi', 'terbitkan app'],
    answer: 'Bisa banget! Untuk proyek aplikasi mobile (React Native / Capacitor), Arzha membantu proses build APK/AAB bertandatangan, setup aset icon/splash screen, hingga panduan submit ke akun Google Play Console milik Anda.',
  },
  {
    id: 'tech-whatsapp-api',
    categoryId: 'tech',
    quickLabel: 'Bisa integrasi notifikasi WhatsApp otomatis?',
    keywords: ['notifikasi wa', 'kirim wa otomatis', 'whatsapp gateway', 'wa blast', 'whatsapp api', 'wa bot'],
    answer: 'Bisa! Aplikasi bisa dihubungkan ke WhatsApp Gateway atau official WhatsApp Cloud API untuk mengirimkan notifikasi invoice, status pesanan, OTP verifikasi, atau reminder jatuh tempo secara otomatis.',
  },
  {
    id: 'tech-google-sheets',
    categoryId: 'tech',
    quickLabel: 'Kapan pakai Google Sheets sebagai basis data?',
    keywords: ['kenapa google sheets', 'kelebihan google sheets', 'database sheets', 'zero server cost', 'database gratis'],
    answer: 'Cocok untuk UMKM dan bisnis menengah dengan volume ribuan data yang ingin Zero Server Cost (tanpa sewa VPS bulanan). Staf operasional bisa langsung mengedit data di spreadsheet yang familiar, sementara aplikasi membaca datanya lewat API aman.',
  },
  {
    id: 'tech-supabase-postgres',
    categoryId: 'tech',
    quickLabel: 'Kapan harus pakai PostgreSQL / Supabase?',
    keywords: ['kapan pakai postgres', 'supabase vs sheets', 'kenapa supabase', 'database besar', 'banyak user'],
    answer: 'Supabase / PostgreSQL wajib digunakan saat data mencapai ratusan ribu baris, butuh transaksi realtime berkecepatan tinggi, relasi tabel kompleks, atau sistem yang melibatkan ribuan user aktif bersamaan seperti B-Games.',
  },
  {
    id: 'tech-seo-performance',
    categoryId: 'tech',
    quickLabel: 'Apakah website ramah SEO & cepat diakses?',
    keywords: ['ramah seo', 'kecepatan web', 'pagespeed', 'google ranking', 'skor lighthouse', 'cepat dibuka'],
    answer: 'Pasti! Kami menerapkan teknik Static Site Generation (SSG) & prerender, kompresi gambar modern WebP/AVIF, struktur semantic HTML5, serta meta tag OpenGraph dan Schema.org JSON-LD agar website cepat terindeks di mesin pencari Google.',
  },
  {
    id: 'tech-keamanan-data',
    categoryId: 'tech',
    quickLabel: 'Bagaimana standar keamanan data dan privasi?',
    keywords: ['keamanan data', 'privasi', 'aman dari hacker', 'enkripsi', 'perlindungan data', 'anti jebol'],
    answer: 'Kami menerapkan standar keamanan ketat: password di-hash dengan enkripsi satu arah salt, proteksi SQL Injection & XSS, komunikasi HTTPS/TLS, audit trail mutasi, serta prinsip Zero-Knowledge di mana data chat klien tidak ditimbun di server.',
  },
  // ── 📂 Tambahan FAQ Bukti Proyek ──
  {
    id: 'portfolio-demos-galeri',
    categoryId: 'portfolio',
    quickLabel: 'Ada contoh demo untuk jenis bisnis saya?',
    keywords: ['contoh demo', 'galeri demo', 'ada demo klinik', 'demo pos kasir', 'demo kos', 'demo bengkel', 'contoh web bisnis'],
    answer: 'Tersedia 30+ galeri demo live di arzhaning.my.id/demos/ mencakup 18 industri: Aplikasi POS Kasir (kuliner, kafe, fashion, minimarket), AbsenPro HRIS, KosPro Suite, hingga profil bisnis bengkel, klinik, salon, bimbel, dan kontraktor!',
  },
  {
    id: 'portfolio-offline-first',
    categoryId: 'portfolio',
    quickLabel: 'Apa itu arsitektur Offline-First?',
    keywords: ['offline first', 'aplikasi tanpa internet', 'bisa jalan offline', 'aplikasi offline', 'tetap jalan tanpa sinyal'],
    answer: 'Offline-First adalah arsitektur di mana aplikasi menyimpan data dan logika di memori lokal perangkat (seperti IndexedDB/SQLite). Aplikasi tetap bisa dipakai 100% saat sinyal drop atau di dalam basement, lalu otomatis sinkron saat internet kembali.',
  },
];
