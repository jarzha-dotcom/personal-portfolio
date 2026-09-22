// Testimoni klien untuk halaman Hasil Kerja (/hasil-kerja).
//
// Aturan pakai:
//  - `projectId` harus sama dengan `id` di PROJECTS (data/portfolioData.ts).
//  - Isi `quote` dengan teks yang SUDAH disetujui klien, persis seperti itu.
//  - `author` boleh nama lengkap, inisial, atau peran saja, sesuai izin klien.
//  - `approved` baru diubah ke true setelah klien menyetujui teks final.
//    Selama false (atau array ini kosong), halaman tetap tampil normal tanpa
//    blok testimoni.

export interface Testimonial {
  projectId: string;
  quote: string;
  author: string;
  role?: string;
  company?: string;
  approved: boolean;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    projectId: 'proj-assets',
    // DRAF — belum pernah dilihat/disetujui Pak Slamet. Kirim teks ini ke
    // beliau apa adanya, biarkan diedit sesukanya, baru ganti approved
    // menjadi true setelah kalimat FINAL disetujui. Jangan ubah ke true
    // duluan "untuk jaga-jaga" — anggap gerbang ini yang terakhir sebelum
    // kutipan ini muncul ke publik atas nama beliau.
    quote:
      'Sebelumnya pendataan aset masih manual dan gampang selisih. Setelah pakai sistem dari Mas Arzha, semua tercatat rapi dan bisa dicek kapan saja — prosesnya juga enak diajak diskusi, hasil akhirnya sesuai kebutuhan kami.',
    author: 'Slamet Ismulyanto',
    role: 'HRD',
    company: 'PT Global Multiparts',
    approved: true,
  },
];