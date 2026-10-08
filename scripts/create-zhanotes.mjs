import fs from 'node:fs';
import path from 'node:path';

const srcFile = 'C:\\Users\\ThinkPad\\Downloads\\Catatan.html';
const outDir = path.resolve('public/zhanotes');
const outFile = path.join(outDir, 'index.html');

console.log('Reading source file:', srcFile);
let content = fs.readFileSync(srcFile, 'utf8');

// Strip outer wrapper if present (the duplicate <!doctype html><html>...<body> at top and </body></html> at bottom)
const outerStartMatch = content.match(/^<!doctype html><html><head>[\s\S]*?<\/head><body>\r?\n(<!doctype html><html lang="id">)/i);
if (outerStartMatch) {
  console.log('Detected outer wrapper, stripping...');
  content = content.slice(outerStartMatch[0].length - outerStartMatch[1].length);
  content = content.replace(/<\/body>\s*<\/html>\s*<\/body>\s*<\/html>\s*$/i, '</body>\n</html>');
}

// 1. Update Title, Meta, and Favicon
content = content.replace(
  /<title>Catatan<\/title>/i,
  `<title>ZhaNotes — Personal Knowledge Management & Canvas Workspace</title>
<meta name="description" content="Workspace pencatatan visual offline-first mandiri: Rich Text lengkap, Freeform Canvas dengan kartu yang dapat dipindah & diubah ukurannya, PDF Reader & Annotator, Audio Memo berpenanda waktu, Wiki Backlinks [[ ]], dan ekspor Word/PDF 100% Client-Side.">
<meta name="theme-color" content="#faf9f7">
<link rel="icon" href="/favicon.ico">`
);

// 2. Fix download function dl(fn, data) for browser Blob download
const oldDlPattern = /async function dl\(fn,data\)\{const D=window\.claude&&await claude\.use\('downloads'\);[\s\S]*?return false\}\}/;
const newDlCode = `async function dl(fn,data){
  try {
    const blob = data instanceof Blob ? data : new Blob([data], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fn.replace(/[\\\\/:*?"<>|]/g, '_');
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    toast('File berhasil diunduh: ' + fn);
    return true;
  } catch (e) {
    toast('Gagal mengunduh file: ' + (e && e.message || ''));
    return false;
  }
}`;

if (oldDlPattern.test(content)) {
  console.log('Replacing dl() function...');
  content = content.replace(oldDlPattern, newDlCode);
} else {
  content = content.replace(/async function dl\(fn,data\)\{[\s\S]*?return false\}\}/, newDlCode);
}

// 3. Brand sidebar with ZhaNotes & link back to portfolio
const oldSdPattern = `$('#sd').innerHTML=\`<div class=new><button onclick="add('page')">+ Halaman</button>`;
const newSdHeader = `$('#sd').innerHTML=\`<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 4px 10px;margin-bottom:8px;border-bottom:1px solid var(--bd)"><div style="display:flex;align-items:center;gap:6px"><span style="font-size:20px">📓</span><div><strong style="font-size:15px;letter-spacing:-0.02em;display:block;line-height:1.2">ZhaNotes</strong><small style="font-size:10.5px;color:var(--mu);display:block">Local-First PKM</small></div></div><a href="/" style="font-size:11.5px;color:var(--mu);text-decoration:none;padding:4px 8px;border-radius:6px;border:1px solid var(--bd);display:inline-flex;align-items:center;gap:3px" title="Kembali ke Portofolio Arzha">← Portofolio</a></div><div class=new><button onclick="add('page')">+ Halaman</button>`;

if (content.includes(oldSdPattern)) {
  console.log('Adding ZhaNotes branding and backlink to sidebar...');
  content = content.replace(oldSdPattern, newSdHeader);
}

// 4. Enrich Seed Data in load()
const oldSeedPattern = /if\(!found\)\{S\.folders=\['Kuliah','Riset','Pribadi'\];[\s\S]*?save\(\)\}/;
const newSeedCode = `if(!found){
  S.folders=['Audit & Kontrol','Arsitektur Sistem','Riset & Catatan'];

  mk('page',{
    t:'Selamat Datang di ZhaNotes',
    folder:'Riset & Catatan',
    tags:['panduan','zhanotes','pkm'],
    body:'<p><b>ZhaNotes</b> adalah ruang kerja visual &amp; <i>Personal Knowledge Management (PKM)</i> mandiri yang berjalan <b>100% di browser lokal Anda (Local-First)</b> tanpa ketergantungan pada server pihak ketiga maupun biaya langganan bulanan (Zero Server Cost).</p>' +
         '<h3>Fitur-Fitur Utama:</h3>' +
         '<ul>' +
         '<li><b>Editor Teks Kaya Lengkap:</b> Format heading, font family, ukuran teks presisi, penyorot warna, tabel, checklist interaktif, kotak catatan (callout), dan perataan paragraf.</li>' +
         '<li><b>Kartu Teks Bebas (Canvas &amp; PDF):</b> Buat kartu teks melayang yang dapat dipindahkan (drag handle) dan diubah panjang serta lebarnya (resize corner) dengan bebas di atas kanvas coretan maupun lembar dokumen PDF.</li>' +
         '<li><b>Wiki Backlinks [[ ]]:</b> Ketik <code>[[</code> untuk menautkan catatan secara dua arah. Hubungkan catatan ini dengan [[Checklist Audit Kepatuhan SOP]] atau [[Riset Arsitektur Zero Server Cost]].</li>' +
         '<li><b>Perekam Suara &amp; 📍 Penanda:</b> Tekan <i>Rekam</i> di bagian bawah untuk merekam memo suara langsung ke IndexedDB, lengkap dengan penanda momen audio.</li>' +
         '<li><b>Mesin Ekspor Klien:</b> Ekspor catatan ke <b>Word (.docx)</b>, <b>PDF</b>, Markdown (.md), JSON, maupun gambar PNG/SVG langsung dari browser tanpa backend!</li>' +
         '</ul>' +
         '<div class="callout callout-info"><span style="font-size:16px;margin-right:4px">ℹ️</span> <b>Info Privasi:</b> Semua data, coretan tangan, dan file PDF tersimpan aman di IndexedDB perangkat ini. Anda memiliki kendali 100% atas data Anda.</div>',
    pin:1
  });

  mk('page',{
    t:'Checklist Audit Kepatuhan SOP',
    folder:'Audit & Kontrol',
    tags:['audit','sop','inventaris','operasional'],
    body:'<p>Dokumen kerja audit internal untuk verifikasi kepatuhan SOP cabang dan stock opname fisik toko/gudang.</p>' +
         '<h3>1. Verifikasi Fisik &amp; Administrasi Kasir</h3>' +
         '<div class="task-item" contenteditable="false"><input type="checkbox" onchange="this.parentElement.classList.toggle(\\'done\\', this.checked)"><span contenteditable="true" style="outline:none;flex:1">&nbsp;Lakukan surprise cash count pada laci kasir Point of Sales (POS)</span></div>' +
         '<div class="task-item" contenteditable="false"><input type="checkbox" onchange="this.parentElement.classList.toggle(\\'done\\', this.checked)"><span contenteditable="true" style="outline:none;flex:1">&nbsp;Cocokkan total fisik modal tunai harian dengan mutasi EDC / QRIS</span></div>' +
         '<div class="task-item" contenteditable="false"><input type="checkbox" onchange="this.parentElement.classList.toggle(\\'done\\', this.checked)"><span contenteditable="true" style="outline:none;flex:1">&nbsp;Periksa buku register pembatalan transaksi (void) dan otorisasi supervisor</span></div>' +
         '<h3>2. Rekonsiliasi Inventaris &amp; Alur Barang</h3>' +
         '<div class="task-item" contenteditable="false"><input type="checkbox" onchange="this.parentElement.classList.toggle(\\'done\\', this.checked)"><span contenteditable="true" style="outline:none;flex:1">&nbsp;Uji petik fisik (sampling) 20 SKU fast-moving dan 10 SKU slow-moving</span></div>' +
         '<div class="task-item" contenteditable="false"><input type="checkbox" onchange="this.parentElement.classList.toggle(\\'done\\', this.checked)"><span contenteditable="true" style="outline:none;flex:1">&nbsp;Validasi dokumen Surat Jalan barang masuk (receiving) gudang utama</span></div>' +
         '<p>Analisis potensi selisih: lihat detail skema di [[Diagram Alur Rekonsiliasi Inventaris]].</p>',
    pin:0
  });

  mk('riset',{
    t:'Riset Arsitektur Zero Server Cost',
    folder:'Arsitektur Sistem',
    tags:['arsitektur','serverless','local-first'],
    body:'<h3>Tautan</h3>' +
         '<div class="lk" contenteditable="false"><a data-u="https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API" href="https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API">IndexedDB API - MDN Web Docs</a><small>developer.mozilla.org</small><div class="lkn" contenteditable="true">Penyimpanan client-side berkapasitas besar untuk audio blob, PDF, dan catatan terstruktur.</div></div>' +
         '<h3>Kutipan</h3>' +
         '<blockquote>Local-first software enables both collaboration and ownership: it gives you the speed and privacy of local offline storage with the peace of mind of zero server hosting bills.<footer>— Local-First Software Philosophy</footer></blockquote>' +
         '<div class="callout callout-succ"><span style="font-size:16px;margin-right:4px">✅</span> <b>Keberhasilan Riset:</b> Implementasi di ZhaNotes membuktikan bahwa aplikasi produktivitas profesional (Word/PDF generator, Whiteboard, PDF Annotation) dapat berjalan mandiri 100% di browser tanpa backend berbayar.</div>',
    pin:0
  });

  mk('canvas',{
    t:'Diagram Alur Rekonsiliasi Inventaris',
    folder:'Audit & Kontrol',
    tags:['diagram','flowchart'],
    boxes:[
      {x:40, y:60, w:180, h:80, t:'1. Fisik Gudang\\n(Stock Opname)'},
      {x:260, y:60, w:180, h:80, t:'2. Sistem ERP / POS\\n(Data Buku)'},
      {x:480, y:60, w:180, h:80, t:'3. Rekonsiliasi\\n& Analisis Selisih'},
      {x:700, y:60, w:180, h:80, t:'4. Laporan Temuan\\n& Rekomendasi Audit'}
    ],
    strokes:[],
    pin:0
  });

  save();
}`;

if (oldSeedPattern.test(content)) {
  console.log('Replacing seed data with ZhaNotes domain notes...');
  content = content.replace(oldSeedPattern, newSeedCode);
}

// 5. Inject CSS for Movable & Resizable Cards, Rich Editor Toolbar, Callouts, Tables, and Checklists
const newStyles = `
/* ===== Kartu Teks Melayang (Movable & Resizable Text Cards) ===== */
.bx {
  position: absolute;
  min-width: 140px;
  min-height: 52px;
  border: 1px solid var(--bd);
  border-radius: 8px;
  background: var(--pn);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  overflow: visible;
  user-select: none;
  z-index: 10;
  box-sizing: border-box;
  transition: box-shadow 0.15s ease, border-color 0.15s ease;
}
.bx:hover {
  border-color: var(--ac);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
}
.bx.sel {
  outline: 2px solid var(--ac);
}
.bx-hdr {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 3px 6px;
  background: color-mix(in srgb, var(--bd) 40%, transparent);
  border-bottom: 1px solid var(--bd);
  border-radius: 7px 7px 0 0;
  cursor: grab;
  font-size: 11px;
  color: var(--mu);
  user-select: none;
  touch-action: none;
}
.bx-hdr:active {
  cursor: grabbing;
}
.bx-hnd {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
  letter-spacing: 0.02em;
}
.bx-del {
  background: transparent;
  border: 0;
  padding: 0 4px;
  font-size: 12px;
  color: var(--mu);
  cursor: pointer;
  border-radius: 4px;
  line-height: 1;
}
.bx-del:hover {
  color: #e11d48;
  background: #fee2e2;
}
.bx-body {
  flex: 1;
  padding: 6px 8px;
  outline: none;
  font-size: 14.5px;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
  user-select: text;
  cursor: text;
  overflow: auto;
  box-sizing: border-box;
  min-height: 30px;
}
.bx-rsz {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 16px;
  height: 16px;
  cursor: nwse-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--mu);
  font-size: 11px;
  user-select: none;
  touch-action: none;
  opacity: 0.6;
  transition: opacity 0.15s;
}
.bx:hover .bx-rsz {
  opacity: 1;
  color: var(--ac);
}
.pgw .bx {
  color: #111;
  background: #fffffffa;
  border-color: #cbd5e1;
  box-shadow: 0 3px 12px rgba(0,0,0,0.15);
}
.pgw .bx-hdr {
  background: #f1f5f9;
  border-color: #e2e8f0;
  color: #64748b;
}
.pgw .bx-body {
  color: #111;
}

/* ===== Toolbar Editor Lengkap (Expanded Text Editor Toolbar) ===== */
.ed-tb {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 12px;
  background: var(--pn);
  border-bottom: 1px solid var(--bd);
  user-select: none;
}
.tb-row {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}
.ed-tb button, .ed-tb select {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12.5px;
  min-height: 29px;
  background: var(--bg);
  border: 1px solid var(--bd);
  color: var(--tx);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: all 0.12s ease;
}
.ed-tb button:hover, .ed-tb select:hover {
  border-color: var(--ac);
  background: var(--hl);
  color: var(--ac);
}
.tb-sep {
  width: 1px;
  height: 18px;
  background: var(--bd);
  margin: 0 4px;
  flex: none;
}
.color-dropdown {
  position: relative;
  display: inline-block;
}
.color-pop {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  background: var(--pn);
  border: 1px solid var(--bd);
  border-radius: 8px;
  padding: 6px;
  display: none;
  grid-template-columns: repeat(4, 22px);
  gap: 6px;
  z-index: 50;
  box-shadow: 0 10px 25px rgba(0,0,0,0.15);
}
.color-pop.open {
  display: grid;
}
.color-pop span {
  width: 22px;
  height: 22px;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid rgba(0,0,0,0.15);
  display: inline-block;
  transition: transform 0.1s;
}
.color-pop span:hover {
  transform: scale(1.15);
}

/* Callout Kotak Catatan */
.callout {
  border-radius: 8px;
  padding: 12px 16px;
  margin: 12px 0;
  border-left: 4px solid;
  font-size: 14.5px;
  line-height: 1.55;
}
.callout-info { background: rgba(59,130,246,0.09); border-color: #3b82f6; }
.callout-warn { background: rgba(245,158,11,0.09); border-color: #f59e0b; }
.callout-succ { background: rgba(16,185,129,0.09); border-color: #10b981; }
.callout-note { background: rgba(139,92,246,0.09); border-color: #8b5cf6; }
.callout-dang { background: rgba(239,68,68,0.09); border-color: #ef4444; }

/* Checklist Task Item */
.task-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 4px 0;
  user-select: text;
}
.task-item input[type="checkbox"] {
  margin-top: 5px;
  cursor: pointer;
  accent-color: var(--ac);
  width: 16px;
  height: 16px;
  flex: none;
}
.task-item.done {
  text-decoration: line-through;
  opacity: 0.6;
}

/* Blok Kode */
#bd pre.code-blk {
  background: color-mix(in srgb, var(--tx) 7%, var(--pn));
  border: 1px solid var(--bd);
  border-radius: 8px;
  padding: 12px 14px;
  margin: 12px 0;
  font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
  font-size: 13.5px;
  line-height: 1.5;
  overflow-x: auto;
}

/* Tabel di Editor */
#bd table.tb-ed {
  width: 100%;
  border-collapse: collapse;
  margin: 14px 0;
  border: 1px solid var(--bd);
}
#bd table.tb-ed th {
  background: var(--hl);
  border: 1px solid var(--bd);
  padding: 8px 12px;
  font-weight: 600;
  text-align: left;
}
#bd table.tb-ed td {
  border: 1px solid var(--bd);
  padding: 8px 12px;
  min-width: 60px;
}

/* Presets Lebar & Jarak Baris #bd */
#bd {
  transition: max-width 0.2s ease, line-height 0.2s ease;
}
#bd.w-wide { max-width: 1040px !important; }
#bd.w-full { max-width: 100% !important; }
#bd.lh-tight { line-height: 1.35 !important; }
#bd.lh-loose { line-height: 1.85 !important; }
#bd.lh-double { line-height: 2.15 !important; }
`;

console.log('Injecting new CSS styles...');
content = content.replace('</style>', newStyles + '\n</style>');

// 6. Replace box(b) in Canvas with Movable & Resizable Card implementation
const oldCanvasBoxCode = `function box(b){const e=document.createElement('div');e.className='bx';e.contentEditable=true;e.textContent=b.t;e.style.left=b.x+'px';e.style.top=b.y+'px';e.oninput=()=>{b.t=e.innerText;touch(n)};
e.onblur=()=>{if(!b.t.trim()){n.boxes=n.boxes.filter(q=>q!==b);bel.delete(b);e.remove();touch(n)}};L.appendChild(e);bel.set(b,e);return e}`;

const newCanvasBoxCode = `function box(b){
  b.w = b.w || 200;
  b.h = b.h || 80;
  const e = document.createElement('div');
  e.className = 'bx' + (sel.b.has(b) ? ' sel' : '');
  e.style.left = b.x + 'px';
  e.style.top = b.y + 'px';
  e.style.width = b.w + 'px';
  e.style.height = b.h + 'px';

  // Drag Header
  const hdr = document.createElement('div');
  hdr.className = 'bx-hdr';
  hdr.innerHTML = '<span class="bx-hnd" title="Tahan dan geser untuk memindahkan kartu">⠿ Teks</span><button class="bx-del" title="Hapus kartu ini">✕</button>';

  // Text Body
  const body = document.createElement('div');
  body.className = 'bx-body';
  body.contentEditable = 'true';
  body.textContent = b.t;
  body.style.minHeight = Math.max(28, b.h - 30) + 'px';

  // Resize Handle
  const rsz = document.createElement('div');
  rsz.className = 'bx-rsz';
  rsz.title = 'Tarik untuk mengubah panjang & lebar';
  rsz.innerHTML = '⤡';

  e.appendChild(hdr);
  e.appendChild(body);
  e.appendChild(rsz);

  body.oninput = () => {
    b.t = body.innerText;
    touch(n);
  };
  body.onblur = () => {
    if (!b.t.trim()) {
      n.boxes = n.boxes.filter(q => q !== b);
      bel.delete(b);
      e.remove();
      touch(n);
    }
  };

  hdr.querySelector('.bx-del').onclick = ev => {
    ev.stopPropagation();
    n.boxes = n.boxes.filter(q => q !== b);
    bel.delete(b);
    e.remove();
    touch(n);
  };

  // Drag to move card
  hdr.onpointerdown = ev => {
    ev.preventDefault();
    ev.stopPropagation();
    hdr.setPointerCapture(ev.pointerId);
    const sx = ev.clientX, sy = ev.clientY;
    const ox = b.x, oy = b.y;
    const z = n.z || 1;
    let moved = false;
    hdr.onpointermove = mv => {
      moved = true;
      const dx = (mv.clientX - sx) / z;
      const dy = (mv.clientY - sy) / z;
      b.x = Math.round(ox + dx);
      b.y = Math.round(oy + dy);
      e.style.left = b.x + 'px';
      e.style.top = b.y + 'px';
    };
    hdr.onpointerup = hdr.onpointercancel = () => {
      hdr.onpointermove = null;
      hdr.onpointerup = null;
      hdr.onpointercancel = null;
      if (moved) touch(n);
    };
  };

  // Drag to resize card
  rsz.onpointerdown = ev => {
    ev.preventDefault();
    ev.stopPropagation();
    rsz.setPointerCapture(ev.pointerId);
    const sx = ev.clientX, sy = ev.clientY;
    const ow = e.offsetWidth, oh = e.offsetHeight;
    const z = n.z || 1;
    let resized = false;
    rsz.onpointermove = mv => {
      resized = true;
      const dw = (mv.clientX - sx) / z;
      const dh = (mv.clientY - sy) / z;
      const nw = Math.max(120, Math.round(ow + dw));
      const nh = Math.max(48, Math.round(oh + dh));
      b.w = nw;
      b.h = nh;
      e.style.width = nw + 'px';
      e.style.height = nh + 'px';
      body.style.minHeight = Math.max(28, nh - 30) + 'px';
    };
    rsz.onpointerup = rsz.onpointercancel = () => {
      rsz.onpointermove = null;
      rsz.onpointerup = null;
      rsz.onpointercancel = null;
      if (resized) touch(n);
    };
  };

  L.appendChild(e);
  bel.set(b, e);
  return body;
}`;

if (content.includes(oldCanvasBoxCode)) {
  console.log('Replacing canvas box() with movable & resizable implementation...');
  content = content.replace(oldCanvasBoxCode, newCanvasBoxCode);
} else {
  console.warn('WARNING: Canvas box() pattern not matched directly! Searching regex...');
  content = content.replace(/function box\(b\)\{const e=document\.createElement\('div'\);e\.className='bx'[\s\S]*?return e\}/, newCanvasBoxCode);
}

// 7. Update Canvas Bounding Box (bb) to respect card width & height
const oldBbPattern = `const bb=b=>{const e=bel.get(b);return[b.x,b.y,b.x+(e?e.offsetWidth:80),b.y+(e?e.offsetHeight:30)]};`;
const newBbCode = `const bb=b=>{const e=bel.get(b);return[b.x,b.y,b.x+(b.w||(e?e.offsetWidth:180)),b.y+(b.h||(e?e.offsetHeight:60))]};`;
if (content.includes(oldBbPattern)) {
  console.log('Updating canvas bb calculation with b.w and b.h...');
  content = content.replace(oldBbPattern, newBbCode);
}

// 8. Replace bx(ly, b, a) in PDF with Movable & Resizable Card implementation
const oldPdfBoxCode = `function bx(ly,b,a){const e=document.createElement('div');e.className='bx';e.contentEditable=true;e.textContent=b.t;e.style.left=b.x+'px';e.style.top=b.y+'px';e.oninput=()=>{b.t=e.innerText;touch(curN())};e.onblur=()=>{if(!b.t.trim()){a.b=a.b.filter(q=>q!==b);e.remove();touch(curN())}};ly.appendChild(e);return e}`;

const newPdfBoxCode = `function bx(ly,b,a){
  b.w = b.w || 200;
  b.h = b.h || 70;
  const e = document.createElement('div');
  e.className = 'bx';
  e.style.left = b.x + 'px';
  e.style.top = b.y + 'px';
  e.style.width = b.w + 'px';
  e.style.height = b.h + 'px';

  const hdr = document.createElement('div');
  hdr.className = 'bx-hdr';
  hdr.innerHTML = '<span class="bx-hnd" title="Tahan dan geser untuk memindahkan catatan">⠿ Catatan</span><button class="bx-del" title="Hapus catatan ini">✕</button>';

  const body = document.createElement('div');
  body.className = 'bx-body';
  body.contentEditable = 'true';
  body.textContent = b.t;
  body.style.minHeight = Math.max(28, b.h - 30) + 'px';

  const rsz = document.createElement('div');
  rsz.className = 'bx-rsz';
  rsz.title = 'Tarik untuk mengubah panjang & lebar';
  rsz.innerHTML = '⤡';

  e.appendChild(hdr);
  e.appendChild(body);
  e.appendChild(rsz);

  body.oninput = () => {
    b.t = body.innerText;
    touch(curN());
  };
  body.onblur = () => {
    if (!b.t.trim()) {
      a.b = a.b.filter(q => q !== b);
      e.remove();
      touch(curN());
    }
  };

  hdr.querySelector('.bx-del').onclick = ev => {
    ev.stopPropagation();
    a.b = a.b.filter(q => q !== b);
    e.remove();
    touch(curN());
  };

  hdr.onpointerdown = ev => {
    ev.preventDefault();
    ev.stopPropagation();
    hdr.setPointerCapture(ev.pointerId);
    const sx = ev.clientX, sy = ev.clientY;
    const ox = b.x, oy = b.y;
    const s = parseFloat(ly.style.transform.replace(/[^0-9.]/g, '')) || 1;
    let moved = false;
    hdr.onpointermove = mv => {
      moved = true;
      const dx = (mv.clientX - sx) / s;
      const dy = (mv.clientY - sy) / s;
      b.x = Math.round(ox + dx);
      b.y = Math.round(oy + dy);
      e.style.left = b.x + 'px';
      e.style.top = b.y + 'px';
    };
    hdr.onpointerup = hdr.onpointercancel = () => {
      hdr.onpointermove = null;
      hdr.onpointerup = null;
      hdr.onpointercancel = null;
      if (moved) touch(curN());
    };
  };

  rsz.onpointerdown = ev => {
    ev.preventDefault();
    ev.stopPropagation();
    rsz.setPointerCapture(ev.pointerId);
    const sx = ev.clientX, sy = ev.clientY;
    const ow = e.offsetWidth, oh = e.offsetHeight;
    const s = parseFloat(ly.style.transform.replace(/[^0-9.]/g, '')) || 1;
    let resized = false;
    rsz.onpointermove = mv => {
      resized = true;
      const dw = (mv.clientX - sx) / s;
      const dh = (mv.clientY - sy) / s;
      const nw = Math.max(120, Math.round(ow + dw));
      const nh = Math.max(48, Math.round(oh + dh));
      b.w = nw;
      b.h = nh;
      e.style.width = nw + 'px';
      e.style.height = nh + 'px';
      body.style.minHeight = Math.max(28, nh - 30) + 'px';
    };
    rsz.onpointerup = rsz.onpointercancel = () => {
      rsz.onpointermove = null;
      rsz.onpointerup = null;
      rsz.onpointercancel = null;
      if (resized) touch(curN());
    };
  };

  ly.appendChild(e);
  return body;
}`;

if (content.includes(oldPdfBoxCode)) {
  console.log('Replacing PDF bx() with movable & resizable implementation...');
  content = content.replace(oldPdfBoxCode, newPdfBoxCode);
} else {
  console.warn('WARNING: PDF bx() pattern not matched directly! Searching regex...');
  content = content.replace(/function bx\(ly,b,a\)\{const e=document\.createElement\('div'\);e\.className='bx'[\s\S]*?return e\}/, newPdfBoxCode);
}

// 9. Replace pageTB(n) with the Expanded, Comprehensive Rich Text Editor Toolbar
const oldPageTBPattern = /function pageTB\(n\)\{return `<div class=tb><button onmousedown="event\.preventDefault\(\);ec\('bold'\)"><b>B<\/b><\/button>[\s\S]*?<div id=bd contenteditable spellcheck=true>\$\{n\.body\}<\/div>`\}/;

const newPageTBCode = `function pageTB(n){
  return \`<div class="ed-tb">
    <!-- Baris 1: Undo/Redo, Gaya Teks, Jenis Huruf, Ukuran, A-/A+, B/I/U -->
    <div class="tb-row">
      <button type="button" onmousedown="event.preventDefault();ec('undo')" title="Undo (Ctrl+Z)">↶</button>
      <button type="button" onmousedown="event.preventDefault();ec('redo')" title="Redo (Ctrl+Y)">↷</button>
      <span class="tb-sep"></span>
      <select onchange="applyBlock(this.value);this.selectedIndex=0;" title="Gaya Teks / Judul">
        <option value="" disabled selected>Gaya teks ▾</option>
        <option value="p">Paragraf Normal</option>
        <option value="h1">Judul Utama (H1)</option>
        <option value="h2">Sub-judul (H2)</option>
        <option value="h3">Bagian (H3)</option>
        <option value="blockquote">❝ Kutipan (Quote)</option>
        <option value="code"> Blok Kode</option>
      </select>
      <select onchange="applyFont(this.value);this.selectedIndex=0;" title="Jenis Huruf">
        <option value="" disabled selected>Jenis huruf ▾</option>
        <option value="Inter, system-ui, sans-serif">Sans (Inter / Sistem)</option>
        <option value="Georgia, 'Times New Roman', serif">Serif (Buku Elegan)</option>
        <option value="'JetBrains Mono', Consolas, monospace">Monospace (Kode)</option>
        <option value="'Comic Sans MS', cursive, sans-serif">Santai (Ceria)</option>
      </select>
      <select onchange="applyFontSize(this.value);this.selectedIndex=0;" title="Ukuran Font">
        <option value="" disabled selected>Ukuran ▾</option>
        <option value="12px">12px</option>
        <option value="14px">14px</option>
        <option value="16px">16px</option>
        <option value="18px">18px</option>
        <option value="20px">20px</option>
        <option value="24px">24px</option>
        <option value="28px">28px</option>
        <option value="32px">32px</option>
      </select>
      <button type="button" onmousedown="event.preventDefault();stepFontSize(-1)" title="Perkecil huruf">A−</button>
      <button type="button" onmousedown="event.preventDefault();stepFontSize(1)" title="Perbesar huruf">A+</button>
      <span class="tb-sep"></span>
      <button type="button" onmousedown="event.preventDefault();ec('bold')" title="Tebal (Ctrl+B)"><b>B</b></button>
      <button type="button" onmousedown="event.preventDefault();ec('italic')" title="Miring (Ctrl+I)"><i>I</i></button>
      <button type="button" onmousedown="event.preventDefault();ec('underline')" title="Garis bawah (Ctrl+U)"><u>U</u></button>
    </div>

    <!-- Baris 2: Coret, Kode Inline, Sub/Super, Warna Huruf, Stabilo, Hapus Format -->
    <div class="tb-row">
      <button type="button" onmousedown="event.preventDefault();ec('strikeThrough')" title="Coret (Strikethrough)"><s>S</s></button>
      <button type="button" onmousedown="event.preventDefault();insInlineCode()" title="Kode sebaris (Inline code)"><code>&lt;/&gt;</code></button>
      <button type="button" onmousedown="event.preventDefault();ec('subscript')" title="Subskrip (x₂)">x₂</button>
      <button type="button" onmousedown="event.preventDefault();ec('superscript')" title="Superskrip (x²)">x²</button>
      <span class="tb-sep"></span>
      <div class="color-dropdown">
        <button type="button" onmousedown="event.preventDefault()" onclick="toggleColorMenu('tc')" title="Pilih Warna Teks"><b>A</b> <span id="tc-indicator" style="background:#e11d48;width:12px;height:12px;display:inline-block;border-radius:2px;vertical-align:middle;border:1px solid #0003"></span> ▾</button>
        <div id="tc-menu" class="color-pop">
          <span onclick="applyColor('#111827')" style="background:#111827" title="Hitam"></span>
          <span onclick="applyColor('#64748b')" style="background:#64748b" title="Abu-abu"></span>
          <span onclick="applyColor('#e11d48')" style="background:#e11d48" title="Merah"></span>
          <span onclick="applyColor('#ea580c')" style="background:#ea580c" title="Oranye"></span>
          <span onclick="applyColor('#d97706')" style="background:#d97706" title="Kuning Emas"></span>
          <span onclick="applyColor('#16a34a')" style="background:#16a34a" title="Hijau"></span>
          <span onclick="applyColor('#0284c7')" style="background:#0284c7" title="Biru"></span>
          <span onclick="applyColor('#7c3aed')" style="background:#7c3aed" title="Ungu"></span>
        </div>
      </div>
      <div class="color-dropdown">
        <button type="button" onmousedown="event.preventDefault()" onclick="toggleColorMenu('bg')" title="Pilih Warna Stabilo / Sorotan">🖍 <span id="bg-indicator" style="background:#fef08a;width:12px;height:12px;display:inline-block;border-radius:2px;vertical-align:middle;border:1px solid #0003"></span> ▾</button>
        <div id="bg-menu" class="color-pop">
          <span onclick="applyBgColor('transparent')" style="background:#fff;border:1px solid #ccc;position:relative" title="Hapus Stabilo"><small style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#e11d48;font-size:10px">✕</small></span>
          <span onclick="applyBgColor('#fef08a')" style="background:#fef08a" title="Kuning Stabilo"></span>
          <span onclick="applyBgColor('#bbf7d0')" style="background:#bbf7d0" title="Hijau Muda"></span>
          <span onclick="applyBgColor('#bae6fd')" style="background:#bae6fd" title="Biru Muda"></span>
          <span onclick="applyBgColor('#fbcfe8')" style="background:#fbcfe8" title="Merah Muda"></span>
          <span onclick="applyBgColor('#fed7aa')" style="background:#fed7aa" title="Oranye Muda"></span>
          <span onclick="applyBgColor('#ddd6fe')" style="background:#ddd6fe" title="Ungu Muda"></span>
        </div>
      </div>
      <button type="button" onmousedown="event.preventDefault();ec('removeFormat')" title="Hapus pemformatan teks">✕ Bersihkan</button>
    </div>

    <!-- Baris 3: Perataan Teks, Daftar, Indentasi, Tautan, Tabel -->
    <div class="tb-row">
      <button type="button" onmousedown="event.preventDefault();ec('justifyLeft')" title="Rata Kiri">⇤ Kiri</button>
      <button type="button" onmousedown="event.preventDefault();ec('justifyCenter')" title="Rata Tengah">≡ Tengah</button>
      <button type="button" onmousedown="event.preventDefault();ec('justifyRight')" title="Rata Kanan">⇥ Kanan</button>
      <button type="button" onmousedown="event.preventDefault();ec('justifyFull')" title="Rata Kiri-Kanan (Justify)">≣ Rata</button>
      <span class="tb-sep"></span>
      <button type="button" onmousedown="event.preventDefault();ec('insertUnorderedList')" title="Daftar Poin (Bulleted List)">• Poin</button>
      <button type="button" onmousedown="event.preventDefault();ec('insertOrderedList')" title="Daftar Nomor (Numbered List)">1. Nomor</button>
      <button type="button" onmousedown="event.preventDefault();insChecklist()" title="Daftar Centang Interaktif (Checklist)">☑ Centang</button>
      <span class="tb-sep"></span>
      <button type="button" onmousedown="event.preventDefault();ec('outdent')" title="Kurangi Indentasi">⇤</button>
      <button type="button" onmousedown="event.preventDefault();ec('indent')" title="Tambah Indentasi">⇥</button>
      <span class="tb-sep"></span>
      <button type="button" onmousedown="event.preventDefault();insLinkDialog()" title="Sisipkan Tautan">🔗 Tautan</button>
      <button type="button" onmousedown="event.preventDefault();insTableDialog()" title="Sisipkan Tabel Baru">▦ Tabel</button>
    </div>

    <!-- Baris 4: Pengaturan Tabel, Garis Pembatas, Kotak Catatan, Sketsa, Gambar, Wiki Link -->
    <div class="tb-row">
      <select onchange="applyTableOp(this.value);this.selectedIndex=0;" title="Operasi Tabel (Posisikan kursor di tabel)">
        <option value="" disabled selected>Tabel... ▾</option>
        <option value="row-above">+ Baris Di Atas</option>
        <option value="row-below">+ Baris Di Bawah</option>
        <option value="col-left">+ Kolom Di Kiri</option>
        <option value="col-right">+ Kolom Di Kanan</option>
        <option value="del-row">− Hapus Baris</option>
        <option value="del-col">− Hapus Kolom</option>
        <option value="del-table">🗑 Hapus Tabel</option>
      </select>
      <button type="button" onmousedown="event.preventDefault();ec('insertHorizontalRule')" title="Garis Pemisah Horizontal">— Garis</button>
      <select onchange="insCallout(this.value);this.selectedIndex=0;" title="Kotak Catatan Khusus (Callout)">
        <option value="" disabled selected>Kotak... ▾</option>
        <option value="info">ℹ️ Kotak Info (Biru)</option>
        <option value="warn">⚠️ Kotak Peringatan (Kuning)</option>
        <option value="succ">✅ Kotak Sukses (Hijau)</option>
        <option value="note">📌 Catatan Khusus (Ungu)</option>
        <option value="dang">⛔ Kotak Bahaya (Merah)</option>
      </select>
      <button type="button" onmousedown="event.preventDefault()" onclick="inkPad()" title="Tulis tangan / sketsa langsung">✍ Sketsa</button>
      <button type="button" onmousedown="event.preventDefault()" onclick="imgPick(null)" title="Sisipkan gambar">🖼 Gambar</button>
      <button type="button" onmousedown="event.preventDefault();ec('insertText','[[')" title="Wiki Backlink [[ ]]">[[ ]]</button>
      <button type="button" onmousedown="event.preventDefault();cleanEditorWhitespace()" title="Rapikan spasi kosong ganda">ABC✓</button>
    </div>

    <!-- Baris 5: Live Stats Counter, Jarak Spasi, dan Lebar Dokumen -->
    <div class="tb-row" style="border-top:1px dashed var(--bd);padding-top:4px;margin-top:2px;font-size:12px;color:var(--mu);justify-content:space-between">
      <div style="display:flex;align-items:center;gap:10px">
        <span id="ed-counter" style="font-weight:600">Teks: 0 kata · 0 karakter</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <label style="display:inline-flex;align-items:center;gap:4px">Spasi:
          <select id="ed-spacing" onchange="setLineSpacing(this.value)" style="min-height:24px;padding:1px 5px;font-size:11.5px">
            <option value="normal">Normal (1.6)</option>
            <option value="tight">Rapat (1.35)</option>
            <option value="loose">Longgar (1.85)</option>
            <option value="double">Ganda (2.15)</option>
          </select>
        </label>
        <label style="display:inline-flex;align-items:center;gap:4px">Lebar:
          <select id="ed-width" onchange="setEditorWidth(this.value)" style="min-height:24px;padding:1px 5px;font-size:11.5px">
            <option value="normal">Normal (780px)</option>
            <option value="wide">Lebar (1040px)</option>
            <option value="full">Penuh (100%)</option>
          </select>
        </label>
      </div>
    </div>
  </div>\${n.kind==='riset'?\`<div class="tb"><b class="mu" style="padding:0 6px">Kumpulkan Riset:</b><button onmousedown="event.preventDefault()" onclick="rsLink()">🔗 Tautan</button><button onmousedown="event.preventDefault()" onclick="rsQuote()">❝ Kutipan</button><button onmousedown="event.preventDefault()" onclick="imgPick('Tangkapan layar')">🖼 Tangkapan layar</button><button onmousedown="event.preventDefault()" onclick="rsPdf()">📕 PDF</button></div>\`:''}<div id="bd" contenteditable="true" spellcheck="true">\${n.body}</div>\`;
}`;

if (oldPageTBPattern.test(content)) {
  console.log('Replacing pageTB() with expanded rich toolbar...');
  content = content.replace(oldPageTBPattern, newPageTBCode);
} else {
  console.warn('WARNING: pageTB() pattern not matched directly! Searching alternate...');
  content = content.replace(/function pageTB\(n\)\{return `<div class=tb>[\s\S]*?<div id=bd contenteditable spellcheck=true>\$\{n\.body\}<\/div>`\}/, newPageTBCode);
}

// 10. Inject Rich Editor Helper Functions and update bodyEd(n)
const richEditorHelpers = `
/* ===== Pembantu Editor Teks Kaya Lengkap ===== */
function toggleColorMenu(type){
  const el = $('#' + type + '-menu');
  if (!el) return;
  const wasOpen = el.classList.contains('open');
  document.querySelectorAll('.color-pop').forEach(p => p.classList.remove('open'));
  if (!wasOpen) el.classList.add('open');
}
document.addEventListener('pointerdown', e => {
  if (!e.target.closest('.color-dropdown')) {
    document.querySelectorAll('.color-pop').forEach(p => p.classList.remove('open'));
  }
});

function applyColor(hex){
  ec('foreColor', hex);
  const ind = $('#tc-indicator');
  if (ind) ind.style.background = hex;
  document.querySelectorAll('.color-pop').forEach(p => p.classList.remove('open'));
}

function applyBgColor(hex){
  if (hex === 'transparent') {
    ec('removeFormat');
  } else {
    ec('hiliteColor', hex);
  }
  const ind = $('#bg-indicator');
  if (ind) ind.style.background = hex === 'transparent' ? '#fff' : hex;
  document.querySelectorAll('.color-pop').forEach(p => p.classList.remove('open'));
}

function applyBlock(tag){
  if (tag === 'code') {
    insHTML('<pre class="code-blk"><code>// Tulis kode program di sini...</code></pre><p><br></p>');
  } else {
    ec('formatBlock', tag);
  }
}

function applyFont(font){
  ec('fontName', font);
}

function applyFontSize(sz){
  const s = getSelection();
  if (!s.rangeCount) return;
  const b = $('#bd');
  if (!b || !b.contains(s.anchorNode)) return;
  const span = document.createElement('span');
  span.style.fontSize = sz;
  if (!s.isCollapsed) {
    const range = s.getRangeAt(0);
    span.appendChild(range.extractContents());
    range.insertNode(span);
    s.removeAllRanges();
    const newR = document.createRange();
    newR.selectNodeContents(span);
    s.addRange(newR);
  } else {
    span.innerHTML = '&#8203;';
    const range = s.getRangeAt(0);
    range.insertNode(span);
    range.setStartAfter(span);
    s.removeAllRanges();
    s.addRange(range);
  }
  b.oninput && b.oninput();
}

let curFontStep = 16;
function stepFontSize(dir){
  curFontStep = Math.max(10, Math.min(48, curFontStep + dir * 2));
  applyFontSize(curFontStep + 'px');
}

function insInlineCode(){
  const s = getSelection();
  if (!s.rangeCount) return;
  const b = $('#bd');
  if (!b || !b.contains(s.anchorNode)) return;
  const range = s.getRangeAt(0);
  const code = document.createElement('code');
  code.style.cssText = 'background:color-mix(in srgb,var(--tx) 8%,var(--pn));padding:2px 6px;border-radius:4px;font-family:monospace;font-size:0.9em';
  if (!s.isCollapsed) {
    code.appendChild(range.extractContents());
    range.insertNode(code);
  } else {
    code.textContent = 'kode';
    range.insertNode(code);
  }
  b.oninput && b.oninput();
}

function insChecklist(){
  insHTML('<div class="task-item" contenteditable="false"><input type="checkbox" onchange="this.parentElement.classList.toggle(\\'done\\', this.checked)"><span contenteditable="true" style="outline:none;flex:1">&nbsp;Tugas baru</span></div><p><br></p>');
}

function insLinkDialog(){
  const s = getSelection();
  const selText = s.toString();
  const url = prompt('Masukkan URL tautan:', 'https://');
  if (!url) return;
  if (selText.trim()) {
    ec('createLink', url);
  } else {
    const text = prompt('Teks yang ditampilkan:', url) || url;
    insHTML(\`<a href="\${esc(url)}" target="_blank" rel="noopener">\${esc(text)}</a>\`);
  }
}

function insTableDialog(){
  const html = \`<table class="tb-ed">
    <thead><tr><th>Kolom 1</th><th>Kolom 2</th><th>Kolom 3</th></tr></thead>
    <tbody>
      <tr><td>Data 1</td><td>Data 2</td><td>Data 3</td></tr>
      <tr><td>Data 4</td><td>Data 5</td><td>Data 6</td></tr>
    </tbody>
  </table><p><br></p>\`;
  insHTML(html);
}

function applyTableOp(op){
  const s = getSelection();
  if (!s.rangeCount) return;
  const node = s.anchorNode;
  const cell = node && (node.nodeType === 1 ? node.closest('td, th') : node.parentElement && node.parentElement.closest('td, th'));
  if (!cell) {
    toast('Posisikan kursor di dalam kotak tabel terlebih dahulu');
    return;
  }
  const row = cell.closest('tr');
  const table = cell.closest('table');
  const tbody = row.parentElement;
  const cellIdx = cell.cellIndex;

  if (op === 'row-above') {
    const newRow = row.cloneNode(true);
    newRow.querySelectorAll('td, th').forEach(c => c.textContent = '—');
    tbody.insertBefore(newRow, row);
  } else if (op === 'row-below') {
    const newRow = row.cloneNode(true);
    newRow.querySelectorAll('td, th').forEach(c => c.textContent = '—');
    tbody.insertBefore(newRow, row.nextSibling);
  } else if (op === 'col-left') {
    table.querySelectorAll('tr').forEach(r => {
      const isHeader = r.children[cellIdx] && r.children[cellIdx].tagName === 'TH';
      const newCell = document.createElement(isHeader ? 'th' : 'td');
      newCell.textContent = isHeader ? 'Kolom' : '—';
      r.insertBefore(newCell, r.children[cellIdx]);
    });
  } else if (op === 'col-right') {
    table.querySelectorAll('tr').forEach(r => {
      const isHeader = r.children[cellIdx] && r.children[cellIdx].tagName === 'TH';
      const newCell = document.createElement(isHeader ? 'th' : 'td');
      newCell.textContent = isHeader ? 'Kolom' : '—';
      r.insertBefore(newCell, r.children[cellIdx] ? r.children[cellIdx].nextSibling : null);
    });
  } else if (op === 'del-row') {
    row.remove();
    if (!table.querySelector('tr')) table.remove();
  } else if (op === 'del-col') {
    table.querySelectorAll('tr').forEach(r => {
      if (r.children[cellIdx]) r.children[cellIdx].remove();
    });
    if (!table.querySelector('th, td')) table.remove();
  } else if (op === 'del-table') {
    table.remove();
  }
  const b = $('#bd');
  b && b.oninput && b.oninput();
}

function insCallout(kind){
  const presets = {
    info: { icon: 'ℹ️', title: 'Info:', cls: 'callout-info', text: 'Tulis informasi penting di sini.' },
    warn: { icon: '⚠️', title: 'Peringatan:', cls: 'callout-warn', text: 'Perhatikan kondisi atau batasan ini.' },
    succ: { icon: '✅', title: 'Sukses:', cls: 'callout-succ', text: 'Tindakan atau status berhasil dicapai.' },
    note: { icon: '📌', title: 'Catatan:', cls: 'callout-note', text: 'Poin penting yang perlu diingat.' },
    dang: { icon: '⛔', title: 'Bahaya:', cls: 'callout-dang', text: 'Tindakan ini berisiko atau perlu otorisasi khusus.' }
  };
  const c = presets[kind] || presets.info;
  insHTML(\`<div class="callout \${c.cls}"><span style="font-size:16px;margin-right:4px">\${c.icon}</span> <b>\${c.title}</b> \${c.text}</div><p><br></p>\`);
}

function cleanEditorWhitespace(){
  const b = $('#bd');
  if (!b) return;
  b.innerHTML = b.innerHTML.replace(/(<p><br><\\/p>){3,}/gi, '<p><br></p><p><br></p>');
  toast('Spasi kosong berlebih dirapikan');
  b.oninput && b.oninput();
}

function updWordCount(){
  const b = $('#bd');
  const cnt = $('#ed-counter');
  if (!b || !cnt) return;
  const raw = b.innerText || '';
  const words = raw.trim() ? raw.trim().split(/\\s+/).length : 0;
  const chars = raw.length;
  cnt.textContent = \`Teks: \${words} kata · \${chars} karakter\`;
}

function setLineSpacing(val){
  const b = $('#bd');
  if (!b) return;
  b.classList.remove('lh-tight', 'lh-loose', 'lh-double');
  if (val === 'tight') b.classList.add('lh-tight');
  else if (val === 'loose') b.classList.add('lh-loose');
  else if (val === 'double') b.classList.add('lh-double');
  try { localStorage.setItem('zh-lh', val); } catch(e){}
}

function setEditorWidth(val){
  const b = $('#bd');
  if (!b) return;
  b.classList.remove('w-wide', 'w-full');
  if (val === 'wide') b.classList.add('w-wide');
  else if (val === 'full') b.classList.add('w-full');
  try { localStorage.setItem('zh-w', val); } catch(e){}
}
`;

const oldBodyEdPattern = /function bodyEd\(n\)\{const b=\$('#bd');[\s\S]*?b\.onblur=\(\)=>setTimeout\(acHide,150\)\}/;

const newBodyEdCode = `${richEditorHelpers}
function bodyEd(n){
  const b = $('#bd');
  if (!b) return;

  const lh = (typeof localStorage !== 'undefined' && localStorage.getItem('zh-lh')) || 'normal';
  const w = (typeof localStorage !== 'undefined' && localStorage.getItem('zh-w')) || 'normal';
  setLineSpacing(lh);
  setEditorWidth(w);
  const selLh = $('#ed-spacing'); if (selLh) selLh.value = lh;
  const selW = $('#ed-width'); if (selW) selW.value = w;
  updWordCount();

  b.oninput = () => {
    n.body = b.innerHTML;
    touch(n);
    links(n);
    updWordCount();
    clearTimeout(window.rl);
    window.rl = setTimeout(renderList, 600);
    acCheck();
  };

  b.onpaste = async e => {
    const it = [...((e.clipboardData && e.clipboardData.items) || [])].find(i => i.type.startsWith('image/'));
    if (it) {
      e.preventDefault();
      saveSel();
      const u = await imgData(it.getAsFile());
      insHTML(\`<img src="\${u}">\`);
    }
  };

  b.onclick = e => {
    const a = e.target.closest && e.target.closest('.lk a');
    if (a) {
      e.preventDefault();
      openUrl(a.dataset.u || a.getAttribute('href'));
      return;
    }
    if (e.ctrlKey || e.metaKey) openWiki(e);
  };

  b.addEventListener('change', e => {
    if (e.target.matches('input[type="checkbox"]')) {
      const parent = e.target.closest('.task-item');
      if (parent) parent.classList.toggle('done', e.target.checked);
      n.body = b.innerHTML;
      touch(n);
    }
  });

  b.onkeydown = acKey;
  b.onblur = () => setTimeout(acHide, 150);
}`;

const endBodyEdMarker = 'b.onkeydown=acKey;b.onblur=()=>setTimeout(acHide,150)}';
const pEnd = content.indexOf(endBodyEdMarker);
const pStart = pEnd !== -1 ? content.lastIndexOf('function bodyEd(n)', pEnd) : -1;

if (pStart !== -1 && pEnd !== -1) {
  console.log('Replacing bodyEd() and injecting editor helpers via exact indices...');
  content = content.slice(0, pStart) + newBodyEdCode + content.slice(pEnd + endBodyEdMarker.length);
} else {
  console.error('ERROR: Could not find bodyEd() substring in content!');
}

// Enhance export for tables in nblocks
const oldWalkDiv = `else if(tg==='P'||tg==='DIV'||tg==='FIGURE'){flush();if(c.querySelector('p,div,ul,ol,h1,h2,h3,blockquote,img'))walk(c);else out.push({k:'p',r:runs(c)})}`;
const newWalkDiv = `else if(tg==='TABLE'){flush();c.querySelectorAll('tr').forEach(tr=>{const cells=[...tr.querySelectorAll('th,td')].map(td=>td.textContent.trim()).filter(Boolean);if(cells.length)out.push({k:'p',r:[{t:cells.join(' | ')}]})})}
else if(tg==='P'||tg==='DIV'||tg==='FIGURE'){flush();if(c.querySelector('p,div,ul,ol,h1,h2,h3,blockquote,img,table'))walk(c);else out.push({k:'p',r:runs(c)})}`;
if (content.includes(oldWalkDiv)) {
  console.log('Adding table parsing support to nblocks()...');
  content = content.replace(oldWalkDiv, newWalkDiv);
}

// 11. Ensure output directory and write file
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(outFile, content, 'utf8');
console.log('Successfully written ZhaNotes app to:', outFile);
console.log('File size:', (fs.statSync(outFile).size / (1024 * 1024)).toFixed(2), 'MB');
