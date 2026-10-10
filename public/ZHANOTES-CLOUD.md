# ZhaNotes — Sinkron awan

Variabel lingkungan Vercel (Settings → Environment Variables):

| Nama | Wajib | Keterangan |
|---|---|---|
| ZHANOTES_TOKEN | ya | Rahasia pemilik (disarankan 32+ karakter acak, mis. `openssl rand -base64 32`; server mencatat peringatan bila lebih pendek). Dimasukkan di aplikasi saat mengaktifkan sinkron. |
| ZHANOTES_TOKEN_2 … ZHANOTES_TOKEN_5 | tidak | Pemilik tambahan (maks. 5 per deployment). Lihat bagian "Lebih dari satu pengguna". |
| BLOB_READ_WRITE_TOKEN | ya | Otomatis ada saat Vercel Blob dihubungkan ke proyek. |
| UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN | ya | Atau KV_REST_API_URL / KV_REST_API_TOKEN dari integrasi Marketplace. |
| ZHANOTES_MAX_MB | tidak | Batas ukuran satu dokumen/lampiran (default 200). |
| ZHANOTES_PREFIX | tidak | Awalan kunci Redis & folder Blob (default `zhanotes`). |
| ZHANOTES_BLOB_HOST | disarankan | Hostname Blob store Anda, mis. `abc123.public.blob.vercel-storage.com` (lihat URL salah satu blob di dashboard). Bila diisi, proxy `sync-read` hanya mau mengambil dari host itu. |

Perilaku keamanan server: token salah dibatasi 5 kali per 10 menit per IP, hitungannya dibagi lewat Redis sehingga tidak
bisa dihindari dengan memicu instance baru (jawaban 429 menyertakan `Retry-After`). Daftar potongan dengan URL kembar ditolak,
proxy `sync-read` tidak mengikuti redirect dan menolak potongan lebih dari 4 MB, dan galat server sebelum login tidak
membocorkan detail. **Reset cloud** juga menyapu blob yatim (unggahan yang terputus sebelum sempat dikirim).

Tanpa variabel itu, tombol "Sinkron awan" menampilkan "belum aktif" dan aplikasi tetap berjalan offline seperti biasa.

Aktivasi: Data → Sinkron awan → isi token + kata sandi enkripsi. Perangkat pertama membuat kata sandi enkripsi
(isi dua kali); perangkat lain cukup memasukkan kata sandi yang sama. Kata sandi tidak disimpan di server.

## Lebih dari satu pengguna
Satu deployment bisa melayani sampai 5 pemilik. Buat token acak berbeda untuk tiap orang dan isi di Vercel sebagai
`ZHANOTES_TOKEN_2`, `ZHANOTES_TOKEN_3`, dst. (lalu deploy ulang). Tiap token otomatis punya ruang data sendiri:
kunci Redis berawalan `zhanotes-2:`, folder Blob `zhanotes-2/`, serta salt dan kata sandi enkripsi sendiri. Pengguna tidak bisa
melihat, membaca, atau menghapus data pengguna lain, dan **Reset cloud** hanya menghapus data milik token yang dipakai.
Token 1 (`ZHANOTES_TOKEN`) tetap memakai ruang lama, jadi data yang sudah ada tidak perlu dipindah.

- Token tidak boleh sama di dua slot, dan sebaiknya 32+ karakter acak.
- Kuota ukuran dokumen (`ZHANOTES_MAX_MB`) berlaku per dokumen untuk semua pemilik.
- Bila beberapa deployment berbagi satu Redis, jangan beri `ZHANOTES_PREFIX` yang bertabrakan (mis. `zhanotes` dan `zhanotes-2`).
- Mencabut akses seorang pemilik: hapus variabelnya lalu deploy ulang; datanya tetap ada di Redis/Blob sampai di-reset.

## Jika layar Sinkron awan bilang "belum aktif"
Server sekarang menyebut nama variabel yang belum terisi (hanya nama, tidak pernah nilainya). Isi variabel itu di Vercel untuk lingkungan **Production**, lalu **deploy ulang**: variabel baru tidak terbaca oleh deployment yang sudah berjalan.