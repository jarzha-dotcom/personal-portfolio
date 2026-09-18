# 🏢 Assets DEMO — Sistem Manajemen & Inventaris Aset Modern

> **Solusi All-in-One Cerdas untuk Pelacakan, Penilaian Depresiasi Otomatis, dan Tata Kelola Aset Perusahaan.**  
> *Dapat diakses langsung melalui Web (PWA), Android, dan iOS tanpa beban biaya server terpisah.*

---

## 🌟 Ringkasan Eksekutif (Executive Summary)

**Assets DEMO** adalah platform manajemen inventaris dan aset modern yang dirancang untuk mempermudah perusahaan memantau siklus hidup seluruh aset fisik maupun inventaris kantor secara transparan, akurat, dan terstruktur.

Dibangun khusus untuk menjawab tantangan audit dan pencatatan aset fisik di **PT Global Multiparts** yang tersebar di berbagai unit/cabang. Sistem ini mendigitalisasi pelacakan kondisi barang, penempelan label QR/barcode, pencatatan mutasi antar lokasi dengan audit log lengkap, hingga ekspor laporan otomatis format Excel/PDF untuk kebutuhan audit berkala. Versi publik yang dapat dicoba adalah **"Assets Demo"** dengan data simulasi demi menjaga kerahasiaan data internal klien.

Dengan mengintegrasikan teknologi **Multi-Platform (Mobile & Web)** serta sistem **Serverless Berbiaya Nol**, aplikasi ini memungkinkan tim lapangan hingga jajaran manajemen melakukan pelacakan lokasi aset, pengecekan riwayat mutasi, pencatatan servis berkala, kalkulasi nilai buku aset (penyusutan finansial), hingga ekspor laporan resmi hanya dalam hitungan detik.

### 🌐 Akses & Pratinjau Demo
* **Tautan Aplikasi:** [https://assets.arzhaning.my.id/](https://assets.arzhaning.my.id/)
* **Kategori Platform:** Progressive Web App (PWA), Android Native, & iOS Ready
* **Pengembang:** Arzhaning *(admin@arzhaning.my.id)*

### 🛡️ Status Deployment & Perlindungan Data Klien
Sistem asli telah di-deploy dan aktif digunakan untuk operasional internal **PT Global Multiparts**. Demi mematuhi standar privasi data korporat, akses demo publik yang disediakan (**Assets Demo**) menggunakan data simulasi aman (*dummy data*).

---

## 🚀 Fitur Unggulan (Core Features)

Aplikasi ini dilengkapi dengan fitur komprehensif yang dirancang khusus untuk memenuhi kebutuhan operasional harian perusahaan:

### 1. 📊 Dashboard Eksekutif & Statistik Finansial
* **Ringkasan Real-Time:** Menampilkan total kuantitas aset, estimasi nilai perolehan awal, hingga total nilai buku terkini (*current book value*).
* **Monitoring Status Aset:** Visualisasi persentase aset yang berstatus **Aktif**, dalam masa **Maintenance/Servis**, maupun aset yang telah **Dihapusbukukan (Disposed)**.
* **Analisis Umur Manfaat:** Memantau sisa umur ekonomis aset secara visual untuk membantu perencanaan anggaran peremajaan barang.

### 2. 🏷️ Katalog & Pencarian Aset Kilat
* **Pencarian Cerdas:** Temukan aset berdasarkan nama, ID, kategori, penanggung jawab, maupun lokasi penempatan secara instan.
* **Filter Dinamis:** Pengelompokan data berdasarkan kategori dan status kondisi barang.
* **Indikator Kesegaran Data:** Menampilkan penanda visual apakah data yang dilihat adalah data terkini dari cloud atau data memori lokal yang tersimpan.

### 3. 📷 Pemindai QR Code & Barcode Terintegrasi
* **Pindai Cepat di Lapangan:** Menggunakan kamera smartphone secara langsung untuk mendeteksi QR Code atau Barcode yang tertera pada label fisik aset.
* **Akses Data Tanpa Mengetik:** Begitu label terpindai, sistem langsung membuka lembar rincian aset secara otomatis tanpa perlu pencarian manual.

### 4. 📉 Perhitungan Penyusutan (Depresiasi) Otomatis
* **Metode Garis Lurus (Straight-Line Depreciation):** Nilai buku aset menyusut secara presisi setiap bulan berdasarkan nilai awal, umur ekonomis, dan estimasi nilai residu.
* **Kunci Nilai Otomatis:** Begitu status aset diubah menjadi *Disposed*, nilai buku otomatis terkunci ke nilai residu tanpa risiko kesalahan hitung manusiawi.
* **Sinkronisasi Massal (Bulk Sync):** Admin dapat memperbarui dan mengunci nilai terkini seluruh aset ke basis data utama dalam satu kali klik.

### 5. 📸 Dokumentasi Visual Multi-Foto Beresolusi Tinggi
* **2 Slot Foto per Aset:** Mendokumentasikan kondisi fisik barang dari berbagai sudut (misal: tampak depan dan nomor seri barang).
* **Kompresi Cerdas Otomatis:** Foto yang diambil langsung dari kamera atau galeri dikompresi secara cerdas sebelum diunggah, menghemat kuota internet dan mempercepat waktu tunggu tanpa mengurangi detail visual penting.

### 6. 📝 Audit Trail & Riwayat Perubahan Transparan (Asset Logs)
* **Pencatatan Setiap Perubahan:** Setiap ada pergantian status, perpindahan lokasi, atau penyerahan tanggung jawab ke pengguna baru, sistem mewajibkan pengisian **alasan perubahan**.
* **Riwayat Akuntabel:** Siapa yang mengubah, kapan perubahan terjadi, serta nilai lama dan nilai baru tercatat rapi dan permanen untuk kebutuhan audit internal perusahaan.

### 7. 📶 Keandalan Lapangan & Mode Offline (Offline Queue)
* **Bekerja Tanpa Khawatir Sinyal Hilang:** Dirancang khusus untuk staf gudang atau tim lapangan yang sering berada di area minim sinyal.
* **Antrian Otomatis:** Setiap perubahan data dan unggahan foto yang dilakukan saat offline akan disimpan dengan aman di perangkat, lalu disinkronisasikan otomatis begitu koneksi internet kembali pulih.
* **Anti-Tindih Data (Conflict Prevention):** Sistem memiliki perlindungan dua lapis untuk memastikan data tidak saling menimpa secara diam-diam jika ada orang lain yang memperbarui aset yang sama.

### 8. 📑 Ekspor Laporan Resmi (PDF & Excel) + Kirim Email
* **Format Siap Cetak:** Hasilkan laporan daftar aset lengkap berformat **PDF** rapi berlogo perusahaan maupun format **Excel (.xlsx)** untuk olah data lanjutan.
* **Kirim Otomatis ke Email:** File laporan dapat diunduh langsung ke gawai atau otomatis dikirimkan ke alamat email manajer/pimpinan yang telah terdaftar.

### 9. ⏰ Jadwal Pengingat & Pemeliharaan (Reminders)
* **Peringatan Berkala:** Catat tanggal jatuh tempo garansi, jadwal servis rutin alat berat/kendaraan, atau jadwal kalibrasi perangkat.
* **Sistem Pengecekan Terjadwal:** Script cerdas memeriksa agenda pengingat setiap jam agar tidak ada pemeliharaan penting yang terlewat.

### 10. 👥 Manajemen Pengguna & Keamanan Bertingkat (Role-Based Access)
* **Tingkat Akses (Role):**
  * **Admin:** Kendali penuh (tambah/edit aset, hapus, kelola pengguna, reset password, dan buat laporan).
  * **User:** Mengakses katalog, melihat detail aset, memindai QR code, dan mengelola profil pribadi.
* **Satu Sesi Aktif (Single Active Session):** Login di perangkat baru otomatis mengeluarkan akun dari perangkat lama demi mencegah akun dipakai bersamaan tanpa izin.
* **Keamanan Sandi Terenkripsi:** Menggunakan enkripsi kata sandi bersalt modern yang aman dari peretasan.

### 11. 🔔 Notifikasi Real-Time
* Terintegrasi dengan layanan push notifikasi untuk mengirimkan pengumuman penting, status pengingat, dan konfirmasi laporan langsung ke layar pengguna.

### 12. 🌓 Desain Antarmuka Elegan & Dark Mode Otomatis
* Mengusung desain antarmuka modern dengan bilah navigasi fleksibel (*collapsible rail sidebar*) yang ramah pengguna di ponsel maupun layar laptop/desktop.
* Dilengkapi tema **Gelap (Dark Mode)** dan **Terang (Light Mode)** yang otomatis menyesuaikan kenyamanan mata pengguna.

---

## 🔍 Kesiapan SEO & Aksesibilitas Web (PWA Ready)

Aplikasi web telah dioptimalkan secara menyeluruh agar mudah ditemukan, berpenampilan menarik saat dibagikan, serta memiliki performa layaknya aplikasi native:

1. **Ramah Mesin Pencari (Search Engine Friendly):**
   * Dilengkapi Meta Tag SEO judul, deskripsi informatif, dan kata kunci relevan untuk kemudahan pengindeksan di Google.
   * Dilengkapi berkas resmi `robots.txt` dan `sitemap.xml`.
2. **Tampilan Pratinjau Sosial Mewah (Open Graph & Twitter Cards):**
   * Saat tautan dibagikan ke **WhatsApp, Facebook, LinkedIn, atau Twitter/X**, akan muncul kartu pratinjau profesional lengkap dengan logo, gambar (*og-image* resolusi 1200x630), judul, dan deskripsi ringkas.
3. **Standar Data Terstruktur Google (Schema.org JSON-LD):**
   * Terdaftar sebagai `SoftwareApplication` kategori bisnis (*BusinessApplication*), memberikan nilai kredibilitas tinggi di mata algoritma Google Search.
4. **Teknologi Progressive Web App (PWA Siap Pasang):**
   * Pengguna tidak wajib mengunduh melalui Play Store / App Store. Cukup buka tautan di browser (Chrome/Safari), lalu tekan tombol **"Tambahkan ke Layar Utama" / "Install"**.
   * Memiliki ikon aplikasi mandiri, splash screen pembuka, dan berjalan layar penuh (*fullscreen standalone*) tanpa bilah alamat browser.
5. **Akselerasi Muat Cepat (Smart Service Worker):**
   * Berkas aplikasi disimpan secara efisien di memori peramban (*cache-first*), memungkinkan aplikasi terbuka seketika (sub-detik) saat dibuka kembali oleh pengguna.

---

## 🛠️ Tech Stack & Arsitektur Solusi

Aplikasi ini mengombinasikan framework antarmuka mutakhir dengan arsitektur backend tanpa server (*serverless*) yang cerdas dan efisien:

```
┌─────────────────────────────────────────────────────────┐
│        APLIKASI KLIEN (Multi-Platform: Web, Android, iOS)│
│        React Native + Expo Router + NativeWind (Tailwind)│
└────────────────────────────┬────────────────────────────┘
                             │ Komunikasi Aman (HTTPS POST)
                             ▼
┌─────────────────────────────────────────────────────────┐
│         SERVERLESS ENGINE (Google Apps Script)          │
│       Autentikasi Token, Otorisasi Peran, & Router API   │
└──────────────┬───────────────────────────┬──────────────┘
               │                           │
               ▼                           ▼
┌───────────────────────────────┐ ┌───────────────────────┐
│   DATABASE (Google Sheets)    │ │ STORAGE (Google Drive)│
│  - Data Master Aset           │ │ - Foto Fisik Aset     │
│  - Data Pengguna & Hak Akses  │ │ - Foto Profil Pengguna│
│  - Sesi Aktif & Audit Trail   │ │ - Logo Kop Laporan    │
└───────────────────────────────┘ └───────────────────────┘
```

### 💡 Keuntungan Bisnis Arsitektur Ini:
* **Nol Biaya Server (Zero Server Maintenance Cost):** Tidak memerlukan sewa server VPS, cloud hosting bulanan yang mahal, ataupun langganan database server pihak ketiga.
* **Data Milik Perusahaan 100%:** Seluruh catatan aset tersimpan langsung di Google Spreadsheet resmi milik akun perusahaan, sehingga mudah dilihat, diekspor, atau diolah langsung oleh divisi keuangan tanpa keterikatan software tertutup (*no vendor lock-in*).
* **Kestabilan Tinggi:** Didukung oleh infrastruktur Google Cloud yang memiliki tingkat uptime kelas dunia.

---

## 📚 Library & Dependensi Utama (Fungsi & Nilai Nyata)

Berikut adalah daftar teknologi dan pustaka utama yang digunakan serta manfaat langsungnya bagi kenyamanan pengguna:

| Nama Teknologi / Library | Kategori | Manfaat Nyata untuk Pengguna & Bisnis |
|---|---|---|
| **Expo & Expo Router** | Framework Utama | Menghadirkan perpindahan halaman yang mulus dan cepat serta memastikan aplikasi dapat berjalan di Web, Android, dan iOS dari satu basis kode terpadu. |
| **React Native & React 19** | Core UI Engine | Menjamin tampilan antarmuka interaktif, responsif, dan memberikan pengalaman penggunaan layaknya aplikasi bawaan ponsel. |
| **NativeWind & Tailwind CSS** | Desain & Tampilan | Menyediakan estetika antarmuka modern yang rapi, elegan, serta mendukung mode gelap/terang secara konsisten di semua ukuran layar. |
| **Expo Camera** | Fitur Perangkat | Memberikan kemampuan pemindaian cepat QR Code dan Barcode langsung dari kamera perangkat tanpa perlu aplikasi scanner tambahan. |
| **Expo Image Picker & Manipulator** | Dokumentasi & Media | Memudahkan pengambilan foto aset dari galeri/kamera serta otomatis mengecilkan ukuran berkas foto agar hemat memori dan cepat diunggah. |
| **Shopify FlashList** | Performa Tampilan | Teknologi perenderan daftar aset super cepat yang menjamin pengalaman menggulir layar (*scrolling*) tetap ringan dan bebas patah-patah walau memuat ribuan data. |
| **AsyncStorage & IndexedDB Adapter** | Penyimpanan Lokal | Menyimpan data antrian offline dan cache foto di memori perangkat dengan kapasitas besar dan aman. |
| **OneSignal Push Notification** | Notifikasi | Menyampaikan pesan pemberitahuan penting dan pengingat jadwal aset langsung ke layar ponsel atau browser pengguna. |
| **React Native Reanimated** | Animasi & Transisi | Menghadirkan efek transisi, animasi tombol, dan pergerakan menu yang luwes dan memanjakan mata pengguna. |
| **Expo Sharing** | Berbagi Dokumen | Memungkinkan pengiriman berkas laporan PDF atau lembar kerja Excel secara instan ke aplikasi lain (WhatsApp, Telegram, Email, atau Google Drive). |

---

## 💼 Mengapa Assets DEMO adalah Pilihan Tepat?

1. **Hemat Anggaran:** Tidak ada biaya sewa server berkala—kinerja maksimal dengan biaya infrastruktur terendah.
2. **Mudah Digunakan Siapa Saja:** Tampilan bersih, intuitif, dan tidak membingungkan staf lapangan maupun admin kantor.
3. **Transparansi Menyeluruh:** Setiap mutasi dan penyusutan nilai aset tercatat rapi, siap pakai saat audit tiba.
4. **Fleksibel & Portabel:** Dapat dibuka dari komputer kantor, tablet manajer, maupun handphone teknisi di gudang secara bersamaan.

---
*Dokumen ini disusun sebagai panduan pengenalan solusi bagi calon pengguna, klien, dan pemangku kepentingan.*
