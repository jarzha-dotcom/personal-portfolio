import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle, Sparkles, X } from 'lucide-react';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

export const STORAGE_KEY = 'zannahWelcomeShown';
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

const FOCUS_RING =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2';

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
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

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

  // Begitu chat window terbuka — lewat cara APAPUN, bukan cuma tombol di
  // bubble ini sendiri (mis. tombol toggle langsung, atau ExitConfirmModal)
  // — anggap sambutan ini selesai tugasnya. Tanpa ini, bubble bisa saja
  // baru dijadwalkan tampil (atau sudah tampil) tepat saat window chat
  // terbuka, lalu berakhir tertimbun diam-diam di bawah backdrop modal
  // (z-[9999]) karena z-index bubble ini jauh lebih rendah — kelihatan
  // seperti "nggak pernah muncul" padahal sebenarnya nyangkut di belakang.
  useEffect(() => {
    const handleChatOpened = () => markAsSeen();
    window.addEventListener('zannah-chat-opened', handleChatOpened);
    return () => window.removeEventListener('zannah-chat-opened', handleChatOpened);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Kelola fokus keyboard/screen-reader saat bubble muncul & hilang: simpan
  // elemen yang lagi fokus sebelum bubble muncul, pindahkan fokus ke dialog
  // begitu muncul, lalu kembalikan lagi begitu ditutup — pola yang sama
  // dengan drawer mobile & modal exit-confirm di tempat lain di app ini.
  useEffect(() => {
    if (visible) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
      dialogRef.current?.focus();
    } else {
      previouslyFocusedRef.current?.focus();
    }
  }, [visible]);

  const markAsSeen = () => {
    alreadyHandledRef.current = true;
    setVisible(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // Nggak masalah kalau gagal disimpan — paling nudge muncul lagi di sesi berikut.
    }
  };

  // Escape menutup bubble — konsisten dengan pola dismiss lain (drawer mobile,
  // modal exit-confirm) yang sudah ada di app ini.
  useEffect(() => {
    if (!visible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') markAsSeen();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleOpenChat = () => {
    markAsSeen();
    // Pakai event global yang sama dengan yang sudah dipakai ChatWidget
    // (mis. dari ExitConfirmModal) — nggak perlu prop-drilling isOpen baru.
    window.dispatchEvent(new Event('open-zannah-chat'));
  };

  if (!visible) return null;

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-label="Sambutan dari Zannah"
      aria-modal="false"
      className={`fixed bottom-24 left-6 z-[60] w-80 max-w-[calc(100vw-2rem)] outline-none ${
        prefersReducedMotion ? '' : 'animate-in fade-in slide-in-from-bottom-3 zoom-in-95 duration-300'
      }`}
    >
      <div
        className={`relative overflow-hidden rounded-3xl border p-5 ring-1 ${
          darkMode
            ? 'bg-slate-900 border-slate-700 text-slate-100 ring-white/5 shadow-[0_25px_60px_-20px_rgba(45,212,191,0.3)]'
            : 'bg-white border-slate-200 text-slate-900 ring-black/5 shadow-[0_25px_60px_-20px_rgba(13,148,136,0.35)]'
        }`}
      >
        {/* Aksen tipis di tepi atas — satu-satunya sentuhan gradien di kartu
            ini, menegaskan identitas warna Zannah (teal → indigo) yang sama
            dipakai di avatar, tanpa menambah gradien di tempat lain. */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-500 via-teal-400 to-indigo-500" />
        <button
          type="button"
          aria-label="Tutup sambutan"
          onClick={markAsSeen}
          className={`absolute top-4 right-3 flex h-7 w-7 items-center justify-center rounded-full transition-colors ${FOCUS_RING} ${
            darkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
          }`}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3 pr-5 pt-1">
          {/* Avatar: icon Sparkles (bukan inisial teks) supaya langsung kebaca
              "asisten AI", + badge titik hijau kecil buat kesan "siap merespons
              sekarang" — pola familiar dari widget live-chat. Ping di belakang
              titik hijau memang berulang terus selama bubble tampil, tapi
              kecil & redup jadi nggak mengganggu fokus ke pesan utamanya, dan
              dimatikan sepenuhnya kalau user minta reduced motion. */}
          <div className="relative shrink-0">
            <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-indigo-600 shadow-lg shadow-teal-500/30 ring-4 ${darkMode ? 'ring-slate-900' : 'ring-white'}`}>
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
              {!prefersReducedMotion && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />
              )}
              <span
                className={`relative inline-flex h-3.5 w-3.5 rounded-full bg-green-400 border-2 ${
                  darkMode ? 'border-slate-900' : 'border-white'
                }`}
                aria-hidden="true"
              />
            </span>
          </div>
          <div className="pt-0.5">
            <p className="text-base font-semibold leading-tight">Halo, saya Zannah 👋</p>
            <p className={`mt-1.5 text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Asisten AI di sini — siap bantu jelaskan jasa, proyek, sampai estimasi biaya kalau Kakak butuh.
            </p>
          </div>
        </div>

        <div className="mt-4 flex gap-2.5">
          <button
            type="button"
            onClick={markAsSeen}
            className={`flex-1 rounded-xl border py-2.5 text-sm font-medium transition-colors ${FOCUS_RING} ${
              darkMode
                ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Nanti aja
          </button>
          <button
            type="button"
            onClick={handleOpenChat}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-teal-600 py-2.5 text-sm font-medium text-white shadow-md shadow-teal-600/30 transition-all hover:bg-teal-700 hover:shadow-lg hover:shadow-teal-600/40 ${
              prefersReducedMotion ? '' : 'hover:-translate-y-0.5'
            } ${FOCUS_RING}`}
          >
            <MessageCircle className="h-4 w-4" />
            Ngobrol yuk
          </button>
        </div>
      </div>

      {/* Ekor kecil menunjuk ke arah tombol chat di pojok kiri bawah */}
      <div
        className={`absolute -bottom-1.5 left-8 h-3.5 w-3.5 rotate-45 border-r border-b ${
          darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
        }`}
      />
    </div>
  );
};