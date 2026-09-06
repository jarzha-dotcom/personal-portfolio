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
 */

// Kunci lisensi resmi yang sah
const VALID_LICENSE_KEY = 'ARZHA-LIC-2026-ACTIVE-KEY';

export function isAppLicensed(): boolean {
  if (typeof window === 'undefined') return true;

  try {
    const userKey = (import.meta as any).env?.APP_LICENSE_KEY;
    if (userKey && String(userKey).trim() === VALID_LICENSE_KEY) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
