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
  'checklist-sebelum-konsultasi-pertama-dengan-developer': [
    {
      paragraphs: [
        'Konsultasi pertama dengan developer sering habis untuk hal-hal dasar: sebenarnya mau bikin apa, siapa yang akan memakai, dan kira-kira berapa dana yang tersedia. Semua itu wajar dibahas, tapi kalau kamu datang dengan jawabannya, waktu yang sama bisa dipakai untuk hal yang lebih berharga: menilai pilihan, menimbang risiko, dan menyusun prioritas.',
        'Artikel ini berisi tujuh hal yang layak disiapkan, ditambah template singkat yang bisa langsung disalin. Ini kebalikan dari artikel "5 Pertanyaan yang Harus Ditanyakan Sebelum Pakai Jasa Developer Freelance": di sana soal apa yang perlu kamu tanyakan ke developer, di sini soal apa yang perlu kamu siapkan sebelum bicara. Tidak ada yang wajib sempurna; persiapan setengah jadi pun jauh lebih baik daripada datang dengan tangan kosong.',
      ],
    },
    {
      heading: '1. Tuliskan Masalahnya, Bukan Solusinya',
      paragraphs: [
        '"Saya mau bikin aplikasi" adalah solusi. "Staf gudang butuh dua hari tiap akhir bulan untuk merekap stok dari tiga file Excel" adalah masalah. Developer justru butuh yang kedua, karena dari situ ia bisa menilai apakah yang kamu perlukan memang aplikasi, cukup perbaikan alur kerja, atau sistem yang jauh lebih sederhana dari bayanganmu.',
        'Coba tulis dalam satu atau dua kalimat: siapa yang kesulitan, apa yang sulit, dan seberapa sering terjadi. Kalau bisa, sertakan akibatnya, misalnya waktu terbuang, data yang selisih, atau pelanggan yang harus menunggu.',
      ],
    },
    {
      heading: '2. Sebutkan Jenisnya, Tapi Tidak Apa-apa Kalau Belum Yakin',
      paragraphs: [
        'Developer perlu tahu bentuk produknya: website company profile, toko online, aplikasi mobile, dashboard, atau sistem internal untuk operasional. Pilihan ini ikut menentukan arah teknologi dan biaya. Kalau kamu belum yakin, jangan ditebak. Cukup jelaskan siapa yang akan memakainya dan dari perangkat apa: staf lapangan lewat HP, tim kantor lewat laptop, atau pelanggan umum.',
        'Dari situ pilihan antara web app, aplikasi mobile, atau PWA bisa dibahas bersama. Perbedaan ketiganya sudah saya bahas di artikel "Perbedaan Web App, Mobile App, dan PWA".',
      ],
    },
    {
      heading: '3. Daftar Tiga sampai Lima Kebutuhan yang Konkret',
      paragraphs: [
        'Hindari kata sifat yang tidak bisa diuji seperti "modern", "mudah", atau "lengkap". Pakai kalimat yang menyebut siapa melakukan apa: "staf bisa memindai barcode barang lewat HP", "laporan penjualan terkirim ke email pemilik tiap Senin pagi", "pelanggan bisa membayar lewat QRIS dan statusnya berubah otomatis". Kebutuhan yang konkret bisa langsung dihitung usahanya; yang abstrak hanya menghasilkan perkiraan kasar.',
        'Setelah daftarnya jadi, tandai mana yang wajib ada di versi pertama dan mana yang bagus kalau ada. Pemisahan ini sangat berguna kalau anggaran ternyata lebih kecil dari estimasi: fitur inti dikerjakan dulu, sisanya jadi opsi tahap berikutnya, tanpa harus membuang hal yang benar-benar kamu butuhkan.',
      ],
    },
    {
      heading: '4. Kumpulkan Contoh dan Berkas yang Sudah Ada',
      paragraphs: [
        'Satu foto sering lebih jelas daripada satu halaman penjelasan. Foto formulir kertas yang dipakai sekarang, tangkapan layar file Excel, sketsa tangan di kertas, atau aplikasi lain yang menurutmu "kira-kira seperti itu", semuanya sangat membantu. Jangan khawatir kalau berantakan; coretan tangan pun sudah menghemat banyak pertanyaan. Di chat Zannah, kamu bahkan bisa melampirkan foto, PDF, atau CSV supaya kebutuhannya terbaca langsung.',
        'Kalau ada data lama yang nanti perlu dipindahkan ke sistem baru, sebutkan juga bentuknya (Excel, buku catatan, atau sistem lain) dan perkiraan jumlahnya. Pemindahan data kadang jadi bagian yang paling banyak memakan waktu, dan lebih baik ketahuan sejak awal.',
      ],
    },
    {
      heading: '5. Perkirakan Siapa yang Memakai dan Seberapa Banyak',
      paragraphs: [
        'Jumlah dan kondisi pemakai memengaruhi rancangan lebih dari yang orang kira. Sistem yang dipakai tiga orang admin berbeda kebutuhannya dengan sistem yang diakses ratusan pelanggan bersamaan. Yang berguna disebutkan: kira-kira berapa pengguna, apakah mereka memakainya bersamaan, dari mana mereka bekerja, dan apakah ada lokasi dengan sinyal buruk seperti gudang atau area basement. Jawaban terakhir menentukan perlu tidaknya mode offline, yang jelas memengaruhi rancangan dan biaya.',
        'Perkiraan ini juga menentukan apakah pendekatan hemat biaya seperti Google Apps Script cukup untuk saat ini, dan kapan sebaiknya pindah ke server sendiri, seperti yang saya bahas di artikel soal tanda-tanda waktunya migrasi.',
      ],
    },
    {
      heading: '6. Jujur soal Target Waktu dan Kisaran Anggaran',
      paragraphs: [
        'Ini bagian yang paling sering dihindari, padahal paling berpengaruh. Developer menanyakan kisaran anggaran bukan untuk menghabiskannya, tapi supaya bisa menyusun prioritas yang realistis: apa yang masuk versi pertama dan apa yang ditunda. Tanpa angka sama sekali, usulan bisa meleset jauh ke dua arah, terlalu mewah atau terlalu minimalis.',
        'Kalau belum punya angka, tidak apa-apa. Sebutkan saja "belum tahu" dan minta gambaran rentang untuk proyek sejenis. Hal yang sama berlaku untuk waktu: kalau ada tanggal yang tidak bisa digeser, seperti peluncuran, event, atau awal tahun ajaran, sebutkan dari awal. Rincian soal lamanya proses ada di artikel "Berapa Lama Bikin Website/Aplikasi untuk Bisnis Kecil", dan alasan harga antar-proposal bisa berbeda jauh ada di artikel "Kenapa Harga Proposal Development Bisa Beda-beda".',
      ],
    },
    {
      heading: '7. Siapkan Bagianmu: Materi, Akses, dan Pengambil Keputusan',
      paragraphs: [
        'Proyek sering tertahan bukan karena proses coding-nya, tapi karena menunggu bahan dari sisi klien. Beberapa hal yang sebaiknya sudah jelas siapa pemegangnya: materi seperti logo, teks, dan foto; data awal yang harus dimasukkan; akses ke akun yang diperlukan seperti domain, akun Google, atau akun payment gateway; dan siapa yang berhak memutuskan kalau ada pilihan yang harus diambil.',
        'Itu sebabnya proposal yang disusun lewat DevRAB memuat bagian prasyarat klien, yaitu daftar data atau materi yang harus disiapkan sebelum pengerjaan dimulai. Kalau kamu sudah memikirkannya dari awal, bagian itu tinggal dicentang.',
      ],
    },
    {
      heading: 'Yang Tidak Perlu Kamu Siapkan',
      paragraphs: [
        'Kamu tidak perlu menguasai istilah teknis, memilih bahasa pemrograman atau database, atau punya desain final. Itu bagian developer. Kalau ada developer yang membuatmu merasa harus menguasai jargon dulu supaya dianggap serius, anggap itu informasi tentang developernya.',
      ],
    },
    {
      heading: 'Template Singkat yang Bisa Disalin',
      paragraphs: ['Kalau mau praktis, salin kerangka di bawah ini dan isi sebisanya:'],
      template: [
        'Masalah yang ingin diselesaikan: …',
        'Jenis produk, atau siapa pemakainya dan dari perangkat apa: …',
        'Kebutuhan inti (3 sampai 5 poin): …',
        'Yang bagus kalau ada: …',
        'Contoh atau berkas yang bisa dilampirkan: …',
        'Perkiraan jumlah pemakai dan lokasi kerja: …',
        'Target waktu: …',
        'Kisaran anggaran (boleh "belum tahu"): …',
      ],
    },
    {
      paragraphs: [
        'Kerangka yang sama bisa kamu tempel langsung ke chat Zannah di situs ini. Sebelum menawarkan tombol "Buatkan RAB", Zannah memang menggali tiga hal dari daftar tadi: jenis produknya, minimal dua sampai tiga kebutuhan konkret, dan indikasi target waktu atau anggaran. Makin lengkap jawabanmu di awal, makin cepat sampai ke proposal yang bisa kamu baca dan revisi. Kalau persiapanmu belum lengkap pun tidak masalah; justru untuk itu diskusi awal ada.',
      ],
    },
  ],
  'apa-itu-audit-trail-dan-kenapa-bisnismu-butuh': [
    {
      paragraphs: [
        '"Siapa yang mengubah data ini?" jarang terpikir saat bisnis berjalan lancar, lalu mendadak jadi sangat penting saat ada yang janggal: stok tidak cocok dengan catatan, harga berubah tanpa ada yang ingat memutuskannya, atau sebuah barang ternyata sudah pindah ruangan entah sejak kapan. Di titik itu, fitur yang bisa menjawabnya baru terasa berharga, dan sayangnya sering baru dicari setelah masalahnya terjadi.',
        'Fitur itu disebut audit trail. Artikel ini menjelaskan apa isinya, kenapa jauh lebih bernilai kalau sudah ada sejak awal, dan bagaimana menilai apakah bisnismu membutuhkannya. Saya membahasnya dari dua sisi: sebagai orang yang membangun sistem, dan sebagai orang yang bekerja di bidang audit internal.',
      ],
    },
    {
      heading: 'Apa Itu Audit Trail, dalam Bahasa Sederhana',
      paragraphs: [
        'Audit trail adalah catatan berurutan tentang setiap perubahan penting di dalam sistem: siapa yang melakukan, kapan, apa yang berubah, dan idealnya kenapa. Bayangkan buku tamu yang halamannya tidak bisa disobek: setiap perubahan menambah satu baris baru, bukan menimpa baris yang lama.',
        'Ini berbeda dari sekadar menyimpan data terbaru. Sistem biasa hanya tahu kondisi sekarang: barang ini ada di Ruang B. Sistem dengan audit trail tahu ceritanya: barang ini tadinya di Ruang A, dipindah ke Ruang B oleh orang tertentu pada jam tertentu, dengan alasan tertentu.',
        'Riwayat versi di Google Sheets atau Word memang mencatat siapa dan kapan, tapi tidak menjelaskan alasannya, sulit dicari per barang atau per transaksi, dan tidak dirancang sebagai bukti yang bisa ditunjukkan ke pihak lain.',
      ],
    },
    {
      heading: 'Empat Pertanyaan yang Harus Bisa Dijawab Catatannya',
      paragraphs: [
        'Audit trail yang berguna setidaknya menjawab empat hal. Siapa yang melakukan perubahan. Kapan persisnya, sampai jam. Apa yang berubah, termasuk nilai lama dan nilai barunya, karena tahu bahwa "status diubah" tidak cukup kalau tidak tahu dari apa ke apa. Dan kenapa, bagian yang paling sering dilewatkan.',
        'Alasan adalah unsur yang paling berharga sekaligus paling jarang terisi, karena sistem biasanya tidak mewajibkannya. Padahal tanpa alasan, kamu hanya tahu bahwa sesuatu berubah, bukan apakah perubahan itu wajar. "Dipindah ke gudang cabang karena ruangan direnovasi" dan tidak ada keterangan sama sekali adalah dua hal yang sangat berbeda saat diperiksa enam bulan kemudian.',
      ],
    },
    {
      heading: 'Contoh Nyata: Riwayat Mutasi di Assets DEMO',
      paragraphs: [
        'Di sistem manajemen aset yang saya bahas di artikel "Cara Kerja Sistem Manajemen Aset PT Global Multiparts", setiap perpindahan ruangan, pergantian penanggung jawab, atau perubahan status fisik wajib disertai alasan mutasi. Catatannya menyimpan siapa yang mengubah, jam perubahannya, data lama, dan data baru, dan riwayat itu dicatat permanen. Saat ada audit, internal maupun eksternal, jejaknya tinggal dibuka.',
        'Ada satu pelajaran praktis di sini: riwayat yang terus bertambah akan membuat sistem melambat kalau tidak diurus. Karena itu riwayat mutasi yang sudah lama diarsipkan di latar belakang, sementara pemakaian harian tetap cepat. Audit trail yang baik memikirkan dua hal sekaligus: lengkap untuk diperiksa, ringan untuk dipakai.',
      ],
    },
    {
      heading: 'Tiga Situasi Umum yang Terasa Bedanya',
      paragraphs: [
        'Tanpa audit trail, situasi seperti ini biasanya berakhir dengan saling menuding atau menyerah. Stok di sistem 40, di rak 36, dan tidak ada yang tahu ke mana 4 sisanya. Harga sebuah barang berubah, penjualan minggu itu ikut berubah, dan tidak ada yang ingat siapa yang mengubahnya atau kenapa. Sebuah laptop kantor dipinjam, dipindah, lalu dipinjamkan lagi, dan ketika dicari, tiga orang yakin barangnya ada di orang lain.',
        'Dengan audit trail, ketiganya berubah dari perdebatan menjadi pencarian: buka riwayatnya, urutkan berdasarkan waktu, lihat di titik mana datanya berubah.',
      ],
    },
    {
      heading: 'Apakah Bisnismu Membutuhkannya?',
      paragraphs: [
        'Tidak setiap sistem butuh audit trail selengkap itu. Website company profile jelas tidak. Tapi sebagai pegangan, makin banyak jawaban "ya" untuk pertanyaan berikut, makin kuat alasannya. Apakah ada barang atau uang bernilai yang perlu dipertanggungjawabkan? Apakah lebih dari satu orang bisa mengubah data yang sama? Apakah pernah ada selisih yang tidak bisa dilacak asalnya? Apakah bisnismu bisa diperiksa pihak lain, seperti auditor, pemeriksa pajak, prinsipal, atau pelanggan korporat? Dan apakah ada pergantian orang yang memegang aset atau data secara berkala?',
        'Dua atau tiga jawaban "ya" sudah cukup untuk menjadikannya bagian dari rancangan awal, bukan fitur tambahan.',
      ],
    },
    {
      heading: 'Kenapa Lebih Murah Kalau Ada dari Awal',
      paragraphs: [
        'Alasannya sederhana: audit trail hanya merekam apa yang terjadi setelah ia dipasang. Data bulan-bulan sebelumnya tidak akan punya riwayat apa pun, dan tidak ada cara merekonstruksinya. Menambahkannya belakangan juga berarti menyentuh setiap tempat di aplikasi yang mengubah data, jauh lebih repot daripada merancangnya sejak awal. Biayanya kecil kalau direncanakan, besar kalau ditambal.',
        'Trade-off-nya ada di sisi pemakai: wajib mengisi alasan menambah satu langkah. Ini bisa dibuat ringan, misalnya lewat pilihan alasan yang umum ditambah kolom catatan bebas, supaya staf lapangan tidak merasa terbebani. Yang tidak kalah penting, sampaikan ke tim bahwa tujuannya akuntabilitas dan pelacakan, bukan mencari siapa yang salah.',
      ],
    },
    {
      heading: 'Pertanyaan yang Layak Diajukan ke Developer',
      paragraphs: [
        'Kalau kamu sedang menilai proposal sistem dan fitur ini penting buatmu, beberapa pertanyaan cukup untuk membedakan audit trail yang sungguhan dari yang sekadar tertulis di daftar fitur. Apakah catatannya menyimpan nilai lama dan nilai baru, atau hanya "data diubah"? Apakah catatan itu bisa diedit atau dihapus, dan oleh siapa? Apakah alasan perubahan bisa diwajibkan? Bagaimana riwayat dicari dan ditampilkan, misalnya per aset, per orang, atau per rentang tanggal? Dan berapa lama riwayat disimpan, serta apa yang terjadi saat datanya sudah menumpuk?',
        'Pertanyaan semacam ini melengkapi daftar di artikel "5 Pertanyaan yang Harus Ditanyakan Sebelum Pakai Jasa Developer Freelance".',
      ],
    },
    {
      heading: 'Mulai dari Mana',
      paragraphs: [
        'Kalau bisnismu sudah punya sistem tanpa audit trail, kamu tidak perlu menunggu semuanya dibongkar. Pilih satu tempat yang paling sering bermasalah, misalnya perpindahan aset atau perubahan harga, lalu mulai mencatat di situ. Kalau sedang merencanakan sistem baru, tuliskan kebutuhan ini sejak awal di daftar fitur. Menyebutkannya di chat Zannah akan membuatnya masuk ke cakupan proposal sejak awal, bukan jadi tambahan di tengah jalan.',
      ],
    },
  ],
};