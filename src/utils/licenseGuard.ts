/**
 * licenseGuard.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Sistem perlindungan lisensi untuk repositori publik K. Arzhaning Jagad.
 *
 * TUJUAN:
 * Repositori ini dibuat publik di GitHub agar recruiter/klien bisa mereview
 * skill & arsitektur kode Mas Arzha secara transparan.
 *
 * PENGAMANAN:
 * Jika seseorang meng-clone repositori ini tanpa file kunci rahasia (.env.local)
 * yang memiliki APP_LICENSE_KEY yang valid:
 * 1. Aplikasi otomatis berjalan dalam mode "Showcase / Evaluation Only".
 * 2. Banner watermark keamanan permanen akan ditampilkan di bagian atas web.
 * 3. Pemilik asli (K. Arzhaning Jagad) memiliki lisensi penuh dengan memasang
 *    kunci rahasia di environment lokal dan Vercel.
 *
 * KEAMANAN:
 * Kunci asli TIDAK disimpan di sini. Hanya SHA-256 hash-nya yang tersimpan.
 * Mengetahui hash ini tidak membantu karena kunci asli tidak bisa di-reverse.
 */

// SHA-256 hash dari kunci lisensi resmi (kunci aslinya hanya ada di .env.local & Vercel)
const VALID_LICENSE_HASH = '06ae866730183990606805d8f9702963653cb0fac9d4be5196f1829de768de94';

/**
 * Menghasilkan SHA-256 hash dari sebuah string menggunakan Web Crypto API (browser-native).
 */
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Memeriksa apakah aplikasi berjalan dengan lisensi yang valid.
 * Perbandingan dilakukan terhadap hash, bukan plaintext — aman untuk repositori publik.
 */
export async function isAppLicensed(): Promise<boolean> {
  if (typeof window === 'undefined') return true;

  try {
    const userKey = (import.meta as any).env?.APP_LICENSE_KEY;
    if (!userKey || String(userKey).trim() === '') return false;

    const userHash = await sha256(String(userKey).trim());
    return userHash === VALID_LICENSE_HASH;
  } catch {
    return false;
  }
}
