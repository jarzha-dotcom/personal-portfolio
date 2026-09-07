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
    answer: 'Hehe wajar banget kalau ragu di awal kak 😊 Arzha punya latar belakang internal audit korporat 7+ tahun yang terbiasa kerja disiplin dan berintegritas tinggi. Plus ada 3 proyek live nyata yang bisa dicoba langsung, dan sistem bayarnya bertahap (hasil kelihatan dulu baru bayar).',
  },
  // ── 🛠️ Skill & Teknis ──
  {
    id: 'tech-stack',
    categoryId: 'tech',
    quickLabel: 'Teknologi yang dipakai apa saja?',
    keywords: ['teknologi', 'tech stack', 'pakai bahasa apa', 'framework', 'react node', 'koding pake apa'],
    answer: 'Frontend: React, TypeScript, Tailwind CSS, Vite. Backend: Node.js, Supabase, PostgreSQL. Mobile: React Native, Expo. Game: boardgame.io, WebSockets. Cepat, modern, dan scalable!',
  },
  {
    id: 'tech-custom',
    categoryId: 'tech',
    quickLabel: 'Bisa request fitur khusus/custom?',
    keywords: ['bisa bikin seperti', 'custom request', 'fitur khusus', 'bisa nggak', 'request fitur'],
    answer: 'Sangat bisa! Mau integrasi API pihak ketiga, upload file, ekspor laporan Excel/PDF, sistem notifikasi WhatsApp, sampai dashboard analitik bisa dibuat sesuai kebutuhan.',
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
    answer: '3 poin unggulan: 1) Ketelitian & kedisiplinan audit korporat 7+ tahun (anti-ngilang), 2) Tech stack modern & kencang tanpa bloatware, 3) Pendampingan teknis ramah & garansi support 1 bulan.',
  },
  // ── 📂 Bukti Proyek ──
  {
    id: 'portfolio-proyek',
    categoryId: 'portfolio',
    quickLabel: 'Apa saja contoh proyek yang sudah rilis?',
    keywords: ['portfolio', 'contoh kerjaan', 'proyek apa aja', 'pernah bikin apa', 'demo', 'hasil karya'],
    answer: 'Ada 3 proyek live yang bisa dicoba langsung: 1) B-Games (game board multiplayer online), 2) Rajendra Pintar (app edukasi anak dwibahasa + suara TTS), 3) Assets GMP (sistem inventaris aset perusahaan). Cek demonya di bagian Proyek ya!',
  },
  {
    id: 'portfolio-bgames',
    categoryId: 'portfolio',
    quickLabel: 'Tentang proyek B-Games?',
    keywords: ['bgames', 'b-games', 'game multiplayer', 'ludo', 'ular tangga'],
    answer: 'B-Games adalah platform board game online realtime (Ludo, Ular Tangga, Tic Tac Toe) dengan room code multiplayer, chat room, dan matchmaking otomatis. Demo: bgames.byarzhaning.online',
  },
  {
    id: 'portfolio-rajendra',
    categoryId: 'portfolio',
    quickLabel: 'Tentang proyek Rajendra Pintar?',
    keywords: ['rajendra', 'rajendra pintar', 'edukasi anak', 'aplikasi anak', 'tts'],
    answer: 'Aplikasi belajar anak interaktif usia 4-8 tahun dengan suara Text-to-Speech dwibahasa (ID/EN), kuis tebak suara, dan animasi menarik. Demo: rajendrapintar.byarzhaning.online',
  },
  {
    id: 'portfolio-assets',
    categoryId: 'portfolio',
    quickLabel: 'Tentang proyek Assets GMP?',
    keywords: ['assets', 'assets gmp', 'manajemen aset', 'inventaris', 'sistem internal'],
    answer: 'Aplikasi internal perusahaan untuk tracking aset fisik, pencatatan mutasi barang, dan ekspor laporan inventaris otomatis ke Excel untuk audit. Demo: assets-gmp.vercel.app',
  },
  // ── 📞 Kontak & Konsultasi ──
  {
    id: 'kontak-wa',
    categoryId: 'kontak',
    quickLabel: 'Kontak WhatsApp & Email?',
    keywords: ['kontak', 'whatsapp', 'nomor hp', 'email', 'hubungi', 'wa'],
    answer: 'Bisa langsung hubungi WhatsApp di +6282312312734 atau email ke Jarzha@gmail.com. Mau tanya-tanya santai dulu atau langsung konsultasi ide proyek, siap dilayani!',
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
];
