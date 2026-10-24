// src/data/seoContent.ts
//
// Sumber tunggal TEKS untuk halaman per-tab (/layanan, /tentang, /kontak) —
// dipakai scripts/prerender.ts untuk HTML statis (crawler) dan, di langkah
// berikutnya, komponen React supaya isinya tidak pernah beda antara yang dibaca
// crawler dan yang dilihat pengunjung. Hanya data biasa (tanpa JSX) supaya bisa
// diimpor dari Node.
//
// Isi awalnya disalin PERSIS dari "Semantic Static Shell" + JSON-LD FAQPage di
// index.html dan dari array di Services.tsx. Kalau harga/teks berubah, ubah di
// sini (lalu samakan index.html beranda selama blok statisnya masih manual).

export interface SeoServiceDetail {
  title: string;
  description: string;
  features: string[];
}

export interface SeoServiceOffer {
  name: string;
  /** Harga "mulai dari" dalam rupiah (angka, untuk JSON-LD) */
  priceFrom: number;
  /** Teks harga untuk ditampilkan, mis. "Mulai Rp800.000" */
  priceLabel: string;
  duration: string;
  details: string;
}

export interface SeoWorkflowStep {
  step: string;
  title: string;
  desc: string;
}

export interface SeoFaqItem {
  q: string;
  a: string;
}

/** 4 layanan utama (deskripsi panjang + fitur) */
export const SERVICE_DETAILS: SeoServiceDetail[] = [
  {
    "title": "Game Multiplayer & Board Game",
    "description": "Pembuatan game berbasis web/mobile dengan arsitektur event-driven realtime, lobby room code, reconnect recovery, bot AI adaptif, kustomisasi tema 3D, dan audio synthesizer (seperti B-Games).",
    "features": [
      "WebSockets & Event-Driven",
      "Room Code & Reconnect",
      "Tema 3D & Haptic Audio",
      "Guest + Cloud Auth Sync"
    ]
  },
  {
    "title": "Aplikasi Edukasi & Gamifikasi Interaktif",
    "description": "Pengembangan app edukasi interaktif dengan Flashcard 3D, Text-to-Speech (TTS) natural dwibahasa (ID/EN), kuis suara, gamifikasi bintang reward, dan mode full-offline PWA (seperti Rajendra Pintar).",
    "features": [
      "Flashcard 3D & Kuis Ceria",
      "TTS Dwibahasa Natural",
      "Full Offline PWA Cache",
      "Gamifikasi Bintang & Audio"
    ]
  },
  {
    "title": "Internal Tools & Dashboard Bisnis",
    "description": "Pembuatan web app untuk manajemen inventaris aset, rekonsiliasi data stok vs finansial, otomasi working paper, dan dashboard analitik dengan standar ketelitian 7+ tahun pengalaman di operasional dan audit korporat.",
    "features": [
      "Data Reconciliation 99%",
      "Export Excel/PDF Otomatis",
      "Realtime Audit Log",
      "Standar SOP Korporat"
    ]
  },
  {
    "title": "AI Chatbot & Autonomous Agent",
    "description": "Chatbot AI interaktif 2-arah (Teks & Suara) serta Autonomous Agent (Google Antigravity Interactions API) untuk generate dokumen RAB/Riset instan, lead generator WhatsApp, dan multi-LLM auto-failover.",
    "features": [
      "Antigravity Agent & Tool Calling",
      "Suara 2-Arah (STT + TTS)",
      "Otomasi Dokumen RAB/Riset",
      "Multi-LLM Zero-Downtime"
    ]
  }
];

/** 6 paket layanan dengan estimasi biaya & lama pengerjaan */
export const SERVICE_CATALOG: SeoServiceOffer[] = [
  {
    "name": "Landing Page & Web Profil Bisnis",
    "priceFrom": 800000,
    "priceLabel": "Mulai Rp800.000",
    "duration": "Pengerjaan 1-2 minggu",
    "details": "Desain responsif, SEO-friendly, integrasi WhatsApp otomatis."
  },
  {
    "name": "Company Profile & Web App Sederhana",
    "priceFrom": 2500000,
    "priceLabel": "Mulai Rp2.500.000",
    "duration": "Pengerjaan 2-3 minggu",
    "details": "Fitur multi-halaman, katalog interaktif, dynamic content."
  },
  {
    "name": "AI Chatbot & Autonomous Agent Bisnis",
    "priceFrom": 1500000,
    "priceLabel": "Mulai Rp1.500.000",
    "duration": "Pengerjaan 1-2 minggu",
    "details": "Gemini Interactions API, multi-turn context, custom knowledge base."
  },
  {
    "name": "Web App Custom & Dashboard Operasional",
    "priceFrom": 6000000,
    "priceLabel": "Mulai Rp6.000.000",
    "duration": "Pengerjaan 3-6 minggu",
    "details": "Autentikasi user, database Supabase/PostgreSQL, export Excel/PDF, audit log."
  },
  {
    "name": "Aplikasi Mobile (Android / Cross-Platform)",
    "priceFrom": 6000000,
    "priceLabel": "Mulai Rp6.000.000",
    "duration": "Pengerjaan 3-6 minggu",
    "details": "React Native / Expo / Capacitor PWA, offline cache, notifikasi."
  },
  {
    "name": "Realtime Multiplayer Game & Platform Interaktif",
    "priceFrom": 12000000,
    "priceLabel": "Mulai Rp12.000.000",
    "duration": "Pengerjaan 6-10 minggu",
    "details": "WebSockets, state synchronization, low latency (<50ms), bot AI adaptif."
  }
];

export const WORKFLOW_STEPS: SeoWorkflowStep[] = [
  {
    "step": "01",
    "title": "Konsultasi Kebutuhan",
    "desc": "Diskusi ide, fitur, dan target pengguna"
  },
  {
    "step": "02",
    "title": "Desain & Prototipe",
    "desc": "Wireframe UI/UX dan preview interaktif"
  },
  {
    "step": "03",
    "title": "Development & Testing",
    "desc": "Coding, integrasi, dan QA menyeluruh"
  },
  {
    "step": "04",
    "title": "Deployment & Rilis",
    "desc": "Deploy ke Vercel/Play Store + maintenance"
  }
];

/** Harus sama dengan JSON-LD FAQPage di index.html (Google mewajibkan FAQ terlihat di halaman) */
export const FAQ_ITEMS: SeoFaqItem[] = [
  {
    "q": "Berapa biaya pembuatan website atau landing page?",
    "a": "Landing page 1 halaman mulai dari Rp800.000. Untuk Web Application custom atau dashboard admin mulai dari Rp6.000.000, tergantung kompleksitas fitur dan database."
  },
  {
    "q": "Berapa biaya pembuatan aplikasi mobile Android dan iOS?",
    "a": "Pembuatan aplikasi mobile custom (Android & iOS) mulai dari Rp6.000.000 menggunakan React Native & Expo untuk performa optimal di kedua platform."
  },
  {
    "q": "Berapa lama estimasi waktu pengerjaan proyek?",
    "a": "Landing page memakan waktu 1-2 minggu, Web App / Mobile App 3-6 minggu, dan Game multiplayer 6-10 minggu."
  },
  {
    "q": "Apakah ada garansi maintenance setelah website/aplikasi rilis?",
    "a": "Ya, setiap proyek mendapatkan garansi technical support gratis selama 1 bulan penuh pasca rilis untuk penanganan bug atau kendala teknis."
  },
  {
    "q": "Apakah source code diserahkan 100% ke klien?",
    "a": "Ya, seluruh source code repositori GitHub dan aset proyek diserahkan penuh menjadi hak milik klien tanpa biaya lisensi tersembunyi."
  }
];

export const ABOUT_INTRO =
  "Indie Developer & Data Specialist berpengalaman di Cibitung, Bekasi. Membangun solusi aplikasi web performa tinggi, aplikasi mobile Android/cross-platform, platform game multiplayer realtime, serta integrasi AI Multi-Agent & Chatbot cerdas.";

export const ABOUT_TECH =
  "Kombinasi 7+ tahun pengalaman operasional dan audit korporat (akurasi data 99%, 100+ audit SOP terselesaikan) dengan kapabilitas software engineering modern (React 19, TypeScript, React Native, Expo, Capacitor 8, boardgame.io, Koa.js, Serverless Google Apps Script, Supabase, Tailwind CSS v4, Google Antigravity Agent, AI Multi-LLM, SAP Business One).";

/** Statistik ringkas (dipakai halaman Tentang dan teaser beranda) */
export const ABOUT_STATS = [
  { value: '7+', label: 'Tahun Pengalaman', desc: 'Termasuk disiplin kerja korporat' },
  { value: '3', label: 'Proyek Dirilis', desc: 'Web, mobile & game — live & dipakai user' },
  { value: '15+', label: 'Tech Stack Dikuasai', desc: 'Frontend, backend, hingga deployment' },
  { value: '4', label: 'Tahap Kerja Transparan', desc: 'Dari konsultasi sampai rilis' },
];

/**
 * Jumlah artikel terbaru di beranda — dipakai ArticlesPreview (yang terlihat) DAN
 * scripts/prerender.ts (shell statis + JSON-LD ItemList beranda), supaya jumlah
 * yang dibaca crawler sama dengan yang dilihat pengunjung. Daftar lengkap ada di /artikel.
 */
export const HOME_ARTICLE_LIMIT = 6;

/**
 * 3 paket yang ditampilkan di beranda (sisanya di /layanan): entry-level, AI chatbot
 * (layanan pembeda), dan web app custom. Blok "Layanan" di shell statis index.html
 * harus memuat daftar yang sama.
 */
export const HOME_SERVICES: SeoServiceOffer[] = [SERVICE_CATALOG[0], SERVICE_CATALOG[2], SERVICE_CATALOG[3]];