// Artikel untuk halaman /artikel (index) dan /artikel/:slug.
//
// Aturan pakai:
//  -  `slug`  dipakai di URL (/artikel/ <slug >), jangan diubah setelah
//    dipublikasikan — itu akan memutus link yang sudah dibagikan/diindeks.
//  -  `body`  diisi paragraf demi paragraf (array string). Boleh kosong
//    selama draft — halaman akan menampilkan  `excerpt`  saja sebagai preview.
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
  body: ArticleBlock[];
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
    body: [
      {
        paragraphs: [
          'Salah satu keputusan paling awal yang harus diambil sebelum proyek dimulai: dibangun sebagai web app biasa, aplikasi mobile native, atau PWA (Progressive Web App)? Ketiganya sering disamaratakan padahal konsekuensinya beda — dari segi biaya, kecepatan rilis, sampai pengalaman pengguna.',
        ],
      },
      {
        heading: 'Web App Biasa',
        paragraphs: [
          'Web app adalah aplikasi yang cuma bisa diakses lewat browser, tanpa bisa dipasang ke layar utama HP layaknya aplikasi biasa. Cocok untuk kebutuhan yang memang lebih sering diakses dari laptop/PC, atau untuk portal yang aksesnya sesekali saja dan tidak butuh dikenal publik sebagai aplikasi tersendiri.',
        ],
      },
      {
        heading: 'Aplikasi Mobile Native',
        paragraphs: [
          'Aplikasi native dibangun khusus untuk sistem operasi tertentu (Android/iOS) dan didistribusikan lewat Play Store atau App Store. Keunggulannya: performa maksimal, akses penuh ke fitur perangkat (kamera, notifikasi push, sensor), dan bisa berjalan 100% offline tanpa bergantung ke browser sama sekali. Rajendra Pintar misalnya, dirilis sebagai APK Android resmi lewat Capacitor supaya bisa dimainkan offline penuh tanpa kuota internet — penting untuk kasus penggunaan yang memang butuh keandalan offline maksimal.',
          'Konsekuensinya: proses rilis lewat Play Store/App Store butuh waktu review tambahan, dan setiap update besar biasanya perlu dipublikasikan ulang lewat toko aplikasi.',
        ],
      },
      {
        heading: 'PWA — Jalan Tengah yang Sering Jadi Pilihan Terbaik',
        paragraphs: [
          'PWA adalah web app yang "berperilaku" seperti aplikasi native — bisa dipasang ke layar utama HP (Add to Home Screen), bekerja offline lewat Service Worker, dan mendapat notifikasi push, tapi tetap dibangun dan di-deploy seperti website biasa tanpa perlu proses review toko aplikasi. Assets DEMO dan B-Games sama-sama memakai pendekatan ini: satu basis kode yang jalan di web, bisa diinstal di Android maupun iOS, tanpa harus membuat aplikasi terpisah untuk tiap platform.',
          'Trade-off-nya: PWA di iOS masih punya sedikit keterbatasan akses fitur perangkat dibanding aplikasi native murni, meski untuk kebanyakan kebutuhan bisnis hal ini jarang jadi masalah signifikan.',
        ],
      },
      {
        heading: 'Pertanyaan Panduan untuk Menentukan Pilihan',
        paragraphs: [
          'Beberapa pertanyaan yang bisa membantu menentukan arah: apakah pengguna butuh mengakses fitur perangkat yang sangat spesifik (kamera resolusi tinggi, sensor khusus, akses penuh Bluetooth)? Kalau ya, native lebih masuk akal. Apakah anggaran dan timeline terbatas, tapi tetap butuh pengalaman mirip aplikasi di HP? PWA biasanya jawaban paling efisien. Apakah aksesnya memang lebih sering dari komputer dan cuma sesekali dari HP? Web app biasa sudah cukup, tidak perlu dipaksa jadi PWA atau native.',
          'Bukan soal mana yang "lebih canggih" — masing-masing punya tempatnya sendiri. Kalau masih bingung menentukan yang paling pas untuk kebutuhanmu, ini bisa didiskusikan lebih dulu secara gratis sebelum memutuskan arah development.',
        ],
      },
    ],
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
    body: [
      {
        paragraphs: [
          'Wajar kalau bingung membandingkan dua proposal dari developer berbeda yang daftar fiturnya terlihat mirip, tapi harganya bisa selisih jutaan. Selisih itu bukan berarti salah satu asal pasang harga — biasanya ada faktor di balik angka yang tidak langsung kelihatan dari daftar fitur di permukaan.',
        ],
      },
      {
        heading: 'Kompleksitas yang Tersembunyi di Balik Nama Fitur yang Sama',
        paragraphs: [
          'Fitur bernama "integrasi WhatsApp" bisa berarti dua hal yang sangat berbeda: sekadar tombol yang membuka chat WhatsApp biasa, atau integrasi API resmi yang bisa kirim notifikasi otomatis dan menerima balasan terprogram. Fitur bernama "laporan otomatis" bisa berarti tombol export sederhana, atau sistem yang menghitung, memformat, dan mengirim laporan ke email tanpa campur tangan manual. Nama fiturnya sama, tapi kerja di baliknya jauh berbeda — dan itu yang paling sering jadi sumber selisih harga.',
        ],
      },
      {
        heading: 'Pilihan Arsitektur Ikut Menentukan Angka',
        paragraphs: [
          'Sistem yang dibangun di atas arsitektur zero server cost (seperti Google Apps Script) biasanya punya biaya development yang berbeda dibanding sistem dengan database dan server khusus — bukan karena satu lebih murahan, tapi karena kebutuhan skalanya memang berbeda. Sistem dengan kebutuhan concurrency tinggi atau integrasi kompleks ke banyak layanan pihak ketiga (payment gateway, AI, sistem ERP) secara wajar butuh waktu development lebih panjang dibanding sistem pencatatan sederhana.',
        ],
      },
      {
        heading: 'Riset Harga Pasar yang Sebenarnya Dilakukan atau Tidak',
        paragraphs: [
          'Proposal yang disusun dengan riset harga pasar aktual (tarif programmer terkini, harga infrastruktur yang berlaku sekarang) cenderung lebih presisi dibanding proposal dengan angka template yang sudah lama tidak diperbarui. Angka yang "kelihatan murah" kadang justru belum memperhitungkan biaya infrastruktur atau margin risiko yang wajar, dan berpotensi meleset atau menambah biaya tak terduga di tengah proyek.',
        ],
      },
      {
        heading: 'Termin Pembayaran dan Margin Risiko',
        paragraphs: [
          'Struktur pembayaran bertahap (milestone) dan margin risiko (risk contingency) yang dimasukkan ke dalam perhitungan juga memengaruhi angka akhir. Proposal yang mencantumkan margin risiko secara transparan biasanya lebih realistis ketimbang proposal yang terlihat murah di awal tapi rawan biaya tambahan begitu ada kendala tak terduga di tengah pengerjaan.',
        ],
      },
      {
        heading: 'Cara Membandingkan yang Lebih Adil',
        paragraphs: [
          'Daripada membandingkan angka akhir saja, lebih baik minta rincian Scope of Work dari masing-masing proposal — apa saja yang in-scope, apa yang out-of-scope, dan bagaimana biaya infrastruktur dihitung terpisah dari biaya jasa development. Dari situ, perbandingan yang lebih adil bisa dilakukan, bukan cuma berdasarkan angka total yang berdiri sendiri tanpa konteks.',
        ],
      },
    ],
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
    body: [
      {
        paragraphs: [
          'Kabar buruk soal developer freelance yang hilang kontak di tengah proyek, atau baru ketahuan ada biaya tersembunyi setelah sistem jalan, itu bukan cerita langka. Sebelum sepakat kerja sama, ada lima pertanyaan yang sebaiknya ditanyakan lebih dulu — bukan untuk mencurigai, tapi supaya ekspektasi jelas sejak awal.',
        ],
      },
      {
        heading: '1. Siapa yang Memegang Source Code Setelah Selesai?',
        paragraphs: [
          'Ini pertanyaan paling mendasar yang sering terlewat. Beberapa developer atau agensi menahan source code sebagai "jaminan" supaya klien tidak lari ke developer lain untuk maintenance. Cara kerja saya sebaliknya: source code sepenuhnya milik klien begitu proyek selesai dan lunas — termasuk akses penuh ke repository-nya. Tidak ada ketergantungan paksa ke saya untuk maintenance ke depannya, meski tentu saya tetap terbuka membantu kalau dibutuhkan.',
        ],
      },
      {
        heading: '2. Apa yang Terjadi Kalau Developer Hilang Kontak di Tengah Jalan?',
        paragraphs: [
          'Ini risiko nyata di dunia freelance, apalagi kalau developernya tidak jelas identitas dan rekam jejaknya. Pertanyaan yang wajar: apakah ada progres yang bisa diserahterimakan sebagian kalau memang terjadi sesuatu di tengah jalan? Karena source code sudah dipegang klien sejak awal (bukan cuma di akhir proyek), risiko kehilangan total pekerjaan yang sudah dibayar bisa ditekan — progres bisa dilanjutkan developer lain kalau memang terpaksa.',
        ],
      },
      {
        heading: '3. Apa Ada Biaya Tersembunyi di Luar Harga Development?',
        paragraphs: [
          'Beberapa biaya memang wajar terpisah dari biaya development — misalnya biaya sewa server (kalau arsitekturnya bukan zero server cost), biaya API pihak ketiga yang dipakai AI atau payment gateway begitu volume pemakaian melewati kuota gratis, atau biaya domain tahunan. Yang penting bukan apakah ada biaya terpisah ini, tapi apakah developer-nya transparan menjelaskannya sejak diskusi awal — bukan baru muncul sebagai kejutan setelah sistemnya jalan.',
        ],
      },
      {
        heading: '4. Bagaimana Proses Revisi Diatur?',
        paragraphs: [
          'Tanpa kesepakatan jelas soal revisi, gampang muncul kesalahpahaman — klien merasa "kan cuma revisi kecil", developer merasa itu sudah di luar cakupan awal. Cara paling aman adalah dokumen Scope of Work yang mencantumkan jelas apa yang termasuk dalam paket dan apa yang di luar cakupan (out-of-scope), supaya kedua pihak punya acuan yang sama kalau ada perdebatan soal revisi.',
        ],
      },
      {
        heading: '5. Siapa yang Pegang Akses Admin dan Kredensial Setelah Selesai?',
        paragraphs: [
          'Akses ke akun hosting, database, domain, dan kredensial layanan pihak ketiga lainnya sebaiknya diserahkan penuh ke klien setelah proyek selesai — bukan ditahan developer sebagai bentuk "kendali" atas sistem yang sebenarnya sudah dibayar klien. Kalau developer keberatan menyerahkan akses ini tanpa alasan teknis yang jelas, itu tanda yang perlu diwaspadai sejak sebelum kerja sama dimulai.',
        ],
      },
      {
        heading: 'Kesimpulan',
        paragraphs: [
          'Kelima pertanyaan ini bukan soal mencurigai developer secara berlebihan, tapi soal memastikan proyek digitalmu tidak jadi taruhan kalau ada hal tidak terduga terjadi di tengah jalan. Developer yang percaya diri dengan cara kerjanya biasanya justru terbuka menjawab kelima hal ini sejak diskusi pertama, tanpa perlu didesak.',
        ],
      },
    ],
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
    body: [
      {
        paragraphs: [
          '"Berapa lama jadinya?" adalah pertanyaan kedua yang paling sering muncul setelah soal harga. Jawaban jujurnya: tergantung jenis proyeknya — dan variasinya cukup jauh antara landing page sederhana dengan sistem custom yang terhubung ke banyak layanan pihak ketiga.',
        ],
      },
      {
        heading: 'Rentang Waktu per Jenis Proyek',
        paragraphs: [
          'Sebagai gambaran kasar dari pengalaman menangani proyek-proyek sejenis: landing page atau company profile sederhana biasanya selesai dalam 3–7 hari kerja. Website atau aplikasi dengan beberapa halaman dinamis dan form interaktif (tanpa sistem backend kompleks) sekitar 1–2 minggu. Sistem custom dengan database sendiri dan alur kerja spesifik (seperti manajemen inventaris atau approval internal) umumnya 2–4 minggu. Sementara sistem yang butuh integrasi banyak pihak ketiga sekaligus — payment gateway, WhatsApp API, AI chatbot, autentikasi multi-role — bisa memakan waktu 4–8 minggu tergantung kompleksitasnya.',
          'Angka-angka ini bukan janji baku untuk semua kasus — tetap tergantung kejelasan requirement di awal dan seberapa cepat proses review berjalan dari sisi klien.',
        ],
      },
      {
        heading: 'Empat Tahap yang Selalu Dilalui',
        paragraphs: [
          'Setiap proyek melewati empat tahap yang sama: konsultasi kebutuhan (diskusi ide, fitur, dan target pengguna sampai jelas), desain & prototipe (wireframe atau preview interaktif sebelum coding penuh dimulai, supaya arah visualnya disepakati dulu), development & testing (coding, integrasi, dan pengujian menyeluruh), lalu deployment & rilis (deploy ke lingkungan produksi plus pendampingan awal setelah live). Tidak ada tahap yang dilompati, karena masing-masing menentukan kualitas tahap berikutnya.',
        ],
      },
      {
        heading: 'Apa yang Mempercepat Prosesnya',
        paragraphs: [
          'Beberapa hal yang bikin proyek selesai lebih cepat dari estimasi awal: requirement yang sudah jelas dan tertulis sejak konsultasi pertama (bukan berubah-ubah di tengah jalan), respons review yang cepat dari klien di tiap tahap (desain dan hasil development yang menunggu approval lama otomatis memperpanjang timeline keseluruhan), dan jumlah revisi mayor yang terbatas pada yang benar-benar dibutuhkan.',
        ],
      },
      {
        heading: 'Apa yang Memperlambat Prosesnya',
        paragraphs: [
          'Sebaliknya, yang paling sering bikin molor: requirement yang berubah signifikan di tengah development (misalnya fitur baru yang tidak ada di kesepakatan awal), integrasi ke sistem pihak ketiga yang dokumentasinya kurang jelas atau butuh proses approval dari pihak lain (misalnya pengajuan akses API), serta proses review dan approval yang tertunda berhari-hari di sisi klien karena kesibukan lain.',
        ],
      },
      {
        heading: 'Cara Mendapat Estimasi yang Akurat',
        paragraphs: [
          'Estimasi paling akurat tetap didapat lewat konsultasi langsung, bukan tebak-tebakan dari deskripsi singkat. Semakin detail kebutuhan yang disampaikan di awal — termasuk fitur mana yang wajib ada dan mana yang bisa menyusul di fase berikutnya — semakin presisi juga timeline yang bisa dijanjikan.',
        ],
      },
    ],
  },
  {
    slug: 'studi-kasus-devrab-proposal-30-detik',
    title: 'Di Balik Tombol "Buatkan RAB": Bagaimana Zannah Menyusun Proposal dalam Hitungan Detik',
    excerpt:
      'Bukan produk terpisah yang bisa dikunjungi — ini mesin internal di balik chat Zannah yang baru bekerja setelah sistem yakin informasinya cukup.',
    category: 'Teknis',
    readMinutes: 6,
    pillar: 'ai-chatbot-agent',
    published: true,
    publishedAt: '2026-09-22',
    body: [
      {
        paragraphs: [
          'Salah satu momen yang paling sering bikin pengunjung situs saya kaget: lagi ngobrol santai sama Zannah soal ide aplikasi, tiba-tiba muncul tawaran "mau saya buatkan RAB dan proposalnya sekarang?" — dan begitu tombolnya ditekan, dalam hitungan detik muncul dokumen lengkap dengan estimasi biaya, timeline, sampai tombol tanda tangan digital. Fitur ini tidak berdiri sendiri sebagai produk yang bisa dikunjungi lewat tautan demo seperti B-Games atau Assets DEMO — dia murni mesin yang bekerja di balik layar, dipanggil Zannah sendiri, dan namanya sendiri tidak pernah disebut eksplisit ke pengunjung. Yang mereka lihat cuma hasil akhirnya.',
        ],
      },
      {
        heading: 'Zannah Tidak Asal Menawarkan',
        paragraphs: [
          'Sebelum tombol "buatkan RAB" itu muncul, ada pengecekan kesiapan di belakang layar. Sistem menilai apakah percakapan sejauh ini sudah cukup jelas: jenis platform atau proyeknya sudah disebut (web app, mobile app, dashboard, sistem internal, dan sejenisnya), minimal dua sampai tiga kebutuhan konkret sudah dibahas, dan ada indikasi target waktu atau kisaran anggaran yang sudah disinggung. Kalau salah satu dari itu belum jelas, sistem sengaja bersikap ketat dan tidak menawarkan dulu — lebih baik nunggu sampai informasinya cukup, daripada menghasilkan proposal asal-asalan dari obrolan yang masih mentah.',
        ],
      },
      {
        heading: 'Kalau Mesinnya Sedang Bermasalah, Percakapan Tidak Berhenti',
        paragraphs: [
          'Begitu tombol ditekan, permintaan dikirim ke mesin generator dengan mekanisme percobaan ulang otomatis — kalau gagal karena server sibuk atau timeout, sistem mencoba lagi dengan jeda yang makin panjang tiap percobaan, sampai beberapa kali sebelum benar-benar menyerah. Uniknya, begitu topik soal estimasi proyek mulai muncul di percakapan, sistem sudah lebih dulu mengirim "ping" diam-diam ke mesin ini di background — semacam pemanasan awal supaya begitu benar-benar dibutuhkan, mesinnya sudah dalam kondisi siap, bukan baru mulai dari kondisi dingin.',
          'Kalau setelah semua percobaan tetap gagal — server API-nya belum dikonfigurasi, jaringan bermasalah, atau apa pun penyebabnya — sistem tidak menampilkan pesan error ke pengunjung. Zannah tetap menyusun draf estimasi seadanya secara lokal, supaya percakapan tetap punya sesuatu untuk dilanjutkan, bukan berhenti mendadak di tengah jalan.',
        ],
      },
      {
        heading: 'Kenapa Setiap Isi Proposal Harus "Dicuci" Dulu',
        paragraphs: [
          'Karena rincian proposal ini pada akhirnya berasal dari apa yang diketik pengunjung di chat, seluruh isinya diperlakukan sebagai data yang tidak bisa dipercaya begitu saja sebelum ditampilkan sebagai halaman. Setiap teks yang masuk ke dokumen hasil — judul proyek, daftar fitur, dan sebagainya — melewati proses pembersihan karakter berbahaya dulu, dan setiap tautan yang muncul di dokumen divalidasi supaya hanya boleh berupa alamat web yang sah. Detail teknis kecil ini yang mencegah dokumen hasil generate bisa disalahgunakan buat menyisipkan sesuatu yang tidak diinginkan.',
        ],
      },
      {
        heading: 'Kenapa Fitur Ini Sengaja Tidak Dijadikan Produk Terpisah',
        paragraphs: [
          'Tetap menjaga fitur ini sebagai bagian dari alur ngobrol biasa — bukan produk berdiri sendiri yang harus dikunjungi, didaftarkan, atau dipelajari cara pakainya — itu pilihan sadar. Calon klien tidak perlu tahu ada "mesin RAB" di belakang layar; yang mereka rasakan cukup: ngobrol soal ide proyek, dan tanpa diminta secara eksplisit, hasil akhirnya sudah siap dalam bentuk yang bisa langsung ditindaklanjuti. Kompleksitas teknisnya sengaja disembunyikan supaya pengalamannya tetap terasa sesederhana mungkin dari sisi pengunjung.',
        ],
      },
    ],
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
    body: [
      {
        paragraphs: [
          'Salah satu kekhawatiran wajar soal chatbot berbasis AI: bagaimana kalau layanan AI-nya lagi bermasalah atau penuh antrean pas ada pengunjung yang butuh jawaban cepat? Kalau chatbot cuma bergantung ke satu model AI tunggal, jawabannya bisa berhenti total di momen yang salah. Cascade AI System dirancang khusus untuk mencegah situasi itu.',
        ],
      },
      {
        heading: 'Cadangan Bertingkat, Bukan Cuma Satu Rencana',
        paragraphs: [
          'Prinsipnya sederhana: kalau model AI utama sedang mengalami lonjakan antrean trafik di server Google, sistem secara otomatis mengalihkan percakapan ke model AI cadangan dalam hitungan milidetik — tanpa pengunjung menyadari ada perpindahan sama sekali. Salah satu model cadangan yang dipakai adalah Gemma 4, dengan kuota harian yang cukup besar (14.400 permintaan per hari), jadi ada ruang yang luas sebelum kuota itu ikut terlampaui.',
        ],
      },
      {
        heading: 'Lapisan Terakhir: Asisten Lokal yang Tidak Bergantung Internet AI',
        paragraphs: [
          'Yang paling menarik dari sistem ini adalah lapisan terakhirnya. Bahkan kalau koneksi ke seluruh layanan AI Google sedang terputus total, asisten lokal (Radit di website saya) tetap bisa menjawab puluhan pertanyaan umum secara mandiri — karena jawabannya sudah disiapkan dan berjalan tanpa harus memanggil AI eksternal sama sekali. Jadi pengunjung tidak pernah benar-benar mendapat "chatbot mati total", cuma turun tingkat kecerdasan jawabannya di skenario paling buruk.',
        ],
      },
      {
        heading: 'Prinsip yang Sama Juga Dipakai di Fitur Lain',
        paragraphs: [
          'Filosofi "jangan pernah berhenti total, turunkan saja tingkat kecanggihannya" ini bukan cuma dipakai di percakapan biasa. Di fitur pembuatan proposal otomatis misalnya, kalau mesin generatornya gagal dihubungi setelah beberapa kali percobaan ulang, sistem tetap menyiapkan draf lokal seadanya alih-alih menampilkan pesan error ke pengunjung. Prinsip yang sama, diterapkan di lapisan yang berbeda.',
        ],
      },
      {
        heading: 'Kenapa Ini Bukan Sekadar Fitur Tambahan',
        paragraphs: [
          'Untuk chatbot bisnis yang jadi ujung tombak layanan pelanggan 24 jam, downtime di jam sibuk itu setara kehilangan calon pelanggan yang datang tepat saat sistem sedang bermasalah. Cascade system ini yang membuat chatbot tetap bisa diandalkan tanpa harus bayar SLA mahal ke satu provider AI tunggal — arsitekturnya sendiri yang jadi jaring pengamannya.',
        ],
      },
    ],
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
    body: [
      {
        paragraphs: [
          '"AI Agent" makin sering dipakai sebagai istilah pemasaran, sampai sering disamakan begitu saja dengan chatbot biasa. Padahal keduanya bekerja dengan cara yang cukup berbeda — dan bedanya bukan cuma soal seberapa "pintar" jawabannya.',
        ],
      },
      {
        heading: 'Chatbot Biasa: Reaktif, Satu Putaran',
        paragraphs: [
          'Chatbot konvensional bekerja reaktif — kamu kirim pesan, dia balas satu jawaban, selesai. Kalau butuh beberapa langkah (cari data, olah, susun jadi dokumen, kirim), tiap langkah biasanya perlu dipicu manual satu per satu oleh penggunanya, atau alurnya sudah harus disusun kaku sejak awal lewat builder percakapan.',
        ],
      },
      {
        heading: 'Autonomous Agent: Satu Perintah, Banyak Langkah Otomatis',
        paragraphs: [
          'Autonomous Agent yang dipakai di layanan saya berjalan di atas Google Antigravity lewat Interactions API — agent serba-guna yang, dari satu permintaan, bisa bernalar, menjalankan kode, mengelola file, dan menyusun hasil akhirnya sendiri di dalam sandbox aman, tanpa perlu dituntun langkah demi langkah. Bedanya dengan chatbot biasa: satu permintaan bisa memicu rangkaian kerja otonom sampai tugasnya benar-benar selesai, bukan cuma satu balasan teks.',
        ],
      },
      {
        heading: 'Contoh Nyata: Generate Dokumen RAB/Riset Otomatis',
        paragraphs: [
          'Praktiknya di layanan yang saya kembangkan: Autonomous Agent bisa langsung men-generate dokumen RAB atau hasil riset secara instan begitu diminta — bukan sekadar menjawab dengan teks, tapi benar-benar menghasilkan dokumen jadi. Ditambah dengan multi-LLM auto-failover, kalau satu model AI sedang bermasalah, sistem otomatis beralih ke model lain supaya layanan tetap jalan tanpa downtime yang terasa oleh pengguna.',
        ],
      },
      {
        heading: 'Kapan Butuh Agent, Kapan Chatbot Biasa Sudah Cukup',
        paragraphs: [
          'Kalau kebutuhannya sekadar menjawab pertanyaan umum atau menangkap data lead dasar, chatbot biasa sudah lebih dari cukup — lebih murah dan lebih cepat dibangun. Autonomous Agent baru benar-benar dibutuhkan kalau prosesnya melibatkan banyak langkah yang harus dieksekusi sampai tuntas — misalnya menyusun dokumen dari data mentah, mengambil keputusan bertahap, atau menjalankan tugas yang biasanya butuh seseorang duduk mengerjakannya manual.',
        ],
      },
      {
        heading: 'Satu Catatan soal Biaya',
        paragraphs: [
          'Karena agent menjalankan banyak langkah bernalar dalam satu permintaan (bukan satu balasan sederhana), token yang dipakai per interaksi juga lebih banyak dibanding chatbot biasa. Untuk pemakaian skala kecil ini biasanya masih masuk kuota gratis harian dari Google AI Studio; begitu volumenya melewati kuota itu, biaya pay-as-you-go lewat Google Cloud mulai berlaku sesuai pemakaian. Rincian lebih lengkap soal komponen biaya ini ada di artikel "Berapa Biaya Sebenarnya Bikin Chatbot Custom?" — worth dibaca sebelum memutuskan skala fitur agent yang dibutuhkan.',
        ],
      },
    ],
  },
  {
    slug: 'kenapa-4-proyek-saya-pakai-4-arsitektur-backend-berbeda',
    title: '4 Sistem Saya, 4 Arsitektur Backend Berbeda — Ini Alasannya',
    excerpt:
      'Assets DEMO pakai Google Sheets, B-Games pakai Supabase, mesin RAB di balik Zannah pakai Cloudflare + Turso. Bukan karena ikut tren, tapi karena kebutuhannya memang beda.',
    category: 'Teknis',
    readMinutes: 5,
    pillar: 'zero-server-cost',
    published: true,
    publishedAt: '2026-09-19',
    body: [
      {
        paragraphs: [
          'Sering ada yang nanya begini setelah baca artikel saya soal Zero Server Cost pakai Google Apps Script: "kalau gitu semua sistem yang kamu bikin pasti pakai Google Sheets dong?" Jawabannya tidak. Dari beberapa sistem yang saya bangun — baik yang jadi showcase publik maupun yang bekerja diam-diam di balik layar — masing-masing pakai arsitektur database dan hosting yang berbeda. Itu pilihan sadar, bukan karena tidak konsisten.',
        ],
      },
      {
        heading: 'Assets DEMO — Google Sheets & Google Apps Script',
        paragraphs: [
          'Untuk sistem manajemen aset seperti Assets DEMO, kebutuhan utamanya adalah biaya Rp0 per bulan dan kepemilikan data 100% di tangan klien — bukan tersimpan di server pihak ketiga yang harus dipercaya begitu saja. Volume transaksinya pun tidak ekstrem: pencatatan aset, mutasi, depresiasi bulanan — bukan ribuan transaksi bersamaan tiap detik. Google Sheets sebagai database dan Apps Script sebagai logic engine pas untuk profil kebutuhan ini.',
        ],
      },
      {
        heading: 'B-Games — Supabase (PostgreSQL)',
        paragraphs: [
          'B-Games itu cerita yang beda sama sekali. Ada relasi data yang jauh lebih kompleks — profil pengguna, daftar pertemanan, dompet koin, riwayat pertandingan, leaderboard global yang harus di-query dan diurutkan cepat. Ini jenis kebutuhan yang Google Sheets tidak akan sanggup tangani dengan baik begitu datanya membesar — query relasional semacam itu memang wilayahnya database seperti PostgreSQL.',
          'Supabase dipilih karena memberi database PostgreSQL penuh plus autentikasi dan realtime subscription siap pakai, tanpa harus mengelola server database sendiri dari nol.',
        ],
      },
      {
        heading: 'Mesin RAB di Balik Zannah — Cloudflare Edge & Turso',
        paragraphs: [
          'Satu hal yang perlu diluruskan dulu: ini bukan "proyek showcase" seperti dua yang di atas. Tidak ada halaman demo terpisah, tidak muncul di halaman proyek, dan namanya tidak pernah disebut eksplisit ke pengunjung — dia cuma mesin yang dipanggil Zannah di belakang layar saat pengunjung minta dibuatkan RAB. Tapi keputusan arsitekturnya tetap relevan dibahas, karena pertimbangannya beda lagi dari dua sistem di atas.',
          'Mesin ini dipakai dari mana saja tanpa tahu kapan trafiknya datang, jadi latensi akses harus tetap rendah dari kota mana pun. Cloudflare dipilih karena jaringannya tersebar di ratusan pusat data global, dan Turso sebagai database terdistribusi memastikan data proposal dan status pembayaran tersinkron cepat tanpa satu titik kegagalan tunggal.',
        ],
      },
      {
        heading: 'Website Portofolio Utama — Vercel',
        paragraphs: [
          'Untuk situs utama sendiri, trafiknya tidak menentu — bisa sepi, bisa melonjak kalau ada yang membagikan link ke grup atau media sosial. Vercel dengan arsitektur serverless-nya cocok untuk pola ini: fungsi backend cuma aktif dan dikenai biaya saat ada permintaan, bukan biaya flat bulanan yang tetap jalan meski trafiknya nol.',
        ],
      },
      {
        heading: 'Pertanyaan yang Sebenarnya Menentukan Pilihan',
        paragraphs: [
          'Kalau ditarik pola umumnya, ada empat pertanyaan yang saya ajukan sebelum menentukan arsitektur untuk sistem apa pun (termasuk punya klien): seberapa kompleks relasi datanya, seberapa besar toleransi biaya bulanan, siapa yang harus punya kendali penuh atas data, dan seberapa penting sinkronisasi real-time antar banyak pengguna sekaligus. Jawaban dari empat pertanyaan itu yang menentukan arsitekturnya — bukan sekadar ikut tren teknologi yang lagi ramai dibicarakan.',
          'Kalau kamu sedang bingung menentukan arsitektur yang pas untuk kebutuhan bisnismu, ini bisa jadi bahan diskusi awal yang gratis, tanpa kewajiban order.',
        ],
      },
    ],
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
    body: [
      {
        paragraphs: [
          'Salah satu pertanyaan yang paling sering muncul waktu diskusi awal dengan calon klien UMKM: "biaya server per bulannya berapa?" Ini pertanyaan yang wajar — banyak sistem custom yang dijual tanpa menghitung biaya sewa server bulanan yang harus dibayar terus-menerus selama sistemnya dipakai, di luar biaya development awal.',
        ],
      },
      {
        heading: 'Masalah Umum UMKM: Budget Server Bulanan Terasa Berat',
        paragraphs: [
          'Untuk bisnis skala kecil-menengah, biaya sewa VPS atau cloud hosting bulanan — meski kelihatannya kecil per bulan — akan terus menumpuk selama sistem itu dipakai, dan biasanya naik lagi begitu trafik atau datanya bertambah. Belum lagi biaya maintenance server itu sendiri: patch keamanan, backup, monitoring uptime. Untuk bisnis yang belum butuh skala besar, ini pengeluaran rutin yang sebenarnya bisa dihindari.',
        ],
      },
      {
        heading: 'Apa Itu Google Apps Script, dan Kenapa Bisa Gratis',
        paragraphs: [
          'Google Apps Script adalah platform scripting bawaan Google yang bisa "menempel" ke Google Sheets, Google Drive, Gmail, dan layanan Google lain, lalu dijalankan sebagai backend aplikasi. Karena berjalan di infrastruktur Google sendiri, tidak ada server terpisah yang perlu disewa — dan yang lebih penting, layanan ini gratis dipakai baik lewat akun Google biasa maupun akun Google Workspace milik perusahaan.',
          'Google Sheets berperan sebagai database, Google Drive sebagai penyimpanan file, dan Apps Script sebagai "otak" yang menjalankan logika bisnisnya — validasi data, kalkulasi otomatis, sampai kirim email laporan terjadwal. Semua data pun tetap berada di akun Google milik perusahaan sendiri, bukan tersebar di server pihak ketiga yang harus dipercaya begitu saja.',
        ],
      },
      {
        heading: 'Studi Kasus Singkat: PT Global Multiparts',
        paragraphs: [
          'Sistem manajemen aset yang saya bangun untuk PT Global Multiparts memakai pendekatan ini sepenuhnya — Apps Script sebagai logic engine, Sheets sebagai database, Drive untuk penyimpanan foto aset. Hasilnya: biaya sewa server tetap Rp0 per bulan, sementara proses audit aset yang tadinya manual dan rawan selisih sekarang bisa dicek kapan saja lewat satu sumber data yang konsisten.',
        ],
      },
      {
        heading: 'Batasan Jujur: Kapan Pendekatan Ini TIDAK Cocok',
        paragraphs: [
          'Ini bukan solusi ajaib untuk semua skala bisnis. Google Apps Script punya plafon eksekusi per proses dan kuota panggilan layanan harian yang di-reset tiap hari — cukup longgar untuk kebutuhan operasional UMKM sehari-hari, tapi bisa jadi masalah kalau sistemnya harus menangani trafik sangat tinggi, ribuan transaksi bersamaan setiap detik, atau butuh skalabilitas horizontal seperti aplikasi berskala enterprise. Untuk kebutuhan semacam itu, arsitektur server/database khusus tetap jadi pilihan yang lebih tepat, meski biayanya lebih mahal.',
          'Google juga bisa mengubah kebijakan kuota mereka sewaktu-waktu tanpa pengumuman besar — jadi ini bukan pendekatan yang "dijamin selamanya" sama seperti server sendiri yang sepenuhnya di bawah kendali kita. Trade-off ini perlu disadari sejak awal, bukan ditemukan setelah sistem berjalan.',
        ],
      },
      {
        heading: 'Kesimpulan: Cocok untuk Siapa',
        paragraphs: [
          'Pendekatan serverless berbasis Google Apps Script paling masuk akal untuk bisnis kecil-menengah yang butuh mendigitalisasi proses manual (pendataan, approval, laporan berkala) tanpa mau menanggung biaya server bulanan yang terus berjalan, dan yang volume operasionalnya belum berada di level enterprise. Kalau bisnismu masuk kategori itu, ini salah satu opsi paling efisien dari sisi biaya jangka panjang yang bisa didiskusikan.',
        ],
      },
    ],
  },
  {
    slug: 'arsitektur-multiplayer-real-time-b-games',
    title: 'Arsitektur Multiplayer Real-Time di B-Games',
    excerpt:
      'Bagaimana sinkronisasi giliran pemain di Ludo dan Ular Tangga dibangun tanpa lag, dan cara menangani pemain yang tiba-tiba disconnect.',
    category: 'Teknis',
    readMinutes: 7,
    pillar: 'studi-kasus-produk',
    published: true,
    publishedAt: '2026-09-17',
    body: [
      {
        paragraphs: [
          'Game papan multiplayer kelihatannya sederhana — cuma lempar dadu, gerakkan bidak, gantian giliran. Tapi begitu dua pemain atau lebih main di perangkat berbeda secara bersamaan, ada masalah klasik yang harus diselesaikan: bagaimana memastikan kedua layar selalu menampilkan status permainan yang sama persis, dan bagaimana mencegah pemain curang mengubah hasil dadu di perangkatnya sendiri.',
        ],
      },
      {
        heading: 'Kenapa Tidak Bikin WebSocket Sendiri dari Nol',
        paragraphs: [
          'Opsi paling umum untuk real-time adalah bikin server WebSocket custom yang menyiarkan setiap gerakan pemain ke semua klien yang terhubung. Masalahnya, pendekatan ini gampang kena celah kalau tidak hati-hati: state permainan yang seharusnya cuma boleh diubah lewat aturan resmi (giliran siapa, langkah apa yang valid) malah bisa dimanipulasi langsung dari sisi klien kalau validasinya lemah.',
          'B-Games dibangun di atas boardgame.io, mesin permainan papan yang memang dirancang khusus untuk masalah ini. State permainan disimpan dan divalidasi secara otoritatif di server — klien cuma mengirim "niat" langkah (misalnya: "gerakkan bidak A ke petak 14"), lalu server yang memutuskan apakah langkah itu valid berdasarkan aturan permainan, bukan klien yang menentukan sendiri hasilnya.',
        ],
      },
      {
        heading: 'Server Ringan yang Menangani Banyak Room Sekaligus',
        paragraphs: [
          'Di belakang boardgame.io, ada Koa.js sebagai server backend — framework Node.js yang sengaja dipilih karena ringan dan hemat memori dibanding alternatif yang lebih berat. Ini penting karena satu server perlu menangani banyak room permainan sekaligus, masing-masing dengan koneksi WebSocket-nya sendiri, tanpa saling mengganggu performa room lain.',
          'Setiap room punya kode unik yang dibagikan ke teman untuk join — begitu semua pemain masuk, server mulai menyiarkan setiap perubahan state (posisi bidak, hasil dadu, giliran berikutnya) ke semua klien secara nyaris instan.',
        ],
      },
      {
        heading: 'Kalau Ada Pemain yang Tiba-tiba Disconnect',
        paragraphs: [
          'Ini bagian yang sering diremehkan tapi paling penting untuk pengalaman bermain: kalau salah satu pemain kehilangan koneksi di tengah permainan, permainan tidak boleh macet menunggu dia kembali selamanya. B-Games punya mekanisme AFK takeover — begitu server mendeteksi satu pemain tidak merespons dalam waktu tertentu, bot cerdas otomatis mengambil alih girilannya sampai pemain itu kembali online atau permainan selesai.',
          'Pemain lain di room tetap bisa lanjut main tanpa harus menunggu atau membatalkan pertandingan. Begitu pemain yang disconnect kembali, kontrol dikembalikan ke dia secara mulus di giliran berikutnya.',
        ],
      },
      {
        heading: 'Kenapa Responsnya Terasa Instan',
        paragraphs: [
          'Di sisi tampilan, animasi dadu 3D dan pergerakan bidak dirender pakai React Native Reanimated dan Skia — mesin animasi yang jalan di UI thread terpisah dari logika JavaScript utama, jadi animasi tetap mulus 60 FPS meski ada proses lain yang berjalan di background. Kombinasi server otoritatif yang ringan plus animasi yang tidak nge-block ini yang bikin waktu respons antar pemain bisa di bawah 50 milidetik — cepat cukup untuk terasa seperti main di satu papan fisik yang sama.',
        ],
      },
      {
        heading: 'Prinsip yang Bisa Dipakai di Luar Game',
        paragraphs: [
          'Pola "server otoritatif + klien cuma mengirim niat, bukan hasil akhir" ini sebenarnya bukan cuma relevan untuk game. Prinsip yang sama dipakai di sistem apa pun yang butuh beberapa pengguna mengubah data yang sama secara bersamaan tanpa saling menimpa atau bisa dimanipulasi sepihak — misalnya sistem approval multi-user atau update stok real-time. Kalau bisnismu punya kebutuhan sinkronisasi data real-time semacam ini, arsitekturnya bisa didiskusikan lebih lanjut secara gratis.',
        ],
      },
    ],
  },
  {
    slug: 'tanda-waktunya-migrasi-dari-apps-script',
    title: '5 Tanda Bisnismu Sudah Waktunya Migrasi dari Google Apps Script ke Server Sendiri',
    excerpt:
      'Google Apps Script pas untuk skala kecil-menengah, tapi ada titik ketika sistem butuh "naik kelas". Ini tanda-tandanya.',
    category: 'Teknis',
    readMinutes: 3,
    pillar: 'zero-server-cost',
    published: true,
    publishedAt: '2026-09-15',
    body: [
      {
        paragraphs: [
          'Di artikel sebelumnya saya jelaskan kenapa Google Apps Script jadi pilihan efisien untuk sistem klien kecil-menengah — gratis, tanpa biaya server bulanan, dan cukup untuk kebutuhan operasional sehari-hari. Tapi "cukup untuk sekarang" tidak selalu berarti "cukup selamanya". Berikut lima tanda sistemmu sudah mulai kelewat besar untuk pendekatan ini.',
        ],
      },
      {
        heading: '1. Sering Kena Galat "Batas Eksekusi" atau "Kuota Terlampaui"',
        paragraphs: [
          'Google Apps Script punya plafon waktu eksekusi per proses dan kuota panggilan layanan harian yang di-reset tiap hari. Sesekali kena galat ini wajar (biasanya karena proses yang belum dioptimalkan), tapi kalau errornya sudah rutin muncul di jam sibuk — itu tanda beban kerja sistemmu sudah melewati kapasitas yang wajar untuk platform ini.',
        ],
      },
      {
        heading: '2. Data Sudah Mendekati Batas Sel Spreadsheet',
        paragraphs: [
          'Google Sheets sebagai database punya batas jumlah sel — per September 2026 batas ini baru saja dinaikkan jadi 20 juta sel per spreadsheet (dari sebelumnya 10 juta), dihitung dari total semua tab di dalamnya. Terdengar besar, tapi untuk data transaksional yang terus bertambah setiap hari (tiap baris = puluhan kolom), batas ini bisa tercapai lebih cepat dari yang dibayangkan. Kalau kamu sudah mulai memecah data ke banyak spreadsheet cuma supaya tidak kena limit, itu tandanya arsitektur ini sudah dipaksakan.',
        ],
      },
      {
        heading: '3. Butuh Banyak Proses Bersamaan Secara Real-Time',
        paragraphs: [
          'Apps Script pada dasarnya berjalan sekuensial — satu proses harus selesai dulu sebelum proses berikutnya jalan sepenuhnya paralel dalam skala besar. Ini tidak masalah untuk sistem yang dipakai beberapa petugas sekaligus, tapi kalau kebutuhanmu sudah mengarah ke puluhan atau ratusan user menulis data secara bersamaan detik itu juga (misalnya sistem kasir multi-cabang real-time), arsitektur berbasis server dengan database yang memang dirancang untuk concurrency tinggi akan jauh lebih stabil.',
        ],
      },
      {
        heading: '4. Butuh Integrasi Kompleks di Luar Ekosistem Google',
        paragraphs: [
          'Selama kebutuhannya masih di dalam ekosistem Google (Sheets, Drive, Gmail, Calendar), Apps Script sangat efisien. Tapi begitu sistem harus terhubung ke payment gateway, ERP pihak ketiga, atau butuh menerima webhook real-time dari banyak sumber eksternal sekaligus, kamu akan mulai merasa "menambal" keterbatasan platform ini alih-alih benar-benar memakainya sesuai kekuatannya.',
        ],
      },
      {
        heading: '5. Tim Sudah Besar dan Butuh Kontrol Akses Granular',
        paragraphs: [
          'Sheets sebagai database tidak punya sistem role-based access control atau audit log sedetail database khusus. Kalau bisnismu sudah butuh mengatur siapa boleh lihat/edit data sampai level bar is atau kolom tertentu, dengan jejak audit yang lengkap untuk kebutuhan kepatuhan (compliance), itu kebutuhan yang lebih pas dijawab oleh database dan backend yang dirancang untuk itu.',
        ],
      },
      {
        heading: 'Migrasi Bukan Berarti Buang Semua',
        paragraphs: [
          'Kalau satu atau dua tanda di atas mulai terasa, bukan berarti sistemnya harus dibongkar total. Sering kali solusinya hybrid — bagian yang masih ringan tetap di Apps Script, bagian yang sudah berat dipindah ke server/database khusus. Kalau kamu mulai merasakan salah satu tanda ini, itu bisa jadi bahan diskusi awal yang gratis, tanpa kewajiban order.',
        ],
      },
    ],
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
    body: [
      {
        paragraphs: [
          'Pertanyaan yang wajar muncul begitu tahu sistemnya "cuma" pakai Google Sheets dan Drive: apa data bisnis aman disimpan di sana? Jawaban singkatnya — infrastrukturnya sendiri aman, tapi keamanan sebenarnya lebih ditentukan oleh cara akses diatur, bukan oleh platformnya.',
        ],
      },
      {
        heading: 'Fakta soal Infrastrukturnya',
        paragraphs: [
          'Data yang tersimpan di Google Sheets dan Drive dienkripsi baik saat disimpan (at rest) maupun saat berpindah (in transit), berjalan di infrastruktur Google yang sama dipakai jutaan organisasi termasuk perusahaan besar dan instansi pemerintahan lewat Google Workspace. Dari sisi infrastruktur murni, ini bukan penyimpanan "abal-abal" — justru salah satu infrastruktur cloud paling banyak diaudit di dunia.',
        ],
      },
      {
        heading: 'Risiko Sebenarnya: Manajemen Akses, Bukan Infrastruktur',
        paragraphs: [
          'Titik lemah yang paling sering jadi masalah bukan di sisi Google, tapi di sisi pengguna: kata sandi lemah atau dipakai ulang, tidak mengaktifkan verifikasi 2 langkah (2FA), atau — yang paling sering terjadi — file dibagikan dengan pengaturan "siapa saja yang punya link bisa akses" padahal isinya data sensitif. Sistem sekelas apa pun jadi rentan kalau pintu masuknya dibiarkan longgar seperti ini.',
        ],
      },
      {
        heading: 'Fitur yang Sering Terlewat: Version History',
        paragraphs: [
          'Satu keuntungan yang jarang disadari: Sheets dan Drive punya riwayat versi bawaan. Kalau ada data yang tidak sengaja terhapus atau rusak, versi sebelumnya bisa dipulihkan tanpa perlu sistem backup terpisah — sesuatu yang di banyak sistem custom lain justru harus dibangun manual dan sering terlewat.',
        ],
      },
      {
        heading: 'Rekomendasi Praktis',
        paragraphs: [
          'Pakai akun Google Workspace milik perusahaan untuk sistem operasional, bukan akun Gmail pribadi — supaya admin perusahaan bisa mengatur kebijakan keamanan terpusat (2FA wajib, kontrol perangkat, dsb), bukan bergantung ke kebiasaan personal tiap karyawan. Simpan data sensitif di Shared Drive dengan permission spesifik per orang/grup, bukan file di My Drive pribadi yang dibagikan lewat link. Dan aktifkan 2FA di semua akun yang punya akses ke data operasional — ini langkah paling murah dengan dampak keamanan paling besar.',
        ],
      },
      {
        heading: 'Kesimpulan',
        paragraphs: [
          'Pertanyaan yang lebih tepat bukan "apakah Google Sheets/Drive aman", tapi "apakah akses ke datanya dikelola dengan benar". Dengan Workspace, permission yang rapi, dan 2FA aktif, tingkat keamanannya sudah setara dengan yang dipakai banyak sistem korporat. Kalau ada kekhawatiran spesifik soal data bisnismu, itu bisa dibahas langsung di awal diskusi proyek.',
        ],
      },
    ],
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
    body: [
      {
        paragraphs: [
          'Kalau kamu sedang mencari chatbot untuk bisnis, dua pilihan utama yang biasanya muncul: pakai platform chatbot template yang sudah jadi, atau bangun chatbot custom dari nol. Keduanya valid — pertanyaannya bukan "mana yang lebih bagus", tapi "mana yang cocok dengan kebutuhan bisnismu sekarang".',
        ],
      },
      {
        heading: 'Apa Itu Chatbot Template',
        paragraphs: [
          'Chatbot template adalah platform siap pakai seperti Chatfuel atau Tidio — tinggal daftar, susun alur percakapan lewat builder visual (drag-and-drop), dan chatbot langsung bisa dipasang di website atau WhatsApp dalam hitungan jam. Kelebihan utamanya jelas: cepat jalan, tidak perlu developer, dan ada versi gratis atau paket murah untuk mulai.',
          'Platform seperti ini paling pas untuk kebutuhan yang sifatnya generik — jawab FAQ, tangkap lead dasar (nama, email, nomor HP), atau arahkan pengunjung ke halaman tertentu. Kalau alur percakapannya sederhana dan tidak perlu "mikir", template sudah lebih dari cukup.',
        ],
      },
      {
        heading: 'Kapan Custom Lebih Masuk Akal',
        paragraphs: [
          'Masalahnya muncul begitu logika bisnismu tidak lagi sesederhana alur percakapan linear. Beberapa tanda kamu butuh solusi custom: chatbot perlu mengambil atau menulis data ke sistem internal (stok barang, status pesanan, database pelanggan), perlu menghasilkan dokumen otomatis (misalnya draf RAB atau laporan), atau perlu berjalan sebagai agent otonom yang bisa mengeksekusi tugas multi-langkah — bukan sekadar menjawab satu pertanyaan lalu selesai.',
          'Contohnya, layanan AI Chatbot & Virtual Agent yang saya kembangkan sendiri menggabungkan chatbot percakapan 2 arah (teks dan suara) dengan Autonomous Agent yang bisa langsung generate dokumen RAB/riset dan menjalankan alur lead generator lewat WhatsApp. Ini jenis kebutuhan yang tidak bisa disusun lewat builder drag-and-drop platform template — butuh integrasi dan logika yang memang dirancang khusus untuk proses bisnis tersebut.',
        ],
      },
      {
        heading: 'Perbandingan Biaya Jangka Panjang',
        paragraphs: [
          'Platform template biasanya memakai model biaya langganan bulanan yang naik seiring bertambahnya jumlah kontak, percakapan, atau fitur AI yang dipakai — sebagian bahkan sekarang menghitung biaya per percakapan yang dijawab, bukan biaya flat per bulan. Ini masuk akal untuk mulai dengan modal kecil, tapi biayanya bisa terus naik selama chatbot itu dipakai, dan biasanya makin mahal justru waktu bisnismu makin ramai — padahal itu momen yang seharusnya dirayakan, bukan bikin tagihan membengkak.',
          'Chatbot custom sebaliknya: ada biaya development di depan, tapi begitu selesai, sistemnya milik kamu sepenuhnya — tidak ada biaya langganan bulanan ke pihak platform yang terus berjalan selama chatbot dipakai. Break-even point-nya biasanya tercapai justru saat volume penggunaan sudah tinggi, kebalikan dari model langganan yang makin mahal seiring volume naik.',
        ],
      },
      {
        heading: 'Keputusan Berdasarkan Kebutuhan, Bukan Hype',
        paragraphs: [
          '"AI chatbot" sedang jadi kata kunci yang menarik, dan gampang tergoda pakai solusi paling canggih padahal kebutuhannya sebenarnya sederhana. Kalau kamu cuma butuh jawab FAQ dan tangkap lead dasar, chatbot template sudah cukup — tidak perlu custom yang lebih mahal dan lebih lama development-nya.',
          'Tapi kalau chatbot-nya perlu terhubung ke data internal, menjalankan tugas otomatis multi-langkah, atau jadi bagian dari alur kerja yang lebih besar (bukan sekadar widget percakapan di pojok website), di situlah custom mulai lebih masuk akal — baik dari sisi kemampuan maupun biaya jangka panjang. Kalau kamu belum yakin kebutuhanmu masuk kategori yang mana, itu bisa jadi bahan diskusi awal yang gratis, tanpa kewajiban order.',
        ],
      },
    ],
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
    body: [
      {
        paragraphs: [
          'Paket AI Chatbot & Virtual Agent yang saya tawarkan dibanderol "mulai dari Rp1,5jt". Kata "mulai dari" ini bukan basa-basi pemasaran — harga final memang ditentukan lewat diskusi kebutuhan, fitur, dan kompleksitas, bukan angka tetap untuk semua orang. Supaya lebih jelas, ini rincian apa yang termasuk di harga awal dan apa yang bisa mengubahnya.',
        ],
      },
      {
        heading: 'Apa yang Termasuk di Harga Mulai Rp1,5jt',
        paragraphs: [
          'Paket dasarnya mencakup empat komponen: chatbot AI dengan percakapan cerdas, interaksi suara 2 arah (bisa dengar dan bicara, bukan cuma teks), Autonomous Agent untuk tugas otomatis, dan fitur lead generator lewat WhatsApp. Ini bukan sekadar chatbot FAQ — sudah termasuk kemampuan agent yang bisa mengeksekusi tugas, bukan cuma menjawab pertanyaan.',
        ],
      },
      {
        heading: 'Ke Mana Biayanya Mengalir: 4 Tahap Kerja',
        paragraphs: [
          'Setiap proyek — termasuk chatbot — melewati empat tahap: konsultasi kebutuhan (diskusi ide, fitur, target pengguna), desain & prototipe (wireframe dan preview interaktif sebelum coding penuh dimulai), development & testing (coding, integrasi, QA menyeluruh), lalu deployment & rilis (deploy ke server produksi plus maintenance awal). Harga mencakup keempat tahap ini secara end-to-end, dikerjakan langsung tanpa estafet antar tim.',
        ],
      },
      {
        heading: 'Apa yang Bikin Harga Naik dari Angka Awal',
        paragraphs: [
          'Beberapa hal yang biasanya menggeser harga dari estimasi awal: kompleksitas integrasi (misalnya chatbot perlu terhubung ke sistem stok atau database internal, bukan cuma menjawab dari data statis), jumlah channel yang didukung (WhatsApp saja vs WhatsApp + website + Instagram sekaligus), dan revisi mayor tambahan di luar revisi standar yang sudah termasuk dalam pengerjaan. Semakin spesifik logika bisnis yang harus dipahami chatbot, semakin besar juga waktu development-nya.',
        ],
      },
      {
        heading: 'Biaya yang Terpisah dari Development: Pemakaian API',
        paragraphs: [
          'Ini bagian yang penting untuk dipahami di awal: Autonomous Agent yang dipakai berjalan di atas layanan AI Google (Interactions API), dan ada dua jalur pemakaiannya. Lewat Google AI Studio, tersedia kuota gratis harian (free tier) — cukup untuk pemakaian skala kecil atau tahap awal. Begitu volume pemakaiannya melewati kuota gratis itu, atau butuh keandalan setara produksi, jalurnya pindah ke Google Cloud dengan skema pay-as-you-go — biaya dihitung dari token dan tools yang benar-benar dipakai agent saat bekerja, bukan biaya flat bulanan.',
          'Artinya, untuk chatbot dengan volume pemakaian yang masih ringan, biaya API-nya bisa saja Rp0 karena masih di dalam kuota gratis. Begitu bisnisnya makin ramai dan kuota gratis terlampaui, barulah biaya pay-as-you-go mulai berjalan sesuai volume pemakaian nyata. Siapa yang menanggung biaya ini kalau sampai terlampaui, dan di titik volume berapa itu biasanya terjadi untuk skala bisnismu, adalah pertanyaan yang wajar diajukan sejak diskusi awal — bukan sesuatu yang seharusnya baru diketahui belakangan.',
        ],
      },
      {
        heading: 'Cara Menghitung Estimasi Kasar untuk Bisnismu',
        paragraphs: [
          'Semakin sederhana kebutuhannya (satu channel, tanpa integrasi ke sistem internal, alur percakapan standar), semakin dekat harganya ke angka Rp1,5jt. Semakin kompleks (multi-channel, terhubung ke data bisnis, butuh logika khusus), semakin masuk akal untuk mengalokasikan budget lebih. Cara paling akurat tetap lewat konsultasi langsung — gratis dan tanpa kewajiban order — supaya estimasinya sesuai kebutuhan riil, bukan tebak-tebakan dari luar.',
        ],
      },
    ],
  },
  {
    slug: 'cara-kerja-sistem-aset-pt-gmp',
    title: 'Cara Kerja Sistem Manajemen Aset PT Global Multiparts',
    excerpt:
      'Bedah teknis arsitektur serverless di balik Assets DEMO — dari stock opname manual yang rawan selisih, sampai audit yang bisa dicek kapan saja.',
    category: 'Studi Kasus',
    readMinutes: 4,
    pillar: 'studi-kasus-produk',
    published: true,
    publishedAt: '2026-09-05',
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
    body: [],
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
    body: [],
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
    body: [],
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
    body: [],
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
    body: [],
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
    body: [],
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
    body: [],
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
    body: [],
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
    body: [],
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
    body: [],
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
    body: [],
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
    body: [],
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
    body: [],
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
    body: [],
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
    body: [],
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
    body: [],
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
    body: [],
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
    body: [],
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
    body: [],
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
    body: [],
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
    body: [],
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
    body: [],
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
    body: [],
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
    body: [],
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
    body: [],
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