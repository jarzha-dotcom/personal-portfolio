import React, { useState } from 'react';
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
} from 'lucide-react';
import { PROJECTS } from '../data/portfolioData';
import { ProjectItem } from '../types';
import { Portal } from './Portal';
import { AIChatbotShowcase } from './AIChatbotShowcase';

interface ProjectsProps {
  darkMode: boolean;
}

export const Projects: React.FC<ProjectsProps> = ({ darkMode }) => {
  const [activeFilter, setActiveFilter] = useState<string>('Semua');
  const [activeModalProject, setActiveModalProject] = useState<ProjectItem | null>(null);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  const categories = ['Semua', ...Array.from(new Set(PROJECTS.map((p) => p.category)))];
  const filteredProjects =
    activeFilter === 'Semua'
      ? PROJECTS
      : PROJECTS.filter((p) => p.category === activeFilter);

  const getIcon = (iconType: string) => {
    switch (iconType) {
      case 'Dice':
        return <Gamepad2 className="w-3.5 h-3.5" />;
      case 'GraduationCap':
        return <GraduationCap className="w-3.5 h-3.5" />;
      case 'FileSpreadsheet':
        return <FileSpreadsheet className="w-3.5 h-3.5" />;
      case 'BarChart3':
        return <BarChart3 className="w-3.5 h-3.5" />;
      default:
        return <Code2 className="w-3.5 h-3.5" />;
    }
  };

  const getBadgeClasses = (colorScheme: string) => {
    switch (colorScheme) {
      case 'amber':
        return darkMode
          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          : 'bg-amber-500/10 text-amber-600 border-amber-500/30';
      case 'teal':
        return darkMode
          ? 'bg-teal-500/10 text-teal-400 border-teal-500/30'
          : 'bg-teal-500/10 text-teal-600 border-teal-500/30';
      case 'indigo':
        return darkMode
          ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
          : 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30';
      default:
        return darkMode
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
          : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30';
    }
  };

  return (
    <section
      id="proyek"
      className={`py-14 md:py-20 transition-colors duration-200 ${darkMode ? 'bg-slate-950 border-t border-slate-800' : 'bg-slate-50 border-t border-slate-200'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode
              ? 'text-teal-400 bg-teal-950/60 border border-teal-800'
              : 'text-teal-600 bg-teal-50 border border-teal-200'
              }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Proyek & Karya</span>
          </div>
          <h2
            className={`text-2xl sm:text-3xl font-extrabold tracking-tight mb-2 ${darkMode ? 'text-white' : 'text-slate-900'
              }`}
          >
            Portofolio Proyek
          </h2>
          <p className={`text-xs sm:text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            Proyek indie yang sudah dirilis dan web app internal untuk kebutuhan bisnis nyata — dari game, aplikasi edukasi, hingga sistem manajemen aset.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${activeFilter === cat
                ? 'bg-teal-600 text-white border-teal-600'
                : darkMode
                  ? 'text-slate-300 border-slate-700 hover:text-white hover:bg-slate-800'
                  : 'text-slate-600 border-slate-300 hover:text-slate-900 hover:bg-slate-100'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 🎯 Layout: Projects (kiri) + Sidebar (kanan) */}
        <div className="md:grid md:grid-cols-12 md:gap-5 mb-14">
          {/* LEFT: Projects Grid */}
          <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredProjects.map((project) => {
              const isFeatured = project.isFeatured;
              return (
                <div
                  key={project.id}
                  className={`${isFeatured ? 'md:col-span-2' : ''} group`}
                >
                  <div
                    className={`h-full p-5 rounded-2xl border transition-all duration-200 hover:-translate-y-1 cursor-pointer ${darkMode
                      ? 'bg-slate-900 border-slate-700 hover:border-slate-600'
                      : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
                      }`}
                    onClick={() => setActiveModalProject(project)}
                  >
                    {/* Badge & Year */}
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${getBadgeClasses(
                          project.colorScheme
                        )}`}
                      >
                        {getIcon(project.iconType)}
                        {project.badge}
                      </span>
                      <span className={`text-[11px] font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {project.year}
                      </span>
                    </div>
                    {/* Title */}
                    <h3
                      className={`text-lg sm:text-xl font-bold tracking-tight mb-2 transition-colors ${darkMode ? 'text-white group-hover:text-teal-400' : 'text-slate-900 group-hover:text-teal-600'
                        }`}
                    >
                      {project.title}
                    </h3>
                    <p className={`text-xs sm:text-sm leading-relaxed mb-4 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      {project.description}
                    </p>
                    {/* Highlights */}
                    <ul className="space-y-1 mb-4">
                      {project.highlights.slice(0, 3).map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <ChevronRight
                            className={`w-3 h-3 flex-shrink-0 mt-0.5 ${darkMode ? 'text-teal-400' : 'text-teal-500'}`}
                          />
                          <span className={`text-[11px] ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {/* Tech Stack Chips */}
                    <div className={`flex flex-wrap gap-1.5 pt-2 border-t ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                      {project.techStack.slice(0, 4).map((tech) => (
                        <span
                          key={tech}
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${darkMode
                            ? 'bg-slate-800 border-slate-700 text-slate-300'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                            }`}
                        >
                          {tech}
                        </span>
                      ))}
                      {project.techStack.length > 4 && (
                        <span className={`text-[10px] font-medium px-2 py-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          +{project.techStack.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* RIGHT: Sidebar (Chatbot + Jasa) — sticky di desktop */}
          <div className="md:col-span-4 order-last mt-5 md:mt-0">
            <div className="md:sticky md:top-24 space-y-4">
              {/* 🤖 AI Chatbot Card */}
              <div
                className={`p-5 rounded-2xl border transition-all duration-200 hover:-translate-y-1 cursor-pointer relative overflow-hidden ${darkMode
                  ? 'bg-gradient-to-br from-slate-900 via-teal-950/40 to-slate-900 border-teal-700/50 hover:border-teal-500'
                  : 'bg-gradient-to-br from-white via-teal-50 to-white border-teal-200 shadow-sm hover:shadow-md'
                  }`}
                onClick={() => setIsChatbotOpen(true)}
              >
                <div className="absolute -top-16 -right-16 w-40 h-40 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex items-center justify-between mb-3 relative">
                  <span
                    className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${darkMode
                      ? 'bg-teal-500/10 text-teal-400 border-teal-500/30'
                      : 'bg-teal-500/10 text-teal-600 border-teal-500/30'
                      }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    Live Demo
                  </span>
                  <span className={`text-[11px] font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    2026
                  </span>
                </div>

                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${darkMode ? 'bg-teal-500/20' : 'bg-teal-100'
                    }`}
                >
                  <Bot className={`w-6 h-6 ${darkMode ? 'text-teal-400' : 'text-teal-600'}`} />
                </div>

                <h3
                  className={`text-lg sm:text-xl font-bold tracking-tight mb-2 transition-colors ${darkMode ? 'text-white group-hover:text-teal-400' : 'text-slate-900 group-hover:text-teal-600'
                    }`}
                >
                  AI Chatbot Portfolio
                </h3>

                <p className={`text-xs sm:text-sm leading-relaxed mb-4 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  Chatbot AI beneran yang ngerti konteks portofolio. Terintegrasi serverless, aman, dan siap di-upgrade ke Claude/GPT-4.
                </p>

                <ul className="space-y-1 mb-4">
                  {[
                    'Powered by Gemini API (Free Tier)',
                    'Serverless function untuk keamanan API key',
                    'Guardrail prompt — anti jailbreak',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <ChevronRight
                        className={`w-3 h-3 flex-shrink-0 mt-0.5 ${darkMode ? 'text-teal-400' : 'text-teal-500'}`}
                      />
                      <span className={`text-[11px] ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className={`flex flex-wrap gap-1.5 pt-2 border-t ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                  {['Gemini API', 'Vercel Serverless', 'React', 'TypeScript'].map((tech) => (
                    <span
                      key={tech}
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${darkMode
                        ? 'bg-slate-800 border-slate-700 text-slate-300'
                        : 'bg-white border-slate-200 text-slate-600'
                        }`}
                    >
                      {tech}
                    </span>
                  ))}
                  <span className={`text-[10px] font-medium px-2 py-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    +1
                  </span>
                </div>
              </div>

              {/* 💼 Jasa Chatbot Card (manfaatkan space kosong) */}
              <div
                className={`p-5 rounded-2xl border ${darkMode
                  ? 'bg-slate-900 border-slate-700'
                  : 'bg-white border-slate-200 shadow-sm'
                  }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${darkMode ? 'bg-emerald-500/20' : 'bg-emerald-100'
                      }`}
                  >
                    <MessageSquare className={`w-4 h-4 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  </div>
                  <div>
                    <h4 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      Jasa Chatbot AI
                    </h4>
                    <p className={`text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Tersedia untuk project kamu
                    </p>
                  </div>
                </div>

                <ul className="space-y-1.5 mb-4">
                  {[
                    'Custom AI chatbot untuk website/bisnis',
                    'Integrasi Claude, GPT-4, atau Gemini',
                    'Serverless + guardrail anti-jailbreak',
                    'Bisa multi-bahasa & custom knowledge base',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <CheckCircle2
                        className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'
                          }`}
                      />
                      <span className={`text-[11px] ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className={`p-2.5 rounded-lg border mb-3 ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center gap-1.5">
                    <Zap className={`w-3.5 h-3.5 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
                    <span className={`text-[11px] font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                      Mulai dari Rp 1.5jt
                    </span>
                  </div>
                  <p className={`text-[10px] mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Termasuk setup, deployment, dan 1x revisi
                  </p>
                </div>

                <a
                  href="#kontak"
                  className={`w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors ${darkMode
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
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

      {/* 🤖 AI Chatbot Modal — pakai Portal supaya fixed ke viewport */}
      {isChatbotOpen && (
        <Portal>
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsChatbotOpen(false)}
          >
            <div
              className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
                }`}
              style={{ maxHeight: 'calc(100vh - 2rem)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div
                className={`flex-shrink-0 p-4 sm:p-5 border-b flex items-center justify-between ${darkMode
                    ? 'bg-gradient-to-r from-teal-900/40 to-emerald-900/40 border-slate-700'
                    : 'bg-gradient-to-r from-teal-50 to-emerald-50 border-slate-200'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? 'bg-teal-500/20' : 'bg-teal-100'
                      }`}
                  >
                    <Bot className={`w-5 h-5 ${darkMode ? 'text-teal-400' : 'text-teal-600'}`} />
                  </div>
                  <div>
                    <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      AI Chatbot Portfolio
                    </h3>
                    <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Demo live • Gemini 2.0 Flash • Serverless protected
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsChatbotOpen(false)}
                  className={`p-2 rounded-lg transition-colors ${darkMode
                      ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Chatbot - flex-1 */}
              <div className="flex-1 overflow-hidden">
                <AIChatbotShowcase darkMode={darkMode} />
              </div>

              {/* Modal Footer */}
              <div
                className={`flex-shrink-0 p-4 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
                  }`}
              >
                <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  💼 <b>Tertarik pasang chatbot serupa?</b> Bisa custom pakai Claude/GPT-4 untuk jawaban lebih pintar.
                </p>
                <a
                  href="#kontak"
                  onClick={() => setIsChatbotOpen(false)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition-colors"
                >
                  <span>Order Jasa</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Project Detail Modal */}
      {activeModalProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setActiveModalProject(null)}
        >
          <div
            className={`w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border shadow-2xl ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
              }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`sticky top-0 z-10 p-4 sm:p-5 border-b flex items-center justify-between ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
                }`}
            >
              <div>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border mb-1.5 ${getBadgeClasses(
                    activeModalProject.colorScheme
                  )}`}
                >
                  {getIcon(activeModalProject.iconType)}
                  {activeModalProject.badge}
                </span>
                <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  {activeModalProject.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveModalProject(null)}
                className={`p-2 rounded-lg transition-colors ${darkMode
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-5 space-y-5">
              <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                {activeModalProject.longDescription}
              </p>
              <div>
                <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  Fitur Utama
                </h4>
                <ul className="space-y-1.5">
                  {activeModalProject.highlights.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <ChevronRight
                        className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${darkMode ? 'text-teal-400' : 'text-teal-500'}`}
                      />
                      <span className={`text-xs ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  Tech Stack
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {activeModalProject.techStack.map((tech) => (
                    <span
                      key={tech}
                      className={`text-[11px] font-medium px-2.5 py-1 rounded-md border ${darkMode
                        ? 'bg-slate-800 border-slate-700 text-slate-300'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
              <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex flex-wrap justify-between gap-2 text-xs">
                  <div>
                    <span className={`font-bold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Peran: </span>
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
            <div
              className={`sticky bottom-0 p-4 border-t flex items-center justify-between gap-3 ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
                }`}
            >
              <button
                onClick={() => setActiveModalProject(null)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-colors ${darkMode
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
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors ${darkMode
                      ? 'border-slate-700 text-slate-200 hover:bg-slate-800'
                      : 'border-slate-300 text-slate-800 hover:bg-slate-100'
                      }`}
                  >
                    <Github className="w-3.5 h-3.5" />
                    <span>Source</span>
                  </a>
                )}
                {activeModalProject.demoUrl && (
                  <a
                    href={activeModalProject.demoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition-colors"
                  >
                    <span>Buka Demo Live</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};