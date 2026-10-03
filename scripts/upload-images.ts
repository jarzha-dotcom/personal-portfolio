/**
 * Upload ilustrasi artikel + foto profil ke Vercel Blob.
 *
 * Cara pakai:
 *   1. npm i -D @vercel/blob tsx
 *   2. Taruh BLOB_READ_WRITE_TOKEN di .env.local
 *   3. npx tsx --env-file=.env.local scripts/upload-images.ts
 *
 * Aman dijalankan ulang (file dengan nama sama akan ditimpa).
 * slugify() HARUS sama persis dengan yang ada di ArticleIllustration.tsx.
 */
import { put } from '@vercel/blob';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const DIR = 'src/assets/images';
const ARTICLE_PREFIX = 'articles';

// Foto profil: nama file di folder lokal -> pathname di Blob.
// Kalau tidak mau memindahkan foto profil ke Blob, kosongkan array ini.
const EXTRA_FILES: { file: string; pathname: string; contentType: string }[] = [
  {
    file: 'profile_photo_1788181262553.jpg',
    pathname: 'profile/profile-photo.jpg',
    contentType: 'image/jpeg',
  },
];

const slugify = (filename: string): string =>
  filename
    .replace(/\.jpe?g$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const upload = async (pathname: string, filePath: string, contentType: string) => {
  const blob = await put(pathname, await readFile(filePath), {
    access: 'public',
    contentType,
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  return blob.url;
};

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN belum di-set (cek .env.local).');
  }

  // Ilustrasi artikel = file ber-ekstensi .jpeg. Foto profil (.jpg) sengaja
  // TIDAK ikut terambil di sini, dia diupload terpisah lewat EXTRA_FILES.
  const articleFiles = (await readdir(DIR)).filter((f) => /\.jpeg$/i.test(f));
  console.log(`Mengupload ${articleFiles.length} ilustrasi artikel...\n`);

  let failed = 0;
  let articleBase = '';

  for (const file of articleFiles) {
    const pathname = `${ARTICLE_PREFIX}/${slugify(file)}.jpeg`;
    try {
      const url = await upload(pathname, path.join(DIR, file), 'image/jpeg');
      articleBase = url.slice(0, url.indexOf(`/${ARTICLE_PREFIX}/`));
      console.log(`OK    ${file}\n      -> ${url}`);
    } catch (err) {
      failed++;
      console.error(`GAGAL ${file}:`, (err as Error).message);
    }
  }

  const extraUrls: Record<string, string> = {};
  for (const { file, pathname, contentType } of EXTRA_FILES) {
    try {
      const url = await upload(pathname, path.join(DIR, file), contentType);
      extraUrls[pathname] = url;
      console.log(`OK    ${file}\n      -> ${url}`);
    } catch (err) {
      failed++;
      console.error(`GAGAL ${file}:`, (err as Error).message);
    }
  }

  console.log(`\nSelesai. Gagal: ${failed}.`);
  if (articleBase) {
    console.log(`\nBLOB_BASE_URL (ArticleIllustration.tsx):\n${articleBase}/${ARTICLE_PREFIX}`);
  }
  for (const [pathname, url] of Object.entries(extraUrls)) {
    console.log(`\n${pathname} (author.ts / portfolioData.ts):\n${url}`);
  }
  if (failed > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});