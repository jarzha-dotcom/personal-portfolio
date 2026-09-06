import React, { useState, useEffect } from 'react';
import { ShieldAlert, ExternalLink } from 'lucide-react';
import { isAppLicensed } from '../utils/licenseGuard';

export const ShowcaseBanner: React.FC = () => {
  const [licensed, setLicensed] = useState<boolean | null>(null);

  useEffect(() => {
    isAppLicensed().then(setLicensed);
  }, []);

  // Belum selesai verifikasi → jangan render apapun (hindari flash)
  if (licensed === null || licensed === true) return null;

  return (
    <aside
      aria-label="Informasi Lisensi Showcase"
      className="bg-gradient-to-r from-amber-600 via-red-600 to-amber-700 text-white text-[11px] font-medium py-1.5 px-3 sticky top-0 z-[99999] shadow-md border-b border-red-500/30 flex items-center justify-between gap-2 flex-wrap"
    >
      <div className="flex items-center gap-2 mx-auto text-center sm:text-left">
        <ShieldAlert className="w-4 h-4 text-amber-200 shrink-0" />
        <span>
          <b className="tracking-wide">SHOWCASE / REVIEW MODE:</b> Hak Cipta © 2026 <b>K. Arzhaning Jagad (Arzha)</b>. Repositori ini hanya untuk evaluasi skill &amp; review teknis. Kunci lisensi deployment tidak ditemukan.
        </span>
        <a
          href="https://byarzhaning.online"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-bold underline text-amber-200 hover:text-white transition-colors ml-1"
        >
          Website Resmi <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </aside>
  );
};
