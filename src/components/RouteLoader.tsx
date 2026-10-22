import React from 'react';

/**
 * Fallback perpindahan halaman: logo saja sampai halaman siap dirender.
 * Muncul dengan jeda ±150ms (lihat .rl-wrap di motion.css) supaya tidak berkedip
 * saat chunk sudah ada di cache. Navbar & dock tetap terlihat di sekitarnya.
 */
export const RouteLoader: React.FC = () => (
  <div role="status" aria-label="Memuat halaman" className="min-h-[70vh] flex items-center justify-center">
    <div className="rl-wrap">
      <svg className="rl-ring" viewBox="0 0 88 88" aria-hidden="true">
        <rect x="4" y="4" width="80" height="80" rx="22" pathLength="1" />
      </svg>
      <img src="/icons/icon-512.png" alt="" width="56" height="56" className="rl-logo" />
    </div>
  </div>
);
