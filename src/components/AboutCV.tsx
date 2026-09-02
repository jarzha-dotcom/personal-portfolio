import React from 'react';
import {
  MapPin,
  Briefcase,
  ShieldCheck,
  Sparkles,
  CheckCircle,
  TrendingUp,
  Target,
  Clock
} from 'lucide-react';
import { PERSONAL_INFO, STATS } from '../data/portfolioData';
import { CountUp } from './CountUp';

interface AboutCVProps {
  darkMode: boolean;
}

// Versi About formal untuk kebutuhan REKRUTMEN.
// Hanya dirender di dalam CVPage (mode easter egg), tidak muncul di halaman jasa.
export const AboutCV: React.FC<AboutCVProps> = ({ darkMode }) => {
  const infoCards = [
    {
      id: 'cv-info-location',
      icon: MapPin,
      title: 'Lokasi Domisili',
      value: PERSONAL_INFO.location,
      desc: 'Siap untuk penempatan Jabodetabek & Hybrid',
    },
    {
      id: 'cv-info-exp',
      icon: Briefcase,
      title: 'Total Pengalaman',
      value: PERSONAL_INFO.yearsOfExperience,
      desc: 'Konsisten di sektor korporat & operasional',
    },
    {
      id: 'cv-info-field',
      icon: ShieldCheck,
      title: 'Fokus Bidang',
      value: PERSONAL_INFO.field,
      desc: 'Kepatuhan SOP, Rekonsiliasi & ERP SAP',
    },
    {
      id: 'cv-info-status',
      icon: Sparkles,
      title: 'Status Ketersediaan',
      value: 'Terbuka untuk Peluang Kerja',
      desc: 'Penuh waktu, kontrak, maupun proyek lepas',
    },
  ];

  const corePillars = [
    {
      title: 'Integritas & Kepatuhan SOP',
      desc: 'Menegakkan standar operasional prosedur perusahaan secara objektif dan sistematis guna memitigasi risiko selisih dan kecurangan.',
      icon: ShieldCheck
    },
    {
      title: 'Ketelitian Berbasis Data',
      desc: 'Menganalisis ribuan baris transaksi ERP dan data fisik dengan akurasi tinggi menggunakan Excel tingkat lanjut dan SAP Business One.',
      icon: Target
    },
    {
      title: 'Tahan Tekanan & Efisiensi Waktu',
      desc: 'Terbiasa bekerja dalam lingkungan bertarget ketat, menjaga deadline laporan bulanan dan investigasi audit tepat waktu.',
      icon: Clock
    },
    {
      title: 'Solusi & Rekomendasi Praktis',
      desc: 'Tidak hanya menemukan deviasi, namun memberikan saran perbaikan alur kerja yang aplikatif dan mudah diterapkan oleh tim operasional.',
      icon: TrendingUp
    }
  ];

  return (
    <section
      id="cv-tentang"
      className={`py-10 md:py-12 transition-colors duration-200 ${darkMode ? 'bg-slate-900/60' : 'bg-slate-100/70'
        }`}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode
            ? 'text-teal-400 bg-teal-950/60 border border-teal-800'
            : 'text-teal-600 bg-teal-50 border border-teal-200'
            }`}>
            <Sparkles className="w-3.5 h-3.5" />
            <span>Profil Kandidat</span>
          </div>
          <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight mb-2 ${darkMode ? 'text-white' : 'text-slate-900'
            }`}>
            Profil & Profesionalisme
          </h2>
          <p className={`text-xs sm:text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'
            }`}>
            Dedikasi penuh pada akurasi data, audit internal yang transparan, dan administrasi bisnis yang efektif.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {infoCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                id={card.id}
                className={`p-4 rounded-2xl border transition-colors ${darkMode
                  ? 'bg-slate-900 border-slate-700'
                  : 'bg-white border-slate-200 shadow-sm'
                  }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${darkMode ? 'bg-teal-500/20 text-teal-400' : 'bg-teal-500/10 text-teal-600'
                  }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-400'
                  }`}>
                  {card.title}
                </h3>
                <p className={`text-base font-bold mb-0.5 ${darkMode ? 'text-white' : 'text-slate-900'
                  }`}>
                  {card.value}
                </p>
                <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-500'
                  }`}>
                  {card.desc}
                </p>
              </div>
            );
          })}
        </div>

        <div className={`p-6 sm:p-8 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
          }`}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-6 space-y-4">
              <h3 className={`text-xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'
                }`}>
                Profesional Berorientasi Detail & Data
              </h3>
              <p className={`text-xs sm:text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'
                }`}>
                {PERSONAL_INFO.about}
              </p>
              <p className={`text-xs sm:text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'
                }`}>
                Perjalanan karir saya yang berkembang secara progresif dari garda depan penjualan, operasional kasir/administrasi, hingga kini mengemban tanggung jawab sebagai{' '}
                <strong className={darkMode ? 'text-teal-400' : 'text-teal-600'}>Staff Audit Internal</strong>{' '}
                memberikan pemahaman menyeluruh tentang bagaimana setiap lini bisnis berinteraksi dengan sistem data dan kepatuhan finansial.
              </p>
              <div className="pt-2 flex flex-wrap gap-2.5">
                {['Manajemen Waktu Teruji', 'Komunikasi Lintas Divisi', 'Orientasi Solusi'].map((tag, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md border ${darkMode
                      ? 'text-teal-300 bg-teal-950/40 border-teal-800/50'
                      : 'text-teal-700 bg-teal-50 border-teal-200'
                      }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-teal-500" />
                    <span>{tag}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {corePillars.map((pillar, idx) => {
                const Icon = pillar.icon;
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border transition-colors ${darkMode
                      ? 'bg-slate-800 border-slate-700'
                      : 'bg-slate-50 border-slate-200'
                      }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2.5 ${darkMode ? 'bg-teal-500/20 text-teal-400' : 'bg-teal-500/15 text-teal-600'
                      }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <h4 className={`text-xs font-bold mb-1 ${darkMode ? 'text-white' : 'text-slate-900'
                      }`}>
                      {pillar.title}
                    </h4>
                    <p className={`text-[11px] leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'
                      }`}>
                      {pillar.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          {STATS.map((stat, i) => (
            <div
              key={i}
              className={`p-4 text-center rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
                }`}
            >
              <p className={`text-xl sm:text-2xl font-extrabold mb-0.5 ${darkMode ? 'text-teal-400' : 'text-teal-600'
                }`}>
                <CountUp value={stat.value} />
              </p>
              <p className={`text-xs font-bold mb-0.5 ${darkMode ? 'text-white' : 'text-slate-900'
                }`}>
                {stat.label}
              </p>
              <p className={`text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-500'
                }`}>
                {stat.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
