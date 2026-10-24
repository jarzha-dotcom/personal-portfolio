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
};
