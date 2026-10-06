/**
 * claimVerifier.ts -- pemeriksa DETERMINISTIK atas klaim di balasan bot (versi sederhana).
 *
 * Masalah yang dijaga: balasan memuat angka harga / nama perusahaan yang TIDAK ada di hasil pencarian web
 * (kebiasaan model mengisi dari ingatan, mis. "Fastwork Rp390.000-500.000" di bawah label "hasil riset web").
 *
 * Yang diperiksa (hanya dua hal, sengaja sempit supaya jarang salah tandai):
 *   1. Nominal Rupiah yang ditulis dengan awalan Rp/IDR di balasan.
 *   2. Nama merek dari daftar BRANDS di bawah.
 *
 * Sebuah nominal/merek dianggap TERVERIFIKASI jika muncul di salah satu: teks hasil riset, judul/URL sumber,
 * atau teks prompt bot sendiri (mis. harga paket Mas Arzha). Nominal juga dianggap cocok jika sama dengan angka
 * sumber setelah normalisasi (34.900 = 34,9 ribu = 34900), selisih <= 3 persen, atau kelipatan x12 / :12.
 *
 * BATAS: ini hanya mengecek KESESUAIAN dengan teks riset, bukan kebenaran isi web. Hasil hitungan sendiri model
 * (mis. total dua harga) bisa ikut tertandai. Nama merek di luar daftar tidak terjangkau.
 */

const BRANDS: Array<[string, string]> = [
    ['Fastwork', 'fastwork'],
    ['Niagahoster', 'niagahoster'],
    ['Qwords', 'qwords'],
    ['IDwebhost', 'idwebhost'],
    ['Rumahweb', 'rumahweb'],
    ['Hostinger', 'hostinger'],
    ['Dewaweb', 'dewaweb'],
    ['Jagoanhosting', 'jagoanhosting'],
    ['IDCloudHost', 'idcloudhost'],
    ['Sribulancer', 'sribulancer'],
    ['Upwork', 'upwork'],
    ['Fiverr', 'fiverr'],
    ['Glints', 'glints'],
    ['Wix', 'wix'],
    ['Squarespace', 'squarespace'],
    ['Webflow', 'webflow'],
    ['GoDaddy', 'godaddy'],
    ['Exabytes', 'exabytes'],
    ['Biznet Gio', 'biznetgio'],
    ['Domainesia', 'domainesia'],
];

const UNIT_FACTOR: Record<string, number> = { juta: 1e6, jt: 1e6, miliar: 1e9, ribu: 1e3, rb: 1e3, k: 1e3 };

function parseNumber(raw: string, unit?: string): number | null {
    const t = raw.replace(/[.,]+$/, '');
    if (!t) return null;
    let value: number;
    if (/^\d{1,3}([.,]\d{3})+$/.test(t)) value = Number(t.replace(/[.,]/g, '')); // 1.500.000 / 34.900
    else if (/^\d+[.,]\d{1,2}$/.test(t)) value = Number(t.replace(',', '.')); // 2,5 / 1.5
    else value = Number(t.replace(/[.,]/g, ''));
    if (!Number.isFinite(value)) return null;
    const factor = unit ? UNIT_FACTOR[unit.toLowerCase()] || 1 : 1;
    return value * factor;
}

/** Nominal berawalan Rp/IDR di teks balasan (yang diklaim bot). */
export function extractRupiahClaims(text: string): Array<{ label: string; value: number }> {
    const out: Array<{ label: string; value: number }> = [];
    const re = /(?:Rp\.?|IDR)\s*(\d[\d.,]*)(?:\s*(juta|jt|miliar|ribu|rb|k)\b)?/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
        const value = parseNumber(m[1], m[2]);
        if (value !== null && value >= 1000) out.push({ label: m[0].replace(/\s+/g, ' ').replace(/[.,]+$/, '').trim(), value });
    }
    return out;
}

/** SEMUA angka (dengan/tanpa Rp) di teks acuan: hasil riset, prompt, dst. */
function extractAllNumbers(text: string): number[] {
    const out: number[] = [];
    const re = /(\d[\d.,]*)(?:\s*(juta|jt|miliar|ribu|rb|k)\b)?/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
        const v = parseNumber(m[1], m[2]);
        if (v !== null && v >= 100) out.push(v);
    }
    return out;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '');

export interface VerifyInput {
    reply: string;
    /** Teks hasil pencarian web yang diberikan ke model (kosong jika riset tidak jalan). */
    researchText: string;
    /** Judul + URL sumber riset. */
    sourceText: string;
    /** Teks prompt bot sendiri (harga paket Mas Arzha dst. dianggap sah). */
    ownText: string;
}

export interface VerifyResult {
    unverifiedAmounts: string[];
    unverifiedBrands: string[];
}

export function verifyClaims(input: VerifyInput): VerifyResult {
    const { reply, researchText, sourceText, ownText } = input;

    const allowed = [...extractAllNumbers(researchText), ...extractAllNumbers(ownText)];
    const matches = (v: number) =>
        allowed.some((a) => {
            const close = (x: number) => Math.abs(x - v) / Math.max(v, 1) <= 0.03;
            return close(a) || close(a * 12) || close(a / 12);
        });

    const seen = new Set<string>();
    const unverifiedAmounts: string[] = [];
    for (const c of extractRupiahClaims(reply)) {
        if (matches(c.value)) continue;
        const key = String(c.value);
        if (seen.has(key)) continue;
        seen.add(key);
        unverifiedAmounts.push(c.label);
    }

    const haystack = norm(`${researchText} ${sourceText} ${ownText}`);
    const replyNorm = norm(reply);
    const unverifiedBrands = BRANDS.filter(([, key]) => replyNorm.includes(key) && !haystack.includes(key)).map(([label]) => label);

    return { unverifiedAmounts: unverifiedAmounts.slice(0, 5), unverifiedBrands };
}

/** Kalimat catatan untuk ditempel di akhir balasan. Kosong jika semua terverifikasi. */
export function buildVerificationNote(r: VerifyResult, researchRan: boolean): string {
    if (r.unverifiedAmounts.length === 0 && r.unverifiedBrands.length === 0) return '';
    const parts: string[] = [];
    if (r.unverifiedAmounts.length) parts.push(`angka ${r.unverifiedAmounts.join(', ')}`);
    if (r.unverifiedBrands.length) parts.push(`nama ${r.unverifiedBrands.join(', ')}`);
    return researchRan
        ? `⚠️ *Catatan verifikasi: ${parts.join(' dan ')} tidak ditemukan di hasil pencarian web di atas (kemungkinan perkiraan umum), jadi anggap belum terverifikasi.*`
        : `⚠️ *Catatan: ${parts.join(' dan ')} di atas bukan hasil pencarian web (belum diverifikasi), jadi anggap hanya perkiraan umum.*`;
}
