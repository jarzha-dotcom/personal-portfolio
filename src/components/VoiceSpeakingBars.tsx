import React from 'react';

/**
 * Indikator kecil "3 batang" yang gerak (equalizer sederhana) buat gantiin
 * ikon statis pas audio TTS lagi diputar — dipasang gantiin <Square> di
 * ChatWidget.tsx / ChatWidgetCV.tsx / AIChatbotShowcase.tsx.
 *
 * `degraded` (voiceDegraded dari useVoiceChat) diredupkan opacity-nya kalau
 * true, biar user ngeh secara halus kalau kualitas suara yang lagi diputar
 * bukan tier terbaik (fallback ke Web Speech browser, atau GCP turun tier).
 *
 * Cuma pakai `animate-bounce` bawaan Tailwind (core utility, pasti ada di
 * config manapun) + inline `animationDelay` buat efek "gelombang" — gak
 * butuh custom keyframes di tailwind.config.
 */
export function VoiceSpeakingBars({
  degraded = false,
  className = '',
}: {
  degraded?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-end gap-[2px] h-3 ${degraded ? 'opacity-50' : ''} ${className}`}
      aria-hidden="true"
    >
      <span className="w-[2px] h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-[2px] h-3 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-[2px] h-2.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </span>
  );
}
