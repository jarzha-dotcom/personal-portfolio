/**
 * useVoiceChat.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * State & handler Voice Chat (STT mic + TTS speaker) yang sebelumnya
 * diduplikasi hampir identik di ChatWidget.tsx, ChatWidgetCV.tsx, dan
 * AIChatbotShowcase.tsx: state isListening/speakingId/loadingSpeakId/
 * voiceSupport, plus handleMicClick & handleToggleSpeak.
 *
 * Perbaikan yang otomatis ikut ke ketiga tempat begitu pakai hook ini:
 * - handleToggleSpeak sekarang menghentikan mic (stopListening) dulu
 *   sebelum mulai bicara — simetris dengan handleMicClick yang sudah
 *   menghentikan TTS (stopSpeaking) sebelum mulai dengar. Sebelumnya cuma
 *   satu arah, jadi mic & audio TTS bisa aktif bersamaan kalau user tap
 *   tombol speaker manual saat mic masih mendengarkan.
 * - Cleanup saat unmount (stopListening + stopSpeaking) sekarang cuma
 *   didefinisikan sekali di sini, bukan diulang manual di tiap komponen.
 *
 * Voice/bahasa TIDAK ditentukan di dalam hook — sengaja diteruskan dari
 * pemanggil (handleToggleSpeak(id, text, voice)) supaya hook ini tetap
 * generik dipakai bot manapun (Zannah/Radit/Kania/Rajendra dst), bukan
 * hook yang tahu persona bot tertentu.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  speak,
  stopSpeaking,
  startListening,
  stopListening,
  isSpeechSupported,
} from '../services/voiceService';

interface UseVoiceChatOptions {
  /** Kode bahasa STT. Default 'id-ID'. */
  lang?: string;
  /**
   * Guard tambahan sebelum mic boleh mulai mendengar, mis. cegah mic aktif
   * saat bot masih membalas: `() => !isLoading && !isStreaming`.
   * Kalau tidak diisi, mic selalu boleh mulai (selama browser mendukung STT).
   */
  canListen?: () => boolean;
  /** Prefix label di console.warn saat STT error, biar gampang ditelusuri sumbernya. */
  logLabel?: string;
}

export function useVoiceChat(options: UseVoiceChatOptions = {}) {
  const { lang = 'id-ID', canListen, logLabel = 'useVoiceChat' } = options;

  const [isListening, setIsListening] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [loadingSpeakId, setLoadingSpeakId] = useState<string | null>(null);
  const [voiceSupport] = useState(() => isSpeechSupported());
  const stopListenRef = useRef<(() => void) | null>(null);

  // ⚠️ Cleanup mic & audio TTS yang mungkin masih aktif saat komponen unmount.
  useEffect(() => {
    return () => {
      stopListenRef.current?.();
      stopListenRef.current = null;
      stopListening();
      stopSpeaking();
    };
  }, []);

  /**
   * Toggle mic. `onResult(text, isFinal)` sama persis seperti ListenOptions
   * bawaan voiceService — komponen pemanggil yang tetap memegang tanggung
   * jawab menampilkan transkrip sementara (mis. setInputValue) dan
   * mengirim pesan saat isFinal, termasuk logika "tunda kalau bot lagi
   * mengetik" kalau komponen itu butuh itu (lihat catatan di tiap file).
   */
  const handleMicClick = useCallback(
    (onResult: (text: string, isFinal: boolean) => void) => {
      if (isListening) {
        stopListenRef.current?.();
        stopListenRef.current = null;
        setIsListening(false);
        return;
      }
      if (!voiceSupport.stt) return; // tombol biasanya sudah disabled, ini jaga-jaga
      if (canListen && !canListen()) return;

      stopSpeaking(); // jangan sampai TTS & mic aktif bersamaan
      setSpeakingId(null);

      const cleanup = startListening({
        lang,
        onStart: () => setIsListening(true),
        onResult,
        onEnd: () => {
          setIsListening(false);
          stopListenRef.current = null;
        },
        onError: (err) => {
          console.warn(`[${logLabel}] STT error:`, err);
          setIsListening(false);
          stopListenRef.current = null;
        },
      });
      stopListenRef.current = cleanup;
    },
    [isListening, voiceSupport.stt, canListen, lang, logLabel]
  );

  /** Toggle putar/berhenti TTS untuk satu pesan. `voice` = nama voice GCP persona bot. */
  const handleToggleSpeak = useCallback(
    async (messageId: string, text: string, voice?: string) => {
      if (speakingId === messageId) {
        stopSpeaking();
        setSpeakingId(null);
        return;
      }

      // Simetris dengan handleMicClick: matikan mic dulu supaya audio TTS
      // tidak ikut tertangkap balik oleh speech recognition.
      stopListenRef.current?.();
      stopListenRef.current = null;
      setIsListening(false);

      setLoadingSpeakId(messageId);
      await speak(text, {
        voice,
        onStart: () => {
          setLoadingSpeakId(null);
          setSpeakingId(messageId);
        },
        onEnd: () => {
          setLoadingSpeakId(null);
          setSpeakingId((current) => (current === messageId ? null : current));
        },
        onError: () => {
          setLoadingSpeakId(null);
          setSpeakingId(null);
        },
      });
    },
    [speakingId]
  );

  /** Matikan mic & TTS langsung, tanpa toggle logic — dipakai mis. saat widget chat ditutup. */
  const stopAll = useCallback(() => {
    stopListenRef.current?.();
    stopListenRef.current = null;
    setIsListening(false);
    stopSpeaking();
    setSpeakingId(null);
    setLoadingSpeakId(null);
  }, []);

  return {
    isListening,
    speakingId,
    loadingSpeakId,
    voiceSupport,
    handleMicClick,
    handleToggleSpeak,
    stopAll,
  };
}
