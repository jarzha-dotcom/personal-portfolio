/**
 * voiceService.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Utility untuk fitur Voice Chat: Speech-to-Text (STT) & Text-to-Speech (TTS).
 *
 * TTS strategy (graceful degradation):
 * 1. Coba /api/tts (Google Cloud TTS Neural/Wavenet) dulu.
 * 2. Kalau gagal/tidak tersedia (GCP_API_KEY belum dipasang, rate limit, dsb),
 *    otomatis fallback ke Web Speech Synthesis bawaan browser.
 *
 * STT hanya pakai Web Speech API (webkitSpeechRecognition / SpeechRecognition)
 * karena GCP Speech-to-Text streaming butuh setup yang lebih berat (belum di-scope).
 *
 * Semua fungsi di sini singleton-safe: memanggil speak()/startListening() baru
 * otomatis menghentikan audio/listening session sebelumnya, supaya tidak ada
 * audio bertumpuk atau mic ganda yang aktif bersamaan.
 */

import { normalizeIndonesianForSpeech } from './speechNormalizer';
// Re-export supaya file lain yang masih import dari voiceService tidak putus.
export { normalizeIndonesianForSpeech };

// ── Types ──────────────────────────────────────────────────────────────────────

export type VoiceSource = 'gcp' | 'browser' | 'none';

export interface SpeakOptions {
  /** Nama voice GCP, mis. 'id-ID-Wavenet-A'. Default: DEFAULT_GCP_VOICE */
  voice?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: unknown) => void;
  /**
   * Dipanggil sekali begitu source audio final (gcp/browser) diketahui —
   * sebelum audio benar-benar mulai diputar. `degraded: true` artinya
   * kualitas suara turun dari yang diminta (voice tier GCP turun, atau
   * kepaksa fallback ke Web Speech browser). Berguna buat UI kasih
   * indikator halus ("suara sederhana") tanpa perlu ubah SpeakOptions lain.
   */
  onSourceResolved?: (info: {
    source: VoiceSource;
    degraded: boolean;
    remainingQuota?: number;
  }) => void;
}

export interface ListenOptions {
  lang?: string;
  onResult: (text: string, isFinal: boolean) => void;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: unknown) => void;
}

export interface SpeechSupport {
  /** Speech-to-Text (mic) didukung browser ini */
  stt: boolean;
  /** Web Speech Synthesis (fallback TTS) didukung browser ini */
  ttsBrowser: boolean;
}

// Konfigurasi Suara berdasarkan Persona Bot (Google Cloud Text-to-Speech Chirp 3 HD):
// Ini cuma voice PILIHAN/default per bot -- backend (api/tts.ts) yang urus
// fallback berjenjang: Chirp 3 HD -> Wavenet -> Standard -> (kalau semua gagal)
// frontend ini yang fallback ke Web Speech browser. Tiap tier Chirp & Wavenet
// di-gate kuota bulanan sendiri (lihat api/lib/ttsQuota.ts), jadi kalaupun
// nama voice di bawah ini "diminta", yang beneran dipakai bisa turun tier
// otomatis kalau kuota Chirp bulan ini abis -- ditandai lewat `degraded: true`
// di SpeakOptions.onSourceResolved.
// NB: cek ulang nama voice Chirp 3 HD id-ID ini di GCP Console sebelum deploy.
// - Zannah:   Cewek (Ramah, Cerdas, Konsultatif) -> id-ID-Chirp3-HD-Aoede
// - Radit:    Cowok (Tenang, Sigap, Direktori/Standby) -> id-ID-Chirp3-HD-Charon
// - Kania:    Cewek (Hangat, Detail, Asisten CV) -> id-ID-Chirp3-HD-Despina
// - Rajendra: Cowok (Portfolio AI Assistant) -> id-ID-Chirp3-HD-Puck
export const BOT_VOICES = {
  ZANNAH: 'id-ID-Chirp3-HD-Aoede',    // Cewek (Female)
  RADIT: 'id-ID-Chirp3-HD-Charon',    // Cowok (Male)
  KANIA: 'id-ID-Chirp3-HD-Despina',   // Cewek (Female)
  RAJENDRA: 'id-ID-Chirp3-HD-Puck',   // Cowok (Male)
} as const;

export const DEFAULT_GCP_VOICE = BOT_VOICES.ZANNAH;

const MAX_CACHE_ENTRIES = 60;
const MAX_TTS_CHARS = 800;

// ── State (module-level singleton) ────────────────────────────────────────────

interface GCPAudioResult {
  dataUrl: string;
  degraded: boolean;
  remainingQuota?: number;
}

// key: `${voice}::${text}` -> hasil GCP TTS (data URL + info degraded/kuota)
const audioCache = new Map<string, GCPAudioResult>();
let currentAudio: HTMLAudioElement | null = null;
let currentUtterance: SpeechSynthesisUtterance | null = null;
let recognitionInstance: SpeechRecognitionLike | null = null;
// AbortController request TTS yang sedang berjalan (kalau ada) — dibatalkan
// otomatis begitu speak()/stopSpeaking() baru dipanggil, biar gak ada race
// condition audio lama nimpa audio baru pas user cepat ganti-ganti pesan.
let currentAbortController: AbortController | null = null;
// Dinaikkan tiap kali speak() dipanggil. Dipakai buat cek "apakah hasil
// fetch ini masih relevan" begitu fetch selesai — kalau sudah ada speak()
// yang lebih baru mulai selagi kita nunggu network, hasil yang lama dibuang.
let requestSeq = 0;

// Minimal type shim — Web Speech API belum punya tipe resmi di lib.dom.d.ts
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: any) => void) | null;
  onresult: ((event: any) => void) | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Potong teks ke maksimal `maxChars`, tapi coba cari batas kalimat terakhir
 * (., !, ?) dalam batas itu dulu supaya gak kepotong di tengah kalimat.
 * Kalau gak ketemu batas kalimat yang cukup jauh, fallback potong di batas
 * kata terakhir (biar gak motong di tengah kata) dan kasih tanda "…".
 */
function truncateAtSentenceBoundary(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;

  const slice = text.slice(0, maxChars);
  const lastSentenceEnd = Math.max(
    slice.lastIndexOf('. '),
    slice.lastIndexOf('! '),
    slice.lastIndexOf('? '),
    slice.lastIndexOf('.\n'),
  );

  // Cuma pakai batas kalimat itu kalau gak motong kebanyakan (masih di atas
  // 40% dari maxChars) — kalau kalimat pertama aja udah lebih panjang dari
  // maxChars, mending fallback ke batas kata daripada motong nyaris kosong.
  if (lastSentenceEnd > maxChars * 0.4) {
    return slice.slice(0, lastSentenceEnd + 1).trim();
  }

  const lastSpace = slice.lastIndexOf(' ');
  const safeSlice = lastSpace > maxChars * 0.4 ? slice.slice(0, lastSpace) : slice;
  return `${safeSlice.trim()}…`;
}

/**
 * Bersihkan markdown/simbol/URL dan normalisasi singkatan/mata uang sebelum
 * teks dikirim ke TTS agar dibaca natural (mis. "800 ribu rupiah", bukan "rupiah 800 rb").
 */
export function stripMarkdownForSpeech(raw: string): string {
  const cleaned = raw
    // Link markdown HARUS diproses sebelum URL polos, kalau tidak "[teks](https://x)"
    // rusak jadi "[teks](". URL polos (termasuk wa.me) dibiarkan: normalizer yang urus.
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    // Hanya heading di awal baris; "#1" (nomor) dibiarkan untuk normalizer.
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[_~]/g, '')
    // Emoji & simbol pictographic umum
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  const normalized = normalizeIndonesianForSpeech(cleaned);

  // Truncate SETELAH normalisasi, karena angka -> kata membuat teks lebih panjang.
  return truncateAtSentenceBoundary(normalized, MAX_TTS_CHARS);
}

function cacheKey(text: string, voice: string): string {
  return `${voice}::${text}`;
}

/** Simpan hasil TTS di cache. LRU: kalau sudah ada, re-insert supaya posisinya
 * "paling baru dipakai" (Map JS mempertahankan urutan insert). */
function rememberInCache(key: string, result: GCPAudioResult): void {
  if (audioCache.has(key)) audioCache.delete(key);
  audioCache.set(key, result);
  if (audioCache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = audioCache.keys().next().value;
    if (oldestKey) audioCache.delete(oldestKey);
  }
}

/** Cek dukungan browser untuk STT & TTS fallback. Aman dipanggil di SSR (selalu false). */
export function isSpeechSupported(): SpeechSupport {
  if (typeof window === 'undefined') {
    return { stt: false, ttsBrowser: false };
  }
  const w = window as unknown as {
    SpeechRecognition?: unknown;
    webkitSpeechRecognition?: unknown;
    speechSynthesis?: unknown;
  };
  return {
    stt: !!(w.SpeechRecognition || w.webkitSpeechRecognition),
    ttsBrowser: !!w.speechSynthesis,
  };
}

// ── TTS: playback control ────────────────────────────────────────────────────

/** Hentikan audio GCP yang sedang main DAN speech synthesis browser (siapa pun yang aktif).
 * Juga membatalkan request /api/tts yang masih in-flight (kalau ada), supaya
 * gak ada network call kebuang percuma & gak ada race condition audio lama
 * nimpa audio baru. */
export function stopSpeaking(): void {
  if (currentAbortController) {
    currentAbortController.abort();
    currentAbortController = null;
  }
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio.onended = null;
    currentAudio.onerror = null;
    currentAudio = null;
  }
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  currentUtterance = null;
}

/** True kalau ada audio (GCP atau browser) yang sedang diputar saat ini. */
export function isSpeakingNow(): boolean {
  if (currentAudio && !currentAudio.paused) return true;
  if (typeof window !== 'undefined' && window.speechSynthesis?.speaking) return true;
  return false;
}

async function fetchGCPAudio(text: string, voice: string, signal?: AbortSignal): Promise<GCPAudioResult> {
  const key = cacheKey(text, voice);
  const cached = audioCache.get(key);
  if (cached) {
    // LRU touch: pindahkan ke posisi "paling baru dipakai" biar gak gampang ke-evict.
    audioCache.delete(key);
    audioCache.set(key, cached);
    return cached;
  }

  const response = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice }),
    signal,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `TTS_HTTP_${response.status}`);
  }

  const data = await response.json();
  if (!data.audioContent) throw new Error('TTS_EMPTY_AUDIO');

  const result: GCPAudioResult = {
    dataUrl: `data:audio/mp3;base64,${data.audioContent}`,
    degraded: !!data.degraded,
    remainingQuota: typeof data.remainingQuota === 'number' ? data.remainingQuota : undefined,
  };
  rememberInCache(key, result);
  return result;
}

function speakWithBrowser(text: string, opts: SpeakOptions): VoiceSource {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    opts.onError?.(new Error('SPEECH_SYNTHESIS_UNSUPPORTED'));
    opts.onEnd?.();
    return 'none';
  }

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'id-ID';
  utter.rate = 1;
  utter.pitch = 1;

  // Coba pilih voice Bahasa Indonesia kalau tersedia di browser
  const voices = window.speechSynthesis.getVoices();
  const idVoice = voices.find((v) => v.lang?.toLowerCase().startsWith('id'));
  if (idVoice) utter.voice = idVoice;

  utter.onstart = () => opts.onStart?.();
  utter.onend = () => {
    currentUtterance = null;
    opts.onEnd?.();
  };
  utter.onerror = (e) => {
    currentUtterance = null;
    opts.onError?.(e);
    opts.onEnd?.();
  };

  currentUtterance = utter;
  window.speechSynthesis.speak(utter);
  return 'browser';
}

/**
 * Ucapkan teks. Otomatis strip markdown, coba GCP TTS dulu, fallback ke
 * Web Speech Synthesis kalau GCP gagal/tidak tersedia/audio-nya diblok
 * autoplay browser. Menghentikan audio sebelumnya (kalau ada) sebelum
 * mulai yang baru.
 *
 * Aman dipanggil berturut-turut dengan cepat (mis. user klik pesan A lalu
 * langsung klik pesan B sebelum fetch A selesai): panggilan yang lebih tua
 * otomatis dibatalkan (fetch di-abort & hasilnya dibuang diam-diam tanpa
 * memicu callback), jadi gak ada audio lama yang nimpa audio baru.
 */
export async function speak(rawText: string, opts: SpeakOptions = {}): Promise<VoiceSource> {
  const text = stripMarkdownForSpeech(rawText);
  stopSpeaking();

  if (!text) {
    opts.onEnd?.();
    return 'none';
  }

  const voice = opts.voice || DEFAULT_GCP_VOICE;

  // Token unik buat panggilan ini. Kalau ada speak() lain mulai duluan
  // sebelum fetch kita selesai, requestSeq bakal berubah dan kita tau hasil
  // kita udah "basi" — jangan sentuh currentAudio atau panggil callback.
  const myToken = ++requestSeq;
  const controller = new AbortController();
  currentAbortController = controller;

  let gcpResult: GCPAudioResult | null = null;

  try {
    gcpResult = await fetchGCPAudio(text, voice, controller.signal);
  } catch (err) {
    if (controller.signal.aborted) {
      // Dibatalkan karena ada speak() baru — diam-diam berhenti di sini,
      // request yang baru itu yang bakal urus onStart/onEnd-nya sendiri.
      return 'none';
    }
    console.warn('[voiceService] GCP TTS gagal, fallback ke browser speech:', err);
  }

  // Selagi kita nunggu fetch (walau berhasil), bisa jadi ada speak() lain
  // yang udah lebih dulu mulai & selesai. Kalau begitu, buang hasil ini.
  if (myToken !== requestSeq) return 'none';

  if (gcpResult) {
    opts.onSourceResolved?.({
      source: 'gcp',
      degraded: gcpResult.degraded,
      remainingQuota: gcpResult.remainingQuota,
    });

    try {
      const audio = new Audio(gcpResult.dataUrl);
      currentAudio = audio;
      audio.onplay = () => opts.onStart?.();
      audio.onended = () => {
        currentAudio = null;
        opts.onEnd?.();
      };
      audio.onerror = () => {
        currentAudio = null;
        opts.onError?.(new Error('AUDIO_PLAYBACK_ERROR'));
        opts.onEnd?.();
      };
      await audio.play();
      return 'gcp';
    } catch (playErr) {
      // Kemungkinan besar autoplay diblokir browser (NotAllowedError) karena
      // play() dipanggil di luar user-gesture langsung (mis. auto-speak
      // balasan bot), atau error decode lain. Bersihkan state audio yang
      // gagal ini dulu supaya gak nyangkut, baru coba fallback browser.
      console.warn('[voiceService] Audio GCP gagal diputar (mungkin autoplay diblokir), fallback ke browser speech:', playErr);
      if (currentAudio) {
        currentAudio.onended = null;
        currentAudio.onerror = null;
        currentAudio = null;
      }
    }
  }

  if (myToken !== requestSeq) return 'none';

  opts.onSourceResolved?.({ source: 'browser', degraded: true });
  return speakWithBrowser(text, opts);
}

// ── STT: Speech-to-Text ────────────────────────────────────────────────────────

/**
 * Mulai mendengarkan mic. Return fungsi cleanup untuk stop manual, atau null
 * kalau browser tidak mendukung SpeechRecognition (opts.onError akan dipanggil).
 */
export function startListening(opts: ListenOptions): (() => void) | null {
  if (typeof window === 'undefined') return null;

  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  const SpeechRecognitionCtor = w.SpeechRecognition || w.webkitSpeechRecognition;

  if (!SpeechRecognitionCtor) {
    opts.onError?.(new Error('STT_UNSUPPORTED'));
    return null;
  }

  stopListening();

  const recognition = new SpeechRecognitionCtor();
  recognition.lang = opts.lang || 'id-ID';
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => opts.onStart?.();

  recognition.onresult = (event: any) => {
    let interim = '';
    let final = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        final += transcript;
      } else {
        interim += transcript;
      }
    }
    if (final) opts.onResult(final.trim(), true);
    else if (interim) opts.onResult(interim.trim(), false);
  };

  recognition.onerror = (event: any) => {
    opts.onError?.(event?.error || event);
  };

  recognition.onend = () => {
    recognitionInstance = null;
    opts.onEnd?.();
  };

  recognitionInstance = recognition;
  recognition.start();

  return () => stopListening();
}

/** Hentikan sesi mendengarkan mic yang sedang aktif (kalau ada). */
export function stopListening(): void {
  if (recognitionInstance) {
    try {
      recognitionInstance.stop();
    } catch {
      // ignore — instance mungkin sudah berhenti sendiri
    }
    recognitionInstance = null;
  }
}

/** True kalau sesi mic sedang aktif. */
export function isListeningNow(): boolean {
  return recognitionInstance !== null;
}