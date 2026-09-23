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
    published: true,
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
  {
    slug: 'kenapa-google-apps-script-untuk-klien-kecil-menengah',
    title: 'Kenapa Saya Pilih Google Apps Script Ketimbang Server Sendiri untuk Klien Kecil-Menengah',
    excerpt:
      'Alasan biaya dan maintenance di balik keputusan arsitektur untuk klien dengan budget terbatas — lengkap dengan kapan pendekatan ini TIDAK cocok dipakai.',
    category: 'Teknis',
    readMinutes: 3,
    published: true,
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
    slug: 'tanda-waktunya-migrasi-dari-apps-script',
    title: '5 Tanda Bisnismu Sudah Waktunya Migrasi dari Google Apps Script ke Server Sendiri',
    excerpt:
      'Google Apps Script pas untuk skala kecil-menengah, tapi ada titik ketika sistem butuh "naik kelas". Ini tanda-tandanya.',
    category: 'Teknis',
    readMinutes: 3,
    published: true,
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
          'Sheets sebagai database tidak punya sistem role-based access control atau audit log sedetail database khusus. Kalau bisnismu sudah butuh mengatur siapa boleh lihat/edit data sampai level baris atau kolom tertentu, dengan jejak audit yang lengkap untuk kebutuhan kepatuhan (compliance), itu kebutuhan yang lebih pas dijawab oleh database dan backend yang dirancang untuk itu.',
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
    published: true,
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
    readMinutes: 3,
    published: true,
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
    readMinutes: 2,
    published: true,
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
    slug: 'apa-itu-autonomous-agent-beda-chatbot-biasa',
    title: 'Apa Itu Autonomous Agent? Beda dengan Chatbot Biasa',
    excerpt:
      'Chatbot menjawab pertanyaan. Autonomous Agent mengerjakan tugas sampai selesai. Ini beda mendasarnya, dan kapan kamu butuh yang mana.',
    category: 'Teknis',
    readMinutes: 2,
    published: true,
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