# 📖 Panduan Lengkap & Daftar Pintasan ZhaNotes

**ZhaNotes** adalah aplikasi ruang kerja pemikiran, catatan visual, dan *Personal Knowledge Management (PKM)* berkonsep **Local-First**: gratis, tanpa iklan pihak ketiga, dan bisa dipakai offline. Seluruh catatan teks, coretan kanvas bebas, berkas PDF, serta memo suara tersimpan aman secara offline di peramban (*IndexedDB* & *LocalStorage*) perangkat Anda tanpa server perantara dan tanpa biaya langganan, kecuali Anda mengaktifkan sinkron awan opsional yang hanya tersedia di edisi kustom.

---

## 🎯 Ringkasan Pembaruan & Perbaikan Mode Kanvas

### ❓ Masalah Sebelumnya
Saat berada di mode kanvas, ketika pengguna mengaktifkan **Sembunyikan Toolbar** (`Alt+M`), **Sembunyikan Semua Alat** (`Alt+T`), atau masuk ke **Mode Fokus / Zen** (`Alt+Z`), kanvas gambar tidak dapat dicoret sama sekali atau bahkan hilang dari layar.

### 🔍 Penyebab Masalah
Elemen kontainer kanvas (`#cw` dan `<canvas id="cv">`) sebelumnya dirender di dalam kontainer bilah alat lengket (`.zn-stk-body` di dalam `.zn-stk`). Ketika bilah alat disembunyikan atau mode fokus diaktifkan:
- `body.hb .zn-stk-body { display: none }`
- `body.ht .zn-stk { display: none!important }`
- `body.zen .zn-stk { display: none!important }`

Akibatnya, elemen kanvas ikut terkena `display: none`, sehingga tidak tampil dan tidak dapat menangkap input mouse, stylus, maupun sentuhan jari.

### 🛠 Solusi & Perbaikan yang Diterapkan
1. **Pemisahan Elemen Kanvas dari Toolbar**: Kontainer kanvas (`#cw`) dan penampil PDF (`#pv`) dipindahkan keluar dari `.zn-stk` menjadi anak langsung dari `#mn`, sejajar dengan wadah dokumen (`#bd`).
2. **Kanvas Tetap Aktif di Seluruh Mode**: Saat toolbar disembunyikan (`Alt+M`), alat disembunyikan (`Alt+T`), atau dalam mode fokus layar penuh (`Alt+Z`), kanvas tetap 100% terlihat, meluas mengisi seluruh ruang layar, dan langsung bisa dicorat-coret.
3. **Pintasan Keyboard Khusus Kanvas**: Anda dapat beralih alat corat-coret secara instan tanpa perlu membuka toolbar (`P` untuk Pena, `E` untuk Penghapus, `S`/`V` untuk Seleksi, `H` untuk Geser, `T` untuk Teks, `R` untuk Bentuk, `+`/`-` untuk Zoom, `0` untuk Fit).
4. **Panggil Toolbar di Mode Zen**: Tekan `Alt+T` atau klik tombol `🎨 Alat` di sudut kanan atas untuk menampilkan toolbar mengambang sementara di atas kanvas.

---

## 🆕 Pembaruan Terbaru

### 📱 HP & PWA
- **Bottom sheet**: jendela (Cari, Tangkap cepat, Tambah, dll.) muncul dari bawah di HP. Tarik gagangnya ke bawah untuk menutup; tingginya mengikuti keyboard virtual.
- **Geser dari tepi kiri** membuka sidebar, geser ke kiri menutupnya (tidak aktif di area Kanvas dan PDF).
- **Filter dilipat**: di HP, filter Beranda dan daftar Catatan menjadi satu tombol `Filter: Semua ▾`.
- **Target sentuh 44px** untuk menu bawah, toolbar editor, dan bilah atas; tarik-untuk-muat-ulang dimatikan.
- **Properti catatan (⚙)** di bilah atas catatan: ubah folder, tag, dan jadwal hapus.
- **Pintasan ikon app** (tekan lama ikon): *Catatan baru*, *Tangkap cepat*, *Cari*. Di Android, menu **Bagikan** ke ZhaNotes membuka Tangkap cepat berisi teks yang dibagikan. Setelah pembaruan, pasang ulang PWA bila pintasan belum muncul.

### 🗂️ Daftar Catatan & Tag
- **Halaman bernomor** (‹ 1 … 4 5 6 … 12 ›) dengan keterangan "51–100 dari 137"; ukuran halaman 25 / 50 / 100 (disimpan di perangkat).
- **Tag di daftar**: 12 tag teratas (paling sering dipakai) dan tombol `+N lagi ▾`; tombol `▾ Tag` menyembunyikan seluruh deretan. Tag aktif selalu terlihat.
- **🔍 Cari tag**: dari daftar catatan atau palet `Ctrl+K` → *Cari tag…*; menampilkan jumlah catatan per tag.
- **Kelola tag** (menu Data di sidebar): ganti nama, gabungkan (nama yang sama), atau hapus (kosongkan nama).
- Tag tidak lagi ditampilkan di sidebar; semua urusan tag ada di daftar catatan.

### 🔎 Pencarian Global (`Alt`/`Ctrl+K` atau tombol Cari)
Selain kata kunci dan `#tag`, kini ada filter yang bisa digabung:

| Filter | Contoh | Arti |
| :--- | :--- | :--- |
| `#tag` | `#kerja` | Hanya catatan bertag tersebut |
| `tipe:` | `tipe:kanvas` | `halaman`, `kanvas`, `riset`, `pdf` |
| `folder:` | `folder:audit` | Folder yang namanya mengandung kata itu |
| `dalam:` | `dalam:7` | Diubah dalam N hari terakhir |

Contoh: `tipe:pdf dalam:30 #laporan stok`. Filter tanpa kata kunci menampilkan hingga 40 catatan. Tombol **★ Simpan** menyimpan pencarian saat ini sebagai tombol cepat (maks. 8, tersimpan di perangkat); klik kanan atau tekan lama untuk menghapusnya.

### 🖨️ Cetak
`Ctrl+P` mencetak isi catatan saja: sidebar, daftar, toolbar, dan menu bawah disembunyikan; margin 16 mm; tabel, blok kode, dan gambar tidak terpotong di tengah halaman.

---

## 🧪 Catatan Contoh Bawaan
Saat pertama dibuka, ZhaNotes membuat contoh siap pakai: **Contoh: Laporan Audit Stock Opname** (PDF 3 halaman dengan stabilo, coretan, lingkaran, panah, centang/silang, tanda tangan, dan kartu catatan), **Contoh: Diagram Alur Rekonsiliasi Bank** (kanvas), serta catatan Riset. Contoh PDF bisa dibuat ulang lewat `Ctrl+K` → *Buat contoh PDF beranotasi*.

---

## 🗺️ Empat Mode Catatan di ZhaNotes

### 1. 📄 Halaman (Dokumen Teks Kaya / WYSIWYG)
- Editor dokumen bebas gangguan dengan dukungan penulisan heading (H1, H2, H3), teks tebal, miring, coret, stabilo kuning, dan monospace.
- **Warna kustom**: di menu **A ▾** (warna teks) dan **🖍 ▾** (stabilo) ada kotak pemilih warna bebas di ujung deretan warna. Tombol **✕ Bersihkan** di tab Teks menghapus format.
- **Toolbar 4 tab** (Teks, Paragraf, Lanjutan, Sisipkan), tiap tab satu baris.
- **Tab Paragraf**: rata teks, daftar, indentasi. **Tab Lanjutan**: **Jarak baris** (1.2–2.2 per paragraf), **Aa Huruf** (HURUF BESAR, huruf kecil, Kapital Tiap Kata, kapital awal kalimat) pada teks terpilih, dan **⌫ Hapus format**.
- **Checklist Tugas**: Kotak centang interaktif yang dapat dicentang langsung atau dihapus.
- **Tabel Terintegrasi**: menu **Tabel ▾** di tab Sisipkan: tabel baru, tambah/hapus baris dan kolom, **urutkan kolom A→Z / Z→A**, **header menempel**, salin sebagai CSV, hapus tabel. **Impor CSV / Excel** (tempel atau pilih berkas `.csv/.tsv/.txt`, maks. 500 baris × 30 kolom); menempel dari Excel/Sheets langsung jadi tabel.
- **Blok Kode**: kotak monospace dengan tombol **⧉ Salin**.
- **Daftar Isi otomatis** (satu per catatan, ikut berubah saat judul H1–H3 berubah; klik untuk lompat) dan **Catatan Kaki** bernomor otomatis (klik nomor untuk ubah/hapus, ↩ untuk kembali ke teks).
- **Simbol ▾**: simbol matematika, panah, dan emoji. **Kotak ▾**: menu callout berlabel.
- Berlaku juga untuk catatan **Riset**. Perintah `Ctrl+K` ditambah *Sisipkan: …*, *Tabel: …*, dan *Format: …*.
- **Kotak Catatan (Callout)**: Kotak warna-warni untuk Informasi (Biru), Peringatan (Kuning), Sukses (Hijau), Catatan (Ungu), dan Bahaya (Merah).
- **Gambar & Sketsa**: Unggah gambar langsung dari komputer/ponsel, ubah ukuran (resize), potong (crop), putar (rotate), atau atur perataan (kiri, tengah, kanan, melayang).
- **Perintah Cepat Garis Miring (`/`)**: Ketik `/` di awal baris untuk memunculkan menu sisip cepat.

### 2. 🎨 Kanvas Bebas (Infinite Whiteboard)
- **Papan Gambar Digital**: Kanvas resolusi tinggi dengan kompensasi *device pixel ratio* untuk hasil gambar yang tajam.
- **Pena Coret (✏️)**: Mendukung deteksi tekanan pena/stylus (*pen pressure*), mouse, dan jari tangan.
- **Penghapus (🧽)**: Menghapus goresan saat disentuh/diklik.
- **Alat Bentuk (◻)**: Garis lurus, kotak persegi, dan elips/lingkaran.
- **Kartu Teks Bebas (T)**: Klik di mana saja pada kanvas untuk membuat kartu teks yang bisa diketik, digeser (*drag*), dan diubah ukurannya (*resize*).
- **Alat Geser (✋)**: Geser kanvas (*pan*) untuk menjelajahi area gambar tanpa mencoret.
- **Zoom & Navigasi**: *Pinch-to-zoom* dua jari, *scroll wheel* mouse, tombol perbesar/perkecil, serta tombol *Fit to Screen* (⤢) untuk melihat seluruh isi gambar sekaligus.
- **Jenis pena**: Pena, Pensil, Spidol, Stabilo; 17 warna plus pemilih warna bebas. Ketuk ikon alat untuk membuka panel opsinya (ketuk lagi atau di luar untuk menutup). Warna garis dan warna isi terpisah.
- **Penghapus**: mode *Goresan* (hapus utuh) dan *Bagian* (memotong goresan), tiga ukuran. Tersedia juga di PDF.
- **Seleksi**: mode *Kotak* dan *Bebas (lasso)*.
- **Preset pena (4 slot)**: simpan jenis, warna, dan tebal; panggil dengan tombol `1`–`4` atau bulatan di toolbar (di HP muncul saat Pena aktif). Simpan lewat `Shift`+klik, klik kanan, atau panel Pena.
- **Latar**: Titik, Kisi, Garis, Polos (per catatan) dan **snap ke kisi** untuk bentuk dan kartu teks baru serta saat memindahkan objek (tahan `Alt` untuk melewati; garis panduan sejajar antar-objek didahulukan).
- **Bentuk**: 12 bentuk; **konektor** dengan beberapa jenis.
- **Grup**: `Ctrl+G` mengelompokkan, `Ctrl+Shift+G` melepas. **Kunci**: menu klik kanan → *Kunci* / *Buka kunci* (ditandai 🔒). **Sebar rata** horizontal/vertikal (minimal 3 objek) lewat klik kanan (tekan lama di HP).
- **Pengenal bentuk**: saat menggambar dengan Pena, tahan sejenak (sekitar setengah detik) di akhir coretan; garis lurus, kotak, atau lingkaran/elips buatan tanganmu dirapikan otomatis (garis hampir lurus dikunci horizontal/vertikal). Coretan bebas biasa tidak berubah. Nyalakan/matikan di panel Pena atau lewat `Ctrl+K` → *Kanvas: pengenal bentuk*.
- **Ekspor Gambar**: Unduh kanvas ke dalam format PNG berkualitas tinggi, SVG vektor, atau PDF dokumen.

### 3. 🔬 Riset & Kliping
- Tata letak khusus 4 blok terstruktur:
  - **🔗 Tautan**: Simpan URL sumber penting dengan pratinjau kartu.
  - **❝ Kutipan**: Blok kutipan penting dari artikel atau buku.
  - **🖼 Tangkapan Layar**: Kliping visual dari materi referensi.
  - **📝 Catatan Pribadi**: Analisis dan sintesis pemikiran Anda sendiri.

### 4. 📕 Pembaca & Anotator PDF
- Unggah berkas PDF untuk dibaca langsung di peramban tanpa mengunggah ke server mana pun.
- Coret bebas di atas lembar PDF dengan pena berwarna dan stabilo bebas.
- **Stabilo Teks Seleksi (🔤)**: Blok teks pada dokumen PDF untuk memberi efek sorotan stabilo rapi.
- Tempel kartu catatan teks di atas halaman PDF.
- **🔎 Cari di PDF & Daftar Anotasi**: tombol `🔎 Cari` di toolbar PDF atau `Ctrl+F` saat PDF terbuka. Ketik kata untuk mencari teks di semua halaman (hasil per halaman dengan kutipan; klik untuk lompat, `Enter` membuka hasil pertama). Kosongkan kolom untuk melihat **daftar anotasi** per halaman (jumlah sorotan, coretan, dan catatan teks). Pencarian hanya bekerja pada PDF yang punya lapisan teks (bukan hasil pindai).
- **Garis bawah & coret teks**: tombol `U Garis bawah` dan `S Coret` di toolbar PDF. Pilih teks di halaman lalu lepas; garis merah mengikuti tiap baris yang dipilih (warna mengikuti warna garis bila dipilih manual). Ikut tersimpan dan masuk ke **Ekspor PDF Beranotasi**. Hapus dengan penghapus seperti sorotan.
- **📝 Ke catatan**: tombol di toolbar PDF yang membuat catatan Halaman baru berisi anotasi per halaman: kutipan teks dari sorotan/garis bawah/coret, isi kartu catatan, dan jumlah coretan tangan, dengan tautan balik `[[judul PDF]]`. Tag dan folder PDF ikut disalin. Kutipan diambil dari lapisan teks PDF (PDF hasil pindai tidak menghasilkan kutipan).
- **▦ Halaman**: tombol di toolbar PDF membuka **thumbnail semua halaman** (halaman beranotasi diberi tanda ✎ dan jumlahnya) dan **daftar isi PDF** (bila PDF punya bookmark). Klik untuk lompat ke halaman.
- **Ekspor PDF Beranotasi**: Unduh dokumen PDF baru lengkap dengan seluruh goresan dan catatan yang Anda tambahkan.

---

## ⌨️ Tabel Lengkap Pintasan Keyboard (Shortcut Cheat Sheet)

### 🌐 Navigasi & Jendela Utama
| Pintasan | Perintah | Keterangan |
| :--- | :--- | :--- |
| `Ctrl + K` / `Cmd + K` | **Palet Perintah (Command Palette)** | Cari catatan cepat atau jalankan perintah dengan awalan `>` |
| `Alt + N` | **Catatan Baru (Halaman)** | Membuat dokumen teks kosong baru |
| `Alt + C` | **Kanvas Baru** | Membuka lembar kanvas gambar kosong baru |
| `Alt + J` | **Tangkap Cepat (Quick Capture)** | Jendela tangkap ide kilat dari mana saja |
| `Alt + Z` | **Mode Fokus (Zen Mode)** | Layar penuh tanpa gangguan; tekan `Esc` untuk keluar |
| `Alt + T` | **Sembunyikan Semua Alat** | Sembunyikan kontrol atas; muncul tombol cepat `⌄ Alat` |
| `Alt + M` | **Sembunyikan Toolbar** | Sembunyikan / tampilkan bilah alat atas |
| `Alt + O` | **Daftar Isi (Outline)** | Navigasi cepat berdasarkan heading dokumen (H1–H3) |
| `Alt + G` | **Graph Backlinks** | Visualisasi grafis peta koneksi antar catatan |
| `Alt + B` | **Toggle Sidebar Menu** | Sembunyikan / tampilkan menu bilah sisi kiri |
| `Alt + L` | **Toggle Daftar Catatan** | Sembunyikan / tampilkan daftar list catatan |
| `Alt + F` | **Toggle Kedua Sidebar** | Membuka ruang baca maksimal dengan menutup kedua sidebar |
| `Alt + [` | **Tab Sebelumnya** | Pindah ke tab catatan sebelumnya |
| `Alt + ]` | **Tab Berikutnya** | Pindah ke tab catatan berikutnya |
| `Alt + W` | **Tutup Tab** | Menutup tab catatan yang sedang aktif |
| `Ctrl + F` / `Ctrl + H` | **Cari & Ganti** | Mencari dan mengganti kata di dalam catatan |
| `Ctrl + F` (di PDF) | **Cari di PDF** | Cari teks di semua halaman PDF dan lihat daftar anotasi |
| `Esc` | **Batal / Tutup** | Menutup modal, menu dropdown, atau keluar mode fokus |
| `Ctrl + P` | **Cetak** | Cetak isi catatan aktif (tanpa sidebar dan toolbar) |
| `?` atau `F1` | **Panduan & Pintasan** | Membuka jendela panduan dan daftar pintasan ini |

> **Peringatan sebelum keluar:** menekan tombol Kembali peramban/HP atau tautan **← Portofolio** memunculkan konfirmasi *Keluar dari ZhaNotes?* (pilih **Tetap di sini** bila salah klik). Menutup tab atau memuat ulang memunculkan dialog bawaan peramban. Saat ada panel terbuka, Kembali menutup panelnya lebih dulu. Matikan atau nyalakan lewat `Ctrl + K` → *peringatan sebelum keluar*; catatan tetap tersimpan otomatis di perangkat.

---

### 🎨 Pintasan Khusus Kanvas (Saat Kanvas Aktif & Tidak Mengetik Teks)
| Tombol | Alat / Aksi | Keterangan |
| :---: | :--- | :--- |
| `P` | **✏️ Pena (Pen)** | Alat corat-coret bebas |
| `E` | **🧽 Penghapus (Eraser)** | Menghapus goresan garis saat diklik/disentuh |
| `S` atau `V` | **⬚ Pilih (Select)** | Memilih goresan atau kartu teks, menggeser, dan resize |
| `H` | **✋ Geser (Hand / Pan)** | Menggeser kanvas tanpa mencoret |
| `T` | **T Teks** | Klik di area kanvas mana saja untuk membuat kartu teks |
| `R` | **◻ Bentuk (Shape)** | Menggambar garis, kotak, atau elips |
| `+` atau `=` | **Perbesar (Zoom In)** | Memperbesar sudut pandang kanvas |
| `-` atau `_` | **Perkecil (Zoom Out)** | Memperkecil sudut pandang kanvas |
| `0` | **⤢ Pas ke Layar (Fit)** | Menyesuaikan tampilan agar seluruh gambar muat di layar |
| `L` | **Seleksi Kotak ⇄ Bebas** | Beralih antara seleksi kotak dan lasso |
| `G` | **Ganti Latar** | Titik → Kisi → Garis → Polos |
| `Shift + G` | **Snap ke Kisi** | Nyalakan/matikan snap |
| `1` – `4` | **Preset Pena** | Panggil preset pena tersimpan |
| `Ctrl + G` / `Ctrl + Shift + G` | **Grup / Lepas Grup** | Kelompokkan atau pisahkan objek terpilih |
| `Del` / `Backspace` | **Hapus Objek Terpilih** | Menghapus kartu teks atau goresan yang sedang dipilih |
| `Ctrl + Z` | **Undo** | Membatalkan goresan atau aksi terakhir |
| `Ctrl + Y` / `Ctrl + Shift + Z` | **Redo** | Mengulangi goresan atau aksi yang dibatalkan |
| Tombol `☝ Jari` | **Mode Sentuhan Jari** | Izinkan menulis dengan jari tangan (default: geser/zoom) |

---

### ⚡ Perintah Garis Miring (Slash Commands `/` di Editor Halaman)
Ketik tanda `/` pada baris baru di editor halaman untuk memunculkan menu perintah cepat:

| Perintah | Tipe Blok | Deskripsi |
| :--- | :--- | :--- |
| `/h1` | **Judul 1** | Judul utama dokumen |
| `/h2` | **Judul 2** | Sub-judul bagian |
| `/h3` | **Judul 3** | Bagian kecil dokumen |
| `/p` | **Paragraf** | Teks biasa standar |
| `/todo` atau `/centang` | **Daftar Tugas** | Checklist tugas interaktif (☑) |
| `/poin` atau `/bullet` | **Daftar Poin** | Daftar bulatan tidak berurut (•) |
| `/nomor` | **Daftar Nomor** | Daftar penomoran angka otomatis (1, 2, 3) |
| `/kutipan` atau `/quote` | **Kutipan** | Kotak kutipan penting (*blockquote*) |
| `/kode` atau `/code` | **Blok Kode** | Kotak kode *monospace* dengan tombol ⧉ Salin |
| `/tabel` | **Tabel** | Sisipkan tabel dengan baris dan kolom |
| `/isi` atau `/toc` | **Daftar Isi** | Daftar isi otomatis dari judul H1–H3 (satu per catatan) |
| `/kaki` atau `/footnote` | **Catatan Kaki** | Rujukan bernomor otomatis di akhir halaman |
| `/csv` atau `/excel` | **Impor CSV / Excel** | Ubah data tempelan atau berkas CSV jadi tabel |
| `/simbol` atau `/sigma` | **Simbol** | Rumus, panah, dan emoji |
| `/garis` | **Garis Pemisah** | Garis horizontal pembatas (*divider*) |
| `/info` | **Callout Info** | Kotak informasi berlatar biru |
| `/peringatan` | **Callout Peringatan** | Kotak peringatan berlatar kuning |
| `/sukses` | **Callout Sukses** | Kotak pesan sukses berlatar hijau |
| `/catatan` | **Callout Catatan** | Kotak catatan ide berlatar ungu |
| `/bahaya` | **Callout Bahaya** | Kotak perhatian penting berlatar merah |
| `/gambar` | **Gambar** | Unggah gambar dari penyimpanan perangkat |
| `/sketsa` | **Sketsa Tangan** | Kotak gambar mini tulisan tangan langsung di dokumen |
| `/tautan` | **Tautan Web** | Sisipkan link URL ke situs eksternal |
| `/wiki` | **Tautan Internal** | Sisipkan format `[[Judul Catatan]]` |
| `/tanggal` | **Tanggal Hari Ini** | Sisipkan tanggal hari ini secara otomatis |
| `/jam` | **Waktu Sekarang** | Sisipkan jam sekarang secara otomatis |

---

## 🔗 Wiki Backlinks `[[ ]]` & Graph Interaktif

ZhaNotes menerapkan metodologi *Personal Knowledge Management (PKM)* modern bergaya wiki:
1. **Penautan Dua Arah**: Ketik `[[` diikuti nama catatan. ZhaNotes akan memberikan saran otomatis. Jika catatan tersebut belum ada, tautan akan dibuat menjadi warna oranye dan Anda bisa mengkliknya untuk langsung membuatnya secara instan.
2. **Panel Referensi Dokumen**: Di bagian bawah catatan, terdapat panel:
   - **Tautan Keluar**: Seluruh catatan yang dirujuk oleh dokumen ini.
   - **Backlinks Masuk**: Seluruh dokumen lain yang menautkan kembali ke dokumen ini.
3. **Graph Backlinks (`Alt+G`)**:
   - Peta grafis interaktif dengan simulasi fisika gaya pegas (*force-directed layout*).
   - Simpul (*nodes*) merepresentasikan catatan, dan garis (*edges*) merepresentasikan keterkaitan.
   - Filter untuk melihat **Semua catatan** atau hanya melihat **Sekitar catatan aktif**.
   - Zoom (*scroll wheel*), geser (*drag canvas*), dan klik simpul untuk langsung membuka catatan terkait.

---

## 🎙️ Memo Suara Tersemat & Penanda Waktu

Setiap catatan halaman dan riset dilengkapi perekam suara bawaan:
- Tekan **Rekam** di bagian bawah dokumen untuk merekam suara (rapat, kuliah, wawancara, ide audio).
- Rekaman audio disimpan langsung di peramban menggunakan IndexedDB.
- Anda dapat menekan tombol **📍 Tandai** kapan saja selama perekaman atau pemutaran untuk menyimpan penanda waktu (*timestamp bookmark*), sehingga Anda dapat melompat kembali ke momen penting dengan sekali klik.

---

## 💾 Pencadangan, Ekspor, & Sinkronisasi

### 1. Ekspor Mandiri Tanpa Backend
- **Halaman**: Ekspor ke Microsoft Word (`.docx`), PDF (`.pdf`), Markdown (`.md`), Dokumen Teks (`.txt`), HTML (`.html`), atau JSON.
- **Kanvas**: Ekspor ke PNG resolusi tinggi, SVG vektor, atau PDF.
- **PDF Beranotasi**: Ekspor dokumen PDF hasil coretan & stabilo.

### 2. Cadangan Lengkap ZIP (Backup & Restore)
- Klik **Data → Cadangan & pulihkan** di menu sidebar kiri.
- Tombol **🌓 Tema** (terang/gelap/otomatis) berada di bawah bagian Data, di atas kartu Ruang kerja saya.
- **Unduh Cadangan ZIP**: Seluruh database catatan, gambar, coretan kanvas, dokumen PDF, dan berkas audio akan dikemas menjadi satu file ZIP lokal.
- **Pulihkan dari ZIP**: Impor kembali file ZIP Anda di peramban atau perangkat mana pun tanpa kehilangan struktur maupun data.

### 3. Sinkron Awan Otomatis (Opsional, E2EE)
> **Catatan edisi:** versi umum ZhaNotes bekerja 100% lokal dan offline, gratis tanpa iklan. Sinkron awan hanya tersedia pada edisi khusus yang disiapkan per pelanggan, dengan penyimpanan di akun milik pelanggan tersebut.

- Klik kartu **Ruang kerja saya** di kiri bawah bilah sisi (kartu ini juga menampilkan status sinkron), isi token akses dan kata sandi enkripsi. Setelah aktif, catatan **disimpan di perangkat lebih dulu**, lalu dikirim otomatis sekitar 8 detik setelah Anda berhenti mengetik (paling lama 45 detik bila Anda menulis tanpa jeda, dan langsung saat tab ditinggalkan). Pengiriman karena edit hanya mengunggah catatan yang berubah; pemeriksaan perubahan dari perangkat lain dilakukan tiap 90 detik saat aplikasi terbuka, saat tab dibuka kembali, dan saat kembali online, jadi catatan dari laptop sudah ada di HP tanpa cadangan manual.
- Catatan, PDF, dan rekaman **dienkripsi di peramban** (AES-GCM) sebelum diunggah. Kata sandi enkripsi tidak pernah dikirim atau disimpan di server.
- **Gabung otomatis:** jika satu catatan diubah di dua perangkat pada bagian yang berbeda (paragraf berbeda, kotak, coretan, atau konektor kanvas berbeda, ikon dan warna label, anotasi PDF berbeda, tag dan judul berbeda), hasilnya digabung sendiri dan versi sebelum gabung masuk Riwayat.
- **Bentrok:** jika bagian yang sama diubah di dua tempat (atau catatan dihapus di satu dan diedit di lain), muncul layar perbandingan dengan pilihan **Gabungkan** (kedua versi bagian yang bentrok ditaruh berdampingan dan ditandai ⚠), pakai versi perangkat ini, pakai versi cloud, atau simpan keduanya.
- **Log debug (pemeliharaan):** tombol **🐞 Log** di jendela Sinkron awan hanya muncul bila penyedia aplikasi mengaktifkannya di server (variabel `ZHANOTES_DEBUG=1`). Saat mati, tidak ada log di konsol peramban maupun di aplikasi. Log tidak memuat token, kata sandi, judul, maupun isi catatan.
- Cadangan ZIP lokal tetap tersedia kapan saja.

---

## 🎨 Tentang Pembuat & Edisi Kustom

ZhaNotes dibuat oleh **K. Arzhaning Jagad (Arzha)**, Indie Developer & Data/System Specialist dengan pengalaman 7+ tahun di operasional dan audit korporat.

Ingin ZhaNotes dengan **nama, logo, dan desain bisnis Anda**? Tersedia edisi kustom *beli putus* (tanpa langganan), opsional dengan sinkron awan terenkripsi di akun Vercel/penyimpanan milik Anda sendiri.

- 💬 WhatsApp: [+62 823-1231-2734](https://wa.me/6282312312734)
- ✉️ Email: admin@arzhaning.my.id
- 🌐 Website: [arzhaning.my.id](https://arzhaning.my.id) · Galeri demo: [arzhaning.my.id/demos](https://arzhaning.my.id/demos)

---

*ZhaNotes — Ruang Catatan Pribadi, Cepat, Bebas Distraksi, dan 100% Milik Anda.*