// scripts/generate-demo-thumbs.ts
//
// Membuat thumbnail galeri (public/demos/thumbs/*.webp) otomatis dengan cara
// membuka tiap demo di Chromium headless lalu mengambil screenshot viewport.
// Ukuran keluaran seragam 1280x800 (16:10) — sama dengan aspect-ratio thumb di
// galeri versi mobile (lihat .thumb di public/demos/index.html).
//
// Setup sekali saja:
//   npm i -D playwright sharp tsx
//   npx playwright install chromium
//
// Pakai:
//   npx tsx scripts/generate-demo-thumbs.ts                 # hanya yang thumb-nya belum ada
//   npx tsx scripts/generate-demo-thumbs.ts --all           # bikin ulang semuanya
//   npx tsx scripts/generate-demo-thumbs.ts --only=kasir,pos  # hanya file yang namanya mengandung kata itu
//
// Hasil otomatis tidak selalu sempurna (demo dengan splash screen, modal
// pembuka, atau animasi panjang). Untuk kasus begitu, tambahkan field opsional
// di entri demos.json:
//   "thumbWait":   2500                 // tunggu tambahan (ms) sebelum screenshot
//   "thumbClick":  ["#btn-mulai"]       // selector yang diklik dulu (tutup intro/modal)
//   "thumbScrollY": 400                 // geser halaman (px) sebelum screenshot
// Kalau tetap kurang bagus, screenshot manual boleh ditaruh di folder thumbs/
// dengan nama yang sama — tanpa --all, file yang sudah ada tidak ditimpa.

import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { dirname, extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'public');
const DEMOS_DIR = join(PUBLIC_DIR, 'demos');
const MANIFEST = join(DEMOS_DIR, 'demos.json');

const WIDTH = 1280;
const HEIGHT = 800;
const QUALITY = 80;

interface DemoEntry {
  file: string;
  thumb?: string;
  title?: string;
  thumbWait?: number;
  thumbClick?: string[];
  thumbScrollY?: number;
}

const args = process.argv.slice(2);
const FORCE = args.includes('--all');
const ONLY = (args.find((a) => a.startsWith('--only='))?.slice(7) ?? '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

// Server statis kecil untuk folder public/, supaya path absolut di demo
// (mis. /icons/...) tetap ter-resolve — tidak seperti kalau dibuka lewat file://.
const startServer = (): Promise<{ server: Server; origin: string }> =>
  new Promise((resolve) => {
    const server = createServer((req, res) => {
      const pathname = decodeURIComponent((req.url ?? '/').split('?')[0]);
      const filePath = normalize(join(PUBLIC_DIR, pathname));
      if (!filePath.startsWith(PUBLIC_DIR + sep) && filePath !== PUBLIC_DIR) {
        res.writeHead(403).end();
        return;
      }
      try {
        const body = readFileSync(filePath);
        res.writeHead(200, { 'content-type': MIME[extname(filePath)] ?? 'application/octet-stream' });
        res.end(body);
      } catch {
        res.writeHead(404).end('not found');
      }
    });
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      resolve({ server, origin: `http://127.0.0.1:${port}` });
    });
  });

const main = async () => {
  const demos: DemoEntry[] = JSON.parse(readFileSync(MANIFEST, 'utf-8'));

  const todo = demos.filter((d) => {
    if (!d.file || !d.thumb) return false;
    if (ONLY.length && !ONLY.some((k) => d.file.toLowerCase().includes(k))) return false;
    return FORCE || ONLY.length > 0 || !existsSync(join(DEMOS_DIR, d.thumb));
  });

  if (!todo.length) {
    console.log('[thumbs] Tidak ada yang perlu dibuat (semua thumbnail sudah ada). Pakai --all untuk membuat ulang.');
    return;
  }

  console.log(`[thumbs] ${todo.length} thumbnail akan dibuat...`);
  const { server, origin } = await startServer();
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce', // demo yang menghormati preferensi ini langsung tampil tanpa animasi masuk
  });

  let failed = 0;
  const warnings: string[] = [];

  for (const demo of todo) {
    const label = demo.file;
    const outPath = join(DEMOS_DIR, demo.thumb!);
    const htmlPath = join(DEMOS_DIR, demo.file);
    if (!existsSync(htmlPath)) {
      console.error(`  ✗ ${label}: file HTML tidak ditemukan`);
      failed++;
      continue;
    }

    const page = await context.newPage();
    let failedRequests = 0;
    page.on('requestfailed', (r) => {
      if (!r.url().startsWith(origin)) failedRequests++;
    });
    page.on('response', (r) => {
      if (r.status() >= 400) failedRequests++;
    });

    try {
      await page.goto(`${origin}/demos/${demo.file}`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});

      await page.addStyleTag({ content: 'html{scrollbar-width:none}::-webkit-scrollbar{display:none}' });

      // Tutup intro/modal kalau diminta lewat demos.json
      for (const selector of demo.thumbClick ?? []) {
        await page.click(selector, { timeout: 3_000 }).catch(() => warnings.push(`${label}: selector "${selector}" tidak ditemukan`));
      }

      // Tunggu font & gambar selesai dimuat (gambar yang gagal tidak menahan)
      await page.evaluate(async () => {
        await (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts?.ready;
        const pending = Array.from(document.images).filter((img) => !img.complete);
        await Promise.all(
          pending.map(
            (img) =>
              new Promise<void>((done) => {
                img.addEventListener('load', () => done(), { once: true });
                img.addEventListener('error', () => done(), { once: true });
                setTimeout(done, 8_000);
              })
          )
        );
      });

      if (demo.thumbScrollY) await page.evaluate((y) => window.scrollTo(0, y), demo.thumbScrollY);
      await page.waitForTimeout(900 + (demo.thumbWait ?? 0)); // Tailwind CDN + animasi masuk

      const png = await page.screenshot({ type: 'png' });
      const webp = await sharp(png).resize(WIDTH, HEIGHT).webp({ quality: QUALITY, effort: 5 }).toBuffer();
      mkdirSync(dirname(outPath), { recursive: true });
      writeFileSync(outPath, webp);

      // Pengaman kasar: gambar nyaris satu warna biasanya berarti halaman belum
      // tampil (splash/blank) atau CSS CDN gagal dimuat.
      const { channels } = await sharp(png).stats();
      const spread = channels.slice(0, 3).reduce((sum, c) => sum + c.stdev, 0) / 3;
      const notes: string[] = [];
      if (spread < 6) notes.push('tampak hampir polos — cek manual');
      if (failedRequests > 0) notes.push(`${failedRequests} request gagal (CDN/gambar) — mungkin tidak lengkap`);
      console.log(`  ${notes.length ? '!' : '✓'} ${label} → ${demo.thumb} (${Math.round(webp.length / 1024)} KB)${notes.length ? '  [' + notes.join('; ') + ']' : ''}`);
      if (notes.length) warnings.push(`${label}: ${notes.join('; ')}`);
    } catch (err) {
      failed++;
      console.error(`  ✗ ${label}: ${(err as Error).message}`);
    } finally {
      await page.close();
    }
  }

  await browser.close();
  server.close();

  if (warnings.length) {
    console.log('\n[thumbs] Perlu dicek manual:');
    warnings.forEach((w) => console.log(`  - ${w}`));
  }
  console.log(`\n[thumbs] Selesai: ${todo.length - failed} berhasil, ${failed} gagal.`);
  if (failed) process.exitCode = 1;
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
