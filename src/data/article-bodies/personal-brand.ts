// Isi artikel untuk pilar "personal-brand" (satu file per pilar, dimuat lazy).
// Metadata (judul, excerpt, kategori, dll.) ada di ../articles.ts.
// Key = slug artikel. Artikel baru di pilar ini: tambahkan entri baru di bawah.
import type { ArticleBlock } from '../articles';

export const bodies: Record<string, ArticleBlock[]> = {
  'dari-audit-internal-ke-software-development': [
    {
      paragraphs: [
        'Banyak software engineer memulai perjalanannya dari jurusan ilmu komputer murni, bootcamp koding intensif, atau rasa penasaran membongkar game di masa remaja. Perjalanan saya sedikit berbeda: sebelum menulis puluhan ribu baris kode TypeScript dan merancang arsitektur database terdistribusi, dunia profesional pertama saya berakar kuat pada angka operasional, rekonsiliasi buku besar, dan audit internal.',
        'Menghabiskan bertahun-tahun menatap spreadsheet rekonsiliasi yang padat, membedah dokumen faktur fisik, dan melacak ke mana larinya selisih nominal beberapa ribu rupiah ternyata membentuk "kebiasaan berpikir" yang sangat membekas. Ketika saya beralih penuh menjadi software developer, insting auditor itu tidak hilang—justru bermutasi menjadi senjata terkuat dalam merancang arsitektur software yang tangguh.',
      ],
    },
    {
      heading: 'Studi Kasus Nyata: Mengapa Selisih Rp2.500 Sangat Berbahaya',
      paragraphs: [
        'Bagi orang awam atau developer pemula, selisih Rp2.500 pada neraca sering dianggap sepele: "Ah, cuma dua ribu perak, mungkin pembulatan desimal." Namun dalam kacamata audit internal, tidak pernah ada yang namanya selisih sepele.',
        'Pernah dalam satu audit inventory fisik di masa lalu, ditemukan selisih barang senilai beberapa ribu rupiah. Setelah ditelusuri riwayat mutasi kartunya baris demi baris, ternyata itu bukan barang hilang bernilai kecil—melainkan ada transaksi fiktif barang masuk senilai Rp10.002.500 yang sengaja dipasangkan dengan barang keluar senilai Rp10.000.000 untuk menutupi pencurian barang lain yang nilainya puluhan juta rupiah. Selisih Rp2.500 hanyalah residu dari manipulasi yang saling menutupi (net-off illusion).',
        'Pengalaman itu menanamkan sikap paranoid yang sehat pada diri saya: data transaksi bisnis bukan sekadar payload JSON yang dioper ke database, melainkan dokumen pertanggungjawaban hukum dan finansial.',
      ],
    },
    {
      heading: 'Pola Pikir Auditor dalam Desain Skema Database',
      paragraphs: [
        'Ketika banyak developer tergoda membuat alur CRUD sederhana dengan mengeksekusi perintah SQL "UPDATE saldo = saldo - 50000", insting audit saya langsung menolaknya. Dalam sistem keuangan dan inventaris yang saya rancang, ada tiga aturan mutlak:',
        '1. Pantang UPDATE Langsung pada Data Nilai: Nilai saldo atau kuantitas stok tidak boleh di-update secara telanjang. Kami menerapkan Double-Entry Event Ledger: setiap pergerakan nilai harus tercipta sebagai baris mutasi baru (INSERT only) yang memiliki sepasang referensi (debet dan kredit). Saldo saat ini adalah hasil agregasi deterministik dari seluruh riwayat mutasi yang pernah terjadi.',
        '2. Audit Trail yang Immutable (Tak Bisa Dihapus): Tabel mutasi di sistem kami dikunci secara ketat. Tidak ada hak akses DELETE atau UPDATE, bahkan untuk akun admin sekalipun. Setiap baris mencatat enam parameter forensik: actor_id, timestamp presisi milidetik, jenis aksi, IP perangkat, before_state_json, dan after_state_json.',
        '3. Checksum & Hash Verification: Untuk transaksi bernilai tinggi, setiap record dilengkapi hash kriptografi yang mengunci integritas data. Jika ada pihak yang mencoba menyusup langsung ke SQL untuk mengubah angka saldo, hash-nya akan pecah seketika dan sistem membunyikan peringatan anomali.',
      ],
    },
    {
      heading: 'Auto-Reconciliation Daemon: Sistem yang Mengaudit Dirinya Sendiri',
      paragraphs: [
        'Sistem yang sehat tidak boleh menunggu laporan komplain dari bagian akuntansi atau temuan selisih saat stock opname tahunan untuk menyadari adanya kebocoran data.',
        'Di produk seperti Assets DEMO dan DevRAB, kami menanamkan script rekonsiliasi otomatis (Auto-Reconciliation Daemon) yang berjalan di latar belakang setiap pergantian hari. Script ini menghitung ulang seluruh log mutasi dari hari pertama dan mencocokkannya dengan saldo snapshot penutupan buku. Jika terdeteksi selisih sekecil satu rupiah atau satu unit barang, sistem langsung mengisolasi transaksi terkait dan mengirimkan notifikasi instan ke penanggung jawab sistem.',
      ],
    },
    {
      heading: 'Menjembatani Bahasa Developer dan Kepentingan Pemilik Bisnis',
      paragraphs: [
        'Salah satu jurang pemisah terbesar dalam pengembangan software kustom adalah miskomunikasi: programmer berbicara dalam istilah teknologi abstrak (microservices, caching, latency, framework), sedangkan pemilik bisnis memikirkan margin laba, kelancaran arus kas, dan risiko fraud karyawan.',
        'Karena pernah duduk di kursi pemeriksa operasional, saya memahami kekhawatiran nyata pemilik bisnis tanpa perlu dijelaskan berbelit-belit. Saya paham kenapa bagian gudang butuh sistem approval bertingkat (maker-checker-approver), kenapa diskon kasir harus dibatasi toleransinya, dan kenapa surat jalan barang harus terkunci begitu dicetak. Diskusi proyek menjadi sangat efisien karena kami berbicara dalam frekuensi bahasa bisnis yang sama sejak menit pertama.',
      ],
    },
    {
      heading: 'Kesimpulan & Refleksi',
      paragraphs: [
        'Menulis kode yang berjalan tanpa error adalah standar minimum bagi setiap programmer. Namun merancang sistem yang mampu menjaga setiap rupiah modal klien, mencegah celah kecurangan operasional, dan siap diaudit kapan saja adalah nilai tambah yang hanya bisa lahir dari jam terbang memahami data nyata.',
        'Setiap kali saya merancang tombol aksi, alur form, atau relasi tabel baru hari ini, saya tidak hanya berpikir sebagai developer—tetapi sebagai auditor independen yang kelak harus mempertanggungjawabkan setiap digit angka di hadapan pemilik bisnis.',
      ],
    },
  ],
  'zero-server-cost-bukan-gimmick': [
    {
      paragraphs: [
        'Hampir setiap kali saya menuliskan frasa "Zero Server Cost" atau "tanpa biaya sewa server bulanan" pada penjelasan produk saya, reaksi pertama dari sesama programmer biasanya terbagi dua: ada yang penasaran bagaimana arsitekturnya dirakit, dan ada pula yang skeptis mengira itu sekadar kalimat pemanis pemasaran. Di sisi lain, pemilik usaha kecil sering bertanya dengan nada hati-hati: "Mas, kalau biaya servernya nol rupiah, jangan-jangan pakai hosting gratisan murahan yang bulan depan tiba-tiba mati?"',
        'Keduanya salah sangka yang sangat wajar. Bagi saya, Zero Server Cost sama sekali bukan soal mencari layanan abal-abal, melainkan disiplin arsitektur yang lahir dari satu pemandangan menyedihkan yang berkali-kali saya saksikan di dunia bisnis nyata: aplikasi internal yang sebenarnya bagus dan terpakai, akhirnya mati terkubur di tahun kedua hanya karena tagihan server bulanannya terasa memberatkan saat omzet perusahaan sedang melambat.',
      ],
    },
    {
      heading: 'Tragedi Tahun Kedua pada Proyek Digitalisasi UMKM',
      paragraphs: [
        'Coba tengok pola yang sering terjadi ketika sebuah usaha menengah pertama kali memesan aplikasi kustom. Di bulan pertama peluncuran, semangat masih tinggi. Developer menyewakan satu Virtual Private Server (VPS), database terkelola, dan layanan penyimpanan terpisah dengan total tagihan katakanlah lima ratus ribu hingga satu setengah juta rupiah setiap bulan.',
        'Masalahnya, untuk aplikasi internal seperti pencatatan inventaris kantor, pelacak keluhan vendor, atau ruang kerja dokumen tim, aplikasi tersebut tidak langsung mencetak uang tunai per klik seperti toko online ramai. Ia bekerja diam-diam menghemat jam kerja dan mencegah kebocoran.',
        'Memasuki bulan ke-14 atau ke-18, ketika bisnis kebetulan menghadapi musim sepi, bagian keuangan mulai menyisir pengeluaran rutin. Tagihan server bulanan mulai dipertanyakan, perpanjangan kartu kredit sempat terlambat beberapa hari, server otomatis disuspensi penyedia layanan, dan seluruh sistem yang sudah dibangun jutaan rupiah mendadak lumpuh. Sebagai orang yang berangkat dari latar belakang operasional dan audit internal, bagi saya merancang sistem dengan beban biaya tetap (fixed cost) yang tidak sebanding dengan frekuensi pakainya adalah cacat perencanaan sejak awal.',
      ],
    },
    {
      heading: 'Tiga Pilar Teknis di Balik Filosofi Zero Server Cost Saya',
      paragraphs: [
        'Menekan biaya infrastruktur rutin menjadi Rp0 di atas infrastruktur kelas dunia bukanlah sulap, melainkan soal meletakkan beban komputasi dan penyimpanan di tempat yang paling tepat. Di enam produk portofolio saya, filosofi ini mewujud dalam tiga pola arsitektur yang berbeda:',
        '1. Pindahkan beban kerja 100% ke browser pengguna (Local-First). Di ZhaNotes dan inti materi belajar Rajendra Pintar, perangkat ponsel atau laptop pengguna hari ini sudah memiliki prosesor cepat dan penyimpanan IndexedDB yang sangat lega. Mengapa kita harus menyewa server awan setiap bulan hanya untuk menyimpan catatan pribadi pengguna atau merakit berkas Word yang sebenarnya bisa dikerjakan langsung oleh browser mereka sendiri dalam hitungan milidetik?',
        '2. Manfaatkan infrastruktur akun kerja yang memang sudah dimiliki klien. Di Assets DEMO dan Issue Tracker, perusahaan tidak perlu menyewa server database baru karena akun Google mereka sendiri sudah menyediakan Google Sheets, Google Drive, dan mesin eksekusi Google Apps Script di atas pusat data resmi Google. Datanya 100% berada di tangan pemilik bisnis, bukan menumpang di server developer.',
        '3. Gunakan jaringan Serverless Edge modern dengan pagar kuota pintar. Untuk sistem yang tetap membutuhkan kecerdasan terpusat seperti portal kontrak DevRAB (Cloudflare Edge + Turso) maupun asisten AI Zannah dan Rajendra, server hanya "bangun" selama beberapa ratus milidetik saat ada permintaan masuk — tidak ada biaya mesin menganggur jam tiga pagi. Ditambah pagar pembatas kuota otomatis di Redis dan sistem fallback berlapis, kualitas layanan tinggi tetap berjalan di dalam koridor bebas tagihan kejutan.',
      ],
    },
    {
      heading: 'Apa Bedanya dengan "Hosting Gratisan" Zaman Dulu?',
      paragraphs: [
        'Penting sekali membedakan antara arsitektur tanpa biaya server tetap dengan hosting gratisan tidak jelas di masa lalu:',
        '• Hosting gratis murahan zaman dulu menaruh situsmu di satu komputer tua yang dibagi ribuan orang, disisipi iklan pop-up, lambat diakses, dan penyedianya bisa tutup kapan saja.',
        '• Sebaliknya, fondasi yang saya pakai hari ini berdiri di atas jaringan global perusahaan infrastruktur terbesar dunia — Cloudflare, Vercel, Google Cloud, Supabase, dan Upstash — yang memang menyediakan alokasi pemakaian awal (free tier / serverless) yang sangat besar untuk menarik ekosistem developer modern, selama kode kita ditulis efisien dan tidak boros.',
        'Justru untuk menjaga sistem tetap ringan di dalam koridor tersebut, developer dituntut bekerja lebih rapi: menulis skema cache yang hemat, mengompresi foto langsung dari layar HP sebelum diunggah, melakukan penulisan data secara berkelompok, dan menyingkirkan kueri berulang yang mubazir.',
      ],
    },
    {
      heading: 'Garis Jujur: Kapan Zero Server Cost Memang Harus Berakhir?',
      paragraphs: [
        'Filosofi yang sehat tidak boleh berubah menjadi dogma buta. Saya selalu jujur kepada klien bahwa tidak semua jenis aplikasi di muka bumi bisa atau boleh dipaksa gratis biaya server selamanya.',
        'Contoh paling nyatanya ada di portofolio saya sendiri, yaitu B-Games. Karena permainan multipemain menuntut ruang WebSocket yang terus menyala menjaga giliran enam pemain secara real-time beserta database PostgreSQL relasional, ada titik di mana layanan komputasi berbayar yang selalu siaga memang wajib dipakai. Begitu juga ketika sebuah sistem bisnis sudah tumbuh melayani ratusan ribu transaksi per bulan atau membutuhkan kapasitas penyimpanan terenkripsi skala besar.',
        'Namun perhatikan perbedaannya: ketika bisnismu sudah mencapai skala ribuan pengguna aktif harian, tagihan server beberapa ratus ribu rupiah sebulan bukan lagi beban yang menakutkan — melainkan remah kecil dari nilai ekonomi besar yang sedang berputar di atas sistem tersebut. Masalahnya bukan pada membayar server saat bisnis sudah berlari kencang, melainkan pada memaksa bisnis kecil membayar sewa truk kontainer padahal barang yang diangkut baru dua kardus sehari.',
      ],
    },
    {
      heading: 'Kesimpulan: Software Seharusnya Menjadi Aset, Bukan Pajak Bulanan',
      paragraphs: [
        'Pada akhirnya, Zero Server Cost adalah bentuk rasa hormat saya terhadap arus kas pemilik bisnis. Ketika kamu berinvestasi membangun sistem kerja kustom, uangmu seharusnya berubah menjadi aset produktif yang bekerja tenang bertahun-tahun tanpa terus-menerus menodongkan tagihan sewa bulanan yang tidak perlu.',
        'Prinsip itulah yang saya pegang konsisten dari produk pertama hingga hari ini — baik saat merancang aplikasi manajemen aset gudang, portal pelacak vendor, ruang kerja catatan ZhaNotes, maupun asisten AI yang menemanimu di situs ini. Jika kamu sedang menimbang pembuatan sistem untuk bisnismu dan ingin tahu apakah kebutuhanmu bisa dirancang dengan pendekatan hemat biaya server seperti ini, silakan mengobrol santai dengan Zannah di pojok layar atau hubungi saya langsung lewat WhatsApp.',
      ],
    },
  ],
};
