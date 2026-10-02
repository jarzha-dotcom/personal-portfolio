/**
 * speechNormalizer.test.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Jalankan: `npx vitest run`  (atau `npx vitest` untuk mode watch)
 *
 * Cara pakai saat menemukan bug pelafalan:
 *   1. Tambah satu baris `[input, output yang diharapkan]` ke tabel yang cocok.
 *   2. Jalankan test -> harus MERAH.
 *   3. Perbaiki speechNormalizer.ts sampai HIJAU, dan pastikan baris lain tetap hijau.
 *
 * Tabel "persis" memakai kalimat tanpa istilah kamus supaya tidak ikut berubah
 * tiap kali kamus pelafalan ditambah. Untuk istilah kamus, pakai blok `toContain`.
 */
import { describe, expect, it } from 'vitest';
import { angkaKeKata, normalizeIndonesianForSpeech as n } from './speechNormalizer';

type Kasus = readonly [input: string, expected: string];

const persis = (judul: string, kasus: readonly Kasus[]) =>
  describe(judul, () => {
    it.each(kasus)('%j', (input, expected) => {
      expect(n(input)).toBe(expected);
    });
  });

// ── Angka dasar ──────────────────────────────────────────────────────────────
describe('angkaKeKata', () => {
  it.each([
    ['0', 'nol'],
    ['7', 'tujuh'],
    ['11', 'sebelas'],
    ['100', 'seratus'],
    ['1000', 'seribu'],
    ['2025', 'dua ribu dua puluh lima'],
    ['1500000', 'satu juta lima ratus ribu'],
  ])('%s -> %s', (angka, kata) => {
    expect(angkaKeKata(angka)).toBe(kata);
  });
});

// ── Uang, persen, satuan ─────────────────────────────────────────────────────
persis('uang & rentang harga', [
  ['Rp1.500.000 - Rp5.000.000', 'satu juta lima ratus ribu sampai lima juta rupiah'],
  ['Rp800rb - 1,5jt', 'delapan ratus ribu sampai satu setengah juta rupiah'],
  ['Rp2,5 juta - Rp10 juta', 'dua setengah juta sampai sepuluh juta rupiah'],
  ['Rp1.250.000/bulan', 'satu juta dua ratus lima puluh ribu rupiah per bulan'],
  ['Hanya Rp99rb.', 'Hanya sembilan puluh sembilan ribu rupiah.'],
  ['Rp50.000,-', 'lima puluh ribu rupiah'],
  ['1.500 orang', 'seribu lima ratus orang'],
  ['1,2 miliar', 'satu koma dua miliar'],
  ['3,14', 'tiga koma satu empat'],
]);

persis('persen, suhu & satuan teknis', [
  ['diskon 25%', 'diskon dua puluh lima persen'],
  ['hemat 40-60%', 'hemat empat puluh sampai enam puluh persen'],
  ['uptime 99,9%', 'uptime sembilan puluh sembilan koma sembilan persen'],
  ['16 GB', 'enam belas gigabait'],
  ['5-10 GB', 'lima sampai sepuluh gigabait'],
  ['respon 200ms', 'respon dua ratus milidetik'],
  ['7+ tahun', 'lebih dari tujuh tahun'],
  ['2024-2026', '2024 sampai 2026'],
]);

// ── Waktu & tanggal ──────────────────────────────────────────────────────────
persis('jam', [
  ['09.00-17.00 WIB', 'sembilan sampai tujuh belas We-i-Be'],
  ['Pukul 08.15', 'Pukul delapan lima belas'],
]);

persis('tanggal', [
  ['17/08/2025', 'tujuh belas Agustus dua ribu dua puluh lima'],
  ['17-08-2025', 'tujuh belas Agustus dua ribu dua puluh lima'],
  ['17.08.2025', 'tujuh belas Agustus dua ribu dua puluh lima'],
  ['2025-08-17', 'tujuh belas Agustus dua ribu dua puluh lima'],
  ['5-3-2026', 'lima Maret dua ribu dua puluh enam'],
  ['tgl 01/01/2026', 'tanggal satu Januari dua ribu dua puluh enam'],
  ['Q3 2026', 'kuartal 3 2026'],
]);

// ── Pecahan, skor, perkalian ─────────────────────────────────────────────────
persis('pecahan', [
  ['1/2 porsi', 'setengah porsi'],
  ['1/3 saja', 'sepertiga saja'],
  ['2/3 bagian', 'dua pertiga bagian'],
  ['1/4 layar', 'seperempat layar'],
  ['3/4 cup', 'tiga perempat cup'],
  ['1½ jam', '1 setengah jam'],
]);

persis('skor "x dari y"', [
  ['Skor 4,8/5', 'Skor empat koma delapan dari lima'],
  ['rating 9/10', 'rating sembilan dari sepuluh'],
  ['nilai 4.5/5', 'nilai empat koma lima dari lima'],
  ['halaman 3/10', 'halaman tiga dari sepuluh'],
  ['10/10 recommended', 'sepuluh dari sepuluh recommended'],
  ['9,5/10', 'sembilan koma lima dari sepuluh'],
]);

persis('perkalian "x"', [
  ['3x lipat', 'tiga kali lipat'],
  ['hemat 2x', 'hemat dua kali'],
  ['1,5x lebih cepat', 'satu koma lima kali lebih cepat'],
  ['3 x 4 meter', 'tiga kali empat meter'],
  ['1920x1080', 'seribu sembilan ratus dua puluh kali seribu delapan puluh'],
]);

persis('desimal bertitik (gaya Inggris)', [
  ['1.5 detik', 'satu koma lima detik'],
  ['rata-rata 2.5 jam', 'rata-rata dua koma lima jam'],
  ['IPK 3.75', 'IPK tiga koma tujuh lima'],
]);

// ── Kontak, versi, alamat ────────────────────────────────────────────────────
persis('telepon', [
  ['0812-3456-7890', 'nol delapan satu dua, tiga empat lima enam, tujuh delapan sembilan nol'],
  ['081234567890', 'nol delapan satu dua, tiga empat lima enam, tujuh delapan sembilan nol'],
  ['+62 812 3456 7890', 'plus enam dua, delapan satu dua, tiga empat lima enam, tujuh delapan sembilan nol'],
  ['+62-812-3456-7890', 'plus enam dua, delapan satu dua, tiga empat lima enam, tujuh delapan sembilan nol'],
  ['(021) 5551234', 'nol dua satu, lima lima lima satu dua tiga empat'],
  ['0274-123456', 'nol dua tujuh empat, satu dua tiga empat lima enam'],
]);

persis('versi, IP, handle, 24/7', [
  ['v2.1.0', 'versi dua titik satu titik nol'],
  ['versi v2.1', 'versi dua titik satu'],
  ['2.1.0-beta', 'dua titik satu titik nol-beta'],
  ['192.168.1.1', 'satu sembilan dua titik satu enam delapan titik satu titik satu'],
  ['@studio.kreatif', 'studio titik kreatif'],
  ['24/7 support', 'dua puluh empat jam, tujuh hari seminggu support'],
]);

// ── Istilah kamus (tidak dipatok persis) ─────────────────────────────────────
describe('kamus & singkatan', () => {
  it.each([
    ['Next.js', 'Neks'],
    ['C#', 'Si sharp'],
    ['.NET', 'Dot Net'],
    ['wa.me/62812', 'tautan WhatsApp'],
    ['dll.', 'dan lain-lain'],
    ['Jl. Sudirman No. 12A', 'Jalan Sudirman nomor 12A'],
  ])('%j memuat %j', (input, potongan) => {
    expect(n(input)).toContain(potongan);
  });
});

// ── Jangan merusak yang bukan angka/tanggal ──────────────────────────────────
describe('dibiarkan apa adanya', () => {
  it.each([
    '31/02/2025', // tanggal tidak valid
    '0x1F', // heksadesimal
    '3xl', // ukuran baju
    'Bab 2.3 tentang desain', // nomor bab
    '1/12', // penyebut > 10
    'kuartal ke-2',
    'Tidak ada angka di sini.',
  ])('%j', (input) => {
    expect(n(input)).toBe(input);
  });

  it('1.500.000.000 tanpa Rp dibaca sebagai bilangan, bukan IP', () => {
    expect(n('1.500.000.000')).toBe('satu miliar lima ratus juta');
  });

  it('nominal rupiah bertitik banyak tidak dianggap IP', () => {
    expect(n('Rp1.200.100.050')).toContain('rupiah');
    expect(n('Rp1.200.100.050')).not.toContain('titik');
  });
});

// ── Sifat umum ───────────────────────────────────────────────────────────────
const CONTOH_CAMPURAN = [
  'Budget Rp2,5 juta - Rp10 juta, DP 30%, cicilan Rp1.250.000/bulan',
  'Dibuat dengan React 18, Next.js 14, Node 20 dan PostgreSQL 16',
  'Hubungi +62 812 3456 7890, buka Senin-Jumat 09.00-17.00 WIB, tgl 17/08/2025',
  'Versi v2.1.0, server 192.168.1.1, 24/7 support, skor 4,8/5, hemat 3x lipat',
  'Email halo@contoh.co.id, IG @studio.kreatif, https://wa.me/62812',
  'PT. Maju Jaya, Jl. Sudirman No. 12A, 1/2 harga, IPK 3.75, dll.',
  'C++, .NET, CI/CD, UI/UX, B2B & B2C, REST/GraphQL',
];

describe('sifat umum', () => {
  it.each(CONTOH_CAMPURAN)('idempoten: %j', (input) => {
    const sekali = n(input);
    expect(n(sekali)).toBe(sekali);
  });

  it.each(CONTOH_CAMPURAN)('tidak menyisakan spasi ganda / spasi sebelum tanda baca: %j', (input) => {
    const out = n(input);
    expect(out).not.toMatch(/\s{2,}/);
    expect(out).not.toMatch(/\s[,;.!?](\s|$)/);
  });

  it('string kosong tetap kosong', () => {
    expect(n('')).toBe('');
    expect(n('   ')).toBe('');
  });
});
