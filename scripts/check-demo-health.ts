// scripts/check-demo-health.ts
//
// Membuka semua demo di Chromium headless dan melaporkan:
//   - Console error JS
//   - Request HTTP yang gagal (4xx/5xx)
//   - Halaman yang tampak kosong/blank (deteksi sederhana via pixel spread, sama
//     dengan yang dipakai generate-demo-thumbs.ts)
//
// Cocok untuk dijalankan sebelum deploy atau setelah batch perubahan besar.
//
// Setup (sekali saja, shared dengan generate-demo-thumbs.ts):
//   npx playwright install chromium
//
// Pakai:
//   npx tsx scripts/check-demo-health.ts              # periksa semua demo
//   npx tsx scripts/check-demo-health.ts --only=kasir # hanya file yang namanya mengandung "kasir"
//   npx tsx scripts/check-demo-health.ts --json       # keluaran JSON (untuk CI)
//
// Exit code 0 = semua OK atau hanya warning.
// Exit code 1 = ada demo yang error (JS error parah atau halaman blank).

import { readFileSync, existsSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { dirname, extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'public');
const DEMOS_DIR = join(PUBLIC_DIR, 'demos');
const MANIFEST = join(DEMOS_DIR, 'demos.json');
const TIMEOUT_MS = 20_000;

interface DemoEntry {
  file: string;
  title?: string;
  thumb?: string;
}

const args = process.argv.slice(2);
const ONLY_KW = (args.find((a) => a.startsWith('--only='))?.slice(7) ?? '')
  .split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
const JSON_OUTPUT = args.includes('--json');

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

interface HealthResult {
  file: string;
  title: string;
  status: 'ok' | 'warn' | 'error';
  issues: string[];
}

const main = async () => {
  const demos: DemoEntry[] = JSON.parse(readFileSync(MANIFEST, 'utf-8'));

  const todo = demos.filter((d) => {
    if (!d.file) return false;
    if (ONLY_KW.length && !ONLY_KW.some((k) => d.file.toLowerCase().includes(k))) return false;
    if (!existsSync(join(DEMOS_DIR, d.file))) return false;
    return true;
  });

  if (!todo.length) {
    console.log('[health] Tidak ada demo yang perlu diperiksa.');
    return;
  }

  if (!JSON_OUTPUT) console.log(`[health] Memeriksa ${todo.length} demo...\n`);

  const { server, origin } = await startServer();

  const launchBrowser = async () => {
    try {
      return await chromium.launch();
    } catch {
      for (const channel of ['chrome', 'msedge']) {
        try {
          return await chromium.launch({ channel });
        } catch {
          // coba channel berikutnya
        }
      }
      throw new Error(
        'Tidak dapat menemukan browser. Jalankan "npx playwright install chromium" atau pastikan Chrome / Edge terinstall.'
      );
    }
  };

  const browser = await launchBrowser();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  });

  const results: HealthResult[] = [];

  for (const demo of todo) {
    const label = demo.file;
    const result: HealthResult = { file: label, title: demo.title ?? label, status: 'ok', issues: [] };

    const page = await context.newPage();
    const consoleErrors: string[] = [];
    const failedUrls: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text().slice(0, 120));
    });
    page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message.slice(0, 120)}`));
    page.on('requestfailed', (req) => {
      if (!req.url().startsWith(origin)) failedUrls.push(`${req.failure()?.errorText} — ${req.url().slice(0, 80)}`);
    });
    page.on('response', (res) => {
      if (res.status() >= 400 && !res.url().startsWith(origin)) {
        failedUrls.push(`HTTP ${res.status()} — ${res.url().slice(0, 80)}`);
      }
    });

    try {
      await page.goto(`${origin}/demos/${demo.file}`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT_MS });
      await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
      await page.waitForTimeout(1_200); // Tailwind CDN + animasi

      // Cek halaman blank via screenshot pixel spread
      const png = await page.screenshot({ type: 'png' });
      const { channels } = await sharp(png).stats();
      const spread = channels.slice(0, 3).reduce((sum, c) => sum + c.stdev, 0) / 3;

      if (spread < 5) result.issues.push(`BLANK: halaman tampak hampir kosong (pixel spread=${spread.toFixed(1)})`);
      if (consoleErrors.length > 0) result.issues.push(...consoleErrors.map((e) => `JS-ERROR: ${e}`));
      if (failedUrls.length > 0) result.issues.push(...failedUrls.slice(0, 5).map((u) => `NET-FAIL: ${u}`));

      if (result.issues.length === 0) {
        result.status = 'ok';
      } else {
        // Blank atau JS error parah = error; gagal request CDN/font = hanya warning
        const hasError = result.issues.some((i) => i.startsWith('BLANK') || i.startsWith('JS-ERROR'));
        result.status = hasError ? 'error' : 'warn';
      }
    } catch (err) {
      result.status = 'error';
      result.issues.push(`TIMEOUT/CRASH: ${(err as Error).message.slice(0, 120)}`);
    } finally {
      await page.close();
    }

    results.push(result);

    if (!JSON_OUTPUT) {
      const icon = result.status === 'ok' ? '✓' : result.status === 'warn' ? '!' : '✗';
      console.log(`  ${icon} ${label}`);
      if (result.issues.length) {
        result.issues.forEach((iss) => console.log(`      ${iss}`));
      }
    }
  }

  await browser.close();
  server.close();

  const errors = results.filter((r) => r.status === 'error');
  const warns = results.filter((r) => r.status === 'warn');

  if (JSON_OUTPUT) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    console.log(`\n[health] Selesai: ${results.length - errors.length - warns.length} OK, ${warns.length} warning, ${errors.length} error.`);
    if (errors.length) {
      console.log('\nDemo yang perlu dicek segera:');
      errors.forEach((r) => console.log(`  ✗ ${r.file}: ${r.issues[0]}`));
    }
  }

  if (errors.length) process.exitCode = 1;
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
