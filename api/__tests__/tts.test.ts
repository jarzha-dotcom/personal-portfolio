/**
 * api/__tests__/tts.test.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Menguji handler api/tts.ts dengan GCP dan Redis palsu (tanpa jaringan).
 * Folder __tests__ berawalan "_" sehingga TIDAK dihitung Vercel sebagai
 * Serverless Function (sama seperti api/_lib). Jangan beri nama folder/file
 * test di api/ tanpa awalan "_", atau ia ikut dihitung dalam batas 12 function.
 * Jalankan: `npm test`
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ── Redis/kuota palsu ────────────────────────────────────────────────────────
const quota = vi.hoisted(() => ({
  reserveQuota: vi.fn(async (_tier: string, _chars: number, _limit: number) => true),
  releaseQuota: vi.fn(async (_tier: string, _chars: number) => {}),
  getMonthlyLimit: vi.fn((tier: string) => (tier === 'chirp' ? 1000 : 4000)),
  getUsage: vi.fn(async (_tier: string) => 0),
}));
vi.mock('../_lib/ttsQuota.js', () => quota);

// ── GCP palsu ────────────────────────────────────────────────────────────────
type SynthReply = { ok: boolean; status: number; body: unknown };
let synthReplies: SynthReply[]; // dipakai berurutan; kalau habis -> sukses
let fetchMock: ReturnType<typeof vi.fn>;

const synthCalls = () =>
  fetchMock.mock.calls
    .filter(([url]) => String(url).includes('text:synthesize'))
    .map(([, init]) => JSON.parse((init as { body: string }).body) as {
      input: { text: string };
      voice: { name: string };
    });

function installFetch(): void {
  synthReplies = [];
  fetchMock = vi.fn(async (url: string) => {
    if (String(url).includes('/voices')) return { ok: true, status: 200, json: async () => ({ voices: [] }) };
    const r = synthReplies.shift() ?? { ok: true, status: 200, body: { audioContent: 'QUJD' } };
    return { ok: r.ok, status: r.status, json: async () => r.body };
  });
  vi.stubGlobal('fetch', fetchMock);
}

// ── req/res palsu ────────────────────────────────────────────────────────────
interface FakeRes {
  statusCode: number;
  headers: Record<string, string>;
  body: any;
  setHeader(k: string, v: string): void;
  status(c: number): FakeRes;
  json(b: unknown): FakeRes;
  end(): FakeRes;
}
const makeRes = (): FakeRes => {
  const res: FakeRes = {
    statusCode: 200,
    headers: {},
    body: undefined,
    setHeader(k, v) {
      this.headers[k] = v;
    },
    status(c) {
      this.statusCode = c;
      return this;
    },
    json(b) {
      this.body = b;
      return this;
    },
    end() {
      return this;
    },
  };
  return res;
};
const makeReq = (method: string, body?: unknown, headers: Record<string, string> = {}) =>
  ({ method, body, headers }) as any;

let handler: (req: any, res: any) => Promise<unknown>;

async function loadHandler(env: Record<string, string> = {}) {
  vi.resetModules();
  vi.stubEnv('GCP_TTS', 'true');
  vi.stubEnv('GCP_API_KEY', 'kunci-palsu');
  vi.stubEnv('TTS_USAGE_PIN', '1234');
  vi.stubEnv('TTS_ALLOWED_ORIGINS', '');
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
  handler = (await import('../tts')).default as typeof handler;
}

const post = async (body: unknown, headers: Record<string, string> = {}) => {
  const res = makeRes();
  await handler(makeReq('POST', body, headers), res);
  return res;
};
const get = async (headers: Record<string, string> = {}) => {
  const res = makeRes();
  await handler(makeReq('GET', undefined, headers), res);
  return res;
};

beforeEach(async () => {
  quota.reserveQuota.mockReset().mockResolvedValue(true);
  quota.releaseQuota.mockReset().mockResolvedValue(undefined);
  quota.getUsage.mockReset().mockResolvedValue(0);
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  installFetch();
  await loadHandler();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

// ═════════════════════════════════════════════════════════════════════════════
describe('POST /api/tts - dasar', () => {
  it('OPTIONS -> 200 dengan header CORS', async () => {
    const res = makeRes();
    await handler(makeReq('OPTIONS'), res);
    expect(res.statusCode).toBe(200);
    expect(res.headers['Access-Control-Allow-Origin']).toBe('*');
  });

  it('metode lain -> 405', async () => {
    const res = makeRes();
    await handler(makeReq('DELETE'), res);
    expect(res.statusCode).toBe(405);
  });

  it('GCP_TTS bukan "true" -> 503 TTS_DISABLED, GCP tidak dipanggil', async () => {
    await loadHandler({ GCP_TTS: 'false' });
    const res = await post({ text: 'Halo' });
    expect(res.statusCode).toBe(503);
    expect(res.body.error).toBe('TTS_DISABLED');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('tanpa GCP_API_KEY -> 503 TTS_UNAVAILABLE', async () => {
    await loadHandler({ GCP_API_KEY: '' });
    const res = await post({ text: 'Halo' });
    expect(res.statusCode).toBe(503);
    expect(res.body.error).toBe('TTS_UNAVAILABLE');
  });

  it.each([[{}], [{ text: '   ' }], [{ text: 123 }]])('teks tidak valid %j -> 400', async (body) => {
    expect((await post(body)).statusCode).toBe(400);
  });

  it('sukses: 200 + audioContent + voice yang diminta, degraded false, kuota Chirp direservasi', async () => {
    const res = await post({ text: 'Halo dunia', voice: 'id-ID-Chirp3-HD-Charon' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ audioContent: 'QUJD', voice: 'id-ID-Chirp3-HD-Charon', degraded: false });
    expect(quota.reserveQuota).toHaveBeenCalledWith('chirp', Buffer.byteLength('Halo dunia'), 1000);
  });

  it('voice tidak dikenal -> dipakai voice default', async () => {
    const res = await post({ text: 'Halo', voice: 'id-ID-Sembarang' });
    expect(res.body.voice).toBe('id-ID-Chirp3-HD-Aoede');
  });

  it('server TIDAK menormalisasi angka/istilah (itu tugas frontend), hanya membersihkan markdown', async () => {
    await post({ text: '**Halo** Rp1.500.000 pakai Next.js' });
    expect(synthCalls()[0].input.text).toBe('Halo Rp1.500.000 pakai Next.js');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe('fallback tier & kuota (fail-closed)', () => {
  it('kuota Chirp penuh -> turun ke WaveNet BERGENDER SAMA (Charon=cowok -> Wavenet-B/C), degraded true', async () => {
    quota.reserveQuota.mockImplementation(async (tier: string) => tier !== 'chirp');
    const res = await post({ text: 'Halo', voice: 'id-ID-Chirp3-HD-Charon' });
    expect(res.statusCode).toBe(200);
    expect(res.body.degraded).toBe(true);
    expect(['id-ID-Wavenet-B', 'id-ID-Wavenet-C']).toContain(res.body.voice);
    expect(synthCalls()).toHaveLength(1); // Chirp tidak pernah dipanggil
  });

  it('Aoede (cewek) turun ke WaveNet cewek (A/D)', async () => {
    quota.reserveQuota.mockImplementation(async (tier: string) => tier !== 'chirp');
    const res = await post({ text: 'Halo', voice: 'id-ID-Chirp3-HD-Aoede' });
    expect(['id-ID-Wavenet-A', 'id-ID-Wavenet-D']).toContain(res.body.voice);
  });

  it('Redis error -> FAIL-CLOSED: GCP TIDAK dipanggil sama sekali, balas 502 TTS_FAILED', async () => {
    quota.reserveQuota.mockRejectedValue(new Error('redis down'));
    const res = await post({ text: 'Halo' });
    expect(res.statusCode).toBe(502);
    expect(res.body.error).toBe('TTS_FAILED');
    expect(synthCalls()).toHaveLength(0);
  });

  it('semua tier penuh -> 502, GCP tidak dipanggil', async () => {
    quota.reserveQuota.mockResolvedValue(false);
    const res = await post({ text: 'Halo' });
    expect(res.statusCode).toBe(502);
    expect(synthCalls()).toHaveLength(0);
  });

  it('GCP menolak 4xx -> reservasi di-release, lanjut ke tier berikutnya', async () => {
    synthReplies.push({ ok: false, status: 400, body: { error: { message: 'bad' } } });
    const res = await post({ text: 'Halo' });
    expect(res.statusCode).toBe(200);
    expect(res.body.degraded).toBe(true);
    expect(quota.releaseQuota).toHaveBeenCalledWith('chirp', Buffer.byteLength('Halo'));
  });

  it('GCP error 5xx -> reservasi DIPERTAHANKAN (mungkin sudah ditagih)', async () => {
    synthReplies.push({ ok: false, status: 500, body: {} });
    await post({ text: 'Halo' });
    expect(quota.releaseQuota).not.toHaveBeenCalled();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe('rate limit & CORS', () => {
  it('request ke-11 dalam semenit dari IP yang sama -> 429', async () => {
    for (let i = 0; i < 10; i++) expect((await post({ text: `Halo ${i}` })).statusCode).toBe(200);
    const res = await post({ text: 'Halo lagi' });
    expect(res.statusCode).toBe(429);
    expect(res.body.error).toBe('TTS_RATE_LIMITED');
  });

  it('IP berbeda punya jatah sendiri', async () => {
    for (let i = 0; i < 10; i++) await post({ text: `Halo ${i}` }, { 'x-forwarded-for': '1.1.1.1' });
    expect((await post({ text: 'Halo' }, { 'x-forwarded-for': '2.2.2.2' })).statusCode).toBe(200);
  });

  it('TTS_ALLOWED_ORIGINS diisi: hanya origin terdaftar yang dipantulkan', async () => {
    await loadHandler({ TTS_ALLOWED_ORIGINS: 'https://situs.id, http://localhost:3000' });
    const ok = await post({ text: 'Halo' }, { origin: 'http://localhost:3000' });
    expect(ok.headers['Access-Control-Allow-Origin']).toBe('http://localhost:3000');
    const asing = await post({ text: 'Halo' }, { origin: 'https://jahat.com' });
    expect(asing.headers['Access-Control-Allow-Origin']).toBeUndefined();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe('GET /api/tts (usage-check)', () => {
  it('PIN belum dikonfigurasi di server -> 503', async () => {
    await loadHandler({ TTS_USAGE_PIN: '' });
    expect((await get({ 'x-tts-usage-pin': '1234' })).statusCode).toBe(503);
  });

  it('PIN salah / kosong -> 401', async () => {
    expect((await get({ 'x-tts-usage-pin': 'salah' })).statusCode).toBe(401);
    expect((await get()).statusCode).toBe(401);
  });

  it('PIN benar -> used, limit, percent, nearLimit per tier', async () => {
    quota.getUsage.mockImplementation(async (tier: string) => (tier === 'chirp' ? 850 : 100));
    const res = await get({ 'x-tts-usage-pin': '1234' });
    expect(res.statusCode).toBe(200);
    expect(res.body.chirp).toEqual({ used: 850, limit: 1000, percent: 85, nearLimit: true });
    expect(res.body.wavenet).toEqual({ used: 100, limit: 4000, percent: 3, nearLimit: false });
  });

  it('Redis error -> 502', async () => {
    quota.getUsage.mockRejectedValue(new Error('redis down'));
    expect((await get({ 'x-tts-usage-pin': '1234' })).statusCode).toBe(502);
  });

  it('percobaan PIN dibatasi 8x / menit / IP', async () => {
    for (let i = 0; i < 8; i++) await get({ 'x-tts-usage-pin': 'salah' });
    expect((await get({ 'x-tts-usage-pin': '1234' })).statusCode).toBe(429);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe('peringatan kuota mendekati batas', () => {
  const warnSpy = () => console.warn as unknown as ReturnType<typeof vi.fn>;
  const errorSpy = () => console.error as unknown as ReturnType<typeof vi.fn>;

  it('di bawah 80% -> tidak ada peringatan', async () => {
    quota.getUsage.mockResolvedValue(500); // 50%
    await post({ text: 'Halo' });
    expect(warnSpy().mock.calls.flat().join(' ')).not.toContain('Mendekati batas');
    expect(errorSpy()).not.toHaveBeenCalled();
  });

  it('>= 80% -> console.warn dengan persen', async () => {
    quota.getUsage.mockResolvedValue(850);
    await post({ text: 'Halo' });
    const log = warnSpy().mock.calls.flat().join(' ');
    expect(log).toContain('"chirp"');
    expect(log).toContain('85%');
    expect(log).toContain('Mendekati batas');
  });

  it('>= 95% -> console.error KRITIS', async () => {
    quota.getUsage.mockResolvedValue(970);
    await post({ text: 'Halo' });
    expect(errorSpy().mock.calls.flat().join(' ')).toContain('KRITIS');
  });

  it('Redis dibaca paling sering sekali per 10 menit per tier (tidak tiap request)', async () => {
    quota.getUsage.mockResolvedValue(850);
    await post({ text: 'Satu' });
    await post({ text: 'Dua' });
    await post({ text: 'Tiga' });
    expect(quota.getUsage).toHaveBeenCalledTimes(1);
  });

  it('getUsage gagal -> respons audio tetap 200 (peringatan tidak boleh mengganggu)', async () => {
    quota.getUsage.mockRejectedValue(new Error('redis down'));
    const res = await post({ text: 'Halo' });
    expect(res.statusCode).toBe(200);
    expect(res.body.audioContent).toBe('QUJD');
  });
});
