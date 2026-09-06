/**
 * useStreamingText.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Animasi "efek mengetik" balasan bot, sebelumnya diduplikasi hampir identik
 * sebagai streamBotMessage() (ChatWidget.tsx, ChatWidgetCV.tsx) dan
 * streamReply() (AIChatbotShowcase.tsx) — termasuk pola "Opsi A": TTS
 * dipicu paralel begitu animasi mulai (bukan menunggu animasi selesai),
 * dan animasi diperlambat saat balasan itu juga bakal dibacakan TTS, biar
 * teks yang muncul kira-kira selaras ritme suara alih-alih jauh lebih cepat.
 *
 * Nilai 80ms untuk mode voice sudah dites & dipilih manual oleh user
 * (bukan dihitung dari durasi audio — voiceService belum mengembalikan
 * durasi TTS ke pemanggil).
 */
import { useRef, useEffect, useCallback } from 'react';

interface StreamTextOptions {
  /** Dipanggil tiap tick dengan teks parsial & flag `isDone`. */
  onTick: (partialText: string, isDone: boolean) => void;
  /** True kalau balasan ini akan dibacakan TTS — animasi diperlambat. */
  isVoice?: boolean;
  /**
   * Dipanggil SEKALI di awal, sebelum tick pertama — tempat memicu TTS
   * paralel (Opsi A). Komponen pemanggil yang menentukan kapan ini perlu
   * dipanggil (biasanya hanya kalau isVoice true).
   */
  onStart?: () => void;
}

const TEXT_SPEED_MS = 18;
const VOICE_SPEED_MS = 80;

export function useStreamingText() {
  const intervalsRef = useRef<ReturnType<typeof setInterval>[]>([]);

  // ⚠️ Cleanup semua interval yang mungkin masih jalan saat komponen unmount,
  // supaya tidak ada setMessages() dipanggil ke komponen yang sudah hilang.
  useEffect(() => {
    return () => {
      intervalsRef.current.forEach(clearInterval);
      intervalsRef.current = [];
    };
  }, []);

  const streamText = useCallback((fullText: string, opts: StreamTextOptions) => {
    const { onTick, isVoice = false, onStart } = opts;
    onStart?.();

    let currentIndex = 0;
    const totalLength = fullText.length;

    // Voice mode: 1 karakter/tick, 80ms — dilambatin biar teks nyaris
    // selaras ritme TTS. Text mode: chunk lebih besar & lebih cepat seperti
    // sebelumnya, supaya teks panjang tidak lama-lama muncul saat cuma dibaca.
    const chunkSize = isVoice ? 1 : totalLength > 280 ? 3 : totalLength > 120 ? 2 : 1;
    const speedMs = isVoice ? VOICE_SPEED_MS : TEXT_SPEED_MS;

    const intervalId = setInterval(() => {
      currentIndex += chunkSize;
      if (currentIndex >= totalLength) {
        clearInterval(intervalId);
        intervalsRef.current = intervalsRef.current.filter((id) => id !== intervalId);
        onTick(fullText, true);
      } else {
        onTick(fullText.slice(0, currentIndex), false);
      }
    }, speedMs);

    intervalsRef.current.push(intervalId);

    // Cleanup manual (mis. dipanggil ulang sebelum animasi sebelumnya selesai)
    return () => {
      clearInterval(intervalId);
      intervalsRef.current = intervalsRef.current.filter((id) => id !== intervalId);
    };
  }, []);

  return streamText;
}
