// scripts/generate-article-audio.ts
//
// Membuat rekaman .mp3 per artikel memakai Google Cloud Text-to-Speech
// (Chirp 3 HD, bahasa Indonesia), lengkap dengan PETA WAKTU per bagian artikel
// untuk sinkron teks di player. Dijalankan MANUAL dari laptop, bukan saat
// build/deploy: pembaca artikel tidak pernah memanggil GCP dan tidak memakai
// kuota sama sekali.
//
// Cara kerja sinkron teks:
//   - Artikel dipecah jadi "bagian": judul + tiap blok (ArticleBlock) di body.
//   - SATU request TTS per bagian (teks yang lebih panjang dari batas GCP dipecah
//     lagi, tapi tetap dihitung sebagai satu bagian).
//   - Durasi tiap bagian DIUKUR dari MP3 hasilnya (bukan ditebak dari jumlah
//     karakter), lalu start/end dihitung kumulatif. Karena MP3 disambung persis
//     berurutan, start/end itu langsung cocok dengan audio akhir.
//   - Player cukup membandingkan audio.currentTime dengan start/end tiap bagian,
//     lalu menyorot blok yang sesuai (sections[i].blockIndex = indeks di body artikel).
//
// Cara pakai (dari root project):
//   npx tsx scripts/generate-article-audio.ts --dry-run                      # rencana & estimasi karakter, tanpa API
//   npx tsx scripts/generate-article-audio.ts --dry-run --show-text <slug>   # baca teks per bagian
//   npx tsx scripts/generate-article-audio.ts <slug>                         # satu artikel dulu (tes suara)
//   npx tsx scripts/generate-article-audio.ts                                # semua yang published & belum/berubah
//   npx tsx scripts/generate-article-audio.ts --upload=r2                    # simpan MP3 di Cloudflare R2
//   npx tsx scripts/generate-article-audio.ts --upload=blob                  # simpan MP3 di Vercel Blob
//
// Opsi:
//   --voice=id-ID-Chirp3-HD-Aoede   suara (default Aoede; harus diawali id-ID-Chirp3-HD-)
//   --rate=1.0                      kecepatan bicara (0.25 - 2.0)
//   --max-chars=200000              batas total karakter per eksekusi (pengaman kuota)
//   --upload=r2|blob                unggah MP3 ke object storage; tanpa opsi ini MP3 ditaruh di public/
//   --force                         buat ulang walau teks tidak berubah
//   --dry-run                       tidak memanggil API / storage dan tidak menulis file
//   --show-text                     (bersama --dry-run) cetak teks narasi per bagian
//
// Environment (.env.local / .env):
//   GCP_API_KEY                     wajib (kunci yang sama dengan api/tts.ts)
//   --upload=blob  : BLOB_READ_WRITE_TOKEN                      (npm i -D @vercel/blob)
//   --upload=r2    : R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET,
//                    R2_PUBLIC_URL (domain publik bucket, tanpa slash akhir)
//                                                                (npm i -D @aws-sdk/client-s3)
//   GCP_TTS_ENDPOINT                opsional, hanya untuk pengujian dengan server tiruan
//   R2_ENDPOINT                     opsional, menimpa endpoint S3 R2 (pengujian)
//
// Keluaran:
//   src/data/articleAudio.json      peta slug -> { url, storage, duration, sections, ... } untuk player
//   public/audio/articles/<slug>.mp3   (hanya tanpa --upload)
//   .audio-cache/<slug>.mp3 + .json    salinan lokal hasil TTS (tambahkan ke .gitignore). Kalau unggahan
//                                      gagal atau kamu pindah storage, skrip memakai cache ini -> TIDAK
//                                      memanggil GCP lagi selama teksnya tidak berubah.
//
// CATATAN KUOTA: skrip ini memanggil GCP langsung, jadi pemakaiannya TIDAK
// tercatat di tracker Upstash milik api/tts.ts. Kalau kamu juga mengandalkan
// jatah gratis Chirp bulanan untuk TTS di situs, sisakan ruang (lihat
// --max-chars dan angka ringkasan di akhir eksekusi).

import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseBuffer } from 'music-metadata';

import { ARTICLES, type Article, type ArticleBlock } from '../src/data/articles.ts';
// Normalizer yang sama dengan yang dipakai frontend (voiceService.ts), supaya
// angka, singkatan, dan istilah teknis dibaca konsisten di audio statis & TTS langsung.
// Asumsi lokasi: src/services/speechNormalizer.ts -- sesuaikan kalau berbeda.
import { normalizeIndonesianForSpeech } from '../src/services/speechNormalizer.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');
const OUT_DIR = join(ROOT_DIR, 'public', 'audio', 'articles');
const CACHE_DIR = join(ROOT_DIR, '.audio-cache');
const MANIFEST_PATH = join(ROOT_DIR, 'src', 'data', 'articleAudio.json');
const PUBLIC_URL_BASE = '/audio/articles';
const REMOTE_KEY_PREFIX = 'audio/articles';

// Naikkan kalau cara menyusun teks/peta waktu berubah, supaya semua audio dibuat ulang.
const SCHEMA_VERSION = 2;

const GCP_TTS_ENDPOINT = process.env.GCP_TTS_ENDPOINT || 'https://texttospeech.googleapis.com/v1/text:synthesize';

// ── .env sederhana (tanpa dependensi; tidak menimpa variabel yang sudah ada) ──
const loadDotEnv = (file: string) => {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf-8').split(/\r?\n/)) {
    const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m || line.trim().startsWith('#')) continue;
    const value = m[2].replace(/^(['"])(.*)\1$/, '$2');
    if (process.env[m[1]] === undefined) process.env[m[1]] = value;
  }
};
loadDotEnv(join(ROOT_DIR, '.env.local'));
loadDotEnv(join(ROOT_DIR, '.env'));

// ── Argumen ──────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const hasFlag = (name: string) => argv.includes(`--${name}`);
const getOpt = (name: string): string | undefined =>
  argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const requestedSlugs = argv.filter((a) => !a.startsWith('--'));

type StorageMode = 'local' | 'blob' | 'r2';

const DRY_RUN = hasFlag('dry-run');
const SHOW_TEXT = hasFlag('show-text');
const FORCE = hasFlag('force');
const VOICE = getOpt('voice') ?? 'id-ID-Chirp3-HD-Aoede';
const RATE = Number(getOpt('rate') ?? '1.0');
const MAX_CHARS = Number(getOpt('max-chars') ?? '200000');
const UPLOAD = getOpt('upload');
const MODE: StorageMode = (UPLOAD as StorageMode | undefined) ?? 'local';

if (!/^id-ID-Chirp3-HD-[A-Za-z]+$/.test(VOICE)) {
  console.error(`Voice "${VOICE}" bukan voice Chirp 3 HD id-ID (harus diawali id-ID-Chirp3-HD-).`);
  process.exit(1);
}
if (!(RATE >= 0.25 && RATE <= 2)) {
  console.error(`--rate harus antara 0.25 dan 2.0 (diberikan: ${getOpt('rate')}).`);
  process.exit(1);
}
if (!(MAX_CHARS > 0)) {
  console.error('--max-chars harus angka positif.');
  process.exit(1);
}
if (hasFlag('upload') || (UPLOAD !== undefined && UPLOAD !== 'r2' && UPLOAD !== 'blob')) {
  console.error('Pakai --upload=r2 atau --upload=blob.');
  process.exit(1);
}

// ── Normalisasi teks untuk suara ─────────────────────────────────────────────
// Bersihkan sisa markdown dulu, lalu serahkan angka/singkatan/istilah teknis ke
// speechNormalizer. Kalau ada kata yang terdengar janggal, perbaiki di kamus
// speechNormalizer.ts (bukan di sini) supaya TTS di situs ikut membaik, lalu
// jalankan ulang dengan --force untuk artikel terkait.
const normalizeForSpeech = (raw: string): string =>
  normalizeIndonesianForSpeech(
    raw
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // link markdown -> teks link
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`+/g, '')
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, ''),
  );

// Pastikan tiap unit berakhir tanda baca supaya suara memberi jeda.
const withTerminalPunctuation = (s: string): string => (/[.!?:;…]$/.test(s) ? s : `${s}.`);

// ── Susun bagian narasi dari artikel ─────────────────────────────────────────
interface Section {
  kind: 'title' | 'block';
  /** Indeks blok di body artikel (null untuk judul). Dipakai player untuk menyorot teks. */
  blockIndex?: number;
  units: string[];
}

const buildSections = (article: Article, blocks: ArticleBlock[]): Section[] => {
  const title = normalizeForSpeech(article.title);
  if (!title) throw new Error(`Judul "${article.slug}" kosong setelah normalisasi`);
  const sections: Section[] = [{ kind: 'title', units: [withTerminalPunctuation(title)] }];

  blocks.forEach((block, blockIndex) => {
    const units: string[] = [];
    if (block.heading) {
      // "5. Perkirakan ..." -> "Nomor 5. Perkirakan ..." supaya angkanya terbaca natural
      const heading = block.heading.replace(/^(\d+)\.\s+/, 'Nomor $1. ');
      const text = normalizeForSpeech(heading);
      if (text) units.push(withTerminalPunctuation(text));
    }
    for (const p of block.paragraphs) {
      const text = normalizeForSpeech(p);
      if (text) units.push(withTerminalPunctuation(text));
    }
    for (const line of block.template ?? []) {
      // Kolom isian "…" tidak enak kalau dibacakan; cukup bacakan pertanyaannya.
      const text = normalizeForSpeech(line.replace(/\s*(?:…+|\.{3,})\s*$/, ''));
      if (text) units.push(withTerminalPunctuation(text));
    }
    // Blok tanpa teks yang bisa dibacakan tidak jadi bagian (tidak ada audio -> tidak ada waktu).
    if (units.length > 0) sections.push({ kind: 'block', blockIndex, units });
  });
  return sections;
};

// ── Pemecahan teks (batas GCP: 5.000 byte per request; pakai sisa aman) ──────
const MAX_CHUNK_BYTES = 3500;
const byteLen = (s: string) => Buffer.byteLength(s, 'utf8');
const charLen = (s: string) => [...s].length; // karakter (code point), bukan byte -> dasar tagihan

const splitOversized = (text: string, maxBytes: number): string[] => {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const out: string[] = [];
  let cur = '';
  const push = (piece: string) => {
    if (cur && byteLen(`${cur} ${piece}`) > maxBytes) {
      out.push(cur);
      cur = piece;
    } else {
      cur = cur ? `${cur} ${piece}` : piece;
    }
  };
  for (const s of sentences) {
    if (byteLen(s) <= maxBytes) {
      push(s);
      continue;
    }
    // Satu kalimat melebihi batas: potong per kata.
    for (const word of s.split(/\s+/)) push(word);
  }
  if (cur) out.push(cur);
  return out;
};

const chunkUnits = (units: string[], maxBytes = MAX_CHUNK_BYTES): string[] => {
  const chunks: string[] = [];
  let cur = '';
  for (const unit of units) {
    const pieces = byteLen(unit) > maxBytes ? splitOversized(unit, maxBytes) : [unit];
    for (const piece of pieces) {
      if (cur && byteLen(`${cur}\n\n${piece}`) > maxBytes) {
        chunks.push(cur);
        cur = piece;
      } else {
        cur = cur ? `${cur}\n\n${piece}` : piece;
      }
    }
  }
  if (cur) chunks.push(cur);
  return chunks;
};

interface PlannedSection {
  section: Section;
  chunks: string[]; // biasanya 1 (satu request per bagian)
  chars: number;
}

const planSections = (article: Article, blocks: ArticleBlock[]): PlannedSection[] =>
  buildSections(article, blocks).map((section) => {
    const chunks = chunkUnits(section.units);
    return { section, chunks, chars: chunks.reduce((n, c) => n + charLen(c), 0) };
  });

// ── Panggilan GCP ────────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

class GcpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// Catatan biaya: retry pada 5xx/timeout berpotensi ditagih ganda oleh GCP,
// jadi jumlahnya sengaja kecil (maks 3 percobaan per potongan).
const synthesizeChunk = async (text: string, apiKey: string): Promise<Buffer> => {
  const MAX_ATTEMPTS = 3;
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60_000);
    try {
      const response = await fetch(GCP_TTS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': apiKey },
        signal: controller.signal,
        body: JSON.stringify({
          input: { text },
          voice: { languageCode: 'id-ID', name: VOICE },
          // Chirp 3 HD tidak mendukung pitch, jadi hanya speakingRate yang dikirim.
          audioConfig: { audioEncoding: 'MP3', speakingRate: RATE },
        }),
      });

      if (!response.ok) {
        const err = (await response.json().catch(() => ({}))) as { error?: { message?: string } };
        throw new GcpError(response.status, err.error?.message || `HTTP ${response.status}`);
      }
      const data = (await response.json()) as { audioContent?: string };
      if (!data.audioContent) throw new Error('Respons GCP tanpa audioContent');
      return Buffer.from(data.audioContent, 'base64');
    } catch (error) {
      lastError = error;
      const status = error instanceof GcpError ? error.status : 0;
      const retryable = status === 0 || status === 429 || status >= 500; // 0 = jaringan/timeout
      if (!retryable || attempt === MAX_ATTEMPTS) break;
      await sleep(1500 * attempt);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  if (lastError instanceof GcpError && (lastError.status === 401 || lastError.status === 403)) {
    throw new Error(
      `${lastError.message} (HTTP ${lastError.status}). Cek GCP_API_KEY: API key harus mengizinkan ` +
        '"Cloud Text-to-Speech API" dan tidak dibatasi hanya untuk referrer website.',
    );
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
};

// ── Ukur durasi MP3 ──────────────────────────────────────────────────────────
// duration:true memaksa pemindaian SEMUA frame (bukan estimasi dari ukuran file),
// jadi hasilnya akurat walau MP3 tidak punya header Xing/VBR.
const measureSeconds = async (mp3: Buffer): Promise<number> => {
  const meta = await parseBuffer(mp3, { mimeType: 'audio/mpeg' }, { duration: true });
  const seconds = meta.format.duration;
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds <= 0) {
    throw new Error('Durasi MP3 tidak terbaca (respons TTS bukan MP3 yang valid?)');
  }
  return seconds;
};
const round3 = (n: number) => Math.round(n * 1000) / 1000;

// ── Object storage (opsional) ────────────────────────────────────────────────
const importOptional = async <T>(name: string): Promise<T> => {
  try {
    return (await import(name)) as T;
  } catch {
    throw new Error(`Paket "${name}" belum terpasang. Jalankan: npm i -D ${name}`);
  }
};

const requireEnv = (names: string[]) => {
  const missing = names.filter((n) => !process.env[n]);
  if (missing.length > 0) throw new Error(`Environment belum lengkap untuk --upload=${MODE}: ${missing.join(', ')}`);
};

// Dicek di awal (sebelum membayar TTS) supaya salah konfigurasi ketahuan duluan.
const preflightUpload = async () => {
  if (MODE === 'blob') {
    requireEnv(['BLOB_READ_WRITE_TOKEN']);
    await importOptional('@vercel/blob');
  } else if (MODE === 'r2') {
    requireEnv(['R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET', 'R2_PUBLIC_URL']);
    if (!process.env.R2_ENDPOINT) requireEnv(['R2_ACCOUNT_ID']);
    await importOptional('@aws-sdk/client-s3');
  }
};

// Kunci memuat hash -> URL berubah tiap isi berubah, jadi aman di-cache selamanya (immutable).
const uploadRemote = async (key: string, mp3: Buffer): Promise<string> => {
  if (MODE === 'blob') {
    const { put } = await importOptional<{
      put: (
        pathname: string,
        body: Buffer,
        options: Record<string, unknown>,
      ) => Promise<{ url: string }>;
    }>('@vercel/blob');
    const res = await put(key, mp3, {
      access: 'public',
      contentType: 'audio/mpeg',
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 31_536_000,
    });
    return res.url;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const aws = await importOptional<any>('@aws-sdk/client-s3');
  const client = new aws.S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
  await client.send(
    new aws.PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      Body: mp3,
      ContentType: 'audio/mpeg',
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );
  return `${(process.env.R2_PUBLIC_URL as string).replace(/\/+$/, '')}/${key}`;
};

const uploadWithRetry = async (key: string, mp3: Buffer): Promise<string> => {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await uploadRemote(key, mp3);
    } catch (error) {
      lastError = error;
      if (attempt < 3) await sleep(1000 * attempt);
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
};

// ── Isi artikel & manifest ───────────────────────────────────────────────────
const bodiesByPillar = new Map<string, Record<string, ArticleBlock[]>>();

const loadBlocks = async (article: Article): Promise<ArticleBlock[]> => {
  const file = `src/data/article-bodies/${article.pillar}.ts`;
  let bodies = bodiesByPillar.get(article.pillar);
  if (!bodies) {
    const mod = await import(`../${file}`);
    bodies = mod.bodies as Record<string, ArticleBlock[]>;
    bodiesByPillar.set(article.pillar, bodies);
  }
  const blocks = bodies[article.slug];
  if (!blocks || blocks.length === 0) throw new Error(`Belum ada isi untuk "${article.slug}" di ${file}`);
  return blocks;
};

export interface AudioSection {
  kind: 'title' | 'block';
  /** Indeks blok di body artikel; tidak ada untuk judul. */
  blockIndex?: number;
  /** Detik dari awal audio. */
  start: number;
  end: number;
}

interface AudioMeta {
  voice: string;
  rate: number;
  chars: number;
  bytes: number;
  /** Total durasi (detik). */
  duration: number;
  sections: AudioSection[];
  hash: string;
  generatedAt: string;
}

export interface AudioEntry extends AudioMeta {
  url: string;
  storage: StorageMode;
}

// Entri lama (sebelum sinkron teks) tidak punya sections/storage -> dianggap perlu dibuat ulang.
type StoredEntry = Omit<AudioEntry, 'sections' | 'storage' | 'duration'> &
  Partial<Pick<AudioEntry, 'sections' | 'storage' | 'duration'>>;

const readManifest = (): Record<string, StoredEntry> => {
  try {
    return JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8')) as Record<string, StoredEntry>;
  } catch {
    return {};
  }
};

const writeManifest = (manifest: Record<string, StoredEntry>) => {
  const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
  mkdirSync(dirname(MANIFEST_PATH), { recursive: true });
  writeFileSync(MANIFEST_PATH, `${JSON.stringify(sorted, null, 2)}\n`, 'utf-8');
};

const writeAtomic = (file: string, data: Buffer | string) => {
  mkdirSync(dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  writeFileSync(tmp, data);
  renameSync(tmp, file);
};

const cacheMp3Path = (slug: string) => join(CACHE_DIR, `${slug}.mp3`);
const cacheMetaPath = (slug: string) => join(CACHE_DIR, `${slug}.json`);
const publicMp3Path = (slug: string) => join(OUT_DIR, `${slug}.mp3`);

const readCacheMeta = (slug: string): AudioMeta | null => {
  try {
    return JSON.parse(readFileSync(cacheMetaPath(slug), 'utf-8')) as AudioMeta;
  } catch {
    return null;
  }
};

const fmt = (n: number) => n.toLocaleString('id-ID');
const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

/** Taruh MP3 di tujuan (public/ atau object storage) dan kembalikan URL-nya. */
const publish = async (slug: string, hash: string, mp3: Buffer): Promise<{ url: string; storage: StorageMode }> => {
  const hash8 = hash.slice(0, 8);
  if (MODE === 'local') {
    writeAtomic(publicMp3Path(slug), mp3);
    return { url: `${PUBLIC_URL_BASE}/${slug}.mp3?v=${hash8}`, storage: 'local' };
  }
  const url = await uploadWithRetry(`${REMOTE_KEY_PREFIX}/${slug}-${hash8}.mp3`, mp3);
  return { url, storage: MODE };
};

// ── Main ─────────────────────────────────────────────────────────────────────
const main = async () => {
  const apiKey = process.env.GCP_API_KEY;
  if (!DRY_RUN && !apiKey) {
    console.error('GCP_API_KEY tidak ditemukan di .env.local / .env / environment.');
    process.exit(1);
  }
  if (!DRY_RUN && MODE !== 'local') {
    try {
      await preflightUpload();
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  }

  let targets = ARTICLES.filter((a) => a.published);
  if (requestedSlugs.length > 0) {
    const unknown = requestedSlugs.filter((s) => !targets.some((a) => a.slug === s));
    if (unknown.length > 0) {
      console.error(`Slug tidak dikenal / belum published: ${unknown.join(', ')}`);
      process.exit(1);
    }
    targets = targets.filter((a) => requestedSlugs.includes(a.slug));
  }

  const manifest = readManifest();
  let generated = 0;
  let moved = 0;
  let skipped = 0;
  let failed = 0;
  let plannedChars = 0;
  let spentChars = 0;

  console.log(
    `${DRY_RUN ? '[DRY RUN] ' : ''}Voice ${VOICE}, rate ${RATE}, tujuan ${MODE}, ${targets.length} artikel, batas ${fmt(MAX_CHARS)} karakter.\n`,
  );

  let lineOpen = false; // true kalau baris progres "... " belum diakhiri
  for (const article of targets) {
    const slug = article.slug;
    try {
      const blocks = await loadBlocks(article);
      const plan = planSections(article, blocks);
      const chars = plan.reduce((n, p) => n + p.chars, 0);
      const requests = plan.reduce((n, p) => n + p.chunks.length, 0);
      const hash = createHash('sha256')
        .update(`v${SCHEMA_VERSION}|${VOICE}|${RATE}\n${plan.map((p) => p.chunks.join('\u0000')).join('\u0001')}`)
        .digest('hex');

      // 1) Sudah terbit di tujuan yang diminta -> lewati.
      const entry = manifest[slug];
      const published =
        !FORCE &&
        entry?.hash === hash &&
        Array.isArray(entry.sections) &&
        entry.storage === MODE &&
        (MODE !== 'local' || existsSync(publicMp3Path(slug)));
      if (published) {
        skipped++;
        console.log(`  = ${slug}  (sudah terbaru, dilewati)`);
        continue;
      }

      // 2) Audio untuk teks ini sudah ada (cache lokal, atau file lama di public/) ->
      //    cukup dipublikasikan ulang ke tujuan baru, tanpa memanggil GCP.
      let reuse: { file: string; meta: AudioMeta } | null = null;
      if (!FORCE) {
        const cached = readCacheMeta(slug);
        if (cached?.hash === hash && existsSync(cacheMp3Path(slug))) {
          reuse = { file: cacheMp3Path(slug), meta: cached };
        } else if (
          entry?.hash === hash &&
          entry.storage === 'local' &&
          Array.isArray(entry.sections) &&
          typeof entry.duration === 'number' &&
          existsSync(publicMp3Path(slug))
        ) {
          reuse = { file: publicMp3Path(slug), meta: { ...entry, sections: entry.sections, duration: entry.duration } };
        }
      }

      if (DRY_RUN) {
        if (reuse) {
          console.log(`  ~ ${slug}  audio sudah ada, tinggal dipublikasikan ke ${MODE} (0 karakter)`);
        } else {
          plannedChars += chars;
          console.log(`  + ${slug}  ${fmt(chars)} karakter, ${plan.length} bagian, ${requests} request`);
        }
        if (SHOW_TEXT) {
          plan.forEach((p, i) => {
            const label = p.section.kind === 'title' ? 'judul' : `blok ${p.section.blockIndex}`;
            console.log(`\n--- bagian ${i + 1} (${label}) ---\n${p.chunks.join('\n\n')}`);
          });
          console.log('');
        }
        continue;
      }

      if (reuse) {
        process.stdout.write(`  ~ ${slug}  audio sudah ada, memublikasikan ke ${MODE} ... `);
        lineOpen = true;
        const mp3 = readFileSync(reuse.file);
        // File lokal di public/ juga disalin ke cache supaya jadi sumber tunggal berikutnya.
        if (reuse.file !== cacheMp3Path(slug)) {
          mkdirSync(CACHE_DIR, { recursive: true });
          copyFileSync(reuse.file, cacheMp3Path(slug));
          writeAtomic(cacheMetaPath(slug), `${JSON.stringify(reuse.meta, null, 2)}\n`);
        }
        const { url, storage } = await publish(slug, hash, mp3);
        manifest[slug] = { ...reuse.meta, url, storage };
        writeManifest(manifest);
        moved++;
        lineOpen = false;
        console.log('selesai');
        continue;
      }

      // 3) Buat baru lewat GCP.
      if (spentChars + chars > MAX_CHARS) {
        console.log(
          `  ! ${slug}  ${fmt(chars)} karakter akan melewati --max-chars; berhenti. Naikkan batas atau jalankan lagi.`,
        );
        break;
      }

      process.stdout.write(`  + ${slug}  ${fmt(chars)} karakter, ${plan.length} bagian, ${requests} request ... `);
      lineOpen = true;
      const sectionBuffers: Buffer[] = [];
      const sections: AudioSection[] = [];
      let cursor = 0;
      for (const { section, chunks } of plan) {
        const parts: Buffer[] = [];
        for (const chunk of chunks) {
          parts.push(await synthesizeChunk(chunk, apiKey as string));
          spentChars += charLen(chunk);
          await sleep(300);
        }
        // Potongan MP3 dari satu voice & konfigurasi yang sama aman digabung langsung.
        const buf = Buffer.concat(parts);
        const seconds = await measureSeconds(buf);
        sections.push({
          kind: section.kind,
          ...(section.blockIndex !== undefined ? { blockIndex: section.blockIndex } : {}),
          start: round3(cursor),
          end: round3(cursor + seconds),
        });
        cursor += seconds;
        sectionBuffers.push(buf);
      }
      const mp3 = Buffer.concat(sectionBuffers);

      // Cek silang: durasi file utuh harus mendekati jumlah durasi bagian.
      const total = await measureSeconds(mp3);
      const drift = Math.abs(total - cursor);
      if (drift > 0.5) {
        console.log(`\n    ! selisih durasi ${drift.toFixed(2)} dtk antara jumlah bagian dan file utuh; cek MP3-nya.`);
      }

      const meta: AudioMeta = {
        voice: VOICE,
        rate: RATE,
        chars,
        bytes: mp3.length,
        duration: round3(cursor),
        sections,
        hash,
        generatedAt: new Date().toISOString(),
      };
      // Simpan ke cache SEBELUM unggah: kalau unggahan gagal, jalankan ulang tidak membayar TTS lagi.
      writeAtomic(cacheMp3Path(slug), mp3);
      writeAtomic(cacheMetaPath(slug), `${JSON.stringify(meta, null, 2)}\n`);

      const { url, storage } = await publish(slug, hash, mp3);
      manifest[slug] = { ...meta, url, storage };
      writeManifest(manifest); // tulis tiap artikel selesai, jadi progres aman kalau terhenti
      generated++;
      lineOpen = false;
      console.log(`selesai (${(mp3.length / 1024 / 1024).toFixed(2)} MB, ${fmtTime(cursor)})`);
    } catch (error) {
      failed++;
      if (lineOpen) console.log('');
      lineOpen = false;
      console.log(`  x ${slug}  GAGAL: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  console.log('\nRingkasan');
  if (DRY_RUN) {
    console.log(`  Akan dibuat : ${fmt(plannedChars)} karakter total`);
  } else {
    console.log(`  Dibuat      : ${generated} artikel, ${fmt(spentChars)} karakter terpakai di eksekusi ini`);
    console.log(`  Dipublikasikan ulang tanpa TTS: ${moved}`);
  }
  console.log(`  Dilewati    : ${skipped}   Gagal: ${failed}`);
  if (!DRY_RUN && generated > 0) {
    console.log('  Ingat: pemakaian ini tidak tercatat di tracker kuota api/tts.ts.');
  }
  if (!DRY_RUN && MODE !== 'local' && existsSync(OUT_DIR)) {
    console.log('  Catatan: public/audio/articles/ tidak dipakai lagi; hapus isinya supaya tidak ikut ter-deploy.');
  }
  if (failed > 0) process.exitCode = 1;
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});