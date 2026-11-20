# Rencana Implementasi: Integrasi Media WhatsApp & Google Drive Storage

Dokumen ini memuat arsitektur lengkap, panduan konfigurasi, struktur data, rincian file yang akan dibuat/diperbarui, serta langkah-langkah implementasi teknis untuk mengelola lampiran file (gambar, dokumen PDF, video, audio) percakapan WhatsApp menggunakan **Google Drive (Akun Khusus)** dan menampilkannya secara interaktif di **Inbox WhatsApp Web Portfolio**.

---

## 1. Ringkasan Eksekutif & Prinsip Arsitektur

### 1.1 Prinsip Zero Server Cost & Isolasi Data
* **Serverless Backend (Vercel):** Tidak menggunakan server fisik 24/7. Seluruh pemrosesan berjalan on-demand.
* **Storage Terpusat di Google Drive Khusus:**
  * Menggunakan akun Google/Gmail baru yang terpisah (misal: `arzha.chatbot@gmail.com` atau sejenisnya).
  * **Kapasitas 15 GB Utuh:** 100% kuota gratis digunakan khusus untuk menampung file klien tanpa mengganggu email atau Google Photos pribadi Mas Arzha.
  * **Akses Mudah:** Folder media di akun baru tersebut cukup dibagikan (*shared*) ke akun email utama Mas Arzha (`jarzha@gmail.com`). Mas Arzha bisa membuka seluruh file klien langsung dari aplikasi Google Drive di smartphone.
* **Penyimpanan Ringan di Vercel/Redis:**
  * Vercel dan Redis **hanya menyimpan metadata JSON dan link Google Drive**.
  * Tidak ada file biner (binary blob) yang membebani memori Redis.

---

## 2. Arsitektur & Alur Kerja Sistem

### 2.1 Alur Pesan Masuk (Inbound Media dari Klien)

```mermaid
sequenceDiagram
    autonumber
    participant Klien as Klien (WhatsApp)
    participant Meta as Meta WhatsApp Cloud API
    participant Vercel as Webhook (/api/whatsapp)
    participant Drive as Google Drive (Akun Baru)
    participant Gemini as Zannah AI (Gemini Flash)
    participant Redis as Redis (wa:history & inbox)
    participant Admin as Inbox Web Mas Arzha

    Klien->>Meta: Kirim Foto / PDF Dokumen / Video
    Meta->>Vercel: POST Webhook (type: image/document/video, media_id)
    Vercel->>Meta: GET /v21.0/{media_id} (Ambil Download URL)
    Meta-->>Vercel: URL Download Sementara (berlaku 5 menit)
    Vercel->>Meta: Download Stream File Biner
    Vercel->>Drive: Upload Stream ke Folder Khusus via Service Account
    Drive-->>Vercel: Return fileId, webViewLink, webContentLink, thumbnailLink
    
    alt Jika tipe Gambar/PDF & AI Aktif
        Vercel->>Gemini: Kirim Prompt + Buffer Media (Analisis Multimodal)
        Gemini-->>Vercel: Respon Analisis Cerdas
        Vercel->>Meta: Kirim Balasan AI ke WhatsApp Klien
    end

    Vercel->>Redis: Simpan Transkrip + Metadata Google Drive
    Admin->>Vercel: Buka Inbox WhatsApp
    Vercel-->>Admin: Render Bubble Chat (Thumbnail Foto / Kartu File PDF)
```

### 2.2 Alur Balasan Manual dengan Lampiran (Outbound Media Mas Arzha)
1. Mas Arzha membuka percakapan klien di modal Inbox.
2. Klik ikon **Lampiran (📎)** dan pilih file PDF penawaran/RAB atau foto dari laptop.
3. Frontend mengunggah file ke endpoint `/api/wa-inbox?action=upload_media`.
4. Backend menyimpan file ke folder Google Drive dan mengunggahnya ke Meta Graph API `/v21.0/{phone_number_id}/media`.
5. Meta mengirimkan pesan dokumen/gambar tersebut langsung ke WhatsApp klien.
6. Percakapan diperbarui di Inbox dengan tanda `Mas Arzha (Manual)` beserta tautan Google Drive.

---

## 3. Struktur Data & Metadata Lampiran

Di Upstash Redis, pesan media dicatat dalam format `WaChatTurn` dengan metadata terstruktur:

```typescript
export interface WaMediaAttachment {
  type: 'image' | 'document' | 'video' | 'audio';
  driveFileId: string;
  driveViewLink: string;       // Link untuk membuka di Google Drive
  driveThumbnailLink?: string;  // Link thumbnail untuk gambar
  fileName?: string;           // Contoh: "RAB_Aplikasi_V1.pdf"
  mimeType: string;            // Contoh: "application/pdf", "image/jpeg"
  fileSizeBytes?: number;
  caption?: string;            // Keterangan teks dari pengirim
}

export interface WaChatTurn {
  role: 'user' | 'model';
  parts: {
    text: string;
    media?: WaMediaAttachment;
  }[];
  timestamp?: number;
}
```

---

## 4. Panduan Konfigurasi Akun Google & Service Account (Step-by-Step)

Mas Arzha hanya perlu melakukan setup ini satu kali:

### Langkah 1: Siapkan Akun Google Baru & Folder Drive
1. Buat akun Google baru (misal: `arzha.chatbot@gmail.com`).
2. Buka [Google Drive](https://drive.google.com).
3. Buat sebuah folder baru bernama: `WhatsApp-Bot-Media`.
4. Buka folder tersebut, lalu perhatikan URL di browser:
   `https://drive.google.com/drive/folders/1A2b3C4d5E6F7G8H9I...`
   *Salin kode acak setelah `/folders/`* → Ini adalah **`GOOGLE_DRIVE_FOLDER_ID`**.
5. Klik kanan folder `WhatsApp-Bot-Media` → **Bagikan (Share)**:
   * Masukkan email utama Mas Arzha (`jarzha@gmail.com`) sebagai **Editor** (agar bisa akses dari HP kapan saja).

### Langkah 2: Buat Service Account di Google Cloud Console
1. Buka [Google Cloud Console](https://console.cloud.google.com) (bisa menggunakan project yang sudah ada atau buat project baru).
2. Di menu pencarian atas, cari **Google Drive API** → Klik **Enable (Aktifkan)**.
3. Masuk ke menu **IAM & Admin** → **Service Accounts** → Klik **Create Service Account**:
   * Nama: `wa-drive-storage`
   * Klik **Create and Continue**, lalu **Done**.
4. Di daftar Service Account, salin alamat email robot yang baru dibuat:
   Contoh: `wa-drive-storage@project-id.iam.gserviceaccount.com`.
5. Klik Service Account tersebut → Tab **Keys** → **Add Key** → **Create new key** → Pilih **JSON** → Download file JSON-nya ke komputer.

### Langkah 3: Bagikan Folder Drive ke Email Service Account
1. Buka kembali folder `WhatsApp-Bot-Media` di Google Drive.
2. Klik kanan folder → **Bagikan (Share)**.
3. Masukkan email Service Account tadi (`wa-drive-storage@...`) dengan akses **Editor**.
4. Hapus centang *Notify people*, lalu klik **Share**.

### Langkah 4: Daftarkan Environment Variable di Vercel / `.env.local`
Dari file JSON Service Account yang di-download, ambil 3 informasi penting:
```env
GOOGLE_DRIVE_FOLDER_ID="1A2b3C4d5E6F7G8H9I..."
GOOGLE_SERVICE_ACCOUNT_EMAIL="wa-drive-storage@project-id.iam.gserviceaccount.com"
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQD..."
```

---

## 5. Matriks & Daftar Lengkap File yang Dibuat / Diperbarui

Berikut adalah pemetaan menyeluruh file-file di codebase yang terdampak:

| No | File Path | Status | Lapisan | Deskripsi & Peran Perubahan |
|:---|:---|:---:|:---:|:---|
| 1 | `api/_lib/googleDrive.ts` | **BARU** | Backend (Lib) | Client Google Drive API v3: autentikasi JWT service account, upload buffer/stream ke folder Drive, set permission link viewing, dan generate view/thumbnail URL. |
| 2 | `api/_lib/whatsappMedia.ts` | **BARU** | Backend (Lib) | Handler media Meta Graph API: mengambil temporary download URL dari `media_id`, mengunduh binary stream dari Meta, memvalidasi mime-type/ukuran, dan meneruskan ke `googleDrive.ts`. |
| 3 | `api/whatsapp.ts` | **UPDATE** | Backend (API) | Webhook WhatsApp: menangani payload `type: image/document/video/audio`, memanggil handler media Drive, meneruskan buffer gambar ke Gemini Flash Multimodal, dan mencatat metadata file ke Inbox. |
| 4 | `api/_lib/whatsappState.ts` | **UPDATE** | Backend (State) | Penyesuaian skema `WaChatTurn` & `WaInboxContact` untuk menampung field `media?: WaMediaAttachment`, serta update helper `appendWaHistory` dan `upsertInboxContact`. |
| 5 | `api/_lib/whatsappGraph.ts` | **UPDATE** | Backend (API) | Menambahkan fungsi helper `sendWhatsAppMediaReply` atau `uploadMetaMedia` agar Mas Arzha bisa mengirim file/dokumen (outbound) ke WhatsApp klien. |
| 6 | `api/wa-inbox.ts` | **UPDATE** | Backend (API) | Menambahkan action handler untuk pengiriman lampiran manual oleh Mas Arzha (`action: 'reply'` dengan media, atau endpoint upload media) dan mengembalikan URL Drive ke frontend. |
| 7 | `src/components/WaInboxTab.tsx` | **UPDATE** | Frontend (UI) | Menambahkan rendering bubble media di chat stream (thumbnail foto dengan modal preview/zoom, kartu dokumen PDF dengan icon & tombol download, video player/link), serta tombol 📎 (lampirkan file) di composer balasan. |
| 8 | `api/__tests__/whatsapp.test.ts` | **UPDATE** | Unit Testing | Menambahkan skenario test pengujian: validasi webhook menerima gambar/dokumen, mocking Google Drive upload, verifikasi struktur metadata tersimpan di state, dan memastikan 17 test lama tetap hijau. |
| 9 | `.env.local` / `.env.example` | **UPDATE** | Config | Menambahkan dokumentasi variabel environment baru (`GOOGLE_DRIVE_FOLDER_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`). |

---

### Penjelasan Rinci Per File:

#### 1. `api/_lib/googleDrive.ts` (FILE BARU)
* **Fungsi Utama:**
  * Menggunakan token autentikasi Service Account (Google OAuth2 via JWT) tanpa perlu library `@googleapis/drive` yang berat (menjaga bundle size Vercel function tetap ramping dengan native `fetch` ke endpoint REST `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`).
  * Mengekspor fungsi:
    * `uploadFileToDrive({ buffer, fileName, mimeType, folderId })`: Mengunggah file biner ke folder Google Drive akun baru.
    * `getFileMetadata(fileId)`: Mengambil `webViewLink`, `webContentLink`, dan `thumbnailLink`.

#### 2. `api/_lib/whatsappMedia.ts` (FILE BARU)
* **Fungsi Utama:**
  * Jembatan antara server Meta WhatsApp dengan Google Drive.
  * Mengekspor fungsi:
    * `downloadMetaMedia(mediaId: string)`: Memanggil `GET https://graph.facebook.com/v21.0/{media_id}` dengan header `Bearer WA_ACCESS_TOKEN`, kemudian mengunduh stream file dari URL sementara Meta.
    * `processInboundMedia(mediaPayload)`: Otomatis mengunduh dari Meta -> upload ke Google Drive -> mengembalikan objek `WaMediaAttachment`.

#### 3. `api/whatsapp.ts` (DI-UPDATE)
* **Perubahan Logika:**
  * Saat ini webhook hanya mengekstrak `message.text?.body`.
  * Ditambahkan ekstraksi:
    * `message.type === 'image'` -> ambil `message.image.id`, `caption`, `mime_type`.
    * `message.type === 'document'` -> ambil `message.document.id`, `filename`, `caption`, `mime_type`.
    * `message.type === 'video'` -> ambil `message.video.id`, `caption`, `mime_type`.
    * `message.type === 'audio'` -> ambil `message.audio.id`, `mime_type`.
  * **Multimodal Gemini Flash:** Jika file adalah gambar (`image/jpeg`, `image/png`), buffer gambar di-encode base64 dan diteruskan ke Vertex AI / Gemini API bersama prompt percakapan Zannah. Zannah dapat memahami gambar yang dikirim (misal: "Wah di screenshot ini tombol daftarnya tidak merespon ya Mas?").

#### 4. `api/_lib/whatsappState.ts` (DI-UPDATE)
* **Perubahan Skema:**
  * Mendefinisikan tipe `WaMediaAttachment`.
  * Memperbarui penyimpanan Redis: Jika pesan memiliki lampiran, transkrip tidak hanya mencatat `text`, tetapi juga metadata media.
  * Preview kontak di inbox (`lastMessage`) disesuaikan: Jika tidak ada teks caption, otomatis menampilkan `[📷 Foto]`, `[📄 Dokumen: namafile.pdf]`, atau `[🎥 Video]`.

#### 5. `api/_lib/whatsappGraph.ts` (DI-UPDATE)
* **Fungsi Baru:**
  * `sendWhatsAppMediaMessage({ to, type, mediaUrl, caption, filename })`: Mengirim pesan berupa dokumen (PDF/Word) atau gambar ke WhatsApp klien menggunakan Meta Cloud API `messages` endpoint dengan parameter `document` atau `image`.

#### 6. `api/wa-inbox.ts` (DI-UPDATE)
* **Endpoint Baru/Tambahan:**
  * Mendukung payload multipart / base64 saat Mas Arzha mengirim file balasan dari modal Inbox.
  * Menyimpan file kiriman Mas Arzha ke Google Drive, lalu memanggil `sendWhatsAppMediaMessage` ke nomor klien.

#### 7. `src/components/WaInboxTab.tsx` (DI-UPDATE)
* **Peningkatan Komponen Tampilan:**
  * **Image Card:** Menampilkan thumbnail gambar langsung di dalam bubble chat. Saat diklik, muncul modal preview besar (lightbox) atau tautan buka di Google Drive.
  * **Document Card:** Kotak file dengan ikon dokumen (merah untuk PDF, biru untuk Word/Excel), nama file, ukuran file, dan tombol "Lihat Dokumen di Google Drive".
  * **Composer Attachment:** Menambahkan tombol 📎 di samping input chat manual untuk memilih file dari komputer Mas Arzha, dengan progress loading saat upload.

#### 8. `api/__tests__/whatsapp.test.ts` (DI-UPDATE)
* **Penambahan Test Case:**
  * Test simulasi webhook menerima pesan foto dengan caption.
  * Test simulasi webhook menerima dokumen PDF.
  * Test mocking upload ke Google Drive menghasilkan link yang benar di transkrip chat.
  * Memastikan seluruh 17 unit test yang sudah ada tetap 100% lulus.

---

## 6. Roadmap & Jadwal Pelaksanaan

| Fase | Fokus Pekerjaan | Estimasi Waktu | Output Kunci |
| :--- | :--- | :--- | :--- |
| **Fase 1** | Setup Akun Google Baru & Kredensial Service Account | 15 menit (User) | `FOLDER_ID` & JSON Key siap dimasukkan ke env |
| **Fase 2** | Implementasi `googleDrive.ts` & `whatsappMedia.ts` | 30 menit | Backend helper untuk upload ke Drive teruji |
| **Fase 3** | Update Webhook Inbound (`api/whatsapp.ts`) + Multimodal Gemini | 30 menit | File dari WA klien otomatis masuk ke Drive & dipahami AI |
| **Fase 4** | Update UI Inbox Web (`WaInboxTab.tsx`) | 30 menit | Preview foto & kartu file PDF muncul di modal Inbox |
| **Fase 5** | Fitur Kirim Lampiran Manual dari Inbox | 25 menit | Mas Arzha bisa kirim file PDF langsung ke WA klien |
| **Fase 6** | Automated Tests & Deploy ke Production | 15 menit | Semua test lulus (vitest), deploy live di Vercel |

---

## 7. Mitigasi Risiko & Keamanan

1. **Batas Ukuran File Meta & Timeout Serverless:**
   * Meta mengizinkan file dokumen hingga 100 MB dan video 16 MB.
   * Vercel Serverless Function memiliki batas timeout eksekusi (10 detik pada free tier, 60 detik pada pro).
   * *Mitigasi:* Menggunakan direct buffer streaming dan batasan ukuran aman (misal maksimum 15 MB untuk pemrosesan instan webhook) agar tidak terjadi timeout.
2. **Keamanan Private Key:**
   * Private key Service Account disimpan di Environment Variable Vercel (encrypted), tidak pernah di-commit ke Git repo.
3. **Penyalahgunaan Storage:**
   * Filter anti-spam dan pembatasan kuota pesan Meta yang sudah ada otomatis membatasi frekuensi kiriman file dari nomor tak dikenal.

---

## 8. Analisis Biaya Token AI & Kuota WhatsApp Business (WABA)

Fitur ini dirancang dengan prinsip hemat biaya agar **tidak membebani kuota gratis WABA maupun biaya token AI**:

### 8.1 Kuota & Biaya WhatsApp Cloud API (Meta WABA) 👉 **100% GRATIS**
* **Aturan Jendela Layanan 24 Jam (Customer Service Window):**
  * Meta memberikan **1.000 percakapan Service (User-Initiated) gratis per bulan**.
  * Setiap kali klien mengirim chat (baik teks, foto, dokumen PDF, maupun video), ini membuka jendela layanan 24 jam.
  * Di dalam jendela 24 jam tersebut, **kirim atau terima pesan teks, foto, maupun file PDF berulang kali TIDAK DIKENAKAN BIAYA TAMBAHAN**. Seluruh pertukaran pesan media dihitung sebagai **1 sesi yang sama** dari kuota 1.000 gratis bulanan.
* **Biaya Download & Upload Media ke Meta:**
  * Endpoint Meta Graph API untuk mengunduh media dari klien (`GET /v21.0/{media_id}`) dan mengunggah lampiran balasan (`POST /v21.0/{phone_number_id}/media`) **100% GRATIS** tanpa biaya bandwidth dari Meta.

### 8.2 Biaya Token AI (Gemini / Vertex AI) 👉 **Hampir Nol (Smart Filtering)**
Untuk menjaga efisiensi token AI, diterapkan strategi pemilahan pintar:
1. **Untuk Gambar / Screenshot:**
   * Gemini Flash menghitung 1 gambar setara **~258 token input** (biaya kurang dari Rp 0,5 per gambar, atau gratis dalam batas free-tier).
2. **Untuk Dokumen PDF Tebal / Video Besar:**
   * **Tidak dikirim utuh ke model AI.**
   * File video atau dokumen PDF berhalaman banyak langsung dialirkan (*stream*) dan disimpan ke Google Drive.
   * Bot Zannah hanya diberi konteks teks ringkas (hanya memakan ~10 token teks biasa):
     `[Pengguna mengirimkan file dokumen: Spesifikasi_Proyek.pdf]`
   * Zannah merespons secara natural dan sopan: *"Terima kasih sudah melampirkan dokumennya Mas/Mbak, filenya sudah tersimpan aman dan akan langsung dipelajari oleh Mas Arzha."*

### 8.3 Google Drive Storage & API 👉 **100% GRATIS**
* Kuota 15 GB pada akun Google baru gratis selamanya.
* Google Drive API v3 gratis dengan batas jutaan request per hari, sangat melampaui kebutuhan chat portfolio.

