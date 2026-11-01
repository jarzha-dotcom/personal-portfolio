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
};