import React, { useState } from 'react';
import {
  Briefcase,
  Calendar,
  MapPin,
  ChevronRight,
  Building2,
  BadgeCheck,
  Sparkles
} from 'lucide-react';
import { EXPERIENCES } from '../data/portfolioData';

interface ExperienceProps {
  darkMode: boolean;
}

// Komponen ini sekarang eksklusif dipakai di dalam CVPage (Mode CV),
// tidak lagi tampil di halaman jasa.
export const Experience: React.FC<ExperienceProps> = ({ darkMode }) => {
  const [selectedExpId, setSelectedExpId] = useState<string | null>(null);

  return (
    <section
      id="cv-pengalaman"
      className={`py-12 md:py-16 transition-colors duration-200 ${darkMode ? 'bg-slate-950' : 'bg-white'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode
            ? 'text-teal-400 bg-teal-950/60 border border-teal-800'
            : 'text-teal-600 bg-teal-50 border border-teal-200'
            }`}>
            <Briefcase className="w-3.5 h-3.5" />
            <span>Pengalaman Kerja</span>
          </div>
          <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight mb-2 ${darkMode ? 'text-white' : 'text-slate-900'
            }`}>
            Rekam Jejak Profesional
          </h2>
          <p className={`text-xs sm:text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'
            }`}>
            Perjalanan karir lebih dari 7 tahun dengan dedikasi tinggi, peningkatan tanggung jawab berkelanjutan, dan kepatuhan SOP yang teruji.
          </p>
        </div>

        {/* Timeline Container */}
        <div className="max-w-4xl mx-auto relative">
          {/* Vertical Line (disembunyikan saat print) */}
          <div
            id="cv-timeline-line"
            className={`absolute left-4 sm:left-6 md:left-1/2 top-4 bottom-4 w-0.5 -translate-x-1/2 ${darkMode ? 'bg-slate-800' : 'bg-slate-200'
              }`}
            aria-hidden="true"
          />
          <div className="space-y-6 sm:space-y-8">
            {EXPERIENCES.map((exp, index) => {
              const isEven = index % 2 === 0;
              const isCurrent = exp.roles.some((r) => r.isCurrent);
              return (
                <div
                  key={exp.id}
                  id={exp.id}
                  className={`cv-timeline-item relative flex flex-col md:flex-row items-start ${isEven ? 'md:flex-row-reverse' : ''
                    }`}
                >
                  {/* Timeline Dot */}
                  <div className="absolute left-4 sm:left-6 md:left-1/2 -translate-x-1/2 flex items-center justify-center z-20">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${isCurrent
                        ? 'bg-teal-600 border-teal-500 ring-2 ring-teal-500/20'
                        : darkMode
                          ? 'bg-slate-700 border-slate-600'
                          : 'bg-slate-300 border-slate-200'
                        }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-white animate-pulse' : darkMode ? 'bg-slate-400' : 'bg-white'
                        }`} />
                    </div>
                  </div>

                  {/* Content Card */}
                  <div className={`pl-10 sm:pl-14 md:pl-0 w-full md:w-1/2 ${isEven ? 'md:pr-8' : 'md:pl-8'
                    }`}>
                    <div className={`p-4 sm:p-5 rounded-2xl border transition-colors ${darkMode
                      ? 'bg-slate-900 border-slate-700'
                      : 'bg-white border-slate-200 shadow-sm'
                      }`}>
                      {/* Header info */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${isCurrent
                          ? darkMode
                            ? 'bg-teal-500/15 text-teal-400 border-teal-500/30'
                            : 'bg-teal-500/15 text-teal-600 border-teal-500/20'
                          : darkMode
                            ? 'bg-slate-800 text-slate-300 border-slate-700'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                          <Calendar className="w-3 h-3" />
                          <span>{exp.period}</span>
                        </span>
                        <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${darkMode ? 'text-slate-300' : 'text-slate-500'
                          }`}>
                          <MapPin className="w-3 h-3 text-teal-500" />
                          <span>{exp.location}</span>
                        </span>
                      </div>

                      {/* Company Name */}
                      <h3 className={`text-base font-bold flex items-center gap-2 mb-3 ${darkMode ? 'text-white' : 'text-slate-900'
                        }`}>
                        <Building2 className={`w-4 h-4 flex-shrink-0 ${darkMode ? 'text-teal-400' : 'text-teal-600'
                          }`} />
                        <span>{exp.company}</span>
                      </h3>

                      {/* Roles List */}
                      <div className="space-y-3">
                        {exp.roles.map((roleObj, roleIdx) => (
                          <div
                            key={roleIdx}
                            className={`p-3 rounded-xl border ${roleObj.isCurrent
                              ? darkMode
                                ? 'bg-slate-800 border-teal-500/30'
                                : 'bg-teal-50/50 border-teal-200'
                              : darkMode
                                ? 'bg-slate-800 border-slate-700'
                                : 'bg-slate-50 border-slate-200'
                              }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <h4 className={`font-bold text-xs flex items-center gap-1.5 ${darkMode ? 'text-white' : 'text-slate-900'
                                }`}>
                                {roleObj.isCurrent && (
                                  <BadgeCheck className="w-3.5 h-3.5 text-teal-500" />
                                )}
                                <span>{roleObj.role}</span>
                              </h4>
                              {roleObj.period && (
                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${darkMode
                                  ? 'text-teal-400 bg-teal-500/10'
                                  : 'text-teal-600 bg-teal-500/10'
                                  }`}>
                                  {roleObj.period}
                                </span>
                              )}
                            </div>
                            <ul className="space-y-1.5 mt-1.5">
                              {roleObj.tasks.map((task, taskIdx) => (
                                <li
                                  key={taskIdx}
                                  className={`text-[11px] leading-relaxed flex items-start gap-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'
                                    }`}
                                >
                                  <ChevronRight className="w-3 h-3 text-teal-500 flex-shrink-0 mt-0.5" />
                                  <span>{task}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};