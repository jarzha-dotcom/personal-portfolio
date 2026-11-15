// Isi artikel untuk pilar "bedah-fitur-teknis" (satu file per pilar, dimuat lazy).
// Metadata (judul, excerpt, kategori, dll.) ada di ../articles.ts.
// Key = slug artikel. Artikel baru di pilar ini: tambahkan entri baru di bawah.
import type { ArticleBlock } from '../articles';

export const bodies: Record<string, ArticleBlock[]> = {
  'dari-scan-kamera-ke-data-aset-1-detik': [
    {
      paragraphs: [
        'Saat melakukan stock opname ribuan aset di gudang logistik atau kantor cabang, bayangan umum orang sering kali tertuju pada scanner barcode fisik: alat genggam model pistol (handheld barcode gun) yang dihubungkan dengan kabel melilit atau koneksi Bluetooth ringkih ke laptop operator. Alat industri semacam itu berharga jutaan rupiah per unit, baterainya kerap drop di tengah audit lapangan, butuh dongle USB terpisah, dan membuat staf kerepotan menenteng dua perangkat sekaligus.',
        'Di Assets DEMO—aplikasi manajemen aset korporat yang saya kembangkan untuk PT Global Multiparts—staf lapangan cukup mengeluarkan smartphone mereka sendiri. Cukup arahkan kamera HP ke stiker barcode atau QR code di aset, dan dalam waktu kurang dari 1 detik (bahkan di bawah 100 milidetik), kartu data lengkap aset langsung terbuka di layar. Tidak ada alat khusus yang perlu dibeli, tidak ada setup dongle, dan tim audit bisa langsung bergerak serentak.',
      ],
    },
    {
      heading: 'Kalkulasi Finansial: Handheld Scanner Fisik vs Smartphone Sendiri',
      paragraphs: [
        'Mari hitung aspek ROI (Return on Investment) secara objektif:',
        'Untuk perusahaan dengan 15 staf operasional gudang dan audit, pengadaan barcode scanner industri kelas menengah (seperti Zebra atau Honeywell) berkisar antara Rp3.500.000 hingga Rp5.000.000 per unit. Ditambah biaya docking charger, lisensi driver, dan cadangan unit rusak, total belanja modal (capex) bisa dengan mudah menembus Rp50.000.000 hingga Rp75.000.000 di muka.',
        'Dengan memanfaatkan kamera smartphone yang sudah dikantongi oleh masing-masing staf, biaya hardware baru terpangkas menjadi persis Rp0. Yang dibutuhkan hanyalah arsitektur software cerdas yang mampu memeras performa sensor kamera konsumen biasa agar bekerja secepat scanner laser profesional.',
      ],
    },
    {
      heading: 'Bedah Latensi: Alur Eksekusi dari Frame ke Layar (<100 Milidetik)',
      paragraphs: [
        'Bagaimana kamera HP biasa bisa membuka data aset dalam sekejap tanpa jeda loading? Berikut adalah rincian eksekusi milidetik di balik layar Assets DEMO:',
        '1. Ingestion Frame & Binarization (0–15 ms): Feed video kamera ditangkap pada 30–60 frame per detik. Setiap frame langsung dikonversi ke grayscale dan diproses dengan adaptive thresholding lokal untuk menemukan kontras garis hitam-putih.',
        '2. ZXing Core Matrix Decoding (15–40 ms): Algoritma ZXing (Zebra Crossing) melacak finder pattern QR atau transisi Code-128, lalu mendekodekan matriks piksel menjadi string teks murni (misal: "AST-2026-0891").',
        '3. Frame Debounce Lock & Haptic Trigger (45 ms): Masalah fatal kamera HP adalah pembacaan berulang (burst scan) yang membuat aplikasi macet. Begitu kode terdeteksi, event listener kamera langsung dikunci selama 800ms dan getaran haptic singkat dikirimkan ke tangan staf sebagai konfirmasi fisik.',
        '4. In-Memory SQLite Trie Lookup (50–65 ms): Hasil string decode TIDAK melakukan panggilan HTTP round-trip ke server internet. Aplikasi mencocokkannya langsung ke memori lokal SQLite yang telah terindeks rapi di ponsel.',
        '5. Render Kartu Aset (<85 ms): Foto aset, nomor seri, ruangan penempatan, nama PIC, dan riwayat depresiasi langsung tampil mulus di layar. Total waktu: di bawah 100 milidetik, jauh melampaui standar persepsi "instan" mata manusia.',
      ],
    },
    {
      heading: 'Tantangan Lapangan: Stiker Rusak, Gelap, dan Blind Spot Sinyal',
      paragraphs: [
        'Kondisi lapangan riil tidak pernah seideal meja pengujian kantor. Di lapangan, kami menghadapi tiga tantangan berat yang berhasil diselesaikan lewat software:',
        '• Stiker Tergores & Kusam: Menggunakan standar Reed-Solomon Error Correction pada QR Code. Kode tetap bisa terbaca sempurna meskipun stiker fisik terkelupas atau kotor hingga 15–30%.',
        '• Sudut Gelap & Pantulan Besi: Kami menyematkan tombol toggle senter kamera (torch) langsung di viewport scanner, dipadukan dengan Dynamic Exposure Compensation agar kamera tidak silau saat memindai plat besi mengkilap.',
        '• Blind Spot Sinyal Gudang Bawah Tanah: Assets DEMO dirancang dengan filosofi Offline-First sejati. Seluruh database aset tersinkronisasi di lokal HP. Staf bisa melakukan opname ratusan aset di dalam basement beton tanpa sinyal internet sama sekali. Begitu staf kembali ke area ber-Wi-Fi, seluruh mutasi log tersinkronisasi otomatis ke cloud.',
      ],
    },
    {
      heading: 'Kesimpulan & Nilai untuk Efisiensi Bisnis',
      paragraphs: [
        'Menggantikan ketergantungan perangkat keras mahal dengan optimalisasi algoritma software adalah salah satu cara paling efektif untuk melipatgandakan produktivitas tim operasional.',
        'Ketika proses manual stock opname yang biasanya menyita waktu 3–5 hari kerja dapat dipangkas menjadi hitungan jam dengan perangkat yang sudah ada, efisiensi bukan lagi sekadar slogan—melainkan penghematan operasional nyata yang langsung dirasakan oleh perusahaan.',
      ],
    },
  ],
  'depresiasi-aset-dihitung-otomatis-penjelasan-non-akuntan': [
    {
      paragraphs: [
        'Kalau kamu pernah melihat laporan aset perusahaan, ada satu kolom yang sering bikin dahi berkerut: nilai buku. Harga laptop di nota Rp15.000.000, tapi di laporan tertulis Rp9.000.000. Barangnya sama, belum rusak, kenapa nilainya turun? Jawabannya adalah depresiasi, atau penyusutan.',
        'Banyak pemilik bisnis menganggap ini urusan akuntan dan tidak perlu dipahami. Padahal konsep dasarnya sederhana, dan memahaminya membantumu membaca laporan, menyusun anggaran pengadaan, dan menilai apakah sistem pencatatan asetmu bisa dipercaya. Artikel ini menjelaskan metode paling umum, garis lurus, tanpa jargon.',
      ],
    },
    {
      heading: 'Intinya: Membagi Biaya ke Seluruh Masa Pakai',
      paragraphs: [
        'Saat perusahaan membeli laptop seharga Rp15.000.000, uangnya keluar sekaligus. Tapi laptop itu dipakai bertahun-tahun. Secara akuntansi, lebih adil kalau biayanya dibagi ke seluruh masa pakai, bukan dibebankan semuanya di bulan pembelian. Pembagian biaya itulah depresiasi.',
        'Analoginya seperti membayar langganan tahunan: kamu membayar setahun di muka, tapi manfaatnya dinikmati sedikit demi sedikit setiap bulan. Dengan metode garis lurus, pembagiannya rata: nilai aset berkurang dalam jumlah sama setiap bulan. Disebut garis lurus karena kalau digambar di grafik, nilai buku turun membentuk garis miring lurus dari nilai awal ke nilai akhir.',
      ],
    },
    {
      heading: 'Rumusnya Hanya Tiga Angka',
      paragraphs: [
        'Kamu butuh tiga angka:',
        '1. Harga perolehan: berapa yang dibayar untuk memiliki aset itu dan membuatnya siap dipakai.',
        '2. Nilai residu: perkiraan nilai aset di akhir masa pakainya.',
        '3. Umur ekonomis: berapa lama aset diharapkan bermanfaat bagi perusahaan.',
        'Rumusnya: (harga perolehan dikurangi nilai residu) dibagi umur ekonomis. Kalau umur dihitung dalam bulan, hasilnya adalah penyusutan per bulan.',
      ],
    },
    {
      heading: 'Contoh 1: Laptop Kantor (Angka Ilustrasi)',
      paragraphs: [
        'Sebuah laptop dibeli Rp15.000.000. Nilai residunya Rp3.000.000 dan umur ekonomisnya 4 tahun, atau 48 bulan. Selisihnya Rp12.000.000, dibagi 48 bulan, jadi penyusutannya Rp250.000 per bulan, atau Rp3.000.000 per tahun.',
        'Nilai bukunya dari tahun ke tahun:',
        '• Awal: Rp15.000.000',
        '• Akhir tahun 1: Rp12.000.000',
        '• Akhir tahun 2: Rp9.000.000',
        '• Akhir tahun 3: Rp6.000.000',
        '• Akhir tahun 4: Rp3.000.000 (sama dengan nilai residu, dan tidak turun lagi)',
        'Itu sebabnya angka Rp9.000.000 di laporan tadi masuk akal: laptop itu sudah dipakai dua tahun.',
      ],
    },
    {
      heading: 'Contoh 2: Mesin Produksi dengan Residu Nol (Angka Ilustrasi)',
      paragraphs: [
        'Tidak semua aset punya nilai residu. Misalkan sebuah mesin dibeli Rp60.000.000, diperkirakan tidak bernilai lagi di akhir masa pakainya, dan umur ekonomisnya 5 tahun atau 60 bulan. Penyusutannya Rp60.000.000 dibagi 60, yaitu Rp1.000.000 per bulan.',
        'Setelah 18 bulan, total penyusutannya Rp18.000.000, sehingga nilai bukunya Rp42.000.000. Dengan rumus yang sama dan hanya mengganti tiga angka, kamu bisa menghitung aset apa pun di kantormu.',
        'Angka-angka di atas hanya contoh. Nilai residu, umur ekonomis, dan aturan kapan penyusutan mulai dihitung (penuh sejak bulan pembelian atau mulai bulan berikutnya) ditetapkan berdasarkan kebijakan akuntansi perusahaan, jadi konfirmasikan dengan akuntan atau konsultan pajakmu. Perlu diingat juga bahwa penyusutan untuk pembukuan dan untuk perpajakan bisa memakai aturan masa manfaat yang berbeda, sehingga angka di laporan keuangan belum tentu sama dengan angka di perhitungan pajak.',
      ],
    },
    {
      heading: 'Nilai Buku Bukan Harga Jual',
      paragraphs: [
        'Salah paham yang paling sering: mengira nilai buku sama dengan harga barang kalau dijual. Tidak sama. Nilai buku adalah angka pencatatan berdasarkan jadwal penyusutan, sedangkan harga jual ditentukan pasar.',
        'Aset yang nilai bukunya sudah mencapai residu pun bisa tetap berfungsi dengan baik. Yang dikatakan angka itu hanyalah bahwa biayanya sudah selesai dibagi ke seluruh masa pakai. Sebaliknya, aset dengan nilai buku tinggi bisa saja sudah rusak. Karena itu pencatatan kondisi fisik tetap perlu berjalan berdampingan dengan pencatatan nilai.',
      ],
    },
    {
      heading: 'Kenapa Pemilik Bisnis Perlu Peduli',
      paragraphs: [
        'Ada tiga alasan praktis:',
        '1. Membaca laporan keuangan. Nilai buku dan total aset memengaruhi gambaran kesehatan bisnismu di mata bank, investor, maupun auditor.',
        '2. Merencanakan penggantian. Dengan mengetahui sisa umur ekonomis, kamu bisa memperkirakan kapan aset perlu diganti dan menyiapkan anggarannya, bukan kaget di saat mesin tiba-tiba berhenti.',
        '3. Menjaga keteraturan data. Kalau penyusutan dihitung konsisten, laporan aset bisa dipertanggungjawabkan kapan saja diminta.',
      ],
    },
    {
      heading: 'Kenapa Hitungan Manual di Spreadsheet Rawan Salah',
      paragraphs: [
        'Rumusnya sederhana, tapi di lapangan hitungannya cepat berantakan. Satu spreadsheet menampung ratusan aset dengan tanggal beli, umur, dan residu yang berbeda-beda. Beberapa kesalahan yang paling sering saya temui:',
        '• Rumus bergeser atau tertimpa saat baris disisipkan.',
        '• Aset yang sudah afkir masih terus dihitung penyusutannya.',
        '• Perhitungan lupa diperbarui di akhir bulan.',
        '• Umur ekonomis kategori yang sama diisi berbeda-beda oleh orang berbeda.',
        'Sebagai mantan orang audit internal, saya sering melihat selisih nilai aset yang muncul bukan karena kecurangan, tapi karena rumus yang tidak konsisten. Dan selisih semacam itu memakan waktu lama untuk ditelusuri.',
      ],
    },
    {
      heading: 'Bagaimana Assets DEMO Mengotomatisasinya',
      paragraphs: [
        'Di Assets DEMO, nilai aset menyusut otomatis setiap bulan memakai metode garis lurus, jadi tidak ada yang perlu menghitung ulang di akhir bulan. Saat sebuah aset dinyatakan afkir (disposed), nilai bukunya otomatis dikunci ke nilai residu tanpa penyesuaian manual. Admin juga bisa memperbarui nilai buku seluruh inventaris sekaligus lewat satu tombol sinkronisasi massal.',
        'Hasilnya, pimpinan bisa melihat ringkasan total nilai perolehan berdampingan dengan total nilai buku saat ini dalam hitungan detik, plus estimasi sisa usia produktif aset untuk membantu menyusun anggaran pengadaan berikutnya. Laporan PDF dan nilai buku siap disajikan kapan pun auditor atau direksi memintanya. Aturan hitungnya tetap satu, sehingga semua aset diperlakukan sama. Cara pemindaian label QR di aplikasi yang sama saya bahas di artikel \"Dari Scan Kamera ke Data Aset dalam 1 Detik: Cara Kerja QR/Barcode di Assets DEMO\", dan konteks penerapannya di perusahaan nyata ada di \"Cara Kerja Sistem Manajemen Aset PT Global Multiparts\".',
      ],
    },
    {
      heading: 'Kesimpulan & Refleksi',
      paragraphs: [
        'Depresiasi garis lurus pada dasarnya hanya pembagian rata: biaya aset dibagi ke seluruh masa pakainya. Begitu kamu memegang tiga angka tadi, kamu bisa memeriksa sendiri apakah nilai buku di laporanmu masuk akal.',
        'Coba ambil satu aset dari daftar asetmu, hitung manual dengan rumus di atas, lalu bandingkan dengan angka di laporan. Kalau hasilnya berbeda, itu pertanda bagus untuk mulai bertanya, dan mungkin saatnya mengganti rumus spreadsheet dengan sistem yang menghitungnya secara konsisten.',
        'Untuk melihat bagaimana nilai buku berjalan otomatis, kamu bisa mencoba Assets DEMO di assets.arzhaning.my.id dengan salah satu akun uji coba.',
      ],
    },
  ],
  'anti-afk-bot-di-b-games': [
    {
      paragraphs: [
        'Siapa pun yang pernah bermain papan permainan multipemain di HP pasti pernah mengalami momen menyebalkan ini: permainan sedang seru-serunya di pertengahan jalan, lalu tiba-tiba satu pemain masuk ke lift, menerima telepon masuk, atau sengaja menutup browser karena posisinya terdesak. Tanpa penanganan khusus, tiga atau lima pemain lainnya terpaksa menatap layar yang membeku menunggu giliran orang yang sudah tidak ada di tempat.',
        'Saat merancang B-Games — platform papan permainan kasual real-time yang memuat Ludo Klasik, Ludo Hexagon hingga 6 pemain, Ular Tangga, dan Tic-Tac-Toe — saya menetapkan satu aturan pengalaman pengguna yang tidak boleh ditawar: meja permainan tidak boleh pernah macet hanya karena satu koneksi pemain putus. Di sinilah mekanisme Anti-AFK Smart Bot bekerja di balik layar.',
      ],
    },
    {
      heading: 'Akar Masalahnya: Jangan Pernah Percayakan Jam Giliran ke Browser Pemain',
      paragraphs: [
        'Di artikel "Arsitektur Multiplayer Real-Time di B-Games", saya pernah menjelaskan mengapa status papan permainan harus dipegang penuh oleh server otoritatif (authoritative server) berbasis boardgame.io dan Koa.js WebSocket, bukan dihitung sendiri-sendiri oleh browser tiap pemain.',
        'Jika penghitung mundur giliran hanya dijalankan di layar pemain yang sedang mendapat giliran, maka begitu tab browser pemain tersebut diminimalkan di HP atau sinyalnya terputus, pengatur waktunya ikut berhenti berdetak. Akibatnya, sinyal "giliran selesai" tidak pernah terkirim ke server dan seluruh meja terkunci.',
        'Karena itu di B-Games, detak waktu setiap giliran dan pemantauan detak koneksi (heartbeat) diawasi langsung dari sisi server. Begitu batas waktu berpikir habis atau soket jaringan seorang pemain terputus melewati ambang toleransi singkat, server langsung mengambil tindakan tanpa menunggu izin dari perangkat pemain yang hilang tadi.',
      ],
    },
    {
      heading: 'Alih Kemudi Otomatis, Bukan Mengusir Pemain dari Meja',
      paragraphs: [
        'Pendekatan paling malas untuk menangani pemain yang AFK (Away From Keyboard) adalah langsung menggugurkan pemain tersebut atau membubarkan ruangan. Masalahnya, di dunia nyata koneksi seluler Indonesia sering kali hanya putus lima belas detik karena berpindah menara sinyal atau berganti jaringan Wi-Fi. Kalau langsung digugurkan, pemain yang niatnya masih ingin lanjut bermain tentu kecewa berat.',
        'Sebagai gantinya, B-Games menerapkan pola alih kemudi sementara (temporary bot takeover):',
        '1. Saat giliran seorang pemain tiba namun statusnya terdeteksi terputus atau diam melampaui batas waktu, sistem menandai kursi tersebut dalam mode otomatis dan menugaskan bot pintar untuk menjalankan langkah yang sah pada giliran itu.',
        '2. Di permainan yang menuntut pilihan seperti Ludo Klasik maupun Ludo Hexagon 6 pemain, bot tidak asal menggerakkan bidak secara buta — ia mengevaluasi langkah legal yang tersedia setelah kocokan dadu, seperti mengeluarkan bidak dari kandang, memajukan bidak yang aman, atau mengambil peluang langkah yang valid agar ritme kompetisi di meja tetap terasa wajar.',
        '3. Begitu langkah bot tuntas dalam hitungan detik, giliran langsung bergulir mulus ke pemain manusia berikutnya.',
      ],
    },
    {
      heading: 'Kursi Dikembalikan Mulus Saat Pemain Kembali Online',
      paragraphs: [
        'Bagian yang paling disukai pemain justru terjadi ketika sinyal mereka pulih satu atau dua menit kemudian. Saat koneksi WebSocket tersambung ulang, server mencocokkan token sesi kursi pemain tersebut, mengirimkan keadaan papan paling mutakhir, lalu mencabut kendali bot dari kursinya.',
        'Pada giliran berikutnya, kendali penuh sudah kembali ke tangan pemain manusia seolah tidak pernah terjadi gangguan, lengkap dengan posisi bidak yang tetap terjaga selama ia sempat terputus. Meja permainan enam orang tetap hidup dari menit pertama sampai pemenang terakhir ditentukan.',
      ],
    },
    {
      heading: 'Batasan Jujur dan Pelajaran Penting untuk Sistem Bisnis',
      paragraphs: [
        'Tentu ada batas yang memang sengaja ditetapkan: jika seluruh pemain manusia di satu meja keluar semuanya dan tidak ada satu pun yang kembali dalam rentang waktu tertentu, ruangan tersebut barulah ditutup dan dibersihkan oleh server agar memori tidak terbuang sia-sia untuk bot yang bermain melawan bot.',
        'Menariknya, pola "Anti-AFK" dari dunia game ini persis sama dengan masalah klasik yang sering saya temui di aplikasi operasional perusahaan. Dalam alur persetujuan pembelian (approval PO) atau eskalasi tiket vendor, berapa sering seluruh pengiriman barang tertahan dua hari hanya karena satu manajer sedang cuti atau lupa membuka notifikasi?',
        'Sistem bisnis yang matang wajib punya aturan alih kemudi serupa: tenggat waktu yang dihitung otomatis di server, pengingat bertahap, dan mekanisme pendelegasian sementara (auto-escalation) ke pejabat pengganti saat penanggung jawab utama tidak merespons.',
      ],
    },
    {
      heading: 'Kesimpulan & Cara Mencoba',
      paragraphs: [
        'Ketangguhan sebuah sistem real-time tidak diukur saat semua orang duduk manis di jaringan serat optik yang stabil, melainkan saat salah satu penggunanya tiba-tiba kehilangan sinyal di tengah jalan.',
        'Kalau kamu ingin melihat langsung seberapa mulus perpindahan giliran dan alih kemudi bot ini bekerja di papan permainan 2 sampai 6 pemain, kamu bisa mencobanya gratis langsung dari browser di bgames.arzhaning.my.id. Dan bila bisnismu sedang merancang sistem kolaborasi atau alur persetujuan yang tidak boleh macet di satu meja, kita bisa mendiskusikannya lewat Zannah atau WhatsApp.',
      ],
    },
  ],
  'xendit-vs-payment-gateway-lain-kenapa-saya-pilih': [
    {
      paragraphs: [
        'Setiap kali berdiskusi dengan pemilik bisnis yang ingin memasang pembayaran otomatis di aplikasinya, pertanyaan pertama hampir selalu seragam. Kebanyakan bertanya apakah lebih bagus memakai Midtrans atau Xendit, dan mana yang potongan per transaksinya paling murah seratus-dua ratus perak. Pertanyaan itu wajar, tetapi pengalaman menjalankan transaksi sungguhan di lapangan mengajarkan satu hal yang jauh lebih krusial. Selisih biaya admin beberapa ratus rupiah tidak ada artinya dibanding kehilangan pelanggan gara-gara jalur pembayarannya sedang gangguan.',
        'Awalnya saya membangun jalur pembayaran otomatis memakai Xendit di lini produk saya, mulai dari Portal Klien DevRAB, B-Games, hingga Rajendra Pintar. Namun seiring bertambahnya variasi transaksi ritel harian, di B-Games dan Rajendra Pintar saya menambahkan integrasi Midtrans sebagai jalur aktif tanpa membuang kode Xendit sedikit pun. Keduanya hidup berdampingan dan bisa dialihkan kapan saja cukup lewat satu saklar konfigurasi di berkas .env. Artikel ini membedah alasan teknis dan bisnis di balik arsitektur jalur ganda tersebut.',
      ],
    },
    {
      heading: 'Kenapa Tidak Cukup Bergantung pada Satu Jalur Pembayaran?',
      paragraphs: [
        'Perilaku membayar pengguna di Indonesia sangat beragam tergantung nominal dan konteks transaksinya. Untuk pembelian mikro puluhan ribu rupiah dari layar ponsel seperti di Rajendra Pintar atau B-Games, QRIS dan dompet digital (GoPay, OVO, DANA, ShopeePay) adalah raja mutlak karena selesai dipindai dalam sepuluh detik. Sebaliknya, untuk tagihan uang muka proyek bernilai jutaan rupiah di DevRAB, bagian keuangan perusahaan hampir selalu meminta Virtual Account bank besar (BCA, Mandiri, BNI, BRI, Permata).',
        'Masalahnya, di dunia infrastruktur finansial tidak ada penyedia tunggal yang kebal seratus persen dari gangguan eksternal. Kadang satu bank mitra atau jaringan perantara QRIS mengalami pemeliharaan terjadwal malam hari. Kadang pula kebijakan kanal pembayaran tertentu berubah, atau skema pencairan dana (settlement) di satu penyedia sedang lebih cocok untuk arus kas produk tertentu.',
        'Kalau kode aplikasimu terikat mati hanya ke satu payment gateway, setiap kali terjadi kendala di sisi penyedia, pilihannya cuma dua. Kamu terpaksa pasrah menolak pembeli sampai gangguan selesai, atau lembur membongkar kode backend dan men-deploy ulang di tengah kepanikan.',
      ],
    },
    {
      heading: 'Cara Kerja Saklar .env: Pindah Midtrans ke Xendit Tanpa Bongkar Kode',
      paragraphs: [
        'Agar tidak terjebak ketergantungan tunggal, di B-Games dan Rajendra Pintar saya memisahkan logika bisnis aplikasi dari kode spesifik penyedia pembayaran menggunakan pola adaptor yang dikendalikan variabel lingkungan (.env).',
        '1. Kontrak Pembuatan Tagihan yang Seragam. Saat pengguna menekan tombol bayar, frontend tidak pernah peduli sedang terhubung ke Midtrans atau Xendit. Ia hanya meminta backend menyiapkan sesi pembayaran untuk ID pesanan dan nominal tertentu. Di sisi server, variabel konfigurasi di .env menentukan apakah permintaan itu diteruskan ke Midtrans Snap API atau ke Xendit Invoice API, lalu mengembalikan layar pembayaran yang siap dipakai.',
        '2. Dua Pintu Webhook dengan Sabuk Pengaman Masing-Masing. Pantangan terbesar sistem pembayaran adalah menandai pesanan lunas hanya dari halaman redirect di browser karena URL sangat mudah dimanipulasi. Status lunas wajib berasal dari panggilan server-ke-server (webhook). Endpoint Midtrans memverifikasi tanda tangan kriptografi SHA-512, sementara endpoint Xendit memeriksa kecocokan header x-callback-token rahasia.',
        '3. Satu Fungsi Penyelesaian Idempoten di Database. Begitu tanda tangan digital dari salah satu penyedia dinyatakan sah, keduanya bermuara ke satu fungsi penyelesaian yang persis sama di PostgreSQL. Fungsi ini mengecek kunci idempotency agar bila server payment gateway mengirim ulang sinyal webhook yang sama saat jaringan padat, saldo koin pemain atau status VIP tidak pernah bertambah dua kali.',
        'Hasil praktisnya sangat menenangkan. Bila suatu hari salah satu penyedia sedang pemeliharaan kanal QRIS, saya cukup mengubah satu baris nilai variabel di .env server untuk mengalihkan transaksi baru ke jalur cadangan dalam hitungan detik tanpa menyentuh kode antarmuka.',
      ],
    },
    {
      heading: 'Perbandingan Jujur di Lapangan: Kapan Midtrans Unggul, Kapan Xendit Bersinar',
      paragraphs: [
        'Karena memakai keduanya secara langsung di produksi, saya melihat masing-masing penyedia punya titik manisnya sendiri.',
        '• Midtrans sangat bersinar untuk transaksi konsumen ritel harian (B2C). Antarmuka pop-up Midtrans Snap sudah sangat akrab di mata pengguna belanja online Indonesia dan menyatu mulus di atas halaman aplikasi web tanpa memaksa pengguna berpindah tab jauh. Ekosistem pembayaran ritelnya, terutama QRIS dan GoPay deep-link di ponsel, terasa sangat natural untuk nominal kecil hingga menengah seperti di B-Games dan Rajendra Pintar.',
        '• Xendit sangat tangguh untuk penagihan B2B, invoice korporat, dan fleksibilitas API. Struktur REST API serta payload JSON milik Xendit terasa sangat bersih dan konsisten bagi developer, ditambah simulasi pembayarannya di mode sandbox sangat cepat diuji. Halaman tagihan bawaannya juga tampil profesional saat dikirimkan sebagai tautan pembayaran kontrak bernilai jutaan rupiah ke klien perusahaan di DevRAB.',
      ],
    },
    {
      heading: 'Tiga Pola Produksi Nyata di B-Games, Rajendra Pintar, dan DevRAB',
      paragraphs: [
        'Dari kombinasi di atas, arsitektur pembayaran di tiga proyek saya terbagi menjadi tiga pola yang menyesuaikan aturan main tiap platform.',
        '1. B-Games memakai Midtrans dengan saklar .env Xendit dan Mobile IAP. Di versi Web/PWA, pembelian item virtual dan koin dilayani cepat lewat Midtrans dengan jalur Xendit yang tetap siaga di balik saklar .env, sedangkan toko aplikasi mobile terhubung ke Google Play Billing. Begitu QRIS terbayar, webhook langsung mengisi dompet pemain secara real-time saat mereka masih berada di lobi permainan.',
        '2. Rajendra Pintar menerapkan routing cerdas Web vs Android di balik Parent Gate. Jika dibuka lewat browser atau PWA, sistem memakai jalur web Midtrans aktif dengan Xendit standby di .env. Namun jika dibuka dari aplikasi Android (.APK) resmi Google Play Store, sistem otomatis beralih ke Google Play Billing demi mematuhi kebijakan produk digital Google. Seluruhnya tetap dikunci di balik gerbang soal hitung orang tua (Parent Gate) agar anak usia 4–8 tahun tidak pernah tidak sengaja bertransaksi.',
        '3. DevRAB memadukan Xendit Invoice dengan bukti transfer manual korporat. Begitu klien menandatangani kontrak proyek secara digital, tagihan Xendit (Virtual Account, QRIS, e-Wallet) langsung siap dibayar otomatis. Khusus untuk perusahaan yang birokrasi keuangannya mewajibkan transfer bank manual berlapis, portal tetap menyediakan unggah bukti bayar manual untuk diverifikasi sebelum kuitansi resmi terbit.',
      ],
    },
    {
      heading: 'Hal Administratif yang Perlu Disiapkan dan Kesimpulan',
      paragraphs: [
        'Sebelum memasang satu atau dua payment gateway sekaligus, pemilik bisnis perlu menyiapkan dokumen verifikasi usaha (KYC). Dokumen ini mencakup KTP dan NPWP untuk usaha perorangan, atau akta badan usaha PT/CV agar seluruh kanal Virtual Account aktif penuh, sekaligus memperhitungkan jadwal pencairan dana (settlement) ke rekening operasional.',
        'Pada akhirnya, arsitektur pembayaran yang matang bukan soal menjadi penggemar fanatik satu merek payment gateway. Yang terpenting adalah memastikan pembayaran pelanggan selalu bisa masuk dengan aman, terverifikasi otomatis, dan punya jalur cadangan saat dibutuhkan. Kalau kamu sedang merancang aplikasi bisnis dan ingin mendiskusikan skema pembayaran paling tahan banting untuk transaksimu, silakan ngobrol dulu dengan Zannah atau hubungi saya lewat WhatsApp.',
      ],
    },
  ],
  'tabel-berhitung-kanvas-pengenal-bentuk-ekspor-docx-zhanotes': [
    {
      paragraphs: [
        'Ada anggapan lama di dunia pembuatan aplikasi bahwa browser hanyalah "layar penampil", sementara semua pekerjaan pintar — menghitung rumus keuangan, merapikan gambar, membubuhkan coretan ke berkas PDF, sampai mencetak dokumen Microsoft Word — harus dikirim dulu ke server backend untuk diproses. Anggapan itu membuat banyak aplikasi web akhirnya bergantung penuh pada server berbayar bahkan untuk fitur sehari-hari.',
        'Ketika membangun ZhaNotes sebagai ruang kerja yang 100% berjalan di perangkat pengguna, saya menantang batasan tersebut: seberapa jauh logika rumit bisa diselesaikan murni di dalam browser tanpa satu kali pun memanggil server? Di artikel ini kita membedah tiga mesin client-side paling menarik di balik ZhaNotes.',
      ],
    },
    {
      heading: '1. Tabel Pintar yang Mengerti Cara Orang Indonesia Menulis Uang',
      paragraphs: [
        'Di spreadsheet konvensional, kalau kamu mengetik "Rp15.000" atau "1,5jt" sebagai teks biasa di sebuah sel angka, rumus penjumlahannya sering kali langsung rusak menghasilkan pesan error #VALUE!. Padahal saat sedang mencatat cepat di tengah rapat atau menghitung belanja toko, manusia jauh lebih nyaman mengetik "15rb", "250.000", atau "1,5jt" ketimbang menghitung jumlah angka nol dengan teliti.',
        'Karena itu mesin tabel otomatis di ZhaNotes dilengkapi pengurai angka (number parser) fleksibel yang dirancang khusus untuk kebiasaan penulisan lokal:',
        '• Sistem mengenali angka polos (15000), pemisah ribuan titik khas Indonesia (15.000), awalan mata uang (Rp15.000), singkatan sehari-hari seperti "15rb" dan "1,5jt", hingga pecahan seperti "1/2" saat mencatat takaran atau porsi.',
        '• Begitu kamu selesai mengetik di salah satu baris pada template RAB proyek, catatan stok barang masuk-keluar, anggaran bulanan, atau hitung patungan (split bill), mesin langsung menghitung ulang subtotal, sisa anggaran, atau saldo akhir secara seketika.',
        '• Di bawah setiap tabel aktif, bilah aksi cepat melayang (+ Baris, Hapus, Urungkan) memudahkan pengisian dari layar sentuh HP tanpa perlu klik kanan yang rumit, dan hasilnya bisa langsung diunduh menjadi berkas CSV kapan pun diperlukan.',
      ],
    },
    {
      heading: '2. Tahan Setengah Detik: Pengenal Bentuk Otomatis di Kanvas Bebas',
      paragraphs: [
        'Menggambar kotak alur kerja atau lingkaran diagram memakai jari di layar sentuh maupun mouse laptop hampir selalu menghasilkan garis yang miring dan bergelombang. Memaksa pengguna bolak-balik memilih ikon kotak dan panah di toolbar sering kali memutus aliran ide yang sedang mengalir cepat.',
        'Di mode Kanvas Bebas ZhaNotes, saya menanamkan algoritma pengenal geometri goresan (stroke shape recognition) langsung di atas HTML5 Canvas beresolusi tinggi:',
        '1. Saat kamu menggoreskan pena bebas, aplikasi merekam jejak titik koordinat (x, y), kecepatan gerak, serta tingkat tekanan stylus bila perangkatmu mendukungnya.',
        '2. Jika di ujung goresan kamu langsung mengangkat jari, goresan tetap dipertahankan sebagai tulisan tangan alami. Namun jika kamu menahan ujung jari/pena diam selama kurang lebih 0,5 detik di titik akhir, mesin geometri langsung menganalisis rasio kotak pembatas, kelengkungan, sudut belokan, serta jarak titik awal ke titik akhir.',
        '3. Dalam sekejap, coretan kasar tadi dirapikan otomatis menjadi garis lurus presisi, persegi panjang, lingkaran/elips, segitiga, belah ketupat (diamond untuk diagram alir), bintang, hingga kurva S yang mulus.',
        'Seluruh perhitungan matematika vektor tersebut selesai dalam beberapa milidetik di perangkatmu sendiri, membuat proses membuat sketsa arsitektur atau peta pikiran terasa senyaman mencoret di tablet gambar khusus.',
      ],
    },
    {
      heading: '3. Menyatukan Anotasi PDF Terputar dan Merakit File Word (.docx) di Browser',
      paragraphs: [
        'Tantangan teknis paling seru muncul saat membangun ekspor dokumen profesional tanpa bantuan server konversi sama sekali. Ada dua bagian yang bekerja berdampingan:',
        '• Duet PDF.js dan PDF-Lib untuk Anotasi Presisi: Membaca PDF di layar dan menulis ulang PDF baru adalah dua pekerjaan berbeda. ZhaNotes memakai PDF.js untuk merender halaman tajam beserta lapisan seleksi teks, lalu memakai PDF-Lib saat pengguna mengekspor PDF baru berisi stabilo, garis bawah, coretan tinta, dan kartu catatan. Bagian tersulitnya adalah dokumen hasil scan kantor yang halamannya sering terputar 90, 180, atau 270 derajat dengan batas potong (cropBox) tidak standar — mesin ekspor ZhaNotes menerjemahkan ulang matriks koordinat layar ke koordinat asli halaman PDF sehingga letak stabilo tidak pernah melenceng.',
        '• Merakit Berkas .docx Murni dengan JSZip: Banyak orang belum tahu bahwa berkas Microsoft Word modern (.docx) sejatinya adalah arsip ZIP yang berisi kumpulan dokumen XML terstruktur (OpenXML) beserta folder gambar. Dengan memanfaatkan pustaka JSZip di browser, ZhaNotes mengonversi struktur judul, paragraf tebal-miring, daftar butir, tabel, hingga gambar menjadi paket OpenXML lengkap lalu mengemasnya langsung menjadi berkas .docx asli yang siap dibuka di Microsoft Word maupun Google Docs.',
      ],
    },
    {
      heading: 'Batasan Jujur Pemrosesan Murni di Perangkat (Client-Side)',
      paragraphs: [
        'Memindahkan seluruh beban komputasi ke browser pengguna tentu punya batas fisika yang wajib diperhitungkan secara jujur: kapasitas memori (RAM) perangkat pengguna menjadi penentunya.',
        'Untuk dokumen kerja puluhan halaman, kanvas ratusan objek, dan PDF ukuran wajar belasan megabyte, pemrosesan lokal terasa jauh lebih cepat daripada mengunggah ke server. Namun jika seseorang membuka berkas PDF hasil pindaian ratusan megabyte di ponsel kelas entri dengan RAM sangat terbatas, browser ponsel tentu akan bekerja keras. Itulah sebabnya pustaka berat di ZhaNotes hanya dimuat saat modenya benar-benar dibuka (lazy loading) agar pemakaian memori harian tetap hemat.',
      ],
    },
    {
      heading: 'Kesimpulan & Inspirasi untuk Aplikasi Web Modern',
      paragraphs: [
        'Browser modern hari ini jauh lebih bertenaga daripada yang sering kita bayangkan. Dengan merancang logika client-side secara cermat, sebuah aplikasi web bisa menghadirkan pengalaman sekelas software desktop — cepat, jalan tanpa internet, menjaga privasi dokumen, dan menghemat biaya server menjadi nol rupiah.',
        'Penasaran menguji sendiri tabel berhitung dan tahan-setengah-detik di kanvasnya? Buka langsung arzhaning.my.id/zhanotes/ dari browser perangkatmu sekarang. Dan bila bisnismu punya kebutuhan alat kerja internal berbasis browser yang ringan namun kaya fitur seperti ini, mari ngobrol lewat Zannah atau WhatsApp.',
      ],
    },
  ],
};