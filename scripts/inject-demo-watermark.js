/**
 * inject-demo-watermark.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Injects a multi-layer copyright watermark into every demo-*.html file under
 * public/demos/. Safe to re-run: files already containing the marker are
 * skipped unless --force is passed.
 *
 * Usage:
 *   node scripts/inject-demo-watermark.js           ← skip existing
 *   node scripts/inject-demo-watermark.js --force   ← re-inject / update all
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEMOS_DIR = join(__dirname, '..', 'public', 'demos');
const FORCE = process.argv.includes('--force');

// ── Marker ────────────────────────────────────────────────────────────────────
const MARKER_START = '<!-- @jz-wm-start -->';
const MARKER_END   = '<!-- @jz-wm-end -->';

// ── Console watermark banner ──────────────────────────────────────────────────
// Ditampilkan di DevTools console setiap kali demo dibuka.
// Pakai %c CSS styling untuk efek berlapis yang mencolok.
const CONSOLE_BANNER = `(function(){
  var L=console.log.bind(console);
  L('%c                                              ','background:#0d9488;padding:2px 0;display:block');
  L('%c  \\u00a9 DEMO DESAIN \\u2014 arzhaning.my.id  ','background:#0d9488;color:#fff;font:700 13px/2 monospace;padding:0 12px;display:block');
  L('%c  Hak Cipta Dilindungi. Unauthorized Use Prohibited.  ','background:#0f766e;color:#99f6e4;font:500 10.5px/1.8 monospace;padding:0 12px;display:block');
  L('%c                                              ','background:#0f766e;padding:2px 0;display:block');
  L('%c\\u26a0 File ini adalah milik eksklusif K. Arzhaning Jagad.\\nDilarang keras menyalin, mendistribusikan, atau menjual\\ndesain ini tanpa izin tertulis.\\n\\nUnauthorized use constitutes copyright infringement\\nunder the Berne Convention & DMCA.','color:#b45309;font-size:10.5px;line-height:1.7');
})()`;

// ── Watermark snippet (semua layer) ──────────────────────────────────────────
function buildSnippet() {
  return `${MARKER_START}
<!--
  \u256c\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u256c
  \u2551  \u00a9 2026 K. Arzhaning Jagad (Arzha) \u2014 arzhaning.my.id        \u2551
  \u2551  DEMO ONLY. All rights reserved.                             \u2551
  \u2551  Dilarang keras menyalin, menjual, atau menggunakan ulang    \u2551
  \u2551  desain ini tanpa izin tertulis dari pemilik.                \u2551
  \u2551  Unauthorized use constitutes copyright infringement.        \u2551
  \u256a\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u256a
-->
<meta name="author" content="K. Arzhaning Jagad (Arzha)">
<meta name="copyright" content="\u00a9 2026 K. Arzhaning Jagad. All Rights Reserved. Demo Only.">
<meta name="robots" content="noindex, nofollow">
<style>
/* jz-wm: copyright watermark \u2014 jangan dihapus */
#__jzwm{position:fixed!important;bottom:14px!important;right:16px!important;z-index:2147483647!important;display:flex!important;align-items:center!important;gap:6px!important;background:rgba(10,10,10,.78)!important;color:#e5e7eb!important;font:600 10.5px/1 system-ui,-apple-system,sans-serif!important;padding:6px 11px 6px 9px!important;border-radius:8px!important;letter-spacing:.03em!important;pointer-events:none!important;user-select:none!important;backdrop-filter:blur(8px)!important;-webkit-backdrop-filter:blur(8px)!important;border:1px solid rgba(255,255,255,.12)!important;box-shadow:0 4px 16px rgba(0,0,0,.45)!important;white-space:nowrap!important}
#__jzwm span{display:inline-block!important;width:6px!important;height:6px!important;border-radius:50%!important;background:#2dd4bf!important;flex-shrink:0!important}
</style>
<script>
(function(){
  var ID='__jzwm',LABEL='\u00a9 Demo \u00b7 arzhaning.my.id';
  function mk(){var d=document.createElement('div');d.id=ID;var s=document.createElement('span');d.appendChild(s);d.appendChild(document.createTextNode('\u00a0'+LABEL));d.setAttribute('aria-hidden','true');d.setAttribute('role','presentation');return d}
  function ins(){if(!document.getElementById(ID)&&document.body)document.body.appendChild(mk())}
  var ob=new MutationObserver(function(ml){for(var i=0;i<ml.length;i++){var m=ml[i];if(m.removedNodes.length){for(var j=0;j<m.removedNodes.length;j++){if(m.removedNodes[j].id===ID){ins();break}}}}});
  function init(){ins();ob.observe(document.body||document.documentElement,{childList:true,subtree:true})}
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init)}else{init()}
  ${CONSOLE_BANNER}
})();
<\/script>
${MARKER_END}`;
}

// ── Strip existing watermark (untuk --force) ──────────────────────────────────
// Handle dua format marker:
//   - Baru: <!-- @jz-wm-start --> ... <!-- @jz-wm-end -->
//   - Lama: <!-- @jz-wm --> ... </script>  (tanpa closing marker)
function strip(content) {
  // Strip format baru
  const s1 = content.indexOf(MARKER_START);
  const e1 = content.indexOf(MARKER_END);
  if (s1 !== -1 && e1 !== -1) {
    content = content.slice(0, s1) + content.slice(e1 + MARKER_END.length).replace(/^\n/, '');
  }

  // Strip format lama (<!-- @jz-wm --> sampai </script> pertama sesudahnya)
  const OLD_MARKER = '<!-- @jz-wm -->';
  const s2 = content.indexOf(OLD_MARKER);
  if (s2 !== -1) {
    const closeTag = '</script>';
    const e2 = content.indexOf(closeTag, s2);
    if (e2 !== -1) {
      content = content.slice(0, s2) + content.slice(e2 + closeTag.length).replace(/^\n/, '');
    }
  }

  return content;
}

// ── Inject helper ─────────────────────────────────────────────────────────────
function inject(content) {
  const snippet = buildSnippet();
  const charsetMatch = content.match(/<meta\s+charset[^>]+>/i);
  if (charsetMatch) {
    return content.replace(charsetMatch[0], charsetMatch[0] + '\n' + snippet);
  }
  if (content.includes('<head>')) {
    return content.replace('<head>', '<head>\n' + snippet);
  }
  return snippet + '\n' + content;
}

// ── Main ──────────────────────────────────────────────────────────────────────
const files = readdirSync(DEMOS_DIR).filter(
  (f) => f.startsWith('demo-') && f.endsWith('.html'),
);

let injected = 0, updated = 0, skipped = 0;

for (const file of files) {
  const filePath = join(DEMOS_DIR, file);
  let content = readFileSync(filePath, 'utf8');
  const hasMarker = content.includes(MARKER_START);

  if (hasMarker && !FORCE) {
    console.log(`  \u23e9  skip    ${file}`);
    skipped++;
    continue;
  }

  if (hasMarker && FORCE) {
    content = strip(content);
    content = inject(content);
    writeFileSync(filePath, content, 'utf8');
    console.log(`  \ud83d\udd04  update  ${file}`);
    updated++;
  } else {
    content = inject(content);
    writeFileSync(filePath, content, 'utf8');
    console.log(`  \u2705  inject  ${file}`);
    injected++;
  }
}

console.log(`\nSelesai: ${injected} diinjeksi, ${updated} diupdate, ${skipped} dilewati.`);
