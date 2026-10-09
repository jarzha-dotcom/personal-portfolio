// scripts/generate-zhanotes-og.ts
//
// Menghasilkan public/zhanotes/og-image.png dan public/og-zhanotes.png (1200x630)
// menggunakan Sharp (100% lokal, cepat, tanpa browser).

import sharp, { type OverlayOptions } from 'sharp';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC_DIR = join(ROOT, 'public');
const OUTPUT_PATH1 = join(PUBLIC_DIR, 'zhanotes', 'og-image.png');
const OUTPUT_PATH2 = join(PUBLIC_DIR, 'og-zhanotes.png');

async function main() {
  const width = 1200;
  const height = 630;

  const svgOverlay = `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0a0c16" />
        <stop offset="50%" stop-color="#0e1124" />
        <stop offset="100%" stop-color="#080912" />
      </linearGradient>

      <radialGradient id="indigoGlow" cx="25%" cy="20%" r="55%">
        <stop offset="0%" stop-color="#4f46e5" stop-opacity="0.32" />
        <stop offset="100%" stop-color="#4f46e5" stop-opacity="0" />
      </radialGradient>

      <radialGradient id="purpleGlow" cx="80%" cy="80%" r="60%">
        <stop offset="0%" stop-color="#9333ea" stop-opacity="0.25" />
        <stop offset="100%" stop-color="#9333ea" stop-opacity="0" />
      </radialGradient>

      <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="60%" stop-color="#e0e7ff" />
        <stop offset="100%" stop-color="#a5b4fc" />
      </linearGradient>

      <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#181a2e" />
        <stop offset="100%" stop-color="#111322" />
      </linearGradient>

      <linearGradient id="cardBorder" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#818cf8" stop-opacity="0.7" />
        <stop offset="100%" stop-color="#4f46e5" stop-opacity="0.2" />
      </linearGradient>

      <pattern id="grid" width="36" height="36" patternUnits="userSpaceOnUse">
        <path d="M 36 0 L 0 0 0 36" fill="none" stroke="rgba(255, 255, 255, 0.035)" stroke-width="1"/>
      </pattern>
    </defs>

    <!-- Background Layers -->
    <rect width="${width}" height="${height}" fill="url(#bgGrad)" />
    <rect width="${width}" height="${height}" fill="url(#indigoGlow)" />
    <rect width="${width}" height="${height}" fill="url(#purpleGlow)" />
    <rect width="${width}" height="${height}" fill="url(#grid)" />

    <!-- Top Badge -->
    <g transform="translate(64, 52)">
      <rect x="0" y="0" width="248" height="34" rx="17" fill="#13162b" fill-opacity="0.9" stroke="rgba(129, 140, 248, 0.45)" stroke-width="1.2" />
      <circle cx="18" cy="17" r="4.5" fill="#818cf8" />
      <text x="32" y="22" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" fill="#c7d2fe">arzhaning.my.id/zhanotes</text>
    </g>

    <!-- Top Author Tag -->
    <text x="1136" y="74" text-anchor="end" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="500" fill="#94a3b8">
      Karya Indie <tspan font-weight="700" fill="#f8fafc">K. Arzhaning Jagad (Arzha)</tspan>
    </text>

    <!-- Left Side: Main Title & Features -->
    <g transform="translate(64, 138)">
      <text x="0" y="54" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="56" font-weight="800" fill="url(#textGrad)" letter-spacing="-0.025em">
        ZhaNotes
      </text>

      <text x="0" y="96" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="600" fill="#a5b4fc">
        Personal Knowledge Management &amp; Canvas Workspace
      </text>

      <text x="0" y="132" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="400" fill="#94a3b8">
        Workspace visual offline-first mandiri tanpa server: Rich Text, Infinite
      </text>
      <text x="0" y="156" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="400" fill="#94a3b8">
        Canvas bebas, PDF Reader/Annotator, Memo Suara, &amp; Wiki [[ ]].
      </text>

      <!-- Pill Badges Row 1 -->
      <g transform="translate(0, 190)">
        <rect x="0" y="0" width="168" height="32" rx="8" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
        <text x="14" y="21" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" fill="#e2e8f0">📝 Rich-Text &amp; Tabel</text>

        <rect x="180" y="0" width="186" height="32" rx="8" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
        <text x="14" y="21" transform="translate(180, 0)" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" fill="#e2e8f0">🎨 Infinite Canvas Bebas</text>

        <rect x="378" y="0" width="162" height="32" rx="8" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
        <text x="14" y="21" transform="translate(378, 0)" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" fill="#e2e8f0">📑 PDF Annotator</text>
      </g>

      <!-- Pill Badges Row 2 -->
      <g transform="translate(0, 234)">
        <rect x="0" y="0" width="170" height="32" rx="8" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
        <text x="14" y="21" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" fill="#e2e8f0">🎙️ Memo Suara &amp; Pin</text>

        <rect x="182" y="0" width="176" height="32" rx="8" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
        <text x="14" y="21" transform="translate(182, 0)" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" fill="#e2e8f0">🔗 Wiki Backlinks [[ ]]</text>

        <rect x="370" y="0" width="170" height="32" rx="8" fill="rgba(129,140,248,0.15)" stroke="rgba(129,140,248,0.4)" stroke-width="1"/>
        <text x="14" y="21" transform="translate(370, 0)" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#c7d2fe">💾 Local-First IDB</text>
      </g>

      <!-- Pill Badges Row 3 (Export) -->
      <g transform="translate(0, 278)">
        <rect x="0" y="0" width="244" height="30" rx="6" fill="rgba(79,70,229,0.18)" stroke="rgba(99,102,241,0.35)" stroke-width="1"/>
        <text x="12" y="19" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600" fill="#a5b4fc">📦 Ekspor Word (.docx) &amp; PDF Murni</text>

        <rect x="256" y="0" width="220" height="30" rx="6" fill="rgba(16,185,129,0.12)" stroke="rgba(16,185,129,0.3)" stroke-width="1"/>
        <text x="12" y="19" transform="translate(256, 0)" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600" fill="#6ee7b7">🔒 100% Zero Server Cost</text>
      </g>
    </g>

    <!-- Right Side: Interactive Mockup Card -->
    <g transform="translate(640, 130)">
      <!-- Drop Shadow -->
      <rect x="-8" y="-8" width="496" height="376" rx="20" fill="#000" fill-opacity="0.6" />

      <!-- Card Container -->
      <rect x="0" y="0" width="480" height="360" rx="16" fill="url(#cardGrad)" stroke="url(#cardBorder)" stroke-width="2" />

      <!-- Card Window Header -->
      <rect x="0" y="0" width="480" height="38" rx="16" fill="#1f233d" />
      <rect x="0" y="22" width="480" height="16" fill="#1f233d" />
      <line x1="0" y1="38" x2="480" y2="38" stroke="rgba(255,255,255,0.08)" stroke-width="1" />

      <!-- Window Dots -->
      <circle cx="20" cy="19" r="5" fill="#ef4444" opacity="0.85" />
      <circle cx="36" cy="19" r="5" fill="#f59e0b" opacity="0.85" />
      <circle cx="52" cy="19" r="5" fill="#10b981" opacity="0.85" />

      <text x="240" y="24" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600" fill="#94a3b8">
        ZhaNotes Editor — Rencana Arsitektur.md
      </text>

      <!-- Note Content Inside Card -->
      <g transform="translate(24, 56)">
        <!-- Note Title -->
        <text x="0" y="22" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="700" fill="#f8fafc">
          Rencana Arsitektur Sistem 2026
        </text>

        <!-- Checklist Item 1 -->
        <g transform="translate(0, 42)">
          <rect x="0" y="0" width="18" height="18" rx="4" fill="#4f46e5" />
          <path d="M 4 9 L 7 12 L 14 5" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
          <text x="28" y="14" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="500" fill="#cbd5e1" text-decoration="line-through">
            Arsitektur Local-First via IndexedDB
          </text>
        </g>

        <!-- Checklist Item 2 -->
        <g transform="translate(0, 72)">
          <rect x="0" y="0" width="18" height="18" rx="4" fill="#4f46e5" />
          <path d="M 4 9 L 7 12 L 14 5" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
          <text x="28" y="14" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="500" fill="#cbd5e1" text-decoration="line-through">
            Kanvas coretan bebas dengan Stylus Pen
          </text>
        </g>

        <!-- Checklist Item 3 -->
        <g transform="translate(0, 102)">
          <rect x="0" y="0" width="18" height="18" rx="4" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
          <text x="28" y="14" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="500" fill="#f1f5f9">
            Ekspor Word (.docx) murni via JSZip
          </text>
        </g>

        <!-- Callout Box -->
        <g transform="translate(0, 138)">
          <rect x="0" y="0" width="432" height="54" rx="8" fill="rgba(79, 70, 229, 0.12)" stroke="#6366f1" stroke-width="1.2"/>
          <text x="14" y="24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" fill="#c7d2fe">
            💡 Info Kunci:
          </text>
          <text x="14" y="44" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12.5" font-weight="400" fill="#94a3b8">
            Data tersimpan aman di perangkat lokal, 100% offline &amp; tanpa kuota server.
          </text>
        </g>

        <!-- Floating Card Mockup -->
        <g transform="translate(230, 18)">
          <rect x="-3" y="-3" width="196" height="74" rx="8" fill="#000" fill-opacity="0.4" />
          <rect x="0" y="0" width="190" height="70" rx="8" fill="#1e2238" stroke="#818cf8" stroke-width="1.2" />
          <rect x="0" y="0" width="190" height="20" rx="7" fill="#2b3052" />
          <text x="8" y="14" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="700" fill="#c7d2fe">⠿ Kartu Teks Kanvas</text>
          <text x="8" y="38" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="400" fill="#e2e8f0">Bisa digeser &amp; diubah</text>
          <text x="8" y="54" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="400" fill="#94a3b8">ukuran panjang-lebar ⤡</text>
        </g>

        <!-- Backlinks Pills -->
        <g transform="translate(0, 212)">
          <text x="0" y="16" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#64748b" text-transform="uppercase">
            Terkait:
          </text>
          <rect x="52" y="2" width="108" height="22" rx="11" fill="rgba(139,92,246,0.18)" stroke="rgba(139,92,246,0.4)" stroke-width="1"/>
          <text x="64" y="17" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#c084fc">[[B-Games]]</text>

          <rect x="170" y="2" width="124" height="22" rx="11" fill="rgba(139,92,246,0.18)" stroke="rgba(139,92,246,0.4)" stroke-width="1"/>
          <text x="182" y="17" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#c084fc">[[Assets-DEMO]]</text>

          <rect x="304" y="2" width="124" height="22" rx="11" fill="rgba(139,92,246,0.18)" stroke="rgba(139,92,246,0.4)" stroke-width="1"/>
          <text x="316" y="17" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#c084fc">[[AI-Showcase]]</text>
        </g>

        <!-- Audio Player Mockup -->
        <g transform="translate(0, 248)">
          <rect x="0" y="0" width="432" height="34" rx="8" fill="#13162b" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
          <circle cx="20" cy="17" r="9" fill="#ef4444" />
          <polygon points="17,13 17,21 24,17" fill="#ffffff" />
          <text x="36" y="21" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" font-weight="600" fill="#cbd5e1">🎙️ Memo Rapat Desain.webm (02:45)</text>
          <text x="418" y="21" text-anchor="end" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#818cf8">📍 Pin 01:15</text>
        </g>
      </g>
    </g>

    <!-- Bottom Separator & Footer Features -->
    <line x1="64" y1="556" x2="1136" y2="556" stroke="rgba(255,255,255,0.08)" stroke-width="1" />
    <text x="64" y="592" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="500" fill="#64748b">
      ● 4 Mode Catatan Fleksibel    ·    ● 100% Berjalan di Browser Lokal    ·    ● Zero Server Cost
    </text>
    <text x="1136" y="592" text-anchor="end" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" fill="#818cf8">
      Buka dan Coba ZhaNotes ↗
    </text>
  </svg>
  `;

  const composites: OverlayOptions[] = [
    { input: Buffer.from(svgOverlay), top: 0, left: 0 }
  ];

  console.log(`Membuat OG image 1200x630 untuk ZhaNotes...`);
  const imageBuffer = await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 10, g: 12, b: 22, alpha: 1 }
    }
  })
    .composite(composites)
    .png({ quality: 92 })
    .toBuffer();

  writeFileSync(OUTPUT_PATH1, imageBuffer);
  console.log(`✓ Berhasil menulis ${OUTPUT_PATH1}`);

  writeFileSync(OUTPUT_PATH2, imageBuffer);
  console.log(`✓ Berhasil menulis ${OUTPUT_PATH2}`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
