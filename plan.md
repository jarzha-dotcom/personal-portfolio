# Rencana Implementasi: Integrasi Zannah AI ke WhatsApp Business (Mode Coexistence)

Dokumen ini memuat cetak biru arsitektur, pengaman biaya & privasi, rincian modul kode, serta panduan langkah demi langkah menghubungkan **Zannah AI** ke nomor utama **WhatsApp Business Mas Arzha (`+6282312312734`)** tanpa mengorbankan aplikasi WA di HP dan dengan jaminan biaya bulanan super hemat (**Rp0 untuk Meta API** & **< Rp5.000/bulan untuk Vertex AI**).

---

## 1. Tujuan & Prinsip Arsitektur

1. **1 Nomor Utama (Meta WhatsApp Coexistence):**
   - Nomor utama WA Business tetap aktif di HP sehari-hari sekaligus terhubung ke webhook `/api/whatsapp` di Vercel.
   - Grup WhatsApp otomatis diisolasi oleh Meta (tidak pernah dikirim ke webhook).
2. **Peran Ganda Adaptif ("Bunglon Pintar"):**
   - **Mode Sekretaris Pribadi Natural:** Menyambut kurir paket, ojol, tamu umum, rekruter, atau kenalan baru dengan bahasa manusiawi, ringkas, sopan, dan dilengkapi **pagar keamanan fisik** (pantang mengklaim rumah kosong/ada orang, pantang menyetujui COD, pantang mengarang patokan alamat).
   - **Mode Tech Sales Consultant:** Saat lawan bicara menanyakan pembuatan website, aplikasi, sistem internal, AI chatbot, atau datang dari `arzhaning.my.id`, Zannah otomatis melayani konsultasi teknis, estimasi harga resmi, hingga penyusunan proposal DevRAB.
   - **Kepatuhan Kebijakan AI Meta:** Permintaan *general-purpose AI* di luar urusan Mas Arzha ditolak halus agar akun WA Bisnis utama 100% aman dari pembatasan Meta.
3. **Pemisahan Ketat Otak AI & Privasi Enterprise:**
   - **Website (`api/chat.ts`):** Tetap memakai `GEMINI_API_KEY` gratisan Google AI Studio (Project terpisah tanpa billing).
   - **WhatsApp (`api/whatsapp.ts`):** Memakai jalur **Google Cloud Vertex AI** (`GCP_SERVICE_ACCOUNT_JSON`) yang otomatis memotong kredit promosi `\$300` GCP terlebih dahulu, lalu saldo deposit Rp200.000, dengan jaminan **Zero Data Training** (aman menerima foto paket dari kurir maupun *voice note* klien).
4. **Pengaman Otomatis Berlapis di Upstash Redis:**
   - **Skip Kontak Tersimpan (`smb_app_state_sync`) + Daftar Skip Manual:** Keluarga, teman, dan kontak lama yang tersimpan di HP tidak pernah dikirim ke AI.
   - **Jeda Pintar 15 Detik + *Burst Coalescing*:** Menggabungkan rentetan chat pendek (*"Pagi Mas"*, *"Paket Arzha"*, *[Foto]*) menjadi **1 balasan utuh**, sekaligus memberi Mas Arzha waktu 15 detik untuk membalas duluan jika sedang memegang HP.
   - **Auto-Pause 24 Jam (`smb_message_echoes`):** Begitu Mas Arzha mengetik 1 balasan manual dari HP ke seseorang, Zannah otomatis berhenti menyahut di ruang chat tersebut selama 24 jam.
   - **Remote Control via *Chat Diri Sendiri* + Panel Admin PIN:** Kontrol cepat lewat perintah `#off`, `#on`, `#skip 08xxx`, `#unskip 08xxx`, `#reset 08xxx` di ruang *Chat Diri Sendiri* WA, ditambah panel visual di `TtsQuotaModal` (PIN `TTS_USAGE_PIN`).
   - **Double Hard-Cap Biaya:** Kunci keras maksimal **950 balasan/bulan** (di bawah batas gratis 1.000 pesan Meta = **Rp0**) dan kunci anggaran **Rp5.000/bulan** di Vertex AI.

---

## 2. Alur Pemrosesan Pesan Masuk

```
Pesan / Event Masuk ke POST /api/whatsapp
   │
   ├─► Verifikasi HMAC-SHA256 (x-hub-signature-256 + WA_APP_SECRET)
   │
   ├─► [Event: smb_app_state_sync] ──► Simpan/hapus nomor buku kontak HP di Redis Set `wa:contacts:synced`
   │
   ├─► [Event: smb_message_echoes] (Pesan dikirim manual dari HP Mas Arzha)
   │     ├─► Jika `from === to` (Chat Diri Sendiri): Eksekusi perintah `#on`, `#off`, `#skip`, `#unskip`, `#reset`
   │     └─► Jika `from !== to` (Balas ke orang lain): Aktifkan `wa:pause:<nomor>` (24 jam) & batalkan antrean tunda
   │
   └─► [Event: messages] (Chat masuk 1-on-1 dari orang luar)
         ├─► 1. Cek anti-self (`from !== OWNER_PHONE` cegah Error 131021) & deduplikasi `wa:dedup:<wamid>`
         ├─► 2. Cek Saklar Global (`wa:config:enabled`), Skip List Manual, Kontak Tersimpan, & Status Pause 24 Jam
         ├─► 3. Masukkan pesan ke buffer `wa:pending:<nomor>` & tunggu Jeda Pintar (15 dtk awal / 4 dtk lanjutan)
         ├─► 4. Bangun dari jeda:
         │      - Ada chat susulan baru? Biarkan eksekusi terbaru yang membalas sekaligus (Burst Coalescing)
         │      - Mas Arzha sudah balas manual selama jeda? Batalkan Zannah!
         ├─► 5. Reservasi kuota Meta (maks 950/bln) & cek pagu anggaran Vertex AI (maks Rp5.000/bln)
         ├─► 6. Kirim centang biru (`status: "read"`) + animasi `"sedang mengetik..."` ke layar HP pengirim
         ├─► 7. Unduh media opsional (foto/voice note <= 4 MB jika mode Paid/Vertex aktif) & panggil Vertex AI Gemini
         ├─► 8. (Opsional) Jika `[[RAB_READY]]`, proses proposal ke DevRAB Engine + format teks khusus WhatsApp
         └─► 9. Kirim balasan via WhatsApp Cloud API & simpan 12 giliran terakhir di Redis (TTL 24 jam)
```

---

## 3. Daftar Modul Kode yang Dibangun / Diperbarui

| Berkas | Tugas Utama |
| :--- | :--- |
| `api/_lib/whatsappState.ts` | State Upstash Redis (dengan fallback memori lokal untuk tes), normalisasi nomor Indonesia (`08xx` → `628xx`), atomic quota gate Meta (950/bln) & Vertex AI (Rp5.000/bln), antrean *burst coalescing*, daftar skip, dan riwayat chat 24 jam. |
| `api/_lib/whatsappPrompt.ts` | System prompt khusus Zannah WA (Sekretaris Pribadi + Tech Sales Consultant + pagar keamanan fisik kurir/COD), parser perintah `#on/#off/#skip`, serta konverter format Markdown → WhatsApp (`*teks*`). |
| `api/_lib/whatsappAi.ts` | Klien REST **Google Cloud Vertex AI** murni (`node:crypto` RS256 JWT + cache token OAuth2 55 menit, tanpa tambahan dependency npm) + fallback opsional `WA_GEMINI_API_KEY` terpisah, lengkap kalkulasi biaya aktual Rupiah per token. |
| `api/_lib/whatsappGraph.ts` | Verifikasi tanda tangan `x-hub-signature-256`, pengiriman *Read Receipt + Typing Indicator*, unduh media foto/suara masuk (`<= 4 MB`), dan pengiriman pesan teks Cloud API dengan penjaga anti-Error `131021`. |
| `api/whatsapp.ts` | Serverless Function utama `/api/whatsapp`: verifikasi `hub.challenge` Meta, pemrosesan webhook asinkron via `waitUntil` Vercel, integrasi RAB otomatis, serta API admin ber-PIN (`TTS_USAGE_PIN`). |
| `src/components/TtsQuotaModal.tsx` | Penambahan panel kontrol **WhatsApp Zannah AI** di modal admin rahasia: saklar ON/OFF 1 klik, bar kuota gratis Meta & anggaran Vertex AI, status env server, dan kelola daftar nomor pengecualian langsung dari UI. |
| `vercel.json` & `.env.example` | Konfigurasi `maxDuration: 60` untuk `api/whatsapp.ts` dan dokumentasi variabel lingkungan baru. |
| `api/__tests__/whatsapp.test.ts` | Pengujian otomatis menyeluruh (`vitest`) untuk tanda tangan Meta, normalisasi nomor, perintah *Chat Diri Sendiri*, *auto-pause* manual, *burst coalescing*, pengaman kuota, dan panel admin. |

---

## 4. Panduan Persiapan Akun Eksternal (Setelah Kode Terdeploy)

### Tahap A — Siapkan Vertex AI di Google Cloud (Kredit `\$300` + Deposit Rp200rb)
1. Buka **Google Cloud Console** pada project yang terhubung dengan Billing GCP kamu (berbeda dari project AI Studio gratis milik website).
2. Aktifkan **Vertex AI API** (`aiplatform.googleapis.com`).
3. Masuk ke **IAM & Admin → Service Accounts → Create Service Account** (misal: `zannah-wa-vertex`).
4. Berikan role **`Vertex AI User`** (`roles/aiplatform.user`).
5. Buka tab **Keys → Add Key → Create new key (JSON)**, lalu simpan isi JSON tersebut ke variabel Vercel `GCP_SERVICE_ACCOUNT_JSON`.

### Tahap B — Siapkan Meta Developer App & WhatsApp Coexistence
1. Buka [developers.facebook.com](https://developers.facebook.com) → **Create App** → pilih tipe **Business**.
2. Tambahkan produk **WhatsApp**, lalu catat **App Secret** (di *App Settings > Basic*) untuk diisi ke `WA_APP_SECRET`.
3. Buat **System User** di *Meta Business Settings* dengan akses ke WABA kamu, generate **Permanent Access Token** (`whatsapp_business_messaging`, `whatsapp_business_management`) → isi ke `WA_ACCESS_TOKEN`.
4. Di menu **WhatsApp > Configuration (Webhooks)**:
   - Callback URL: `https://arzhaning.my.id/api/whatsapp`
   - Verify Token: samakan dengan nilai `WA_VERIFY_TOKEN` yang kamu pasang di Vercel.
   - **Wajib Subscribe 3 Webhook Fields:** `messages`, `smb_message_echoes`, dan `smb_app_state_sync`.
5. Jalankan alur **Embedded Signup Coexistence** (*Connect your existing WhatsApp Business App*) lalu scan QR dari aplikasi WA Business di HP utamamu (`+6282312312734`). Catat **Phone Number ID** → isi ke `WA_PHONE_NUMBER_ID`.

### Tahap C — Daftar Perintah Cepat di Ruang "Chat Diri Sendiri" WA
Ketik kapan saja dari HP kamu di ruang chat ke nomor sendiri:
- `#off` — Matikan Zannah sementara secara global.
- `#on` — Aktifkan kembali Zannah.
- `#skip 08123456789` — Masukkan nomor ke daftar pengecualian permanen.
- `#unskip 08123456789` — Hapus nomor dari daftar pengecualian & buka status jeda manual.
- `#reset 08123456789` — Bersihkan ingatan riwayat chat Zannah untuk nomor tersebut.

