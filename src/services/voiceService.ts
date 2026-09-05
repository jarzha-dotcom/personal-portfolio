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

// ── Types ──────────────────────────────────────────────────────────────────────

export type VoiceSource = 'gcp' | 'browser' | 'none';

export interface SpeakOptions {
  /** Nama voice GCP, mis. 'id-ID-Wavenet-A'. Default: DEFAULT_GCP_VOICE */
  voice?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: unknown) => void;
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

// Konfigurasi Suara berdasarkan Persona Bot (Google DeepMind Chirp3 HD):
// - Zannah: Cewek (Ramah, Cerdas, Konsultatif)
// - Radit:  Cowok (Tenang, Sigap, Direktori/Standby)
// - Kania:  Cewek (Hangat, Detail, Asisten CV)
export const BOT_VOICES = {
  ZANNAH: 'id-ID-Chirp3-HD-Zephyr', // Cewek
  RADIT: 'id-ID-Chirp3-HD-Fenrir',   // Cowok
  KANIA: 'id-ID-Chirp3-HD-Gacrux',  // Cewek
} as const;

export const DEFAULT_GCP_VOICE = BOT_VOICES.ZANNAH;

const MAX_CACHE_ENTRIES = 60;
const MAX_TTS_CHARS = 800;

// ── State (module-level singleton) ────────────────────────────────────────────

const audioCache = new Map<string, string>(); // key: `${voice}::${text}` -> data URL base64
let currentAudio: HTMLAudioElement | null = null;
let currentUtterance: SpeechSynthesisUtterance | null = null;
let recognitionInstance: SpeechRecognitionLike | null = null;

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
 * Normalisasi teks bahasa Indonesia agar pelafalan TTS (Google Cloud & Browser)
 * terdengar natural, tidak membaca "Rp800rb" sebagai "rupiah 800 rb" atau singkatan aneh lainnya.
 */
export function normalizeIndonesianForSpeech(text: string): string {
  let s = text;

  // 1. Link & WhatsApp
  s = s.replace(/https?:\/\/(?:wa\.me\S*|\S+)/gi, ' tautan WhatsApp ');
  s = s.replace(/\bwa\.me\S*/gi, ' tautan WhatsApp ');
  s = s.replace(/\bWA\b/g, 'WhatsApp');

  // 2. Format Rentang Harga (Range): Rp1.5jt - Rp2.5jt / Rp800rb - 1.5jt
  s = s.replace(/Rp\s*(\d+(?:[.,]\d+)?)\s*(?:jt|juta)?\s*[-–—]\s*(?:Rp\s*)?(\d+(?:[.,]\d+)?)\s*(?:jt|juta)\b/gi, '$1 sampai $2 juta rupiah');
  s = s.replace(/Rp\s*(\d+(?:[.,]\d+)?)\s*(?:rb|ribu)?\s*[-–—]\s*(?:Rp\s*)?(\d+(?:[.,]\d+)?)\s*(?:rb|ribu)\b/gi, '$1 sampai $2 ribu rupiah');
  s = s.replace(/(\d+(?:[.,]\d+)?)\s*(?:jt|juta)\s*[-–—]\s*(\d+(?:[.,]\d+)?)\s*(?:jt|juta)\b/gi, '$1 sampai $2 juta');
  s = s.replace(/(\d+(?:[.,]\d+)?)\s*(?:rb|ribu)\s*[-–—]\s*(\d+(?:[.,]\d+)?)\s*(?:rb|ribu)\b/gi, '$1 sampai $2 ribu');

  // 3. Format Rentang Angka Umum (mis: 1-2 hari, 3-5 minggu, 7+ tahun)
  s = s.replace(/(\d+)\s*[-–—]\s*(\d+)\s*(hari|minggu|bulan|tahun|orang|item|halaman)/gi, '$1 sampai $2 $3');
  s = s.replace(/(\d+)\+\s*(tahun|bulan|hari|proyek|klien)/gi, '$1 $2 lebih');

  // 4. Format Mata Uang Rupiah dengan Jutaan (mis: Rp1.5jt, Rp 1,5 jt, Rp1.500.000, Rp2.000.000)
  s = s.replace(/Rp\s*(\d+)\.000\.000(?:,-\b)?/gi, '$1 juta rupiah');
  s = s.replace(/Rp\s*(\d+)\.500\.000(?:,-\b)?/gi, '$1,5 juta rupiah');
  s = s.replace(/Rp\s*(\d+(?:[.,]\d+)?)\s*(?:jt|juta)\b/gi, '$1 juta rupiah');

  // 5. Format Mata Uang Rupiah dengan Ribuan (mis: Rp800rb, Rp 800 rb, Rp800.000, Rp50.000)
  s = s.replace(/Rp\s*(\d+)\.000(?:,-\b)?/gi, '$1 ribu rupiah');
  s = s.replace(/Rp\s*(\d+(?:[.,]\d+)?)\s*(?:rb|ribu)\b/gi, '$1 ribu rupiah');
  s = s.replace(/Rp\s*(\d+(?:[.,]\d+)?)\s*(?:k|K)\b/gi, '$1 ribu rupiah');
  s = s.replace(/Rp\s*(\d+)(?:,-\b)?/gi, '$1 rupiah');

  // 6. Standalone angka ribuan / jutaan tanpa 'Rp' (mis: 800rb, 1.5jt, 500k)
  s = s.replace(/(\d+(?:[.,]\d+)?)\s*(?:jt|juta)\b/gi, '$1 juta');
  s = s.replace(/(\d+(?:[.,]\d+)?)\s*(?:rb|ribu)\b/gi, '$1 ribu');
  s = s.replace(/(\d+)\s*(?:k|K)\b/g, '$1 ribu');

  // 7. Nama Proyek & Portofolio Khusus
  s = s.replace(/\bB-Games\b|\bB Games\b|\bBGames\b/gi, 'Bi-Geims');
  s = s.replace(/\bAssets GMP\b|\bAsset GMP\b/gi, 'Aset J-M-P');
  s = s.replace(/\bPT GMP\b/gi, 'P-T J-M-P');

  // 8. Istilah Pemrograman & Tech Stack Multi-Kata (harus sebelum single-word)
  s = s.replace(/\bReact Native\b/gi, 'Riek Neitif');
  s = s.replace(/\bReact\.?js\b|\bReactJS\b|\bReact js\b/gi, 'Riek J-S');
  s = s.replace(/\bNext\.?js\b|\bNextJS\b|\bNext js\b/gi, 'Neks J-S');
  s = s.replace(/\bNode\.?js\b|\bNodeJS\b|\bNode js\b/gi, 'Noud J-S');
  s = s.replace(/\bVue\.?js\b|\bVueJS\b|\bVue js\b/gi, 'Vyu J-S');
  s = s.replace(/\bExpress\.?js\b|\bExpressJS\b|\bExpress js\b/gi, 'Ekspres J-S');
  s = s.replace(/\bTailwind\s*CSS\b|\bTailwindCSS\b/gi, 'Teilwind C-S-S');
  s = s.replace(/\bREST(?:ful)?\s*APIs?\b/gi, 'Rest A-P-I');
  s = s.replace(/\bWebSockets?\b/gi, 'Websoket');
  s = s.replace(/\bboardgame\.io\b/gi, 'Boardgame I-O');
  s = s.replace(/\bLucide\s*Icons?\b|\bLucide\b/gi, 'Lusid Aikon');
  s = s.replace(/\bSAP\s+Business\s+One\b/gi, 'S-A-P Bisnis Wan');
  s = s.replace(/\bPoint\s+of\s+Sales?\b/gi, 'Point of Seils');
  s = s.replace(/\bPivot\s+Tables?\b/gi, 'Pivot Teibel');
  s = s.replace(/\bTech\s*Stack\b/gi, 'Tekstek');
  s = s.replace(/\bLanding\s*Pages?\b/gi, 'Lending Peij');
  s = s.replace(/\bLive\s*Demos?\b/gi, 'Laif Demo');
  s = s.replace(/\bReal-?time\b/gi, 'Riltaym');
  s = s.replace(/\bFull-?stack\b/gi, 'Fulstek');
  s = s.replace(/\bFront-?end\b/gi, 'Front-en');
  s = s.replace(/\bBack-?end\b/gi, 'Bek-en');
  s = s.replace(/\bAPI\s*Keys?\b/gi, 'A-P-I Ki');
  s = s.replace(/\bWeb\s*Apps?\b/gi, 'Web-ep');
  s = s.replace(/\bMobile\s*Apps?\b/gi, 'Mobail-ep');

  // 9. Istilah Pemrograman & Tech Stack Tunggal
  s = s.replace(/\bReact\b/g, 'Riek');
  s = s.replace(/\bVite\b/gi, 'Vait');
  s = s.replace(/\bTypeScript\b|\bTypescript\b/gi, 'Taipskrip');
  s = s.replace(/\bJavaScript\b|\bJavascript\b/gi, 'Javaskrip');
  s = s.replace(/\bTailwind\b/gi, 'Teilwind');
  s = s.replace(/\bCapacitor\b/gi, 'Kapasitor');
  s = s.replace(/\bExpo\b/gi, 'Ekspo');
  s = s.replace(/\bPython\b/gi, 'Paiton');
  s = s.replace(/\bMySQL\b/gi, 'Mai Eskuel');
  s = s.replace(/\bPostgreSQL\b|\bPostgres\b/gi, 'Posgres Q-L');
  s = s.replace(/\bMongoDB\b/gi, 'Mongo D-B');
  s = s.replace(/\bSQLite\b/gi, 'Eskuel Lait');
  s = s.replace(/\bSQL\b/g, 'Eskuel');
  s = s.replace(/\bSupabase\b/gi, 'Superbeis');
  s = s.replace(/\bFirebase\b/gi, 'Fairbeis');
  s = s.replace(/\bGraphQL\b/gi, 'Graf Q-L');
  s = s.replace(/\bJSON\b/g, 'Jeison');
  s = s.replace(/\bGitHub\b|\bGithub\b/gi, 'Git-hab');
  s = s.replace(/\bGitLab\b|\bGitlab\b/gi, 'Git-lab');
  s = s.replace(/\bVercel\b/gi, 'Versel');
  s = s.replace(/\bNetlify\b/gi, 'Netlifai');
  s = s.replace(/\bDocker\b/gi, 'Doker');
  s = s.replace(/\bKubernetes\b/gi, 'Kubernetis');
  s = s.replace(/\bGemini\b/g, 'Jeminai');
  s = s.replace(/\bClaude\b/g, 'Klod');
  s = s.replace(/\bChatGPT\b/gi, 'Chet G-P-T');
  s = s.replace(/\bOpenAI\b/gi, 'Open A-I');
  s = s.replace(/\bChatbots?\b|\bChat\s*bot\b/gi, 'Chetbot');
  s = s.replace(/\bLLMs?\b/g, 'L-L-M');
  s = s.replace(/\bFrameworks?\b/gi, 'Freimwork');
  s = s.replace(/\bLibraries\b|\bLibrary\b/gi, 'Laibrari');
  s = s.replace(/\bDeployments?\b/gi, 'Diployment');
  s = s.replace(/\bDeploy\b/gi, 'Diploy');
  s = s.replace(/\bDebuggings?\b/gi, 'Dibaging');
  s = s.replace(/\bBugs?\b/gi, 'Bag');
  s = s.replace(/\bCachings?\b/gi, 'Keshing');
  s = s.replace(/\bCache\b/gi, 'Kesh');
  s = s.replace(/\bDashboard\b/gi, 'Deshboard');
  s = s.replace(/\bFlashcards?\b/gi, 'Fleshkard');

  // 10. Singkatan Bisnis, Audit, dan Dokumen
  s = s.replace(/\bVLOOKUP\b/gi, 'V-Lookup');
  s = s.replace(/\bXLOOKUP\b/gi, 'X-Lookup');
  s = s.replace(/\bExcel\b/gi, 'Eksel');
  s = s.replace(/\bPowerPoint\b/gi, 'Power Point');
  s = s.replace(/\bSAP\b/g, 'S-A-P');
  s = s.replace(/\bPOS\b/g, 'P-O-S');
  s = s.replace(/\bSOP\b/g, 'S-O-P');
  s = s.replace(/\bQC\b/g, 'Q-C');
  s = s.replace(/\bB2B\b/gi, 'Bi tu Bi');
  s = s.replace(/\bHRD\b/g, 'H-R-D');
  s = s.replace(/\bCV\b/g, 'C-V');
  s = s.replace(/\bHTML5\b/gi, 'H-T-M-L lima');
  s = s.replace(/\bHTML\b/g, 'H-T-M-L');
  s = s.replace(/\bCSS3\b/gi, 'C-S-S tiga');
  s = s.replace(/\bCSS\b/g, 'C-S-S');
  s = s.replace(/\bPHP\b/g, 'P-H-P');
  s = s.replace(/\bUI\/UX\b|\bUI-UX\b/gi, 'U-I U-X');
  s = s.replace(/\bUI\b/g, 'U-I');
  s = s.replace(/\bUX\b/g, 'U-X');
  s = s.replace(/\bSEO\b/g, 'S-E-O');
  s = s.replace(/\bSPA\b/g, 'S-P-A');
  s = s.replace(/\bPWA\b/g, 'P-W-A');
  s = s.replace(/\bSaaS\b/gi, 'Saas');
  s = s.replace(/\bDOM\b/g, 'D-O-M');
  s = s.replace(/\bAPI\b/g, 'A-P-I');
  s = s.replace(/\bSOW\b|\bSoW\b/g, 'Scope of Work');

  // 11. Singkatan Kata Bahasa Indonesia
  s = s.replace(/\bdll\.?/gi, 'dan lain-lain');
  s = s.replace(/\bdsb\.?/gi, 'dan sebagainya');
  s = s.replace(/\bdst\.?/gi, 'dan seterusnya');
  s = s.replace(/\bcth\.?/gi, 'contoh');
  s = s.replace(/\bttg\b/gi, 'tentang');
  s = s.replace(/\byg\b/gi, 'yang');
  s = s.replace(/\bdgn\b/gi, 'dengan');
  s = s.replace(/\butk\b/gi, 'untuk');
  s = s.replace(/\bsbg\b/gi, 'sebagai');
  s = s.replace(/\bblm\b/gi, 'belum');
  s = s.replace(/\bsdh\b/gi, 'sudah');
  s = s.replace(/\baja\b/gi, 'saja');
  s = s.replace(/\bgmn\b/gi, 'bagaimana');
  s = s.replace(/\bkpd\b/gi, 'kepada');

  // 12. Pengulangan kata angka 2 (mis: teman2 -> teman-teman)
  s = s.replace(/([a-zA-Z]+)2\b/g, '$1-$1');

  return s;
}

/**
 * Bersihkan markdown/simbol/URL dan normalisasi singkatan/mata uang sebelum
 * teks dikirim ke TTS agar dibaca natural (mis. "800 ribu rupiah", bukan "rupiah 800 rb").
 */
export function stripMarkdownForSpeech(raw: string): string {
  const cleaned = raw
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/#{1,6}\s?/g, '')
    .replace(/[_~]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Emoji & simbol pictographic umum
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  const normalized = normalizeIndonesianForSpeech(cleaned);

  return normalized
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, MAX_TTS_CHARS);
}

function cacheKey(text: string, voice: string): string {
  return `${voice}::${text}`;
}

function rememberInCache(key: string, dataUrl: string): void {
  audioCache.set(key, dataUrl);
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

/** Hentikan audio GCP yang sedang main DAN speech synthesis browser (siapa pun yang aktif). */
export function stopSpeaking(): void {
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

async function fetchGCPAudio(text: string, voice: string): Promise<string> {
  const key = cacheKey(text, voice);
  const cached = audioCache.get(key);
  if (cached) return cached;

  const response = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `TTS_HTTP_${response.status}`);
  }

  const data = await response.json();
  if (!data.audioContent) throw new Error('TTS_EMPTY_AUDIO');

  const dataUrl = `data:audio/mp3;base64,${data.audioContent}`;
  rememberInCache(key, dataUrl);
  return dataUrl;
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
 * Web Speech Synthesis kalau GCP gagal/tidak tersedia. Menghentikan audio
 * sebelumnya (kalau ada) sebelum mulai yang baru.
 */
export async function speak(rawText: string, opts: SpeakOptions = {}): Promise<VoiceSource> {
  const text = stripMarkdownForSpeech(rawText);
  stopSpeaking();

  if (!text) {
    opts.onEnd?.();
    return 'none';
  }

  const voice = opts.voice || DEFAULT_GCP_VOICE;

  try {
    const dataUrl = await fetchGCPAudio(text, voice);
    const audio = new Audio(dataUrl);
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
  } catch (err) {
    console.warn('[voiceService] GCP TTS gagal, fallback ke browser speech:', err);
    return speakWithBrowser(text, opts);
  }
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
