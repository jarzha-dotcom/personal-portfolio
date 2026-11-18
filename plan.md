# Rencana Maksimalisasi Zannah AI — Asisten WhatsApp Manusiawi Portfolio Mas Arzha

> **Status:** Virtual Number Production (`+15557499583` / Phone ID: `1493784893813625`)  
> **WABA Produksi:** `1463149232590898` | **Domain:** `https://arzhaning.my.id`  
> **Arah Baru:** **Human-Like Executive Assistant** (bukan sekadar chatbot AI kaku, melainkan asisten pribadi yang hangat, cekatan, dan natural selayaknya manusia yang menjaga WA Mas Arzha).  
> **Last Updated:** 2026-11-18

---

## 1. Filosofi & Strategi: Kenapa Zannah Dibuat Seperti Manusia?

Di website (`arzhaning.my.id`), pengunjung sudah disuguhi chatbot AI interaktif untuk eksplorasi portfolio. **Siapa pun yang melangkah sampai membuka WhatsApp memiliki niat yang jauh lebih serius.** Mereka mengharapkan komunikasi personal, bukan berbicara dengan mesin penjawab kaku.

```
Pengunjung / Klien / Kurir
           ↓
+15557499583 (WhatsApp Resmi Layanan Mas Arzha)
           ↓
   Zannah (Asisten Mas Arzha)
   - Gaya chat: Hangat, luwes, santai tapi profesional, responsif (15 dtk burst coalescing)
   - Identitas: "Zannah, asisten Mas Arzha" (tidak mengobral kata "saya AI/bot", natural)
   - Jika ditanya langsung apakah AI: Jawab santai, jujur, ramah tanpa merusak suasana
           ↓
   ┌───────────────────────────────────────────────┐
   │ 1. Balas chat klien dengan solusi & estimasi  │
   │ 2. Saring info penting (RAB, tamu, kurir)     │
   │ 3. Ping notifikasi ke WA pribadi Mas Arzha    │
   │    (+6282312312734) untuk lead / hal darurat  │
   └───────────────────────────────────────────────┘
```

### Nilai Nyata untuk Mas Arzha
1. **Citra Profesional Kelas Tinggi:** Klien merasa Mas Arzha adalah tech developer mapan yang memiliki asisten pribadi terdedikasi untuk menangani operasional komunikasi.
2. **Siaga 24/7 Tanpa Mengorbankan Waktu Fokus:** Saat Mas Arzha fokus *deep coding*, meeting, atau istirahat, calon klien tetap disapa dalam hitungan detik dengan nada manusiawi.
3. **Filter Lead & Kurir Otomatis:** Hal sepele (kurir kirim foto paket, tanya paket, tamu umum) langsung selesai di tangan Zannah, sementara lead proyek langsung diping ke HP pribadi Mas Arzha.

---

## 2. Status Implementasi Saat Ini

### ✅ Sudah Aktif & Teruji (Production)
- **Koneksi Meta Graph API v22.0:** Webhook aktif di `https://arzhaning.my.id/api/whatsapp`.
- **WABA Produksi Terhubung:** App `chatbot_wa` sukses ter-subscribe ke WABA `1463149232590898` (nomor `+15557499583`).
- **Otak Vertex AI (Google Cloud):** `gemini-3.5-flash-lite` aktif via Enterprise Service Account (Zero Data Training, Rp4,6/chat).
- **Jeda Pintar 15 Detik & Burst Coalescing:** Chat beruntun digabung jadi 1 balasan rapi.
- **Auto-Pause 24 Jam:** Jika Mas Arzha balas manual dari HP, Zannah otomatis diam di nomor tersebut selama 24 jam.
- **Double Hard-Cap Biaya:** Kuota gratis Meta (950 pesan/bulan = Rp0) + limit AI (Rp5.000/bulan).
- **Admin Panel Ber-PIN:** Di modal website Mas Arzha (saklar ON/OFF, kuota, skip list, log kirim terakhir).

---

## 3. Rencana Eksekusi Bertahap

### FASE 1 — Humanisasi Persona & Koreksi Kritis (Dieksekusi Sekarang)
1. **Revisi Total System Prompt ([`whatsappPrompt.ts`](api/_lib/whatsappPrompt.ts)):**
   - Buang semua kata robotik (*"Sebagai AI"*, *"Berdasarkan data"*, *"DevRAB Cloud Engine"*).
   - Terapkan gaya obrolan asisten manusia: ramah, pakai *"Kak"*, sesekali emotikon wajar (😊, 🙏, siap!), kata penghubung alami (*"Oh iya Kak..."*, *"Wah seru nih..."*, *"Siap Kak, saya catat ya..."*).
   - Dukung env `WA_DISPLAY_NUMBER` agar nomor virtual tidak salah merujuk ke nomor +62 di teks prompt.
   - Tetap pertahankan **Pagar Keamanan Fisik** (pantang setuju COD, pantang sebut kondisi rumah, pantang bocorkan data rahasia/OTP).
2. **Koreksi Guard Anti-Error 131021 ([`whatsappGraph.ts`](api/_lib/whatsappGraph.ts)):**
   - Pastikan bot mengenali nomor pengirimnya sendiri adalah `WA_DISPLAY_NUMBER` (`+15557499583`), sehingga pengiriman notifikasi ke `WA_OWNER_PHONE` (`+6282312312734`) tidak terblokir oleh guard recipient-is-sender.

### FASE 2 — Notifikasi Otomatis ke HP Pribadi Mas Arzha
1. **Fungsi `notifyOwnerViaWhatsApp` ([`whatsappGraph.ts`](api/_lib/whatsappGraph.ts)):**
   - Mengirim pesan ringkas 1 baris dari virtual number ke `+6282312312734`.
2. **Trigger Notifikasi di [`whatsapp.ts`](api/whatsapp.ts):**
   - **Lead Baru:** Pertama kali nomor baru chat (riwayat di Redis masih kosong).
   - **RAB Ready:** Saat klien menyelesaikan 7 checklist konsultasi proyek (`[[RAB_READY]]`).
   - **Darurat / COD:** Jika ada kata kunci mendesak atau kurir menagih pembayaran/COD.

### FASE 3 — Integrasi Tombol Portfolio & Tampilan Profil
1. **Floating WhatsApp Button di Portfolio:**
   - Tambah tombol chat mengarah ke `https://wa.me/15557499583?text=Halo%20Zannah%2C%20mau%20tanya-tanya%20layanan%20Mas%20Arzha%20dong`.
2. **Meta Dashboard Profile Settings:**
   - Display name: `K. Arzhaning Jagad` (sudah Approved).
   - Foto profil: Avatar elegan Zannah.
   - Deskripsi profil bisnis WhatsApp: *"Layanan Konsultasi & Asisten Mas Arzha"*.

---

## 4. Variabel Lingkungan Lengkap

```bash
# Meta WhatsApp API
WA_VERIFY_TOKEN=
WA_APP_SECRET=
WA_ACCESS_TOKEN=
WA_PHONE_NUMBER_ID=1493784893813625

# Nomor & Notifikasi
WA_OWNER_PHONE=6282312312734
WA_DISPLAY_NUMBER=+15557499583
WA_NOTIFY_OWNER=true

# Aturan & Kuota
WA_SAFE_DELIVERY_NOTE=
WA_MONTHLY_MESSAGE_LIMIT=950
WA_MONTHLY_BUDGET_IDR=5000
WA_SMART_DELAY_INITIAL_SEC=15
WA_SMART_DELAY_ONGOING_SEC=4
WA_SKIP_SAVED_CONTACTS=true

# Upstash & GCP
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
GCP_SERVICE_ACCOUNT_JSON=
TTS_USAGE_PIN=
```

---

## 5. Checklist Pelaksanaan

```
[x] Revisi plan.md ke paradigma Human-like Personal Assistant
[ ] FASE 1A: Perbarui whatsappPrompt.ts (Humanize System Prompt, buang jargon bot)
[ ] FASE 1B: Perbarui whatsappGraph.ts (Bot Phone vs Owner Phone, tambah notifyOwner)
[ ] FASE 1C: Integrasikan trigger notif owner di api/whatsapp.ts
[ ] FASE 1D: Jalankan & pastikan pengujian otomatis (vitest) lulus 100%
```
