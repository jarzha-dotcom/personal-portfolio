# ZhaNotes — Sinkron awan

Variabel lingkungan Vercel (Settings → Environment Variables):

| Nama | Wajib | Keterangan |
|---|---|---|
| ZHANOTES_TOKEN | ya | Rahasia pemilik (min. 20 karakter acak). Dimasukkan di aplikasi saat mengaktifkan sinkron. |
| BLOB_READ_WRITE_TOKEN | ya | Otomatis ada saat Vercel Blob dihubungkan ke proyek. |
| UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN | ya | Atau KV_REST_API_URL / KV_REST_API_TOKEN dari integrasi Marketplace. |
| ZHANOTES_MAX_MB | tidak | Batas ukuran satu dokumen/lampiran (default 200). |
| ZHANOTES_PREFIX | tidak | Awalan kunci Redis & folder Blob (default `zhanotes`). |

Tanpa variabel itu, tombol "Sinkron awan" menampilkan "belum aktif" dan aplikasi tetap berjalan offline seperti biasa.

Aktivasi: Data → Sinkron awan → isi token + kata sandi enkripsi. Perangkat pertama membuat kata sandi enkripsi
(isi dua kali); perangkat lain cukup memasukkan kata sandi yang sama. Kata sandi tidak disimpan di server.
