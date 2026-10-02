// Isi artikel untuk pilar "zero-server-cost" (satu file per pilar, dimuat lazy).
// Metadata (judul, excerpt, kategori, dll.) ada di ../articles.ts.
// Key = slug artikel. Artikel baru di pilar ini: tambahkan entri baru di bawah.
import type { ArticleBlock } from '../articles';

export const bodies: Record<string, ArticleBlock[]> = {
  'kenapa-4-proyek-saya-pakai-4-arsitektur-backend-berbeda': [
    {
      paragraphs: [
        'Sering ada yang nanya begini setelah baca artikel saya soal Zero Server Cost pakai Google Apps Script: "kalau gitu semua sistem yang kamu bikin pasti pakai Google Sheets dong?" Jawabannya tidak. Dari beberapa sistem yang saya bangun — baik yang jadi showcase publik maupun yang bekerja diam-diam di balik layar — masing-masing pakai arsitektur database dan hosting yang berbeda. Itu pilihan sadar, bukan karena tidak konsisten.',
      ],
    },
    {
      heading: 'Assets DEMO — Google Sheets & Google Apps Script',
      paragraphs: [
        'Untuk sistem manajemen aset seperti Assets DEMO, kebutuhan utamanya adalah biaya Rp0 per bulan dan kepemilikan data 100% di tangan klien — bukan tersimpan di server pihak ketiga yang harus dipercaya begitu saja. Volume transaksinya pun tidak ekstrem: pencatatan aset, mutasi, depresiasi bulanan — bukan ribuan transaksi bersamaan tiap detik. Google Sheets sebagai database dan Apps Script sebagai logic engine pas untuk profil kebutuhan ini.',
      ],
    },
    {
      heading: 'B-Games — Supabase (PostgreSQL)',
      paragraphs: [
        'B-Games itu cerita yang beda sama sekali. Ada relasi data yang jauh lebih kompleks — profil pengguna, daftar pertemanan, dompet koin, riwayat pertandingan, leaderboard global yang harus di-query dan diurutkan cepat. Ini jenis kebutuhan yang Google Sheets tidak akan sanggup tangani dengan baik begitu datanya membesar — query relasional semacam itu memang wilayahnya database seperti PostgreSQL.',
        'Supabase dipilih karena memberi database PostgreSQL penuh plus autentikasi dan realtime subscription siap pakai, tanpa harus mengelola server database sendiri dari nol.',
      ],
    },
    {
      heading: 'DevRAB — Cloudflare Edge & Turso',
      paragraphs: [
        'DevRAB — mesin proposal yang dipanggil Zannah saat pengunjung minta dibuatkan RAB — beda dari dua sistem di atas: bukan showcase dengan halaman demo publik, melainkan platform yang bekerja di belakang chat. Kenalan lengkapnya ada di artikel "Mengenal DevRAB", tapi keputusan arsitekturnya tetap relevan dibahas di sini karena pertimbangannya beda lagi.',
        'Mesin ini dipakai dari mana saja tanpa tahu kapan trafiknya datang, jadi latensi akses harus tetap rendah dari kota mana pun. Cloudflare dipilih karena jaringannya tersebar di ratusan pusat data global, dan Turso sebagai database terdistribusi memastikan data proposal dan status pembayaran tersinkron cepat tanpa satu titik kegagalan tunggal.',
      ],
    },
    {
      heading: 'Website Portofolio Utama — Vercel',
      paragraphs: [
        'Untuk situs utama sendiri, trafiknya tidak menentu — bisa sepi, bisa melonjak kalau ada yang membagikan link ke grup atau media sosial. Vercel dengan arsitektur serverless-nya cocok untuk pola ini: fungsi backend cuma aktif dan dikenai biaya saat ada permintaan, bukan biaya flat bulanan yang tetap jalan meski trafiknya nol.',
      ],
    },
    {
      heading: 'Pertanyaan yang Sebenarnya Menentukan Pilihan',
      paragraphs: [
        'Kalau ditarik pola umumnya, ada empat pertanyaan yang saya ajukan sebelum menentukan arsitektur untuk sistem apa pun (termasuk punya klien): seberapa kompleks relasi datanya, seberapa besar toleransi biaya bulanan, siapa yang harus punya kendali penuh atas data, dan seberapa penting sinkronisasi real-time antar banyak pengguna sekaligus. Jawaban dari empat pertanyaan itu yang menentukan arsitekturnya — bukan sekadar ikut tren teknologi yang lagi ramai dibicarakan.',
        'Bingung menentukan arsitektur untuk bisnismu? Jawab keempat pertanyaan itu versi bisnismu sendiri, lalu bawa hasilnya ke chat Zannah — itu sudah cukup jadi bahan awal diskusi.',
      ],
    },
  ],
  'kenapa-google-apps-script-untuk-klien-kecil-menengah': [
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
  'tanda-waktunya-migrasi-dari-apps-script': [
    {
      paragraphs: [
        'Di artikel sebelumnya saya jelaskan kenapa Google Apps Script jadi pilihan efisien untuk sistem klien kecil-menengah — gratis, tanpa biaya server bulanan, dan cukup untuk kebutuhan operasional sehari-hari. Tapi "cukup untuk sekarang" tidak selalu berarti "cukup selamanya". Berikut lima tanda sistemmu sudah mulai kelewat besar untuk pendekatan ini.',
      ],
    },
    {
      heading: '1. Sering Kena Galat "Batas Eksekusi" atau "Kuota Terlampaui"',
      paragraphs: [
        'Google Apps Script membatasi satu eksekusi maksimal sekitar 6 menit, dan punya kuota panggilan layanan harian yang di-reset tiap hari (angka resminya bisa berubah sewaktu-waktu, jadi cek dokumentasi kuota Google untuk versi terbaru). Sesekali kena galat ini wajar (biasanya karena proses yang belum dioptimalkan), tapi kalau errornya sudah rutin muncul di jam sibuk — itu tanda beban kerja sistemmu sudah melewati kapasitas yang wajar untuk platform ini.',
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
        'Apps Script sebenarnya bisa menjalankan beberapa eksekusi sekaligus, tapi ada batasnya — dokumentasi Google saat ini menyebut 30 eksekusi simultan per pengguna. Yang lebih sering jadi masalah justru penulisan ke Sheets: kalau dua orang menyimpan ke area data yang sama di saat bersamaan, urutannya harus diatur dengan penguncian (LockService), dan selama kunci dipegang, proses lain harus menunggu giliran. Ini tidak masalah untuk sistem yang dipakai beberapa petugas sekaligus, tapi kalau kebutuhanmu sudah mengarah ke puluhan atau ratusan user menulis data pada detik yang sama (misalnya sistem kasir multi-cabang real-time), arsitektur berbasis server dengan database yang memang dirancang untuk concurrency tinggi akan jauh lebih stabil.',
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
        'Kalau satu atau dua tanda di atas mulai terasa, bukan berarti sistemnya harus dibongkar total. Sering kali solusinya hybrid — bagian yang masih ringan tetap di Apps Script, bagian yang sudah berat dipindah ke server/database khusus. Kalau satu atau dua tanda di atas sudah terasa, catat dulu galat apa yang paling sering muncul dan di jam berapa — itu data paling berguna untuk menentukan bagian mana yang perlu dipindah lebih dulu.',
      ],
    },
  ],
};
