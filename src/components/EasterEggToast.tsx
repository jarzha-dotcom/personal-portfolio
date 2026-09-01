import React from 'react';
import { PartyPopper } from 'lucide-react';

interface EasterEggToastProps {
  show: boolean;
}

// Perayaan singkat (±1.8 detik) yang muncul begitu easter egg (klik logo
// 5x) berhasil di-trigger, sebelum Mode CV terlihat penuh. Murni dekoratif
// — pointer-events-none supaya tidak menghalangi interaksi apa pun.
export const EasterEggToast: React.FC<EasterEggToastProps> = ({ show }) => {
  if (!show) return null;

  const confettiDots = [
    { color: 'bg-teal-400', delay: '0ms', pos: '-translate-x-16 -translate-y-10' },
    { color: 'bg-amber-400', delay: '80ms', pos: 'translate-x-14 -translate-y-12' },
    { color: 'bg-emerald-400', delay: '120ms', pos: '-translate-x-10 translate-y-10' },
    { color: 'bg-indigo-400', delay: '40ms', pos: 'translate-x-10 translate-y-12' },
    { color: 'bg-rose-400', delay: '160ms', pos: '-translate-x-20 translate-y-2' },
    { color: 'bg-sky-400', delay: '200ms', pos: 'translate-x-20 translate-y-0' },
  ];

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[95] flex items-center justify-center pointer-events-none"
    >
      <div className="relative animate-in zoom-in fade-in duration-300">
        {confettiDots.map((dot, i) => (
          <span
            key={i}
            className={`absolute top-1/2 left-1/2 w-2 h-2 rounded-full ${dot.color} ${dot.pos} animate-ping`}
            style={{ animationDelay: dot.delay, animationDuration: '900ms' }}
          />
        ))}
        <div className="relative flex items-center gap-2.5 px-5 py-3.5 rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center animate-bounce">
            <PartyPopper className="w-5 h-5" />
          </div>
          <div>
            <p className="text-white text-sm font-bold leading-tight">Easter Egg Ditemukan!</p>
            <p className="text-slate-400 text-[11px] leading-tight">Membuka Mode CV...</p>
          </div>
        </div>
      </div>
    </div>
  );
};
