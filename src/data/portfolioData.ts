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
  email: 'Jarzha@gmail.com',
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
  { label: 'Tahun Pengalaman', value: '7+', suffix: 'Tahun', desc: 'Di berbagai sektor industri' },
  { label: 'Akurasi Rekonsiliasi', value: '99%', suffix: '', desc: 'Dalam audit stok & data finansial' },
  { label: 'Siklus Audit Terselesaikan', value: '100+', suffix: 'Laporan', desc: 'Dokumentasi kepatuhan SOP' },
  { label: 'Aplikasi / Game Dirilis', value: '3', suffix: 'Proyek', desc: 'Web, Mobile & Audit Tools' },
];

export const PROJECTS: ProjectItem[] = [
  {
    id: 'proj-bgames',
    title: 'B-Games — Multiplayer Board Game Platform',
    tagline: 'Pusat game papan klasik digital multiplayer online bebas iklan untuk keluarga & teman.',
    category: 'Game & App',
    badge: 'Board Game Platform',
    description: 'Platform multiplayer interaktif gratis yang menghadirkan 4 game klasik: Ludo Classic, Ludo Hexagon, Ular Tangga, dan Tic Tac Toe — dimainkan langsung dari browser tanpa iklan & tanpa perlu download.',
    longDescription: 'B-Games menghadirkan pengalaman bermain game papan klasik yang dapat dimainkan bersama teman dan keluarga secara gratis dan bebas iklan. Pemain bisa langsung bermain cukup dengan memasukkan nama tanpa perlu mendaftar akun. Tersedia pilihan Login Google opsional untuk menyimpan progres permainan dan statistik antar perangkat. Dibangun menggunakan arsitektur realtime event-driven dengan opsi kustomisasi tema papan (Wood, Grass, Sand, Marble), roll dadu interaktif, serta bot AI cadangan.',
    highlights: [
      '4 Pilihan Game: Ludo Classic, Ludo Hexagon, Ular Tangga, dan Tic Tac Toe',
      'Langsung Main Tanpa Login (Cukup Nama) + Login Google Opsional untuk Cloud Sync',
      'Multiplayer real-time online dengan room code unik & kustomisasi tema papan (Wood/Grass/Sand/Marble)',
      'Aplikasi Web PWA responsif, bebas iklan & animasi token 3D haptic'
    ],
    techStack: ['React Native', 'Expo', 'boardgame.io', 'Node.js/Koa', 'Supabase', 'TypeScript', 'WebSockets', 'PWA'],
    role: 'Solo Creator (Game Logic, UI/UX, Realtime Backend, Deployment)',
    year: '2024 - 2025',
    demoUrl: 'https://bgames.byarzhaning.online/',
    isFeatured: true,
    colorScheme: 'amber',
    iconType: 'Dice'
  },
  {
    id: 'proj-rajendra',
    title: 'Rajendra Pintar — Aplikasi Belajar Flashcard 3D & Kuis Interaktif',
    tagline: 'Aplikasi edukasi anak usia 4–8 tahun (PAUD, TK, SD) dengan Flashcard 3D & Suara Maskot.',
    category: 'Edukasi',
    badge: 'Edukasi Anak (PAUD - SD)',
    description: 'Aplikasi belajar interaktif anak usia 4–8 tahun dengan Flashcard 3D, kuis membaca, berhitung, mengenal hewan, bentuk, warna, dan kosa kata dwibahasa (ID/EN) dilengkapi audio pelafalan ramah anak.',
    longDescription: 'Rajendra Pintar dirancang khusus sebagai ruang belajar digital yang aman, ramah visual, dan bebas iklan untuk anak PAUD, TK, dan SD kelas 1-2. Menggunakan media Flashcard 3D interaktif, kuis tebak suara & gambar, serta modul materi lengkap (angka, matematika dasar, bentuk & warna, buah & sayuran, hewan, anggota tubuh). Dilengkapi splash screen instan dan dukungan offline PWA.',
    highlights: [
      'Flashcard 3D Interaktif & Kuis Ceria (Membaca, Berhitung, Hewan, Bentuk & Warna)',
      'Suara Maskot & Text-to-Speech (TTS) Dwibahasa (Indonesia - Inggris)',
      'Dukungan PWA Offline & Instalasi Mobile via Capacitor tanpa Iklan',
      'UI/UX khusus anak usia 4–8 tahun dengan kontras tinggi & font ramah anak'
    ],
    techStack: ['Vite React', 'TypeScript', 'Tailwind CSS', 'Capacitor', 'Web Audio API', 'PWA', 'Lucide Icons'],
    role: 'Full-stack Indie Developer & Voice Content Designer',
    year: '2024',
    demoUrl: 'https://rajendrapintar.byarzhaning.online/',
    isFeatured: true,
    colorScheme: 'teal',
    iconType: 'GraduationCap'
  },
  {
    id: 'proj-assets-gmp',
    title: 'Assets GMP — Internal Asset Management',
    tagline: 'Sistem manajemen dan pelacakan aset internal perusahaan secara terpusat.',
    category: 'Web App',
    badge: 'Corporate Web App',
    description: 'Aplikasi web untuk mendata, melacak, dan mengelola aset perusahaan secara terpusat, memudahkan proses audit dan inventarisasi di berbagai lokasi.',
    longDescription: 'Dibangun untuk mengatasi tantangan pendataan aset fisik yang tersebar. Menyediakan dashboard real-time, riwayat perpindahan aset, penempelan label/QR code, dan fitur ekspor laporan untuk kebutuhan audit internal yang lebih efisien.',
    highlights: [
      'Dashboard pelacakan kondisi dan lokasi aset secara real-time',
      'Riwayat mutasi dan perpindahan aset terdigitalisasi dengan log audit',
      'Ekspor laporan inventarisasi otomatis dalam format Excel/PDF',
      'Antarmuka responsif untuk kemudahan akses mobile di lapangan'
    ],
    techStack: ['React', 'TypeScript', 'Tailwind CSS', 'Vercel', 'Supabase'],
    role: 'Full-stack Developer',
    year: '2024',
    demoUrl: 'https://assets-gmp.vercel.app/',
    isFeatured: true,
    colorScheme: 'indigo',
    iconType: 'FileSpreadsheet'
  },
];

export const TECH_STACK_GROUPS: TechStackGroup[] = [
  {
    category: 'Game & Mobile Development',
    items: ['React Native', 'Expo', 'boardgame.io', 'Capacitor', 'WebSockets', 'Canvas 2D / Haptic Audio']
  },
  {
    category: 'Frontend & UI Engineering',
    items: ['React / Vite', 'TypeScript', 'Tailwind CSS', 'Lucide Icons', 'Recharts', 'HTML5 / Semantic Web']
  },
  {
    category: 'Backend & Data Persistence',
    items: ['Node.js', 'Koa / Express', 'Supabase', 'PostgreSQL', 'RESTful APIs', 'Cloudflare Pages / Vercel']
  },
  {
    category: 'Audit & Enterprise Tools',
    items: ['SAP Business One', 'Microsoft Excel (Advanced)', 'SheetJS / Data Parsing', 'POS Systems', 'Working Paper Generation']
  }
];