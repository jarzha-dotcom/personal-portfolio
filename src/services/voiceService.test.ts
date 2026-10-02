/**
 * voiceService.test.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Menguji alur speak() (potongan teks, prefetch, fallback, stop) memakai
 * Audio / fetch / speechSynthesis palsu, jadi tidak butuh browser atau jaringan.
 * Jalankan: `npx vitest run`
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ── Palsu: Audio ─────────────────────────────────────────────────────────────
class FakeAudio {
  static instances: FakeAudio[] = [];
  src = '';
  paused = true;
  currentTime = 0;
  onplay: (() => void) | null = null;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  played: string[] = [];
  constructor() {
    FakeAudio.instances.push(this);
  }
  play(): Promise<void> {
    this.paused = false;
    this.played.push(this.src);
    queueMicrotask(() => this.onplay?.());
    return Promise.resolve();
  }
  pause(): void {
    this.paused = true;
  }
  /** Simulasi audio selesai diputar. */
  finish(): void {
    this.paused = true;
    this.onended?.();
  }
}

// ── Palsu: Web Speech ────────────────────────────────────────────────────────
class FakeUtterance {
  lang = '';
  rate = 1;
  pitch = 1;
  voice: unknown = null;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((e: { error: string }) => void) | null = null;
  constructor(public text: string) {}
}

// ── Palsu: fetch /api/tts (dikendalikan manual per permintaan) ───────────────
interface PendingFetch {
  body: { text: string; voice: string };
  aborted: boolean;
  ok(data?: Record<string, unknown>): void;
  fail(status?: number): void;
}

const tick = () => new Promise<void>((r) => setTimeout(r, 0));

let pendings: PendingFetch[];
let spoken: FakeUtterance[];
let cancelSpy: ReturnType<typeof vi.fn>;

function installGlobals(): void {
  FakeAudio.instances = [];
  pendings = [];
  spoken = [];
  cancelSpy = vi.fn();

  vi.stubGlobal('Audio', FakeAudio);
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
  vi.stubGlobal('window', {
    speechSynthesis: {
      speaking: false,
      getVoices: () => [],
      cancel: cancelSpy,
      speak: (u: FakeUtterance) => spoken.push(u),
    },
  });
  vi.stubGlobal(
    'fetch',
    vi.fn(
      (_url: string, init: { body: string; signal?: AbortSignal }) =>
        new Promise((resolve, reject) => {
          const p: PendingFetch = {
            body: JSON.parse(init.body),
            aborted: false,
            ok: (data = {}) =>
              resolve({
                ok: true,
                status: 200,
                json: async () => ({ audioContent: `AUDIO_${pendings.indexOf(p)}`, ...data }),
              }),
            fail: (status = 500) =>
              resolve({ ok: false, status, json: async () => ({ error: `HTTP_${status}` }) }),
          };
          init.signal?.addEventListener('abort', () => {
            p.aborted = true;
            reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
          });
          pendings.push(p);
        }),
    ),
  );
}

// ── Bahan teks ───────────────────────────────────────────────────────────────
const NAMA = ['Alfa', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa', 'Lambda', 'Sigma'];
/** ~88 karakter per kalimat, tanpa angka/istilah kamus supaya normalizer tidak mengubahnya. */
const kalimat = (i: number): string =>
  `Kalimat ${NAMA[i % NAMA.length]} nomor ${NAMA[(i + 3) % NAMA.length]} berisi keterangan yang cukup panjang agar teks melewati batas.`;
const teks = (n: number): string => Array.from({ length: n }, (_, i) => kalimat(i)).join(' ');

type Mod = typeof import('./voiceService');
let mod: Mod;

beforeEach(async () => {
  vi.spyOn(console, 'warn').mockImplementation(() => {}); // log fallback sengaja, tak perlu tampil
  installGlobals();
  vi.resetModules(); // reset cache audio & state singleton antar test
  mod = await import('./voiceService');
});
afterEach(() => {
  mod.stopSpeaking();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function makeCallbacks() {
  return {
    onStart: vi.fn(),
    onEnd: vi.fn(),
    onError: vi.fn(),
    onSourceResolved: vi.fn(),
    onTruncated: vi.fn(),
  };
}

// ═════════════════════════════════════════════════════════════════════════════
describe('prepareSpeechText & stripMarkdownForSpeech', () => {
  it('membersihkan markdown dan link', () => {
    expect(mod.prepareSpeechText('**Halo** [klik ini](https://a.com/x) ya')).toBe('Halo klik ini ya');
  });

  it('link WhatsApp jadi "tautan WhatsApp" (URL tidak dibuang lebih dulu)', () => {
    expect(mod.prepareSpeechText('Chat https://wa.me/62812')).toContain('tautan WhatsApp');
  });

  it('"#1" jadi nomor, heading dibuang', () => {
    const out = mod.prepareSpeechText('## Judul\nProyek #1 selesai');
    expect(out).toContain('nomor 1');
    expect(out).not.toContain('#');
  });

  it('bullet list dan emoji dibuang, baris jadi kalimat terpisah', () => {
    const out = mod.prepareSpeechText('- satu\n- dua 😀');
    expect(out).toBe('satu. dua');
  });

  it('prepareSpeechText TIDAK memotong, stripMarkdownForSpeech (versi lama) memotong', () => {
    const panjang = teks(20);
    expect(mod.prepareSpeechText(panjang).length).toBeGreaterThan(800);
    expect(mod.stripMarkdownForSpeech(panjang).length).toBeLessThanOrEqual(800);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe('splitIntoSpeechChunks', () => {
  it('teks kosong -> tanpa potongan', () => {
    expect(mod.splitIntoSpeechChunks('   ')).toEqual({ chunks: [], truncated: false });
  });

  it('teks <= 800 karakter -> satu potongan utuh (perilaku lama)', () => {
    const t = teks(5);
    expect(t.length).toBeLessThanOrEqual(800);
    expect(mod.splitIntoSpeechChunks(t)).toEqual({ chunks: [t], truncated: false });
  });

  it('teks sedang -> beberapa potongan, tak ada yang > 800, potongan pertama pendek, isi tidak hilang', () => {
    const t = teks(11); // ~970 karakter -> 2 potongan
    const { chunks, truncated } = mod.splitIntoSpeechChunks(t);
    expect(truncated).toBe(false);
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    expect(chunks[0].length).toBeLessThanOrEqual(350);
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(800);
    expect(chunks.join(' ')).toBe(t); // urutan & isi utuh
  });

  it('setiap potongan berakhir di batas kalimat', () => {
    const { chunks } = mod.splitIntoSpeechChunks(teks(11));
    for (const c of chunks) expect(c).toMatch(/[.!?]$/);
  });

  it('teks sangat panjang -> maksimal 3 potongan dan truncated = true', () => {
    const { chunks, truncated } = mod.splitIntoSpeechChunks(teks(40)); // ~3500 karakter
    expect(chunks).toHaveLength(3);
    expect(truncated).toBe(true);
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(800);
  });

  it('satu kalimat raksasa tanpa titik dipecah di spasi/koma, tak ada potongan > 800', () => {
    const raksasa = Array.from({ length: 300 }, (_, i) => `kata${NAMA[i % NAMA.length]}`).join(' ');
    const { chunks } = mod.splitIntoSpeechChunks(raksasa);
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(800);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe('speak() - satu potongan', () => {
  it('meminta /api/tts sekali, memutar, dan memanggil callback berurutan', async () => {
    const cb = makeCallbacks();
    const p = mod.speak('Halo dunia', { voice: 'id-ID-Chirp3-HD-Charon', ...cb });
    await tick();
    expect(pendings).toHaveLength(1);
    expect(pendings[0].body).toEqual({ text: 'Halo dunia', voice: 'id-ID-Chirp3-HD-Charon' });

    pendings[0].ok({ degraded: false, remainingQuota: 123 });
    expect(await p).toBe('gcp');
    await tick();

    expect(cb.onSourceResolved).toHaveBeenCalledWith({ source: 'gcp', degraded: false, remainingQuota: 123 });
    expect(cb.onStart).toHaveBeenCalledTimes(1);
    expect(cb.onEnd).not.toHaveBeenCalled();

    FakeAudio.instances[0].finish();
    expect(cb.onEnd).toHaveBeenCalledTimes(1);
    expect(cb.onError).not.toHaveBeenCalled();
    expect(cb.onTruncated).not.toHaveBeenCalled();
  });

  it('teks kosong -> onEnd langsung, tanpa request', async () => {
    const cb = makeCallbacks();
    expect(await mod.speak('   ', cb)).toBe('none');
    expect(cb.onEnd).toHaveBeenCalledTimes(1);
    expect(pendings).toHaveLength(0);
  });

  it('GCP gagal -> fallback suara browser dengan onSourceResolved degraded', async () => {
    const cb = makeCallbacks();
    const p = mod.speak('Halo dunia', cb);
    await tick();
    pendings[0].fail(500);
    expect(await p).toBe('browser');
    expect(cb.onSourceResolved).toHaveBeenCalledWith({ source: 'browser', degraded: true });
    expect(spoken).toHaveLength(1);
    expect(spoken[0].text).toBe('Halo dunia');
    spoken[0].onstart?.();
    spoken[0].onend?.();
    expect(cb.onStart).toHaveBeenCalledTimes(1);
    expect(cb.onEnd).toHaveBeenCalledTimes(1);
  });

  it('respons 503 membuat speak() berikutnya langsung ke browser tanpa request (backoff)', async () => {
    const p1 = mod.speak('Satu', makeCallbacks());
    await tick();
    pendings[0].fail(503);
    await p1;
    const before = pendings.length;
    expect(await mod.speak('Dua', makeCallbacks())).toBe('browser');
    expect(pendings.length).toBe(before);
  });

  it('hasil ter-cache: speak() kedua untuk teks sama tidak memanggil fetch lagi', async () => {
    const p1 = mod.speak('Halo dunia', makeCallbacks());
    await tick();
    pendings[0].ok();
    await p1;
    const p2 = mod.speak('Halo dunia', makeCallbacks());
    await tick();
    expect(pendings).toHaveLength(1);
    expect(await p2).toBe('gcp');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe('speak() - teks panjang (beberapa potongan)', () => {
  const T = teks(11); // ~970 karakter -> 2 potongan

  it('prefetch: potongan ke-2 diminta begitu potongan ke-1 siap, sebelum potongan ke-1 selesai', async () => {
    const cb = makeCallbacks();
    const p = mod.speak(T, cb);
    await tick();
    expect(pendings).toHaveLength(1); // hanya potongan pertama dulu

    pendings[0].ok();
    await p;
    await tick();
    expect(pendings).toHaveLength(2); // potongan ke-2 sudah diminta, audio ke-1 masih main
    expect(cb.onEnd).not.toHaveBeenCalled();
  });

  it('memutar berurutan pada SATU elemen Audio; onStart & onSourceResolved sekali; onEnd sekali di akhir', async () => {
    const cb = makeCallbacks();
    const p = mod.speak(T, cb);
    await tick();
    pendings[0].ok();
    await p;
    await tick();
    pendings[1].ok();
    await tick();

    expect(FakeAudio.instances).toHaveLength(1);
    const audio = FakeAudio.instances[0];
    expect(audio.played).toHaveLength(1);

    audio.finish(); // potongan 1 selesai -> lanjut potongan 2
    await tick();
    expect(audio.played).toHaveLength(2);
    expect(audio.played[0]).not.toBe(audio.played[1]);
    expect(cb.onEnd).not.toHaveBeenCalled();

    audio.finish(); // potongan 2 selesai -> semua selesai
    expect(cb.onEnd).toHaveBeenCalledTimes(1);
    expect(cb.onStart).toHaveBeenCalledTimes(1);
    expect(cb.onSourceResolved).toHaveBeenCalledTimes(1);
    expect(cb.onError).not.toHaveBeenCalled();
  });

  it('potongan diminta dengan teks berurutan dan tak ada yang hilang', async () => {
    const p = mod.speak(T, makeCallbacks());
    await tick();
    pendings[0].ok();
    await p;
    await tick();
    const dikirim = pendings.map((x) => x.body.text).join(' ');
    expect(dikirim).toBe(mod.prepareSpeechText(T));
  });

  it('isSpeakingNow() tetap true di celah antar potongan (audio berhenti, potongan berikut belum siap)', async () => {
    const p = mod.speak(T, makeCallbacks());
    await tick();
    pendings[0].ok();
    await p;
    await tick();
    expect(mod.isSpeakingNow()).toBe(true);

    FakeAudio.instances[0].finish(); // potongan ke-2 BELUM siap (pendings[1] belum di-ok)
    expect(FakeAudio.instances[0].paused).toBe(true);
    expect(mod.isSpeakingNow()).toBe(true);
  });

  it('potongan ke-2 gagal -> sisanya dibacakan suara browser, tanpa onStart ganda', async () => {
    const cb = makeCallbacks();
    const p = mod.speak(T, cb);
    await tick();
    pendings[0].ok();
    await p;
    await tick();
    pendings[1].fail(500);
    await tick();

    FakeAudio.instances[0].finish();
    await tick();

    const { chunks } = mod.splitIntoSpeechChunks(mod.prepareSpeechText(T));
    expect(spoken).toHaveLength(1);
    expect(spoken[0].text).toBe(chunks.slice(1).join(' ')); // hanya sisa, bukan dari awal
    expect(cb.onSourceResolved).toHaveBeenLastCalledWith({ source: 'browser', degraded: true });
    expect(cb.onSourceResolved).toHaveBeenCalledTimes(2);

    spoken[0].onstart?.();
    expect(cb.onStart).toHaveBeenCalledTimes(1); // sudah dipanggil oleh potongan pertama
    spoken[0].onend?.();
    expect(cb.onEnd).toHaveBeenCalledTimes(1);
  });

  it('potongan pertama gagal -> seluruh teks dibacakan suara browser', async () => {
    const cb = makeCallbacks();
    const p = mod.speak(T, cb);
    await tick();
    pendings[0].fail(500);
    expect(await p).toBe('browser');
    expect(spoken[0].text).toBe(mod.prepareSpeechText(T));
    expect(pendings).toHaveLength(1); // tidak mencoba potongan lain
  });

  it('teks terlalu panjang -> onTruncated sekali, maksimal 3 request', async () => {
    const cb = makeCallbacks();
    const p = mod.speak(teks(40), cb);
    await tick();
    expect(cb.onTruncated).toHaveBeenCalledTimes(1);

    pendings[0].ok();
    await p;
    await tick();
    pendings[1].ok();
    await tick();
    FakeAudio.instances[0].finish();
    await tick();
    pendings[2].ok();
    await tick();
    FakeAudio.instances[0].finish();
    await tick();
    FakeAudio.instances[0].finish();

    expect(pendings).toHaveLength(3);
    expect(cb.onEnd).toHaveBeenCalledTimes(1);
  });

  it('elemen audio gagal di tengah -> sisanya lewat suara browser (bukan onError)', async () => {
    const cb = makeCallbacks();
    const p = mod.speak(T, cb);
    await tick();
    pendings[0].ok();
    await p;
    await tick();
    pendings[1].ok();
    await tick();
    FakeAudio.instances[0].finish();
    await tick();

    FakeAudio.instances[0].onerror?.(); // potongan ke-2 gagal decode
    expect(cb.onError).not.toHaveBeenCalled();
    expect(spoken).toHaveLength(1);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe('speak() - stop & interupsi', () => {
  const T = teks(11); // 2 potongan

  it('stopSpeaking() saat potongan ke-1 main: request aktif di-abort, tak ada onEnd/onError, tak ada lanjutan', async () => {
    const cb = makeCallbacks();
    const p = mod.speak(T, cb);
    await tick();
    pendings[0].ok();
    await p;
    await tick();
    expect(pendings).toHaveLength(2);

    mod.stopSpeaking();
    await tick();
    expect(pendings[1].aborted).toBe(true);

    pendings[1].ok(); // hasil basi yang datang terlambat
    FakeAudio.instances[0].finish(); // event basi
    await tick();

    expect(cb.onEnd).not.toHaveBeenCalled();
    expect(cb.onError).not.toHaveBeenCalled();
    expect(spoken).toHaveLength(0);
    expect(mod.isSpeakingNow()).toBe(false);
  });

  it('stopSpeaking() sebelum potongan pertama tiba: diam-diam berhenti, tanpa fallback browser', async () => {
    const cb = makeCallbacks();
    const p = mod.speak(T, cb);
    await tick();
    mod.stopSpeaking();
    expect(await p).toBe('none');
    expect(pendings[0].aborted).toBe(true);
    expect(spoken).toHaveLength(0);
    expect(cb.onEnd).not.toHaveBeenCalled();
    expect(cb.onError).not.toHaveBeenCalled();
  });

  it('speak() baru membatalkan speak() lama: callback lama senyap, audio lama tidak menimpa', async () => {
    const a = makeCallbacks();
    const b = makeCallbacks();
    const pa = mod.speak(T, a);
    await tick();
    const pb = mod.speak('Pesan baru', b);
    await tick();

    expect(pendings[0].aborted).toBe(true);
    expect(await pa).toBe('none');

    pendings[1].ok();
    expect(await pb).toBe('gcp');
    await tick();
    FakeAudio.instances.at(-1)!.finish();

    expect(b.onEnd).toHaveBeenCalledTimes(1);
    expect(a.onStart).not.toHaveBeenCalled();
    expect(a.onEnd).not.toHaveBeenCalled();
    expect(a.onSourceResolved).not.toHaveBeenCalled();
  });
});
