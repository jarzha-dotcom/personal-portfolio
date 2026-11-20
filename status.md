# Status Proyek: Integrasi Media WhatsApp & Arsip Google Drive

**Terakhir diperbarui:** 21 November 2026
**Rujukan:** `plan.md` (Rev. 2)

## Ringkasan

| Fase | Fokus | Status |
|:--|:--|:--:|
| 1 | Setup akun Google, OAuth client, ambil refresh token, isi env | ⏳ Menunggu Mas Arzha |
| 2 | Helper backend Drive & media, script otorisasi, env, test | ✅ Selesai |
| 3 | Webhook inbound: arsip saat pesan masuk, metadata & label Inbox | ✅ Selesai (belum diuji dengan `npm test` penuh di repo) |
| 4 | Proxy `api/wa-media.ts` + bubble media di Inbox | ✅ Selesai (belum diuji dengan Drive/Meta asli) |
| 5 | Kirim lampiran manual dari Inbox | ✅ Selesai (belum diuji dengan Meta/Drive asli) |
| 5b | Lampiran > 3 MB (maks 15 MB) via upload langsung ke Drive | ✅ Selesai (belum diuji dengan Drive/Meta asli) |
| 6 | Test akhir, `vercel.json`, deploy | ⬜ Belum |

**Posisi saat ini:** Fase 5 dan 5b selesai (lampiran ≤3 MB lewat JSON, 3–15 MB langsung ke Drive; balasan teks manual ikut kuota): Mas Arzha bisa mengirim foto/PDF/dll. dari Inbox (📎). Fase 4 selesai: Inbox bisa menampilkan lampiran lewat proxy ber-PIN. Fase 3 sudah menyambungkan arsip ke webhook. Selama `GDRIVE_*` belum diisi (Fase 1), `getGoogleDriveConfig().configured` bernilai false dan **tidak ada unduhan/arsip tambahan**, jadi perilaku produksi sama seperti sebelumnya (kecuali `video` kini dikenali dan dicatat). Arsip aktif otomatis setelah Fase 1 selesai.

## Yang Sudah Selesai (Fase 2)

- `api/_lib/googleDrive.ts`: klien Drive v3 (OAuth refresh token, folder otomatis + berbagi ke email pribadi, upload multipart, metadata, stream konten dengan Range). Tanpa dependensi baru.
- `api/_lib/whatsappMedia.ts`: unduh media Meta sebagai Buffer (validasi host, whitelist MIME, batas ukuran 2×), arsip ke Drive, nama file aman, label pratinjau Inbox. Kegagalan Drive tidak mematikan pipeline.
- `scripts/google-drive-auth.mjs` + script `npm run google:auth`.
- `api/_lib/whatsappGraph.ts`: hanya `export` untuk `GRAPH_BASE_URL` dan `isAllowedMetaMediaHost`.
- `.env.example`: variabel `GDRIVE_*` dan `WA_MEDIA_MAX_MB`.
- Test baru: `googleDrive.test.ts` (13) dan `whatsappMedia.test.ts` (17).

## Yang Sudah Selesai (Fase 5)

- `api/_lib/waAuth.ts` (baru): `verifyWaAdminPin` bersama; salinan `verifyPin` di `wa-inbox.ts` dan `wa-media.ts` dihapus.
- `api/_lib/whatsappGraph.ts`: `uploadMetaMedia` (multipart ke `/{phone_number_id}/media`) dan `sendWhatsAppMediaMessage` (image/document/video/audio via `media id`, caption kecuali audio, `filename` untuk dokumen, penjaga 131021 yang sama).
- `api/_lib/whatsappMedia.ts`: `waOutboundKindFromMime` (whitelist keluar, **tanpa `image/webp`** karena Meta hanya menerima JPEG/PNG sebagai gambar), `normalizeOutboundMime`, `WA_OUTBOUND_MAX_BYTES` (3 MB), `archiveOutboundMedia` (salinan ke Drive berawalan `keluar_`, tidak pernah melempar).
- `api/_lib/whatsappState.ts`: `getInboxContact`, `isWithinServiceWindow` (24 jam, margin 1 menit), `WA_SERVICE_WINDOW_MS`; `appendWaHistory` menerima parameter ke-5 `modelMedia` (kompatibel mundur).
- `api/wa-inbox.ts`: aksi `reply_media`. Urutan: validasi input → kredensial → **jendela 24 jam** (dari `lastAt` metadata Inbox) → **kuota** (`reserveMetaReplyQuota`) → upload Meta → kirim → arsip Drive → riwayat + pause bot 2 jam. Kuota dikembalikan bila upload/kirim gagal. Setelah pesan terkirim, kegagalan arsip/riwayat **tidak** menggagalkan respons. Kode galat: 400/409 `window_closed`/413/415/429/502/503; Meta 131047 dipetakan ke `window_closed`.
- `src/lib/waAttachment.ts` (baru) dan `WaInboxTab.tsx`: tombol 📎, chip pratinjau, caption lewat kotak teks, gambar >1 MB atau WebP **dikompres otomatis ke JPEG ≤1600 px** di browser, validasi 3 MB, pesan galat jelas.
- `vercel.json`: `api/wa-inbox.ts` → `maxDuration: 60` (upload Meta 25 dtk + kirim 10 dtk + Drive).
- Test baru `api/__tests__/waReplyMedia.test.ts` (14 test).

**Hasil verifikasi Fase 5:** `tsc --noEmit` backend (NodeNext, strict) dan frontend (bundler) bersih; `vitest` 58/58 lulus (14 baru + 44 test Fase 2/4 yang sama-sama menyentuh modul yang diubah). `whatsapp.test.ts` dan `whatsappInboundMedia.test.ts` tidak dijalankan di sandbox (modul pendukung tidak ada di zip); perubahan pada `appendWaHistory` hanya menambah parameter opsional.

**Catatan penting Fase 5:**
1. **Batas efektif 3 MB, bukan 4 MB.** Berkas dikirim sebagai base64 dalam JSON (+33%); 4 MB mentah menjadi ±5,3 MB dan melewati batas 4,5 MB Vercel. Foto HP otomatis dikompres, tetapi PDF/video >3 MB ditolak → itulah gunanya Fase 5b.

3. Jendela 24 jam dibaca dari metadata Inbox (TTL 7 hari). Tanpa catatan pesan masuk, lampiran ditolak karena jendela tak bisa dipastikan.
4. Tidak ada bilah progres unggahan (3 MB kecil; hanya spinner).
5. Belum pernah dijalankan terhadap Meta/Drive nyata atau di browser.

## Yang Sudah Selesai (Fase 5b + kuota teks)

- `googleDrive.ts`: `createResumableUploadSession` (sesi upload resumable, `Origin` diteruskan agar CORS diizinkan) dan `downloadDriveFileBuffer` (batas ukuran dicek dari header dan isi).
- `whatsappMedia.ts`: `getOutboundLimitBytes(kind)`: gambar 5 MB, audio/video 16 MB, dokumen 100 MB, semuanya dibatasi `WA_MEDIA_MAX_MB` (default 15).
- `wa-inbox.ts`: aksi `prepare_upload` (validasi tipe/ukuran/jendela 24 jam **sebelum** pengguna menunggu unggahan, lalu mengembalikan `sessionUrl`); `reply_media` kini menerima `driveFileId` sebagai sumber alternatif. Pada jalur ini MIME dan ukuran dibaca dari **metadata Drive**, bukan dari klien; berkas tidak diarsipkan ulang (sudah di Drive). Balasan teks (`reply`) kini memakai `reserveMetaReplyQuota` dan mengembalikannya bila gagal kirim (429 bila habis).
- Frontend: berkas >3 MB otomatis lewat Drive, dengan bilah progres (XHR); batas browser 15 MB.
- Test: `waReplyMedia.test.ts` kini 19 test. **Verifikasi:** `tsc` backend & frontend bersih; `vitest` 63/63 lulus (19 + 14 proxy + 17 media + 13 Drive).

**Catatan 5b yang perlu diperhatikan:**
1. **CORS resumable upload belum terbukti dengan Drive asli.** Dokumentasi Google mengizinkan PUT dari browser bila sesi dibuat dengan header `Origin` yang sama, dan itu yang dilakukan kode ini; tapi test memakai `fetch` mock. Cek di smoke test (kirim video 5 MB). Bila diblokir, fallback-nya memproksikan upload lewat server (terbatas 4,5 MB, jadi tidak berguna) atau mengirim dari HP.
2. `sessionUrl` adalah kredensial sementara untuk menulis ke Drive; hanya dikembalikan ke pemegang PIN dan tidak dicatat di log/Redis.
3. Pemegang PIN bisa mengirim `driveFileId` apa pun yang dibuat app ini (termasuk lampiran klien lain) ke nomor mana pun. Wajar karena PIN = pemilik; catat bila PIN dibagikan.
4. Bila unggahan ke Drive sukses tetapi pengiriman ke WhatsApp gagal, file tetap ada di Drive (tidak dihapus).

## Yang Sudah Selesai (Fase 4)

- `api/wa-media.ts`: `GET /api/wa-media?id=<driveFileId>[&download=1]`, ber-PIN (`x-tts-usage-pin`, perbandingan timing-safe). Men-stream isi file dari Drive (`Readable.fromWeb` → `res`), mendukung `Range` (206 + `Content-Range`) dan `HEAD`. Header `Range` divalidasi (satu rentang saja, selain itu 416). MIME dari metadata Drive divalidasi ulang terhadap whitelist (selain itu 415, isi tidak dialirkan). Gambar/PDF/audio/video `inline`; dokumen Office selalu `attachment`. Header: `nosniff`, `CSP: default-src 'none'; sandbox`, `Cache-Control: private`. Koneksi klien putus → unduhan dari Drive dihentikan. Galat Drive dipetakan ke 400/404/502/503/504; `invalid_grant` memberi petunjuk `npm run google:auth`.
- `src/components/WaMediaBubble.tsx` (baru): karena `<img>`/`<video>` tidak bisa mengirim header PIN, file diambil dengan `fetch` + PIN lalu dipakai sebagai object URL (dilepas saat unmount). Gambar dimuat otomatis + lightbox (Esc/klik untuk menutup). Dokumen: kartu dengan Buka (PDF, tab baru) dan Unduh. Video/audio: baru diunduh saat diklik. Teks placeholder otomatis (`[Pengirim mengirimkan ...]`) disembunyikan bila ada lampiran; caption tetap tampil.
- `src/components/WaInboxTab.tsx`: `WaChatTurn.media?`, bubble merender lampiran sebelum teks.
- `vercel.json`: `api/wa-media.ts` → `maxDuration: 30`.
- Test baru `api/__tests__/waMediaProxy.test.ts` (14 skenario): PIN, method, id tidak valid, stream + header, PDF inline vs download, Office attachment, Range 206, Range tidak valid 416, MIME di luar whitelist 415, 404, `invalid_grant`, belum dikonfigurasi, HEAD.

## Yang Sudah Selesai (Fase 3)

- `api/whatsapp.ts`: tipe `video`; `caption` dicatat di bubble; arsip ke Drive dilakukan **saat pesan diterima** (sebelum jeda 15 dtk), hanya jika Drive terkonfigurasi. Nomor di Skip List dan kontak tersimpan **tidak** diunduh/diarsipkan. Saat bot dimatikan/di-pause, lampiran tetap diarsipkan dan dicatat ke transkrip Inbox (tanpa balasan AI). File melebihi `WA_MEDIA_MAX_MB` atau berformat tak didukung diberi konteks teks ke Zannah agar membalas sopan. Video tidak dikirim ke Gemini. Peringatan `invalid_grant` ke Mas Arzha maksimal 1x/hari (mengikuti `WA_NOTIFY_OWNER`).
- `api/_lib/whatsappState.ts`: re-export `WaMediaAttachment`/`WaMediaKind`; `PendingBubble.media/caption`; `WaChatTurn.media?`; `appendWaHistory(..., userMedia?)`; fungsi baru `appendWaTranscriptUserTurn` (hanya transkrip Inbox, tidak menyentuh konteks AI).
- `api/_lib/whatsappMedia.ts`: `processInboundMedia` kini mengembalikan `driveErrorCode`.
- Preview Inbox (`lastMessage`) memakai caption, atau label (`[📷 Foto]`, `[📄 Dokumen: …]`) bila tanpa caption.
- Test baru `api/__tests__/whatsappInboundMedia.test.ts` (9 skenario).

## Hasil Verifikasi

| Pemeriksaan | Hasil |
|:--|:--|
| `tsc --noEmit` pada file baru/diubah (TS 5.8, strict, NodeNext) | ✅ Bersih |
| `vitest` untuk 2 file test baru | ✅ 30/30 lulus |
| `whatsappInboundMedia.test.ts` (9 test Fase 3) | ✅ 9/9 lulus di sandbox memakai shim `vitest` dan stub `whatsappPrompt`/`documentGenerator`/`@upstash/redis` (modul itu tidak ada di zip). **Jalankan ulang dengan `npm test` asli di repo.** |
| `tsc --noEmit` Fase 3 | ✅ Tidak ada galat baru; satu-satunya galat berasal dari modul yang tidak ada di sandbox |
| `whatsapp.test.ts` (17 test lama) | ⚠️ **Belum dijalankan** (file pendukung seperti `whatsappPrompt.ts` tidak ada di lingkungan pengerjaan). Perubahan di `whatsappGraph.ts` hanya penambahan `export`, jadi risikonya kecil. Jalankan `npm test` di repo. |
| Panggilan nyata ke Google Drive / Meta | ⚠️ **Belum pernah dijalankan.** Semua test memakai `fetch` yang di-mock. Smoke test ada di `panduan-setup-google-drive.md`, Langkah 7. |

## Keputusan yang Sudah Diambil

1. **OAuth refresh token**, bukan Service Account (Service Account tidak punya kuota di My Drive Gmail biasa).
2. **Scope `drive.file`**; folder dibuat otomatis oleh backend dan dibagikan ke `GDRIVE_SHARE_EMAIL`.
3. **Login OAuth memakai Gmail khusus**; akun pribadi hanya menerima akses folder.
4. **File klien tidak dibuat publik**; Inbox mengaksesnya lewat proxy ber-PIN (Fase 4).
5. **Batas arsip** 15 MB (`WA_MEDIA_MAX_MB`, 1–25); batas inline Gemini tetap 4 MB.
6. **Pengiriman keluar memakai `media id`** hasil upload ke Meta, bukan link Drive.

## Pertanyaan / Keputusan yang Masih Terbuka

- ~~Waktu arsip (Fase 3)~~: **diputuskan** saat pesan masuk, dan sudah diterapkan.
- ~~Lampiran manual > 3 MB~~: **diputuskan** dikerjakan (Fase 5b).
- ~~Kuota balasan teks manual~~: **diputuskan** ikut kuota (sudah diterapkan).
- ~~Notifikasi `invalid_grant`~~: sudah dikerjakan di Fase 3 (1x/hari, mengikuti `WA_NOTIFY_OWNER`).
- **Tarif/kuota Meta:** angka pasti untuk akun Mas Arzha perlu dicek di dashboard Meta (aturan harga berubah 1 Okt 2026; lihat `plan.md` bagian 10.1).

## Catatan Fase 4

- **Auth proxy** memakai salinan fungsi `verifyPin` dari `wa-inbox.ts` (belum diekstrak ke modul bersama agar `wa-inbox.ts` tidak tersentuh sebelum Fase 5). Rapikan saat Fase 5.
- **Video besar** diunduh utuh ke memori browser (blob) saat diklik; batas arsip 15 MB membuatnya wajar. Jika ingin streaming progresif, perlu token URL berumur pendek (belum dibuat).
- Pengujian Fase 4 memakai `fetch` mock; `tsc` frontend (bundler resolution) bersih. Belum dijalankan terhadap Drive nyata atau di browser.

## Risiko Yang Perlu Diingat

- Refresh token mati setelah 7 hari jika consent screen masih *Testing* → pastikan *In production*.
- Batas body/respons 4,5 MB pada Vercel Function (memengaruhi upload manual dan proxy; proxy harus streaming).
- Upload manual di luar jendela 24 jam akan ditolak Meta.
- `maxDuration` yang efektif ada di `vercel.json`, bukan export di file TS; fungsi baru (`wa-media.ts`, `wa-inbox.ts` dengan upload) perlu entri di sana.
- Upload pertama oleh dua instance bersamaan bisa membuat folder ganda (sudah dimitigasi: memakai yang tertua).

## Langkah Berikutnya

1. **Mas Arzha:** kerjakan Fase 1 mengikuti `panduan-setup-google-drive.md`, termasuk smoke test.
2. Jalankan `npm test` dan `npm run lint` di repo untuk memastikan semua test lama tetap hijau.
3. ~~Fase 4~~ selesai.
4. ~~Fase 5~~ selesai.
5. ~~Fase 5b~~ selesai. **Fase 6**: `npm test` + `npm run lint` penuh di repo, smoke test nyata (kirim PDF & foto ke nomor uji dalam jendela 24 jam, plus video ±5 MB untuk menguji CORS jalur Drive; terima foto/PDF dari nomor uji), deploy.

## Peta File (Repo)

| Path | Keterangan |
|:--|:--|
| `api/_lib/googleDrive.ts` | Baru (Fase 2) |
| `api/_lib/whatsappMedia.ts` | Baru (Fase 2) |
| `api/_lib/whatsappGraph.ts` | Diubah minor (Fase 2); fungsi kirim media menyusul di Fase 5 |
| `scripts/google-drive-auth.mjs` | Baru (Fase 2) |
| `api/__tests__/googleDrive.test.ts`, `whatsappMedia.test.ts` | Baru (Fase 2) |
| `package.json`, `.env.example` | Diubah (Fase 2) |
| `api/whatsapp.ts`, `api/_lib/whatsappState.ts` | Diubah (Fase 3) |
| `api/__tests__/whatsappInboundMedia.test.ts` | Baru (Fase 3) |
| `api/wa-media.ts`, `src/components/WaMediaBubble.tsx`, `api/__tests__/waMediaProxy.test.ts` | Baru (Fase 4) |
| `src/components/WaInboxTab.tsx` | Diubah (Fase 4); tombol 📎 menyusul di Fase 5 |
| `vercel.json` | Diubah (Fase 4: `wa-media`); `wa-inbox` menyusul di Fase 5 |
| `api/wa-inbox.ts`, `api/_lib/whatsappGraph.ts`, `whatsappMedia.ts`, `whatsappState.ts`, `vercel.json`, `WaInboxTab.tsx` | Diubah (Fase 5) |
| `api/_lib/waAuth.ts`, `src/lib/waAttachment.ts`, `api/__tests__/waReplyMedia.test.ts` | Baru (Fase 5) |
