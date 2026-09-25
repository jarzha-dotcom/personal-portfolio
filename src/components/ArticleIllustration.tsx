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
} from 'lucide-react';

// Pastikan path ini benar relatif terhadap file komponen ini.
// Konvensi: file "Judul.jpeg" = gambar TOP (hero), "Judul 2.jpeg" = gambar MIDDLE.
import gmpTop from '../assets/images/Cara Kerja Sistem Manajemen Aset PT Global Multiparts.jpeg';
import gmpMiddle from '../assets/images/Cara Kerja Sistem Manajemen Aset PT Global Multiparts 2.jpeg';
import migrasiTop from '../assets/images/5 Tanda Bisnismu Sudah Waktunya Migrasi.jpeg';
import migrasiMiddle from '../assets/images/5 Tanda Bisnismu Sudah Waktunya Migrasi 2.jpeg';
import gsheetsTop from '../assets/images/Amankah Data Bisnis Disimpan di Google Sheets-Drive.jpeg';
import gsheetsMiddle from '../assets/images/Amankah Data Bisnis Disimpan di Google Sheets-Drive 2.jpeg';
import agentTop from '../assets/images/Apa Itu Autonomous Agent.jpeg';
import agentMiddle from '../assets/images/Apa Itu Autonomous Agent 2.jpeg';
import chatbotBiayaTop from '../assets/images/Berapa Biaya Sebenarnya Bikin Chatbot Custom.jpeg';
import chatbotBiayaMiddle from '../assets/images/Berapa Biaya Sebenarnya Bikin Chatbot Custom 2.jpeg';
import chatbotVsTop from '../assets/images/Custom Chatbot vs Chatbot Template.jpeg';
import chatbotVsMiddle from '../assets/images/Custom Chatbot vs Chatbot Template 2.jpeg';
import appsScriptTop from '../assets/images/Kenapa Saya Pilih Google Apps Script Ketimbang Server Sendiri.jpeg';
import appsScriptMiddle from '../assets/images/Kenapa Saya Pilih Google Apps Script Ketimbang Server Sendiri 2.jpeg';

interface SlugImages {
  top: string;
  middle: string;
}

const SLUG_IMAGES: Record<string, SlugImages> = {
  'cara-kerja-sistem-aset-pt-gmp': { top: gmpTop, middle: gmpMiddle },
  'tanda-waktunya-migrasi-dari-apps-script': { top: migrasiTop, middle: migrasiMiddle },
  'amankah-data-bisnis-di-google-sheets-drive': { top: gsheetsTop, middle: gsheetsMiddle },
  'apa-itu-autonomous-agent-beda-chatbot-biasa': { top: agentTop, middle: agentMiddle },
  'biaya-bikin-chatbot-custom-rincian': { top: chatbotBiayaTop, middle: chatbotBiayaMiddle },
  'custom-chatbot-vs-chatbot-template': { top: chatbotVsTop, middle: chatbotVsMiddle },
  'kenapa-google-apps-script-untuk-klien-kecil-menengah': { top: appsScriptTop, middle: appsScriptMiddle },
};

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
};

const CATEGORY_ILLUSTRATIONS: Record<string, IconPair> = {
  Panduan: { Icon: BookOpen, Accent: Compass },
  Teknis: { Icon: Code2, Accent: Cpu },
  'Studi Kasus': { Icon: Briefcase, Accent: LineChart },
};

const DEFAULT_ILLUSTRATION: IconPair = { Icon: FileText, Accent: Sparkles };

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
  const { Icon, Accent } = !hasCustomImage
    ? (SLUG_ILLUSTRATIONS[slug] ??
      (category ? CATEGORY_ILLUSTRATIONS[category] : undefined) ??
      DEFAULT_ILLUSTRATION)
    : DEFAULT_ILLUSTRATION;

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