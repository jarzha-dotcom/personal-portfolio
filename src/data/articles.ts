// Artikel untuk halaman /artikel (index) dan /artikel/:slug.
//
// Aturan pakai:
//  -  `slug`  dipakai di URL (/artikel/ <slug >), jangan diubah setelah
//    dipublikasikan — itu akan memutus link yang sudah dibagikan/diindeks.
//  -  ISI artikel (`body`) TIDAK ada di file ini. Isi dikelompokkan PER PILAR di
//    src/data/article-bodies/<pillar>.ts  (nama file = key pilar) yang meng-export
//    `bodies: Record<slug, ArticleBlock[]>`. Di browser dimuat lazy lewat
//    loadArticleBody() di  src/data/loadArticleBody.ts  (Vite-only), di build
//    lewat scripts/prerender.ts. File INI sengaja bebas import.meta.glob supaya
//    aman diimpor dari Node (prerender, vitest). Halaman index tidak ikut
//    mengunduh isi artikel, dan artikel sepilar
//    (yang saling direkomendasikan) berbagi satu chunk, jadi pindah antar-artikel
//    terasa instan.
//    Artikel baru = (1) tambah entri metadata di ARTICLES, (2) tambahkan isinya
//    ke file pilar yang sesuai.
//    Pilar baru   = tambah di PillarKey & PILLARS, lalu buat file <pillar>.ts baru
//    (meng-export `bodies`). Kalau satu pilar sudah > ~15-20 artikel, pertimbangkan
//    memecahnya.
//    Artikel draft boleh belum punya isi sama sekali.
//  -  `published`  baru diubah ke true setelah body lengkap dan sudah dibaca
//    ulang. Selama false, artikel tidak muncul di index maupun bisa diakses
//    langsung lewat URL-nya (lihat ArticlePage/ArticlesIndexPage).
//  -  `publishedAt`  diisi tanggal publikasi ISO string ( "2026-09-23 ").
//    Opsional — jika kosong, tanggal tidak ditampilkan di halaman artikel.
//  -  Urutan di array ARTICLES = urutan tampil di halaman index /artikel,
//    dan juga urutan yang dipakai untuk navigasi prev/next antar artikel.
//    [DIUBAH 2026-09-26] Sekarang disusun dari yang PALING BARU dipublikasikan
//    di paling atas, ke yang PALING LAMA di paling bawah. Konsekuensinya:
//    di getAdjacentArticles di bawah, "prev" (published[index-1]) sekarang
//    berarti artikel yang LEBIH BARU, dan "next" (published[index+1]) berarti
//    yang LEBIH LAMA — kebalikan dari konvensi sebelumnya. Sesuaikan label
//    tombol prev/next di UI kalau masih mengasumsikan urutan lama.
//  - Artikel #8 (panduan aplikasi edukasi anak) sengaja TIDAK dimasukkan di
//    sini — audiensnya orang tua, beda dari audiens jasa dev di situs ini.
//
// ===== Catatan pengelompokan pilar (untuk fitur "artikel terkait") =====
// `pillar` mengelompokkan artikel berdasarkan TEMA, terpisah dari urutan
// tanggal di array ini. Dipakai getRelatedArticles() di bawah supaya di
// halaman artikel bisa ditampilkan rekomendasi yang benar-benar nyambung
// topiknya, bukan cuma next/prev berdasarkan kronologi.
//
//   zero-server-cost   - filosofi arsitektur & pilihan backend
//   ai-chatbot-agent   - chatbot, autonomous agent, fitur AI
//   studi-kasus-produk - bedah satu produk secara utuh
//   panduan-bisnis     - funnel closing untuk calon klien
//   keamanan-data      - privasi & keamanan sistem
//   bedah-fitur-teknis - satu fitur spesifik, dibedah teknis
//   personal-brand     - reflektif, cerita di balik cara kerja
//
//   Daftar lengkap slug per pilar ada di PILLAR_GROUPS (dihitung otomatis
//   dari ARTICLES, jadi selalu sinkron -- tidak perlu di-update manual).
export interface ArticleBlock {
  // Opsional — kalau diisi, dirender sebagai subheading sebelum paragrafnya.
  heading?: string;
  paragraphs: string[];
}
// Kunci pilar konten — dipakai untuk mengelompokkan artikel yang temanya
// berdekatan (beda dari `category`, yang cuma label tampilan singkat di UI).
// Satu artikel = satu pilar. Lihat PILLARS di bawah untuk label & urutannya.
export type PillarKey =
  | 'zero-server-cost'   // Filosofi Zero Server Cost & Arsitektur
  | 'ai-chatbot-agent'   // AI Chatbot, Agent & Otomasi
  | 'studi-kasus-produk' // Studi Kasus Produk (B-Games, Assets DEMO, dll)
  | 'panduan-bisnis'     // Panduan Bisnis untuk Calon Klien
  | 'keamanan-data'      // Keamanan & Privasi Data
  | 'bedah-fitur-teknis' // Bedah Fitur Teknis Spesifik
  | 'personal-brand';    // Personal Brand / Reflektif

export const PILLARS: Record<PillarKey, string> = {
  'zero-server-cost': 'Zero Server Cost & Arsitektur',
  'ai-chatbot-agent': 'AI Chatbot, Agent & Otomasi',
  'studi-kasus-produk': 'Studi Kasus Produk',
  'panduan-bisnis': 'Panduan Bisnis untuk Calon Klien',
  'keamanan-data': 'Keamanan & Privasi Data',
  'bedah-fitur-teknis': 'Bedah Fitur Teknis Spesifik',
  'personal-brand': 'Personal Brand & Reflektif',
};

export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readMinutes: number;
  pillar: PillarKey;
  published: boolean;
  publishedAt?: string; // ISO string, mis. "2026-09-23"
}
export const ARTICLES: Article[] = [
  // ===== Artikel published, diurutkan dari PALING BARU ke PALING LAMA =====
  {
    slug: 'web-app-vs-mobile-app-vs-pwa',
    title: 'Perbedaan Web App, Mobile App, dan PWA — Mana yang Kamu Butuhkan?',
    excerpt:
      'Penjelasan sederhana tanpa jargon, plus pertanyaan panduan untuk menentukan mana yang paling cocok dengan kebutuhan bisnismu.',
    category: 'Panduan',
    readMinutes: 6,
    pillar: 'panduan-bisnis',
    published: true,
    publishedAt: '2026-09-26',
  },
  {
    slug: 'kenapa-harga-proposal-bisa-beda-beda',
    title: 'Kenapa Harga Proposal Development Bisa Beda-beda Padahal Fiturnya Kelihatan Mirip',
    excerpt:
      'Dua proposal dengan daftar fitur yang terlihat sama bisa punya selisih harga jauh. Ini yang sebenarnya menentukan angkanya.',
    category: 'Panduan',
    readMinutes: 4,
    pillar: 'panduan-bisnis',
    published: true,
    publishedAt: '2026-09-25',
  },
  {
    slug: '5-pertanyaan-sebelum-pakai-jasa-developer-freelance',
    title: '5 Pertanyaan yang Harus Ditanyakan Sebelum Pakai Jasa Developer Freelance',
    excerpt:
      'Dari siapa yang pegang kode sampai apa yang terjadi kalau developer hilang kontak di tengah jalan — dijawab lewat cara kerja saya sendiri.',
    category: 'Panduan',
    readMinutes: 6,
    pillar: 'panduan-bisnis',
    published: true,
    publishedAt: '2026-09-24',
  },
  {
    slug: 'berapa-lama-bikin-website-aplikasi-bisnis-kecil',
    title: 'Berapa Lama Bikin Website/Aplikasi untuk Bisnis Kecil? Ini Rincian Prosesnya',
    excerpt:
      'Rentang waktu realistis per jenis proyek, faktor yang mempercepat atau memperlambat, dan alur kerja langkah demi langkah.',
    category: 'Panduan',
    readMinutes: 5,
    pillar: 'panduan-bisnis',
    published: true,
    publishedAt: '2026-09-23',
  },
  {
    slug: 'studi-kasus-devrab-proposal-30-detik',
    title: 'Mengenal DevRAB: Mesin Proposal di Balik Tombol "Buatkan RAB" Milik Zannah',
    excerpt:
      'DevRAB adalah platform yang saya bangun untuk menyusun SOW, RAB, tanda tangan digital, dan pembayaran dalam satu alur — mesin di balik tombol "Buatkan RAB" milik Zannah.',
    category: 'Studi Kasus',
    readMinutes: 7,
    pillar: 'studi-kasus-produk',
    published: true,
    publishedAt: '2026-09-22',
  },
  {
    slug: 'apa-itu-cascade-ai-system',
    title: 'Apa Itu Cascade AI System? Cara Kerja Sistem "Anti-Down" di Balik Chatbot Ini',
    excerpt:
      'Kalau satu model AI sedang sibuk atau bermasalah, sistem otomatis pindah ke model cadangan dalam hitungan milidetik. Ini cara kerjanya.',
    category: 'Teknis',
    readMinutes: 3,
    pillar: 'ai-chatbot-agent',
    published: true,
    publishedAt: '2026-09-21',
  },
  {
    slug: 'apa-itu-autonomous-agent-beda-chatbot-biasa',
    title: 'Apa Itu Autonomous Agent? Beda dengan Chatbot Biasa',
    excerpt:
      'Chatbot menjawab pertanyaan. Autonomous Agent mengerjakan tugas sampai selesai. Ini beda mendasarnya, dan kapan kamu butuh yang mana.',
    category: 'Teknis',
    readMinutes: 2,
    pillar: 'ai-chatbot-agent',
    published: true,
    publishedAt: '2026-09-20',
  },
  {
    slug: 'kenapa-4-proyek-saya-pakai-4-arsitektur-backend-berbeda',
    title: '4 Sistem Saya, 4 Arsitektur Backend Berbeda — Ini Alasannya',
    excerpt:
      'Assets DEMO pakai Google Sheets, B-Games pakai Supabase, DevRAB pakai Cloudflare + Turso. Bukan karena ikut tren, tapi karena kebutuhannya memang beda.',
    category: 'Teknis',
    readMinutes: 5,
    pillar: 'zero-server-cost',
    published: true,
    publishedAt: '2026-09-19',
  },
  {
    slug: 'kenapa-google-apps-script-untuk-klien-kecil-menengah',
    title: 'Kenapa Saya Pilih Google Apps Script Ketimbang Server Sendiri untuk Klien Kecil-Menengah',
    excerpt:
      'Alasan biaya dan maintenance di balik keputusan arsitektur untuk klien dengan budget terbatas — lengkap dengan kapan pendekatan ini TIDAK cocok dipakai.',
    category: 'Teknis',
    readMinutes: 3,
    pillar: 'zero-server-cost',
    published: true,
    publishedAt: '2026-09-18',
  },
  {
    slug: 'arsitektur-multiplayer-real-time-b-games',
    title: 'Arsitektur Multiplayer Real-Time di B-Games',
    excerpt:
      'Bagaimana sinkronisasi giliran pemain di Ludo dan Ular Tangga dibangun tanpa lag, dan cara menangani pemain yang tiba-tiba disconnect.',
    category: 'Teknis',
    readMinutes: 8,
    pillar: 'studi-kasus-produk',
    published: true,
    publishedAt: '2026-09-17',
  },
  {
    slug: 'tanda-waktunya-migrasi-dari-apps-script',
    title: '5 Tanda Bisnismu Sudah Waktunya Migrasi dari Google Apps Script ke Server Sendiri',
    excerpt:
      'Google Apps Script pas untuk skala kecil-menengah, tapi ada titik ketika sistem butuh "naik kelas". Ini tanda-tandanya.',
    category: 'Teknis',
    readMinutes: 4,
    pillar: 'zero-server-cost',
    published: true,
    publishedAt: '2026-09-15',
  },
  {
    slug: 'amankah-data-bisnis-di-google-sheets-drive',
    title: 'Amankah Data Bisnis Disimpan di Google Sheets/Drive? Ini Faktanya',
    excerpt:
      'Kekhawatiran yang wajar sebelum memakai sistem berbasis Google Sheets/Drive untuk data bisnis — dan apa yang sebenarnya paling menentukan keamanannya.',
    category: 'Teknis',
    readMinutes: 2,
    pillar: 'keamanan-data',
    published: true,
    publishedAt: '2026-09-12',
  },
  {
    slug: 'custom-chatbot-vs-chatbot-template',
    title: 'Custom Chatbot vs Chatbot Template: Mana yang Cocok untuk Bisnis Kamu?',
    excerpt:
      'Perbandingan biaya jangka panjang dan kapan logika bisnis spesifik butuh solusi custom, bukan sekadar template siap pakai.',
    category: 'Panduan',
    readMinutes: 3,
    pillar: 'ai-chatbot-agent',
    published: true,
    publishedAt: '2026-09-10',
  },
  {
    slug: 'biaya-bikin-chatbot-custom-rincian',
    title: 'Berapa Biaya Sebenarnya Bikin Chatbot Custom? Rincian dari Rp1,5jt',
    excerpt:
      'Rp1,5jt itu harga mulai dari — bukan harga final. Ini rincian apa saja yang termasuk, dan apa yang bikin harganya berubah.',
    category: 'Panduan',
    readMinutes: 3,
    pillar: 'ai-chatbot-agent',
    published: true,
    publishedAt: '2026-09-08',
  },
  {
    slug: 'cara-kerja-sistem-aset-pt-gmp',
    title: 'Cara Kerja Sistem Manajemen Aset PT Global Multiparts',
    excerpt:
      'Bedah teknis arsitektur serverless di balik Assets DEMO — dari stock opname manual yang rawan selisih, sampai audit yang bisa dicek kapan saja.',
    category: 'Studi Kasus',
    readMinutes: 6,
    pillar: 'studi-kasus-produk',
    published: true,
    publishedAt: '2026-09-05',
  },

  // ===== Draft (published: false) — belum ada body, dikumpulkan di akhir,
  // tidak muncul di index maupun bisa diakses langsung lewat URL-nya.
  // Metadata (slug/title/excerpt/category/readMinutes) sudah final sesuai
  // rencana konten; tinggal direview lagi kalau mau ditambah/diisi bodynya. =====
  {
    slug: 'kapan-google-sheets-cukup-kapan-harus-pindah-postgresql',
    title: 'Kapan Google Sheets Cukup Jadi Database, Kapan Harus Pindah ke PostgreSQL/Supabase',
    excerpt:
      'Bukan soal mana yang lebih bagus — ini soal titik di mana Google Sheets sebagai database mulai kehabisan napas untuk skala datamu.',
    category: 'Teknis',
    readMinutes: 4,
    pillar: 'zero-server-cost',
    published: false,
  },
  {
    slug: 'serverless-vs-vps-bukan-soal-canggih',
    title: 'Serverless vs VPS: Bukan Soal Mana yang Lebih Canggih, Tapi Mana yang Sesuai Skala Bisnis',
    excerpt:
      'Dua pendekatan hosting yang sering disalahpahami sebagai "upgrade" satu sama lain, padahal keduanya menjawab kebutuhan yang berbeda.',
    category: 'Teknis',
    readMinutes: 4,
    pillar: 'zero-server-cost',
    published: false,
  },
  {
    slug: 'kenapa-1-website-butuh-3-karakter-ai-berbeda',
    title: 'Kenapa 1 Website Butuh 3 Karakter AI Berbeda (Zannah, Rajendra, Radit)',
    excerpt:
      'Bukan gimmick — pembagian peran ini yang bikin kuota AI tetap awet dan tiap pengunjung dapat respons yang paling sesuai kebutuhannya.',
    category: 'Teknis',
    readMinutes: 3,
    pillar: 'ai-chatbot-agent',
    published: false,
  },
  {
    slug: 'bagaimana-ai-membaca-dokumen-yang-kamu-upload',
    title: 'Bagaimana AI Bisa "Membaca" Sketsa, PDF, dan CSV yang Kamu Upload',
    excerpt:
      'Di balik fitur analisis berkas Zannah — bagaimana sketsa tangan, dokumen, dan tabel data diubah jadi kebutuhan proyek yang terstruktur.',
    category: 'Teknis',
    readMinutes: 4,
    pillar: 'ai-chatbot-agent',
    published: false,
  },
  {
    slug: 'kenapa-ai-chatbot-saya-bisa-bicara',
    title: 'Kenapa AI Chatbot Saya Bisa Bicara (Bukan Cuma Teks): Di Balik Fitur Text-to-Speech WaveNet',
    excerpt:
      'Suara yang fasih mengeja rupiah dan tanggal itu bukan rekaman manusia — ini cara kerja sintesis suara di baliknya.',
    category: 'Teknis',
    readMinutes: 3,
    pillar: 'ai-chatbot-agent',
    published: false,
  },
  {
    slug: 'dari-chat-ke-kontrak-ditandatangani-alur-zannah-devrab',
    title: 'Dari Chat ke Kontrak Ditandatangani: Alur Zannah, Mesin RAB, dan Portal Klien, End-to-End',
    excerpt:
      'Satu alur machine-to-machine penuh — dari diskusi santai di chatbot sampai proposal resmi siap dibayar, tanpa campur tangan manual di tengahnya.',
    category: 'Studi Kasus',
    readMinutes: 5,
    pillar: 'studi-kasus-produk',
    published: false,
  },
  {
    slug: 'membangun-aplikasi-100-persen-offline-rajendra-pintar',
    title: 'Membangun Aplikasi 100% Offline: Studi Teknis di Balik Rajendra Pintar',
    excerpt:
      'Bagaimana Capacitor dan Service Worker dipakai supaya ratusan materi belajar tetap bisa diakses tanpa kuota internet sama sekali.',
    category: 'Teknis',
    readMinutes: 5,
    pillar: 'studi-kasus-produk',
    published: false,
  },
  {
    slug: 'kenapa-b-games-pakai-postgresql-bukan-google-sheets',
    title: 'Kenapa B-Games Pakai PostgreSQL (Supabase), Bukan Google Sheets Seperti Assets DEMO',
    excerpt:
      'Studi kasus langsung dari dua produk saya sendiri — titik di mana kebutuhan data sudah melewati kapasitas spreadsheet.',
    category: 'Teknis',
    readMinutes: 4,
    pillar: 'studi-kasus-produk',
    published: false,
  },
  {
    slug: 'tanda-bisnismu-butuh-sistem-custom',
    title: 'Tanda-tanda Bisnismu Butuh Sistem Custom, Bukan Sekadar Excel atau Aplikasi Siap Pakai',
    excerpt:
      'Excel dan aplikasi template itu bagus untuk mulai — sampai titik tertentu. Ini tanda-tanda kamu sudah melewati titik itu.',
    category: 'Panduan',
    readMinutes: 4,
    pillar: 'panduan-bisnis',
    published: false,
  },
  {
    slug: 'checklist-sebelum-konsultasi-pertama-dengan-developer',
    title: 'Checklist: Apa yang Perlu Disiapkan Sebelum Konsultasi Pertama dengan Developer',
    excerpt:
      'Konsultasi yang produktif dimulai dari persiapan yang tepat — ini daftar yang bikin diskusi awal jadi lebih efisien untuk kedua pihak.',
    category: 'Panduan',
    readMinutes: 3,
    pillar: 'panduan-bisnis',
    published: false,
  },
  {
    slug: 'kenapa-riwayat-chat-ai-disimpan-di-browser-kamu',
    title: 'Kenapa Riwayat Chat AI Disimpan di Browser Kamu (IndexedDB), Bukan di Server Saya',
    excerpt:
      'Pilihan arsitektur yang sengaja dibuat demi privasi — dan apa konsekuensinya kalau kamu ganti perangkat atau bersihkan cache browser.',
    category: 'Teknis',
    readMinutes: 3,
    pillar: 'keamanan-data',
    published: false,
  },
  {
    slug: 'single-active-session-mencegah-akun-dibajak',
    title: 'Single Active Session: Fitur Kecil yang Mencegah Akun Dibajak atau Dipakai Bersama',
    excerpt:
      'Login di perangkat baru otomatis mengeluarkan sesi lama — mekanisme sederhana yang sering luput padahal dampaknya besar untuk keamanan akun.',
    category: 'Teknis',
    readMinutes: 3,
    pillar: 'keamanan-data',
    published: false,
  },
  {
    slug: 'enkripsi-password-standar-militer-itu-apa',
    title: 'Enkripsi Password Standar Militer Itu Apa, dan Kenapa Penting untuk Sistem Bisnis Kecil',
    excerpt:
      'Istilah "PBKDF2 SHA-256" terdengar rumit, tapi konsepnya sederhana untuk dipahami — dan kenapa ini bukan fitur yang boleh dilewatkan.',
    category: 'Teknis',
    readMinutes: 3,
    pillar: 'keamanan-data',
    published: false,
  },
  {
    slug: 'dari-scan-kamera-ke-data-aset-1-detik',
    title: 'Dari Scan Kamera ke Data Aset dalam 1 Detik: Cara Kerja QR/Barcode di Assets DEMO',
    excerpt:
      'Expo Camera dan mesin pemindai ZXing — bagaimana kamera HP biasa bisa menggantikan alat scanner barcode fisik yang mahal.',
    category: 'Teknis',
    readMinutes: 3,
    pillar: 'bedah-fitur-teknis',
    published: false,
  },
  {
    slug: 'depresiasi-aset-dihitung-otomatis-penjelasan-non-akuntan',
    title: 'Depresiasi Aset Dihitung Otomatis: Penjelasan Straight-Line Method untuk Non-Akuntan',
    excerpt:
      'Metode garis lurus itu sebenarnya rumus yang cukup sederhana. Ini penjelasannya tanpa jargon akuntansi yang membingungkan.',
    category: 'Panduan',
    readMinutes: 3,
    pillar: 'bedah-fitur-teknis',
    published: false,
  },
  {
    slug: 'offline-first-dua-aplikasi-saya-tetap-jalan-tanpa-internet',
    title: 'Offline-First: Bagaimana 2 Aplikasi Saya (Assets DEMO & Rajendra Pintar) Tetap Jalan Tanpa Internet',
    excerpt:
      'Dua kasus penggunaan berbeda, satu prinsip arsitektur yang sama — dan kenapa "offline-first" beda dengan sekadar "ada mode offline".',
    category: 'Teknis',
    readMinutes: 4,
    pillar: 'bedah-fitur-teknis',
    published: false,
  },
  {
    slug: 'anti-afk-bot-di-b-games',
    title: 'Anti-AFK Bot di B-Games: Kenapa Meja Permainan Nggak Pernah Macet Walau Pemain Disconnect',
    excerpt:
      'Detail teknis mekanisme takeover otomatis yang bikin permainan tetap jalan mulus meski salah satu pemain kehilangan koneksi.',
    category: 'Teknis',
    readMinutes: 3,
    pillar: 'bedah-fitur-teknis',
    published: false,
  },
  {
    slug: 'kenapa-daftar-ribuan-aset-tidak-lag-flashlist',
    title: 'Kenapa Daftar Ribuan Aset di HP Nggak Lag: di Balik FlashList dari Shopify',
    excerpt:
      'Mesin render daftar yang dipakai raksasa e-commerce dunia, dan bagaimana teknologi yang sama membuat Assets DEMO tetap ringan.',
    category: 'Teknis',
    readMinutes: 3,
    pillar: 'bedah-fitur-teknis',
    published: false,
  },
  {
    slug: 'dari-audit-internal-ke-software-development',
    title: 'Dari 7 Tahun Audit Internal ke Software Development: Kenapa Latar Belakang Data Membentuk Cara Saya Bangun Sistem',
    excerpt:
      'Kebiasaan mengecek selisih data dan menelusuri audit trail dari dunia audit ternyata jadi fondasi cara saya merancang sistem sekarang.',
    category: 'Reflektif',
    readMinutes: 4,
    pillar: 'personal-brand',
    published: false,
  },
  {
    slug: 'zero-server-cost-bukan-gimmick',
    title: 'Zero Server Cost Bukan Gimmick: Filosofi di Balik Semua Produk yang Saya Bangun',
    excerpt:
      'Kenapa "hemat biaya server" bukan sekadar jargon marketing, tapi keputusan arsitektur yang dipegang konsisten dari proyek ke proyek.',
    category: 'Reflektif',
    readMinutes: 4,
    pillar: 'personal-brand',
    published: false,
  },
  {
    slug: 'react-native-expo-vs-flutter-kenapa-saya-pilih',
    title: 'React Native + Expo vs Flutter: Kenapa Saya Pilih Satu untuk Aplikasi Multi-Platform',
    excerpt:
      'Dua framework populer untuk satu basis kode di Web, Android, dan iOS — ini pertimbangan yang menentukan pilihan saya.',
    category: 'Teknis',
    readMinutes: 4,
    pillar: 'zero-server-cost',
    published: false,
  },
  {
    slug: 'kenapa-supabase-untuk-proyek-yang-butuh-autentikasi-cepat',
    title: 'Kenapa Supabase Sering Jadi Pilihan Cepat untuk Proyek yang Butuh Autentikasi dan Database Sekaligus',
    excerpt:
      'Database, autentikasi, dan realtime subscription dalam satu paket — kapan ini jadi pilihan paling efisien dari sisi waktu development.',
    category: 'Teknis',
    readMinutes: 4,
    pillar: 'zero-server-cost',
    published: false,
  },
  {
    slug: 'xendit-vs-payment-gateway-lain-kenapa-saya-pilih',
    title: 'Kenapa Xendit Jadi Payment Gateway Pilihan di Hampir Semua Proyek Saya',
    excerpt:
      'QRIS, Virtual Account, e-wallet dalam satu integrasi — pertimbangan di balik pilihan payment gateway yang dipakai berulang kali.',
    category: 'Teknis',
    readMinutes: 3,
    pillar: 'bedah-fitur-teknis',
    published: false,
  },
  {
    slug: 'apa-itu-audit-trail-dan-kenapa-bisnismu-butuh',
    title: 'Apa Itu Audit Trail, dan Kenapa Bisnismu Mungkin Butuh Fitur Ini Lebih dari yang Kamu Kira',
    excerpt:
      '"Siapa yang mengubah data ini?" adalah pertanyaan yang baru terasa penting saat sudah terlambat. Ini kenapa fitur ini sebaiknya ada sejak awal.',
    category: 'Panduan',
    readMinutes: 3,
    pillar: 'panduan-bisnis',
    published: false,
  },
  {
    slug: 'progressive-web-app-pwa-dijelaskan-sesederhana-mungkin',
    title: 'Progressive Web App (PWA) Dijelaskan Sesederhana Mungkin untuk Pemilik Bisnis',
    excerpt:
      'Istilah PWA sering disebut tapi jarang dijelaskan tanpa jargon. Ini penjelasan yang bisa langsung dipahami tanpa latar belakang teknis.',
    category: 'Panduan',
    readMinutes: 3,
    pillar: 'panduan-bisnis',
    published: false,
  },
];
// Daftar slug per pilar, dihitung otomatis dari ARTICLES (published saja) --
// jadi selalu sinkron tanpa perlu di-maintain manual dua tempat berbeda.
// Berguna kalau mau bikin halaman index per-pilar suatu saat.
export const PILLAR_GROUPS: Record<PillarKey, string[]> = (
  Object.keys(PILLARS) as PillarKey[]
).reduce((acc, key) => {
  acc[key] = ARTICLES.filter((a) => a.published && a.pillar === key).map((a) => a.slug);
  return acc;
}, {} as Record<PillarKey, string[]>);

export const getArticleBySlug = (slug: string): Article | undefined =>
  ARTICLES.find((a) => a.slug === slug && a.published);
// Artikel sebelumnya/selanjutnya di antara yang published, mengikuti urutan
// tampil di ARTICLES (urutan yang sama dipakai di halaman index /artikel).
// [Lihat catatan di header file soal urutan terbaru->terlama] "prev" di sini
// mengarah ke artikel yang LEBIH BARU, "next" ke yang LEBIH LAMA.
export const getAdjacentArticles = (
  slug: string
): { prev: Article | null; next: Article | null } => {
  const published = ARTICLES.filter((a) => a.published);
  const index = published.findIndex((a) => a.slug === slug);
  if (index === -1) return { prev: null, next: null };
  return {
    prev: index > 0 ? published[index - 1] : null,
    next: index < published.length - 1 ? published[index + 1] : null,
  };
};

// Rekomendasi artikel terkait berdasarkan PILAR yang sama -- dipakai untuk
// card "Artikel Terkait" yang muncul saat user scroll sampai bawah halaman
// artikel (lihat catatan penggunaan di chat/README implementasi UI).
// - Cuma mengambil dari artikel published, tidak termasuk artikel itu sendiri.
// - Diurutkan dari yang publishedAt-nya paling dekat ke artikel yang sedang
//   dibaca (baik lebih baru maupun lebih lama), supaya rekomendasinya terasa
//   "sezaman" dan bukan asal comot dari pilar yang sama tapi tanggalnya jauh.
// - Kalau pilar yang sama isinya kurang dari `limit`, sisanya diisi dari
//   artikel published lain (fallback) supaya card tidak pernah kosong/ganjil
//   isinya cuma 1 artikel.
export const getRelatedArticles = (slug: string, limit = 3): Article[] => {
  const current = ARTICLES.find((a) => a.slug === slug);
  if (!current) return [];

  const currentTime = current.publishedAt ? new Date(current.publishedAt).getTime() : 0;
  const byRecency = (a: Article, b: Article) => {
    const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return Math.abs(ta - currentTime) - Math.abs(tb - currentTime);
  };

  const samePillar = ARTICLES.filter(
    (a) => a.published && a.slug !== slug && a.pillar === current.pillar
  ).sort(byRecency);

  if (samePillar.length >= limit) return samePillar.slice(0, limit);

  // Fallback: lengkapi sisa slot dari artikel published lain (pilar apa saja)
  // supaya card tetap terisi penuh meski pilar ini masih sedikit artikelnya.
  const usedSlugs = new Set([slug, ...samePillar.map((a) => a.slug)]);
  const fallback = ARTICLES.filter((a) => a.published && !usedSlugs.has(a.slug)).sort(byRecency);

  return [...samePillar, ...fallback].slice(0, limit);
};