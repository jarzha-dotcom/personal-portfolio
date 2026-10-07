// scripts/compile-demo-css.mjs
//
// Mengompilasi Tailwind CSS statis untuk semua demo di public/demos/:
// 1. Mengekstrak tailwind.config dari tiap file demo (jika ada)
// 2. Mengompilasi utility classes menggunakan @tailwindcss/node v4 (dengan @config)
// 3. Meminifikasi output ke public/demos/css/<nama-demo>.css
// 4. Mengganti cdn.tailwindcss.com dan tailwind.config dengan <link rel="stylesheet" href="./css/<nama-demo>.css">
//
// Pakai:
//   node scripts/compile-demo-css.mjs              # proses semua demo
//   node scripts/compile-demo-css.mjs --dry-run    # hanya tampilkan preview
//   node scripts/compile-demo-css.mjs --only=kasir # hanya demo tertentu

import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile, optimize } from '@tailwindcss/node';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DEMOS_DIR = join(ROOT, 'public', 'demos');
const CSS_DIR = join(DEMOS_DIR, 'css');
const MANIFEST = join(DEMOS_DIR, 'demos.json');

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const ONLY_KW = (args.find(a => a.startsWith('--only='))?.slice(7) ?? '')
  .split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

if (!existsSync(CSS_DIR)) {
  mkdirSync(CSS_DIR, { recursive: true });
}

// Marker untuk link CSS yang diinjeksi
const TW_MARKER = '<!-- @jz-tw-css -->';

async function compileDemo(demoFile) {
  const filePath = join(DEMOS_DIR, demoFile);
  let html = readFileSync(filePath, 'utf-8');

  // Ekstrak tailwind.config jika ada
  const configMatch = html.match(/<script[^>]*>\s*tailwind\.config\s*=\s*([\s\S]*?)\s*<\/script>/i);
  let hasCustomConfig = false;
  let tempConfigPath = null;

  if (configMatch) {
    hasCustomConfig = true;
    const rawConfig = configMatch[1].replace(/;\s*$/, '');
    tempConfigPath = join(__dirname, `__temp_cfg_${demoFile.replace('.html', '')}.cjs`);
    // Bungkus config agar bisa di-require oleh Tailwind CLI / @config
    writeFileSync(tempConfigPath, `module.exports = (${rawConfig});`, 'utf-8');
  }

  try {
    let inputCss = '@import "tailwindcss";';
    if (hasCustomConfig && tempConfigPath) {
      // Relative path dari scripts dir
      inputCss += `\n@config "./${tempConfigPath.split(/[/\\]/).pop()}";`;
    }

    const compiler = await compile(inputCss, {
      base: __dirname,
      onDependency: () => {}
    });

    // Ekstrak kandidat class name dari HTML
    // Gunakan regex pencari token class
    const tokens = html.match(/[a-zA-Z0-9_\-\:\[\]\/\#\%]+/g) || [];
    const uniqueCandidates = Array.from(new Set(tokens));

    const rawCss = compiler.build(uniqueCandidates);
    const minified = optimize(rawCss, { minify: true }).code;

    const cssFileName = demoFile.replace('.html', '.css');
    const cssOutputPath = join(CSS_DIR, cssFileName);

    if (!DRY_RUN) {
      writeFileSync(cssOutputPath, minified, 'utf-8');
    }

    // Update HTML demo: ganti CDN dan inline tailwind.config dengan <link rel="stylesheet">
    const cssLinkTag = `${TW_MARKER}\n  <link rel="stylesheet" href="./css/${cssFileName}">`;

    let updatedHtml = html;

    // Hapus script CDN tailwind
    updatedHtml = updatedHtml.replace(/\s*<script\s+src=["']https:\/\/cdn\.tailwindcss\.com["']><\/script>/gi, '');

    // Hapus inline tailwind.config script
    if (configMatch) {
      updatedHtml = updatedHtml.replace(configMatch[0], '');
    }

    // Hapus marker / link lama jika sebelumnya sudah pernah di-inject
    updatedHtml = updatedHtml.replace(/<!-- @jz-tw-css -->\s*<link\s+rel=["']stylesheet["']\s+href=["']\.\/css\/[^"']+["']>/gi, '');

    // Sisipkan link CSS baru sebelum fontawesome atau sebelum </head>
    const faMatch = updatedHtml.match(/<!-- Font\s*Awesome/i) || updatedHtml.match(/<link\s+rel=["']stylesheet["'][^>]*font-awesome/i);
    if (faMatch) {
      const idx = updatedHtml.indexOf(faMatch[0]);
      updatedHtml = updatedHtml.slice(0, idx) + `${cssLinkTag}\n  ` + updatedHtml.slice(idx);
    } else {
      updatedHtml = updatedHtml.replace('</head>', `  ${cssLinkTag}\n</head>`);
    }

    if (!DRY_RUN) {
      writeFileSync(filePath, updatedHtml, 'utf-8');
    }

    return {
      cssSize: minified.length,
      hasConfig: hasCustomConfig
    };
  } finally {
    if (tempConfigPath && existsSync(tempConfigPath)) {
      try { unlinkSync(tempConfigPath); } catch {}
    }
  }
}

async function main() {
  const demos = JSON.parse(readFileSync(MANIFEST, 'utf-8'));
  console.log(`[compile-css] Memulai kompilasi Tailwind CSS untuk ${demos.length} demo...\n`);

  let success = 0;
  let failed = 0;

  for (const entry of demos) {
    if (!entry.file) continue;
    if (ONLY_KW.length && !ONLY_KW.some(k => entry.file.toLowerCase().includes(k))) continue;

    const start = Date.now();
    try {
      const res = await compileDemo(entry.file);
      const elapsed = Date.now() - start;
      const sizeKb = (res.cssSize / 1024).toFixed(1);
      console.log(`  ✓ ${entry.file} -> css/${entry.file.replace('.html', '.css')} (${sizeKb} KB, ${elapsed}ms)`);
      success++;
    } catch (err) {
      console.error(`  ✗ ${entry.file}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n[compile-css] Selesai: ${success} berhasil, ${failed} gagal.`);
  if (DRY_RUN) console.log('[compile-css] Mode --dry-run: tidak ada perubahan yang ditulis.');
  if (failed > 0) process.exitCode = 1;
}

main().catch(err => {
  console.error('[compile-css] Fatal error:', err);
  process.exit(1);
});
