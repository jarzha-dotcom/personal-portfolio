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
  'single-active-session-mencegah-akun-dibajak': [
    {
      paragraphs: [
        'Ada satu fitur keamanan yang hampir tidak pernah disadari pengguna sampai suatu hari mereka tiba-tiba keluar sendiri dari aplikasi: login di perangkat baru, lalu sesi di perangkat lama langsung terputus. Namanya single active session: satu akun hanya boleh punya satu sesi aktif pada satu waktu.',
        'Sekilas ini terasa merepotkan. Tapi fitur kecil inilah yang menjaga dua hal penting di sistem bisnis: akun tidak mudah dipakai ramai-ramai, dan catatan \"siapa melakukan apa\" tetap bisa dipercaya. Di Assets DEMO, aplikasi manajemen aset yang saya bangun, fitur ini aktif sebagai bagian dari keamanan bertingkat.',
      ],
    },
    {
      heading: 'Sebuah Skenario Sehari-hari (Ilustrasi)',
      paragraphs: [
        'Bayangkan sebuah gudang dengan satu akun staf bernama \"gudang1\". Di atas kertas, akun itu milik Rina. Kenyataannya, passwordnya dibagikan ke tiga rekan yang bergantian memakai tablet gudang. Suatu hari, nilai satu aset diubah dan muncul selisih. Di catatan tertulis \"diubah oleh gudang1\". Siapa yang melakukannya? Tidak ada yang tahu, dan tidak ada yang bisa dimintai penjelasan.',
        'Tidak ada niat jahat dalam cerita ini. Berbagi akun hanya terasa praktis. Tapi akibatnya, jejak audit kehilangan fungsinya persis di saat dibutuhkan. Single active session adalah salah satu cara membuat situasi seperti ini lebih sulit terjadi.',
      ],
    },
    {
      heading: 'Cara Kerjanya Sederhana',
      paragraphs: [
        'Secara konsep, mekanismenya berjalan begini:',
        '1. Pengguna berhasil login, lalu sistem membuat tanda pengenal sesi dan mencatatnya sebagai satu-satunya sesi sah untuk akun itu.',
        '2. Setiap permintaan berikutnya dari perangkat tersebut membawa tanda pengenal itu, dan server memeriksanya.',
        '3. Kalau akun yang sama login dari perangkat lain, tanda pengenal yang lama diganti dengan yang baru.',
        '4. Ketika perangkat lama mencoba melakukan sesuatu, server mendapati tandanya sudah tidak berlaku dan memintanya login ulang.',
        'Tidak ada yang rumit di sisi pengguna. Yang berubah hanya satu aturan di server: untuk setiap akun, hanya satu sesi yang dianggap hidup. (Ini penjelasan tingkat konsep. Detail implementasi bisa berbeda antar sistem.)',
      ],
    },
    {
      heading: 'Masalah Pertama: Satu Akun, Banyak Orang',
      paragraphs: [
        'Di banyak kantor, godaan berbagi akun itu nyata. Satu akun admin dipakai bergantian karena lebih praktis daripada meminta akun baru. Dalam bisnis berbasis lisensi per pengguna, satu akun dibagi ke beberapa orang juga berarti pendapatan yang bocor.',
        'Dengan single active session, berbagi akun jadi tidak nyaman: begitu orang kedua login, orang pertama langsung terlempar. Orang akhirnya memilih meminta akun sendiri, dan itu memang perilaku yang diinginkan. Aturan yang tegas di sistem sering lebih efektif daripada imbauan di grup chat.',
      ],
    },
    {
      heading: 'Masalah Kedua: Audit Trail yang Kehilangan Arti',
      paragraphs: [
        'Ini bagian yang paling dekat dengan latar belakang saya di audit internal. Jejak audit hanya berguna kalau nama di dalamnya bisa dipercaya. Kalau di catatan tertulis \"diubah oleh Budi\" padahal akun Budi dipakai tiga orang, catatan itu sah secara teknis tapi tidak berguna saat ada selisih yang harus ditelusuri.',
        'Satu akun untuk satu orang adalah fondasi pertanggungjawaban. Single active session membantu menjaganya, karena penyalahgunaan akun bersama jadi sulit dilakukan diam-diam. Saya membahas peran jejak audit lebih luas di artikel \"Apa Itu Audit Trail, dan Kenapa Bisnismu Mungkin Butuh Fitur Ini Lebih dari yang Kamu Kira\".',
      ],
    },
    {
      heading: 'Masalah Ketiga: Tanda Pertama Akun Dibajak',
      paragraphs: [
        'Bayangkan password seorang staf bocor dan orang lain login memakainya. Tanpa pembatasan sesi, pemilik asli dan pembajak bisa aktif bersamaan tanpa ada yang sadar. Dengan sesi tunggal, salah satunya pasti terlempar. Pemilik asli yang tiba-tiba keluar sendiri akan bertanya-tanya, dan pertanyaan itu sering menjadi sinyal pertama bahwa ada yang tidak beres.',
        'Karena itu pengguna sebaiknya diajarkan satu kebiasaan: kalau tiba-tiba keluar sendiri padahal tidak login di tempat lain, laporkan dan ganti password. Fitur teknis hanya bekerja maksimal kalau orang-orangnya tahu cara menanggapi sinyalnya.',
      ],
    },
    {
      heading: 'Satu Lapisan di Antara Lapisan Lain',
      paragraphs: [
        'Single active session bukan pengganti password yang kuat, dan ia bukan satu-satunya perlindungan. Di Assets DEMO, keamanannya berlapis: password dilindungi dengan enkripsi acak bersalt kelas industri (penjelasan cara kerjanya ada di artikel \"Enkripsi Password Standar Militer Itu Apa, dan Kenapa Penting untuk Sistem Bisnis Kecil\"), dan akses dibagi per peran. Staf biasa hanya dapat melihat dan memindai aset, sementara perubahan nilai dan data sensitif ada di bawah wewenang administrator.',
        'Cara pikir yang sehat adalah anggap setiap lapisan pasti bisa jebol suatu hari, lalu pastikan ada lapisan berikutnya yang menahan. Sesi tunggal adalah lapisan yang murah, nyaris tanpa biaya, tapi menutup celah yang sering terlewat.',
      ],
    },
    {
      heading: 'Harga yang Harus Dibayar, dan Cara Meredamnya',
      paragraphs: [
        'Keamanan selalu punya ongkos kenyamanan, dan sebaiknya disebutkan terus terang:',
        '• Pengguna yang berganti dari HP ke laptop akan keluar dari perangkat sebelumnya.',
        '• Dua orang yang sah dan terbiasa berbagi akun akan protes.',
        '• Orang yang ingin membuka dua perangkat sekaligus untuk membandingkan data tidak bisa melakukannya.',
        'Ongkos ini bisa diredam dengan langkah sederhana: beri akun sendiri untuk setiap orang, termasuk staf shift, sehingga tidak ada alasan berbagi akun. Sampaikan aturan ini sejak pelatihan awal supaya tidak terasa sebagai gangguan. Dan tentukan prosedur serah terima untuk perangkat yang dipakai bergantian: logout di akhir shift, login dengan akun masing-masing.',
        'Menurut saya ongkos ini wajar untuk sistem yang menyimpan data aset dan mutasi bernilai. Untuk aplikasi yang tujuannya santai, aturan seketat ini mungkin berlebihan. Pertanyaannya selalu sama: seberapa mahal akibatnya kalau akun disalahgunakan tanpa ada yang tahu?',
      ],
    },
    {
      heading: 'Cara Menguji Sistem Mana Pun dalam Dua Menit',
      paragraphs: [
        'Kamu bisa memeriksa sendiri apakah sebuah aplikasi menerapkan pembatasan sesi:',
        '1. Login di perangkat A (misalnya laptop).',
        '2. Login dengan akun yang sama di perangkat B (misalnya HP).',
        '3. Kembali ke perangkat A, lalu coba lakukan sesuatu, misalnya membuka halaman lain atau menyimpan data.',
        'Kalau perangkat A masih berjalan normal, berarti sesi ganda diizinkan. Itu bukan otomatis salah, tapi kamu perlu tahu dan memilih dengan sadar. Untuk sistem yang menyimpan data bernilai, kebanyakan bisnis lebih nyaman dengan aturan satu sesi.',
      ],
    },
    {
      heading: 'Kesimpulan & Refleksi',
      paragraphs: [
        'Single active session adalah contoh keamanan yang hampir tidak terlihat: satu aturan kecil di server yang mencegah akun dipakai ramai-ramai dan menjaga catatan siapa-melakukan-apa tetap bermakna.',
        'Kalau kamu sedang menilai sistem untuk bisnismu, ajukan satu pertanyaan ke developernya: apa yang terjadi kalau satu akun login di dua perangkat sekaligus? Jawabannya memberi gambaran apakah sistem itu dirancang untuk dipertanggungjawabkan, bukan sekadar dipakai.',
        'Kamu juga bisa mencobanya langsung di assets.arzhaning.my.id: masuk dengan salah satu akun uji coba di laptop, lalu masuk dengan akun yang sama di HP, dan lihat apa yang terjadi pada sesi pertama.',
      ],
    },
  ],
  'enkripsi-password-standar-militer-itu-apa': [
    {
      paragraphs: [
        'Di halaman fitur banyak aplikasi, kamu mungkin pernah membaca kalimat seperti \"password dilindungi enkripsi standar militer\". Terdengar meyakinkan, tapi apa sebenarnya artinya? Dan apakah pemilik bisnis kecil perlu peduli?',
        'Saya memakai kalimat itu sendiri di materi beberapa produk, karena DevRAB memang melindungi akun admin dengan PBKDF2 SHA-256. Justru karena itu saya merasa perlu menjelaskannya dengan jujur: apa yang sebenarnya terjadi pada password, dan kenapa ini bukan fitur yang boleh dilewatkan.',
      ],
    },
    {
      heading: 'Dua Kemungkinan Setelah Database Bocor (Ilustrasi)',
      paragraphs: [
        'Bayangkan database sebuah sistem bisnis bocor ke tangan orang yang tidak berhak. Ini bisa terjadi pada sistem mana pun, besar maupun kecil. Yang menentukan seberapa parah akibatnya adalah cara password disimpan.',
        'Kemungkinan pertama: password tersimpan apa adanya. Penyerang membuka tabel pengguna dan langsung membaca semua password. Karena banyak orang memakai password yang sama di banyak tempat, kebocoran satu sistem merembet ke email, media sosial, bahkan akun lain milik mereka.',
        'Kemungkinan kedua: password tersimpan sebagai hash bersalt dengan banyak putaran. Penyerang mendapat deretan karakter acak yang tidak bisa dibaca, dan untuk menebak satu password saja ia harus mengulang proses pengolahan yang sengaja dibuat lambat. Dampaknya terbatas. Perbedaan dua kemungkinan inilah alasan fitur ini penting.',
      ],
    },
    {
      heading: 'Pertama: Password yang Baik Tidak Disimpan Sama Sekali',
      paragraphs: [
        'Sistem yang benar tidak menyimpan passwordmu. Yang disimpan adalah hasil olahan satu arah dari password itu, disebut hash. Saat kamu login, sistem mengolah password yang kamu ketik dengan cara yang sama lalu membandingkan hasilnya. Cocok berarti benar, tanpa pernah perlu menyimpan password aslinya.',
        'Konsekuensi menariknya: pengelola sistem pun tidak bisa memberi tahu passwordmu kalau kamu lupa. Yang bisa dilakukan hanya mengatur ulang. Kalau sebuah layanan bisa mengirimkan password lamamu lewat email, itu tanda bahaya.',
      ],
    },
    {
      heading: 'Hashing, Bukan Enkripsi',
      paragraphs: [
        'Secara teknis, enkripsi itu bisa dibuka kembali dengan kunci, sedangkan hashing tidak bisa dibalik. Untuk password, yang kita inginkan adalah hashing. Jadi kalau ada vendor menulis \"enkripsi password\", biasanya yang dimaksud sebenarnya hashing. Istilah enkripsi dipakai karena lebih mudah dipahami orang awam.',
        'Dan frasa \"standar militer\" lebih tepat dibaca sebagai bahasa pemasaran. Yang bisa diperiksa adalah nama algoritmanya. PBKDF2 adalah metode terbuka yang dipublikasikan dan sudah lama dipakai luas, bukan rahasia dan bukan milik militer mana pun. Kabar baiknya, justru karena terbuka dan banyak diuji, ia bisa dipercaya.',
      ],
    },
    {
      heading: 'Salt: Supaya Password yang Sama Tidak Menghasilkan Hash yang Sama',
      paragraphs: [
        'Bayangkan dua karyawan sama-sama memakai password yang umum. Tanpa tambahan apa pun, hash keduanya akan identik, dan penyerang yang berhasil menebak satu otomatis tahu yang lain. Penyerang juga bisa memakai tabel hash siap pakai berisi jutaan password umum untuk mencocokkan secara instan.',
        'Salt menyelesaikannya. Sebelum diolah, setiap password digabung dengan serangkaian karakter acak yang unik untuk masing-masing akun. Akibatnya, dua password yang sama menghasilkan hash yang berbeda, dan tabel siap pakai milik penyerang jadi tidak berguna. Inilah yang dimaksud frasa \"enkripsi acak bersalt\" di Assets DEMO.',
      ],
    },
    {
      heading: 'Putaran: Sengaja Dibuat Lambat',
      paragraphs: [
        'Bagian PBKDF2 yang paling menarik adalah iterasinya. Pengolahan password sengaja diulang puluhan ribu kali. Untuk satu kali login, itu hanya memakan sepersekian detik, nyaris tidak terasa oleh pengguna. Tapi bagi penyerang yang mencoba jutaan tebakan, setiap tebakan menjadi mahal, sehingga serangan tebak-tebakan yang tadinya cepat berubah menjadi sangat lambat.',
        'Di Issue Tracker, misalnya, password diolah dengan PBKDF2-HMAC-SHA256 plus salt sebanyak 60.000 putaran. Hash lama bahkan diperkuat otomatis saat pengguna login, jadi akun lama ikut naik standar tanpa pengguna melakukan apa-apa.',
        'Satu catatan jujur: di sana saya memakai PBKDF2 karena batasan platform Google Apps Script, bukan karena menganggapnya satu-satunya pilihan. Ada metode lain seperti bcrypt, dan pilihan terbaik memang bergantung pada platform yang dipakai.',
      ],
    },
    {
      heading: 'Hash Saja Tidak Cukup: Lapisan di Sekitarnya',
      paragraphs: [
        'Password yang tersimpan dengan baik tetap bisa ditebak kalau pintu login terbuka tanpa batas. Karena itu perlindungan harus berlapis. Contoh dari produk yang saya bangun:',
        '• Issue Tracker: lima kali gagal login menyebabkan akun terkunci bertahap, 1 menit, lalu 5 menit, lalu 15 menit. Hitungan kembali ke awal setelah 1 jam tanpa percobaan. Password juga ditolak kalau berupa kata umum atau urutan sederhana.',
        '• DevRAB: sistem anti brute-force memblokir percobaan masuk mencurigakan yang berulang, dan portal klien hanya menampilkan proposal yang bersangkutan.',
        '• Assets DEMO: sesi tunggal mencegah satu akun dipakai bersamaan, dan akses dibagi per peran.',
        'Keamanan sistem datang dari kombinasi lapisan-lapisan ini, bukan dari satu istilah yang terdengar canggih.',
      ],
    },
    {
      heading: 'Bagian yang Tetap Tanggung Jawab Pengguna',
      paragraphs: [
        'Secanggih apa pun penyimpanannya, password lemah tetap lemah. Beberapa kebiasaan sederhana yang layak disampaikan ke tim:',
        '• Pilih password yang panjang. Kalimat acak yang mudah diingat lebih kuat daripada kata pendek dengan simbol.',
        '• Jangan memakai password yang sama di banyak layanan.',
        '• Pertimbangkan password manager supaya tidak perlu mengingat semuanya.',
        '• Jangan membagikan password lewat chat, dan jangan berbagi akun.',
        'Sistem yang baik membantu dengan menolak password yang terlalu umum dan membatasi percobaan, tetapi kebiasaan penggunanya tetap menentukan.',
      ],
    },
    {
      heading: 'Apa yang Perlu Kamu Tanyakan ke Developer',
      paragraphs: [
        'Kamu tidak perlu memahami matematikanya. Cukup ajukan beberapa pertanyaan berikut:',
        '1. Apakah password disimpan sebagai hash dengan salt, dan bukan sebagai teks biasa?',
        '2. Algoritma apa yang dipakai, dan berapa putarannya?',
        '3. Apa yang terjadi kalau seseorang menebak password berkali-kali?',
        '4. Apakah akun yang dibajak bisa dideteksi, misalnya lewat pembatasan sesi?',
        '5. Kalau saya lupa password, apakah sistem mengirim password lama, atau mengatur ulang yang baru?',
        'Developer yang serius akan menjawab semuanya dengan lugas. Kalau jawabannya hanya \"aman kok, pakai enkripsi\", tanyakan lebih lanjut. Pertanyaan spesifik adalah cara termudah membedakan keamanan sungguhan dari sekadar slogan.',
        'Salah satu lapisan lain yang layak ditanyakan adalah pembatasan sesi, yang saya bahas di artikel \"Single Active Session: Fitur Kecil yang Mencegah Akun Dibajak atau Dipakai Bersama\".',
      ],
    },
    {
      heading: 'Kesimpulan & Refleksi',
      paragraphs: [
        'Perlindungan password yang baik intinya tiga hal: jangan simpan passwordnya, beri salt agar setiap hash unik, dan perlambat proses tebakan lewat banyak putaran. Sisanya adalah lapisan pendukung seperti penguncian login dan pembatasan sesi.',
        'Ini bukan fitur yang dipamerkan di brosur, tapi justru saat terjadi kebocoran data, inilah yang menentukan apakah dampaknya terbatas atau meluas. Untuk sistem yang menyimpan data bisnismu, layak dipastikan fondasi ini ada. Kalau kamu ingin membahas keamanan untuk sistem bisnismu, kamu bisa mengobrol dulu lewat WhatsApp.',
      ],
    },
  ],
};