// Isi artikel untuk pilar "studi-kasus-produk" (satu file per pilar, dimuat lazy).
// Metadata (judul, excerpt, kategori, dll.) ada di ../articles.ts.
// Key = slug artikel. Artikel baru di pilar ini: tambahkan entri baru di bawah.
import type { ArticleBlock } from '../articles';

export const bodies: Record<string, ArticleBlock[]> = {
  'studi-kasus-devrab-proposal-30-detik': [
    {
      paragraphs: [
        'Pernah ngobrol santai dengan Zannah soal ide aplikasi, lalu tiba-tiba muncul tawaran "mau saya buatkan RAB dan proposalnya sekarang?" Begitu tombolnya ditekan, dalam hitungan detik muncul tautan ke dokumen lengkap: ruang lingkup pekerjaan, estimasi biaya, termin pembayaran, sampai tempat tanda tangan digital. Mesin di balik momen itu namanya DevRAB — platform yang saya bangun supaya ide proyek bisa jadi proposal profesional tanpa harus begadang di Word dan Excel.',
        'Nama ini belum pernah saya kenalkan secara terbuka, karena DevRAB memang bukan produk showcase seperti B-Games atau Assets DEMO: tidak ada halaman demo yang bisa dikunjungi, dia bekerja di belakang chat. Tapi justru di sinilah banyak prinsip kerja saya dituangkan jadi sistem: biaya yang transparan, batas pekerjaan yang jelas, dan proses persetujuan yang rapi.',
      ],
    },
    {
      heading: 'Masalah yang Mau Diselesaikan',
      paragraphs: [
        'Menyusun proposal proyek software secara manual itu lambat dan gampang bolong. Satu sampai tiga hari habis untuk mengetik, estimasi sering meleset karena biaya server dan margin risiko terlupa, klien menawar tanpa paham rincian fiturnya, tanda tangan kontrak harus lewat cetak-scan-kirim, dan konfirmasi transfer tenggelam di chat WhatsApp. DevRAB dibuat untuk merapikan seluruh rantai itu, dari estimasi awal sampai uang muka masuk, di satu tempat.',
      ],
    },
    {
      heading: 'Dari Ide Mentah ke Estimasi yang Masuk Akal',
      paragraphs: [
        'Dari deskripsi proyek, AI merancang rincian fitur, jam kerja, biaya infrastruktur, dan timeline. Ia juga mengecek harga pasar terkini di Indonesia lewat pencarian — tarif programmer, domain, sewa server, sampai biaya API pihak ketiga — jadi angkanya tidak bertumpu pada template lama. Sebagai titik awal tersedia lebih dari sepuluh template industri (toko online, aplikasi mobile, SaaS/ERP, kasir, klinik, platform kursus, sistem booking, layanan on-demand, platform AI, company profile) dan pustaka lebih dari 70 fitur siap pilih.',
        'Kalau klien punya batas anggaran, misalnya Rp25 juta, mesin ini memprioritaskan fitur inti dan menandai sisanya sebagai opsi, supaya total tetap masuk anggaran tanpa mengorbankan hal yang wajib ada. Perhitungan diskon, PPN, margin risiko, dan termin bertahap (misalnya 30% uang muka, 40% setelah desain dan demo, 30% setelah peluncuran) dikerjakan otomatis. Biaya jasa development dipisahkan dari biaya infrastruktur seperti server, domain, dan SSL, jadi klien bisa melihat ke mana uangnya pergi.',
      ],
    },
    {
      heading: 'Scope of Work yang Tidak Bolong',
      paragraphs: [
        'Setiap proposal membawa SOW: tujuan bisnis proyek, daftar yang dikerjakan (in-scope), batasan yang tidak termasuk (out-of-scope), prasyarat dari sisi klien, dan rekomendasi arsitektur teknologi. Ini yang mencegah perdebatan "kan cuma fitur kecil" di tengah proyek — topik yang juga saya bahas di artikel tentang lima pertanyaan sebelum memakai jasa developer freelance.',
      ],
    },
    {
      heading: 'Portal Klien: Simulasi, Tanda Tangan, dan Bayar dalam Satu Halaman',
      paragraphs: [
        'Klien menerima tautan khusus tanpa perlu registrasi atau kata sandi. Di portal itu mereka bisa mengaktifkan atau menonaktifkan fitur opsional dan melihat total harga serta nominal tiap termin berubah langsung. Kalau cocok, persetujuan ditandatangani dengan jari atau mouse di layar; kalau belum, ada kotak revisi untuk mengirim catatan tanpa membatalkan proposal.',
        'Uang muka bisa dibayar lewat Xendit — QRIS, virtual account, atau kartu — atau lewat transfer manual dengan unggah foto bukti. Bukti transfer masuk ke dashboard admin untuk diverifikasi satu klik, dan status proyek ikut berjalan dari Draft, Sent, Approved, DP Paid, sampai Paid. Dokumen akhirnya bisa dicetak dalam format A4 berkop atau disimpan sebagai PDF, lengkap dengan nominal yang ditulis dengan kalimat terbilang.',
      ],
    },
    {
      heading: 'Zannah Tidak Asal Menawarkan',
      paragraphs: [
        'Zannah terhubung ke DevRAB lewat API, jadi pengunjung tidak perlu mengisi formulir apa pun. Tapi tombol "Buatkan RAB" tidak muncul sembarangan. Di belakang layar ada pengecekan kesiapan: jenis platform atau proyeknya sudah disebut (web app, mobile app, dashboard, sistem internal, dan sejenisnya), minimal dua sampai tiga kebutuhan konkret sudah dibahas, dan ada indikasi target waktu atau kisaran anggaran. Kalau salah satunya belum jelas, sistem sengaja bersikap ketat — lebih baik menunggu informasi cukup daripada menghasilkan proposal asal-asalan dari obrolan yang masih mentah.',
      ],
    },
    {
      heading: 'Kalau Mesinnya Bermasalah, Percakapan Tidak Berhenti',
      paragraphs: [
        'Begitu tombol ditekan, permintaan dikirim ke DevRAB dengan mekanisme percobaan ulang otomatis: kalau gagal karena server sibuk atau timeout, sistem mencoba lagi dengan jeda yang makin panjang di tiap percobaan. Begitu topik estimasi proyek mulai muncul di obrolan, sistem juga sudah mengirim "ping" diam-diam sebagai pemanasan, supaya mesinnya siap saat benar-benar dibutuhkan.',
        'Kalau semua percobaan tetap gagal, pengunjung tidak melihat pesan error. Zannah tetap menyusun draf estimasi seadanya secara lokal supaya percakapan punya sesuatu untuk dilanjutkan. Ini prinsip yang sama dengan Cascade AI System: turunkan tingkat kecanggihan, jangan berhenti total.',
      ],
    },
    {
      heading: 'Kenapa Setiap Isi Proposal Harus "Dicuci" Dulu',
      paragraphs: [
        'Karena rincian proposal berasal dari apa yang diketik pengunjung di chat, seluruh isinya diperlakukan sebagai data yang tidak boleh langsung dipercaya. Setiap teks yang masuk ke dokumen hasil, seperti judul proyek dan daftar fitur, dibersihkan dari karakter berbahaya, dan setiap tautan divalidasi supaya hanya alamat web yang sah yang lolos. Di sisi admin, kata sandi disimpan dengan PBKDF2 SHA-256 dan percobaan login berulang yang mencurigakan diblokir otomatis.',
      ],
    },
    {
      heading: 'Fondasi Teknisnya',
      paragraphs: [
        'DevRAB berjalan di jaringan global Cloudflare dengan database Turso dan penyimpanan berkas Cloudflare R2 untuk logo agensi dan foto bukti bayar; tampilannya dibangun dengan React dan Tailwind. Alasan memilih kombinasi ini dibahas di artikel "4 Sistem Saya, 4 Arsitektur Backend Berbeda".',
      ],
    },
    {
      heading: 'Batasan yang Perlu Diketahui',
      paragraphs: [
        'Hasil DevRAB adalah estimasi awal yang disusun cepat, bukan harga mati. Angkanya bisa direvisi lewat portal, dan untuk proyek yang rumit, konsultasi langsung tetap cara paling akurat untuk menetapkan lingkup dan biaya. AI mempercepat penyusunannya, tapi tidak menggantikan penilaian soal apa yang realistis dikerjakan.',
      ],
    },
    {
      heading: 'Cara Mencobanya',
      paragraphs: [
        'Cara paling mudah mengalaminya langsung: buka chat Zannah di pojok kanan bawah situs ini, ceritakan ide proyekmu — jenis aplikasinya, kebutuhan utama, dan kira-kira target waktu atau anggarannya — lalu lihat proposal yang muncul. Kamu juga bisa melampirkan sketsa, PDF, atau CSV supaya kebutuhannya terbaca lebih jelas. Kalau penasaran dengan detail teknisnya, atau ingin membahas pendekatan serupa untuk alur proposalmu sendiri, kontak saya ada di halaman kontak.',
      ],
    },
  ],
  'arsitektur-multiplayer-real-time-b-games': [
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
        'Ini bagian yang sering diremehkan tapi paling penting untuk pengalaman bermain: kalau salah satu pemain kehilangan koneksi di tengah permainan, permainan tidak boleh macet menunggu dia kembali selamanya. B-Games punya mekanisme AFK takeover — begitu server mendeteksi satu pemain tidak merespons dalam waktu tertentu, bot cerdas otomatis mengambil alih gilirannya sampai pemain itu kembali online atau permainan selesai.',
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
      heading: 'Di Sekitar Meja Permainan',
      paragraphs: [
        'Mesin giliran dan server otoritatif itu melayani empat permainan: Ludo Classic untuk 2–4 pemain, Ludo Hexagon dengan papan heksagonal untuk hingga 6 pemain, Ular Tangga, dan Tic-Tac-Toe. Di sekelilingnya ada data yang tidak cocok disimpan di dalam server game, yaitu profil, daftar teman, dompet koin, leaderboard, dan riwayat pertandingan. Bagian itu hidup di Supabase (PostgreSQL), sementara server game fokus ke aturan main.',
        'Pemain bisa langsung main sebagai tamu tanpa daftar, lalu menghubungkan akun ke Google kapan saja supaya koin dan prestasinya tidak hilang saat ganti perangkat. B-Games juga bisa dipasang ke layar utama sebagai PWA dan bisa dicoba langsung di bgames.arzhaning.my.id.',
      ],
    },
    {
      heading: 'Prinsip yang Bisa Dipakai di Luar Game',
      paragraphs: [
        'Pola "server otoritatif + klien cuma mengirim niat, bukan hasil akhir" ini sebenarnya bukan cuma relevan untuk game. Prinsip yang sama dipakai di sistem apa pun yang butuh beberapa pengguna mengubah data yang sama secara bersamaan tanpa saling menimpa atau bisa dimanipulasi sepihak — misalnya sistem approval multi-user atau update stok real-time. Kalau bisnismu punya kebutuhan sinkronisasi data real-time semacam ini, ceritakan alur kerjanya ke Zannah di chat, lalu kita bahas arsitektur yang pas.',
      ],
    },
  ],
  'cara-kerja-sistem-aset-pt-gmp': [
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
      heading: 'Yang Dilihat Pimpinan, dan yang Dipakai Staf Lapangan',
      paragraphs: [
        'Untuk pimpinan, dashboard menampilkan total nilai perolehan aset berdampingan dengan total nilai buku saat ini, plus grafik status operasional: aktif, dalam perbaikan, atau sudah dihapusbukukan (disposed). Untuk staf lapangan, tampilannya dibuat jauh lebih sederhana: katalog dengan pencarian berdasarkan kode, merek, kategori, ruangan, sampai nama pemegang barang, filter kondisi, dan pemindai QR. Pembagian peran menjaga agar staf biasa hanya bisa melihat dan memindai, sementara perubahan nilai dan data sensitif tetap di tangan administrator.',
        'Setiap aset punya dua slot foto (tampak depan, serta nomor seri atau kondisi fisik) yang bisa diperbesar layar penuh untuk pemeriksaan detail. Daftar aset dirender dengan Shopify FlashList, jadi ribuan baris tetap lancar digulir di HP biasa.',
      ],
    },
    {
      heading: 'Pengingat Servis, Garansi, dan Notifikasi',
      paragraphs: [
        'Aset bukan cuma soal nilai buku. Jadwal servis berkala, kalibrasi, atau tanggal berakhirnya garansi bisa dicatat per aset, disinkronkan ke Google Calendar, dan diingatkan lewat push notification (OneSignal) sebelum hari-H. Tujuannya sederhana: servis AC atau kendaraan operasional tidak terlewat sampai kerusakannya jadi mahal.',
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
        'Versi publik dari sistem ini — Assets Demo, dengan data simulasi demi menjaga privasi data PT Global Multiparts — bisa dicoba langsung di assets.arzhaning.my.id untuk melihat bagaimana alur kerjanya secara nyata.',
      ],
    },
    {
      heading: 'Coba Sendiri dengan Akun Demo',
      paragraphs: [
        'Buka assets.arzhaning.my.id dan masuk dengan salah satu akun uji coba. Untuk melihat sisi pimpinan dengan kendali penuh (tambah dan edit aset, kelola pengguna, ekspor laporan), pakai admin@demo.com dengan kata sandi 123456. Untuk merasakan sisi staf lapangan (melihat katalog, memindai label QR, memeriksa riwayat), pakai staff@demo.com dengan kata sandi yang sama. Semua datanya simulasi, jadi silakan dicoba bebas.',
        'Satu catatan: karena sistem membatasi satu sesi aktif per akun, kalau ada pengunjung lain yang sedang memakai akun yang sama, sesimu bisa terputus. Kalau itu terjadi, cukup masuk lagi.',
      ],
    },
    {
      heading: 'Kalau Bisnismu Punya Masalah Serupa',
      paragraphs: [
        'Pola ini tidak cuma berlaku untuk manajemen aset — prinsip yang sama (memanfaatkan ekosistem cloud yang sudah ada alih-alih membangun infrastruktur baru dari nol) bisa dipakai untuk berbagai proses bisnis lain yang masih manual dan rawan selisih data. Kalau bisnismu punya masalah pendataan atau pelacakan serupa, coba dulu demonya, lalu catat bagian alur mana yang paling mirip dengan proses di tempatmu — itu bahan yang bagus untuk memulai diskusi lewat chat Zannah.',
      ],
    },
  ],
  'kenapa-vendor-balas-seadanya-dan-cara-memaksa-akar-masalah': [
    {
      paragraphs: [
        'Bayangkan skenario ini (ilustrasi, tapi hampir semua perusahaan dengan banyak vendor pernah mengalaminya). Senin pagi, seorang pelanggan komplain: produk yang diterimanya bermasalah. Tim internal meneruskan keluhan itu ke grup WhatsApp vendor. Dua hari kemudian datang balasan singkat: \"Sudah kami perbaiki, mohon maaf atas ketidaknyamanannya.\" Kasus ditutup. Tiga minggu kemudian, pelanggan lain komplain tentang hal yang persis sama.',
        'Tidak ada yang berbohong dalam cerita itu. Vendornya merespons, timnya meneruskan, kasusnya ditutup. Tapi tidak ada satu orang pun yang bisa menjawab tiga pertanyaan paling penting: apa penyebab sebenarnya, apa yang diubah supaya tidak terulang, dan apakah ini pernah terjadi sebelumnya.',
        'Saya membangun Issue Tracker karena frustrasi pada pola seperti ini. Artikel ini membedah kenapa balasan seadanya itu hampir pasti terjadi kalau medianya salah, dan bagaimana desain aplikasi bisa mengubahnya tanpa harus memarahi siapa pun.',
      ],
    },
    {
      heading: 'Anatomi Balasan Seadanya: Apa yang Sebenarnya Hilang',
      paragraphs: [
        'Balasan \"sudah diperbaiki\" terlihat seperti jawaban, padahal ia melewatkan empat hal yang dibutuhkan perusahaan untuk benar-benar belajar dari sebuah keluhan:',
        '1. Akar masalah: bukan gejalanya, tapi penyebab paling dasarnya. Barang rusak adalah gejala. Mesin yang tidak dikalibrasi, operator yang belum dilatih, atau bahan baku yang berganti pemasok adalah kemungkinan akarnya.',
        '2. Tindakan perbaikan: apa yang dilakukan untuk memperbaiki kasus ini, dan apa yang diubah supaya kasus serupa tidak muncul lagi. Dua hal ini berbeda.',
        '3. Bukti: foto, hasil uji, atau laporan yang bisa diperiksa, bukan sekadar pernyataan.',
        '4. Konteks waktu: kapan masalah diketahui, kapan dibalas, dan apakah tepat waktu.',
        'Tanpa keempatnya, perusahaan hanya memiliki catatan bahwa sesuatu terjadi, bukan pengetahuan tentang kenapa itu terjadi.',
      ],
    },
    {
      heading: 'Masalahnya Bukan di Vendor, Tapi di Medianya',
      paragraphs: [
        'Coba perhatikan alat yang biasa dipakai: grup WhatsApp, email berantai, dan spreadsheet yang dikirim bolak-balik. Ketiganya punya kelemahan yang sama: tidak ada yang memaksa balasan memuat hal yang dibutuhkan. Kolom kosong di chat tidak pernah ditandai merah. Tenggat tidak pernah menghitung mundur sendiri. Keluhan yang sama dari bulan lalu tenggelam di ribuan pesan di atasnya.',
        'Akibatnya kualitas balasan bergantung pada niat baik dan ingatan masing-masing orang. Sebagai mantan orang audit internal, saya tidak percaya pada proses yang bergantung pada ingatan. Proses yang sehat adalah proses di mana cara yang salah memang sulit dilakukan.',
      ],
    },
    {
      heading: 'Satu Kasus, Banyak Bagian Masalah',
      paragraphs: [
        'Di Issue Tracker, setiap keluhan menjadi satu kasus dengan nomor urut otomatis (formatnya seperti CS-2026-0001), lengkap dengan kronologi dan tingkat urgensi dari Rendah sampai Mendesak. Yang membedakan: satu kasus bisa dipecah menjadi beberapa bagian masalah, dan masing-masing bisa ditangani vendor yang berbeda.',
        'Ini penting karena keluhan di dunia nyata jarang punya satu penyebab. Satu produk bermasalah bisa melibatkan pemasok bahan, pihak perakitan, dan pihak pengiriman sekaligus. Dengan memecahnya, tiap vendor bertanggung jawab atas bagiannya sendiri dan tidak ada yang bisa bersembunyi di balik \"mungkin itu bagian pihak lain\".',
        'Setiap bagian juga memuat kronologi dan detail serta tindakan sementara yang sudah diambil, sehingga vendor paham situasinya sebelum membalas. Tabel dari Excel, Google Sheets, atau Word bisa ditempel langsung di kronologi, balasan, dan artikel solusi.',
      ],
    },
    {
      heading: 'Form Balasan yang Tidak Bisa Dikirim Setengah Jadi',
      paragraphs: [
        'Vendor tidak membalas lewat chat bebas. Mereka login ke akunnya sendiri dan mengisi form balasan terstruktur yang mewajibkan akar masalah dan tindakan perbaikan. Akar masalah dikelompokkan dalam kategori standar seperti Manusia, Mesin, Material, dan Metode, lalu dijelaskan dengan kalimat sendiri.',
        'Bandingkan dua balasan berikut (keduanya ilustrasi). Balasan pertama: \"Sudah kami perbaiki.\" Balasan kedua: \"Akar masalah (Mesin): sensor pada lini 2 tidak dikalibrasi sejak servis terakhir. Tindakan: sensor dikalibrasi ulang, jadwal kalibrasi diubah dari tahunan menjadi triwulanan.\" Balasan kedua bisa ditindaklanjuti, diaudit, dan dibandingkan dengan kasus lain. Balasan pertama tidak.',
        'Form tidak bisa dikirim sebelum bagian wajibnya terisi. Kalau jawabannya belum memadai, tim bisa meminta revisi. Tidak ada lagi balasan setengah hati yang lolos hanya karena tidak ada yang sempat memeriksa.',
      ],
    },
    {
      heading: 'Menilai Vendor Tanpa Membuat Vendor Defensif',
      paragraphs: [
        'Tim bisa menulis catatan internal pada balasan vendor, dan catatan itu hanya terlihat oleh tim. Fungsinya sederhana: menilai kualitas jawaban tanpa vendor tahu. Kalau sebuah balasan lengkap tapi dangkal, tim bisa mencatatnya untuk bahan evaluasi tanpa memicu perdebatan di depan vendor.',
        'Untuk komunikasi terbuka, tersedia komentar bertingkat antara tim dan vendor, yang bisa saling membalas. Notifikasi di dalam aplikasi, mirip lonceng di media sosial dengan angka merah untuk yang belum dibaca, memberi tahu pihak yang berkepentingan. Kejadian beruntun digabung supaya tidak banjir, dan isi notifikasi vendor tidak pernah memuat data pelanggan.',
      ],
    },
    {
      heading: 'Vendor Hanya Melihat Tugasnya Sendiri',
      paragraphs: [
        'Ada empat peran di sistem ini: Admin dengan akses penuh, Staff untuk operasional, Viewer yang hanya memantau, dan Vendor. Peran Vendor paling ketat: ia hanya melihat tugas miliknya, tanpa nama pelanggan dan tanpa data sensitif. Pemisahan dilakukan di sisi server, bukan sekadar disembunyikan di tampilan, jadi tidak bergantung pada tampilan semata.',
        'Manfaatnya dua. Kerahasiaan pelanggan terjaga tanpa mengandalkan kehati-hatian staf saat menyalin pesan. Dan vendor fokus pada masalahnya sendiri alih-alih terseret perdebatan siapa yang salah. Lampiran juga tidak pernah dibagikan lewat link publik: setiap unduhan melewati pengecekan akses.',
      ],
    },
    {
      heading: 'Tenggat yang Menghitung Sendiri',
      paragraphs: [
        'Setiap bagian masalah punya batas waktu balas yang dihitung otomatis dari urgensinya. Begitu lewat, penanda Terlambat muncul. Pengingat email terkirim ke vendor sebelum dan sesudah jatuh tempo, jadi tim tidak perlu menjadi penagih yang menanyakan satu per satu.',
        'Efek sampingnya sangat berharga: data. Karena waktu tercatat otomatis, laporan bisa menjawab pertanyaan yang sebelumnya hanya bisa dijawab dengan firasat. Berapa lama tim merespons pertama kali? Berapa lama sebuah kasus diselesaikan? Vendor mana yang paling cepat, dan vendor mana yang paling sering terlambat?',
      ],
    },
    {
      heading: 'Dari Kejadian Terpisah ke Pola',
      paragraphs: [
        'Laporan siap cetak (PDF) memuat metrik yang tadi disebut, ditambah grafik tren 6 bulan, masalah berulang, dan akar masalah menurut kategori. Masalah berulang dideteksi dari bagian masalah yang namanya muncul dua kali atau lebih. Di titik inilah keluhan berhenti terlihat sebagai kejadian terpisah dan mulai tampak sebagai pola.',
        'Misalnya (ilustrasi), laporan menunjukkan bahwa sebagian besar akar masalah dalam enam bulan jatuh pada kategori Metode, bukan Mesin. Itu mengubah arah perbaikan: yang perlu dibenahi mungkin prosedur kerja, bukan peralatannya. Informasi seperti ini mustahil muncul dari tumpukan chat.',
        'Kasus yang selesai juga bisa diubah menjadi artikel solusi di Knowledge Base, lalu diverifikasi dan dibagikan ke vendor. Saat tim membuat kasus baru, sistem otomatis menyarankan solusi serupa. Masalah yang sama tidak perlu diselidiki dari nol. Kasus selesai juga bisa dicetak sebagai laporan A4 untuk arsip internal, dan data bisa diekspor ke CSV untuk dibuka di Excel.',
      ],
    },
    {
      heading: 'Tahan Sinyal Putus-Nyambung, Tetap Bisa Diaudit',
      paragraphs: [
        'Perubahan langsung terlihat di layar tanpa menunggu server (optimistic UI), dan bila koneksi putus, perubahan disimpan di antrean offline lalu dikirim otomatis saat online kembali. Antrean ini bekerja selama halaman sudah terbuka, jadi pemuatan pertama tetap butuh internet. Aplikasi juga bisa dipasang di layar utama HP sebagai PWA.',
        'Sementara itu, setiap tindakan tercatat di riwayat: siapa, kapan, dan apa yang berubah. Prinsipnya sama dengan yang saya bahas di artikel \"Apa Itu Audit Trail, dan Kenapa Bisnismu Mungkin Butuh Fitur Ini Lebih dari yang Kamu Kira\". Sistem yang baik harus siap ditanya kapan saja, bahkan oleh orang yang tidak ada di ruangan saat kejadian.',
      ],
    },
    {
      heading: 'Batas yang Perlu Diketahui: Pilihan Arsitektur yang Sengaja Sederhana',
      paragraphs: [
        'Backend-nya berjalan di Google Apps Script dengan Google Sheets sebagai database dan Google Drive untuk lampiran, jadi tidak ada biaya sewa server bulanan. Data tersimpan di akun Google milik pelanggan sendiri, bisa dibuka dan dicadangkan kapan saja.',
        'Sebagai gantinya, ada batas yang saya sampaikan terus terang kepada calon pengguna:',
        '• Satu eksekusi Apps Script maksimal 6 menit.',
        '• Kuota email harian sekitar 100 untuk Gmail biasa, atau sekitar 1.500 untuk Google Workspace.',
        '• Lampiran maksimal 10 MB per file (foto dikompres otomatis di perangkat).',
        '• Kapasitas optimal sekitar 20.000 kasus. Di atas itu, migrasi ke database sungguhan sebaiknya dipertimbangkan.',
        'Untuk perusahaan dengan banyak vendor yang belum butuh platform raksasa, batas-batas ini biasanya lebih dari cukup. Dan karena datanya ada di Google Sheets milik sendiri, kalau suatu hari perlu pindah, datanya tidak terkunci di tangan siapa pun. Tanda-tanda kapan batas itu mulai terasa saya rangkum di artikel \"5 Tanda Bisnismu Sudah Waktunya Migrasi dari Google Apps Script ke Server Sendiri\".',
      ],
    },
    {
      heading: 'Lima Pertanyaan untuk Menguji Sistem Pelacakan Keluhanmu',
      paragraphs: [
        'Entah kamu memakai Issue Tracker atau sistem lain, lima pertanyaan ini bisa dipakai untuk memeriksa kesehatan proses keluhanmu hari ini:',
        '1. Kalau vendor membalas, apakah ada cara memastikan balasannya memuat akar masalah, bukan sekadar \"sudah beres\"?',
        '2. Bisakah kamu melihat dalam satu layar keluhan mana yang sudah lewat tenggat?',
        '3. Kalau masalah yang sama muncul lagi bulan depan, apakah ada yang bisa menunjukkan catatan kejadian sebelumnya dalam hitungan menit?',
        '4. Apakah vendor bisa melihat data pelanggan yang sebenarnya tidak mereka perlukan?',
        '5. Kalau besok auditor bertanya \"siapa memutuskan apa dan kapan\", dari mana kamu menjawabnya?',
        'Kalau dua atau lebih jawabannya tidak yakin, kemungkinan besar keluhan di perusahaanmu masih mengalir lewat jalur yang membiarkan balasan seadanya.',
      ],
    },
    {
      heading: 'Kesimpulan & Refleksi',
      paragraphs: [
        'Balasan vendor yang seadanya jarang soal sikap. Lebih sering itu cermin dari sistem yang tidak meminta lebih. Ketika form menuntut akar masalah, tenggat berjalan otomatis, vendor hanya melihat tugasnya, dan solusi lama tersimpan rapi, kualitas kerja ikut naik tanpa perlu teguran.',
        'Kalau perusahaanmu masih mengelola keluhan lewat grup chat dan spreadsheet, coba tanyakan satu hal: kalau masalah yang sama muncul bulan depan, apakah ada yang bisa membuktikan bahwa akar masalahnya sudah pernah dicatat? Kalau belum yakin, kamu bisa mencoba demo Issue Tracker di itrack.arzhaning.my.id atau mengobrol dulu lewat WhatsApp untuk membahas kebutuhan perusahaanmu.',
      ],
    },
  ],
  'membangun-aplikasi-100-persen-offline-rajendra-pintar': [
    {
      paragraphs: [
        'Bayangkan seorang anak berusia lima tahun duduk di kursi belakang mobil dalam perjalanan panjang. Sinyal naik turun, kuota orang tua tinggal sedikit, dan satu-satunya permintaan adalah \"Bun, main kartu belajar dong.\" Kalau aplikasinya baru bisa dipakai setelah loading dari internet, momen itu gagal. Anak bosan, orang tua repot, dan aplikasinya akhirnya dihapus.',
        'Itulah alasan utama Rajendra Pintar, aplikasi belajar untuk anak usia 4 sampai 8 tahun yang saya bangun, dirancang agar bisa dimainkan tanpa internet. Artikel ini membedah bagaimana hal itu dicapai, apa saja keputusan teknis di baliknya, dan yang tidak kalah penting, apa yang jujur tetap butuh koneksi.',
      ],
    },
    {
      heading: 'Offline-First Berbeda dari Sekadar Ada Mode Offline',
      paragraphs: [
        'Banyak aplikasi menambahkan mode offline di belakang, seperti tambalan: fiturnya berjalan normal kalau ada internet, dan kalau tidak ada, sebagian halaman mendadak kosong. Pendekatan offline-first terbalik. Aplikasi dirancang dengan asumsi bahwa internet tidak ada, lalu koneksi diperlakukan sebagai bonus untuk hal-hal tertentu.',
        'Untuk aplikasi anak, perbedaannya terasa langsung. Anak tidak tahu apa itu \"gagal memuat\". Ia hanya tahu layar yang tidak bergerak, dan ia akan berhenti memakainya. Karena itu keputusan offline saya ambil sejak awal, bukan ditambal di akhir.',
      ],
    },
    {
      heading: 'Apa yang Harus Selalu Tersedia',
      paragraphs: [
        'Langkah pertama adalah menentukan mana yang inti. Di Rajendra Pintar, inti pengalamannya adalah:',
        '• Ratusan kartu belajar interaktif di 9 bidang, dari kosakata sampai angka dan transportasi, dengan materi yang menyesuaikan lima jenjang usia (4 sampai 8 tahun).',
        '• Mode Kuis Ceria bergambar dengan umpan balik langsung dan efek konfeti.',
        '• Game Memori untuk melatih daya ingat visual.',
        '• Maskot, animasi, dan efek sentuhan layar yang membuat anak betah.',
        'Semua itu harus berjalan dari perangkat itu sendiri. Seluruh kartu belajar juga gratis dan tidak dikunci di balik pembayaran, jadi tidak ada materi inti yang bergantung pada pengecekan status di server.',
      ],
    },
    {
      heading: 'Lapisan Pertama: Service Worker di Versi Web',
      paragraphs: [
        'Rajendra Pintar bisa dibuka lewat browser sebagai Progressive Web App. Di sinilah Service Worker bekerja. Bayangkan ia sebagai penjaga gudang yang berdiri di antara aplikasi dan internet. Saat aplikasi pertama kali dibuka, penjaga ini menyimpan berkas yang dibutuhkan ke penyimpanan lokal perangkat. Pada pembukaan berikutnya, setiap permintaan dijawab dari gudang lokal lebih dulu, tanpa perlu menghubungi server.',
        'Hasilnya, setelah aplikasi dipasang ke layar utama lewat Add to Home Screen, materi belajar tetap tampil walaupun HP dalam mode pesawat. Tidak ada unduhan besar di awal seperti aplikasi toko, tapi pengalaman setelahnya terasa seperti aplikasi biasa. Perbandingan lengkap PWA dengan aplikasi mobile biasa ada di artikel \"Perbedaan Web App, Mobile App, dan PWA — Mana yang Kamu Butuhkan?\".',
        'Satu konsekuensi yang perlu dipahami: karena aplikasi dijawab dari simpanan lokal, versi baru aplikasi baru sampai ke perangkat ketika ada koneksi. Ini kompromi yang wajar dan memang bagian dari cara kerja teknologi ini.',
      ],
    },
    {
      heading: 'Lapisan Kedua: Capacitor untuk Versi Android',
      paragraphs: [
        'Tidak semua orang tua nyaman memasang lewat browser, dan sebagian lebih percaya aplikasi dari Google Play. Untuk itu saya memakai Capacitor 8, yang membungkus aplikasi web yang sama menjadi aplikasi Android asli (APK).',
        'Keuntungan terbesarnya bagi urusan offline: berkas aplikasi ikut terpaket di dalam aplikasi itu sendiri. Tidak ada tahap mengunduh materi setelah instalasi. Satu basis kode melayani dua jalur distribusi, jadi perbaikan di satu tempat terbawa ke yang lain dan saya tidak perlu memelihara dua aplikasi terpisah. Untuk developer tunggal seperti saya, itu bukan sekadar efisiensi, tapi syarat agar proyek bisa terus berjalan.',
      ],
    },
    {
      heading: 'Suara dan Efek Tanpa Berkas Berat',
      paragraphs: [
        'Aplikasi anak butuh banyak suara: pujian, klik ceria, tepuk tangan, nada kemenangan. Kalau semuanya berupa berkas audio, ukuran aplikasi membengkak dan semuanya harus ikut tersimpan di perangkat.',
        'Jalan keluarnya ada dua. Pertama, efek suara pendek seperti pop, chime, dan fanfare dihasilkan langsung lewat Web Audio API, jadi tidak memakan ruang penyimpanan sama sekali. Kedua, pelafalan kosakata dalam bahasa Indonesia dan Inggris memakai mesin text-to-speech dwibahasa, sehingga ratusan kata tidak perlu direkam satu per satu.',
        'Di sisi visual, animasi maskot dan kartu berjalan lewat pustaka animasi yang terpaket bersama aplikasi, begitu juga efek konfeti dan sentuhan layar. Karena dihasilkan di perangkat, semuanya tetap hidup tanpa koneksi.',
      ],
    },
    {
      heading: 'Apa yang Tetap Butuh Internet',
      paragraphs: [
        '\"100% offline\" paling jujur dimaknai pada materi belajarnya. Beberapa hal memang secara alami butuh koneksi:',
        '• Masuk dengan akun Google dan sinkronisasi akun cloud.',
        '• Pembayaran: Midtrans & Xendit (bersaklar .env) di versi web, serta Google Play Billing di versi Android.',
        '• Pemuatan pertama dan pembaruan versi aplikasi.',
        'Prinsipnya, hal-hal ini tidak boleh menghalangi anak belajar. Koneksi hanya diperlukan untuk urusan orang tua, bukan urusan anak. Dan karena seluruh kartu belajar gratis, seorang anak tetap bisa belajar penuh walaupun orang tuanya belum login atau sedang tanpa sinyal.',
      ],
    },
    {
      heading: 'Cara Menguji Klaim Offline Sebuah Aplikasi',
      paragraphs: [
        'Kamu bisa memakai cara ini pada aplikasi apa pun, termasuk milikmu sendiri:',
        '1. Buka aplikasi dan jalankan fitur utamanya sekali selagi online.',
        '2. Aktifkan mode pesawat.',
        '3. Tutup aplikasi sepenuhnya, lalu buka lagi.',
        '4. Coba fitur inti. Kalau semuanya tetap jalan, klaim offline-nya nyata. Kalau muncul layar putih atau pesan gagal memuat, berarti offline-nya hanya setengah.',
        'Uji sederhana ini sering jauh lebih jujur daripada brosur mana pun.',
      ],
    },
    {
      heading: 'Pelajaran untuk Bisnis yang Butuh Aplikasi Lapangan',
      paragraphs: [
        'Polanya sama dengan yang saya pakai di aplikasi bisnis: pisahkan apa yang harus selalu tersedia dari apa yang boleh menunggu koneksi. Staf gudang di ruang bawah tanah atau kasir di lokasi bersinyal lemah punya kebutuhan yang mirip dengan anak di dalam mobil, yaitu aplikasi yang tidak pernah berkata \"coba lagi nanti\".',
        'Sebelum memesan aplikasi, ada satu pertanyaan yang layak diajukan ke developer: kalau internet putus di tengah pekerjaan, bagian mana yang tetap jalan dan bagian mana yang berhenti? Jawabannya menunjukkan seberapa serius sistem itu dirancang untuk kondisi lapangan yang nyata.',
      ],
    },
    {
      heading: 'Kesimpulan & Refleksi',
      paragraphs: [
        'Membuat aplikasi yang bekerja saat sinyal bagus itu mudah. Yang membedakan adalah apa yang terjadi saat sinyalnya hilang. Rajendra Pintar saya rancang supaya jawabannya tetap sama: anak tetap bisa belajar.',
        'Kalau kamu sedang menimbang aplikasi untuk anak, tim lapangan, atau pelanggan di daerah dengan sinyal terbatas, pikirkan skenario terburuknya lebih dulu. Sistem yang baik adalah yang tetap berguna justru pada kondisi paling tidak ideal.',
        'Kalau penasaran dengan hasilnya, Rajendra Pintar bisa dicoba langsung di rapin.arzhaning.my.id. Coba uji sendiri dengan cara di atas: buka sekali, aktifkan mode pesawat, lalu lihat apa yang masih jalan. Untuk kebutuhan aplikasi lapangan di bisnismu, kamu juga bisa mengobrol dulu lewat WhatsApp.',
      ],
    },
  ],
  'mengenal-zhanotes-workspace-catatan-kanvas-pdf-local-first': [
    {
      paragraphs: [
        'Pernahkah kamu sedang rapat penting atau duduk di kereta dengan sinyal timbul-tenggelam, lalu aplikasi catatan favoritmu mendadak memutar ikon loading tanpa henti hanya untuk membuka catatan yang kamu tulis sendiri kemarin malam? Atau yang lebih sering terjadi pada pemilik bisnis dan peneliti: catatan rapat ada di satu aplikasi langganan, coretan alur kerja ada di aplikasi papan tulis lain, file PDF kontrak berceceran di folder unduhan, dan hitungan anggaran sederhana terpaksa pindah lagi ke spreadsheet.',
        'Keresahan itulah yang melahirkan ZhaNotes — ruang kerja pencatatan, kanvas visual bebas, kliping riset, dan anotator PDF yang saya rancang agar berjalan 100% langsung di browser perangkatmu. Tanpa kewajiban daftar akun, tanpa iklan, tanpa biaya server bulanan, dan seluruh datanya tersimpan utuh di perangkat pengguna sendiri.',
      ],
    },
    {
      heading: 'Dilema Aplikasi Catatan Modern: Sewa Selamanya atau Terpecah-pecah',
      paragraphs: [
        'Sebagian besar aplikasi produktivitas modern dibangun dengan model cloud-first berlangganan. Selama kamu rutin membayar biaya bulanan dan selalu terhubung ke internet, semuanya terasa nyaman. Masalahnya baru terasa dalam tiga situasi nyata:',
        '• Saat koneksi internet bermasalah, dokumen penting justru tidak bisa dibuka atau perubahannya gagal tersimpan.',
        '• Untuk catatan sensitif seperti draf kontrak klien, SOP internal perusahaan, atau rincian margin harga, tidak semua pemilik usaha tenang menaruh data mentahnya di server pihak ketiga.',
        '• Begitu masa langganan dihentikan atau penyedia layanan mengubah kebijakan harga, memindahkan ratusan catatan beserta gambar dan tautan antar-halamannya hampir selalu menyisakan format yang berantakan.',
        'Sebaliknya, kalau kembali ke aplikasi offline tradisional, alur kerjanya terpecah. Aplikasi pengolah kata tidak nyaman dipakai mencoret diagram, pembaca PDF tidak terhubung ke catatan riset, dan papan gambar tidak punya tabel yang bisa berhitung. ZhaNotes saya bangun untuk menyatukan empat ruang kerja itu di satu tempat dengan prinsip local-first.',
      ],
    },
    {
      heading: 'Empat Mode Ruang Kerja dalam Satu Aplikasi',
      paragraphs: [
        'Di ZhaNotes, setiap halaman bukan sekadar lembar teks kosong. Saat membuat dokumen baru, kamu memilih satu dari empat mode kerja yang memang dirancang khusus untuk jenis pemikiran yang berbeda:',
        '1. Halaman Rich-Text untuk dokumen terstruktur. Dilengkapi bilah alat 4 tab yang rapi, perintah cepat garis miring (/), 11 jenis kotak callout berwarna, daftar isi otomatis, catatan kaki, pelacak status bacaan, hingga 1.795 simbol matematika, mata uang, dan teknis dalam 24 kategori. Untuk peneliti atau mahasiswa, tersedia pula pengelola daftar pustaka hingga 200 sumber dengan 8 gaya sitasi otomatis mulai dari APA 7, IEEE, Harvard, hingga BibTeX.',
        '2. Kanvas Bebas untuk berpikir secara visual. Menggunakan HTML5 Canvas beresolusi tajam yang mendukung tekanan stylus, 4 preset pena, 23 bentuk geometri dan konektor pintar, minimap navigasi, hingga fitur pengenal bentuk otomatis — cukup tahan goresan tangan sekitar setengah detik, dan coretan kotak atau lingkaran kasar langsung berubah menjadi bangun rapi. Kamu bahkan bisa memasukkan halaman tertentu dari berkas PDF langsung ke atas kanvas untuk dicoret-coret bersama diagram.',
        '3. Riset & Kliping untuk mengumpulkan referensi web tanpa tercampur opini. Setiap kliping dipisah tegas menjadi empat blok: Tautan Sumber, Kutipan Asli, Tangkapan Layar, dan Catatan Pribadi. Pemisahan ini terinspirasi dari kebiasaan audit: fakta sumber dan interpretasi penulis tidak boleh melebur tanpa batas yang jelas.',
        '4. Pembaca & Anotator PDF langsung di browser. Tanpa mengunggah berkas ke server mana pun, kamu bisa menstabilo kalimat, memberi garis bawah, mencoret bebas, menempel kartu catatan, lalu mengekspornya kembali menjadi berkas PDF baru lengkap dengan seluruh coretan tersebut. Kutipan penting di PDF juga bisa dikirim lewat satu tombol "Ke Catatan" dan otomatis membuat tautan balik ke dokumen asalnya.',
      ],
    },
    {
      heading: 'Menghubungkan Ide: Wiki Backlinks, Peta Pengetahuan, dan Memo Suara',
      paragraphs: [
        'Keempat mode tadi tidak hidup di pulau masing-masing. Kamu bisa mengetik tanda kurung siku ganda seperti [[Rencana Proyek Q4]] di dalam catatan teks, kartu kanvas, maupun ekstraksi PDF untuk menghubungkan dua halaman secara dua arah.',
        'Ketika jumlah catatan sudah puluhan atau ratusan, menekan pintasan Alt+G akan membuka Peta Pengetahuan interaktif (force-directed graph). Setiap halaman tampil sebagai titik berwarna sesuai modenya, lengkap dengan garis hubungan yang memperlihatkan topik mana yang menjadi pusat pemikiranmu dan catatan mana yang masih berdiri sendiri.',
        'Untuk momen ketika mengetik terasa terlalu lambat — misalnya saat inspeksi lapangan atau diskusi lisan — tersedia perekam audio bawaan dengan penanda waktu (timestamp marker). Saat rekaman diputar ulang, kamu tinggal mengeklik penanda menit penting tanpa harus mendengar ulang dari detik nol.',
      ],
    },
    {
      heading: '72 Template Siap Pakai, dari RAB Bisnis sampai Latihan Anak',
      paragraphs: [
        'Halaman kosong sering kali membuat orang bingung harus mulai dari mana. Karena itu ZhaNotes menyertakan 72 template siap pakai yang terbagi ke 9 kategori: Kerja & Rapat, Bisnis & UMKM, Keuangan Pribadi, Kuliah & Belajar, Mengajar & Guru, Riset & Penulisan, Pribadi & Harian, Kreatif & Konten, serta Latihan & Belajar Anak.',
        'Beberapa template yang paling sering dipakai pemilik usaha adalah tabel pintar yang bisa menghitung sendiri — mulai dari Rencana Anggaran Biaya (RAB), pencatatan stok barang masuk-keluar, anggaran bulanan, hingga hitung patungan. Menariknya, ada juga modul latihan soal acak untuk anak dengan kunci jawaban yang dilindungi PIN Orang Tua 4–6 digit agar anak bisa berlatih mandiri sebelum jawabannya diperiksa bersama.',
      ],
    },
    {
      heading: '100% di Perangkatmu: Bagaimana Data Disimpan dan Dijaga dari Lock-In',
      paragraphs: [
        'Seluruh teks, gambar kanvas, rekaman suara, hingga berkas PDF di ZhaNotes disimpan di IndexedDB milik browser di perangkatmu. Prinsip dasarnya mirip dengan penyimpanan lokal yang pernah saya bahas di artikel "Kenapa Riwayat Chat AI Disimpan di Browser Kamu (IndexedDB), Bukan di Server Saya", namun dalam skala ruang kerja penuh.',
        'Artinya ada dua keuntungan langsung: kecepatan buka-simpan terasa instan karena tidak ada perjalanan bolak-balik ke server, dan privasi terjaga secara alami karena tidak ada satu byte pun catatanmu yang mampir ke server saya pada versi publik.',
        'Agar pengguna tidak pernah terjebak di dalam aplikasi (zero vendor lock-in), ZhaNotes menyediakan ekspor murni dari sisi perangkat ke berbagai format standar: dokumen Microsoft Word (.docx), PDF siap cetak, Markdown (.md), HTML mandiri, gambar kanvas (.png dan .svg), hingga cadangan penuh satu ruang kerja dalam bentuk berkas .zip yang memuat seluruh lampiran PDF dan audio.',
      ],
    },
    {
      heading: 'Batasan Jujur Versi Gratis dan Kapan Butuh Edisi Custom Beli-Putus',
      paragraphs: [
        'Sesuai prinsip keterbukaan di semua produk saya, arsitektur murni lokal punya konsekuensi yang wajib dipahami sejak hari pertama:',
        '• Karena data tinggal di penyimpanan browser perangkat tersebut, membersihkan data situs browser sampai tuntas tanpa menyimpan cadangan .zip terlebih dahulu akan ikut menghapus catatan lokalmu. ZhaNotes sudah memasang pengingat cadangan berkala untuk meminimalkan risiko ini.',
        '• Berpindah dari laptop ke HP tidak otomatis menyinkronkan isi catatan pada edisi publik gratis — kamu perlu mengekspor berkas atau memakai fitur cadangan.',
        '• PIN Orang Tua pada modul latihan anak dirancang sebagai pengunci antarmuka agar anak tidak mengintip kunci jawaban, bukan enkripsi kriptografi untuk dokumen rahasia.',
        'Untuk tim kecil, konsultan, klinik, atau sekolah yang menyukai cara kerja ZhaNotes tetapi membutuhkan logo serta domain perusahaan sendiri sekaligus sinkronisasi antarperangkat, saya menyediakan Edisi Custom Beli-Putus. Di edisi tersebut, sinkronisasi awan berjalan memakai enkripsi ujung-ke-ujung (AES-GCM) sehingga server tetap tidak pernah bisa membaca isi catatan — mekanisme teknisnya saya bedah terpisah di artikel selanjutnya.',
      ],
    },
    {
      heading: 'Kesimpulan & Cara Mencoba Langsung',
      paragraphs: [
        'Aplikasi produktivitas yang baik seharusnya menyesuaikan diri dengan cara manusia berpikir — kadang lewat paragraf rapi, kadang lewat coretan garis di kanvas, kadang lewat stabilo di atas PDF — tanpa membebani pengguna dengan tagihan langganan seumur hidup.',
        'Kamu bisa langsung mencoba ZhaNotes secara gratis di arzhaning.my.id/zhanotes/ dari laptop, tablet, maupun HP tanpa perlu mendaftar apa pun. Dan bila bisnismu membutuhkan ruang kerja serupa dengan identitas brand sendiri serta sinkronisasi terenkripsi untuk tim, kamu bisa berdiskusi langsung lewat Zannah di pojok layar atau menghubungi saya via WhatsApp.',
      ],
    },
  ],
  'dari-chat-ke-kontrak-ditandatangani-alur-zannah-devrab': [
    {
      paragraphs: [
        'Dalam proyek pengembangan software konvensional, perjalanan dari obrolan pertama sampai kontrak ditandatangani sering kali lebih melelahkan daripada proses kodingnya sendiri. Calon klien bercerita panjang lebar lewat chat, developer mencatat sepotong-sepotong, lalu menghilang tiga sampai lima hari untuk mengetik dokumen penawaran di Word dan menghitung angka di Excel. Saat PDF-nya dikirim, angkanya ternyata di atas anggaran klien, lalu proses negosiasi dan revisi dokumen dimulai lagi dari awal.',
        'Di artikel "Mengenal DevRAB: Mesin Proposal di Balik Tombol \'Buatkan RAB\' Milik Zannah", saya pernah memperkenalkan mesin pembuat proposal yang saya bangun. Kali ini kita akan menelusuri pipa sambungan utuhnya dari ujung ke ujung: bagaimana percakapan santai di chatbot berubah secara machine-to-machine menjadi draf teknis, portal penawaran interaktif, tanda tangan digital layar sentuh, hingga invoice pembayaran resmi tanpa satu kali pun salin-tempel manual di tengah jalan.',
      ],
    },
    {
      heading: 'Tahap 1: Gerbang Kesiapan 7 Poin di Zannah',
      paragraphs: [
        'Semuanya dimulai di widget chat Zannah di situs ini. Banyak orang mengira menghubungkan AI ke pembuat proposal berarti membiarkan chatbot langsung menembak harga begitu pengunjung mengetik "Saya mau bikin aplikasi kasir, berapa biayanya?". Kalau itu dibiarkan, angka yang keluar pasti ngawur karena konteksnya kosong.',
        'Sebaliknya, Zannah diprogram memegang daftar periksa (readiness gate) berisi 7 informasi kunci sebelum diizinkan memicu pembuatan proposal:',
        '1. Platform target (Web App, PWA, Android, iOS, atau kombinasi).',
        '2. Fitur-fitur utama dan alur kerja inti yang diinginkan.',
        '3. Siapa pengguna akhirnya (staf internal, vendor luar, atau pelanggan umum) beserta perkiraan skalanya.',
        '4. Target tenggat waktu rilis (deadline).',
        '5. Kisaran anggaran (budget) yang disiapkan klien.',
        '6. Nama lengkap penanggung jawab.',
        '7. Alamat email aktif untuk pengiriman akses portal resmi.',
        'Selama ketujuh poin ini belum lengkap, Zannah akan bertanya balik secara natural — bahkan bisa ikut membaca lampiran sketsa tangan, PDF spesifikasi lama, atau tabel CSV yang diunggah pengunjung. Baru setelah ketujuhnya terkonfirmasi jelas, Zannah memunculkan tombol konfirmasi untuk meneruskan ringkasan terstruktur ke mesin DevRAB.',
      ],
    },
    {
      heading: 'Tahap 2: Handoff Terstruktur dan Riset Pasar Otomatis di DevRAB',
      paragraphs: [
        'Begitu tombol pembuatan RAB ditekan, backend chatbot tidak mengirim tumpukan obrolan mentah begitu saja, melainkan merakit paket data JSON terstruktur yang dikirim lewat jalur server-ke-server terotentikasi menuju API Edge DevRAB di jaringan Cloudflare.',
        'Di dalam DevRAB, dua proses berjalan berurutan dalam hitungan puluhan detik:',
        '• Pertama, mesin pencari pasar memindai referensi tarif dan komponen teknis relevan di pasar Indonesia agar estimasi tidak lepas dari realitas industri lokal.',
        '• Kedua, mesin perumus ruang lingkup (Budget-Fitting Engine) memecah kebutuhan klien menjadi modul-modul kerja terukur lengkap dengan bobot hari kerja (man-days). Kalau anggaran yang disebut klien di chat Zannah terbatas, mesin tidak sekadar memangkas harga secara asal, melainkan memisahkan mana modul inti yang wajib ada di fase pertama (wajib/mandatory) dan mana fitur pelengkap yang sifatnya opsional.',
        'Pada tahap yang sama, sistem juga menyusun batas ruang lingkup kerja (Statement of Work): apa saja yang termasuk di dalam harga dan apa saja yang secara tegas berada di luar cakupan, beserta jadwal tahapan pembayaran (termin). Kejelasan batas di awal inilah yang kelak melindungi klien maupun developer dari salah paham di tengah proyek.',
      ],
    },
    {
      heading: 'Tahap 3: Portal Klien Interaktif, Bukan PDF Mati',
      paragraphs: [
        'Hasil kerja DevRAB tidak dikirim sebagai lampiran PDF kaku yang bikin klien hanya bisa menjawab "kemahalan" atau "oke". Sebagai gantinya, klien menerima tautan unik menuju Portal Klien yang dilindungi verifikasi email atau PIN akses.',
        'Di dalam portal tersebut, klien memegang kendali penuh untuk menyesuaikan ruang lingkup proyeknya sendiri secara langsung:',
        '• Mencermati deskripsi setiap modul fitur dan estimasi hari pengerjaannya.',
        '• Menyalakan atau mematikan centang pada modul-modul opsional sesuai prioritas bisnis saat ini.',
        '• Melihat total biaya investasi, durasi pengerjaan, dan rincian nominal tiap termin berubah secara real-time setiap kali satu fitur digeser.',
        'Psikologi negosiasinya berubah total. Klien tidak merasa sedang berhadapan dengan angka misterius sebagaimana sering terjadi di proposal konvensional — topik yang pernah saya ulas di artikel "Kenapa Harga Proposal Bisa Beda-beda Padahal Fiturnya Kelihatan Mirip". Kalau masih ada detail alur bisnis yang ingin disesuaikan, klien tinggal menulis catatan revisi langsung di portal tanpa perlu bertukar belasan file dokumen versi revisi.',
      ],
    },
    {
      heading: 'Tahap 4: Tanda Tangan Layar Sentuh, Pembayaran Xendit, dan Kontrak A4',
      paragraphs: [
        'Saat komposisi fitur dan anggaran sudah dirasa pas, klien tidak perlu mencetak dokumen, menandatangani di atas kertas, memindai ulang, lalu mengirim balik lewat chat. Di bagian persetujuan portal, tersedia kanvas tanda tangan digital yang bisa langsung digoreskan memakai jari di layar HP atau kursor di laptop.',
        'Begitu tanda tangan dikunci, tiga hal terjadi secara otomatis:',
        '1. Sistem mengunci daftar fitur yang disepakati beserta jejak waktu dan identitas persetujuan sehingga isi penawaran tidak bisa berubah sepihak.',
        '2. Tagihan termin pertama (DP) langsung diterbitkan melalui integrasi Xendit — klien bebas memilih membayar lewat QRIS, Virtual Account bank besar (BCA, Mandiri, BNI, BRI), e-wallet, atau mengunggah bukti transfer manual bila perusahaan klien memakai prosedur giro/rekening korporat.',
        '3. Dokumen proposal sekaligus kontrak kerja dan kuitansi berformat A4 eksekutif siap diunduh kapan saja, lengkap dengan penulisan angka rupiah dan ejaan "terbilang" bahasa Indonesia yang rapi.',
      ],
    },
    {
      heading: 'Batasan yang Tetap Membutuhkan Sentuhan Manusia',
      paragraphs: [
        'Walaupun pipa dari Zannah ke DevRAB berjalan otomatis penuh dari hulu ke hilir, saya tetap menarik garis tegas tentang kapan penilaian manusia wajib masuk:',
        '• Untuk proyek standar seperti landing page, company profile, chatbot bisnis, atau aplikasi operasional UMKM yang polanya jelas, draf dari Zannah dan DevRAB biasanya sudah langsung presisi dan siap dieksekusi.',
        '• Namun untuk sistem yang melibatkan integrasi perangkat keras khusus, migrasi puluhan ribu data warisan yang strukturnya belum rapi, atau aturan pajak dan akuntansi lintas entitas, draf otomatis tersebut berfungsi sebagai titik awal 80%. Dua puluh persen sisanya tetap saya tinjau dan tajamkan bersama klien lewat putaran revisi di portal sebelum tanda tangan dikunci.',
        'Otomasi di sini bukan untuk menghilangkan diskusi manusia, melainkan menghapus pekerjaan administratif berulang agar waktu diskusi kita habis untuk membahas solusi bisnisnya, bukan menunggu draf tabel diketik.',
      ],
    },
    {
      heading: 'Kesimpulan & Pelajaran untuk Proses Bisnis Kamu',
      paragraphs: [
        'Alur Zannah ke DevRAB membuktikan bahwa hambatan terbesar dalam penutupan penjualan jasa sering kali bukan pada harga, melainkan pada gesekan waktu tunggu di antara ketertarikan awal klien dan kejelasan penawaran tertulis.',
        'Pola yang sama persis bisa diterapkan di banyak industri di luar software: kontraktor interior, agensi kreatif, klinik perawatan, hingga distributor B2B yang setiap minggu menyusun penawaran kustom. Kalau kamu penasaran merasakan langsung bagaimana percakapan berubah menjadi portal penawaran interaktif dalam hitungan detik, silakan sapa Zannah di pojok kanan bawah halaman ini dan ceritakan ide sistem yang sedang kamu rencanakan.',
      ],
    },
  ],
  'portal-vendor-terisolasi-dan-knowledge-base-issue-tracker': [
    {
      paragraphs: [
        'Di banyak perusahaan distribusi dan manufaktur, meneruskan komplain pelanggan ke pemasok atau vendor sering dilakukan dengan cara paling cepat yang ada di tangan: tangkap layar chat pelanggan, lalu teruskan bulat-bulat ke grup WhatsApp vendor. Sekilas praktis. Namun tanpa disadari, kebiasaan kecil itu membuka dua lubang sekaligus — nama dan kontak pelanggan penting perusahaan bocor ke pihak luar, sementara solusi teknis yang ditemukan susah payah minggu ini menguap begitu saja saat staf berganti tiga bulan kemudian.',
        'Pada artikel "Kenapa Vendor Balas Seadanya, dan Cara Memaksa Akar Masalah", saya sudah membahas bagaimana Issue Tracker mendisiplinkan vendor lewat formulir analisis 4M dan penghitung tenggat otomatis. Di artikel ini, kita membedah dua fondasi arsitektur lainnya yang tidak kalah krusial di sistem yang sama: bagaimana isolasi akses tingkat server menjaga kerahasiaan pelanggan, dan bagaimana kasus yang selesai disulap menjadi basis pengetahuan (Knowledge Base) yang mencegah masalah kembar terulang.',
      ],
    },
    {
      heading: 'Bahaya Tersembunyi di Balik "Forward Chat" ke Vendor',
      paragraphs: [
        'Ketika perusahaan bekerja sama dengan belasan vendor — misalnya satu vendor memasok komponen mesin, vendor kedua mengurus kemasan, dan vendor ketiga menangani pengiriman — satu keluhan pelanggan sering kali menyentuh lebih dari satu pihak sekaligus.',
        'Jika koordinasinya dilakukan lewat grup chat atau lembar kerja bersama yang terbuka, tiga risiko bisnis langsung mengintai:',
        '• Kebocoran daftar pelanggan inti: vendor bisa mengetahui persis siapa pembeli terbesar perusahaanmu, volume pesanannya, hingga kontak person di sisi pembeli.',
        '• Saling lempar tanggung jawab: alih-alih fokus memperbaiki bagiannya, Vendor A dan Vendor B malah berdebat di kolom yang sama karena saling mengintip catatan pihak sebelah.',
        '• Tautan foto bukti yang bebas diakses siapa saja: folder bukti kerusakan sering disetel "siapa saja yang memiliki link dapat melihat" demi kepraktisan, sehingga foto dokumen surat jalan atau label pelanggan bisa dibuka ulang oleh orang yang sudah tidak lagi bekerja di vendor tersebut.',
      ],
    },
    {
      heading: 'Isolasi Tingkat Server: Bukan Sekadar Menyembunyikan Kolom di Layar',
      paragraphs: [
        'Di Issue Tracker, satu nomor kasus utama dari pelanggan dapat dipecah menjadi beberapa bagian masalah (sub-part), dan masing-masing bagian bisa ditugaskan ke vendor yang berbeda. Pembagian hak akses diatur ketat ke dalam empat peran: Admin, Staff, Viewer, dan Vendor.',
        'Kunci keamanannya terletak pada di mana penyaringan data dilakukan. Banyak aplikasi web pemula menyembunyikan data rahasia hanya di tampilan layar (frontend), padahal kalau respons jaringan dibuka lewat alat inspeksi browser, nama pelanggan masih ikut terkirim di balik layar. Di Issue Tracker, pemotongan data dilakukan mutlak di sisi server sebelum paket data meninggalkan backend:',
        '• Saat akun berstatus Vendor membuka portalnya, server hanya mengirimkan baris bagian masalah yang ditugaskan ke vendor tersebut — bagian milik vendor lain pada kasus yang sama sama sekali tidak ikut dikirim.',
        '• Kolom identitas pelanggan dipangkas habis di seluruh jalur komunikasi vendor: tidak tampil di tabel portal, tidak muncul di lonceng notifikasi dalam aplikasi, tidak tercetak di email pengingat tenggat otomatis, dan tidak ikut tersalin pada fitur rekap WhatsApp sekali klik.',
        '• Seluruh berkas bukti foto maupun dokumen di Google Drive disimpan tertutup tanpa satu pun link publik. Setiap kali pengguna melihat pratinjau atau mengunduh lampiran (maksimal 10 MB dengan kompresi foto otomatis di perangkat), permintaan wajib melewati pemeriksaan sesi dan kecocokan peran di server lebih dulu.',
      ],
    },
    {
      heading: 'Mengubah Kasus Selesai Menjadi Ingatan Perusahaan (Knowledge Base)',
      paragraphs: [
        'Menyelesaikan keluhan hari ini baru setengah pekerjaan. Pertanyaan audit yang jauh lebih mahal adalah: kalau enam bulan lagi gejala kerusakan yang persis sama muncul pada batch berikutnya, sementara staf senior yang dulu menanganinya sudah pindah divisi, apakah tim baru harus mengulang investigasi dari nol?',
        'Untuk memutus siklus amnesia operasional itu, Issue Tracker menyambungkan penutupan kasus langsung ke modul Knowledge Base:',
        '1. Ketika sebuah kasus telah tuntas beserta akar masalah 4M dan tindakan perbaikannya, staf atau admin dapat mengubah kasus tersebut menjadi draf artikel solusi hanya dalam beberapa klik.',
        '2. Admin melakukan verifikasi akhir agar hanya panduan perbaikan yang sudah teruji yang masuk ke perpustakaan resmi, lalu memilih apakah panduan tersebut hanya untuk tim internal atau ikut dibagikan ke portal vendor terkait.',
        '3. Saat tim menerima keluhan baru dan mulai mengetik kategori atau gejala masalah di formulir pembuatan kasus, sistem secara otomatis memunculkan saran artikel solusi serupa yang pernah berhasil di masa lalu.',
        'Hasilnya terasa nyata pada kecepatan layanan: banyak keluhan teknis ringan bisa langsung dijawab tim internal dalam hitungan menit berbekal catatan terverifikasi, tanpa harus menunggu eskalasi berhari-hari ke vendor.',
      ],
    },
    {
      heading: 'Menjaga Kecepatan di Atas 17 Sheet dan Cadangan Otomatis Jam 2 Pagi',
      paragraphs: [
        'Membangun fitur sekompleks multi-peran, pengingat SLA, dan Knowledge Base di atas ekosistem Google Apps Script dan Google Sheets tentu menuntut rekayasa performa yang disiplin. Di balik layar, struktur database Issue Tracker terbagi rapi ke dalam 17 tab terpisah (skema versi 14 dengan migrasi kolom otomatis) yang telah diuji menampung sekitar 20.000 kasus.',
        'Agar aplikasi tetap terasa gesit seperti aplikasi web modern, sistem menggabungkan penyimpanan cache memori (CacheService), pola pemuatan stale-while-revalidate di sisi layar, penomoran halaman dari server (server-side pagination), penulisan massal berkelompok saat admin melakukan aksi banyak baris sekaligus, hingga pengarsipan otomatis terjadwal untuk kasus lawas berusia 1, 3, 6, atau 12 bulan.',
        'Dan bagaimana jika suatu hari seseorang tidak sengaja merusak isi spreadsheet langsung dari Google Drive? Setiap pukul 02.00 dini hari, pemicu otomatis menjalankan pencadangan harian: sistem menyimpan hingga 14 salinan bergilir spreadsheet database beserta cadangan bertahap (incremental backup) untuk berkas lampiran. Jika terjadi keadaan darurat, admin cukup menekan tombol pemulihan dari panel pengaturan untuk mengarahkan sistem ke salinan sehat dan menyambungkan ulang tautan lampiran secara otomatis.',
      ],
    },
    {
      heading: 'Batasan yang Tetap Perlu Diperhitungkan',
      paragraphs: [
        'Sebagaimana saya jelaskan secara terbuka kepada setiap perusahaan yang menimbang arsitektur ini, pemakaian Google Sheets dan Apps Script bebas biaya server bulanan punya pagar teknis yang jelas: kuota pengiriman email pengingat mengikuti batas harian akun Google (sekitar 100 email/hari di Gmail biasa atau 1.500 di Google Workspace), ukuran lampiran dibatasi 10 MB per berkas agar eksekusi tidak melampaui batas waktu 6 menit Apps Script, dan rentang nyamannya berada di kisaran puluhan ribu kasus — bukan jutaan baris transaksi per jam.',
        'Namun justru untuk skala distributor, pabrik menengah, atau pengelola gedung dengan puluhan vendor aktif, pagar tersebut jarang sekali tersentuh, sementara penghematan biaya infrastruktur tahunannya sangat signifikan.',
      ],
    },
    {
      heading: 'Kesimpulan & Langkah Evaluasi',
      paragraphs: [
        'Kerahasiaan data pelanggan dan ingatan teknis perusahaan tidak boleh bergantung pada seberapa hati-hati staf menyunting tangkapan layar sebelum menekan tombol kirim di grup chat. Keduanya harus dijaga oleh desain sistem sejak baris kode pertama.',
        'Kamu bisa menjajal langsung perbedaan tampilan antara akun internal dan portal vendor yang terisolasi di demo Issue Tracker pada alamat itrack.arzhaning.my.id. Jika perusahaanmu punya alur koordinasi vendor atau cabang yang butuh disesuaikan dengan SOP sendiri, silakan sapa Zannah atau hubungi saya lewat WhatsApp untuk berdiskusi.',
      ],
    },
  ],
};