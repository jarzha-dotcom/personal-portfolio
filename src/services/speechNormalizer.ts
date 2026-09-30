/**
 * speechNormalizer.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Normalisasi teks Bahasa Indonesia (campur istilah Inggris/teknis) sebelum
 * dikirim ke TTS. Dipakai voiceService.ts, jadi berlaku untuk Google Cloud TTS
 * maupun fallback Web Speech browser. Server (api/tts.ts) TIDAK menormalisasi
 * lagi -- cukup sekali di frontend supaya hasilnya tidak diproses dua kali.
 *
 * Isi file:
 *   1. Angka -> kata  (uang, rentang harga, desimal, persen, jam, telepon, satuan)
 *   2. Kamus pelafalan (tabel di bagian 2 -- tinggal tambah 1 baris per kata)
 *   3. Singkatan Bahasa Indonesia
 *
 * ── Cara menambah kosakata ───────────────────────────────────────────────────
 * Cukup tambah pasangan ['tulisan asli', 'cara baca'] di salah satu tabel:
 *   - TERMS_CI         : kata umum / nama produk (huruf besar-kecil tidak ngaruh,
 *                        bentuk jamak "s" otomatis ikut, mis. "bug" juga kena "bugs")
 *   - TERMS_CS         : kata yang bentrok dengan kata biasa kalau huruf kecil
 *                        (mis. "React", "Java", "Ruby") -> hanya cocok persis
 *   - ACRONYMS_EN / _ID: singkatan yang dieja per huruf otomatis. EN pakai nama
 *                        huruf Inggris ("API" -> "Ei-Pi-Ai"), ID pakai huruf
 *                        Indonesia ("KTP" -> "Ka-Te-Pe")
 * Spasi, tanda hubung, dan titik di kunci otomatis toleran: kunci 'Node.js'
 * juga cocok dengan "NodeJS", "Node js", "node-js"; 'Front-end' cocok dengan
 * "Frontend" dan "Front end".
 */

// ═══════════════════════════════════════════════════════════════════════════
// 1. ANGKA -> KATA
// ═══════════════════════════════════════════════════════════════════════════

const SATUAN = [
  'nol', 'satu', 'dua', 'tiga', 'empat', 'lima',
  'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas',
];
const SKALA = ['', 'ribu', 'juta', 'miliar', 'triliun'];

/** "0812" -> "nol delapan satu dua" */
function bacaPerDigit(digits: string): string {
  return digits
    .split('')
    .map((d) => (/\d/.test(d) ? SATUAN[Number(d)] : d))
    .join(' ');
}

function bacaTigaDigit(n: number): string {
  const ratus = Math.floor(n / 100);
  const sisa = n % 100;
  const out: string[] = [];
  if (ratus === 1) out.push('seratus');
  else if (ratus > 1) out.push(`${SATUAN[ratus]} ratus`);
  if (sisa > 0) {
    if (sisa < 12) out.push(SATUAN[sisa]);
    else if (sisa < 20) out.push(`${SATUAN[sisa - 10]} belas`);
    else {
      out.push(`${SATUAN[Math.floor(sisa / 10)]} puluh`);
      if (sisa % 10) out.push(SATUAN[sisa % 10]);
    }
  }
  return out.join(' ');
}

/** Bilangan bulat (string digit) -> kata. "1500000" -> "satu juta lima ratus ribu" */
export function angkaKeKata(digits: string): string {
  const clean = digits.replace(/^0+(?=\d)/, '');
  if (!/^\d+$/.test(clean)) return digits;
  if (clean === '0') return SATUAN[0];
  // Lebih dari triliunan -> baca per digit saja (kemungkinan besar bukan nominal)
  if (clean.length > SKALA.length * 3) return bacaPerDigit(clean);

  const groups: number[] = [];
  for (let end = clean.length; end > 0; end -= 3) {
    groups.unshift(parseInt(clean.slice(Math.max(0, end - 3), end), 10));
  }
  const words: string[] = [];
  groups.forEach((g, idx) => {
    if (g === 0) return;
    const skala = groups.length - 1 - idx;
    if (skala === 1 && g === 1) words.push('seribu');
    else words.push(skala ? `${bacaTigaDigit(g)} ${SKALA[skala]}` : bacaTigaDigit(g));
  });
  return words.join(' ');
}

/**
 * Urai token angka gaya Indonesia:
 *   "1.500.000" -> ribuan (titik = pemisah ribuan)
 *   "1,5" / "1.5" -> desimal
 *   "800" -> bulat
 */
function uraikanAngka(tok: string): { bulat: string; pecahan: string } {
  if (/^[1-9]\d{0,2}(?:\.\d{3})+(?:,\d+)?$/.test(tok)) {
    const [bulat, pecahan = ''] = tok.split(',');
    return { bulat: bulat.replace(/\./g, ''), pecahan };
  }
  const m = tok.match(/^(\d+)[.,](\d+)$/);
  if (m) return { bulat: m[1], pecahan: m[2] };
  return { bulat: tok, pecahan: '' };
}

/**
 * Token angka -> kata. `berSatuan` = angka diikuti juta/ribu/miliar, sehingga
 * ",5" dibaca "setengah" ("1,5 juta" -> "satu setengah juta").
 */
function bacaAngka(tok: string, berSatuan = false): string {
  const { bulat, pecahan } = uraikanAngka(tok);
  const frac = /^0*$/.test(pecahan) ? '' : pecahan; // ",00" diabaikan
  const kataBulat = angkaKeKata(bulat);
  if (!frac) return kataBulat;
  if (berSatuan && /^50*$/.test(frac)) {
    return bulat.replace(/^0+/, '') === '' ? 'setengah' : `${kataBulat} setengah`;
  }
  return `${kataBulat} koma ${bacaPerDigit(frac)}`;
}

const UNIT_MAP: Record<string, string> = {
  jt: 'juta', juta: 'juta',
  rb: 'ribu', ribu: 'ribu', k: 'ribu',
  miliar: 'miliar', milyar: 'miliar', triliun: 'triliun',
};
const namaSatuan = (u?: string): string => (u ? UNIT_MAP[u.trim().toLowerCase()] ?? '' : '');

/** "1.500", "jt" -> "satu setengah juta"  (tanpa kata "rupiah") */
function nominalKeKata(num: string, unitMentah?: string, warisan = ''): string {
  const unit = namaSatuan(unitMentah) || warisan;
  const kata = bacaAngka(num, !!unit);
  return unit ? `${kata} ${unit}` : kata;
}

const kurangDariSeribu = (num: string): boolean => Number(uraikanAngka(num).bulat) < 1000;

// ── Pola regex angka ─────────────────────────────────────────────────────────
// NUM: 1 | 1.500 | 1.500.000 | 1,5 | 1.5 | 2.500.000,50
const NUM = String.raw`\d+(?:\.\d{3})*(?:[.,]\d+)?`;
const UNIT_WORD = String.raw`(?:miliar|milyar|triliun|juta|jt|ribu|rb)`;
const UNIT_OPT = String.raw`(\s*${UNIT_WORD}\b|k\b)?`; // "k" hanya kalau menempel (Rp5k)
const UNIT_REQ = String.raw`(\s*${UNIT_WORD}\b)`;
const RP = String.raw`\b(?:Rp\.?|IDR)\s*`;
const RP_OPT = String.raw`(?:(?:Rp\.?|IDR)\s*)?`;
const DASH = String.raw`\s*(?:[-–—]|s\/d|sd|sampai|hingga)\s*`;

// Rp1.500.000 - Rp5.000.000 | Rp800rb - 1,5jt | Rp1,5 - 5 juta
const RE_UANG_RENTANG = new RegExp(
  String.raw`${RP}(${NUM})${UNIT_OPT}${DASH}${RP_OPT}(${NUM})${UNIT_OPT}(?:,-)?`,
  'gi',
);
// Rp1.500.000 | Rp 1,5 jt | Rp800rb | Rp50.000,-
const RE_UANG = new RegExp(String.raw`${RP}(${NUM})${UNIT_OPT}(?:,-)?`, 'gi');
// 800rb - 1,5jt (tanpa Rp, tapi satuan kedua wajib ada)
const RE_SATUAN_RENTANG = new RegExp(
  String.raw`(?<![\d.,])(${NUM})${UNIT_OPT}${DASH}(${NUM})${UNIT_REQ}`,
  'gi',
);
// 10 juta | 800rb (tanpa Rp)
const RE_SATUAN = new RegExp(String.raw`(?<![\d.,])(${NUM})${UNIT_REQ}`, 'gi');
// 500k | 50k  (minimal 2 digit supaya "4K" resolusi video tidak ikut)
const RE_K = /(?<![\d.,])(\d{2,3})k\b/gi;
// $5 | $1,000 | $2.5k
const RE_USD =
  /\$\s*(\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?)(?:\s*(k|jt|juta|ribu|rb|miliar|million|billion)\b)?/gi;

// 0812-3456-7890 | 081234567890 | +62 812 3456 7890 | +62-812-3456-7890 | 6281234567890
const RE_TELEPON = /(?<![\d.,])(?:\+62[-\s]?|62|0)8\d{1,3}[-\s]?\d{3,4}[-\s]?\d{2,5}(?!\d)/g;
// Telepon tetap: (021) 5551234 | 021-5551234 | 0274 123456  (wajib ada tanda kurung / pemisah)
const RE_TELEPON_TETAP = /(?<![\d.,])(?:\(0\d{2,3}\)[-\s]?|0\d{2,3}[-\s])\d{6,8}(?!\d)/g;

const RE_JAM_RENTANG =
  /(?<![\d.,:])(\d{1,2})[.:](\d{2})\s*[-–—]\s*(\d{1,2})[.:](\d{2})\s*(WIB|WITA|WIT)\b/g;
const RE_JAM_ZONA = /(?<![\d.,:])(\d{1,2})[.:](\d{2})\s*(WIB|WITA|WIT)\b/g;
const RE_JAM_PUKUL = /\b(pukul|jam)\s*(\d{1,2})[.:](\d{2})\b/gi;

const RE_PERSEN_RENTANG =
  /(?<![\d.,])(\d+(?:[.,]\d+)?)\s*[-–—]\s*(\d+(?:[.,]\d+)?)\s*%/g;
const RE_PERSEN = /(?<![\d.,])(\d+(?:[.,]\d+)?)\s*%/g;
const RE_SUHU = /(?<![\d.,])(\d+(?:[.,]\d+)?)\s*°\s*([CF])\b/g;

const SATUAN_TEKNIS: Record<string, string> = {
  gb: 'gigabait', mb: 'megabait', kb: 'kilobait', tb: 'terabait',
  mbps: 'megabit per detik', kbps: 'kilobit per detik',
  ghz: 'gigahertz', mhz: 'megahertz',
  px: 'piksel', ms: 'milidetik', fps: 'frame per detik',
  kg: 'kilogram', km: 'kilometer', cm: 'sentimeter', mm: 'milimeter',
};
const RE_SATUAN_TEKNIS = new RegExp(
  String.raw`(?<![\d.,])(${NUM})\s?(${Object.keys(SATUAN_TEKNIS).join('|')})\b`,
  'gi',
);

const RE_SATUAN_TEKNIS_RENTANG = new RegExp(
  String.raw`(?<![\d.,])(${NUM})\s*[-–—]\s*(${NUM})\s?(${Object.keys(SATUAN_TEKNIS).join('|')})\b`,
  'gi',
);

const RE_RENTANG_WAKTU =
  /(?<![\d.,])(\d+)\s*[-–—]\s*(\d+)\s*(hari|minggu|bulan|tahun|orang|item|halaman|jam|menit|detik|kali|proyek|project|klien|fitur|sprint|kata|karakter|baris|pengguna|users?|kelas|sesi)\b/gi;
const RE_RENTANG_TAHUN = /\b((?:19|20)\d{2})\s*[-–—]\s*((?:19|20)\d{2})\b/g;
const RE_LEBIH_DARI =
  /(?<![\d.,])(\d+)\+\s*(tahun|bulan|hari|proyek|project|klien|pengalaman)\b/gi;

const RE_RIBUAN = /(?<![\d.,])[1-9]\d{0,2}(?:\.\d{3})+(?:,\d+)?(?!\d|\.\d)/g;
// Ribuan gaya Inggris satu kelompok: "10,000" / "25,500" / "1,000". Sengaja TIDAK
// menangkap "1,500" / "2,750" (satu digit di depan) karena itu lebih mungkin desimal Indonesia.
const RE_RIBUAN_INGGRIS = /(?<![\d.,])(?:\d,000|\d{2,3},\d{3})(?![\d,]|\.\d)/g;
// "0.5" / "0.125" -> "nol koma ..." (titik desimal gaya Inggris, hanya yang diawali 0)
const RE_NOL_TITIK = /(?<![\d.,])0\.(\d{1,3})(?!\d|[.,]\d)/g;
const RE_DESIMAL_KOMA = /(?<![\d.,])(\d+),(\d{1,3})(?!\d|,\d)/g;

// ── Tanggal, pecahan, skor "x dari y", "3x", desimal bertitik ────────────────
const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
// 17/08/2025 | 17-08-2025 | 17.08.2025  (hari/bulan/tahun; tahun wajib 4 digit)
const RE_TANGGAL =
  /(?<![\d.,/-])(0?[1-9]|[12]\d|3[01])[/.-](0?[1-9]|1[0-2])[/.-]((?:19|20)\d{2})(?![\d/-]|[.,]\d)/g;
// 2025-08-17 (ISO)
const RE_TANGGAL_ISO =
  /(?<![\d.,/-])((?:19|20)\d{2})-(0?[1-9]|1[0-2])-(0?[1-9]|[12]\d|3[01])(?![\d/-]|[.,]\d)/g;
// "skor 4/5" | "halaman 3/10" | "rating: 4,8/5" -> "... dari ..."
const RE_DARI_KONTEKS =
  /\b(skor|rating|nilai|peringkat|bintang|halaman|hlm\.?|slide|langkah|step|tahap|bagian|babak|level|bab)(\s*:?\s*)(\d+(?:[.,]\d+)?)\s?\/\s?(\d{1,3})(?![\w/]|[.,]\d)/gi;
// "4,8/5" | "9.5/10" (desimal di depan garis miring = hampir pasti skor)
const RE_DARI_DESIMAL = /(?<![\w.,/])(\d+[.,]\d{1,2})\/(5|10|100)(?![\w/]|[.,]\d)/g;
// 1/2 | 3/4 | 2/3  (satu-dua digit; penyebut 2..10)
const RE_PECAHAN = /(?<![\w.,/])(\d{1,2})\/(\d{1,2})(?![\w/]|[.,]\d)/g;
// "3x lipat" | "10x" | "1,5x"  (tidak kena "3x3", "2x4", "0x1F", "3xl")
const RE_KALI_SUFIKS = /(?<![\w.,])(\d+(?:[.,]\d+)?)\s?[xX×](?!\w)/g;
// "3 x 4" | "1920x1080"
const RE_KALI_ANTAR_ANGKA = /(?<![\w.,])(\d+(?:[.,]\d+)?)\s?[xX×]\s?(\d+(?:[.,]\d+)?)(?!\w)/g;
// "1.5 detik" | "2.75 jam" -> desimal gaya Inggris hanya kalau diikuti kata ukuran,
// supaya TTS tidak membacanya "seribu lima ratus" / "lima belas".
const KATA_UKURAN =
  'detik|menit|jam|hari|minggu|bulan|tahun|kali|liter|meter|orang|poin|bintang|lantai|unit|item|halaman|sesi|kata|baris|pengguna|users?|klien|proyek|project|fitur|derajat';
const RE_DESIMAL_TITIK_SATUAN = new RegExp(
  String.raw`(?<![\w.,])(\d{1,3})\.(\d{1,2})(?![\d.]|\.\d)(?=\s?(?:${KATA_UKURAN})\b)`,
  'gi',
);
// "IPK 3.75" | "skor 4.5" | "sekitar 2.5"
const RE_DESIMAL_TITIK_KONTEKS =
  /(?<=\b(?:skor|rating|nilai|ipk|gpa|sekitar|rata-rata|mencapai|hampir|sebesar|senilai)\s+)(\d{1,2})\.(\d{1,2})(?![\d.]|\.\d)/gi;
// 2.1.0 | 1.0.3 (tiga segmen atau lebih; ribuan sudah diproses lebih dulu)
const RE_TITIK_BERUNTUN = /(?<![\w.,])\d+(?:\.\d+){2,}(?![\w]|\.\d)/g;

function jamKeKata(h: string, m: string): string | null {
  if (Number(h) > 23 || Number(m) > 59) return null;
  const jam = angkaKeKata(String(Number(h)));
  if (m === '00') return jam;
  const menit = m[0] === '0' ? `nol ${angkaKeKata(m[1])}` : angkaKeKata(String(Number(m)));
  return `${jam} ${menit}`;
}

function tanggalKeKata(d: string, m: string, y: string): string | null {
  const hari = Number(d);
  const bulan = Number(m);
  const tahun = Number(y);
  const cek = new Date(Date.UTC(tahun, bulan - 1, hari));
  if (cek.getUTCMonth() !== bulan - 1 || cek.getUTCDate() !== hari) return null; // mis. 31/02
  return `${angkaKeKata(String(hari))} ${BULAN[bulan - 1]} ${angkaKeKata(String(tahun))}`;
}

/** 1/2 -> setengah, 3/4 -> tiga perempat, 1/3 -> sepertiga, 10/10 -> sepuluh dari sepuluh. */
function pecahanKeKata(n: number, m: number): string | null {
  if (m < 2 || m > 10) return null;
  if (n === m) return `${angkaKeKata(String(n))} dari ${angkaKeKata(String(m))}`; // "10/10" = skor
  if (n < 1 || n > m) return null;
  if (n === 1 && m === 2) return 'setengah';
  const penyebut = `per${angkaKeKata(String(m))}`; // pertiga, perempat, perlima, ...
  return n === 1 ? `se${penyebut}` : `${angkaKeKata(String(n))} ${penyebut}`;
}

/** Telepon -> per digit, dikelompokkan dengan koma supaya ada jeda napas alami. */
function teleponKeKata(m: string): string {
  const plus = m.startsWith('+') ? 'plus ' : '';
  const raw = m.replace(/^\+/, '').replace(/[()]/g, '');
  let groups = raw.split(/[-\s]+/).filter(Boolean);
  if (groups.length === 1) {
    // Tanpa pemisah: kelompokkan per empat digit, sisa 1-2 digit digabung ke kelompok terakhir.
    const digits = groups[0];
    groups = digits.match(/\d{1,4}/g) ?? [digits];
    if (groups.length > 1 && groups[groups.length - 1].length < 3) {
      const last = groups.pop() as string;
      groups[groups.length - 1] += last;
    }
  }
  return `${plus}${groups.map(bacaPerDigit).join(', ')}`;
}

function konversiAngka(input: string): string {
  let s = input;

  // Ribuan gaya Inggris "1,500,000" / "1,500,000.50" -> gaya Indonesia "1.500.000" / "1.500.000,50".
  // Minimal 2 kelompok koma supaya tidak salah kena desimal Indonesia ("1,500" tetap ambigu, dibiarkan).
  // Yang diawali "$" dilewati karena RE_USD sudah menanganinya sendiri.
  s = s.replace(/(?<![\d.,])(?<!\$\s*)\d{1,3}(?:,\d{3}){2,}(?:\.\d+)?(?![\d,])/g, (m) => {
    const [bulat, pecahan] = m.split('.');
    return bulat.replace(/,/g, '.') + (pecahan ? `,${pecahan}` : '');
  });

  // Nomor telepon -> baca per digit (harus sebelum pola angka lain)
  s = s.replace(RE_TELEPON, (m) => ` ${teleponKeKata(m)} `);
  s = s.replace(RE_TELEPON_TETAP, (m) => ` ${teleponKeKata(m)} `);

  // Tanggal: 17/08/2025 -> "tujuh belas Agustus dua ribu dua puluh lima" (tanggal tidak valid dibiarkan)
  s = s.replace(RE_TANGGAL, (m, d: string, mo: string, y: string) => tanggalKeKata(d, mo, y) ?? m);
  s = s.replace(RE_TANGGAL_ISO, (m, y: string, mo: string, d: string) => tanggalKeKata(d, mo, y) ?? m);

  // Skor / halaman: "skor 4/5", "4,8/5" -> "... dari lima" (sebelum pecahan & desimal)
  s = s.replace(RE_DARI_KONTEKS, (_m, kata: string, sp: string, n: string, tot: string) =>
    `${kata}${sp}${bacaAngka(n)} dari ${angkaKeKata(tot)}`,
  );
  s = s.replace(RE_DARI_DESIMAL, (_m, n: string, tot: string) => `${bacaAngka(n)} dari ${angkaKeKata(tot)}`);

  // Pecahan: 1/2, 3/4, 2/3
  s = s.replace(RE_PECAHAN, (m, a: string, b: string) => pecahanKeKata(Number(a), Number(b)) ?? m);

  // Perkalian: "3x lipat" -> "tiga kali lipat"; "3 x 4" -> "tiga kali empat"
  s = s.replace(RE_KALI_ANTAR_ANGKA, (_m, a: string, b: string) => `${bacaAngka(a)} kali ${bacaAngka(b)}`);
  s = s.replace(RE_KALI_SUFIKS, (_m, a: string) => `${bacaAngka(a)} kali`);

  // Jam: 09.00-17.00 WIB | 17.30 WIB | pukul 08.15
  s = s.replace(RE_JAM_RENTANG, (m, h1, m1, h2, m2, zona) => {
    const a = jamKeKata(h1, m1);
    const b = jamKeKata(h2, m2);
    return a && b ? `${a} sampai ${b} ${zona}` : m;
  });
  s = s.replace(RE_JAM_ZONA, (m, h, mm, zona) => {
    const a = jamKeKata(h, mm);
    return a ? `${a} ${zona}` : m;
  });
  s = s.replace(RE_JAM_PUKUL, (m, kata, h, mm) => {
    const a = jamKeKata(h, mm);
    return a ? `${kata} ${a}` : m;
  });

  // Uang rupiah -- rentang dulu, baru tunggal
  s = s.replace(RE_UANG_RENTANG, (m: string, n1: string, u1: string | undefined, n2: string, u2?: string) => {
    // "Rp500.000 - 3 hari" BUKAN rentang: angka kedua harus punya satuan, "Rp", atau >= 1.000.
    // Kalau bukan, biarkan apa adanya -- RE_UANG di bawah yang mengonversi nominal pertama.
    const adaRp2 = /(?:[-–—]|s\/d|sd|sampai|hingga)\s*(?:Rp\.?|IDR)/i.test(m);
    if (!u2 && !adaRp2 && kurangDariSeribu(n2)) return m;
    const unit2 = namaSatuan(u2);
    // "Rp1,5 - 5 juta": angka kecil tanpa satuan mewarisi satuan angka kedua
    const warisan = !namaSatuan(u1) && unit2 && kurangDariSeribu(n1) ? unit2 : '';
    return ` ${nominalKeKata(n1, u1, warisan)} sampai ${nominalKeKata(n2, u2)} rupiah `;
  });
  s = s.replace(RE_UANG, (_m, n: string, u?: string) => ` ${nominalKeKata(n, u)} rupiah `);

  // Dolar
  s = s.replace(RE_USD, (_m, n: string, u?: string) => {
    const [bulat, pecahan = ''] = n.replace(/,/g, '').split('.');
    const kata = /^0*$/.test(pecahan)
      ? angkaKeKata(bulat)
      : `${angkaKeKata(bulat)} koma ${bacaPerDigit(pecahan)}`;
    const satuan = u ? ({ million: 'juta', billion: 'miliar' } as Record<string, string>)[u.toLowerCase()] ?? namaSatuan(u) : '';
    return ` ${kata}${satuan ? ` ${satuan}` : ''} dolar `;
  });

  // Angka + satuan tanpa "Rp": 800rb - 1,5jt | 10 juta | 500k
  s = s.replace(RE_SATUAN_RENTANG, (_m, n1: string, u1: string | undefined, n2: string, u2: string) => {
    const unit2 = namaSatuan(u2);
    const warisan = !namaSatuan(u1) && kurangDariSeribu(n1) ? unit2 : '';
    return ` ${nominalKeKata(n1, u1, warisan)} sampai ${nominalKeKata(n2, u2)} `;
  });
  s = s.replace(RE_SATUAN, (_m, n: string, u: string) => ` ${nominalKeKata(n, u)} `);
  s = s.replace(RE_K, (_m, n: string) => ` ${angkaKeKata(n)} ribu `);

  // Persen & suhu
  s = s.replace(RE_PERSEN_RENTANG, (_m, a: string, b: string) => ` ${bacaAngka(a)} sampai ${bacaAngka(b)} persen `);
  s = s.replace(RE_PERSEN, (_m, n: string) => ` ${bacaAngka(n)} persen `);
  s = s.replace(RE_SUHU, (_m, n: string, u: string) => ` ${bacaAngka(n)} derajat ${u === 'C' ? 'Celsius' : 'Fahrenheit'} `);

  // Satuan teknis: 16 GB, 200ms, 1.5 MB, 5-10 GB
  s = s.replace(RE_SATUAN_TEKNIS_RENTANG, (_m, a: string, b: string, u: string) => ` ${bacaAngka(a)} sampai ${bacaAngka(b)} ${SATUAN_TEKNIS[u.toLowerCase()]} `);
  s = s.replace(RE_SATUAN_TEKNIS, (_m, n: string, u: string) => ` ${bacaAngka(n)} ${SATUAN_TEKNIS[u.toLowerCase()]} `);

  // "/jam", "/bulan" -> "per jam", "per bulan"
  s = s.replace(
    // Kiri harus angka/nominal/kata satuan, supaya "admin/user" TIDAK jadi "admin per user".
    /(?<=(?:\d|rupiah|ribu|juta|miliar|triliun|persen|orang|pcs|unit|item|users?|proyek|project|sesi|halaman|kata|kali|hari|jam|bulan|tahun|minggu|menit|detik)\s*)\s*\/\s*(?=(?:jam|hari|bulan|tahun|minggu|orang|menit|detik|pcs|unit|item|halaman|kata|proyek|project|sesi|user|bln)\b)/gi,
    ' per ',
  );

  // Rentang umum
  s = s.replace(RE_RENTANG_WAKTU, (_m, a: string, b: string, kata: string) => ` ${angkaKeKata(a)} sampai ${angkaKeKata(b)} ${kata} `);
  s = s.replace(RE_RENTANG_TAHUN, '$1 sampai $2');
  s = s.replace(RE_LEBIH_DARI, (_m, n: string, kata: string) => ` lebih dari ${angkaKeKata(n)} ${kata} `);

  // Desimal gaya Inggris yang jelas konteksnya: "1.5 detik", "IPK 3.75"
  s = s.replace(RE_DESIMAL_TITIK_SATUAN, (_m, a: string, b: string) => `${angkaKeKata(a)} koma ${bacaPerDigit(b)}`);
  s = s.replace(RE_DESIMAL_TITIK_KONTEKS, (_m, a: string, b: string) => `${angkaKeKata(a)} koma ${bacaPerDigit(b)}`);

  // Sisa: 1.500 orang -> "seribu lima ratus orang" ; 3,14 -> "tiga koma satu empat"
  s = s.replace(RE_RIBUAN_INGGRIS, (m) => bacaAngka(m.replace(',', '.')));
  s = s.replace(RE_NOL_TITIK, (_m, d: string) => `nol koma ${bacaPerDigit(d)}`);
  s = s.replace(RE_RIBUAN, (m) => bacaAngka(m));
  s = s.replace(RE_DESIMAL_KOMA, (_m, a: string, b: string) => `${angkaKeKata(a)} koma ${bacaPerDigit(b)}`);

  // Nomor bertitik yang bukan ribuan/IP: "2.1.0" -> "dua titik satu titik nol"
  s = s.replace(RE_TITIK_BERUNTUN, (m) =>
    m.split('.').map((seg) => angkaKeKata(String(Number(seg)))).join(' titik '),
  );

  return s;
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. KAMUS PELAFALAN
// ═══════════════════════════════════════════════════════════════════════════

type Term = readonly [tulisan: string, cara_baca: string];

/**
 * Kata umum & nama produk. Huruf besar-kecil tidak dibedakan; bentuk jamak "s"
 * otomatis ikut. Kunci yang lebih panjang selalu diprioritaskan.
 */
const TERMS_CI: readonly Term[] = [
  // ── Nama proyek & portofolio (khusus) ──
  ['B-Games', 'Bi-Geims'],
  ['Assets GMP', 'Aset Ge Em Pe'],
  ['Asset GMP', 'Aset Ge Em Pe'],
  ['PT GMP', 'Pe Te Ge Em Pe'],
  ['Portfolio', 'Portofolio'],

  // ── JavaScript / TypeScript & ekosistemnya ──
  ['React Native', 'Riek Neitif'],
  ['React.js', 'Riek J-S'],
  ['Next.js', 'Neks J-S'],
  ['Node.js', 'Noud J-S'],
  ['Vue.js', 'Vyu J-S'],
  ['Nuxt.js', 'Nakst J-S'],
  ['Nest.js', 'Nes J-S'],
  ['Express.js', 'Ekspres J-S'],
  ['Angular.js', 'Anggular J-S'],
  ['Solid.js', 'Solid J-S'],
  ['Three.js', 'Tri J-S'],
  ['D3.js', 'Di Tri J-S'],
  ['Chart.js', 'Cart J-S'],
  ['Socket.io', 'Soket I-O'],
  ['boardgame.io', 'Boardgame I-O'],
  ['SvelteKit', 'Svelt Kit'],
  ['Svelte', 'Svelt'],
  ['Angular', 'Anggular'],
  ['Gatsby', 'Getsbi'],
  ['jQuery', 'Jei Kuery'],
  ['JavaScript', 'Javaskrip'],
  ['TypeScript', 'Taipskrip'],
  ['Tailwind CSS', 'Teilwind C-S-S'],
  ['Tailwind', 'Teilwind'],
  ['Bootstrap', 'Butstrap'],
  ['Redux', 'Ridaks'],
  ['Framer Motion', 'Freimer Moushen'],
  ['Recharts', 'Ri Carts'],
  ['Lucide Icon', 'Lusid Aikon'],
  ['Lucide', 'Lusid Aikon'],
  ['Vitest', 'Vaitest'],
  ['Vite', 'Vait'],
  ['Webpack', 'Webpek'],
  ['Babel', 'Beibel'],
  ['ESLint', 'E-S Lint'],
  ['Prettier', 'Priti'],
  ['Cypress', 'Saipres'],
  ['Playwright', 'Pleirait'],
  ['Storybook', 'Storibuk'],
  ['Electron', 'Elektron'],
  ['Ionic', 'Aionik'],
  ['Capacitor', 'Kapasitor'],
  ['Expo', 'Ekspo'],
  ['WebSocket', 'Websoket'],
  ['WebRTC', 'Web R-T-C'],
  ['WebAssembly', 'Web Esembli'],

  // ── Bahasa & framework lain ──
  ['Python', 'Paiton'],
  ['Ruby on Rails', 'Rubi on Reils'],
  ['Django', 'Jango'],
  ['Flask', 'Flesk'],
  ['FastAPI', 'Fes A-P-I'],
  ['Spring Boot', 'Spring But'],
  ['Flutter', 'Fluter'],
  ['Regex', 'Redjeks'],
  ['YAML', 'Yamel'],
  ['TOML', 'Tomel'],
  ['HTML5', 'H-T-M-L lima'],
  ['CSS3', 'C-S-S tiga'],

  // ── Database & backend service ──
  ['PostgreSQL', 'Posgres Q-L'],
  ['Postgres', 'Posgres Q-L'],
  ['MySQL', 'Mai Eskuel'],
  ['MariaDB', 'Maria D-B'],
  ['MongoDB', 'Mongo D-B'],
  ['SQLite', 'Eskuel Lait'],
  ['NoSQL', 'No Eskuel'],
  ['DynamoDB', 'Dainamo D-B'],
  ['GraphQL', 'Graf Q-L'],
  ['Supabase', 'Superbeis'],
  ['Firebase', 'Fairbeis'],
  ['Firestore', 'Fairstor'],
  ['Upstash', 'Apstes'],
  ['PlanetScale', 'Planet Skeil'],
  ['Elasticsearch', 'Elastik Serc'],
  ['RabbitMQ', 'Rabit M-Q'],
  ['Mongoose', 'Mongus'],
  ['Sequelize', 'Sikuelaiz'],
  ['Drizzle', 'Drizel'],
  ['TypeORM', 'Taip O-R-M'],
  ['REST API', 'Rest A-P-I'],
  ['RESTful API', 'Rest A-P-I'],
  ['API Key', 'A-P-I Ki'],
  ['Nginx', 'Enjin-eks'],
  ['Apache', 'Apaci'],

  // ── DevOps, cloud, tools ──
  ['GitHub Actions', 'Git-hab Ekshens'],
  ['GitHub', 'Git-hab'],
  ['GitLab', 'Git-lab'],
  ['Bitbucket', 'Bit Baket'],
  ['Docker', 'Doker'],
  ['Kubernetes', 'Kubernetis'],
  ['Terraform', 'Terafom'],
  ['Ansible', 'Ansibel'],
  ['Vercel', 'Versel'],
  ['Netlify', 'Netlifai'],
  ['Cloudflare', 'Klaudfler'],
  ['Azure', 'Ejer'],
  ['Linux', 'Linaks'],
  ['Windows', 'Windous'],
  ['macOS', 'Mak O-S'],
  ['iOS', 'Ai O-S'],
  ['Postman', 'Posmen'],
  ['Swagger', 'Swager'],
  ['Visual Studio Code', 'Visual Studio Kod'],
  ['VS Code', 'V-S Kod'],
  ['IntelliJ', 'Intelijei'],
  ['Xcode', 'Eks Kod'],
  ['Stack Overflow', 'Stek Overflou'],
  ['Notion', 'Noushen'],
  ['Slack', 'Slek'],
  ['Stripe', 'Straip'],
  ['YouTube', 'Yutub'],
  ['Wi-Fi', 'Waifai'],

  // ── AI ──
  ['ChatGPT', 'Chet G-P-T'],
  ['OpenAI', 'Open A-I'],
  ['Anthropic', 'Antropik'],
  ['Copilot', 'Kopailot'],
  ['DeepSeek', 'Dip Sik'],
  ['Llama', 'Lama'],
  ['Midjourney', 'Midjerni'],
  ['Hugging Face', 'Haging Feis'],
  ['LangChain', 'Leng Chein'],
  ['Machine Learning', 'Mesin Lerning'],
  ['Deep Learning', 'Dip Lerning'],
  ['Neural Network', 'Nural Netwerk'],
  ['Fine-tuning', 'Fain Tuning'],
  ['Embedding', 'Embeding'],
  ['Vector', 'Vektor'],
  ['Agent', 'Eijen'],
  ['Hallucination', 'Halusinasi'],
  ['Chatbot', 'Chetbot'],
  ['Dataset', 'Deiteset'],

  // ── Istilah pengembangan aplikasi ──
  ['Developer', 'Divelopor'],
  ['Development', 'Divelopmen'],
  ['Software', 'Softwer'],
  ['Hardware', 'Hardwer'],
  ['Engineer', 'Enjinir'],
  ['Engineering', 'Enjiniring'],
  ['Coding', 'Koding'],
  ['Source Code', 'Sors Kod'],
  ['Open Source', 'Open Sors'],
  ['Tech Stack', 'Tekstek'],
  ['Full-stack', 'Fulstek'],
  ['Front-end', 'Front-en'],
  ['Back-end', 'Bek-en'],
  ['Web App', 'Web-ep'],
  ['Mobile App', 'Mobail-ep'],
  ['App', 'Ep'],
  ['Website', 'Websait'],
  ['Landing Page', 'Lending Peij'],
  ['Live Demo', 'Laif Demo'],
  ['Real-time', 'Riltaym'],
  ['Framework', 'Freimwork'],
  ['Library', 'Laibrari'],
  ['Libraries', 'Laibrari'],
  ['Package', 'Pekej'],
  ['Module', 'Modul'],
  ['Component', 'Komponen'],
  ['Plugin', 'Plagin'],
  ['Hook', 'Huk'],
  ['Script', 'Skrip'],
  ['Scripting', 'Skripting'],
  ['Syntax', 'Sintaks'],
  ['Function', 'Fungsi'],
  ['Class', 'Kelas'],
  ['Method', 'Metode'],
  ['Interface', 'Interfes'],
  ['Variable', 'Variabel'],
  ['Array', 'Arei'],
  ['Boolean', 'Bulean'],
  ['Enum', 'Inum'],
  ['Loop', 'Lup'],
  ['Null', 'Nal'],
  ['Undefined', 'Andifaind'],
  ['Async', 'Eisink'],
  ['Await', 'Aweit'],
  ['Callback', 'Kolbek'],
  ['Promise', 'Promis'],
  ['Webhook', 'Webhuk'],
  ['Thread', 'Tred'],
  ['Stream', 'Strim'],
  ['Streaming', 'Striming'],
  ['Buffer', 'Bafer'],
  ['Queue', 'Kyu'],
  ['Cron', 'Kron'],
  ['Runtime', 'Rantaim'],
  ['Compiler', 'Kompailer'],
  ['Compile', 'Kompail'],
  ['Shell', 'Shel'],
  ['Bash', 'Bes'],
  ['Command', 'Komand'],
  ['Localhost', 'Lokal Host'],

  // ── Git & alur kerja ──
  ['Pull Request', 'Pul Rikuest'],
  ['Commit', 'Komit'],
  ['Merge', 'Merj'],
  ['Branch', 'Brenc'],
  ['Repository', 'Repositori'],
  ['Repo', 'Ripo'],
  ['Clone', 'Klon'],
  ['Push', 'Pus'],
  ['Build', 'Bild'],
  ['Staging', 'Steijing'],
  ['Production', 'Produksi'],
  ['Refactoring', 'Rifaktoring'],
  ['Refactor', 'Rifaktor'],
  ['Unit Test', 'Yunit Tes'],
  ['Deployment', 'Diployment'],
  ['Deploy', 'Diploy'],
  ['Debugging', 'Dibaging'],
  ['Debug', 'Dibag'],
  ['Bug', 'Bag'],
  ['Release', 'Rilis'],
  ['Launch', 'Lonc'],
  ['Feature', 'Ficer'],
  ['Update', 'Apdet'],
  ['Upgrade', 'Apgreid'],
  ['Upload', 'Aplod'],
  ['Download', 'Daunlod'],
  ['Install', 'Instal'],
  ['Setup', 'Setap'],
  ['Setting', 'Seting'],
  ['Config', 'Konfig'],
  ['Configuration', 'Konfigurasi'],
  ['Workflow', 'Werkflo'],
  ['Pipeline', 'Paiplain'],
  ['Automation', 'Otomasi'],
  ['Scraping', 'Skreiping'],
  ['Crawler', 'Kroler'],

  // ── Web, server, data ──
  ['Client', 'Klaien'],
  ['Request', 'Rikuest'],
  ['Response', 'Respons'],
  ['Endpoint', 'Endpoin'],
  ['Query', 'Kueri'],
  ['Middleware', 'Midelwer'],
  ['Router', 'Rauter'],
  ['Session', 'Sesi'],
  ['Cookie', 'Kuki'],
  ['Header', 'Heder'],
  ['Timeout', 'Taimaut'],
  ['Latency', 'Leitensi'],
  ['Bandwidth', 'Bendwid'],
  ['Rate Limit', 'Reit Limit'],
  ['Serverless', 'Serverles'],
  ['Container', 'Konteiner'],
  ['Cloud', 'Klaud'],
  ['Database', 'Deitabeis'],
  ['Schema', 'Skema'],
  ['Migration', 'Migrasi'],
  ['Backup', 'Bekap'],
  ['Restore', 'Ristor'],
  ['Caching', 'Keshing'],
  ['Cache', 'Kesh'],
  ['Logging', 'Loging'],
  ['Logout', 'Logaut'],
  ['Sign in', 'Sain in'],
  ['Sign up', 'Sain ap'],
  ['Username', 'Yusernem'],
  ['Password', 'Paswod'],
  ['User', 'Yuser'],
  ['Email', 'Imel'],
  ['Online', 'Onlain'],
  ['Offline', 'Oflain'],
  ['Browser', 'Brauser'],
  ['Template', 'Templet'],
  ['Layout', 'Leiaut'],
  ['Notification', 'Notifikasi'],
  ['Push Notification', 'Pus Notifikasi'],
  ['Security', 'Sekuriti'],
  ['Authentication', 'Otentikasi'],
  ['Authorization', 'Otorisasi'],
  ['Encryption', 'Enkripsi'],
  ['Hashing', 'Heshing'],
  ['Analytics', 'Analitik'],
  ['Optimization', 'Optimisasi'],
  ['Optimize', 'Optimais'],
  ['Performance', 'Performans'],
  ['Scalable', 'Skeilabel'],
  ['Scalability', 'Skeilabiliti'],
  ['Maintenance', 'Meintenans'],
  ['Exception', 'Eksepsi'],
  ['Error', 'Eror'],
  ['Crash', 'Kres'],
  ['Loading', 'Loding'],

  // ── Desain & UI ──
  ['Dashboard', 'Deshboard'],
  ['Flashcard', 'Fleshkard'],
  ['Design', 'Desain'],
  ['Designer', 'Desainer'],
  ['Prototype', 'Prototaip'],
  ['Wireframe', 'Wairfreim'],
  ['Mockup', 'Mokap'],
  ['Responsive', 'Responsif'],
  ['Mobile', 'Mobail'],
  ['Desktop', 'Deskop'],
  ['Icon', 'Aikon'],
  ['Font', 'Fon'],
  ['Theme', 'Tim'],
  ['Dark Mode', 'Dark Mod'],
  ['Animation', 'Animasi'],
  ['Popup', 'Popap'],
  ['Dropdown', 'Dropdaun'],
  ['Slider', 'Slaider'],
  ['Scroll', 'Skrol'],
  ['Swipe', 'Swaip'],
  ['Click', 'Klik'],
  ['Feedback', 'Fidbek'],
  ['Review', 'Rivyu'],

  // ── Proses kerja & karier ──
  ['Freelancer', 'Frilanser'],
  ['Freelance', 'Frilans'],
  ['Remote', 'Rimot'],
  ['Startup', 'Startap'],
  ['Deadline', 'Dedlain'],
  ['Stakeholder', 'Steikholder'],
  ['Sprint', 'Sprin'],
  ['Agile', 'Ejail'],
  ['Scrum Master', 'Skram Master'],
  ['Scrum', 'Skram'],
  ['Backlog', 'Beklog'],
  ['Roadmap', 'Roudmep'],
  ['Milestone', 'Mailston'],
  ['Project Manager', 'Proyek Menejer'],
  ['Manager', 'Menejer'],
  ['Team', 'Tim'],
  ['Teamwork', 'Timwerk'],
  ['Meeting', 'Miting'],
  ['Training', 'Treining'],
  ['Bootcamp', 'Butkemp'],
  ['Interview', 'Interviu'],
  ['Skill', 'Skil'],

  // ── Bisnis, audit, dokumen ──
  ['SAP Business One', 'S-A-P Bisnis Wan'],
  ['Point of Sale', 'Point of Seils'],
  ['Pivot Table', 'Pivot Teibel'],
  ['VLOOKUP', 'V-Lookup'],
  ['XLOOKUP', 'X-Lookup'],
  ['Excel', 'Eksel'],
  ['PowerPoint', 'Power Point'],
  ['SaaS', 'Saas'],
  ['B2B', 'Bi tu Bi'],
];

/**
 * Kata yang HARUS cocok persis huruf besar-kecilnya, karena versi huruf
 * kecilnya kata biasa (react, java, ruby, node, ...) atau bentrok bahasa Indonesia.
 */
const TERMS_CS: readonly Term[] = [
  ['React', 'Riek'],
  ['Vue', 'Vyu'],
  ['Nuxt', 'Nakst'],
  ['Node', 'Noud'],
  ['Deno', 'Dino'],
  ['Java', 'Jafa'],
  ['Ruby', 'Rubi'],
  ['Rust', 'Rast'],
  ['Rails', 'Reils'],
  ['SQL', 'Eskuel'],
  ['JSON', 'Jeison'],
  ['CORS', 'Kors'],
  ['CRUD', 'Krad'],
  ['npm', 'N-P-M'],
  ['pnpm', 'P-N-P-M'],
  ['K8s', 'Kubernetis'],
  ['S3', 'S tiga'],
  ['EC2', 'E-C dua'],
  ['ES6', 'E-S enam'],
  ['B2C', 'Bi tu Si'],
  ['P2P', 'Pi tu Pi'],
  ['2D', 'dua dimensi'],
  ['3D', 'tiga dimensi'],
  ['Claude', 'Klod'],
  ['Gemini', 'Jeminai'],
  ['SOW', 'Scope of Work'],
  ['SoW', 'Scope of Work'],
  ['WA', 'WhatsApp'],
];

/**
 * Singkatan teknis/Inggris: dieja dengan nama huruf INGGRIS, konsisten semua
 * hurufnya. "AI" -> "Ei-Ai", "API" -> "Ei-Pi-Ai". Hanya cocok huruf besar.
 */
const ACRONYMS_EN: readonly string[] = [
  // web & pemrograman
  'API', 'HTML', 'CSS', 'SCSS', 'PHP', 'JS', 'TS', 'JSX', 'TSX', 'UI', 'UX', 'SEO',
  'SPA', 'SSR', 'SSG', 'PWA', 'DOM', 'SDK', 'IDE', 'CLI', 'GUI', 'URL', 'URI',
  'HTTP', 'HTTPS', 'DNS', 'SSL', 'TLS', 'SSH', 'FTP', 'TCP', 'UDP', 'VPN', 'CDN',
  'CSRF', 'XSS', 'ORM', 'MVC', 'MVP', 'MVVM', 'JWT', 'XML', 'CSV', 'PDF', 'RPC',
  'gRPC', 'tRPC', 'JVM', 'VM', 'DB', 'ID', 'OTP', 'QR', 'CMS', 'LMS', 'ETL', 'SLA',
  // perangkat
  'CPU', 'GPU', 'SSD', 'USB', 'LAN', 'OS', 'PC', 'TV', 'IoT',
  // AI
  'AI', 'ML', 'NLP', 'LLM', 'GPT', 'RAG', 'OCR', 'TTS', 'STT',
  // cloud
  'AWS', 'GCP',
  // bisnis & proses
  'KPI', 'ROI', 'CRM', 'ERP', 'HR', 'QC', 'QA', 'UAT', 'BRD', 'PRD',
  'SAP', 'POS', 'IT', 'CEO', 'CTO', 'PIC', 'WFH', 'WFO', 'FAQ', 'USD','CV'
];

/**
 * Singkatan Indonesia: dieja dengan nama huruf INDONESIA. "KTP" -> "Ka-Te-Pe".
 */
const ACRONYMS_ID: readonly string[] = [
  'KTP', 'NPWP', 'NIK', 'SIM', 'BPJS', 'UMKM', 'UMR', 'PPN', 'PPh', 'WIB', 'WIT',
  'HRD', 'SOP', 'PT', 'HP', 'SMS', 'PKL', 'SPT', 'DPT','RAB',
];

// ── Mesin pencocokan kamus ────────────────────────────────────────────────────

const SEP = String.raw`[\s.\-]?`;

/** Kunci -> pola regex. Spasi/titik/strip toleran & opsional; simbol lain di-escape. */
function keyToPattern(key: string): string {
  let out = '';
  for (const ch of key) {
    if (/[A-Za-z0-9]/.test(ch)) out += ch;
    else if (ch === ' ' || ch === '-' || ch === '.') out += SEP;
    else out += `\\${ch}`;
  }
  return out;
}

const normKey = (s: string, caseSensitive: boolean): string => {
  const t = s.replace(/[\s.\-]+/g, '');
  return caseSensitive ? t : t.toLowerCase();
};

function compileTerms(
  entries: readonly Term[],
  opts: { caseSensitive: boolean; plural: boolean },
): (input: string) => string {
  const map = new Map<string, string>();
  for (const [k, v] of entries) map.set(normKey(k, opts.caseSensitive), v);

  const body = [...entries]
    .sort((a, b) => b[0].length - a[0].length) // kunci terpanjang menang
    .map(([k]) => keyToPattern(k))
    .join('|');

  const re = new RegExp(
    `(?<![A-Za-z0-9_])(?:${body})${opts.plural ? 's?' : ''}(?![A-Za-z0-9_])`,
    opts.caseSensitive ? 'g' : 'gi',
  );

  return (input) =>
    input.replace(re, (match) => {
      const n = normKey(match, opts.caseSensitive);
      return (
        map.get(n) ??
        (opts.plural ? map.get(n.replace(/s$/i, '')) : undefined) ??
        match
      );
    });
}

/**
 * Nama huruf Inggris, ditulis fonetis supaya suara id-ID membacanya benar
 * dan SELALU konsisten (tidak campur "A" Indonesia + "I" Inggris).
 * Kalau ada huruf yang terdengar kurang pas, ubah di tabel ini.
 */
const HURUF_EN: Record<string, string> = {
  A: 'Ei', B: 'Bi', C: 'Si', D: 'Di', E: 'Ii', F: 'Ef', G: 'Ji', H: 'Eic', I: 'Ai',
  J: 'Jei', K: 'Kei', L: 'El', M: 'Em', N: 'En', O: 'Ou', P: 'Pi', Q: 'Kyu', R: 'Ar',
  S: 'Es', T: 'Ti', U: 'Yu', V: 'Vi', W: 'Dabelyu', X: 'Eks', Y: 'Wai', Z: 'Zi',
};

/** Nama huruf Indonesia. Vokal tunggal sengaja huruf kecil. */
const HURUF_ID: Record<string, string> = {
  A: 'a', B: 'Be', C: 'Ce', D: 'De', E: 'e', F: 'Ef', G: 'Ge', H: 'Ha', I: 'i',
  J: 'Je', K: 'Ka', L: 'El', M: 'Em', N: 'En', O: 'o', P: 'Pe', Q: 'Ki', R: 'Er',
  S: 'Es', T: 'Te', U: 'u', V: 'Fe', W: 'We', X: 'Eks', Y: 'Ye', Z: 'Zet',
};

const ejaHuruf = (a: string, tabel: Record<string, string>): string =>
  a.split('').map((c) => tabel[c.toUpperCase()] ?? c).join('-');

const spellEN = (a: string): string => ejaHuruf(a, HURUF_EN);
const spellID = (a: string): string => ejaHuruf(a, HURUF_ID);

/**
 * Ejaan huruf tunggal berhubung strip yang berasal dari kamus/aturan khusus
 * ("A-P-I Ki", "Open A-I", "Soket I-O", "V-S Kod", ...) diperlakukan sebagai
 * istilah teknis -> nama huruf Inggris. Untuk ejaan Indonesia di kamus, tulis
 * langsung nama hurufnya ("Pe Te Je Em Pe"), jangan "P-T J-M-P".
 * "I-komers" tidak kena karena bukan huruf tunggal.
 */
const RE_EJAAN_HURUF = /(?<![A-Za-z])[A-Z](?:-[A-Z])+(?![A-Za-z])/g;
const ejaanKamusKeInggris = (s: string): string =>
  s.replace(RE_EJAAN_HURUF, (m) => spellEN(m.replace(/-/g, '')));

// Urutan penting: CI dulu (memuat "Node.js", "React Native", dst.), baru CS
// (kata tunggal "Node", "React"), terakhir singkatan.
const applyTermsCI = compileTerms(TERMS_CI, { caseSensitive: false, plural: true });
const applyTermsCS = compileTerms(TERMS_CS, { caseSensitive: true, plural: false });
const applyAcronymsEN = compileTerms(
  ACRONYMS_EN.map((a): Term => [a, spellEN(a)]),
  { caseSensitive: true, plural: true },
);
const applyAcronymsID = compileTerms(
  ACRONYMS_ID.map((a): Term => [a, spellID(a)]),
  { caseSensitive: true, plural: true },
);

// ═══════════════════════════════════════════════════════════════════════════
// 3. ATURAN KHUSUS & SINGKATAN BAHASA INDONESIA
// ═══════════════════════════════════════════════════════════════════════════

/** Simbol / pola yang tidak bisa ditangani lewat kamus kata. */
const ATURAN_KHUSUS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bCI\s*\/\s*CD\b/g, 'C-I C-D'],
  [/\bASP\.NET\b/gi, 'A-S-P Dot Net'],
  [/(^|[^\w])\.NET\b/g, '$1Dot Net'],
  [/\bC\+\+/g, 'Si plus plus'],
  [/\bC#/g, 'Si sharp'],
  [/\bF#/g, 'Ef sharp'],
  [/\bUI\s*[\/-]\s*UX\b/gi, 'U-I U-X'],
  [/\bQ&A\b/g, 'Kiu en Ei'],
  [/\bR&D\b/g, 'Ar en Di'],
  [/\bI\/O\b/g, 'I-O'],
  [/\b24\s*\/\s*7\b/g, 'dua puluh empat jam, tujuh hari seminggu'],
  // "Q3 2026" -> "kuartal 3 2026" (hanya kalau diikuti tahun, supaya "Q&A"/"Q3" lain tak terganggu)
  [/\bQ([1-4])(?=\s+(?:19|20)\d{2}\b)/g, 'kuartal $1'],
  [/½/g, ' setengah '],
  [/¼/g, ' seperempat '],
  [/¾/g, ' tiga perempat '],
  [/⅓/g, ' sepertiga '],
  [/⅔/g, ' dua pertiga '],
  [/\bE-?commerce\b/gi, 'I-komers'],
  [/\bdan\/atau\b/gi, 'dan atau'],
];

const SINGKATAN_ID: ReadonlyArray<readonly [RegExp, string]> = [
  // titik setelahnya DIPERTAHANKAN supaya batas kalimat tidak hilang
  [/\b[Dd]ll\b/g, 'dan lain-lain'],
  [/\b[Dd]sb\b/g, 'dan sebagainya'],
  [/\b[Dd]st\b/g, 'dan seterusnya'],
  [/\b[Dd]kk\b/g, 'dan kawan-kawan'],
  // titik ikut dibuang karena bukan akhir kalimat
  [/\b[Cc]th\.\s*/g, 'contoh '],
  [/\b[Mm]is\.\s*/g, 'misalnya '],
  [/\b[Hh]lm\.\s*/g, 'halaman '],
  [/\b[Mm]aks\.\s*/g, 'maksimal '],
  [/\bJl\.\s*/g, 'Jalan '],
  [/\bNo\.\s*(?=\d)/g, 'nomor '],
  [/\b[Tt]elp?\.\s*/g, 'telepon '],
  [/\b[Cc]th\b/g, 'contoh'],
  [/\b[Tt]tg\b/g, 'tentang'],
  [/\b[Yy]g\b/g, 'yang'],
  [/\b[Dd]gn\b/g, 'dengan'],
  [/\b[Uu]tk\b/g, 'untuk'],
  [/\b[Ss]bg\b/g, 'sebagai'],
  [/\b[Bb]lm\b/g, 'belum'],
  [/\b[Ss]dh\b/g, 'sudah'],
  [/\b[Aa]ja\b/g, 'saja'],
  [/\b[Gg]mn\b/g, 'bagaimana'],
  [/\b[Kk]pd\b/g, 'kepada'],
  [/\b[Tt]sb\b/g, 'tersebut'],
  [/\b[Kk]rn\b/g, 'karena'],
  [/\b[Tt]dk\b/g, 'tidak'],
  [/\b[Jj]g\b/g, 'juga'],
  [/\b[Dd]lm\b/g, 'dalam'],
  [/\b[Ss]pt\b/g, 'seperti'],
  [/\b[Dd]pt\b/g, 'dapat'],
  [/\b[Hh]rs\b/g, 'harus'],
  [/\b[Tt]p\b/g, 'tapi'],
  [/\b[Pp]kl\b/g, 'pukul'],
  [/\b[Yy]th\b/g, 'yang terhormat'],
  [/\bBpk\b/g, 'Bapak'],
  [/\b[Tt]gl\b/g, 'tanggal'],
  [/\b[Tt]hn\b/g, 'tahun'],
  [/\b[Bb]ln\b/g, 'bulan'],
];

// "teman2" -> "teman-teman", kecuali nama teknologi yang memang berakhiran 2
const KECUALI_ULANG_2 = new Set([
  'web', 'python', 'vue', 'angular', 'http', 'oauth', 'utf', 'sha', 'base', 'gpt',
  'llama', 'claude', 'gemini', 'angularjs', 'ipv', 'mp', 'es', 'ec', 'md',
]);

// v2.1.0 | versi v2.1 | IP 192.168.1.1 | @studio.kreatif
// Diproses SEBELUM angka, supaya "v2.500" atau "10.0.0.1" tidak dianggap ribuan/desimal.
const RE_VERSI_V = /(?<![\w.])(?:(versi|version)\s+)?v(\d+(?:\.\d+){1,3})(?!\w|\.\d)/gi;
const RE_IP = /(?<![\w.])(?<!Rp\.?\s*)(?<!\$\s*)\d{1,3}(?:\.\d{1,3}){3}(?!\w|\.\d)/g;
const RE_HANDLE = /(?<![\w.@])@([A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)*)/g;

function versiDanAlamat(input: string): string {
  let s = input;
  s = s.replace(RE_VERSI_V, (_m, kata: string | undefined, ver: string) =>
    `${kata ?? 'versi'} ${ver.split('.').map((seg) => angkaKeKata(String(Number(seg)))).join(' titik ')}`,
  );
  s = s.replace(RE_IP, (m) => {
    const oktet = m.split('.');
    const valid = oktet.every((o) => /^(0|[1-9]\d{0,2})$/.test(o) && Number(o) <= 255);
    return valid ? ` ${oktet.map(bacaPerDigit).join(' titik ')} ` : m;
  });
  s = s.replace(RE_HANDLE, (_m, h: string) => ` ${h.replace(/\./g, ' titik ')} `);
  return s;
}

// ═══════════════════════════════════════════════════════════════════════════
// FUNGSI UTAMA
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Normalisasi teks agar pelafalan TTS natural: "Rp1.500.000 - Rp5.000.000"
 * dibaca "satu juta lima ratus ribu sampai lima juta rupiah", "Next.js" dibaca
 * "Neks J-S", dst. Aman dipanggil berulang (hasilnya stabil).
 */
export function normalizeIndonesianForSpeech(text: string): string {
  let s = text;

  // 1. Link, WhatsApp, email
  s = s.replace(/https?:\/\/(?:wa\.me|api\.whatsapp\.com)\S*/gi, ' tautan WhatsApp ');
  s = s.replace(/\bwa\.me\S*/gi, ' tautan WhatsApp ');
  s = s.replace(/https?:\/\/\S+/gi, ' ');
  s = s.replace(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, ' alamat email ');

  // 1b. Versi (v2.1.0), alamat IP, dan handle sosial media (@nama.akun)
  s = versiDanAlamat(s);

  // 2. Pola khusus (C#, C++, .NET, CI/CD, 24/7, ...)
  for (const [re, out] of ATURAN_KHUSUS) s = s.replace(re, out);

  // 3. Angka -> kata (uang, rentang, persen, jam, telepon, satuan)
  s = konversiAngka(s);

  // 4. Kamus pelafalan
  s = applyTermsCI(s);
  s = applyTermsCS(s);
  s = applyAcronymsEN(s);
  s = applyAcronymsID(s);
  s = ejaanKamusKeInggris(s);

  // 5. Singkatan Bahasa Indonesia
  for (const [re, out] of SINGKATAN_ID) s = s.replace(re, out);
  s = s.replace(/\b([A-Za-z][a-z]{2,})2\b/g, (m, w: string) =>
    KECUALI_ULANG_2.has(w.toLowerCase()) ? m : `${w}-${w}`,
  );

  // 6. Simbol sisa
  s = s.replace(/\s&\s/g, ' dan ');
  s = s.replace(/\s\+\s/g, ' plus ');
  s = s.replace(/(?<=[A-Za-z])\/(?=[A-Za-z])/g, ' ');
  s = s.replace(/\s\/\s/g, ', ');
  s = s.replace(/->|=>|[→⇒➜]/g, ', ');
  s = s.replace(/#(\d+)/g, 'nomor $1');
  s = s.replace(/[#@|•·]/g, ' ');

  return (
    s
      .replace(/\s{2,}/g, ' ')
      // Spasi sisa sebelum tanda baca ("rupiah ," -> "rupiah,") akibat penggantian di atas.
      .replace(/\s+([,;.!?])(?=\s|$)/g, '$1')
      .trim()
  );
}