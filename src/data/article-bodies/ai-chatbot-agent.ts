// Isi artikel untuk pilar "ai-chatbot-agent" (satu file per pilar, dimuat lazy).
// Metadata (judul, excerpt, kategori, dll.) ada di ../articles.ts.
// Key = slug artikel. Artikel baru di pilar ini: tambahkan entri baru di bawah.
import type { ArticleBlock } from '../articles';

export const bodies: Record<string, ArticleBlock[]> = {
  'apa-itu-cascade-ai-system': [
    {
      paragraphs: [
        'Salah satu kekhawatiran wajar soal chatbot berbasis AI: bagaimana kalau layanan AI-nya lagi bermasalah atau penuh antrean pas ada pengunjung yang butuh jawaban cepat? Kalau chatbot cuma bergantung ke satu model AI tunggal, jawabannya bisa berhenti total di momen yang salah. Cascade AI System dirancang khusus untuk mencegah situasi itu.',
      ],
    },
    {
      heading: 'Cadangan Bertingkat, Bukan Cuma Satu Rencana',
      paragraphs: [
        'Prinsipnya sederhana: kalau model AI utama sedang mengalami lonjakan antrean trafik di server Google, sistem secara otomatis mengalihkan percakapan ke model AI cadangan dalam hitungan milidetik — tanpa pengunjung menyadari ada perpindahan sama sekali. Salah satu model cadangan yang dipakai adalah Gemma 4, dengan kuota harian yang cukup besar (14.400 permintaan per hari), jadi ada ruang yang luas sebelum kuota itu ikut terlampaui.',
      ],
    },
    {
      heading: 'Lapisan Terakhir: Asisten Lokal yang Tidak Bergantung Internet AI',
      paragraphs: [
        'Yang paling menarik dari sistem ini adalah lapisan terakhirnya. Bahkan kalau koneksi ke seluruh layanan AI Google sedang terputus total, asisten lokal (Radit di website saya) tetap bisa menjawab puluhan pertanyaan umum secara mandiri — karena jawabannya sudah disiapkan dan berjalan tanpa harus memanggil AI eksternal sama sekali. Jadi pengunjung tidak pernah benar-benar mendapat "chatbot mati total", cuma turun tingkat kecerdasan jawabannya di skenario paling buruk.',
      ],
    },
    {
      heading: 'Prinsip yang Sama Juga Dipakai di Fitur Lain',
      paragraphs: [
        'Filosofi "jangan pernah berhenti total, turunkan saja tingkat kecanggihannya" ini bukan cuma dipakai di percakapan biasa. Di DevRAB, mesin pembuat proposal di balik Zannah, misalnya, kalau mesin generatornya gagal dihubungi setelah beberapa kali percobaan ulang, sistem tetap menyiapkan draf lokal seadanya alih-alih menampilkan pesan error ke pengunjung. Prinsip yang sama, diterapkan di lapisan yang berbeda.',
      ],
    },
    {
      heading: 'Kenapa Ini Bukan Sekadar Fitur Tambahan',
      paragraphs: [
        'Untuk chatbot bisnis yang jadi ujung tombak layanan pelanggan 24 jam, downtime di jam sibuk itu setara kehilangan calon pelanggan yang datang tepat saat sistem sedang bermasalah. Cascade system ini yang membuat chatbot tetap bisa diandalkan tanpa harus bayar SLA mahal ke satu provider AI tunggal — arsitekturnya sendiri yang jadi jaring pengamannya.',
      ],
    },
  ],
  'apa-itu-autonomous-agent-beda-chatbot-biasa': [
    {
      paragraphs: [
        '"AI Agent" makin sering dipakai sebagai istilah pemasaran, sampai sering disamakan begitu saja dengan chatbot biasa. Padahal keduanya bekerja dengan cara yang cukup berbeda — dan bedanya bukan cuma soal seberapa "pintar" jawabannya.',
      ],
    },
    {
      heading: 'Chatbot Biasa: Reaktif, Satu Putaran',
      paragraphs: [
        'Chatbot konvensional bekerja reaktif — kamu kirim pesan, dia balas satu jawaban, selesai. Kalau butuh beberapa langkah (cari data, olah, susun jadi dokumen, kirim), tiap langkah biasanya perlu dipicu manual satu per satu oleh penggunanya, atau alurnya sudah harus disusun kaku sejak awal lewat builder percakapan.',
      ],
    },
    {
      heading: 'Autonomous Agent: Satu Perintah, Banyak Langkah Otomatis',
      paragraphs: [
        'Autonomous Agent yang dipakai di layanan saya berjalan di atas Google Antigravity lewat Interactions API — agent serba-guna yang, dari satu permintaan, bisa bernalar, menjalankan kode, mengelola file, dan menyusun hasil akhirnya sendiri di dalam sandbox aman, tanpa perlu dituntun langkah demi langkah. Bedanya dengan chatbot biasa: satu permintaan bisa memicu rangkaian kerja otonom sampai tugasnya benar-benar selesai, bukan cuma satu balasan teks.',
      ],
    },
    {
      heading: 'Contoh Nyata: Generate Dokumen RAB/Riset Otomatis',
      paragraphs: [
        'Praktiknya di layanan yang saya kembangkan: Autonomous Agent bisa langsung men-generate dokumen RAB atau hasil riset secara instan begitu diminta — bukan sekadar menjawab dengan teks, tapi benar-benar menghasilkan dokumen jadi. Ditambah dengan multi-LLM auto-failover, kalau satu model AI sedang bermasalah, sistem otomatis beralih ke model lain supaya layanan tetap jalan tanpa downtime yang terasa oleh pengguna.',
      ],
    },
    {
      heading: 'Kapan Butuh Agent, Kapan Chatbot Biasa Sudah Cukup',
      paragraphs: [
        'Kalau kebutuhannya sekadar menjawab pertanyaan umum atau menangkap data lead dasar, chatbot biasa sudah lebih dari cukup — lebih murah dan lebih cepat dibangun. Autonomous Agent baru benar-benar dibutuhkan kalau prosesnya melibatkan banyak langkah yang harus dieksekusi sampai tuntas — misalnya menyusun dokumen dari data mentah, mengambil keputusan bertahap, atau menjalankan tugas yang biasanya butuh seseorang duduk mengerjakannya manual.',
      ],
    },
    {
      heading: 'Satu Catatan soal Biaya',
      paragraphs: [
        'Karena agent menjalankan banyak langkah bernalar dalam satu permintaan (bukan satu balasan sederhana), token yang dipakai per interaksi juga lebih banyak dibanding chatbot biasa. Untuk pemakaian skala kecil ini biasanya masih masuk kuota gratis harian dari Google AI Studio; begitu volumenya melewati kuota itu, biaya pay-as-you-go lewat Google Cloud mulai berlaku sesuai pemakaian. Rincian lebih lengkap soal komponen biaya ini ada di artikel "Berapa Biaya Sebenarnya Bikin Chatbot Custom?" — worth dibaca sebelum memutuskan skala fitur agent yang dibutuhkan.',
      ],
    },
  ],
  'custom-chatbot-vs-chatbot-template': [
    {
      paragraphs: [
        'Kalau kamu sedang mencari chatbot untuk bisnis, dua pilihan utama yang biasanya muncul: pakai platform chatbot template yang sudah jadi, atau bangun chatbot custom dari nol. Keduanya valid — pertanyaannya bukan "mana yang lebih bagus", tapi "mana yang cocok dengan kebutuhan bisnismu sekarang".',
      ],
    },
    {
      heading: 'Apa Itu Chatbot Template',
      paragraphs: [
        'Chatbot template adalah platform siap pakai seperti Chatfuel atau Tidio — tinggal daftar, susun alur percakapan lewat builder visual (drag-and-drop), dan chatbot langsung bisa dipasang di website atau WhatsApp dalam hitungan jam. Kelebihan utamanya jelas: cepat jalan, tidak perlu developer, dan ada versi gratis atau paket murah untuk mulai.',
        'Platform seperti ini paling pas untuk kebutuhan yang sifatnya generik — jawab FAQ, tangkap lead dasar (nama, email, nomor HP), atau arahkan pengunjung ke halaman tertentu. Kalau alur percakapannya sederhana dan tidak perlu "mikir", template sudah lebih dari cukup.',
      ],
    },
    {
      heading: 'Kapan Custom Lebih Masuk Akal',
      paragraphs: [
        'Masalahnya muncul begitu logika bisnismu tidak lagi sesederhana alur percakapan linear. Beberapa tanda kamu butuh solusi custom: chatbot perlu mengambil atau menulis data ke sistem internal (stok barang, status pesanan, database pelanggan), perlu menghasilkan dokumen otomatis (misalnya draf RAB atau laporan), atau perlu berjalan sebagai agent otonom yang bisa mengeksekusi tugas multi-langkah — bukan sekadar menjawab satu pertanyaan lalu selesai.',
        'Contohnya, layanan AI Chatbot & Virtual Agent yang saya kembangkan sendiri menggabungkan chatbot percakapan 2 arah (teks dan suara) dengan Autonomous Agent yang bisa langsung generate dokumen RAB/riset dan menjalankan alur lead generator lewat WhatsApp. Ini jenis kebutuhan yang tidak bisa disusun lewat builder drag-and-drop platform template — butuh integrasi dan logika yang memang dirancang khusus untuk proses bisnis tersebut.',
      ],
    },
    {
      heading: 'Perbandingan Biaya Jangka Panjang',
      paragraphs: [
        'Platform template biasanya memakai model biaya langganan bulanan yang naik seiring bertambahnya jumlah kontak, percakapan, atau fitur AI yang dipakai — sebagian bahkan sekarang menghitung biaya per percakapan yang dijawab, bukan biaya flat per bulan. Ini masuk akal untuk mulai dengan modal kecil, tapi biayanya bisa terus naik selama chatbot itu dipakai, dan biasanya makin mahal justru waktu bisnismu makin ramai — padahal itu momen yang seharusnya dirayakan, bukan bikin tagihan membengkak.',
        'Chatbot custom sebaliknya: ada biaya development di depan, tapi begitu selesai, sistemnya milik kamu sepenuhnya — tidak ada biaya langganan bulanan ke pihak platform yang terus berjalan selama chatbot dipakai. Break-even point-nya biasanya tercapai justru saat volume penggunaan sudah tinggi, kebalikan dari model langganan yang makin mahal seiring volume naik.',
      ],
    },
    {
      heading: 'Keputusan Berdasarkan Kebutuhan, Bukan Hype',
      paragraphs: [
        '"AI chatbot" sedang jadi kata kunci yang menarik, dan gampang tergoda pakai solusi paling canggih padahal kebutuhannya sebenarnya sederhana. Kalau kamu cuma butuh jawab FAQ dan tangkap lead dasar, chatbot template sudah cukup — tidak perlu custom yang lebih mahal dan lebih lama development-nya.',
        'Tapi kalau chatbot-nya perlu terhubung ke data internal, menjalankan tugas otomatis multi-langkah, atau jadi bagian dari alur kerja yang lebih besar (bukan sekadar widget percakapan di pojok website), di situlah custom mulai lebih masuk akal — baik dari sisi kemampuan maupun biaya jangka panjang. Kalau belum yakin masuk kategori mana, coba tulis tiga hal yang ingin dilakukan chatbot-mu. Kalau salah satunya menyentuh data internal atau tugas multi-langkah, itu sinyal untuk melirik solusi custom.',
      ],
    },
  ],
  'biaya-bikin-chatbot-custom-rincian': [
    {
      paragraphs: [
        'Paket AI Chatbot & Virtual Agent yang saya tawarkan dibanderol "mulai dari Rp1,5jt". Kata "mulai dari" ini bukan basa-basi pemasaran — harga final memang ditentukan lewat diskusi kebutuhan, fitur, dan kompleksitas, bukan angka tetap untuk semua orang. Supaya lebih jelas, ini rincian apa yang termasuk di harga awal dan apa yang bisa mengubahnya.',
      ],
    },
    {
      heading: 'Apa yang Termasuk di Harga Mulai Rp1,5jt',
      paragraphs: [
        'Paket dasarnya mencakup empat komponen: chatbot AI dengan percakapan cerdas, interaksi suara 2 arah (bisa dengar dan bicara, bukan cuma teks), Autonomous Agent untuk tugas otomatis, dan fitur lead generator lewat WhatsApp. Ini bukan sekadar chatbot FAQ — sudah termasuk kemampuan agent yang bisa mengeksekusi tugas, bukan cuma menjawab pertanyaan.',
      ],
    },
    {
      heading: 'Ke Mana Biayanya Mengalir: 4 Tahap Kerja',
      paragraphs: [
        'Setiap proyek — termasuk chatbot — melewati empat tahap: konsultasi kebutuhan (diskusi ide, fitur, target pengguna), desain & prototipe (wireframe dan preview interaktif sebelum coding penuh dimulai), development & testing (coding, integrasi, QA menyeluruh), lalu deployment & rilis (deploy ke server produksi plus maintenance awal). Harga mencakup keempat tahap ini secara end-to-end, dikerjakan langsung tanpa estafet antar tim.',
      ],
    },
    {
      heading: 'Apa yang Bikin Harga Naik dari Angka Awal',
      paragraphs: [
        'Beberapa hal yang biasanya menggeser harga dari estimasi awal: kompleksitas integrasi (misalnya chatbot perlu terhubung ke sistem stok atau database internal, bukan cuma menjawab dari data statis), jumlah channel yang didukung (WhatsApp saja vs WhatsApp + website + Instagram sekaligus), dan revisi mayor tambahan di luar revisi standar yang sudah termasuk dalam pengerjaan. Semakin spesifik logika bisnis yang harus dipahami chatbot, semakin besar juga waktu development-nya.',
      ],
    },
    {
      heading: 'Biaya yang Terpisah dari Development: Pemakaian API',
      paragraphs: [
        'Ini bagian yang penting untuk dipahami di awal: Autonomous Agent yang dipakai berjalan di atas layanan AI Google (Interactions API), dan ada dua jalur pemakaiannya. Lewat Google AI Studio, tersedia kuota gratis harian (free tier) — cukup untuk pemakaian skala kecil atau tahap awal. Begitu volume pemakaiannya melewati kuota gratis itu, atau butuh keandalan setara produksi, jalurnya pindah ke Google Cloud dengan skema pay-as-you-go — biaya dihitung dari token dan tools yang benar-benar dipakai agent saat bekerja, bukan biaya flat bulanan.',
        'Artinya, untuk chatbot dengan volume pemakaian yang masih ringan, biaya API-nya bisa saja Rp0 karena masih di dalam kuota gratis. Begitu bisnisnya makin ramai dan kuota gratis terlampaui, barulah biaya pay-as-you-go mulai berjalan sesuai volume pemakaian nyata. Siapa yang menanggung biaya ini kalau sampai terlampaui, dan di titik volume berapa itu biasanya terjadi untuk skala bisnismu, adalah pertanyaan yang wajar diajukan sejak diskusi awal — bukan sesuatu yang seharusnya baru diketahui belakangan.',
      ],
    },
    {
      heading: 'Cara Menghitung Estimasi Kasar untuk Bisnismu',
      paragraphs: [
        'Semakin sederhana kebutuhannya (satu channel, tanpa integrasi ke sistem internal, alur percakapan standar), semakin dekat harganya ke angka Rp1,5jt. Semakin kompleks (multi-channel, terhubung ke data bisnis, butuh logika khusus), semakin masuk akal untuk mengalokasikan budget lebih. Cara paling akurat tetap lewat konsultasi langsung — gratis dan tanpa kewajiban order — supaya estimasinya sesuai kebutuhan riil, bukan tebak-tebakan dari luar.',
      ],
    },
  ],
};
