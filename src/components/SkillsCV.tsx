import React from 'react';
import {
  BarChart3,
  Search,
  BrainCircuit,
  Users,
  MessageSquareShare,
  Clock,
  Zap,
  Database,
  ShieldCheck,
  Sparkles,
  Gamepad2
} from 'lucide-react';
import { HARD_SKILLS, SOFT_SKILLS } from '../data/portfolioData';
import { useInView } from '../hooks/useInView';

interface SkillsCVProps {
  darkMode: boolean;
}

// Versi Skills formal untuk kebutuhan REKRUTMEN — hard skill & soft skill
// audit lengkap dengan persentase. Hanya dirender di dalam CVPage.
// Untuk versi tech stack developer, lihat Skills.tsx (halaman jasa).
export const SkillsCV: React.FC<SkillsCVProps> = ({ darkMode }) => {
  // Bar persentase baru dianimasikan ke lebar aslinya begitu section ini
  // benar-benar kelihatan di layar — sebelumnya animasinya sudah selesai
  // duluan saat mount, jauh sebelum user scroll sampai sini.
  const { ref: hardSkillsRef, isInView: hardSkillsInView } = useInView<HTMLDivElement>();

  const getSoftIcon = (iconName: string) => {
    switch (iconName) {
      case 'SearchCheck': return <Search className="w-5 h-5" />;
      case 'BrainCircuit': return <BrainCircuit className="w-5 h-5" />;
      case 'Users': return <Users className="w-5 h-5" />;
      case 'MessageSquareShare': return <MessageSquareShare className="w-5 h-5" />;
      case 'Clock': return <Clock className="w-5 h-5" />;
      case 'Zap': return <Zap className="w-5 h-5" />;
      default: return <Sparkles className="w-5 h-5" />;
    }
  };

  return (
    <section
      id="cv-keahlian"
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
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Keahlian</span>
          </div>
          <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight mb-2 ${darkMode ? 'text-white' : 'text-slate-900'
            }`}>
            Kompetensi & Kapabilitas
          </h2>
          <p className={`text-xs sm:text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'
            }`}>
            Kombinasi keahlian teknis dalam software akuntansi/ERP & audit, serta soft skills interpersonal yang teruji di lapangan.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Hard Skills */}
          <div className="lg:col-span-6">
            <div ref={hardSkillsRef} className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
              }`}>
              <div className={`flex items-center justify-between gap-2 mb-4 pb-3 border-b ${darkMode ? 'border-slate-700' : 'border-slate-100'
                }`}>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${darkMode ? 'bg-teal-500/20 text-teal-400' : 'bg-teal-500/15 text-teal-600'
                    }`}>
                    <Database className="w-4 h-4" />
                  </div>
                  <h3 className={`font-bold text-sm uppercase tracking-wider ${darkMode ? 'text-white' : 'text-slate-900'
                    }`}>Hard Skills</h3>
                </div>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${darkMode ? 'bg-teal-500/10 text-teal-400' : 'bg-teal-500/10 text-teal-600'
                  }`}>{HARD_SKILLS.length} Bidang</span>
              </div>
              <div className="space-y-4">
                {HARD_SKILLS.map((skill, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className={darkMode ? 'text-white' : 'text-slate-900'}>
                        {skill.name}
                      </span>
                      <span className={darkMode ? 'text-teal-400' : 'text-teal-600'}>
                        {skill.level}%
                      </span>
                    </div>
                    <div className={`w-full h-1.5 rounded-full overflow-hidden ${darkMode ? 'bg-slate-800' : 'bg-slate-100'
                      }`}>
                      <div
                        className="bg-teal-500 h-full rounded-full transition-all duration-700"
                        style={{ width: hardSkillsInView ? `${skill.level}%` : '0%' }}
                        role="progressbar"
                        aria-valuenow={skill.level}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      />
                    </div>
                    <p className={`text-[11px] leading-tight ${darkMode ? 'text-slate-300' : 'text-slate-500'
                      }`}>{skill.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Soft Skills */}
          <div className="lg:col-span-6">
            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
              }`}>
              <div className={`flex items-center justify-between gap-2 mb-4 pb-3 border-b ${darkMode ? 'border-slate-700' : 'border-slate-100'
                }`}>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-500/15 text-indigo-600'
                    }`}>
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className={`font-bold text-sm uppercase tracking-wider ${darkMode ? 'text-white' : 'text-slate-900'
                    }`}>Soft Skills</h3>
                </div>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-500/10 text-indigo-600'
                  }`}>Karakter Kerja</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SOFT_SKILLS.map((skill, idx) => (
                  <div key={idx} className={`p-3 rounded-xl border transition-colors ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                    }`}>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-1.5 ${darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-500/10 text-indigo-600'
                      }`}>
                      {getSoftIcon(skill.iconName)}
                    </div>
                    <h4 className={`font-bold text-xs mb-0.5 ${darkMode ? 'text-white' : 'text-slate-900'
                      }`}>{skill.name}</h4>
                    <p className={`text-[11px] leading-snug ${darkMode ? 'text-slate-300' : 'text-slate-600'
                      }`}>{skill.description}</p>
                  </div>
                ))}
              </div>
              <div className={`mt-4 p-3 rounded-xl border ${darkMode
                  ? 'bg-teal-950/30 border-teal-800/40 text-teal-200'
                  : 'bg-teal-50 border-teal-200 text-teal-900'
                }`}>
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className={`w-4 h-4 flex-shrink-0 mt-0.5 ${darkMode ? 'text-teal-400' : 'text-teal-600'
                    }`} />
                  <div>
                    <p className="text-[11px] font-bold mb-0.5">Prinsip Kerja Profesional</p>
                    <p className="text-[10px] leading-relaxed opacity-90">
                      "Menjaga netralitas, ketepatan data, dan memberikan nilai tambah bagi efisiensi operasional perusahaan."
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Full-width: Ringkasan Kapabilitas Tambahan */}
          <div className={`lg:col-span-12 mt-2 p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
            }`}>
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${darkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-500/15 text-amber-600'
                }`}>
                <Gamepad2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className={`font-bold text-sm uppercase tracking-wider ${darkMode ? 'text-white' : 'text-slate-900'
                  }`}>
                  Nilai Tambah: Kemampuan Teknologi
                </h3>
                <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                  Di luar audit & administrasi, saya juga aktif membangun aplikasi secara mandiri.
                </p>
              </div>
            </div>
            <p className={`text-[11px] leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Sebagai indie developer, saya telah merilis beberapa proyek nyata (web, mobile, dan game) menggunakan React, TypeScript, dan Supabase — kemampuan yang relevan untuk peran yang membutuhkan pemahaman sistem digital, otomasi laporan, atau kolaborasi dengan tim IT.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
