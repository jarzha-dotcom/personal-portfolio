import React, { useEffect, useRef } from 'react';
import { LogOut, Compass, Sparkles, X } from 'lucide-react';
import { Portal } from './Portal';

interface ExitConfirmModalProps {
  isOpen: boolean;
  onStay: () => void;
  onLeave: () => void;
  darkMode: boolean;
}

export const ExitConfirmModal: React.FC<ExitConfirmModalProps> = ({
  isOpen,
  onStay,
  onLeave,
  darkMode,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Tangani tombol Escape untuk membatalkan dan tetap di situs
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onStay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onStay]);

  if (!isOpen) return null;

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onStay}
        role="dialog"
        aria-modal="true"
        aria-labelledby="exit-modal-title"
      >
        <div
          ref={modalRef}
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-w-md rounded-2xl border p-6 sm:p-7 shadow-2xl transition-all animate-in zoom-in-95 duration-200 relative ${
            darkMode
              ? 'bg-slate-900 border-slate-700/80 text-white shadow-teal-500/5'
              : 'bg-white border-slate-200 text-slate-900 shadow-slate-300/60'
          }`}
        >
          {/* Tombol Tutup Silang di Sudut */}
          <button
            type="button"
            onClick={onStay}
            aria-label="Tutup dan tetap di situs"
            className={`absolute top-4 right-4 p-1.5 rounded-lg transition-colors ${
              darkMode
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <X className="w-4 h-4" />
          </button>

          {/* Icon Badge */}
          <div className="flex items-center gap-3.5 mb-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                darkMode
                  ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
                  : 'bg-amber-50 border border-amber-200 text-amber-600'
              }`}
            >
              <Compass className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[11px] font-bold tracking-wider uppercase text-teal-600 dark:text-teal-400">
                Konfirmasi Navigasi
              </span>
              <h3
                id="exit-modal-title"
                className="text-lg sm:text-xl font-bold tracking-tight"
              >
                Tinggalkan Situs?
              </h3>
            </div>
          </div>

          {/* Deskripsi */}
          <p
            className={`text-xs sm:text-sm leading-relaxed mb-6 ${
              darkMode ? 'text-slate-300' : 'text-slate-600'
            }`}
          >
            Anda menekan tombol kembali di browser dan akan diarahkan keluar dari
            portofolio <b className={darkMode ? 'text-white' : 'text-slate-900'}>K. Arzhaning Jagad</b>.
            Apakah Anda ingin tetap menjelajah di sini atau lanjut keluar ke halaman sebelumnya?
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onLeave}
              className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition-colors ${
                darkMode
                  ? 'border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800'
                  : 'border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <LogOut className="w-4 h-4" />
              <span>Lanjut Keluar</span>
            </button>

            <button
              type="button"
              onClick={onStay}
              autoFocus
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md shadow-teal-600/20 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Batal / Tetap di Sini</span>
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
};
