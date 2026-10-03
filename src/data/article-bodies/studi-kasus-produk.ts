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
};
