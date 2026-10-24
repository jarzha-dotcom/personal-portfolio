// Isi artikel untuk pilar "keamanan-data" (satu file per pilar, dimuat lazy).
// Metadata (judul, excerpt, kategori, dll.) ada di ../articles.ts.
// Key = slug artikel. Artikel baru di pilar ini: tambahkan entri baru di bawah.
import type { ArticleBlock } from '../articles';

export const bodies: Record<string, ArticleBlock[]> = {
  'amankah-data-bisnis-di-google-sheets-drive': [
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

  'kenapa-riwayat-chat-ai-disimpan-di-browser-kamu': [
    {
      paragraphs: [
        'Jika Anda pernah berkonsultasi mengenai estimasi proyek atau mendiskusikan ide aplikasi dengan Zannah, Rajendra, atau Radit di situs ini, Anda mungkin sempat bertanya-tanya: ke mana perginya seluruh riwayat obrolan tersebut? Apakah percakapan itu disimpan di server saya, dianalisis tim pemasaran, atau disimpan di database cloud?',
        'Jawabannya mungkin mengejutkan: 100% data percakapan Anda disimpan langsung di browser perangkat Anda sendiri melalui teknologi IndexedDB. Tidak ada database server, tidak ada logging percakapan di cloud, dan bahkan saya sendiri sebagai pemilik website tidak memiliki akses teknis untuk mengintip isi konsultasi Anda.',
      ],
    },
    {
      heading: 'IndexedDB vs LocalStorage: Kenapa Pilihan Ini Krusial',
      paragraphs: [
        'Banyak developer website memilih jalan pintas dengan menggunakan localStorage untuk menyimpan data sementara. Namun localStorage memiliki dua kelemahan fatal:',
        '1. Blocking UI Thread: localStorage bersifat sinkron (synchronous). Jika ada riwayat percakapan panjang yang dibaca, antarmuka browser bisa terasa tersendat (freeze).',
        '2. Batas Kapasitas Sempit: Hanya mampu menampung sekitar 5MB teks mentah tanpa dukungan pengindeksan data terstruktur.',
        'IndexedDB adalah database NoSQL bawaan standar industri yang tertanam di Chrome, Firefox, Safari, dan Edge. Bersifat asinkron penuh (non-blocking), mendukung indexing bertingkat (object stores), dan mampu menampung ratusan megabyte data percakapan, lampiran draf, serta ringkasan RAB tanpa memperlambat navigasi situs sedikit pun.',
      ],
    },
    {
      heading: 'Arsitektur "Zero-Knowledge Storage" di Sisi Server',
      paragraphs: [
        'Keputusan meniadakan database chat di server adalah penerapan filosofi Zero-Knowledge Architecture.',
        'Dalam arsitektur tradisional, setiap pesan pengunjung dikirim ke server, disimpan di PostgreSQL/MongoDB, lalu diteruskan ke AI. Jika server tersebut mengalami kebocoran data (data breach) atau akun cloud diretas, seluruh riwayat percakapan rahasia klien bisa terekspos ke publik.',
        'Di website ini, jalur penyimpanan di server sama sekali tidak dibuat (zero endpoint). Ketika Anda mengobrol dengan AI, browser Anda hanya bertukar konteks langsung dengan model AI terenkripsi. Begitu respon diterima, teks langsung disimpan di brankas IndexedDB lokal laptop atau ponsel Anda. Bahkan jika server website ini disusupi peretas sekalipun, peretas tidak akan menemukan satu pun rekaman obrolan Anda.',
      ],
    },
    {
      heading: 'Kepatuhan Regulasi Privasi & UU Perlindungan Data Pribadi (UU PDP)',
      paragraphs: [
        'Di era regulasi privasi global (GDPR) dan UU Perlindungan Data Pribadi (UU PDP) di Indonesia, mengumpulkan data pengguna yang tidak esensial adalah liabilitas hukum yang sangat berisiko.',
        'Prinsip terbaik dalam keamanan siber adalah Data Minimization: "Data yang tidak pernah dikumpulkan adalah data yang tidak akan pernah bisa bocor."',
        'Calon klien bisnis yang berkonsultasi di situs ini sering membagikan gambaran alur bisnis, estimasi anggaran proyek, atau problem internal perusahaan. Dengan arsitektur client-side IndexedDB, calon klien memiliki jaminan privasi mutlak tanpa perlu menandatangani NDA rumit hanya untuk sekadar berkonsultasi di awal.',
      ],
    },
    {
      heading: 'Kedaulatan Penuh di Tangan Pengguna & Trade-off yang Perlu Dipahami',
      paragraphs: [
        'Karena data sepenuhnya milik Anda di perangkat lokal, Anda memegang kendali penuh:',
        '• Ekspor Kapan Saja: Anda bisa menyalin atau mengekspor rangkuman RAB hasil percakapan dengan Zannah tanpa khawatir data itu tertahan di sistem pihak ketiga.',
        '• Hapus Total Seketika: Cukup dengan tombol "Hapus Riwayat" di widget chat atau membersihkan cache browser, seluruh database IndexedDB langsung terhapus bersih tanpa meninggalkan jejak bayangan di server.',
        'Namun ada trade-off yang disengaja: percakapan di laptop Anda tidak akan otomatis tersinkronisasi jika Anda membuka situs ini dari smartphone, dan sesi obrolan akan hilang jika Anda menggunakan mode Incognito (Private Browsing). Bagi kami, mengorbankan sinkronisasi otomatis demi garansi privasi 100% adalah pertukaran yang sangat layak.',
      ],
    },
    {
      heading: 'Kesimpulan & Komitmen Profesional',
      paragraphs: [
        'Keamanan dan privasi data bukan sekadar janji manis di halaman syarat & ketentuan (Terms of Service)—keamanan harus dibuktikan lewat keputusan arsitektur kode yang nyata sejak baris pertama.',
        'Jika bisnis Anda membutuhkan aplikasi atau sistem operasional yang menempatkan keamanan data dan kepercayaan pengguna sebagai prioritas utama, pendekatan arsitektur seperti inilah yang selalu saya bawa ke setiap proyek klien.',
      ],
    },
  ],
};
