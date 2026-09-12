import React, { useState } from 'react';
import {
  Code2,
  Server,
  Gamepad2,
  Target,
  Clock,
  MessageSquare,
  Sparkles,
  Bot,
  Shield,
  FileCode2,
  Smartphone,
  Layers,
  CheckCircle2
} from 'lucide-react';

interface SkillsProps {
  darkMode: boolean;
}

interface SkillItem {
  name: string;
  dotColor: string;
  projects: string;
}

interface TechStackCategory {
  title: string;
  badge: string;
  badgeColor: string;
  icon: React.ElementType;
  accentBorder: string;
  items: SkillItem[];
}

export const Skills: React.FC<SkillsProps> = ({ darkMode }) => {
  // State untuk interaktivitas klik/sentuh di mobile
  const [activeSkill, setActiveSkill] = useState<SkillItem | null>(null);

  // 🎯 Tech Stack terstruktur dengan pembuktian di proyek nyata
  const techStackCards: TechStackCategory[] = [
    {
      title: 'Modern Frontend & UI',
      badge: 'Primary Stack',
      badgeColor: darkMode
        ? 'bg-cyan-950/70 text-cyan-300 border-cyan-800'
        : 'bg-cyan-50 text-cyan-700 border-cyan-200',
      icon: Code2,
      accentBorder: 'hover:border-cyan-500/40',
      items: [
        { name: 'React / Vite', dotColor: 'bg-cyan-400', projects: 'Assets Demo, B-Games, Portofolio' },
        { name: 'TypeScript', dotColor: 'bg-blue-400', projects: 'Assets Demo, B-Games, Rajendra Pintar' },
        { name: 'Tailwind CSS', dotColor: 'bg-teal-400', projects: 'Assets Demo, Portofolio' },
        { name: 'Recharts', dotColor: 'bg-emerald-400', projects: 'Assets Demo (Grafik Analitik Stok)' },
        { name: 'Lucide Icons', dotColor: 'bg-amber-400', projects: 'Assets Demo, Portofolio' },
        { name: 'HTML5 / Semantic Web', dotColor: 'bg-orange-400', projects: 'Seluruh Web App & SEO' }
      ]
    },
    {
      title: 'Real-time & Cross-Platform',
      badge: 'Mobile & Games',
      badgeColor: darkMode
        ? 'bg-purple-950/70 text-purple-300 border-purple-800'
        : 'bg-purple-50 text-purple-700 border-purple-200',
      icon: Smartphone,
      accentBorder: 'hover:border-purple-500/40',
      items: [
        { name: 'React Native', dotColor: 'bg-cyan-400', projects: 'Rajendra Pintar (Aplikasi Mobile Edukasi)' },
        { name: 'Expo', dotColor: 'bg-indigo-400', projects: 'Rajendra Pintar (Build & Testing)' },
        { name: 'Capacitor', dotColor: 'bg-sky-400', projects: 'B-Games (Mobile APK Android)' },
        { name: 'WebSockets', dotColor: 'bg-emerald-400', projects: 'B-Games (Turn-based Realtime Match)' },
        { name: 'boardgame.io', dotColor: 'bg-purple-400', projects: 'B-Games (Game State Engine)' },
        { name: 'Canvas 2D', dotColor: 'bg-rose-400', projects: 'B-Games (Papan & Animasi Bidak)' }
      ]
    },
    {
      title: 'Backend & Database Systems',
      badge: 'Production Ready',
      badgeColor: darkMode
        ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800'
        : 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: Server,
      accentBorder: 'hover:border-emerald-500/40',
      items: [
        { name: 'Node.js', dotColor: 'bg-emerald-400', projects: 'Assets Demo API, B-Games Server' },
        { name: 'Koa / Express', dotColor: 'bg-emerald-500', projects: 'Microservices & REST API' },
        { name: 'Supabase', dotColor: 'bg-emerald-400', projects: 'Rajendra Pintar, B-Games (Database)' },
        { name: 'PostgreSQL', dotColor: 'bg-sky-400', projects: 'Assets Demo (Relasional Aset & Stok)' },
        { name: 'RESTful APIs', dotColor: 'bg-amber-400', projects: 'Assets Demo, Zannah AI API' },
        { name: 'Cloudflare / Vercel', dotColor: 'bg-orange-400', projects: 'Edge Caching, CDN & Serverless' }
      ]
    },
    {
      title: 'AI Integration & Automation',
      badge: 'Intelligent Agent',
      badgeColor: darkMode
        ? 'bg-fuchsia-950/70 text-fuchsia-300 border-fuchsia-800'
        : 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
      icon: Bot,
      accentBorder: 'hover:border-fuchsia-500/40',
      items: [
        { name: 'Gemini API', dotColor: 'bg-fuchsia-400', projects: 'Zannah AI Chatbot & DevRAB Engine' },
        { name: 'Vercel Serverless', dotColor: 'bg-teal-400', projects: 'API Proxy Edge & Streaming' },
        { name: 'Prompt Engineering', dotColor: 'bg-pink-400', projects: 'Zannah Persona & Guardrails' },
        { name: 'DevRAB M2M Engine', dotColor: 'bg-amber-400', projects: 'Otomatisasi Proposal & RAB Online' },
        { name: 'Guardrails & Security', dotColor: 'bg-indigo-400', projects: 'Anti-Jailbreak, Rate Limit, Throttling' }
      ]
    }
  ];

  const wayOfWorking = [
    {
      title: 'Ketelitian Teknis',
      desc: 'Menguji dan memvalidasi setiap alur aplikasi secara teliti sebelum rilis, meminimalkan bug di sisi pengguna.',
      icon: Target
    },
    {
      title: 'Problem Solving',
      desc: 'Membedah masalah teknis maupun kebutuhan bisnis klien menjadi solusi aplikatif yang bisa langsung dieksekusi.',
      icon: Sparkles
    },
    {
      title: 'Komunikasi Responsif',
      desc: 'Update progres berkala dan terbuka berdiskusi lewat WhatsApp selama proses development berlangsung.',
      icon: MessageSquare
    },
    {
      title: 'Manajemen Waktu & Deadline',
      desc: 'Disiplin menjaga milestone dan tenggat rilis proyek tanpa mengorbankan kualitas kode.',
      icon: Clock
    },
    {
      title: 'Clean Code & Maintainability',
      desc: 'Menulis kode yang terstruktur, mudah dibaca, dan siap untuk di-maintain atau di-scale di masa depan.',
      icon: FileCode2
    },
    {
      title: 'Security Awareness',
      desc: 'Memahami best practices keamanan: proteksi API key, input sanitization, dan guardrail untuk AI integration.',
      icon: Shield
    }
  ];

  return (
    <section
      id="keahlian"
      aria-labelledby="keahlian-heading"
      className={`py-12 md:py-16 transition-colors duration-200 ${darkMode ? 'bg-slate-900/60' : 'bg-slate-100/70'}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode ? 'text-teal-400 bg-teal-950/60 border border-teal-800' : 'text-teal-600 bg-teal-50 border border-teal-200'}`}>
            <Code2 className="w-3.5 h-3.5" />
            <span>Tech Stack & Cara Kerja</span>
          </div>
          <h2 id="keahlian-heading" className={`text-2xl sm:text-3xl font-extrabold tracking-tight mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Teknologi yang Saya Kuasai
          </h2>
          <p className={`text-xs sm:text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            Stack modern untuk membangun web klien, mobile, game, dan sistem AI — teruji langsung pada produk nyata.
          </p>
        </div>

        {/* Global Floating Project Pill (Saat Skill Ditekan / Dihilangkan) */}
        {activeSkill && (
          <div className="mb-6 p-3 rounded-xl border bg-teal-500/10 border-teal-500/30 text-xs flex items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`w-2.5 h-2.5 rounded-full ${activeSkill.dotColor}`} />
              <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{activeSkill.name}</span>
              <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>terbukti di:</span>
              <span className="font-semibold text-teal-600 dark:text-teal-400">{activeSkill.projects}</span>
            </div>
            <button
              type="button"
              onClick={() => setActiveSkill(null)}
              className="text-[11px] underline opacity-75 hover:opacity-100 whitespace-nowrap"
            >
              Tutup
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Tech Stack (Kiri) - 4 Cards (2x2 Grid) */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {techStackCards.map((group, idx) => {
              const Icon = group.icon;
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border transition-all duration-200 hover:-translate-y-1 relative group ${group.accentBorder} ${
                    darkMode
                      ? 'bg-slate-900/90 border-slate-700/80 shadow-md shadow-black/20'
                      : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  {/* Card Header dengan Badge Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${darkMode ? 'bg-teal-500/20 text-teal-400' : 'bg-teal-500/15 text-teal-600'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <h3 className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{group.title}</h3>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${group.badgeColor}`}>
                      {group.badge}
                    </span>
                  </div>

                  {/* Interactive Skill Chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {group.items.map((item, i) => {
                      const isActive = activeSkill?.name === item.name;
                      return (
                        <div key={i} className="relative group/chip">
                          <button
                            type="button"
                            onClick={() => setActiveSkill(isActive ? null : item)}
                            className={`text-[10px] px-2.5 py-1 rounded-lg font-medium border flex items-center gap-1.5 transition-all text-left ${
                              isActive
                                ? 'bg-teal-500/20 border-teal-500 text-teal-300 font-bold shadow-sm'
                                : darkMode
                                ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-teal-500/50 hover:text-white'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-teal-400 hover:text-slate-900'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${item.dotColor}`} />
                            <span>{item.name}</span>
                          </button>

                          {/* Hover Tooltip (Desktop) */}
                          <div className="hidden sm:group-hover/chip:flex absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-30 pointer-events-none opacity-0 group-hover/chip:opacity-100 transition-opacity duration-150">
                            <div className="bg-slate-950 text-white text-[10px] px-2.5 py-1 rounded-md shadow-xl whitespace-nowrap border border-slate-700 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                              <span>{item.projects}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Micro Hint */}
                  <div className="mt-3 pt-2.5 border-t border-slate-700/30 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3 h-3 opacity-60" /> {group.items.length} Teknologi
                    </span>
                    <span className="text-[9px] opacity-70">Arahkan kursor / tap untuk bukti</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cara Kerja (Kanan) - 6 Cards (2x3 Grid) */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {wayOfWorking.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className={`p-4 rounded-xl border transition-all duration-200 hover:-translate-y-1 ${darkMode ? 'bg-slate-800/90 border-slate-700 hover:border-indigo-500/40' : 'bg-slate-50 border-slate-200 hover:border-indigo-300'}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2.5 ${darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-500/15 text-indigo-600'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h4 className={`text-xs font-bold mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{item.title}</h4>
                  <p className={`text-[11px] leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Full-width: Pengalaman membangun produk nyata */}
        <div className={`mt-6 p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center gap-2 mb-4">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${darkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-500/15 text-amber-600'}`}>
              <Gamepad2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`font-bold text-sm uppercase tracking-wider ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Pengalaman Membangun Produk Nyata
              </h3>
              <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Dari ide, arsitektur data, coding, hingga rilis ke pengguna — dikerjakan mandiri end-to-end.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                title: 'Fullstack Game & App',
                desc: 'Membangun platform multiplayer (B-Games) dan aplikasi edukasi (Rajendra Pintar) dengan React, Expo, TypeScript, dan Supabase.'
              },
              {
                title: 'Solo Product Management',
                desc: 'Mengelola seluruh siklus hidup produk: riset, UI/UX, development, testing, hingga deployment (Web via Vercel & Mobile via Capacitor).'
              },
              {
                title: 'Interaktivitas & UX',
                desc: 'Fokus pada pengalaman pengguna yang menyenangkan: animasi custom, text-to-speech, dan sistem gamifikasi.'
              }
            ].map((item, i) => (
              <div key={i} className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <h4 className={`font-bold text-xs mb-1 flex items-center gap-1.5 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  {item.title}
                </h4>
                <p className={`text-[11px] leading-snug ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};