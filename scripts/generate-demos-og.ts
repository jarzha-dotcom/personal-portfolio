// scripts/generate-demos-og.ts
//
// Menghasilkan public/demos/og-image.png (1200x630) menggunakan Sharp (100% lokal, cepat, tanpa browser).
// Desain modern dark theme dengan visual stack kartu demo asli.

import sharp, { type OverlayOptions } from 'sharp';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC_DIR = join(ROOT, 'public');
const THUMBS_DIR = join(PUBLIC_DIR, 'demos', 'thumbs');
const OUTPUT_PATH = join(PUBLIC_DIR, 'demos', 'og-image.png');

async function main() {
  const width = 1200;
  const height = 630;

  const thumb2Path = join(THUMBS_DIR, 'demo-absenpro-hris.webp');
  const thumb3Path = join(THUMBS_DIR, 'demo-brewspace-pos.webp');

  const svgOverlay = `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0a1014" />
        <stop offset="50%" stop-color="#070c0e" />
        <stop offset="100%" stop-color="#05080a" />
      </linearGradient>

      <radialGradient id="tealGlow" cx="20%" cy="10%" r="50%">
        <stop offset="0%" stop-color="#0d9488" stop-opacity="0.35" />
        <stop offset="100%" stop-color="#0d9488" stop-opacity="0" />
      </radialGradient>
      <radialGradient id="cyanGlow" cx="85%" cy="85%" r="55%">
        <stop offset="0%" stop-color="#14b8a6" stop-opacity="0.25" />
        <stop offset="100%" stop-color="#14b8a6" stop-opacity="0" />
      </radialGradient>

      <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="70%" stop-color="#e2e8f0" />
        <stop offset="100%" stop-color="#5eead4" />
      </linearGradient>

      <linearGradient id="cardBorder" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#2dd4bf" stop-opacity="0.6" />
        <stop offset="100%" stop-color="#0d9488" stop-opacity="0.2" />
      </linearGradient>
    </defs>

    <rect width="${width}" height="${height}" fill="url(#bgGrad)" />
    <rect width="${width}" height="${height}" fill="url(#tealGlow)" />
    <rect width="${width}" height="${height}" fill="url(#cyanGlow)" />

    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.03)" stroke-width="1"/>
    </pattern>
    <rect width="${width}" height="${height}" fill="url(#grid)" />

    <!-- Top Badge -->
    <g transform="translate(64, 52)">
      <rect x="0" y="0" width="224" height="34" rx="17" fill="#0f172a" fill-opacity="0.9" stroke="rgba(45, 212, 191, 0.4)" stroke-width="1.2" />
      <circle cx="18" cy="17" r="4.5" fill="#2dd4bf" />
      <text x="32" y="22" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" fill="#5eead4">arzhaning.my.id/demos</text>
    </g>

    <!-- Top Author Tag -->
    <text x="1136" y="74" text-anchor="end" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="500" fill="#94a3b8">
      Portofolio <tspan font-weight="700" fill="#f8fafc">K. Arzhaning Jagad</tspan>
    </text>

    <!-- Main Title & Content -->
    <g transform="translate(64, 150)">
      <text x="0" y="52" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="52" font-weight="800" fill="url(#textGrad)" letter-spacing="-0.02em">
        Galeri Contoh Desain
      </text>

      <text x="0" y="104" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="400" fill="#94a3b8">
        30+ Aplikasi Web, Kasir POS UMKM, Dashboard &amp;
      </text>
      <text x="0" y="132" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="400" fill="#94a3b8">
        Landing Page Interaktif Siap Dicoba Langsung.
      </text>

      <g transform="translate(0, 168)">
        <rect x="0" y="0" width="138" height="34" rx="8" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
        <text x="14" y="22" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" fill="#cbd5e1">⚡ Kasir &amp; Retail</text>

        <rect x="150" y="0" width="144" height="34" rx="8" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
        <text x="164" y="22" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" fill="#cbd5e1">📊 Dashboard Bisnis</text>

        <rect x="306" y="0" width="130" height="34" rx="8" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
        <text x="320" y="22" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" fill="#cbd5e1">🌐 Landing Page</text>

        <rect x="448" y="0" width="128" height="34" rx="8" fill="rgba(45,212,191,0.12)" stroke="rgba(45,212,191,0.35)" stroke-width="1"/>
        <text x="462" y="22" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#5eead4">🎯 Live Demo</text>
      </g>
    </g>

    <!-- Card Frames on the right side -->
    <g transform="translate(680, 135)">
      <rect x="-4" y="-4" width="368" height="238" rx="14" fill="#000" fill-opacity="0.4" />
      <rect x="0" y="0" width="360" height="230" rx="12" fill="#0f172a" stroke="rgba(255,255,255,0.1)" stroke-width="1.5" />
    </g>

    <g transform="translate(740, 210)">
      <rect x="-6" y="-6" width="392" height="252" rx="16" fill="#000" fill-opacity="0.6" />
      <rect x="0" y="0" width="380" height="240" rx="14" fill="#0f172a" stroke="url(#cardBorder)" stroke-width="2" />
    </g>

    <line x1="64" y1="560" x2="1136" y2="560" stroke="rgba(255,255,255,0.08)" stroke-width="1" />
    <text x="64" y="594" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="500" fill="#64748b">
      ● 30 Contoh Siap Pakai    ·    ● Responsive Mobile &amp; Desktop    ·    ● WhatsApp Direct Consultation
    </text>
    <text x="1136" y="594" text-anchor="end" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" fill="#2dd4bf">
      Buka dan Coba Sekarang ↗
    </text>
  </svg>
  `;

  const composites: OverlayOptions[] = [
    { input: Buffer.from(svgOverlay), top: 0, left: 0 }
  ];

  if (existsSync(thumb2Path)) {
    const resizedThumb1 = await sharp(thumb2Path)
      .resize(360, 230, { fit: 'cover' })
      .composite([{
        input: Buffer.from('<svg><rect x="0" y="0" width="360" height="230" rx="12" ry="12"/></svg>'),
        blend: 'dest-in'
      }])
      .toBuffer();

    composites.push({
      input: resizedThumb1,
      top: 135,
      left: 680
    });
  }

  if (existsSync(thumb3Path)) {
    const resizedThumb2 = await sharp(thumb3Path)
      .resize(380, 240, { fit: 'cover' })
      .composite([{
        input: Buffer.from('<svg><rect x="0" y="0" width="380" height="240" rx="14" ry="14"/></svg>'),
        blend: 'dest-in'
      }])
      .toBuffer();

    composites.push({
      input: resizedThumb2,
      top: 210,
      left: 740
    });
  }

  console.log(`Membuat OG image 1200x630 ke ${OUTPUT_PATH}...`);
  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 9, g: 13, b: 16, alpha: 1 }
    }
  })
    .composite(composites)
    .png({ quality: 90 })
    .toFile(OUTPUT_PATH);

  console.log('✓ Selesai! public/demos/og-image.png berhasil dibuat.');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
