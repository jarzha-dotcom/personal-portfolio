import { ExperienceItem, HardSkill, SoftSkill, EducationItem, ContactInfo, ProjectItem, TechStackGroup } from '../types';
import profileImage from '../assets/images/profile_photo_1788181262553.jpg';

export const PERSONAL_INFO = {
  name: 'K. Arzhaning Jagad',
  nickname: 'Arzha',
  initials: 'KAJ',
  title: 'Audit Internal & Data Specialist',
  titleJasa: 'Indie Developer & Data Specialist',
  headline: 'Internal Audit & Data Specialist • Indie App Builder',
  subheadline: 'Menggabungkan ketelitian audit korporat 7+ tahun dengan passion membangun aplikasi dan board game interaktif yang rapi, bermanfaat, dan menyenangkan.',
  about: 'Saya adalah profesional berorientasi data dengan pengalaman 7+ tahun di bidang audit internal, administrasi bisnis, dan operasional korporat. Di samping dunia audit, saya adalah seorang indie developer yang hobi membangun aplikasi web/mobile serta platform board game interaktif untuk dimainkan bersama keluarga dan rekan kerja.',
  avatar: profileImage,
  location: 'Cibitung, Bekasi',
  yearsOfExperience: '7+ Tahun',
  field: 'Audit Internal, Data & App Development',
  status: 'Tersedia untuk Peluang & Kolaborasi',
};

export const CONTACT_INFO: ContactInfo = {
  email: 'admin@arzhaning.my.id',
  phone: '+6282312312734',
  displayPhone: '0823-1231-2734',
  location: 'Cibitung, Bekasi, Jawa Barat',
  availableForWork: true,
};

export const EXPERIENCES: ExperienceItem[] = [
  {
    id: 'exp-1',
    company: 'PT Global Multiparts',
    period: 'Agustus 2019 - Sekarang',
    location: 'Kab. Bekasi, Jawa Barat',
    type: 'Full-time / Korporat',
    roles: [
      {
        role: 'Staff Audit Internal',
        period: 'Posisi Terkini',
        isCurrent: true,
        tasks: [
          'Menyusun dan melaksanakan Rencana Kerja Audit Internal tahunan dan berkala.',
          'Menetapkan frekuensi dan lingkup audit kepatuhan SOP operasional dan inventaris.',
          'Melakukan rekonsiliasi data stok fisik vs sistem untuk meminimalisir risiko selisih (discrepancy).',
          'Membuat laporan temuan audit komprehensif beserta rekomendasi perbaikan proses bisnis.',
          'Memastikan integritas data transaksi dan kepatuhan finansial di seluruh cabang/unit.'
        ]
      },
      {
        role: 'Admin dan Kasir',
        period: '2020 - 2022',
        tasks: [
          'Melayani pembayaran customer secara akurat menggunakan sistem Point of Sales (POS) dengan rata-rata 50-70 transaksi per hari.',
          'Menyiapkan dan mengoordinasikan pengiriman barang ke toko cabang lain (inter-branch transfer), termasuk pengepakan, labeling, dan serah terima ke driver pengiriman.',
          'Menerima barang masuk (receiving) dari supplier/gudang pusat, melakukan verifikasi kesesuaian fisik barang dengan surat jalan dan purchase order.',
          'Membuat dokumen Sales Order (SO) dan Delivery Order (DO) untuk transaksi B2B dan pengiriman ke cabang',
          'Melakukan pembukuan dan pengarsipan dokumen invoice serta faktur pajak (5–10 faktur/hari) dikirimkan ke customer melaluai whatsapp, email, dan ekspedisi. Sebagai dukungan administrasi kepada tim Finance, melakukan verifikasi kelengkapan, dan distribusi arsip.',
          'Membuat dan merekonsiliasi laporan penjualan harian, mingguan, serta bulanan untuk kebutuhan evaluasi omset dan stok.',
          'Menangani administrasi surat jalan, dan dokumentasi pembukuan kas harian agar siap diaudit sewaktu-waktu.'
        ]
      },
      {
        role: 'Sales Promotion Boy (SPB)',
        period: '2019 - 2020',
        tasks: [
          'Melakukan promosi produk aktif dan mencapai target penjualan yang ditetapkan.',
          'Mengatur display produk sesuai standar visual merchandising serta menjaga kerapian toko.',
          'Membangun relasi dan melayani kebutuhan pelanggan dengan profesional.'
        ]
      }
    ]
  },
  {
    id: 'exp-2',
    company: 'PT Bintang Sempurna',
    period: 'Maret 2014 - Agustus 2019',
    location: 'Jakarta Pusat, DKI Jakarta',
    type: 'Full-time',
    roles: [
      {
        role: 'Operator Finishing',
        tasks: [
          'Mengoperasikan mesin finishing percetakan berstandar industri dengan presisi tinggi.',
          'Melakukan quality control (QC) ketat untuk memastikan hasil akhir sesuai spesifikasi klien.',
          'Mengatur alur kerja produksi guna memenuhi tenggat waktu pengiriman yang ketat.'
        ]
      }
    ]
  },
  {
    id: 'exp-3',
    company: 'ITC Cipulir Mas & PD Cipulir',
    period: 'Juni 2011 - Maret 2014',
    location: 'Jakarta Selatan, DKI Jakarta',
    type: 'Full-time',
    roles: [
      {
        role: 'Sales Promotion Boy (SPB) - Multi Store',
        period: 'September 2011 - Maret 2014',
        tasks: [
          'Bertugas di beberapa toko berbeda dalam area ITC Cipulir dengan rotasi setiap 8-12 bulan, mengembangkan kemampuan adaptasi dan pelayanan pelanggan di berbagai jenis produk.',
          'Melakukan promosi aktif dan penjualan langsung kepada konsumen, konsisten mencapai target penjualan yang ditetapkan setiap toko.',
          'Mengelola display produk, memastikan stok tersedia, dan menjaga presentasi toko agar menarik bagi pelanggan.',
          'Membangun hubungan baik dengan pelanggan tetap dan memberikan pelayanan yang ramah untuk meningkatkan repeat customer.',
          'Berkolaborasi dengan tim toko dalam operasional harian, termasuk pengelolaan inventaris dan pelaporan penjualan.'
        ]
      },
      {
        role: 'Cleaning Service',
        period: 'Juni 2011 - September 2011',
        tasks: [
          'Menjaga kebersihan dan higienitas seluruh area operasional toko selama 3 bulan awal bergabung.',
          'Menunjukkan dedikasi dan etos kerja tinggi yang membuka peluang promosi ke posisi Sales Promotion Boy.',
          'Berkontribusi menciptakan lingkungan toko yang bersih dan nyaman bagi pelanggan dan staf.'
        ]
      }
    ]
  }
];

export const HARD_SKILLS: HardSkill[] = [
  {
    name: 'Microsoft Office (Word, Excel, PPT)',
    level: 90,
    category: 'Productivity & Office',
    description: 'Expert dalam rumus Excel (VLOOKUP, XLOOKUP, Pivot Table, IF-Nested), pelaporan Word & presentasi PPT.'
  },
  {
    name: 'SAP Business One',
    level: 85,
    category: 'Enterprise ERP',
    description: 'Pengelolaan modul inventory, purchasing, sales order, serta verifikasi jurnal transaksi ERP.'
  },
  {
    name: 'Audit Internal & SOP Compliance',
    level: 85,
    category: 'Audit & Governance',
    description: 'Penyusunan audit plan, uji kepatuhan operasional, stock opname, dan formulasi rekomendasi audit.'
  },
  {
    name: 'Administrasi & Pembukuan',
    level: 90,
    category: 'Administration',
    description: 'Manajemen arsip dokumen, rekonsiliasi kas, pembuatan invoice, dan pelaporan berkala.'
  },
  {
    name: 'Analisis Data & Reporting',
    level: 80,
    category: 'Data Analytics',
    description: 'Ekstraksi insight bisnis, pemantauan anomali transaksi, dan visualisasi data performa.'
  }
];

export const SOFT_SKILLS: SoftSkill[] = [
  {
    name: 'Teliti & Detail-Oriented',
    iconName: 'SearchCheck',
    description: 'Ketelitian tinggi dalam memeriksa ribuan baris data transaksi dan dokumen fisik tanpa terlewat.'
  },
  {
    name: 'Problem Solving',
    iconName: 'BrainCircuit',
    description: 'Mampu menganalisis akar penyebab ketidaksesuaian sistem dan merumuskan solusi preventif.'
  },
  {
    name: 'Kerja Sama Tim',
    iconName: 'Users',
    description: 'Komunikatif dan mudah beradaptasi dalam kolaborasi lintas divisi audit, sales, dan operasional.'
  },
  {
    name: 'Komunikasi Efektif',
    iconName: 'MessageSquareShare',
    description: 'Mampu menyampaikan temuan audit yang sensitif secara diplomatis, konstruktif, dan jelas.'
  },
  {
    name: 'Manajemen Waktu',
    iconName: 'Clock',
    description: 'Disiplin memenuhi jadwal audit berkala dan deadline laporan tanpa mengorbankan kualitas.'
  },
  {
    name: 'Bekerja Under Pressure',
    iconName: 'Zap',
    description: 'Tetap tenang, fokus, dan produktif menghadapi volume pekerjaan tinggi dan target ketat.'
  }
];

export const STATS = [
  { label: 'Tahun Pengalaman', value: '7+', suffix: 'Tahun', desc: 'Di berbagai sektor industri & korporat' },
  { label: 'Akurasi Rekonsiliasi', value: '99%', suffix: '', desc: 'Dalam audit stok & data finansial' },
  { label: 'Siklus Audit Terselesaikan', value: '100+', suffix: 'Laporan', desc: 'Dokumentasi kepatuhan SOP' },
  { label: 'Aplikasi & Game Dirilis', value: '4+', suffix: 'Proyek', desc: 'Web, Mobile, AI Agent & Realtime Game' },
];

export const PROJECTS: ProjectItem[] = [
  {
    id: 'proj-bgames',
    title: 'B-Games — Multiplayer Board Game Platform',
    tagline: 'Pusat game papan klasik digital multiplayer online bebas iklan dengan arsitektur event-driven realtime.',
    category: 'Game & App',
    badge: 'Board Game Platform',
    description: 'Platform arena game papan klasik modern gratis & bebas iklan: Ludo Classic, Ludo Hexagon (hingga 6 pemain), Ular Tangga 3D, dan Tic-Tac-Toe — dimainkan instan via Web/PWA, Android, & iOS.',
    longDescription: 'B-Games menghadirkan nostalgia permainan papan klasik keluarga ke dalam genggaman digital yang modern, kompetitif, dan bebas iklan. Menggunakan arsitektur event-driven realtime berbasis boardgame.io dan Koa.js WebSocket game server dengan latensi rendah (<50ms), reconnect recovery otomatis, serta Smart Bot AI Anti-AFK takeover jika pemain terputus koneksi. Mendukung Instant Guest Play (masukkan nama tanpa registrasi), sinkronisasi akun Google OAuth & Cloud Save via Supabase PostgreSQL, in-game reactions & emoticon, daftar teman & Friend Chat, leaderboard global, puluhan achievements, dompet koin harian, serta 4 kustomisasi tema visual papan (Wood, Marble, Grass, Sand) beranimasi Skia 60 FPS dan audio haptic realistis.',
    highlights: [
      '4 Game Papan Klasik: Ludo Classic (2-4 Pemain), Ludo Hexagon (Inovasi hingga 6 Pemain), Ular Tangga 3D & Tic-Tac-Toe Duel',
      'Multiplayer Realtime & Smart Anti-AFK: Sinkronisasi WebSockets instan via Koa.js + boardgame.io dengan bot cerdas auto-takeover saat pemain AFK/disconnect',
      'Sistem Akun Hybrid & Cloud Save: Instant Guest Play tanpa daftar + Google OAuth & Supabase PostgreSQL untuk rekor pertandingan',
      'Visual Skia 60 FPS & Audio Haptic: Animasi dadu 3D, 4 tema papan (Wood/Marble/Grass/Sand), in-game reactions, dan efek getaran taktil',
      'Multiplatform & PWA: Berjalan mulus di Web/PWA, Android & iOS dari basis kode terpadu dengan dukungan offline cache'
    ],
    techStack: ['React Native', 'Expo (v57)', 'Expo Router', 'boardgame.io', 'Koa.js / Node.js', 'Supabase (PostgreSQL)', 'Skia & Reanimated', 'TypeScript', 'WebSockets', 'Expo Audio & Haptics', 'PWA'],
    role: 'Solo Creator (Game Logic, UI/UX, Realtime Backend, Deployment)',
    year: '2024 - 2025',
    demoUrl: 'https://bgames.arzhaning.my.id/',
    isFeatured: true,
    colorScheme: 'amber',
    iconType: 'Dice',
    businessCase: {
      problem: 'Permainan papan multiplayer online kerap terganggu koneksi putus (pemain AFK membuat meja macet) dan banyaknya tayangan iklan yang merusak kenyamanan bermain bersama keluarga.',
      solution: 'Arena game digital gratis dan bebas iklan dengan koneksi realtime berlatensi rendah (<50ms) serta Smart Bot AI Anti-AFK yang sigap mengambil alih giliran agar sesi game tetap berlanjut.',
      impact: 'Pengalaman bermain lancar tanpa meja berhenti (zero freeze), latensi responsif, dan kenyamanan bermain murni 100% tanpa gangguan iklan.'
    },
    architectureFlow: [
      'Pilih Meja / Buat Room',
      'Sinkronisasi Realtime WebSocket',
      'Smart Bot Anti-AFK Takeover',
      'Cloud Save & Leaderboard',
      'Animasi Skia 60 FPS & Haptic'
    ]
  },
  {
    id: 'proj-rajendra',
    title: 'Rajendra Pintar (Pintar Ceria Kids) — Platform Edukasi Interaktif & Kuis Ceria',
    tagline: 'Platform edukasi ramah anak usia 4–8 tahun (PAUD, TK, SD) dengan Flashcard dwibahasa, Kuis Suara, Gamifikasi & Full Offline PWA.',
    category: 'Edukasi',
    badge: 'Edukasi Anak (PAUD - SD)',
    description: 'Aplikasi edukasi interaktif ramah anak usia 4–8 tahun dengan kurikulum adaptif 5 usia, 9 kategori tematik, 3 mode belajar (Flashcard TTS dwibahasa ID/EN, Kuis Ceria + Confetti, Petualangan Mini Game Memori), maskot & toko kosmetik lengkap dengan VIP Lifetime via Xendit, sinkronisasi cloud Google, Parent Gate, dan 100% full offline.',
    longDescription: 'Rajendra Pintar (Pintar Ceria Kids) dirancang khusus mendampingi masa emas tumbuh kembang anak usia 4 hingga 8 tahun (PAUD, TK, SD Kelas 1 & 2) secara aman, ceria, dan kid-safe. Dilengkapi kurikulum adaptif 5 tahapan usia dan 9 kategori pengetahuan tematik (Pendidikan Agama Islam, Satwa, Buah & Sayur Sehat, Angka & Matematika Ceria, English Vocab, Bentuk & Warna, Transportasi, Pakaian & Aksesori, Profesi & Cita-cita). Menyajikan 3 mode interaktif: Flashcard Mode dengan Text-to-Speech dwibahasa (ID/EN) & fakta seru, Mode Kuis Ceria dengan semburan Canvas Confetti apresiasi, serta Island Adventure Memory Game. Memiliki 6 maskot hidup penyemangat dan Toko Kosmetik lengkap (13 topi/aksesori, 11 tema visual, bingkai kartu, paket efek suara & sentuhan, musik latar) yang bisa dibuka gratis lewat Bintang harian & iklan reward, dengan opsi upgrade VIP Lifetime dan Bintang Premium via payment gateway lokal Xendit (QRIS/e-Wallet) berikut webhook auto-fulfillment. Login Google opsional (dilindungi Parent Gate) menyinkronkan progres, kosmetik, dan status VIP lintas perangkat via Supabase. Ditutup dengan arsitektur 100% Full Offline via Service Worker PWA dan APK Native Android via Capacitor 8.',
    highlights: [
      'Kurikulum Adaptif 5 Usia (4–8 Tahun) & 9 Kategori Tematik (PAI, Satwa, Buah/Sayur, Matematika, English Vocab, dll.)',
      '3 Mode Belajar: Flashcard Interaktif (TTS dwibahasa ID/EN), Kuis Ceria bergambar + Canvas Confetti, & Island Memory Game',
      '6 Maskot Interaktif & Toko Kosmetik Lengkap: 13 topi/aksesori, 11 tema visual, bingkai kartu, efek suara & sentuhan — dibuka gratis via Bintang/iklan',
      'Monetisasi Adil & Cloud Sync: VIP Lifetime & Bintang Premium via Xendit (QRIS/e-Wallet), sinkronisasi progres lintas perangkat via Google Sign-In & Supabase',
      'Kid-Safe & 100% Full Offline: Parent Gate proteksi orang tua, berjalan tanpa internet via PWA Service Worker Caching & instalasi native Android (.APK) via Capacitor 8'
    ],
    techStack: ['React 19', 'TypeScript ~5.8', 'Vite 6', 'Tailwind CSS v4', 'Motion (v12)', 'Capacitor 8', 'Web Audio API', 'TTS Dwibahasa', 'Canvas Confetti', 'PWA Offline Cache', 'Supabase', 'Xendit', 'Cloudflare CDN'],
    role: 'Full-stack Indie Developer & Content Designer',
    year: '2024 - 2025',
    demoUrl: 'https://rapin.arzhaning.my.id/',
    isFeatured: true,
    colorScheme: 'teal',
    iconType: 'GraduationCap',
    businessCase: {
      problem: 'Anak usia dini rentan terhadap paparan iklan yang tidak aman di internet serta kendala kuota/sinyal saat belajar mandiri di perjalanan atau area minim jaringan, sementara orang tua butuh kepastian transaksi mikro yang aman jika ingin membuka fitur tambahan.',
      solution: 'Aplikasi edukasi ramah anak dengan kurikulum terarah, sistem suara dwibahasa, proteksi Parent Gate, kemampuan berjalan 100% offline, serta model monetisasi transparan (konten edukasi tetap gratis, kosmetik bisa dibuka gratis via Bintang/iklan, dan opsi VIP Lifetime/Bintang Premium lewat payment gateway lokal Xendit yang tepercaya).',
      impact: 'Ruang belajar yang aman dan bebas risiko konten luar, hemat kuota internet 100% berkat mode offline, engagement anak meningkat lewat gamifikasi toko kosmetik, dan kepercayaan orang tua terjaga berkat transaksi Xendit yang jelas dan Parent Gate di setiap akses sensitif.'
    },
    architectureFlow: [
      'Pilih Tingkat Usia & Materi',
      'Flashcard TTS Dwibahasa & Kuis Ceria',
      'Toko Kosmetik, VIP & Xendit Checkout',
      'Cloud Sync via Google Sign-In & Supabase',
      'PWA Offline Cache & Parent Gate'
    ]
  },
  {
    id: 'proj-assets',
    title: 'Assets DEMO — Sistem Manajemen & Inventaris Aset Modern',
    tagline: 'Solusi all-in-one pelacakan aset, penyusutan depresiasi otomatis & audit inventaris multi-cabang (Klien: PT Global Multiparts).',
    category: 'Web App',
    badge: 'Client Project',
    client: 'PT Global Multiparts',
    description: 'Sistem manajemen aset korporat multi-platform (Web/PWA, Android, iOS) berbiaya server nol dengan pemindai QR/Barcode, kalkulasi depresiasi garis lurus otomatis, multi-foto kompresi cerdas, offline queue, dan ekspor laporan Excel/PDF.',
    longDescription: 'Assets DEMO dikembangkan untuk menjawab tantangan audit dan pelacakan siklus hidup aset fisik di PT Global Multiparts yang tersebar di berbagai unit/cabang. Mengusung arsitektur Serverless Zero Server Cost berbasis Google Apps Script, Google Sheets, dan Google Drive, sistem ini mendigitalisasi pelacakan kondisi barang, pemindaian label QR/Barcode kamera fisik via Expo Camera, kalkulasi depresiasi otomatis metode garis lurus (Straight-Line Depreciation) per bulan, dokumentasi multi-foto terkompresi otomatis, audit log mutasi wajib alasan, mode antrian offline (Offline Queue) anti-tindih, ekspor laporan resmi PDF & Excel (.xlsx) otomatis ke email pimpinan, reminder jatuh tempo servis/garansi berkala, serta keamanan role Admin/User dengan single active session dan enkripsi kata sandi bersalt. Versi publik yang dapat dicoba adalah "Assets Demo" dengan data simulasi aman demi privasi korporat.',
    highlights: [
      'Client Case PT Global Multiparts: Didevelop presisi menjawab kebutuhan audit SOP, pelacakan mutasi & stock opname aset multi-cabang',
      'Arsitektur Serverless Zero Server Cost: Ditenagai Google Apps Script, Google Sheets DB, & Google Drive Storage — 100% data milik perusahaan tanpa biaya sewa server bulanan',
      'Scan QR & Barcode Kamera: Expo Camera membaca label fisik secara instan di lapangan dan membuka lembar detail tanpa ketik manual',
      'Depresiasi Garis Lurus Otomatis: Nilai buku menyusut otomatis per bulan, auto-lock nilai residu saat disposed, dan sinkronisasi massal 1 klik',
      'Offline Queue & Conflict Prevention: Bekerja lancar di area minim sinyal gudang, auto-sync saat online, dan proteksi anti-tindih data 2 lapis',
      'Dokumentasi Multi-Foto Cerdas: 2 slot foto resolusi tinggi dengan kompresi otomatis hemat kuota, plus ekspor laporan resmi PDF/Excel kirim email'
    ],
    techStack: ['React Native', 'Expo Router', 'NativeWind', 'Tailwind CSS', 'Google Apps Script', 'Google Sheets DB', 'Google Drive Storage', 'Expo Camera', 'Shopify FlashList', 'OneSignal', 'PWA'],
    role: 'Full-stack Developer & Solution Architect',
    year: '2026',
    demoUrl: 'https://assets.arzhaning.my.id/',
    isFeatured: true,
    colorScheme: 'indigo',
    iconType: 'FileSpreadsheet',
    businessCase: {
      problem: 'Proses stock opname manual dan kalkulasi penyusutan aset fisik multi-cabang rawan selisih data, serta biaya sewa server konvensional membebani anggaran operasional.',
      solution: 'Platform manajemen aset terpadu berbasis scan QR/Barcode kamera, kalkulasi depresiasi otomatis per bulan, dan arsitektur Serverless memanfaatkan ekosistem cloud internal yang ada.',
      impact: 'Audit aset lebih cepat dan transparan, nilai buku selalu akurat dan siap audit kapan saja, serta efisiensi anggaran dengan biaya sewa server Rp0/bulan.'
    },
    architectureFlow: [
      'Scan QR / Barcode Kamera',
      'Validasi Data & Offline Queue',
      'Serverless Logic Engine',
      'Google Sheets DB & Drive Storage',
      'Ekspor Laporan PDF/Excel & Audit Trail'
    ]
  },
];

export const TECH_STACK_GROUPS: TechStackGroup[] = [
  {
    category: 'AI & Multi-Agent Systems',
    items: ['Google Antigravity Agent (Interactions API)', 'Gemini 3.8/3.7/3.5 Flash', 'Gemma 4 Fallback', 'Vector Embeddings (Semantic FAQ)', 'SSE Realtime Streaming', 'Audio STT & TTS Normalization']
  },
  {
    category: 'Cross-Platform, Game & Mobile',
    items: ['React Native & Expo (v57 / Router)', 'boardgame.io (Realtime State)', 'Capacitor 8 (Android Native)', 'WebSockets & Koa.js', 'Skia & Reanimated (60 FPS)', 'Shopify FlashList', 'PWA Offline Cache']
  },
  {
    category: 'Modern Frontend & UI Engineering',
    items: ['React 19 / Vite 6', 'TypeScript', 'Tailwind CSS v4 & NativeWind', 'Motion (Framer Motion v12)', 'Canvas Confetti', 'Web Audio API & Speech TTS', 'Lucide React', 'Semantic HTML5 / SEO']
  },
  {
    category: 'Backend, Serverless & Databases',
    items: ['Serverless Engine (Google Apps Script - Zero Server Cost)', 'Supabase (PostgreSQL Enterprise)', 'Node.js / Koa Server', 'Google Sheets DB & Drive Storage', 'Xendit Payment Gateway', 'Vercel Serverless & Cloudflare CDN', 'RESTful APIs & Offline Queue']
  },
  {
    category: 'Audit, Security & Enterprise Tools',
    items: ['SAP Business One', 'Microsoft Excel (Advanced Formulas, XLOOKUP, Pivot)', 'Straight-Line Depreciation Engine', 'QR / Barcode Hardware Scanner', 'Audit Trail & SOP Compliance', 'Role-Based Access & Salted Hash Auth']
  }
];

export interface ModelOption {
  id: string;
  label: string;
  desc: string;
}

export const AVAILABLE_MODELS: ModelOption[] = [
  { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash', desc: 'Default • paling modern & cepat' },
  { id: 'gemini-3.7-flash', label: 'Gemini 3.7 Flash', desc: 'Advanced, latensi rendah' },
  { id: 'gemini-3.6-flash', label: 'Gemini 3.6 Flash', desc: 'Seimbang speed & kualitas' },
  { id: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash', desc: 'Stabil & efisien' },
  { id: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash-Lite', desc: 'Ultra hemat kuota' },
  { id: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash-Lite', desc: 'Fallback paling stabil' },
];