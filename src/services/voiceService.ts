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
 * Teks panjang (> MAX_TTS_CHARS setelah normalisasi) dipecah per kalimat jadi
 * beberapa potongan: potongan pertama sengaja pendek supaya suara cepat mulai,
 * potongan berikutnya diminta selagi potongan sebelumnya diputar (prefetch satu
 * potongan ke depan). Maksimal MAX_TTS_CHUNKS potongan per speak(); sisanya
 * tidak dibacakan dan pemanggil diberi tahu lewat SpeakOptions.onTruncated.
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
   *
   * Untuk teks multi-potongan, callback ini dipanggil sekali untuk potongan
   * pertama. Hanya kalau potongan berikutnya gagal dan sisanya dibacakan suara
   * browser, dipanggil sekali lagi dengan { source: 'browser', degraded: true }.
   */
  onSourceResolved?: (info: {
    source: VoiceSource;
    degraded: boolean;
    remainingQuota?: number;
  }) => void;
  /**
   * Dipanggil sekali kalau teks lebih panjang dari batas baca (MAX_TTS_CHUNKS
   * potongan) sehingga bagian akhirnya TIDAK dibacakan. UI bisa menampilkan
   * penanda "hanya sebagian yang dibacakan".
   */
  onTruncated?: () => void;
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
// fallback berjenjang: Chirp 3 HD -> Wavenet -> (kalau semua gagal)
// frontend ini yang fallback ke Web Speech browser. Tiap tier Chirp & Wavenet
// di-gate kuota bulanan sendiri (lihat api/_lib/ttsQuota.ts), jadi kalaupun
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
// Batas karakter per request ke /api/tts (samakan dengan MAX_CHARS di api/tts.ts).
const MAX_TTS_CHARS = 800;
// Teks panjang: potongan PERTAMA dibuat pendek supaya suara cepat mulai. Kalimat
// yang tidak muat di potongan ini pindah ke potongan berikutnya.
const FIRST_CHUNK_CHARS = 350;
// Maksimal request /api/tts per speak(). Dijaga kecil karena server membatasi
// 10 request/menit/IP dan tiap karakter menghabiskan kuota bulanan.
const MAX_TTS_CHUNKS = 3;
// Batas waktu tunggu /api/tts di sisi client sebelum fallback ke suara browser.
const TTS_FETCH_TIMEOUT_MS = 10_000;
// Kalau server balas 503 (GCP_TTS=false / API key kosong), jangan tanya lagi
// selama jeda ini -- langsung suara browser tanpa round-trip sia-sia.
const GCP_BACKOFF_MS = 5 * 60 * 1000;

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
// AbortController semua request TTS yang sedang berjalan (satu per potongan) —
// dibatalkan otomatis begitu speak()/stopSpeaking() baru dipanggil, biar gak ada
// race condition audio lama nimpa audio baru pas user cepat ganti-ganti pesan.
const inflightControllers = new Set<AbortController>();
// Dinaikkan tiap kali speak() dipanggil. Dipakai buat cek "apakah hasil
// fetch ini masih relevan" begitu fetch selesai — kalau sudah ada speak()
// yang lebih baru mulai selagi kita nunggu network, hasil yang lama dibuang.
let requestSeq = 0;
// Token speak() yang sedang membacakan lewat GCP (0 = tidak ada). Dipakai
// isSpeakingNow() supaya tetap "true" di celah singkat antar potongan, saat
// elemen audio berhenti sebentar menunggu potongan berikutnya.
let gcpSessionToken = 0;
let gcpUnavailableUntil = 0;

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
 * Bersihkan markdown/simbol/URL lalu normalisasi angka/singkatan/istilah teknis
 * agar dibaca natural (mis. "800 ribu rupiah", bukan "rupiah 800 rb").
 * TIDAK memotong panjang teks -- pemotongan/pemecahan dilakukan terpisah.
 */
export function prepareSpeechText(raw: string): string {
  const cleaned = raw
    // Link markdown HARUS diproses sebelum URL polos, kalau tidak "[teks](https://x)"
    // rusak jadi "[teks](". URL polos (termasuk wa.me) dibiarkan: normalizer yang urus.
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    // Penanda list/kutipan di awal baris ("* item", "- item", "• item", "> kutipan").
    // Harus sebelum penanganan *italic*, kalau tidak "* a\n* b" salah dipasangkan.
    .replace(/^[ \t]*[*\-•][ \t]+/gm, '')
    .replace(/^[ \t]*>[ \t]?/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    // Hanya heading di awal baris; "#1" (nomor) dibiarkan untuk normalizer.
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[_~]/g, '')
    // Emoji & simbol pictographic umum (+ variation selector & ZWJ sisa emoji)
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, '')
    // Baris baru = jeda: baris yang tidak berakhir tanda baca diberi titik supaya
    // item list / judul tidak terbaca menyambung dengan baris berikutnya.
    .replace(/([^.!?:;,\s])[ \t]*\n+\s*/g, '$1. ')
    .replace(/\s*\n\s*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return normalizeIndonesianForSpeech(cleaned);
}

/**
 * Versi lama: bersihkan + normalisasi + POTONG ke MAX_TTS_CHARS. Dipertahankan
 * supaya pemanggil lain tidak putus; speak() sendiri memakai prepareSpeechText +
 * splitIntoSpeechChunks supaya teks panjang tetap terbaca.
 */
export function stripMarkdownForSpeech(raw: string): string {
  // Truncate SETELAH normalisasi, karena angka -> kata membuat teks lebih panjang.
  return truncateAtSentenceBoundary(prepareSpeechText(raw), MAX_TTS_CHARS);
}

/**
 * Pecah satu kalimat yang lebih panjang dari `max` di koma/titik-koma/titik-dua
 * terdekat (hanya kalau tidak membuang lebih dari 60% ruang), lalu spasi, dan
 * terakhir potong keras.
 */
function breakLongSentence(sentence: string, max: number): string[] {
  const out: string[] = [];
  let rest = sentence.trim();
  while (rest.length > max) {
    const window = rest.slice(0, max);
    const softBreak = Math.max(window.lastIndexOf(', '), window.lastIndexOf('; '), window.lastIndexOf(': '));
    let cut: number;
    if (softBreak > max * 0.4) {
      cut = softBreak + 1;
    } else {
      const space = window.lastIndexOf(' ');
      cut = space > max * 0.4 ? space : max;
    }
    out.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) out.push(rest);
  return out;
}

/**
 * Pecah teks hasil prepareSpeechText() jadi potongan (masing-masing <= MAX_TTS_CHARS)
 * untuk dibacakan berurutan.
 *  - Teks <= MAX_TTS_CHARS  -> satu potongan (perilaku sama seperti sebelumnya).
 *  - Lebih panjang          -> dipecah per kalimat; potongan pertama <= FIRST_CHUNK_CHARS
 *    (kecuali satu kalimat pertama yang memang lebih panjang) supaya suara cepat mulai.
 *  - Maksimal MAX_TTS_CHUNKS potongan; sisanya dibuang dan `truncated` = true.
 */
export function splitIntoSpeechChunks(text: string): { chunks: string[]; truncated: boolean } {
  const clean = text.trim();
  if (!clean) return { chunks: [], truncated: false };
  if (clean.length <= MAX_TTS_CHARS) return { chunks: [clean], truncated: false };

  const limitFor = (index: number) => (index === 0 ? FIRST_CHUNK_CHARS : MAX_TTS_CHARS);
  const sentences = clean.split(/(?<=[.!?…])\s+/).filter(Boolean);

  const chunks: string[] = [];
  let current = '';
  let truncated = false;

  outer: for (const sentence of sentences) {
    for (const piece of breakLongSentence(sentence, MAX_TTS_CHARS)) {
      const candidate = current ? `${current} ${piece}` : piece;
      if (!current || candidate.length <= limitFor(chunks.length)) {
        current = candidate;
        continue;
      }
      chunks.push(current);
      if (chunks.length >= MAX_TTS_CHUNKS) {
        truncated = true;
        current = '';
        break outer;
      }
      current = piece;
    }
  }
  if (current) chunks.push(current);

  return { chunks, truncated };
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

/**
 * Hentikan audio GCP yang sedang main DAN speech synthesis browser (siapa pun yang aktif).
 * Juga membatalkan request /api/tts yang masih in-flight dan meng-invalidasi semua
 * speak() yang masih menunggu (fetch/play), jadi tidak ada audio/suara browser yang
 * "bangkit" setelah stop.
 *
 * KONTRAK: speak() yang diinterupsi (oleh stopSpeaking() atau speak() baru) TIDAK
 * memanggil onEnd/onError -- di jalur GCP maupun browser. Pemanggil yang menekan
 * stop bertanggung jawab mereset state UI-nya sendiri.
 */
export function stopSpeaking(): void {
  requestSeq++;
  for (const controller of inflightControllers) controller.abort();
  inflightControllers.clear();
  if (currentAudio) {
    currentAudio.onplay = null;
    currentAudio.onended = null;
    currentAudio.onerror = null;
    currentAudio.pause();
    currentAudio.currentTime = 0;
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
  if (gcpSessionToken !== 0 && gcpSessionToken === requestSeq) return true;
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

  if (Date.now() < gcpUnavailableUntil) throw new Error('TTS_TEMPORARILY_DISABLED');

  const response = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice }),
    signal,
  });

  if (!response.ok) {
    if (response.status === 503) gcpUnavailableUntil = Date.now() + GCP_BACKOFF_MS;
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

/**
 * Minta audio satu potongan dengan timeout sendiri. Controller-nya didaftarkan di
 * inflightControllers supaya stopSpeaking() bisa membatalkan semua potongan sekaligus.
 */
function requestGCPChunk(text: string, voice: string): Promise<GCPAudioResult> {
  const controller = new AbortController();
  inflightControllers.add(controller);
  const timeoutId = setTimeout(() => controller.abort(), TTS_FETCH_TIMEOUT_MS);
  return fetchGCPAudio(text, voice, controller.signal).finally(() => {
    clearTimeout(timeoutId);
    inflightControllers.delete(controller);
  });
}

function speakWithBrowser(
  text: string,
  opts: SpeakOptions,
  token: number,
  /** true = melanjutkan bacaan yang sudah dimulai GCP: jangan panggil onStart lagi. */
  continuing = false,
): VoiceSource {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    opts.onError?.(new Error('SPEECH_SYNTHESIS_UNSUPPORTED'));
    opts.onEnd?.();
    return 'none';
  }

  opts.onSourceResolved?.({ source: 'browser', degraded: true });

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'id-ID';
  utter.rate = 1;
  utter.pitch = 1;

  // Coba pilih voice Bahasa Indonesia kalau tersedia di browser
  const voices = window.speechSynthesis.getVoices();
  const idVoice = voices.find((v) => v.lang?.toLowerCase().startsWith('id'));
  if (idVoice) utter.voice = idVoice;

  // Handler utterance lama bisa datang TERLAMBAT (setelah cancel()/speak() baru).
  // Token menjamin event basi tidak menyentuh state maupun callback milik speak() baru.
  const isStale = () => token !== requestSeq;

  utter.onstart = () => {
    if (!isStale() && !continuing) opts.onStart?.();
  };
  utter.onend = () => {
    if (currentUtterance === utter) currentUtterance = null;
    if (!isStale()) opts.onEnd?.();
  };
  utter.onerror = (e) => {
    if (currentUtterance === utter) currentUtterance = null;
    if (isStale()) return;
    // 'canceled'/'interrupted' = dihentikan sengaja, bukan error sungguhan.
    if (e.error === 'canceled' || e.error === 'interrupted') {
      opts.onEnd?.();
      return;
    }
    opts.onError?.(e);
    opts.onEnd?.();
  };

  currentUtterance = utter;
  window.speechSynthesis.speak(utter);
  return 'browser';
}

/**
 * Ucapkan teks. Otomatis strip markdown, coba GCP TTS dulu, fallback ke
 * Web Speech Synthesis kalau GCP gagal/timeout/tidak tersedia/audio-nya diblok
 * autoplay browser. Menghentikan audio sebelumnya (kalau ada) sebelum
 * mulai yang baru.
 *
 * Teks panjang dibacakan sebagai beberapa potongan berurutan (lihat
 * splitIntoSpeechChunks). Kalau potongan ke-2 dst. gagal, sisanya dibacakan
 * suara browser tanpa memutus bacaan yang sudah berjalan.
 *
 * Aman dipanggil berturut-turut dengan cepat (mis. user klik pesan A lalu
 * langsung klik pesan B sebelum fetch A selesai): panggilan yang lebih tua
 * otomatis dibatalkan (fetch di-abort & hasilnya dibuang diam-diam tanpa
 * memicu callback), jadi gak ada audio lama yang nimpa audio baru.
 * Hal yang sama berlaku kalau user memanggil stopSpeaking() di tengah jalan.
 *
 * Promise-nya selesai begitu potongan PERTAMA mulai diputar (atau fallback
 * dimulai); selesainya seluruh bacaan ditandai lewat onEnd.
 */
export async function speak(rawText: string, opts: SpeakOptions = {}): Promise<VoiceSource> {
  const fullText = prepareSpeechText(rawText);
  stopSpeaking();

  const { chunks, truncated } = splitIntoSpeechChunks(fullText);
  if (chunks.length === 0) {
    opts.onEnd?.();
    return 'none';
  }
  if (truncated) opts.onTruncated?.();

  const voice = opts.voice || DEFAULT_GCP_VOICE;

  // Token unik buat panggilan ini. stopSpeaking() dan speak() lain menaikkan
  // requestSeq, jadi hasil yang sudah "basi" dibuang tanpa menyentuh apa pun.
  const myToken = ++requestSeq;
  const isStale = () => myToken !== requestSeq;

  // pending[i] = permintaan audio potongan ke-i. Potongan ke-(i+1) baru diminta
  // begitu audio potongan ke-i siap, jadi selalu hanya satu potongan di depan.
  const pending: Promise<GCPAudioResult>[] = [];
  const request = (i: number): void => {
    if (i >= chunks.length || i in pending) return;
    const p = requestGCPChunk(chunks[i], voice);
    p.catch(() => {}); // cegah "unhandled rejection" untuk potongan yang belum sempat ditunggu
    pending[i] = p;
  };

  const warnFallback = (err: unknown) => {
    if (!(err instanceof Error && err.message === 'TTS_TEMPORARILY_DISABLED')) {
      console.warn('[voiceService] GCP TTS gagal, fallback ke browser speech:', err);
    }
  };

  // ── Potongan pertama ──
  request(0);
  let first: GCPAudioResult;
  try {
    first = await pending[0];
  } catch (err) {
    // Gagal karena dibatalkan stopSpeaking()/speak() baru -> diam-diam berhenti.
    if (isStale()) return 'none';
    warnFallback(err);
    return speakWithBrowser(chunks.join(' '), opts, myToken);
  }
  if (isStale()) return 'none';

  opts.onSourceResolved?.({
    source: 'gcp',
    degraded: first.degraded,
    remainingQuota: first.remainingQuota,
  });

  // Satu elemen Audio dipakai ulang untuk semua potongan: browser (terutama iOS
  // Safari) hanya mengizinkan play() lanjutan pada elemen yang sudah "dibuka".
  const audio = new Audio();
  currentAudio = audio;
  gcpSessionToken = myToken;
  let index = 0;
  let started = false;

  const detachAudio = () => {
    audio.onplay = null;
    audio.onended = null;
    audio.onerror = null;
    if (currentAudio === audio) currentAudio = null;
    if (gcpSessionToken === myToken) gcpSessionToken = 0;
  };

  // Potongan ke-`from` dst. dibacakan suara browser (GCP gagal di tengah jalan).
  const fallbackRest = (from: number, err: unknown) => {
    detachAudio();
    warnFallback(err);
    speakWithBrowser(chunks.slice(from).join(' '), opts, myToken, true);
  };

  const playChunk = async (i: number, result: GCPAudioResult): Promise<void> => {
    request(i + 1);
    audio.src = result.dataUrl;
    await audio.play();
  };

  const advance = async (): Promise<void> => {
    const next = index + 1;
    if (next >= chunks.length) {
      detachAudio();
      opts.onEnd?.();
      return;
    }
    request(next);
    let result: GCPAudioResult;
    try {
      result = await pending[next];
    } catch (err) {
      if (isStale()) return;
      fallbackRest(next, err);
      return;
    }
    if (isStale()) return;
    index = next;
    try {
      await playChunk(next, result);
    } catch (playErr) {
      if (isStale()) return;
      fallbackRest(next, playErr);
    }
  };

  audio.onplay = () => {
    if (started || isStale()) return;
    started = true;
    opts.onStart?.();
  };
  audio.onended = () => {
    if (currentAudio !== audio || isStale()) return;
    void advance();
  };
  audio.onerror = () => {
    if (currentAudio !== audio || isStale()) return;
    if (index > 0) {
      // Potongan di tengah gagal diputar/decode: bacakan sisanya (mulai dari
      // potongan yang gagal) dengan suara browser.
      fallbackRest(index, new Error('AUDIO_PLAYBACK_ERROR'));
      return;
    }
    detachAudio();
    opts.onError?.(new Error('AUDIO_PLAYBACK_ERROR'));
    opts.onEnd?.();
  };

  try {
    await playChunk(0, first);
    return 'gcp';
  } catch (playErr) {
    // stopSpeaking() saat play() masih pending membuat play() reject (AbortError).
    // Itu BUKAN alasan fallback -- user memang minta berhenti.
    if (isStale()) return 'none';

    // Kemungkinan besar autoplay diblokir browser (NotAllowedError) karena
    // play() dipanggil di luar user-gesture langsung, atau error decode lain.
    console.warn('[voiceService] Audio GCP gagal diputar (mungkin autoplay diblokir), fallback ke browser speech:', playErr);
    detachAudio();
  }

  if (isStale()) return 'none';

  return speakWithBrowser(chunks.join(' '), opts, myToken);
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
    // Jangan timpa instance BARU kalau onend ini milik sesi lama yang baru selesai.
    if (recognitionInstance === recognition) recognitionInstance = null;
    opts.onEnd?.();
  };

  recognitionInstance = recognition;
  try {
    recognition.start();
  } catch (err) {
    // mis. InvalidStateError kalau instance sudah berjalan
    if (recognitionInstance === recognition) recognitionInstance = null;
    opts.onError?.(err);
    opts.onEnd?.();
    return null;
  }

  // Cleanup hanya menghentikan sesi MILIKNYA sendiri (aman dipanggil dari
  // cleanup useEffect lama tanpa mematikan sesi mic yang lebih baru).
  return () => {
    try {
      recognition.stop();
    } catch {
      // ignore — instance mungkin sudah berhenti sendiri
    }
    if (recognitionInstance === recognition) recognitionInstance = null;
  };
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