// Isi artikel untuk pilar "panduan-bisnis" (satu file per pilar, dimuat lazy).
// Metadata (judul, excerpt, kategori, dll.) ada di ../articles.ts.
// Key = slug artikel. Artikel baru di pilar ini: tambahkan entri baru di bawah.
import type { ArticleBlock } from '../articles';

export const bodies: Record<string, ArticleBlock[]> = {
  'web-app-vs-mobile-app-vs-pwa': [
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
  'kenapa-harga-proposal-bisa-beda-beda': [
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
        'Prinsip yang sama yang saya pakai di DevRAB, mesin proposal di balik Zannah: biaya jasa dipisahkan dari biaya infrastruktur, margin risiko dicantumkan terang-terangan, dan setiap proposal membawa SOW lengkap dengan batas in-scope dan out-of-scope. Selengkapnya ada di artikel "Mengenal DevRAB".',
      ],
    },
  ],
  '5-pertanyaan-sebelum-pakai-jasa-developer-freelance': [
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
  'berapa-lama-bikin-website-aplikasi-bisnis-kecil': [
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
};
