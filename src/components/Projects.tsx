import React, { useState, useEffect, useMemo, memo, lazy, Suspense } from 'react';
import {
  Code2,
  ExternalLink,
  Github,
  Gamepad2,
  GraduationCap,
  FileSpreadsheet,
  BarChart3,
  X,
  ChevronRight,
  Layers,
  Bot,
  Sparkles,
  MessageSquare,
  CheckCircle2,
  Zap,
  ArrowRight,
  Play,
  Info,
  Building2,
  ShieldCheck,
  Loader2,
  Mic,
  MessageCircle,
  Clock,
  Database,
  ChevronDown,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PROJECTS, AVAILABLE_MODELS, CONTACT_INFO } from '../data/portfolioData';
import { useRegisterModal } from '../context/NavigationHistoryContext';
import { ProjectItem } from '../types';
import { Portal } from './Portal';
import { injectJsonLd, removeJsonLd, buildProjectsJsonLd } from '../utils/seoHelpers';

const AIChatbotShowcase = lazy(() =>
  import('./AIChatbotShowcase').then((m) => ({ default: m.AIChatbotShowcase }))
);

interface ProjectsProps {
  darkMode: boolean;
}

// Cuplikan tanya-jawab mini-preview chat
const CHAT_PREVIEW_PAIRS: { q: string; a: string }[] = [
  { q: 'Skill utamanya apa?', a: 'React, TypeScript, dan integrasi Multi-LLM (Gemini + Antigravity).' },
  { q: 'Berapa biaya bikin chatbot?', a: 'Mulai dari Rp 1,5 juta, termasuk voice & deployment.' },
  { q: 'Bisa pakai suara?', a: 'Bisa — voice AI dua arah dengan STT + TTS.' },
];
const CHAT_PREVIEW_INTERVAL_MS = 3400;
const CHAT_PREVIEW_FADE_MS = 300;

// ---------------------------------------------------------------------------
// Konten "Jasa AI Chatbot & Agent" — ubah teks, harga, dan estimasi waktu di
// sini saja; card sidebar & modal detail otomatis mengikuti.
// ---------------------------------------------------------------------------
const SERVICE_PRICE_LABEL = 'Rp 1,5 jt';

// Set ke null kalau kuota promo sudah habis; badge di card & banner di modal otomatis hilang.
const SERVICE_PROMO: { short: string; long: string } | null = {
  short: 'Diskon 15%',
  long: 'Promo peluncuran: diskon 15% untuk 5 klien pertama (dengan kesediaan menjadi studi kasus portofolio).',
};

// Tombol WhatsApp di modal — nomor diambil dari CONTACT_INFO supaya satu sumber data.
const SERVICE_WA_URL = `https://wa.me/${CONTACT_INFO.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
  'Halo Mas Arzha, saya tertarik dengan jasa AI Chatbot & Agent. Boleh konsultasi kebutuhan bisnis saya?'
)}`;

const SERVICE_TARGETS = ['Toko online', 'Jasa & klinik', 'UMKM'];

// Versi ringkas untuk card sidebar (sticky, jadi harus tetap pendek)
const SERVICE_BULLETS = [
  'Jawab pertanyaan pelanggan sesuai produk & FAQ bisnismu',
  'Bisa ngobrol pakai suara, dua arah dan natural',
  'Calon pelanggan masuk ke WhatsApp lengkap dengan brief-nya',
  'Tetap aktif walau satu model AI sedang gangguan',
];

// Versi lengkap untuk modal detail
const SERVICE_BENEFITS: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: Clock,
    title: 'Melayani 24 jam',
    desc: 'Pertanyaan pelanggan di luar jam kerja tetap terjawab, tidak menumpuk sampai besok pagi.',
  },
  {
    icon: Mic,
    title: 'Bisa diajak bicara',
    desc: 'Suara dua arah yang natural (Google Chirp3-HD). Pelanggan cukup bicara, chatbot menjawab dengan suara.',
  },
  {
    icon: MessageCircle,
    title: 'Calon pelanggan masuk ke WhatsApp',
    desc: 'Sekali klik, percakapan dirangkum menjadi brief dan dikirim ke WhatsApp kamu.',
  },
  {
    icon: Database,
    title: 'Menjawab sesuai bisnismu',
    desc: 'Berbekal produk, harga, dan FAQ milikmu, bukan jawaban generik yang bisa dipakai siapa saja.',
  },
  {
    icon: ShieldCheck,
    title: 'Tetap aktif dan aman',
    desc: 'Otomatis pindah ke model AI cadangan saat ada gangguan, dan API key tersimpan di server, bukan di browser pengunjung.',
  },
];

const SERVICE_STEPS: { title: string; desc: string; duration: string }[] = [
  {
    title: 'Diskusi kebutuhan',
    desc: 'Ceritakan bisnismu: siapa pelanggannya, pertanyaan apa yang paling sering masuk, dan apa yang ingin dicapai. Gratis, tanpa kewajiban order.',
    duration: '1-2 hari',
  },
  {
    title: 'Development',
    desc: 'Produk, harga, dan FAQ dijadikan bekal chatbot, lalu suara dan alur WhatsApp disambungkan. Progres diperbarui rutin lewat WhatsApp.',
    duration: '3-7 hari',
  },
  {
    title: 'Testing bareng kamu',
    desc: 'Chatbot dicoba dengan pertanyaan nyata dari pelangganmu, lalu disempurnakan sebelum rilis.',
    duration: '2-3 hari',
  },
  {
    title: 'Deployment & serah terima',
    desc: 'Chatbot dipasang dan dipastikan berjalan. Kamu menerima source code dan panduan singkat cara menggunakannya.',
    duration: '1 hari',
  },
];

const SERVICE_FAQ: { q: string; a: string }[] = [
  {
    q: 'Chatbot tahu soal bisnis saya dari mana?',
    a: 'Dari materi yang kamu berikan: daftar produk, harga, FAQ, dan info layanan. Semakin lengkap materinya, semakin akurat jawabannya.',
  },
  {
    q: 'Model AI apa yang dipakai?',
    a: 'Standarnya Gemini. Model lain seperti Claude atau GPT bisa disambungkan atas permintaan, dengan biaya API bulanan sesuai tarif masing-masing. Kalau satu model bermasalah, chatbot otomatis beralih ke model cadangan.',
  },
  {
    q: 'Berapa biaya bulanan setelah live?',
    a: 'Hosting memakai arsitektur serverless yang hemat biaya, sedangkan biaya API AI mengikuti pemakaian. Estimasinya dijelaskan di awal konsultasi supaya kamu bisa menghitung anggaran sejak awal.',
  },
  {
    q: 'Bagaimana sistem pembayarannya?',
    a: 'Bertahap per milestone: DP di awal, termin tengah saat fitur jadi, dan pelunasan saat rilis. Kamu melihat progres nyata dulu sebelum membayar tahap berikutnya.',
  },
  {
    q: 'Ada garansi kalau terjadi masalah?',
    a: 'Ada. Setiap proyek mendapat maintenance dan technical support gratis selama 1 bulan setelah rilis.',
  },
  {
    q: 'Source code jadi milik saya?',
    a: 'Ya. Seluruh source code, repositori, dan aset project diserahkan penuh tanpa biaya lisensi tersembunyi.',
  },
];

// Sub-komponen Mini-Preview Chat yang di-memoize untuk mencegah re-render pada seluruh komponen Projects
const ChatbotPreviewWidget: React.FC<{ darkMode: boolean; isChatbotOpen: boolean }> = memo(({ darkMode, isChatbotOpen }) => {
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewVisible, setPreviewVisible] = useState(true);

  useEffect(() => {
    if (isChatbotOpen) return;
    const cycle = setInterval(() => {
      setPreviewVisible(false);
      window.setTimeout(() => {
        setPreviewIndex((i) => (i + 1) % CHAT_PREVIEW_PAIRS.length);
        setPreviewVisible(true);
      }, CHAT_PREVIEW_FADE_MS);
    }, CHAT_PREVIEW_INTERVAL_MS);
    return () => clearInterval(cycle);
  }, [isChatbotOpen]);

  return (
    <div
      aria-hidden="true"
      className={`rounded-xl border p-3 mb-3.5 min-h-[82px] transition-colors ${
        darkMode ? 'bg-slate-950/70 border-slate-700/80 shadow-inner' : 'bg-white/80 border-teal-100 shadow-inner'
      }`}
    >
      <div
        className={`space-y-2 transition-opacity duration-300 ${
          previewVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex justify-end">
          <span
            className={`text-[11px] px-2.5 py-1 rounded-lg rounded-tr-sm max-w-[88%] font-medium ${
              darkMode ? 'bg-slate-800 text-slate-100' : 'bg-slate-200 text-slate-800'
            }`}
          >
            {CHAT_PREVIEW_PAIRS[previewIndex].q}
          </span>
        </div>
        <div className="flex items-start gap-1.5">
          <div
            className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
              darkMode ? 'bg-teal-500/30' : 'bg-teal-200'
            }`}
          >
            <Bot className={`w-2.5 h-2.5 ${darkMode ? 'text-teal-300' : 'text-teal-700'}`} />
          </div>
          <span
            className={`text-[11px] px-2.5 py-1 rounded-lg rounded-tl-sm max-w-[88%] leading-snug ${
              darkMode
                ? 'bg-teal-950/70 text-teal-100 border border-teal-800/60'
                : 'bg-teal-50 text-teal-900 border border-teal-100'
            }`}
          >
            {CHAT_PREVIEW_PAIRS[previewIndex].a}
          </span>
        </div>
      </div>
    </div>
  );
});

ChatbotPreviewWidget.displayName = 'ChatbotPreviewWidget';

export const Projects: React.FC<ProjectsProps> = ({ darkMode }) => {
  const [activeFilter, setActiveFilter] = useState<string>('Semua');
  const [activeModalProject, setActiveModalProject] = useState<ProjectItem | null>(null);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [chatbotInitialPrompt, setChatbotInitialPrompt] = useState<string>('');
  const [isServiceOpen, setIsServiceOpen] = useState(false);

  const handleAskAIAboutProject = (project: ProjectItem) => {
    setActiveModalProject(null);
    setChatbotInitialPrompt(`Ceritakan arsitektur, tantangan teknis, dan keunggulan dari proyek ${project.title}!`);
    setIsChatbotOpen(true);
  };

  const handleTryChatbotFromService = () => {
    setIsServiceOpen(false);
    setChatbotInitialPrompt('Berapa biaya dan apa saja yang saya dapat kalau memesan chatbot untuk bisnis saya?');
    setIsChatbotOpen(true);
  };

  // Hubungkan tombol Back browser agar menutup modal yang aktif secara bertahap
  useRegisterModal('project-detail-modal', !!activeModalProject, () => setActiveModalProject(null));
  useRegisterModal('chatbot-showcase-modal', isChatbotOpen, () => {
    setIsChatbotOpen(false);
    setChatbotInitialPrompt('');
  });
  useRegisterModal('chatbot-service-modal', isServiceOpen, () => setIsServiceOpen(false));

  // Filter Categories & Projects Memoized untuk efisiensi render
  const categories = useMemo(
    () => ['Semua', ...Array.from(new Set(PROJECTS.map((p) => p.category)))],
    []
  );

  const filteredProjects = useMemo(
    () =>
      activeFilter === 'Semua'
        ? PROJECTS
        : PROJECTS.filter((p) => p.category === activeFilter),
    [activeFilter]
  );

  // Lock body scroll ketika modal aktif
  useEffect(() => {
    if (activeModalProject || isChatbotOpen || isServiceOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [activeModalProject, isChatbotOpen, isServiceOpen]);

  // Inject Structured Data JSON-LD
  useEffect(() => {
    injectJsonLd('projects-jsonld', buildProjectsJsonLd(PROJECTS));
    return () => removeJsonLd('projects-jsonld');
  }, []);

  const getIcon = (iconType?: string) => {
    switch (iconType) {
      case 'Dice':
        return <Gamepad2 className="w-4 h-4" />;
      case 'GraduationCap':
        return <GraduationCap className="w-4 h-4" />;
      case 'FileSpreadsheet':
        return <FileSpreadsheet className="w-4 h-4" />;
      case 'BarChart3':
        return <BarChart3 className="w-4 h-4" />;
      default:
        return <Code2 className="w-4 h-4" />;
    }
  };

  const getBadgeClasses = (colorScheme?: string) => {
    switch (colorScheme) {
      case 'amber':
        return darkMode
          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
          : 'bg-amber-50 text-amber-700 border-amber-300';
      case 'teal':
        return darkMode
          ? 'bg-teal-500/15 text-teal-300 border-teal-500/30'
          : 'bg-teal-50 text-teal-700 border-teal-300';
      case 'indigo':
        return darkMode
          ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
          : 'bg-indigo-50 text-indigo-700 border-indigo-300';
      default:
        return darkMode
          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
          : 'bg-emerald-50 text-emerald-700 border-emerald-300';
    }
  };

  const getGradientHeader = (colorScheme?: string) => {
    switch (colorScheme) {
      case 'amber':
        return darkMode
          ? 'from-amber-500/20 via-amber-500/5 to-transparent'
          : 'from-amber-100/60 via-amber-50/20 to-transparent';
      case 'teal':
        return darkMode
          ? 'from-teal-500/20 via-teal-500/5 to-transparent'
          : 'from-teal-100/60 via-teal-50/20 to-transparent';
      case 'indigo':
        return darkMode
          ? 'from-indigo-500/20 via-indigo-500/5 to-transparent'
          : 'from-indigo-100/60 via-indigo-50/20 to-transparent';
      default:
        return darkMode
          ? 'from-emerald-500/20 via-emerald-500/5 to-transparent'
          : 'from-emerald-100/60 via-emerald-50/20 to-transparent';
    }
  };

  return (
    <section
      id="proyek"
      aria-labelledby="proyek-heading"
      className={`py-16 md:py-24 transition-colors duration-200 relative ${
        darkMode ? 'bg-slate-950 border-t border-slate-800/80' : 'bg-slate-50 border-t border-slate-200'
      }`}
    >
      {/* Subtle Background Accent Glows — dibungkus wrapper overflow-hidden
          sendiri (bukan di <section>) supaya nggak ikut mematahkan
          position:sticky pada sidebar chatbot di bawah. overflow selain
          `visible` pada ancestor manapun dari elemen sticky akan membuat
          elemen itu nempel relatif ke ancestor tsb, bukan ke viewport —
          karena ancestor ini sendiri tidak scroll independen, hasilnya
          sidebar terlihat seperti "ikut kescroll" alih-alih nempel. */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
      </div>


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div
            className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-3 shadow-sm ${
              darkMode
                ? 'text-teal-300 bg-teal-950/80 border border-teal-800/80'
                : 'text-teal-700 bg-teal-50 border border-teal-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Proyek & Karya Rekayasa</span>
          </div>
          <h2
            id="proyek-heading"
            className={`text-2xl sm:text-4xl font-extrabold tracking-tight mb-3 ${
              darkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            Portofolio Proyek Terpilih
          </h2>
          <p className={`text-xs sm:text-base leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            Aplikasi indie yang dirilis live dan web app internal korporat — dirancang dengan fokus tinggi pada kegunaan, performa real-time, dan dampak nyata.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold border transition-all duration-200 shadow-sm ${
                activeFilter === cat
                  ? 'bg-teal-600 text-white border-teal-600 shadow-teal-600/20 shadow-md scale-105'
                  : darkMode
                  ? 'text-slate-300 border-slate-700/80 bg-slate-900/60 hover:text-white hover:bg-slate-800 hover:border-slate-600'
                  : 'text-slate-600 border-slate-300 bg-white hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Layout: Projects Grid (kiri) + Sidebar (kanan) */}
        <div className="md:grid md:grid-cols-12 md:gap-6 mb-14">
          {/* LEFT: Projects Grid */}
          <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredProjects.map((project) => {
              const isFeatured = project.isFeatured;
              return (
                <div
                  key={project.id}
                  className={`${isFeatured ? 'md:col-span-2' : ''} group`}
                >
                  <div
                    className={`h-full rounded-2xl border transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between overflow-hidden relative ${
                      darkMode
                        ? 'bg-slate-900/90 border-slate-800 hover:border-teal-500/50 hover:shadow-xl hover:shadow-teal-500/5'
                        : 'bg-white border-slate-200/90 shadow-sm hover:shadow-xl hover:border-teal-300'
                    }`}
                  >
                    {/* Top Decorative Gradient Line for Featured Cards */}
                    <div
                      className={`h-1.5 w-full bg-gradient-to-r ${
                        project.colorScheme === 'amber'
                          ? 'from-amber-500 via-orange-400 to-amber-600'
                          : project.colorScheme === 'teal'
                          ? 'from-teal-500 via-emerald-400 to-teal-600'
                          : project.colorScheme === 'indigo'
                          ? 'from-indigo-500 via-purple-400 to-indigo-600'
                          : 'from-emerald-500 via-teal-400 to-emerald-600'
                      }`}
                    />

                    {/* Card Content Container */}
                    <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Header: Badge, Client Pill & Year */}
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border shadow-xs ${getBadgeClasses(
                                project.colorScheme
                              )}`}
                            >
                              {getIcon(project.iconType)}
                              {project.badge}
                            </span>
                            {project.client && (
                              <span
                                className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                                  darkMode
                                    ? 'bg-indigo-950/80 text-indigo-300 border-indigo-700/60 shadow-xs'
                                    : 'bg-indigo-50 text-indigo-800 border-indigo-200 shadow-xs'
                                }`}
                                title={`Proyek pesanan khusus untuk ${project.client}`}
                              >
                                <Building2 className="w-3 h-3 text-indigo-500" />
                                <span>Klien: {project.client}</span>
                              </span>
                            )}
                          </div>
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                              darkMode ? 'text-slate-400 bg-slate-800/60' : 'text-slate-500 bg-slate-100'
                            }`}
                          >
                            {project.year}
                          </span>
                        </div>

                        {/* Title & Tagline */}
                        <h3
                          className={`text-lg sm:text-xl font-bold tracking-tight mb-1.5 transition-colors cursor-pointer ${
                            darkMode
                              ? 'text-white group-hover:text-teal-300'
                              : 'text-slate-900 group-hover:text-teal-700'
                          }`}
                          onClick={() => setActiveModalProject(project)}
                        >
                          {project.title}
                        </h3>
                        <p
                          className={`text-xs font-semibold mb-3 ${
                            darkMode ? 'text-teal-400/90' : 'text-teal-700'
                          }`}
                        >
                          {project.tagline}
                        </p>

                        {/* Description */}
                        <p
                          className={`text-xs sm:text-sm leading-relaxed mb-4 ${
                            darkMode ? 'text-slate-300' : 'text-slate-600'
                          }`}
                        >
                          {project.description}
                        </p>

                        {/* Highlights List */}
                        <ul className="space-y-1.5 mb-5">
                          {project.highlights.slice(0, 3).map((item, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <ChevronRight
                                className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${
                                  darkMode ? 'text-teal-400' : 'text-teal-600'
                                }`}
                              />
                              <span
                                className={`text-xs ${
                                  darkMode ? 'text-slate-300' : 'text-slate-700'
                                }`}
                              >
                                {item}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Card Footer: Tech Stack Chips & Action Buttons */}
                      <div className="pt-3 border-t border-slate-700/40 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex flex-wrap gap-1.5">
                          {project.techStack.slice(0, 4).map((tech) => (
                            <span
                              key={tech}
                              className={`text-[10px] sm:text-[11px] font-medium px-2.5 py-0.5 rounded-md border ${
                                darkMode
                                  ? 'bg-slate-800/80 border-slate-700 text-slate-300'
                                  : 'bg-slate-100 border-slate-200 text-slate-700'
                              }`}
                            >
                              {tech}
                            </span>
                          ))}
                          {project.techStack.length > 4 && (
                            <span
                              className={`text-[10px] font-semibold px-1.5 py-0.5 self-center ${
                                darkMode ? 'text-slate-400' : 'text-slate-500'
                              }`}
                            >
                              +{project.techStack.length - 4} lagi
                            </span>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-1 sm:pt-0">
                          {project.demoUrl && (
                            <a
                              href={project.demoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-colors shadow-sm"
                              onClick={(e) => e.stopPropagation()}
                              title={project.client ? 'Buka Assets Demo (lingkungan simulasi aman)' : 'Buka Demo Aplikasi di tab baru'}
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>{project.client ? 'Assets Demo' : 'Live Demo'}</span>
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => setActiveModalProject(project)}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                              darkMode
                                ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                                : 'bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200'
                            }`}
                          >
                            <Info className="w-3.5 h-3.5" />
                            <span>Detail</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* RIGHT: Sidebar (Chatbot + Jasa) */}
          <div className="md:col-span-4 order-last mt-6 md:mt-0">
            <div className="md:sticky md:top-24 space-y-5">
              {/* AI Chatbot Card */}
              <button
                type="button"
                onClick={() => setIsChatbotOpen(true)}
                aria-haspopup="dialog"
                aria-label="Buka demo langsung AI Chatbot Portfolio"
                className={`w-full text-left p-5 sm:p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 ${
                  darkMode
                    ? 'bg-gradient-to-br from-slate-900 via-teal-950/40 to-slate-900 border-teal-700/60 hover:border-teal-500 shadow-lg shadow-teal-950/40 focus-visible:ring-offset-slate-950'
                    : 'bg-gradient-to-br from-white via-teal-50/60 to-white border-teal-200 shadow-md hover:shadow-xl focus-visible:ring-offset-slate-50'
                }`}
              >
                <div className="absolute -top-16 -right-16 w-40 h-40 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

                <div className="flex items-center justify-between mb-3 relative">
                  <span
                    className={`inline-flex items-center gap-1.5 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                      darkMode
                        ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                        : 'bg-teal-500/10 text-teal-700 border-teal-500/30'
                    }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    Live Interactive Demo
                  </span>
                  <span className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    2026
                  </span>
                </div>

                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 shadow-md ${
                    darkMode ? 'bg-teal-500/20 border border-teal-500/30' : 'bg-teal-100 border border-teal-200'
                  }`}
                >
                  <Bot className={`w-6 h-6 ${darkMode ? 'text-teal-300' : 'text-teal-600'}`} />
                </div>

                <h3
                  className={`text-lg sm:text-xl font-bold tracking-tight mb-1.5 ${
                    darkMode ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  AI Chatbot Portfolio
                </h3>

                <p className={`text-xs sm:text-sm leading-relaxed mb-3.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  Asisten AI interaktif yang siap menjawab pertanyaan seputar pengalaman, portfolio, dan keahlian secara instan dengan dukungan multi-model AI.
                </p>

                {/* Subkomponen preview yang efisien */}
                <ChatbotPreviewWidget darkMode={darkMode} isChatbotOpen={isChatbotOpen} />

                <ul className="space-y-1.5 mb-4">
                  {[
                    `${AVAILABLE_MODELS.length} pilihan model AI (Gemini + Antigravity Agent)`,
                    'Auto-failover otomatis jika model utama batas kuota',
                    'Serverless function teramankan tanpa bocor API key',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <ChevronRight
                        className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${darkMode ? 'text-teal-400' : 'text-teal-600'}`}
                      />
                      <span className={`text-[11px] sm:text-xs ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className={`flex flex-wrap gap-1.5 pt-2 border-t mb-4 ${darkMode ? 'border-slate-800' : 'border-slate-200/80'}`}>
                  {['Multi-LLM', 'Vercel Serverless', 'React', 'TypeScript'].map((tech) => (
                    <span
                      key={tech}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                        darkMode
                          ? 'bg-slate-800 border-slate-700 text-slate-300'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                <div
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-extrabold shadow-sm transition-colors ${
                    darkMode
                      ? 'bg-teal-500/20 text-teal-200 border border-teal-500/40 hover:bg-teal-500/30'
                      : 'bg-teal-600 text-white hover:bg-teal-700'
                  }`}
                >
                  <span>Coba Chatbot AI Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>

              {/* Jasa Chatbot Card */}
              <div
                className={`relative overflow-hidden p-5 sm:p-6 rounded-2xl border ${
                  darkMode
                    ? 'bg-slate-900/90 border-slate-800 shadow-lg'
                    : 'bg-white border-slate-200 shadow-md'
                }`}
              >
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400"
                />

                <div className="flex items-center gap-3 mb-4 pt-1">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      darkMode ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-emerald-100'
                    }`}
                  >
                    <MessageSquare className={`w-4 h-4 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  </div>
                  <div>
                    <h4 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      Jasa AI Chatbot & Agent
                    </h4>
                    <p className={`text-[11px] font-medium ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                      Balas pelanggan 24 jam, otomatis
                    </p>
                  </div>
                </div>

                <ul className="space-y-1.5 mb-4">
                  {SERVICE_BULLETS.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2
                        className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${
                          darkMode ? 'text-emerald-400' : 'text-emerald-600'
                        }`}
                      />
                      <span className={`text-[11px] sm:text-xs ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap items-center gap-1.5 mb-4">
                  <span className={`text-[11px] font-medium mr-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Cocok untuk
                  </span>
                  {SERVICE_TARGETS.map((target) => (
                    <span
                      key={target}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                        darkMode
                          ? 'bg-slate-800 border-slate-700 text-slate-300'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      {target}
                    </span>
                  ))}
                </div>

                <div
                  className={`p-3 rounded-xl border mb-4 ${
                    darkMode ? 'bg-amber-500/10 border-amber-500/25' : 'bg-amber-50 border-amber-200'
                  }`}
                >
                  <div className="flex items-baseline gap-1.5">
                    <Zap
                      className={`w-4 h-4 self-center ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}
                    />
                    <span className={`text-[11px] font-medium ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      Mulai dari
                    </span>
                    <span
                      className={`text-base font-extrabold tracking-tight ${
                        darkMode ? 'text-amber-300' : 'text-amber-700'
                      }`}
                    >
                      {SERVICE_PRICE_LABEL}
                    </span>
                    {SERVICE_PROMO && (
                      <span
                        className={`ml-auto self-center text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                          darkMode ? 'bg-amber-500/20 text-amber-200' : 'bg-amber-200/70 text-amber-900'
                        }`}
                      >
                        {SERVICE_PROMO.short}
                      </span>
                    )}
                  </div>
                  <p className={`text-[11px] mt-1 leading-snug ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Sudah termasuk setup suara, deployment & pengisian knowledge bisnis.
                  </p>
                </div>

                <a
                  href="#kontak"
                  className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
                    darkMode
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50 focus-visible:ring-offset-slate-900'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white focus-visible:ring-offset-white'
                  }`}
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Konsultasi Gratis</span>
                </a>
                <button
                  type="button"
                  onClick={() => setIsServiceOpen(true)}
                  aria-haspopup="dialog"
                  className={`mt-2 w-full inline-flex items-center justify-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                    darkMode
                      ? 'text-emerald-300 hover:bg-emerald-500/10'
                      : 'text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  <span>Lihat Detail & Cara Kerja</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Chatbot Modal */}
      {isChatbotOpen && (
        <Portal>
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setIsChatbotOpen(false)}
          >
            <div
              className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col ${
                darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
              }`}
              style={{ height: 'min(640px, calc(100vh - 2rem))', maxHeight: 'calc(100vh - 2rem)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div
                className={`flex-shrink-0 p-4 border-b flex items-center justify-between ${
                  darkMode
                    ? 'bg-gradient-to-r from-teal-950 via-slate-900 to-emerald-950 border-slate-700'
                    : 'bg-gradient-to-r from-teal-50 via-white to-emerald-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      darkMode ? 'bg-teal-500/20 border border-teal-500/30' : 'bg-teal-100'
                    }`}
                  >
                    <Bot className={`w-5 h-5 ${darkMode ? 'text-teal-300' : 'text-teal-600'}`} />
                  </div>
                  <div>
                    <h3 className={`text-sm sm:text-base font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      AI Chatbot Portfolio
                    </h3>
                    <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Demo live • Integrated {AVAILABLE_MODELS.length} AI Models • Serverless protected
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsChatbotOpen(false);
                    setChatbotInitialPrompt('');
                  }}
                  aria-label="Tutup modal chatbot"
                  className={`p-2 rounded-xl transition-colors ${
                    darkMode
                      ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Chatbot Content — Lazy Loaded */}
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                <Suspense
                  fallback={
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-teal-500 mb-3" />
                      <p className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        Memuat AI Chatbot Showcase...
                      </p>
                    </div>
                  }
                >
                  <AIChatbotShowcase darkMode={darkMode} initialPrompt={chatbotInitialPrompt} />
                </Suspense>
              </div>

              {/* Modal Footer */}
              <div
                className={`flex-shrink-0 p-4 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <p className={`text-xs ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  💼 <b>Tertarik pasang chatbot serupa?</b> Bisa dikustomisasi dengan model pilihan Anda.
                </p>
                <a
                  href="#kontak"
                  onClick={() => setIsChatbotOpen(false)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-sm transition-colors"
                >
                  <span>Order Jasa Chatbot</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Jasa AI Chatbot & Agent — Modal Detail Layanan */}
      {isServiceOpen && (
        <Portal>
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200 motion-reduce:animate-none"
            onClick={() => setIsServiceOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="jasa-chatbot-title"
              className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col ${
                darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
              }`}
              style={{ maxHeight: 'calc(100vh - 2rem)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                className={`flex-shrink-0 p-4 sm:p-5 border-b flex items-start justify-between gap-3 bg-gradient-to-r ${
                  darkMode
                    ? 'from-emerald-950 via-slate-900 to-teal-950 border-slate-700'
                    : 'from-emerald-50 via-white to-teal-50 border-slate-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      darkMode ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-emerald-100'
                    }`}
                  >
                    <MessageSquare className={`w-5 h-5 ${darkMode ? 'text-emerald-300' : 'text-emerald-600'}`} />
                  </div>
                  <div>
                    <h3
                      id="jasa-chatbot-title"
                      className={`text-base sm:text-lg font-bold tracking-tight ${
                        darkMode ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      Jasa AI Chatbot & Agent
                    </h3>
                    <p
                      className={`text-xs sm:text-sm mt-0.5 leading-relaxed ${
                        darkMode ? 'text-slate-300' : 'text-slate-600'
                      }`}
                    >
                      Chatbot yang menjawab pelanggan, bisa diajak bicara, dan mengirim calon pelanggan langsung ke
                      WhatsApp kamu.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsServiceOpen(false)}
                  aria-label="Tutup detail jasa chatbot"
                  className={`p-2 rounded-xl flex-shrink-0 transition-colors ${
                    darkMode
                      ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-6 space-y-8">
                {/* Harga */}
                <div className="space-y-2">
                  <div
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border ${
                      darkMode ? 'bg-amber-500/10 border-amber-500/25' : 'bg-amber-50 border-amber-200'
                    }`}
                  >
                    <div>
                      <p className={`text-[11px] font-medium ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        Mulai dari
                      </p>
                      <p
                        className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                          darkMode ? 'text-amber-300' : 'text-amber-700'
                        }`}
                      >
                        {SERVICE_PRICE_LABEL}
                      </p>
                    </div>
                    <p
                      className={`text-xs sm:text-sm leading-relaxed sm:max-w-[18rem] ${
                        darkMode ? 'text-slate-300' : 'text-slate-700'
                      }`}
                    >
                      Sudah termasuk setup suara, deployment serverless, dan pengisian knowledge bisnis. Biaya
                      operasional bulanan dijelaskan di awal konsultasi.
                    </p>
                  </div>
                  {SERVICE_PROMO && (
                    <div
                      className={`flex items-start gap-2.5 px-4 py-3 rounded-xl border text-xs sm:text-sm leading-relaxed ${
                        darkMode
                          ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-100'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      }`}
                    >
                      <Sparkles
                        className={`w-4 h-4 flex-shrink-0 mt-0.5 ${darkMode ? 'text-emerald-300' : 'text-emerald-600'}`}
                      />
                      <p>{SERVICE_PROMO.long}</p>
                    </div>
                  )}
                </div>

                {/* Yang kamu dapat */}
                <section aria-labelledby="jasa-benefit-heading">
                  <h4
                    id="jasa-benefit-heading"
                    className={`text-sm font-bold mb-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}
                  >
                    Yang kamu dapat
                  </h4>
                  <ul className={`divide-y ${darkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
                    {SERVICE_BENEFITS.map(({ icon: Icon, title, desc }) => (
                      <li key={title} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            darkMode ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className={`text-sm font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                            {title}
                          </p>
                          <p
                            className={`text-xs sm:text-sm leading-relaxed mt-0.5 ${
                              darkMode ? 'text-slate-400' : 'text-slate-600'
                            }`}
                          >
                            {desc}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>

                {/* Contoh brief WhatsApp */}
                <section aria-labelledby="jasa-brief-heading">
                  <h4
                    id="jasa-brief-heading"
                    className={`text-sm font-bold mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}
                  >
                    Begini calon pelanggan sampai ke kamu
                  </h4>
                  <p className={`text-xs sm:text-sm mb-3 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Tidak perlu membaca ulang seluruh percakapan. Chatbot merangkumnya jadi brief siap dibalas.
                  </p>
                  <div
                    className={`rounded-2xl border overflow-hidden ${
                      darkMode ? 'border-slate-700 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div
                      className={`flex items-center justify-between gap-2 px-4 py-2.5 text-xs font-semibold ${
                        darkMode ? 'bg-emerald-900/50 text-emerald-200' : 'bg-emerald-600 text-white'
                      }`}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <MessageCircle className="w-3.5 h-3.5" />
                        Brief masuk ke WhatsApp
                      </span>
                      <span className="font-medium opacity-80">Contoh ilustrasi</span>
                    </div>
                    <div className="p-4">
                      <div
                        className={`max-w-[94%] sm:max-w-[85%] rounded-xl rounded-tl-sm px-3.5 py-3 text-xs leading-relaxed space-y-1 shadow-sm ${
                          darkMode
                            ? 'bg-slate-800 text-slate-100'
                            : 'bg-white text-slate-800 border border-slate-200'
                        }`}
                      >
                        <p className="font-bold">Lead baru dari chatbot</p>
                        <p>Nama: Rina, Toko Batik Sari</p>
                        <p>Kebutuhan: chatbot penjawab pertanyaan pelanggan + suara dua arah</p>
                        <p>Kisaran anggaran: Rp 2 jt</p>
                        <p>Pertanyaan terakhir: &quot;Bisa terhubung ke WhatsApp toko?&quot;</p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Cara kerja */}
                <section aria-labelledby="jasa-steps-heading">
                  <h4
                    id="jasa-steps-heading"
                    className={`text-sm font-bold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}
                  >
                    Cara kerjanya
                  </h4>
                  <ol className="space-y-5">
                    {SERVICE_STEPS.map((step, i) => (
                      <li key={step.title} className="relative flex gap-3.5">
                        {i < SERVICE_STEPS.length - 1 && (
                          <span
                            aria-hidden="true"
                            className={`absolute left-[13px] top-7 -bottom-5 w-px ${
                              darkMode ? 'bg-slate-700' : 'bg-slate-200'
                            }`}
                          />
                        )}
                        <span
                          className={`relative w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                            darkMode
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {i + 1}
                        </span>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className={`text-sm font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                              {step.title}
                            </p>
                            <span
                              className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${
                                darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {step.duration}
                            </span>
                          </div>
                          <p
                            className={`text-xs sm:text-sm leading-relaxed mt-0.5 ${
                              darkMode ? 'text-slate-400' : 'text-slate-600'
                            }`}
                          >
                            {step.desc}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                  <p className="text-[11px] mt-4 text-slate-500">
                    Total sekitar 1-2 minggu, tergantung kelengkapan materi dan kompleksitas fitur.
                  </p>
                </section>

                {/* FAQ */}
                <section aria-labelledby="jasa-faq-heading">
                  <h4
                    id="jasa-faq-heading"
                    className={`text-sm font-bold mb-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}
                  >
                    Pertanyaan yang sering muncul
                  </h4>
                  <div className="space-y-2">
                    {SERVICE_FAQ.map((item) => (
                      <details
                        key={item.q}
                        className={`group rounded-xl border px-4 py-3 transition-colors ${
                          darkMode
                            ? 'border-slate-800 bg-slate-900 open:bg-slate-800/50'
                            : 'border-slate-200 bg-white open:bg-slate-50'
                        }`}
                      >
                        <summary
                          className={`flex cursor-pointer list-none items-center justify-between gap-3 text-xs sm:text-sm font-semibold [&::-webkit-details-marker]:hidden ${
                            darkMode ? 'text-slate-100' : 'text-slate-900'
                          }`}
                        >
                          <span>{item.q}</span>
                          <ChevronDown
                            className={`w-4 h-4 flex-shrink-0 transition-transform group-open:rotate-180 ${
                              darkMode ? 'text-slate-400' : 'text-slate-500'
                            }`}
                          />
                        </summary>
                        <p
                          className={`mt-2 text-xs sm:text-sm leading-relaxed ${
                            darkMode ? 'text-slate-300' : 'text-slate-600'
                          }`}
                        >
                          {item.a}
                        </p>
                      </details>
                    ))}
                  </div>
                </section>
              </div>

              {/* Footer */}
              <div
                className={`flex-shrink-0 p-4 border-t flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 ${
                  darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <button
                  type="button"
                  onClick={handleTryChatbotFromService}
                  className={`inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                    darkMode
                      ? 'border-teal-700/70 text-teal-300 bg-teal-950/40 hover:bg-teal-900/50'
                      : 'border-teal-300 text-teal-800 bg-teal-50/80 hover:bg-teal-100'
                  }`}
                >
                  <Bot className="w-3.5 h-3.5 text-teal-500" />
                  <span>Coba Demo Chatbot Dulu</span>
                </button>
                <a
                  href={SERVICE_WA_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-md transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Konsultasi via WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Project Detail Modal */}
      {activeModalProject && (
        <Portal>
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setActiveModalProject(null)}
          >
            <div
              className={`w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border shadow-2xl ${
                darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className={`sticky top-0 z-10 p-5 border-b flex items-center justify-between ${
                  darkMode ? 'bg-slate-900/95 border-slate-700 backdrop-blur-md' : 'bg-white/95 border-slate-200 backdrop-blur-md'
                }`}
              >
                <div>
                  <span
                    className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border mb-1.5 ${getBadgeClasses(
                      activeModalProject.colorScheme
                    )}`}
                  >
                    {getIcon(activeModalProject.iconType)}
                    {activeModalProject.badge}
                  </span>
                  <h3 className={`text-lg sm:text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {activeModalProject.title}
                  </h3>
                </div>
                <button
                  onClick={() => setActiveModalProject(null)}
                  aria-label="Tutup modal detail proyek"
                  className={`p-2 rounded-xl transition-colors ${
                    darkMode
                      ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 sm:p-6 space-y-6">
                <p className={`text-xs sm:text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  {activeModalProject.longDescription || activeModalProject.description}
                </p>

                {/* Studi Kasus Bisnis (Problem -> Solution -> Impact) */}
                {activeModalProject.businessCase && (
                  <div className="space-y-2.5">
                    <h4 className={`text-xs font-extrabold uppercase tracking-wider ${darkMode ? 'text-teal-400' : 'text-teal-700'}`}>
                      Studi Kasus & Solusi Nyata
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Tantangan */}
                      <div className={`p-3.5 rounded-xl border flex flex-col justify-start ${
                        darkMode ? 'bg-slate-800/60 border-rose-500/30' : 'bg-rose-50/70 border-rose-200'
                      }`}>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />
                          <span className={`text-[11px] font-bold uppercase tracking-wider ${darkMode ? 'text-rose-300' : 'text-rose-700'}`}>
                            Tantangan
                          </span>
                        </div>
                        <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                          {activeModalProject.businessCase.problem}
                        </p>
                      </div>

                      {/* Solusi */}
                      <div className={`p-3.5 rounded-xl border flex flex-col justify-start ${
                        darkMode ? 'bg-slate-800/60 border-teal-500/30' : 'bg-teal-50/70 border-teal-200'
                      }`}>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="w-2 h-2 rounded-full bg-teal-500 flex-shrink-0" />
                          <span className={`text-[11px] font-bold uppercase tracking-wider ${darkMode ? 'text-teal-300' : 'text-teal-700'}`}>
                            Solusi
                          </span>
                        </div>
                        <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                          {activeModalProject.businessCase.solution}
                        </p>
                      </div>

                      {/* Dampak */}
                      <div className={`p-3.5 rounded-xl border flex flex-col justify-start ${
                        darkMode ? 'bg-slate-800/60 border-emerald-500/30' : 'bg-emerald-50/70 border-emerald-200'
                      }`}>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                          <span className={`text-[11px] font-bold uppercase tracking-wider ${darkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
                            Dampak
                          </span>
                        </div>
                        <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                          {activeModalProject.businessCase.impact}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className={`text-xs font-extrabold uppercase tracking-wider mb-3 ${darkMode ? 'text-teal-400' : 'text-teal-700'}`}>
                    Fitur & Keunggulan Utama
                  </h4>
                  <ul className="space-y-2">
                    {activeModalProject.highlights.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <ChevronRight
                          className={`w-4 h-4 flex-shrink-0 mt-0.5 ${darkMode ? 'text-teal-400' : 'text-teal-600'}`}
                        />
                        <span className={`text-xs sm:text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className={`text-xs font-extrabold uppercase tracking-wider mb-3 ${darkMode ? 'text-teal-400' : 'text-teal-700'}`}>
                    Teknologi & Tools (Tech Stack)
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {activeModalProject.techStack.map((tech) => (
                      <span
                        key={tech}
                        className={`text-xs font-semibold px-3 py-1 rounded-lg border ${
                          darkMode
                            ? 'bg-slate-800 border-slate-700 text-slate-200'
                            : 'bg-slate-100 border-slate-200 text-slate-800'
                        }`}
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Alur Kerja Arsitektur Visual */}
                {activeModalProject.architectureFlow && activeModalProject.architectureFlow.length > 0 && (
                  <div>
                    <h4 className={`text-xs font-extrabold uppercase tracking-wider mb-2.5 ${darkMode ? 'text-teal-400' : 'text-teal-700'}`}>
                      Alur Kerja & Arsitektur
                    </h4>
                    <div className={`p-3.5 rounded-xl border overflow-x-auto ${
                      darkMode ? 'bg-slate-800/40 border-slate-700/80' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex items-center gap-2 min-w-max py-0.5">
                        {activeModalProject.architectureFlow.map((step, idx) => (
                          <React.Fragment key={idx}>
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium shadow-xs ${
                              darkMode
                                ? 'bg-slate-900/90 border-slate-700 text-slate-200'
                                : 'bg-white border-slate-200 text-slate-800'
                            }`}>
                              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                darkMode ? 'bg-teal-500/20 text-teal-300' : 'bg-teal-100 text-teal-800'
                              }`}>
                                {idx + 1}
                              </span>
                              <span>{step}</span>
                            </div>
                            {idx < activeModalProject.architectureFlow!.length - 1 && (
                              <ArrowRight className={`w-3.5 h-3.5 flex-shrink-0 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Client Case & Data Privacy Transparency Callout */}
                {activeModalProject.client && (
                  <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${
                    darkMode
                      ? 'bg-indigo-950/30 border-indigo-800/60 text-indigo-200'
                      : 'bg-indigo-50/80 border-indigo-200 text-indigo-950'
                  }`}>
                    <ShieldCheck className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                    <div className="text-xs leading-relaxed space-y-1">
                      <p className="font-bold text-sm text-indigo-400 dark:text-indigo-300">
                        Status Deployment & Perlindungan Data Klien
                      </p>
                      <p className={darkMode ? 'text-slate-300' : 'text-slate-700'}>
                        Sistem asli telah di-deploy dan aktif digunakan untuk operasional internal <b>{activeModalProject.client}</b>. Demi mematuhi standar privasi data korporat, akses demo publik yang disediakan (<b>Assets Demo</b>) menggunakan data simulasi aman <i>(dummy data)</i>.
                      </p>
                    </div>
                  </div>
                )}

                <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex flex-wrap justify-between gap-3 text-xs sm:text-sm">
                    {activeModalProject.client && (
                      <div>
                        <span className={`font-bold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Klien / Pengguna: </span>
                        <span className={`font-semibold ${darkMode ? 'text-teal-400' : 'text-teal-700'}`}>
                          {activeModalProject.client}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className={`font-bold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Peran / Perancangan: </span>
                      <span className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        {activeModalProject.role}
                      </span>
                    </div>
                    <div>
                      <span className={`font-bold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Tahun: </span>
                      <span className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        {activeModalProject.year}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div
                className={`sticky bottom-0 p-4 sm:p-5 border-t flex flex-wrap items-center justify-between gap-3 ${
                  darkMode ? 'bg-slate-900/95 border-slate-700 backdrop-blur-md' : 'bg-white/95 border-slate-200 backdrop-blur-md'
                }`}
              >
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveModalProject(null)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
                      darkMode
                        ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                        : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Tutup
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAskAIAboutProject(activeModalProject)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all duration-200 ${
                      darkMode
                        ? 'border-teal-700/70 text-teal-300 bg-teal-950/40 hover:bg-teal-900/50 hover:border-teal-500'
                        : 'border-teal-300 text-teal-800 bg-teal-50/80 hover:bg-teal-100 hover:border-teal-400'
                    }`}
                    title="Tanyakan arsitektur atau detail proyek ini ke AI Chatbot"
                  >
                    <Bot className="w-3.5 h-3.5 text-teal-500" />
                    <span>Tanya ke AI</span>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  {activeModalProject.githubUrl && (
                    <a
                      href={activeModalProject.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
                        darkMode
                          ? 'border-slate-700 text-slate-200 hover:bg-slate-800'
                          : 'border-slate-300 text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      <Github className="w-4 h-4" />
                      <span>Source Code</span>
                    </a>
                  )}
                  {activeModalProject.demoUrl && (
                    <a
                      href={activeModalProject.demoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-extrabold shadow-md transition-all duration-200 scale-100 hover:scale-105"
                    >
                      <span>{activeModalProject.client ? 'Buka Assets Demo' : 'Buka Live Demo'}</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </section>
  );
};