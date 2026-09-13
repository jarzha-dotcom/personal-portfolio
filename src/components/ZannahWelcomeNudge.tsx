import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle, X } from 'lucide-react';

const STORAGE_KEY = 'zannahWelcomeShown';
const SHOW_AFTER_MS = 3500;

interface ZannahWelcomeNudgeProps {
  darkMode: boolean;
  /**
   * Baru boleh dijadwalkan muncul kalau true — dipakai supaya bubble tidak
   * nyoba muncul sebelum tombol chat (ChatWidget, lazy-loaded) benar-benar
   * ter-mount, karena bubble ini menunjuk ke posisi tombol tersebut.
   */
  enabled: boolean;
}

/**
 * Sambutan satu-kali dari Zannah di kunjungan pertama.
 *
 * Sengaja BUKAN coachmark step-by-step: tidak ada "Lanjut ➡️", tidak nunjuk-
 * nunjuk section lain di halaman, dan chat window tidak auto-terbuka. Cuma
 * bubble kecil di dekat tombol chat dengan dua pilihan: tutup, atau langsung
 * masuk ke percakapan dengan Zannah. Tampil sekali per browser (flag di
 * localStorage) lalu tidak pernah muncul otomatis lagi.
 */
export const ZannahWelcomeNudge: React.FC<ZannahWelcomeNudgeProps> = ({ darkMode, enabled }) => {
  const [visible, setVisible] = useState(false);
  const alreadyHandledRef = useRef(false);

  useEffect(() => {
    if (!enabled || alreadyHandledRef.current) return;
    if (typeof window === 'undefined') return;

    let hasSeenBefore = false;
    try {
      hasSeenBefore = !!window.localStorage.getItem(STORAGE_KEY);
    } catch {
      // localStorage tidak tersedia (mis. private mode strict) — anggap saja
      // belum pernah lihat, tidak fatal kalau nudge ini muncul lagi lain waktu.
    }
    if (hasSeenBefore) {
      alreadyHandledRef.current = true;
      return;
    }

    const timer = window.setTimeout(() => setVisible(true), SHOW_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [enabled]);

  const markAsSeen = () => {
    alreadyHandledRef.current = true;
    setVisible(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // Nggak masalah kalau gagal disimpan — paling nudge muncul lagi di sesi berikut.
    }
  };

  const handleOpenChat = () => {
    markAsSeen();
    // Pakai event global yang sama dengan yang sudah dipakai ChatWidget
    // (mis. dari ExitConfirmModal) — nggak perlu prop-drilling isOpen baru.
    window.dispatchEvent(new Event('open-zannah-chat'));
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Sambutan dari Zannah"
      className="fixed bottom-24 right-6 z-[60] w-64"
    >
      <div
        className={`relative rounded-2xl border p-4 shadow-xl ${
          darkMode
            ? 'bg-slate-900 border-slate-700 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <button
          type="button"
          aria-label="Tutup sambutan"
          onClick={markAsSeen}
          className={`absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full transition-colors ${
            darkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-400 hover:bg-slate-100'
          }`}
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <div className="flex items-start gap-2.5 pr-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-700 text-[11px] font-bold text-white">
            ZA
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">Halo, saya Zannah 👋</p>
            <p className={`mt-1 text-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Asisten AI di sini — siap bantu jelaskan jasa, proyek, sampai estimasi biaya kalau Kakak butuh.
            </p>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={markAsSeen}
            className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${
              darkMode
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Nanti aja
          </button>
          <button
            type="button"
            onClick={handleOpenChat}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-teal-600 py-1.5 text-xs font-medium text-white transition-colors hover:bg-teal-700"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Ngobrol yuk
          </button>
        </div>
      </div>

      {/* Ekor kecil menunjuk ke arah tombol chat di pojok kanan bawah */}
      <div
        className={`absolute -bottom-1.5 right-8 h-3 w-3 rotate-45 border-r border-b ${
          darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
        }`}
      />
    </div>
  );
};
