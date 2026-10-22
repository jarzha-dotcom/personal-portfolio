import React from 'react';
import { PartyPopper } from 'lucide-react';
import { usePresence } from '../hooks/usePresence';

interface EasterEggToastProps {
  show: boolean;
}

// Perayaan singkat (±1.8 detik) yang muncul begitu easter egg (klik logo
// 5x) berhasil di-trigger, sebelum Mode CV terlihat penuh. Murni dekoratif
// — pointer-events-none supaya tidak menghalangi interaksi apa pun.
export const EasterEggToast: React.FC<EasterEggToastProps> = ({ show }) => {
  const { mounted, closing } = usePresence(show, 250);
  if (!mounted) return null;

  // tx/ty = titik tujuan confetti (px) relatif ke pusat — meledak keluar sekali
  const confettiDots = [
    { color: 'bg-teal-400', delay: '0ms', tx: -64, ty: -40 },
    { color: 'bg-amber-400', delay: '60ms', tx: 56, ty: -48 },
    { color: 'bg-emerald-400', delay: '100ms', tx: -40, ty: 44 },
    { color: 'bg-indigo-400', delay: '30ms', tx: 40, ty: 48 },
    { color: 'bg-rose-400', delay: '120ms', tx: -84, ty: 6 },
    { color: 'bg-sky-400', delay: '150ms', tx: 84, ty: 0 },
  ];

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[95] flex items-center justify-center pointer-events-none"
    >
      <div className={`relative ${closing ? 'mo-nudge-out' : 'mo-nudge-in'}`}>
        {confettiDots.map((dot, i) => (
          <span
            key={i}
            className={`mo-burst absolute top-1/2 left-1/2 w-2 h-2 -ml-1 -mt-1 rounded-full ${dot.color}`}
            style={{ '--tx': `${dot.tx}px`, '--ty': `${dot.ty}px`, animationDelay: dot.delay } as React.CSSProperties}
          />
        ))}
        <div className="relative flex items-center gap-2.5 px-5 py-3.5 rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center animate-bounce motion-reduce:animate-none">
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
