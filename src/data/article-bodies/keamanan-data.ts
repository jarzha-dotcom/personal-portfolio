// Isi artikel untuk pilar "keamanan-data" (satu file per pilar, dimuat lazy).
// Metadata (judul, excerpt, kategori, dll.) ada di ../articles.ts.
// Key = slug artikel. Artikel baru di pilar ini: tambahkan entri baru di bawah.
import type { ArticleBlock } from '../articles';

export const bodies: Record<string, ArticleBlock[]> = {
  'amankah-data-bisnis-di-google-sheets-drive': [
    {
      paragraphs: [
        'Pertanyaan yang wajar muncul begitu tahu sistemnya "cuma" pakai Google Sheets dan Drive: apa data bisnis aman disimpan di sana? Jawaban singkatnya — infrastrukturnya sendiri aman, tapi keamanan sebenarnya lebih ditentukan oleh cara akses diatur, bukan oleh platformnya.',
      ],
    },
    {
      heading: 'Fakta soal Infrastrukturnya',
      paragraphs: [
        'Data yang tersimpan di Google Sheets dan Drive dienkripsi baik saat disimpan (at rest) maupun saat berpindah (in transit), berjalan di infrastruktur Google yang sama dipakai jutaan organisasi termasuk perusahaan besar dan instansi pemerintahan lewat Google Workspace. Dari sisi infrastruktur murni, ini bukan penyimpanan "abal-abal" — justru salah satu infrastruktur cloud paling banyak diaudit di dunia.',
      ],
    },
    {
      heading: 'Risiko Sebenarnya: Manajemen Akses, Bukan Infrastruktur',
      paragraphs: [
        'Titik lemah yang paling sering jadi masalah bukan di sisi Google, tapi di sisi pengguna: kata sandi lemah atau dipakai ulang, tidak mengaktifkan verifikasi 2 langkah (2FA), atau — yang paling sering terjadi — file dibagikan dengan pengaturan "siapa saja yang punya link bisa akses" padahal isinya data sensitif. Sistem sekelas apa pun jadi rentan kalau pintu masuknya dibiarkan longgar seperti ini.',
      ],
    },
    {
      heading: 'Fitur yang Sering Terlewat: Version History',
      paragraphs: [
        'Satu keuntungan yang jarang disadari: Sheets dan Drive punya riwayat versi bawaan. Kalau ada data yang tidak sengaja terhapus atau rusak, versi sebelumnya bisa dipulihkan tanpa perlu sistem backup terpisah — sesuatu yang di banyak sistem custom lain justru harus dibangun manual dan sering terlewat.',
      ],
    },
    {
      heading: 'Rekomendasi Praktis',
      paragraphs: [
        'Pakai akun Google Workspace milik perusahaan untuk sistem operasional, bukan akun Gmail pribadi — supaya admin perusahaan bisa mengatur kebijakan keamanan terpusat (2FA wajib, kontrol perangkat, dsb), bukan bergantung ke kebiasaan personal tiap karyawan. Simpan data sensitif di Shared Drive dengan permission spesifik per orang/grup, bukan file di My Drive pribadi yang dibagikan lewat link. Dan aktifkan 2FA di semua akun yang punya akses ke data operasional — ini langkah paling murah dengan dampak keamanan paling besar.',
      ],
    },
    {
      heading: 'Kesimpulan',
      paragraphs: [
        'Pertanyaan yang lebih tepat bukan "apakah Google Sheets/Drive aman", tapi "apakah akses ke datanya dikelola dengan benar". Dengan Workspace, permission yang rapi, dan 2FA aktif, tingkat keamanannya sudah setara dengan yang dipakai banyak sistem korporat. Kalau ada kekhawatiran spesifik soal data bisnismu, itu bisa dibahas langsung di awal diskusi proyek.',
      ],
    },
  ],
};
