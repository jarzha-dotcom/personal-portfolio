// scripts/upload-images.ts
//
// Mengunggah ilustrasi artikel ke Vercel Blob dan MENULIS manifest
// src/data/articleImages.ts (slug -> { top, middle }) yang dibaca oleh
// ArticleIllustration.tsx dan scripts/prerender.ts. Tidak ada lagi peta yang
// diisi manual -- sama seperti generate-article-audio.ts.
//
// Konvensi nama file di src/assets/images/ (file .jpeg itu di-ignore Git):
//   <slug>.jpeg     = gambar TOP (hero)
//   <slug>-2.jpeg   = gambar MIDDLE (tengah artikel)
// <slug> harus sama persis dengan slug di src/data/articles.ts. Kedua gambar
// wajib ada (pasangan). Foto profil (.jpg) sengaja tidak disentuh.
//
// Cara menambah ilustrasi artikel baru:
//   1. Taruh <slug>.jpeg dan <slug>-2.jpeg di src/assets/images/
//   2. npm run upload:images
//   3. Commit src/data/articleImages.ts (hasil generate). Gambarnya tidak ikut
//      ke Git.
//
// Cara pakai:
//   npm run upload:images                       # unggah yang baru/berubah + tulis manifest
//   npm run upload:images -- --dry-run          # lihat rencana saja, tidak mengunggah/menulis
//   npm run upload:images -- --prune            # juga hapus gambar lama di Blob yang tak terpakai
//   npm run upload:images -- --force            # unggah ulang semua walau sudah ada
//
// Opsi lingkungan:
//   BLOB_READ_WRITE_TOKEN   wajib (kecuali --dry-run). Dibaca dari .env.local / .env
//   IMAGES_DIR              folder sumber (default: src/assets/images)
//
// Pathname di Blob memuat hash isi file:
//   articles/<slug>-top-<hash8>.jpeg
// Jadi kalau gambar diganti, URL-nya ikut berganti dan cache CDN/browser tidak
// menyajikan versi lama. Gambar yang tidak berubah dilewati (tidak diunggah
// ulang). Gunakan --prune SETELAH deploy baru live, supaya situs yang masih
// menayangkan manifest lama tidak kehilangan gambar.

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { del, list, put } from '@vercel/blob';

import { ARTICLES } from '../src/data/articles.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');

// ── .env sederhana (tidak menimpa variabel yang sudah ada) ──────────────────
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

const argv = process.argv.slice(2);
const hasFlag = (name: string) => argv.includes(`--${name}`);
const DRY_RUN = hasFlag('dry-run');
const FORCE = hasFlag('force');
const PRUNE = hasFlag('prune');

const IMAGES_DIR = process.env.IMAGES_DIR
  ? join(ROOT_DIR, process.env.IMAGES_DIR)
  : join(ROOT_DIR, 'src', 'assets', 'images');
const MANIFEST_PATH = join(ROOT_DIR, 'src', 'data', 'articleImages.ts');
const REMOTE_PREFIX = 'articles/';

type Position = 'top' | 'middle';
interface Source {
  slug: string;
  position: Position;
  file: string;
  buffer: Buffer;
  pathname: string;
}

const hash8 = (buf: Buffer) => createHash('sha1').update(buf).digest('hex').slice(0, 8);

const listRemote = async (): Promise<Map<string, string>> => {
  const out = new Map<string, string>(); // pathname -> url
  if (!process.env.BLOB_READ_WRITE_TOKEN) return out;
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: REMOTE_PREFIX, cursor, limit: 1000 });
    for (const b of page.blobs) out.set(b.pathname, b.url);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return out;
};

async function main() {
  if (!DRY_RUN && !process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN belum di-set (cek .env.local).');
  }
  if (!existsSync(IMAGES_DIR)) throw new Error(`Folder tidak ditemukan: ${IMAGES_DIR}`);

  const knownSlugs = new Set(ARTICLES.map((a) => a.slug));
  const problems: string[] = [];

  // 1. Baca & kelompokkan file per slug
  const bySlug = new Map<string, Partial<Record<Position, Source>>>();
  for (const file of readdirSync(IMAGES_DIR).filter((f) => /\.jpeg$/i.test(f))) {
    const m = file.match(/^(.+?)(-2)?\.jpeg$/i);
    if (!m) continue;
    const slug = m[1];
    const position: Position = m[2] ? 'middle' : 'top';
    if (!knownSlugs.has(slug)) {
      problems.push(`"${file}": slug "${slug}" tidak ada di src/data/articles.ts (salah ketik / belum di-rename?)`);
      continue;
    }
    const buffer = readFileSync(join(IMAGES_DIR, file));
    const entry = bySlug.get(slug) ?? {};
    entry[position] = { slug, position, file, buffer, pathname: `${REMOTE_PREFIX}${slug}-${position}-${hash8(buffer)}.jpeg` };
    bySlug.set(slug, entry);
  }

  // 2. Wajib berpasangan
  const complete: { slug: string; top: Source; middle: Source }[] = [];
  for (const [slug, e] of bySlug) {
    if (e.top && e.middle) complete.push({ slug, top: e.top, middle: e.middle });
    else problems.push(`"${slug}": hanya ada ${e.top ? 'TOP' : 'MIDDLE'}, pasangannya (${e.top ? `${slug}-2.jpeg` : `${slug}.jpeg`}) belum ada -- dilewati`);
  }
  complete.sort((a, b) => a.slug.localeCompare(b.slug));

  // 3. Bandingkan dengan isi Blob
  const remote = await listRemote();
  const sources = complete.flatMap((c) => [c.top, c.middle]);
  const toUpload = sources.filter((s) => FORCE || !remote.has(s.pathname));
  console.log(
    `Ditemukan ${complete.length} artikel berilustrasi (${sources.length} gambar): ` +
      `${toUpload.length} perlu diunggah, ${sources.length - toUpload.length} sudah ada di Blob.`
  );
  if (!process.env.BLOB_READ_WRITE_TOKEN) console.log('(Tanpa token: semua dianggap baru.)');

  const noImages = ARTICLES.filter((a) => !bySlug.has(a.slug)).map((a) => a.slug);
  if (noImages.length) console.log(`Artikel tanpa ilustrasi custom (pakai ikon): ${noImages.join(', ')}`);

  if (DRY_RUN) {
    for (const s of toUpload) console.log(`  [akan diunggah] ${s.file} -> ${s.pathname}`);
    problems.forEach((p) => console.warn(`PERINGATAN: ${p}`));
    console.log('\n--dry-run: tidak ada yang diunggah atau ditulis.');
    return;
  }

  // 4. Unggah
  const urlOf = new Map<string, string>(); // pathname -> url
  for (const s of sources) {
    const existing = remote.get(s.pathname);
    if (existing && !FORCE) {
      urlOf.set(s.pathname, existing);
      continue;
    }
    try {
      const blob = await put(s.pathname, s.buffer, {
        access: 'public',
        contentType: 'image/jpeg',
        addRandomSuffix: false,
        allowOverwrite: true,
        cacheControlMaxAge: 60 * 60 * 24 * 365, // URL memuat hash, jadi aman di-cache lama
      });
      urlOf.set(s.pathname, blob.url);
      console.log(`OK    ${s.file}\n      -> ${blob.url}`);
    } catch (err) {
      problems.push(`GAGAL unggah "${s.file}": ${(err as Error).message}`);
    }
  }

  // 5. Tulis manifest (hanya artikel yang kedua gambarnya berhasil)
  const rows = complete.filter((c) => urlOf.has(c.top.pathname) && urlOf.has(c.middle.pathname));
  const body = rows
    .map(
      (c) =>
        `  '${c.slug}': {\n    top: '${urlOf.get(c.top.pathname)}',\n    middle: '${urlOf.get(c.middle.pathname)}',\n  },`
    )
    .join('\n');
  writeFileSync(
    MANIFEST_PATH,
    `// FILE INI DIBUAT OTOMATIS oleh scripts/upload-images.ts -- jangan diedit manual.\n` +
      `// Jalankan: npm run upload:images\n\n` +
      `export interface ArticleImageSet {\n  top: string;\n  middle: string;\n}\n\n` +
      `export const ARTICLE_IMAGES: Record<string, ArticleImageSet> = {\n${body}\n};\n`,
    'utf-8'
  );
  console.log(`\nManifest ditulis: src/data/articleImages.ts (${rows.length} artikel).`);

  // 6. Gambar lama yang sudah tidak terpakai
  const used = new Set(rows.flatMap((c) => [c.top.pathname, c.middle.pathname]));
  const stale = [...remote.entries()].filter(([p]) => !used.has(p));
  if (stale.length) {
    if (PRUNE) {
      await del(stale.map(([, url]) => url));
      console.log(`Prune: ${stale.length} gambar lama dihapus dari Blob.`);
    } else {
      console.log(
        `Ada ${stale.length} gambar lama di Blob yang tidak terpakai. ` +
          `Setelah deploy baru live, jalankan: npm run upload:images -- --prune`
      );
    }
  }

  problems.forEach((p) => console.warn(`PERINGATAN: ${p}`));
  if (problems.some((p) => p.startsWith('GAGAL'))) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});