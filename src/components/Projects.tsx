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
} from 'lucide-react';
import { PROJECTS, AVAILABLE_MODELS } from '../data/portfolioData';
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

  // Hubungkan tombol Back browser agar menutup modal yang aktif secara bertahap
  useRegisterModal('project-detail-modal', !!activeModalProject, () => setActiveModalProject(null));
  useRegisterModal('chatbot-showcase-modal', isChatbotOpen, () => setIsChatbotOpen(false));

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
    if (activeModalProject || isChatbotOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [activeModalProject, isChatbotOpen]);

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
      className={`py-16 md:py-24 transition-colors duration-200 relative overflow-hidden ${
        darkMode ? 'bg-slate-950 border-t border-slate-800/80' : 'bg-slate-50 border-t border-slate-200'
      }`}
    >
      {/* Subtle Background Accent Glows */}
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

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
        <div className="md:grid md:grid-cols-12 md:gap-6 mb-14 items-start">
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
                className={`p-5 sm:p-6 rounded-2xl border ${
                  darkMode
                    ? 'bg-slate-900/90 border-slate-800 shadow-lg'
                    : 'bg-white border-slate-200 shadow-md'
                }`}
              >
                <div className="flex items-center gap-3 mb-3.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
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
                      Voice-enabled & Lead Generator
                    </p>
                  </div>
                </div>

                <ul className="space-y-1.5 mb-4">
                  {[
                    'Suara 2-Arah natural (Google Chirp3-HD)',
                    'One-Click WhatsApp Lead & Brief generator',
                    'Multi-LLM (Gemini, Claude, GPT-4) serverless',
                    'Zero-downtime hybrid fallback & custom knowledge',
                  ].map((item, i) => (
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

                <div className={`p-3 rounded-xl border mb-4 ${darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-emerald-50/50 border-emerald-100'}`}>
                  <div className="flex items-center gap-1.5">
                    <Zap className={`w-4 h-4 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
                    <span className={`text-xs font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                      Mulai dari Rp 1.5jt
                    </span>
                  </div>
                  <p className={`text-[11px] mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Termasuk voice setup, serverless deployment & custom knowledge.
                  </p>
                </div>

                <a
                  href="#kontak"
                  className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 shadow-sm ${
                    darkMode
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  <span>Konsultasi Gratis</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
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
                  onClick={() => setIsChatbotOpen(false)}
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
                  <AIChatbotShowcase darkMode={darkMode} />
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
                className={`sticky bottom-0 p-4 sm:p-5 border-t flex items-center justify-between gap-3 ${
                  darkMode ? 'bg-slate-900/95 border-slate-700 backdrop-blur-md' : 'bg-white/95 border-slate-200 backdrop-blur-md'
                }`}
              >
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