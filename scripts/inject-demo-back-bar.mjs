// scripts/inject-demo-back-bar.mjs
//
// Menyisipkan dua blok ke setiap file demo di public/demos/:
//
//   1. Tag OG di <head> (og:title, og:description, og:image, og:url)
//      agar link demo yang dibagikan via WA/Telegram muncul sebagai kartu bergambar.
//
//   2. Bar navigasi balik ("← Galeri" + "arzhaning.my.id" + "Mau seperti ini?")
//      fixed di pojok bawah layar.
//
// Pakai:
//   node scripts/inject-demo-back-bar.mjs              # proses / update semua demo
//   node scripts/inject-demo-back-bar.mjs --force      # paksa inject ulang semua
//   node scripts/inject-demo-back-bar.mjs --dry-run    # preview tanpa tulis
//   node scripts/inject-demo-back-bar.mjs --only=kasir # hanya demo yg namanya mengandung "kasir"

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DEMOS_DIR = join(ROOT, 'public', 'demos');
const MANIFEST = join(DEMOS_DIR, 'demos.json');
const CANONICAL_BASE = 'https://arzhaning.my.id';
const GALLERY_URL = `${CANONICAL_BASE}/demos/index.html`;

// Ambil nomor WA dari portfolioData.ts
const portfolioSrc = readFileSync(join(ROOT, 'src', 'data', 'portfolioData.ts'), 'utf-8');
const waMatch = portfolioSrc.match(/phone\s*:\s*['"`]([^'"`]+)['"`]/);
const rawPhone = waMatch ? waMatch[1] : '';
const WA_NUMBER = rawPhone.replace(/[^0-9]/g, '');

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const DRY_RUN = args.includes('--dry-run');
const ONLY_KW = (args.find(a => a.startsWith('--only='))?.slice(7) ?? '')
  .split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

const BAR_START = '<!-- @jz-bar-start -->';
const BAR_END = '<!-- @jz-bar-end -->';
const WM_END = '<!-- @jz-wm-end -->';

function stripExistingBar(html) {
  // Strip format baru <!-- @jz-bar-start --> ... <!-- @jz-bar-end -->
  html = html.replace(/<!-- @jz-bar-start -->[\s\S]*?<!-- @jz-bar-end -->\s*/g, '');
  // Strip format lama <!-- @jz-bar-injected --> ... </div>
  html = html.replace(/<!-- @jz-bar-injected -->[\s\S]*?<\/div>\s*/g, '');
  return html;
}

// Bar HTML — sepenuhnya inline, tidak bergantung framework apapun
function buildBarHtml(title, waNumber) {
  const waMsg = waNumber
    ? `Halo Arzha, saya tertarik dengan demo "${title}". Boleh diskusi untuk dibuatkan yang seperti ini?`
    : '';
  const waHref = waNumber
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent(waMsg)}`
    : null;

  return `
${BAR_START}
<style>
/* Sembunyikan watermark badge lama jika masih ada di cache */
#__jzwm{display:none!important}
body{padding-bottom:46px!important;box-sizing:border-box!important}

#__jz-bar{position:fixed;bottom:0;left:0;right:0;z-index:2147483640;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:0 16px;height:46px;background:rgba(15,23,42,.95);border-top:1px solid rgba(255,255,255,.12);box-shadow:0 -4px 18px rgba(0,0,0,.4);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);font:600 13px/1 system-ui,-apple-system,sans-serif;color:#cbd5e1;box-sizing:border-box}
#__jz-bar *{box-sizing:border-box}
#__jz-bar .jz-bar-nav{display:flex;align-items:center;gap:8px;flex-shrink:0}
#__jz-bar .jz-btn-gallery{display:inline-flex;align-items:center;gap:6px;color:#2dd4bf;text-decoration:none;white-space:nowrap;padding:6px 10px;border-radius:8px;background:rgba(45,212,191,.1);border:1px solid rgba(45,212,191,.25);transition:all .15s}
#__jz-bar .jz-btn-gallery:hover{background:rgba(45,212,191,.2);color:#5eead4}
#__jz-bar .jz-btn-home{display:inline-flex;align-items:center;gap:5px;color:#94a3b8;text-decoration:none;white-space:nowrap;padding:6px 9px;border-radius:8px;font-size:12px;font-weight:500;transition:all .15s}
#__jz-bar .jz-btn-home:hover{color:#f8fafc;background:rgba(255,255,255,.06)}
#__jz-bar .jz-dot{width:4px;height:4px;border-radius:50%;background:#2dd4bf;opacity:.7}
#__jz-bar .jz-sep{color:rgba(255,255,255,.18);font-weight:300}
#__jz-bar .jz-title{font-size:12px;opacity:.75;color:#e2e8f0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:320px;text-align:center}
#__jz-bar .jz-wa{display:inline-flex;align-items:center;gap:7px;background:#25d366;color:#052e16!important;font-weight:700;font-size:12.5px;text-decoration:none;white-space:nowrap;padding:7px 13px;border-radius:999px;box-shadow:0 2px 10px rgba(37,211,102,.35);transition:all .15s;flex-shrink:0}
#__jz-bar .jz-wa:hover{background:#22c35e;box-shadow:0 4px 14px rgba(37,211,102,.5);transform:translateY(-1px)}
@media(max-width:720px){#__jz-bar .jz-title{display:none}}
@media(max-width:500px){#__jz-bar{padding:0 10px;gap:6px}#__jz-bar .jz-btn-gallery span{font-size:12px}#__jz-bar .jz-btn-home .jz-domain{display:none}#__jz-bar .jz-wa{padding:6px 11px;font-size:11.5px}}
</style>
<div id="__jz-bar" aria-label="Navigasi demo" role="navigation">
  <div class="jz-bar-nav">
    <a class="jz-btn-gallery" href="${GALLERY_URL}" aria-label="Kembali ke Galeri Contoh Desain">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
      <span>Galeri</span>
    </a>
    <span class="jz-sep" aria-hidden="true">|</span>
    <a class="jz-btn-home" href="${CANONICAL_BASE}" target="_blank" rel="noopener noreferrer" title="Kunjungi situs utama K. Arzhaning Jagad" aria-label="Kunjungi situs utama arzhaning.my.id">
      <span class="jz-dot" aria-hidden="true"></span>
      <span class="jz-domain">arzhaning.my.id</span>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>
    </a>
  </div>
  <span class="jz-title" title="${title.replace(/"/g, '&quot;')}">${title.replace(/"/g, '&quot;')}</span>
  ${waHref ? `<a class="jz-wa" href="${waHref}" target="_blank" rel="noopener noreferrer" aria-label="Tanya via WhatsApp tentang ${title.replace(/"/g, '&quot;')}">
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2a9.9 9.9 0 0 0-8.5 14.9L2 22l5.27-1.38A9.9 9.9 0 1 0 12.04 2zm0 1.8a8.1 8.1 0 1 1-4.3 15l-.3-.18-3.1.8.83-3.02-.2-.31A8.1 8.1 0 0 1 12.04 3.8zm-3.1 3.9c-.2 0-.5.07-.76.35-.26.28-1 .98-1 2.4s1.03 2.78 1.17 2.97c.14.2 2 3.2 4.93 4.36 2.44.96 2.93.77 3.46.72.53-.05 1.7-.7 1.94-1.37.24-.67.24-1.25.17-1.37-.07-.12-.26-.2-.55-.34-.29-.14-1.7-.84-1.96-.93-.27-.1-.46-.14-.65.14-.19.29-.74.93-.9 1.12-.17.2-.34.22-.63.07-.29-.14-1.22-.45-2.32-1.43-.86-.76-1.44-1.7-1.6-1.99-.17-.29-.02-.44.12-.58.13-.13.29-.34.43-.5.14-.17.19-.29.29-.48.1-.2.05-.36-.02-.5-.07-.15-.65-1.57-.9-2.15-.23-.56-.47-.48-.65-.49h-.55z"/></svg>
    <span>Mau seperti ini?</span>
  </a>` : ''}
</div>
${BAR_END}`;
}

function buildOgTags(entry) {
  const title = entry.title ?? '';
  const desc = entry.desc ?? '';
  const thumb = entry.thumb ?? '';
  const file = entry.file ?? '';
  const pageUrl = `${CANONICAL_BASE}/demos/${file}`;
  const imageUrl = thumb ? `${CANONICAL_BASE}/demos/${thumb}` : '';

  const lines = [
    `<meta property="og:type" content="website">`,
    `<meta property="og:title" content="${title.replace(/"/g, '&quot;')} | K. Arzhaning Jagad (Arzha)">`,
    `<meta property="og:description" content="${desc.replace(/"/g, '&quot;').slice(0, 200)}">`,
    `<meta property="og:url" content="${pageUrl}">`,
    `<meta property="og:site_name" content="arzhaning.my.id">`,
  ];
  if (imageUrl) {
    lines.push(`<meta property="og:image" content="${imageUrl}">`);
    lines.push(`<meta property="og:image:width" content="1280">`);
    lines.push(`<meta property="og:image:height" content="800">`);
    lines.push(`<meta name="twitter:card" content="summary_large_image">`);
    lines.push(`<meta name="twitter:image" content="${imageUrl}">`);
  }
  return `<!-- @jz-og-start -->\n${lines.join('\n')}\n<!-- @jz-og-end -->`;
}

// ---

const demos = JSON.parse(readFileSync(MANIFEST, 'utf-8'));

let skipped = 0, written = 0, errors = 0;

for (const entry of demos) {
  if (!entry.file || !entry.title) continue;
  if (ONLY_KW.length && !ONLY_KW.some(k => entry.file.toLowerCase().includes(k))) continue;

  const filePath = join(DEMOS_DIR, entry.file);
  if (!existsSync(filePath)) {
    console.warn(`  ⚠ ${entry.file}: file tidak ditemukan, dilewati`);
    errors++;
    continue;
  }

  let html = readFileSync(filePath, 'utf-8');

  // Idempoten check: jika sudah format baru dan bukan FORCE, lewati
  if (html.includes(BAR_START) && !FORCE) {
    console.log(`  = ${entry.file}: sudah di-inject (format terbaru), dilewati`);
    skipped++;
    continue;
  }

  // Bersihkan bar versi lama jika ada
  html = stripExistingBar(html);

  // 1. Sisipkan OG tags jika belum ada atau update
  const ogBlock = buildOgTags(entry);
  html = html.replace(/<!-- @jz-og-start -->[\s\S]*?<!-- @jz-og-end -->\n?/g, '');
  const wmEndIdx = html.indexOf(WM_END);
  if (wmEndIdx !== -1) {
    const insertAt = html.indexOf(WM_END) + WM_END.length;
    html = html.slice(0, insertAt) + '\n' + ogBlock + html.slice(insertAt);
  } else if (html.includes('</head>')) {
    html = html.replace('</head>', ogBlock + '\n</head>');
  }

  // 2. Sisipkan bar setelah <body>
  const barHtml = buildBarHtml(entry.title, WA_NUMBER);
  const bodyMatch = html.match(/<body[^>]*>/i);
  if (bodyMatch) {
    const bodyEndIdx = html.indexOf(bodyMatch[0]) + bodyMatch[0].length;
    html = html.slice(0, bodyEndIdx) + barHtml + html.slice(bodyEndIdx);
  } else {
    // Fallback: sisipkan sebelum </html>
    html = html.replace(/<\/html>/i, barHtml + '\n</html>');
  }

  if (DRY_RUN) {
    console.log(`  [dry-run] ${entry.file}: akan di-inject`);
    written++;
    continue;
  }

  try {
    writeFileSync(filePath, html, 'utf-8');
    console.log(`  ✓ ${entry.file}`);
    written++;
  } catch (err) {
    console.error(`  ✗ ${entry.file}: ${err.message}`);
    errors++;
  }
}

console.log(`\n[inject-bar] Selesai: ${written} diproses, ${skipped} dilewati, ${errors} error.`);
if (DRY_RUN) console.log('[inject-bar] Mode --dry-run: tidak ada file yang ditulis.');
if (errors) process.exitCode = 1;
