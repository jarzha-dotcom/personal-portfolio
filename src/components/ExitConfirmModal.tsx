import React, { useEffect, useRef } from 'react';
import { LogOut, Sparkles, X, MessageSquare, Bot, ArrowRight } from 'lucide-react';
import { Portal } from './Portal';

interface ExitConfirmModalProps {
  isOpen: boolean;
  onStay: () => void;
  onLeave: () => void;
  darkMode: boolean;
  onOpenChat?: () => void;
}

export const ExitConfirmModal: React.FC<ExitConfirmModalProps> = ({
  isOpen,
  onStay,
  onLeave,
  darkMode,
  onOpenChat,
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

  const handleChatWithZannah = () => {
    onStay();
    if (onOpenChat) {
      onOpenChat();
    } else if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-zannah-chat'));
    }
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onStay}
        role="dialog"
        aria-modal="true"
        aria-labelledby="zannah-exit-title"
      >
        <div
          ref={modalRef}
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-w-lg rounded-2xl border p-6 sm:p-7 shadow-2xl transition-all animate-in zoom-in-95 duration-200 relative overflow-hidden ${darkMode
            ? 'bg-slate-900 border-teal-500/30 text-white shadow-teal-500/10'
            : 'bg-white border-teal-200 text-slate-900 shadow-slate-300/60'
            }`}
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-teal-500/15 rounded-full blur-2xl pointer-events-none" />

          {/* Tombol Tutup Silang di Sudut */}
          <button
            type="button"
            onClick={onStay}
            aria-label="Tutup dan tetap di situs"
            className={`absolute top-4 right-4 p-1.5 rounded-lg transition-colors z-10 ${darkMode
              ? 'text-slate-400 hover:text-white hover:bg-slate-800'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
          >
            <X className="w-4 h-4" />
          </button>

          {/* Avatar & Identitas Zannah AI */}
          <div className="flex items-center gap-3.5 mb-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white text-base font-bold shadow-md shadow-teal-500/30">
                ZA
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-slate-900" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                  <Bot className="w-3 h-3" /> Zannah AI Active
                </span>
              </div>
              <h3
                id="zannah-exit-title"
                className="text-lg sm:text-xl font-bold tracking-tight mt-0.5"
              >
                Eits, mau keluar dulu Kak? 👋
              </h3>
            </div>
          </div>

          {/* Speech Bubble Card */}
          <div
            className={`rounded-xl p-4 sm:p-4.5 border mb-5 text-xs sm:text-sm leading-relaxed relative ${darkMode
              ? 'bg-slate-800/70 border-slate-700/80 text-slate-200'
              : 'bg-teal-50/60 border-teal-100 text-slate-700'
              }`}
          >
            <p className="mb-2.5">
              Zannah lihat Kakak menekan tombol kembali di browser. Sayang banget kalau terlewat, Kakak sudah sempat coba{' '}
              <b className={darkMode ? 'text-teal-300' : 'text-teal-700'}>B-Games</b>  atau cek demo interaktif lainnya?
            </p>
            <p>
              Kalau Kakak lagi butuh <span className="underline decoration-teal-400 font-semibold">estimasi biaya & timeline proyek</span>, Zannah bisa bantu hitungin langsung tanpa perlu tunggu Mas Arzha online lho! Mau ngobrol sebentar?
            </p>
          </div>

          {/* Feature Highlights Chips */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-medium border ${darkMode
                ? 'bg-slate-800/40 border-slate-700/60 text-slate-300'
                : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
            >
              <span className="text-amber-500">⚡</span>
              <span>Hitung Estimasi Proyek</span>
            </div>
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-medium border ${darkMode
                ? 'bg-slate-800/40 border-slate-700/60 text-slate-300'
                : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
            >
              <span className="text-teal-500">🏢</span>
              <span>Demo Web App Klien</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={onLeave}
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors order-3 sm:order-1 ${darkMode
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Tetap ingin keluar</span>
            </button>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 order-1 sm:order-2">
              <button
                type="button"
                onClick={onStay}
                className={`inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition-colors ${darkMode
                  ? 'border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
                  : 'border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  }`}
              >
                <Sparkles className="w-4 h-4 text-teal-500" />
                <span>Tetap di Sini</span>
              </button>

              <button
                type="button"
                onClick={handleChatWithZannah}
                autoFocus
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-lg shadow-teal-600/30 transition-all group"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Tanya Zannah (AI)</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
};
