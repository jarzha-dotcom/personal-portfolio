import React from 'react';
import {
  MapPin,
  Sparkles,
  CheckCircle,
  TrendingUp,
  Target,
  Clock,
  Code2
} from 'lucide-react';
import { PERSONAL_INFO, STATS } from '../data/portfolioData';

interface AboutProps {
  darkMode: boolean;
}

// Versi About untuk halaman JASA — fokus ke kredibilitas developer.
// Untuk versi formal/rekrutmen, lihat AboutCV.tsx (dipakai di CVPage).
export const About: React.FC<AboutProps> = ({ darkMode }) => {
  const infoCards = [
    {
      id: 'info-location',
      icon: MapPin,
      title: 'Lokasi Domisili',
      value: PERSONAL_INFO.location,
      desc: 'Terbuka untuk kerja remote maupun on-site (Jabodetabek)',
    },
    {
      id: 'info-exp',
      icon: Clock,
      title: 'Pengalaman Kerja',
      value: PERSONAL_INFO.yearsOfExperience,
      desc: 'Perpaduan disiplin korporat & jam terbang coding mandiri',
    },
    {
      id: 'info-field',
      icon: Code2,
      title: 'Fokus Layanan',
      value: 'Web, Mobile & Game',
      desc: 'Dari konsep, desain, coding, hingga deployment',
    },
    {
      id: 'info-status',
      icon: Sparkles,
      title: 'Status Ketersediaan',
      value: 'Tersedia untuk Proyek',
      desc: 'Terbuka untuk pengerjaan aplikasi web, mobile, & game',
    },
  ];

  const corePillars = [
    {
      title: 'Kode Rapi & Best Practice',
      desc: 'Menulis kode yang terstruktur dan mudah dirawat, mengikuti standar praktik terbaik agar aplikasi tetap sehat untuk dikembangkan jangka panjang.',
      icon: CheckCircle
    },
    {
      title: 'Ketelitian pada Detail Teknis',
      desc: 'Terbiasa memvalidasi data dan alur aplikasi secara cermat — kebiasaan dari pekerjaan berbasis data yang kini saya terapkan untuk meminimalkan bug.',
      icon: Target
    },
    {
      title: 'Tahan Tekanan & Tepat Waktu',
      desc: 'Terbiasa bekerja dengan target dan deadline ketat, sehingga progres proyek dan milestone pengiriman tetap terjaga sesuai kesepakatan.',
      icon: Clock
    },
    {
      title: 'Solusi Praktis untuk Bisnis',
      desc: 'Tidak sekadar coding sesuai permintaan, tapi turut memberi masukan teknis yang aplikatif dan relevan dengan kebutuhan bisnis klien.',
      icon: TrendingUp
    }
  ];

  return (
    <section
      id="tentang"
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
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tentang Saya</span>
          </div>
          <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight mb-2 ${darkMode ? 'text-white' : 'text-slate-900'
            }`}>
            Developer di Balik Layanan Ini
          </h2>
          <p className={`text-xs sm:text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'
            }`}>
            Solo developer dengan latar belakang korporat, membawa kedisiplinan kerja profesional ke setiap proyek yang dikerjakan.
          </p>
        </div>

        {/* 4 Info Cards Grid */}
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

        {/* Main Bio Paragraph & Pillars Layout */}
        <div className={`p-6 sm:p-8 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
          }`}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Bio Narrative */}
            <div className="lg:col-span-6 space-y-4">
              <h3 className={`text-xl font-bold tracking-tight flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'
                }`}>
                <span>Latar Belakang Unik: Korporat + Developer</span>
              </h3>
              <p className={`text-xs sm:text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'
                }`}>
                Sebelum terjun serius sebagai developer, saya menghabiskan 7+ tahun berkarier di lingkungan korporat — mulai dari operasional lini depan hingga peran yang menuntut ketelitian tinggi terhadap data. Pengalaman ini membentuk cara kerja saya: disiplin, sistematis, dan selalu berorientasi pada hasil yang bisa dipertanggungjawabkan.
              </p>
              <p className={`text-xs sm:text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'
                }`}>
                Nilai-nilai itu yang saya bawa ketika beralih membangun{' '}
                <strong className={darkMode ? 'text-teal-400' : 'text-teal-600'}>aplikasi web, mobile, dan game</strong>{' '}
                secara mandiri — dari riset kebutuhan, desain UI/UX, coding, hingga rilis ke pengguna nyata.
              </p>
              <div className="pt-2 flex flex-wrap gap-2.5">
                {['Kode Rapi & Terstruktur', 'Komunikasi Responsif', 'Orientasi Solusi'].map((tag, i) => (
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

            {/* Core Pillars 2x2 */}
            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {corePillars.map((pillar, idx) => {
                const Icon = pillar.icon;
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border transition-colors ${darkMode
                      ? 'bg-slate-800 border-slate-700'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100/50'
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

        {/* Highlight Stats Row */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          {STATS.map((stat, i) => (
            <div
              key={i}
              className={`p-4 text-center rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
                }`}
            >
              <p className={`text-xl sm:text-2xl font-extrabold mb-0.5 ${darkMode ? 'text-teal-400' : 'text-teal-600'
                }`}>
                {stat.value}
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