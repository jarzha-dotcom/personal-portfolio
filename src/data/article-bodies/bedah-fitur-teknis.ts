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
};
