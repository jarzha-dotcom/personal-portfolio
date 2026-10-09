# ZhaNotes — Cadangan awan

Variabel lingkungan Vercel (Settings → Environment Variables):

| Nama | Wajib | Keterangan |
|---|---|---|
| ZHANOTES_TOKEN | ya | Rahasia pemilik (min. 20 karakter acak). Dimasukkan di aplikasi saat cadangan awan dipakai. |
| BLOB_READ_WRITE_TOKEN | ya | Otomatis ada saat Vercel Blob dihubungkan ke proyek. |
| UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN | ya | Atau KV_REST_API_URL / KV_REST_API_TOKEN dari integrasi Marketplace. |
| ZHANOTES_KEEP | tidak | Jumlah cadangan terakhir yang disimpan (default 3). |
| ZHANOTES_MAX_MB | tidak | Batas ukuran satu cadangan (default 200). |
| ZHANOTES_PREFIX | tidak | Awalan kunci Redis & folder Blob (default `zhanotes`). |

Tanpa variabel itu, tombol "Cadangan awan" menampilkan "belum aktif" dan aplikasi tetap berjalan offline seperti biasa.
