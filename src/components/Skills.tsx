import React from 'react';
import {
  Code2,
  Server,
  Gamepad2,
  Target,
  Clock,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { TECH_STACK_GROUPS } from '../data/portfolioData';

interface SkillsProps {
  darkMode: boolean;
}

// Versi Skills untuk halaman JASA — fokus tech stack & cara kerja developer.
// Untuk rincian hard/soft skill audit, lihat SkillsCV.tsx (dipakai di CVPage).
export const Skills: React.FC<SkillsProps> = ({ darkMode }) => {
  const devStackGroups = TECH_STACK_GROUPS.filter(
    (group) => group.category !== 'Audit & Enterprise Tools'
  );

  const groupIcons: Record<string, React.ElementType> = {
    'Game & Mobile Development': Gamepad2,
    'Frontend & UI Engineering': Code2,
    'Backend & Data Persistence': Server,
  };

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
    }
  ];

  return (
    <section
      id="keahlian"
      className={`py-12 md:py-16 transition-colors duration-200 ${darkMode ? 'bg-slate-900/60' : 'bg-slate-100/70'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode
            ? 'text-teal-400 bg-teal-950/60 border border-teal-800'
            : 'text-teal-600 bg-teal-50 border border-teal-200'
            }`}>
            <Code2 className="w-3.5 h-3.5" />
            <span>Tech Stack & Cara Kerja</span>
          </div>
          <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight mb-2 ${darkMode ? 'text-white' : 'text-slate-900'
            }`}>
            Teknologi yang Saya Kuasai
          </h2>
          <p className={`text-xs sm:text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'
            }`}>
            Stack modern untuk membangun web, mobile, dan game — dari frontend, backend, hingga deployment.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Tech Stack */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {devStackGroups.map((group, idx) => {
              const Icon = groupIcons[group.category] || Code2;
              return (
                <div key={idx} className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
                  }`}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${darkMode ? 'bg-teal-500/20 text-teal-400' : 'bg-teal-500/15 text-teal-600'
                      }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{group.category}</h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {group.items.map((item, i) => (
                      <span key={i} className={`text-[10px] px-2 py-0.5 rounded font-medium border ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cara Kerja */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {wayOfWorking.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2.5 ${darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-500/15 text-indigo-600'
                    }`}>
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
        <div className={`mt-6 p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
          }`}>
          <div className="flex items-center gap-2 mb-4">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${darkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-500/15 text-amber-600'
              }`}>
              <Gamepad2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`font-bold text-sm uppercase tracking-wider ${darkMode ? 'text-white' : 'text-slate-900'
                }`}>
                Pengalaman Membangun Produk Nyata
              </h3>
              <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'
                }`}>
                Dari ide, desain, coding, hingga rilis ke pengguna — dikerjakan mandiri end-to-end.
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
              <div key={i} className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}>
                <h4 className={`font-bold text-xs mb-1 flex items-center gap-1.5 ${darkMode ? 'text-white' : 'text-slate-900'
                  }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  {item.title}
                </h4>
                <p className={`text-[11px] leading-snug ${darkMode ? 'text-slate-300' : 'text-slate-600'
                  }`}>
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