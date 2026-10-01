// src/utils/consoleGreeting.ts
//
// Sapaan untuk pengunjung yang buka DevTools — gaya mirip console Vercel.
// Dipanggil SEKALI dari main.tsx (di luar React), supaya:
//  - tidak tercetak dobel oleh React StrictMode di mode dev,
//  - tidak ikut tercetak ulang setiap MainPortfolio re-mount.

declare global {
  interface Window {
    __ARZHA_CONSOLE_GREETED__?: boolean;
  }
}

// String.raw supaya backslash di ASCII art tidak perlu di-escape.
const BANNER = String.raw`
    ___    ____  _____   __  _____
   /   |  / __ \/__  /  / / / /   |
  / /| | / /_/ /  / /  / /_/ / /| |
 / ___ |/ _, _/  / /__/ __  / ___ |
/_/  |_/_/ |_|  /____/_/ /_/_/  |_|
`;

// Warna dipilih yang tetap terbaca di DevTools tema gelap MAUPUN terang.
const TEAL = '#14b8a6';
const SLATE = '#64748b';

export function printConsoleGreeting(): void {
  if (typeof window === 'undefined' || typeof console === 'undefined') return;
  if (window.__ARZHA_CONSOLE_GREETED__) return;
  window.__ARZHA_CONSOLE_GREETED__ = true;

  try {
    console.log(
      `%c${BANNER}`,
      `color:${TEAL};font-family:monospace;font-weight:bold;line-height:1.1;`
    );

    console.log(
      '%c👋 Suka ngoprek ya?',
      `font-size:16px;font-weight:bold;color:${TEAL};`
    );

    console.log(
      '%c"Buka console log itu mirip ngintip ke balik panggung: kamu bakal tahu mana efek megah yang memang disusun rapi, dan mana yang cuma ditahan pakai isolasi \\"try...catch.\\""',
      `font-size:12px;font-style:italic;color:${SLATE};`
    );

    console.log(
      '%cSitus ini dibangun dengan React 19 · Vite · TypeScript · Tailwind v4 — dan ya, sengaja dibuat rapi buat diintip.',
      `font-size:12px;color:${SLATE};`
    );

    // URL sengaja tanpa styling (%c) — DevTools otomatis menjadikannya
    // tautan yang bisa diklik, persis seperti pesan Vercel.
    console.log(
      [
        '',
        'Mau lihat karya lain yang sudah live?',
        '',
        '- B-Games (game papan multiplayer)  https://bgames.arzhaning.my.id',
        '- Rajendra Pintar (edukasi anak)    https://rapin.arzhaning.my.id',
        '- Assets DEMO (inventaris aset)     https://assets.arzhaning.my.id',
        '',
        'Punya proyek, atau cuma mau ngobrol sesama pengoprek?',
        '',
        '- WhatsApp  https://wa.me/6282312312734',
        '- Email     admin@arzhaning.my.id',
        '',
      ].join('\n')
    );
  } catch {
    // Console bisa dimodifikasi/diblokir oleh extension — jangan sampai
    // sapaan iseng ini menjatuhkan aplikasi.
  }
}
