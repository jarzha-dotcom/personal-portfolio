import React from 'react';
import {
  LucideIcon,
  QrCode,
  PackageCheck,
  MessageSquareText,
  Wallet,
  Scale,
  LayoutTemplate,
  ShieldCheck,
  FileSpreadsheet,
  TrendingUp,
  Server,
  Cloud,
  Store,
  Bot,
  Workflow,
  BookOpen,
  Compass,
  Code2,
  Cpu,
  Briefcase,
  LineChart,
  FileText,
  Sparkles,
  Gamepad2,
  Users,
  Layers,
  GitBranch,
  FileSignature,
  Clock,
  Rocket,
  HelpCircle,
  Smartphone,
  Calculator,
  History,
  ListChecks,
  Handshake,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Gambar artikel di-host di Vercel Blob (bukan lagi di-bundle oleh Vite).
//
// 1. Jalankan `npx tsx --env-file=.env.local scripts/upload-images.ts`
// 2. Salin "BLOB_BASE_URL" yang dicetak script itu ke konstanta di bawah.
//
// Konvensi nama file: "Judul.jpeg" = gambar TOP (hero), "Judul 2.jpeg" = MIDDLE.
// URL dibentuk dari nama file lewat slugify() -- fungsi ini HARUS sama persis
// dengan slugify() di scripts/upload-images.ts, jadi tidak perlu salin 34 URL
// satu per satu.
//
// Kenapa tanpa import.meta.env: scripts/prerender.ts jalan di luar Vite (lewat
// tsx) dan ikut meng-import file ini, jadi file ini tidak boleh bergantung
// pada fitur khusus Vite.
// ---------------------------------------------------------------------------
const BLOB_BASE_URL = 'https://0padm4ym3zbnjgka.public.blob.vercel-storage.com/articles';

const slugify = (filename: string): string =>
  filename
    .replace(/\.jpe?g$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const blobImageUrl = (filename: string): string =>
  `${BLOB_BASE_URL}/${slugify(filename)}.jpeg`;

interface SlugImages {
  top: string;
  middle: string;
}

// Nama file ASLI (sebelum di-slugify) untuk tiap slug. Ini satu-satunya tempat
// yang perlu diubah saat menambah/mengganti gambar artikel. Tetap di-export
// untuk kompatibilitas dengan kode lama.
export const SLUG_IMAGE_SOURCE_FILES: Record<string, SlugImages> = {
  'cara-kerja-sistem-aset-pt-gmp': {
    top: 'Cara Kerja Sistem Manajemen Aset PT Global Multiparts.jpeg',
    middle: 'Cara Kerja Sistem Manajemen Aset PT Global Multiparts 2.jpeg',
  },
  'tanda-waktunya-migrasi-dari-apps-script': {
    top: '5 Tanda Bisnismu Sudah Waktunya Migrasi.jpeg',
    middle: '5 Tanda Bisnismu Sudah Waktunya Migrasi 2.jpeg',
  },
  'amankah-data-bisnis-di-google-sheets-drive': {
    top: 'Amankah Data Bisnis Disimpan di Google Sheets-Drive.jpeg',
    middle: 'Amankah Data Bisnis Disimpan di Google Sheets-Drive 2.jpeg',
  },
  'apa-itu-autonomous-agent-beda-chatbot-biasa': {
    top: 'Apa Itu Autonomous Agent.jpeg',
    middle: 'Apa Itu Autonomous Agent 2.jpeg',
  },
  'biaya-bikin-chatbot-custom-rincian': {
    top: 'Berapa Biaya Sebenarnya Bikin Chatbot Custom.jpeg',
    middle: 'Berapa Biaya Sebenarnya Bikin Chatbot Custom 2.jpeg',
  },
  'custom-chatbot-vs-chatbot-template': {
    top: 'Custom Chatbot vs Chatbot Template.jpeg',
    middle: 'Custom Chatbot vs Chatbot Template 2.jpeg',
  },
  'kenapa-google-apps-script-untuk-klien-kecil-menengah': {
    top: 'Kenapa Saya Pilih Google Apps Script Ketimbang Server Sendiri.jpeg',
    middle: 'Kenapa Saya Pilih Google Apps Script Ketimbang Server Sendiri 2.jpeg',
  },
  'arsitektur-multiplayer-real-time-b-games': {
    top: 'Arsitektur Multiplayer Real-Time di B-Games.jpeg',
    middle: 'Arsitektur Multiplayer Real-Time di B-Games 2.jpeg',
  },
  'kenapa-4-proyek-saya-pakai-4-arsitektur-backend-berbeda': {
    top: '4 Sistem Saya, 4 Arsitektur Backend Berbeda.jpeg',
    middle: '4 Sistem Saya, 4 Arsitektur Backend Berbeda 2.jpeg',
  },
  'apa-itu-cascade-ai-system': {
    top: 'Apa Itu Cascade AI System.jpeg',
    middle: 'Apa Itu Cascade AI System 2.jpeg',
  },
  'studi-kasus-devrab-proposal-30-detik': {
    top: 'Di Balik Tombol Buatkan RAB.jpeg',
    middle: 'Di Balik Tombol Buatkan RAB 2.jpeg',
  },
  'berapa-lama-bikin-website-aplikasi-bisnis-kecil': {
    top: 'Berapa Lama Bikin Website.jpeg',
    middle: 'Berapa Lama Bikin Website 2.jpeg',
  },
  '5-pertanyaan-sebelum-pakai-jasa-developer-freelance': {
    top: '5 Pertanyaan yang Harus Ditanyakan Sebelum Pakai Jasa Developer.jpeg',
    middle: '5 Pertanyaan yang Harus Ditanyakan Sebelum Pakai Jasa Developer 2.jpeg',
  },
  'web-app-vs-mobile-app-vs-pwa': {
    top: 'Perbedaan Web App, Mobile App, dan PWA.jpeg',
    middle: 'Perbedaan Web App, Mobile App, dan PWA 2.jpeg',
  },
  'kenapa-harga-proposal-bisa-beda-beda': {
    top: 'Kenapa Harga Proposal Development Bisa.jpeg',
    middle: 'Kenapa Harga Proposal Development Bisa 2.jpeg',
  },
  'apa-itu-audit-trail-dan-kenapa-bisnismu-butuh': {
    top: 'Apa Itu Audit Trail, dan Kenapa Bisnismu Mungkin Butuh.jpeg',
    middle: 'Apa Itu Audit Trail, dan Kenapa Bisnismu Mungkin Butuh 2.jpeg',
  },
  'checklist-sebelum-konsultasi-pertama-dengan-developer': {
    top: 'Checklist, Apa yang Perlu Disiapkan Sebelum Konsultasi Pertama.jpeg',
    middle: 'Checklist, Apa yang Perlu Disiapkan Sebelum Konsultasi Pertama 2.jpeg',
  },
};

/**
 * URL absolut (Vercel Blob) per slug. Dipakai komponen ini dan juga
 * scripts/prerender.ts untuk og:image per-artikel -- cukup pakai nilai ini
 * langsung, tidak perlu lagi lookup ke dist/.vite/manifest.json.
 */
export const SLUG_IMAGE_URLS: Record<string, SlugImages> = Object.fromEntries(
  Object.entries(SLUG_IMAGE_SOURCE_FILES).map(([slug, files]) => [
    slug,
    { top: blobImageUrl(files.top), middle: blobImageUrl(files.middle) },
  ]),
);

const SLUG_IMAGES = SLUG_IMAGE_URLS;

/** Dipakai halaman lain (mis. ArticlePage) untuk cek apakah slug ini punya foto custom, sebelum menyisipkan gambar "middle" di tengah artikel. */
export const hasArticleImages = (slug: string): boolean => !!SLUG_IMAGES[slug];

interface IconPair {
  Icon: LucideIcon;
  Accent: LucideIcon;
}

const SLUG_ILLUSTRATIONS: Record<string, IconPair> = {
  'cara-kerja-sistem-aset-pt-gmp': { Icon: QrCode, Accent: PackageCheck },
  'biaya-bikin-chatbot-custom-rincian': { Icon: MessageSquareText, Accent: Wallet },
  'custom-chatbot-vs-chatbot-template': { Icon: Scale, Accent: LayoutTemplate },
  'amankah-data-bisnis-di-google-sheets-drive': { Icon: ShieldCheck, Accent: FileSpreadsheet },
  'tanda-waktunya-migrasi-dari-apps-script': { Icon: TrendingUp, Accent: Server },
  'kenapa-google-apps-script-untuk-klien-kecil-menengah': { Icon: Cloud, Accent: Store },
  'apa-itu-autonomous-agent-beda-chatbot-biasa': { Icon: Bot, Accent: Workflow },
  'arsitektur-multiplayer-real-time-b-games': { Icon: Gamepad2, Accent: Users },
  'kenapa-4-proyek-saya-pakai-4-arsitektur-backend-berbeda': { Icon: Layers, Accent: GitBranch },
  'apa-itu-cascade-ai-system': { Icon: Workflow, Accent: ShieldCheck },
  'studi-kasus-devrab-proposal-30-detik': { Icon: FileSignature, Accent: Sparkles },
  'berapa-lama-bikin-website-aplikasi-bisnis-kecil': { Icon: Clock, Accent: Rocket },
  '5-pertanyaan-sebelum-pakai-jasa-developer-freelance': { Icon: HelpCircle, Accent: Briefcase },
  'web-app-vs-mobile-app-vs-pwa': { Icon: LayoutTemplate, Accent: Smartphone },
  'kenapa-harga-proposal-bisa-beda-beda': { Icon: Calculator, Accent: Scale },
  'apa-itu-audit-trail-dan-kenapa-bisnismu-butuh': { Icon: History, Accent: ShieldCheck },
  'checklist-sebelum-konsultasi-pertama-dengan-developer': { Icon: ListChecks, Accent: Handshake },
};

const CATEGORY_ILLUSTRATIONS: Record<string, IconPair> = {
  Panduan: { Icon: BookOpen, Accent: Compass },
  Teknis: { Icon: Code2, Accent: Cpu },
  'Studi Kasus': { Icon: Briefcase, Accent: LineChart },
};

const DEFAULT_ILLUSTRATION: IconPair = { Icon: FileText, Accent: Sparkles };

const getIconPair = (slug: string, category?: string): IconPair =>
  SLUG_ILLUSTRATIONS[slug] ??
  (category ? CATEGORY_ILLUSTRATIONS[category] : undefined) ??
  DEFAULT_ILLUSTRATION;

/** Dipakai komponen lain (mis. InfiniteBanner) yang butuh ikon representatif
 * satu artikel tanpa perlu merender full ArticleIllustration-nya. */
export const getArticleIcon = (slug: string, category?: string): LucideIcon =>
  getIconPair(slug, category).Icon;

interface ArticleIllustrationProps {
  slug: string;
  category?: string;
  darkMode: boolean;
  size?: 'thumb' | 'hero' | 'middle';
  /** Pilih gambar mana yang dipakai untuk slug ini: 'top' (hero/awal artikel) atau 'middle' (tengah artikel). Diabaikan kalau slug tidak punya gambar custom. */
  position?: 'top' | 'middle';
  /** Set true kalau elemen ini dipasang di dalam card yang sudah punya rounded corner + border sendiri (mis. thumbnail di index page), supaya gambar tampil flush tanpa sudut/rangka ganda. */
  edgeToEdge?: boolean;
  className?: string;
}

export const ArticleIllustration: React.FC<ArticleIllustrationProps> = ({
  slug,
  category,
  darkMode,
  size = 'thumb',
  position = 'top',
  edgeToEdge = false,
  className = '',
}) => {
  // 1. Cek apakah ada gambar custom untuk slug ini
  const slugImages = SLUG_IMAGES[slug];
  const imageUrl = slugImages ? slugImages[position] : undefined;
  const hasCustomImage = !!imageUrl;

  // 2. Jika ada gambar custom, kita tidak perlu mengambil ikon (atau bisa pakai default sebagai fallback TS)
  const { Icon, Accent } = !hasCustomImage ? getIconPair(slug, category) : DEFAULT_ILLUSTRATION;

  const isHero = size === 'hero';

  // Semua gambar custom berukuran asli 1408x768 (rasio 11:6). Saat ada gambar
  // custom, kita pakai rasio ini persis untuk container-nya supaya object-cover
  // tidak pernah memotong apa pun (rasio kontainer == rasio gambar).
  // Untuk kotak ikon (tanpa gambar custom), tetap pakai rasio lama.
  const aspectClass = hasCustomImage
    ? 'aspect-[11/6]'
    : isHero
    ? 'aspect-[21/9]'
    : 'aspect-square';

  return (
    <div
      aria-hidden="true"
      className={`relative overflow-hidden flex items-center justify-center w-full ${aspectClass} ${
        edgeToEdge ? '' : 'rounded-2xl border'
      } ${
        darkMode
          ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950/40 border-slate-800'
          : 'bg-gradient-to-br from-teal-50 via-white to-teal-50 border-slate-200'
      } ${className}`}
    >
      {/* 3. Render Gambar jika ada, jika tidak render ikon & dekorasi */}
      {hasCustomImage ? (
        <img
          src={imageUrl}
          alt="Ilustrasi Artikel"
          width={1408}
          height={768}
          loading={isHero && position === 'top' ? 'eager' : 'lazy'}
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <>
          {/* Dot-grid tekstur */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(${
                darkMode ? '#2dd4bf' : '#0d9488'
              } 1px, transparent 1px)`,
              backgroundSize: isHero ? '20px 20px' : '14px 14px',
              opacity: darkMode ? 0.1 : 0.12,
            }}
          />

          {/* Glow lembut */}
          <div
            className={`absolute w-2/3 h-2/3 rounded-full blur-2xl opacity-30 pointer-events-none ${
              darkMode ? 'bg-teal-500' : 'bg-teal-300'
            }`}
          />

          {/* Ikon utama + badge aksen */}
          <div className="relative flex items-center justify-center">
            <div
              className={`flex items-center justify-center rounded-2xl ${
                isHero ? 'w-16 h-16 sm:w-20 sm:h-20' : 'w-9 h-9 sm:w-10 sm:h-10'
              } ${
                darkMode
                  ? 'bg-teal-500/15 border border-teal-500/30'
                  : 'bg-white border border-teal-200 shadow-sm'
              }`}
            >
              <Icon
                className={isHero ? 'w-8 h-8 sm:w-10 sm:h-10' : 'w-4 h-4 sm:w-5 sm:h-5'}
                strokeWidth={1.75}
                aria-hidden="true"
                color={darkMode ? '#5eead4' : '#0d9488'}
              />
            </div>
            <div
              className={`absolute -bottom-1.5 -right-1.5 rounded-full flex items-center justify-center ${
                isHero ? 'w-8 h-8' : 'w-5 h-5' // Catatan: w-4.5 h-4.5 bukan default Tailwind, diganti ke w-5 h-5 agar aman
              } ${
                darkMode
                  ? 'bg-slate-800 border border-slate-700'
                  : 'bg-white border border-slate-200 shadow-sm'
              }`}
            >
              <Accent
                className={isHero ? 'w-4 h-4' : 'w-2.5 h-2.5'}
                strokeWidth={2}
                aria-hidden="true"
                color={darkMode ? '#fcd34d' : '#d97706'}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};