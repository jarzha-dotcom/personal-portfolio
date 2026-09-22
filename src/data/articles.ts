// Artikel untuk halaman /artikel (index) dan /artikel/:slug.
//
// Aturan pakai:
//  - `slug` dipakai di URL (/artikel/<slug>), jangan diubah setelah
//    dipublikasikan — itu akan memutus link yang sudah dibagikan/diindeks.
//  - `body` diisi paragraf demi paragraf (array string). Boleh kosong
//    selama draft — halaman akan menampilkan `excerpt` saja sebagai preview.
//  - `published` baru diubah ke true setelah body lengkap dan sudah dibaca
//    ulang. Selama false, artikel tidak muncul di index maupun bisa diakses
//    langsung lewat URL-nya (lihat ArticlePage/ArticlesIndexPage).
//  - Artikel #8 (panduan aplikasi edukasi anak) sengaja TIDAK dimasukkan di
//    sini — audiensnya orang tua, beda dari audiens jasa dev di situs ini.

export interface ArticleBlock {
  // Opsional — kalau diisi, dirender sebagai subheading sebelum paragrafnya.
  heading?: string;
  paragraphs: string[];
}

export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readMinutes: number;
  body: ArticleBlock[];
  published: boolean;
}

export const ARTICLES: Article[] = [
  {
    slug: 'cara-kerja-sistem-aset-pt-gmp',
    title: 'Cara Kerja Sistem Manajemen Aset PT Global Multiparts',
    excerpt:
      'Bedah teknis arsitektur serverless di balik Assets DEMO — dari stock opname manual yang rawan selisih, sampai audit yang bisa dicek kapan saja.',
    category: 'Studi Kasus',
    readMinutes: 4,
    body: [
      {
        paragraphs: [
          'PT Global Multiparts punya aset fisik yang tersebar di berbagai unit dan cabang — dari mesin, peralatan, sampai inventaris kantor. Sebelumnya, pendataan aset ini dilakukan manual: stock opname jalan sendiri-sendiri per cabang, kalkulasi penyusutan dihitung terpisah, dan hasilnya sering selisih antara catatan dengan kondisi fisik di lapangan. Waktu tim audit butuh laporan, tidak ada satu sumber data yang bisa langsung dipercaya.',
          'Sistem yang dibangun untuk PT GMP — dinamai Assets DEMO di versi publiknya — dirancang untuk menutup celah itu: satu sistem yang mencatat kondisi aset, menghitung penyusutan otomatis, dan bisa diaudit kapan saja, tanpa menambah beban biaya server bulanan.',
        ],
      },
      {
        heading: 'Kenapa Bukan Server Sendiri?',
        paragraphs: [
          'Opsi paling umum untuk sistem seperti ini adalah backend custom di atas server sendiri (VPS, cloud hosting, dsb). Tapi itu berarti biaya sewa server bulanan yang harus dianggarkan terus-menerus, plus maintenance server itu sendiri — sesuatu yang membebani anggaran operasional untuk kebutuhan yang sebenarnya tidak butuh skala besar.',
          'Assets DEMO dibangun di atas arsitektur Serverless Zero Server Cost — Google Apps Script sebagai logic engine, Google Sheets sebagai database, dan Google Drive sebagai penyimpanan foto/dokumen. Ekosistem ini sudah ada dan dipakai banyak perusahaan lewat akun Google Workspace mereka, jadi tidak ada biaya sewa server tambahan sama sekali. Datanya pun 100% ada di infrastruktur milik perusahaan sendiri, bukan di server pihak ketiga yang harus dipercaya begitu saja.',
        ],
      },
      {
        heading: 'Alur Sistem, dari Scan sampai Laporan',
        paragraphs: [
          'Alur kerjanya mengikuti lima tahap. Pertama, petugas lapangan scan label QR atau barcode fisik yang tertempel di aset, lewat kamera di aplikasi (pakai Expo Camera) — tanpa perlu ketik manual ID aset satu per satu.',
          'Kedua, data yang di-scan divalidasi. Kalau lokasi sedang minim sinyal (misalnya di gudang), data masuk ke Offline Queue dulu — sistem tetap bisa dipakai tanpa koneksi internet, dan otomatis sinkron begitu sinyal kembali. Ada proteksi anti-tindih dua lapis supaya data dari beberapa petugas yang scan aset yang sama tidak saling menimpa.',
          'Ketiga, data masuk ke Serverless Logic Engine (Google Apps Script) yang menjalankan semua logika bisnis: kalkulasi depresiasi, validasi role akses, sampai audit trail.',
          'Keempat, hasilnya tersimpan di Google Sheets sebagai database utama dan Google Drive untuk penyimpanan foto/dokumen pendukung.',
          'Kelima, dari data yang sudah rapi itu, laporan resmi dalam format PDF dan Excel bisa diekspor otomatis dan dikirim ke email pimpinan — tanpa perlu rekap manual lagi.',
        ],
      },
      {
        heading: 'Fitur yang Menjawab Masalah Nyata di Lapangan',
        paragraphs: [
          'Depresiasi dihitung otomatis pakai metode garis lurus (Straight-Line Depreciation) per bulan — nilai buku aset menyusut sendiri sesuai jadwal, nilai residunya otomatis terkunci begitu aset dinyatakan disposed (tidak dipakai lagi), dan seluruh aset bisa disinkronkan ulang cuma dengan satu klik.',
          'Setiap foto dokumentasi dikompres otomatis supaya tidak boros kuota data maupun storage — penting untuk petugas yang kerja dari lokasi dengan koneksi terbatas. Setiap mutasi aset (pindah lokasi, ganti kondisi, dsb) wajib disertai alasan, jadi audit trail-nya lengkap dan bisa ditelusuri kapan saja.',
          'Untuk sisi keamanan, sistem membatasi satu sesi aktif per akun (single active session) dan kata sandi disimpan dengan hash bersalt — jadi satu akun tidak bisa dipakai login bersamaan di banyak perangkat tanpa terdeteksi.',
        ],
      },
      {
        heading: 'Batasan yang Perlu Diketahui',
        paragraphs: [
          'Pendekatan serverless berbasis Google Apps Script ini paling pas untuk skala operasional kecil-menengah — bukan untuk trafik sangat tinggi dengan ribuan transaksi bersamaan setiap detik. Google Apps Script punya batas kuota eksekusi harian, jadi kalau volume data dan penggunanya jauh lebih besar dari kebutuhan multi-cabang seperti PT GMP, arsitektur berbasis server/database khusus akan lebih cocok. Untuk kasus PT GMP sendiri, batasan ini belum jadi masalah karena skala operasionalnya memang pas dengan pendekatan ini.',
        ],
      },
      {
        heading: 'Hasilnya',
        paragraphs: [
          'Dengan sistem ini, audit aset jadi lebih cepat dan transparan — nilai buku selalu akurat dan siap diperiksa kapan saja, tanpa perlu rekonsiliasi manual dulu. Dari sisi anggaran, biaya sewa server tetap Rp0 per bulan, karena semuanya berjalan di atas ekosistem cloud yang sudah dipakai perusahaan.',
          'Versi publik dari sistem ini — Assets Demo, dengan data simulasi demi menjaga privasi data PT Global Multiparts — bisa dicoba langsung untuk melihat bagaimana alur kerjanya secara nyata.',
        ],
      },
      {
        heading: 'Kalau Bisnismu Punya Masalah Serupa',
        paragraphs: [
          'Pola ini tidak cuma berlaku untuk manajemen aset — prinsip yang sama (memanfaatkan ekosistem cloud yang sudah ada alih-alih membangun infrastruktur baru dari nol) bisa dipakai untuk berbagai proses bisnis lain yang masih manual dan rawan selisih data. Kalau bisnismu punya masalah pendataan atau pelacakan yang serupa, ini bisa jadi bahan diskusi awal yang gratis, tanpa kewajiban order.',
        ],
      },
    ],
    published: true,
  },
  {
    slug: 'kenapa-google-apps-script-untuk-klien-kecil-menengah',
    title: 'Kenapa Saya Pilih Google Apps Script Ketimbang Server Sendiri untuk Klien Kecil-Menengah',
    excerpt:
      'Alasan biaya dan maintenance di balik keputusan arsitektur untuk klien dengan budget terbatas — lengkap dengan kapan pendekatan ini TIDAK cocok dipakai.',
    category: 'Teknis',
    readMinutes: 5,
    body: [],
    published: false,
  },
  {
    slug: 'arsitektur-multiplayer-real-time-b-games',
    title: 'Arsitektur Multiplayer Real-Time di B-Games',
    excerpt:
      'Bagaimana sinkronisasi giliran pemain di Ludo dan Ular Tangga dibangun tanpa lag, dan cara menangani pemain yang tiba-tiba disconnect.',
    category: 'Teknis',
    readMinutes: 7,
    body: [],
    published: false,
  },
  {
    slug: 'berapa-lama-bikin-website-aplikasi-bisnis-kecil',
    title: 'Berapa Lama Bikin Website/Aplikasi untuk Bisnis Kecil? Ini Rincian Prosesnya',
    excerpt:
      'Rentang waktu realistis per jenis proyek, faktor yang mempercepat atau memperlambat, dan alur kerja langkah demi langkah.',
    category: 'Panduan',
    readMinutes: 5,
    body: [],
    published: false,
  },
  {
    slug: '5-pertanyaan-sebelum-pakai-jasa-developer-freelance',
    title: '5 Pertanyaan yang Harus Ditanyakan Sebelum Pakai Jasa Developer Freelance',
    excerpt:
      'Dari siapa yang pegang kode sampai apa yang terjadi kalau developer hilang kontak di tengah jalan — dijawab lewat cara kerja saya sendiri.',
    category: 'Panduan',
    readMinutes: 6,
    body: [],
    published: false,
  },
  {
    slug: 'custom-chatbot-vs-chatbot-template',
    title: 'Custom Chatbot vs Chatbot Template: Mana yang Cocok untuk Bisnis Kamu?',
    excerpt:
      'Perbandingan biaya jangka panjang dan kapan logika bisnis spesifik butuh solusi custom, bukan sekadar template siap pakai.',
    category: 'Panduan',
    readMinutes: 5,
    body: [],
    published: false,
  },
  {
    slug: 'web-app-vs-mobile-app-vs-pwa',
    title: 'Perbedaan Web App, Mobile App, dan PWA — Mana yang Kamu Butuhkan?',
    excerpt:
      'Penjelasan sederhana tanpa jargon, plus pertanyaan panduan untuk menentukan mana yang paling cocok dengan kebutuhan bisnismu.',
    category: 'Panduan',
    readMinutes: 6,
    body: [],
    published: false,
  },
];

export const getArticleBySlug = (slug: string): Article | undefined =>
  ARTICLES.find((a) => a.slug === slug && a.published);