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
import { PERSONAL_INFO } from '../data/portfolioData';
import { CountUp } from './CountUp';

interface AboutProps {
  darkMode: boolean;
}

// Stats khusus halaman JASA
const JASA_STATS = [
  { value: '7+', label: 'Tahun Pengalaman', desc: 'Termasuk disiplin kerja korporat' },
  { value: '3', label: 'Proyek Dirilis', desc: 'Web, mobile & game — live & dipakai user' },
  { value: '15+', label: 'Tech Stack Dikuasai', desc: 'Frontend, backend, hingga deployment' },
  { value: '4', label: 'Tahap Kerja Transparan', desc: 'Dari konsultasi sampai rilis' },
];

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
      aria-labelledby="tentang-heading"
      className={`relative py-16 md:py-24 transition-colors duration-300 overflow-hidden ${
        darkMode ? 'bg-slate-950' : 'bg-slate-50'
      }`}
    >
      {/* Decorative Background Blobs for Depth */}
      <div className={`absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20 -z-0 ${
        darkMode ? 'bg-teal-600' : 'bg-teal-300'
      }`} />
      <div className={`absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-20 -z-0 ${
        darkMode ? 'bg-cyan-600' : 'bg-emerald-300'
      }`} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-4 border backdrop-blur-sm ${
            darkMode 
              ? 'text-teal-300 bg-teal-950/60 border-teal-700/50 shadow-lg shadow-teal-900/20' 
              : 'text-teal-700 bg-teal-50/80 border-teal-200 shadow-sm'
          }`}>
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tentang Saya</span>
          </div>
          
          <h2 
            id="tentang-heading" 
            className={`text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r ${
              darkMode 
                ? 'from-white via-teal-200 to-teal-400' 
                : 'from-slate-900 via-teal-700 to-teal-500'
            }`}
          >
            Developer di Balik Layanan Ini
          </h2>
          
          <p className={`text-sm sm:text-base leading-relaxed max-w-2xl mx-auto ${
            darkMode ? 'text-slate-400' : 'text-slate-600'
          }`}>
            Membangun aplikasi dari konsep sampai rilis, dengan komunikasi langsung tanpa perantara dan kedisiplinan kerja profesional di setiap proyek.
          </p>
        </div>

        {/* 4 Info Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          {infoCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                id={card.id}
                className={`group relative p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl cursor-default ${
                  darkMode
                    ? 'bg-slate-900/60 backdrop-blur-sm border-slate-800 hover:border-teal-500/50 hover:shadow-teal-500/10'
                    : 'bg-white/70 backdrop-blur-sm border-slate-200 hover:border-teal-400/60 hover:shadow-teal-500/10'
                }`}
              >
                {/* Icon Container */}
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-colors duration-300 ${
                  darkMode 
                    ? 'bg-teal-500/10 text-teal-400 group-hover:bg-teal-500/20' 
                    : 'bg-teal-50 text-teal-600 group-hover:bg-teal-100'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                
                <h3 className={`text-[11px] font-bold uppercase tracking-wider mb-1.5 ${
                  darkMode ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  {card.title}
                </h3>
                <p className={`text-lg font-bold mb-1 ${
                  darkMode ? 'text-white' : 'text-slate-900'
                }`}>
                  {card.value}
                </p>
                <p className={`text-xs leading-relaxed ${
                  darkMode ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  {card.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Main Bio Paragraph & Pillars Layout */}
        <div className={`relative p-6 sm:p-10 rounded-3xl border overflow-hidden ${
          darkMode 
            ? 'bg-slate-900/50 backdrop-blur-md border-slate-800' 
            : 'bg-white/80 backdrop-blur-md border-slate-200 shadow-xl shadow-slate-200/50'
        }`}>
          {/* Subtle Grid Pattern Overlay */}
          <div className={`absolute inset-0 opacity-[0.03] pointer-events-none ${
            darkMode ? 'bg-white' : 'bg-black'
          }`} style={{
            backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }} />

          <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Bio Narrative */}
            <div className="lg:col-span-6 space-y-5">
              <h3 className={`text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2 ${
                darkMode ? 'text-white' : 'text-slate-900'
              }`}>
                <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">Latar Belakang Unik:</span>
                <span>Korporat + Developer</span>
              </h3>
              
              <p className={`text-sm sm:text-base leading-relaxed ${
                darkMode ? 'text-slate-300' : 'text-slate-600'
              }`}>
                Sebelum terjun serius sebagai developer, saya menghabiskan 7+ tahun berkarier di lingkungan korporat — mulai dari operasional lini depan hingga peran yang menuntut ketelitian tinggi terhadap data. Pengalaman ini membentuk cara kerja saya: disiplin, sistematis, dan selalu berorientasi pada hasil yang bisa dipertanggungjawabkan.
              </p>
              
              <p className={`text-sm sm:text-base leading-relaxed ${
                darkMode ? 'text-slate-300' : 'text-slate-600'
              }`}>
                Nilai-nilai itu yang saya bawa ketika beralih membangun{' '}
                <strong className={`font-semibold ${darkMode ? 'text-teal-400' : 'text-teal-600'}`}>aplikasi web, mobile, dan game</strong>{' '}
                secara mandiri — dari riset kebutuhan, desain UI/UX, coding, hingga rilis ke pengguna nyata.
              </p>

              <div className="pt-3 flex flex-wrap gap-2.5">
                {['Kode Rapi & Terstruktur', 'Komunikasi Responsif', 'Orientasi Solusi'].map((tag, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                      darkMode
                        ? 'text-teal-300 bg-teal-950/40 border-teal-800/50 hover:bg-teal-900/40'
                        : 'text-teal-700 bg-teal-50 border-teal-200 hover:bg-teal-100/50'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-teal-500" />
                    <span>{tag}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Core Pillars 2x2 */}
            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {corePillars.map((pillar, idx) => {
                const Icon = pillar.icon;
                return (
                  <div
                    key={idx}
                    className={`group p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1 ${
                      darkMode
                        ? 'bg-slate-800/50 border-slate-700/50 hover:border-teal-500/40 hover:bg-slate-800/80'
                        : 'bg-slate-50/80 border-slate-200 hover:border-teal-300 hover:bg-white hover:shadow-md'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110 ${
                      darkMode 
                        ? 'bg-teal-500/15 text-teal-400' 
                        : 'bg-teal-100 text-teal-600'
                    }`}>
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <h4 className={`text-sm font-bold mb-1.5 ${
                      darkMode ? 'text-white' : 'text-slate-900'
                    }`}>
                      {pillar.title}
                    </h4>
                    <p className={`text-xs leading-relaxed ${
                      darkMode ? 'text-slate-400' : 'text-slate-500'
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
        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
          {JASA_STATS.map((stat, i) => (
            <div
              key={i}
              className={`group relative p-5 text-center rounded-2xl border transition-all duration-300 hover:-translate-y-1 ${
                darkMode 
                  ? 'bg-slate-900/60 backdrop-blur-sm border-slate-800 hover:border-teal-500/40' 
                  : 'bg-white/70 backdrop-blur-sm border-slate-200 hover:border-teal-400/50 hover:shadow-lg'
              }`}
            >
              <p className={`text-3xl sm:text-4xl font-black mb-1 bg-clip-text text-transparent bg-gradient-to-br ${
                darkMode 
                  ? 'from-teal-300 to-cyan-400' 
                  : 'from-teal-600 to-emerald-500'
              }`}>
                <CountUp value={stat.value} />
              </p>
              <p className={`text-xs font-bold uppercase tracking-wide mb-1 ${
                darkMode ? 'text-slate-200' : 'text-slate-800'
              }`}>
                {stat.label}
              </p>
              <p className={`text-[11px] leading-snug ${
                darkMode ? 'text-slate-500' : 'text-slate-500'
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