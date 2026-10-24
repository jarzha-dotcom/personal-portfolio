import React from 'react';
import { ArrowRight, Sparkles, Tag, MessageCircle, Mail, FolderOpen } from 'lucide-react';
import { CONTACT_INFO, PROJECTS } from '../data/portfolioData';
import { HOME_SERVICES } from '../data/seoContent';
import { useNavigationHistory } from '../context/NavigationHistoryContext';
import { ROUTES } from '../routes';
import { InView } from './InView';

interface TeaserProps {
  darkMode: boolean;
}

const FOCUS_RING =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent';

/** Pindah rute lewat SPA (tanpa reload), tapi tetap <a href> asli untuk crawler & buka-di-tab-baru. */
const useGo = () => {
  const { navigate } = useNavigationHistory();
  return (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    navigate(path);
  };
};

const waUrl = (text: string) =>
  `https://wa.me/${CONTACT_INFO.phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;

/* ------------------------------------------------------------------ */
/* Karya unggulan — 3 proyek; semuanya ada di /hasil-kerja              */
/* ------------------------------------------------------------------ */
export const FeaturedProjectsTeaser: React.FC<TeaserProps> = ({ darkMode }) => {
  const go = useGo();
  // Proyek unggulan dulu, lalu proyek lain sampai genap 3.
  const featured = [...PROJECTS]
    .sort((a, b) => Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured)))
    .slice(0, 3);

  return (
    <section
      id="proyek"
      aria-labelledby="proyek-teaser-heading"
      className={`py-12 md:py-16 transition-colors duration-200 ${darkMode ? 'bg-slate-950' : 'bg-slate-50'}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2 border ${darkMode ? 'text-teal-300 bg-teal-950/60 border-teal-700/50' : 'text-teal-700 bg-teal-50 border-teal-200'}`}>
            <FolderOpen className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Karya Unggulan</span>
          </div>
          <h2 id="proyek-teaser-heading" className={`text-2xl sm:text-3xl font-extrabold tracking-tight mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Proyek yang Sudah Live & Dipakai
          </h2>
          <p className={`text-xs sm:text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            Tiga contoh pilihan. Portofolio lengkap, demo interaktif, dan studi kasus klien ada di halaman Hasil Kerja.
          </p>
        </div>

        <InView className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {featured.map((p, i) => {
            const motionClass = i === 0 ? 'mo-slide-l' : i === 1 ? 'mo-scale' : 'mo-slide-r';
            return (
              <a
                key={p.id}
                href={ROUTES.caseStudy}
                onClick={(e) => go(e, ROUTES.caseStudy)}
                style={{ '--i': i } as React.CSSProperties}
                className={`${motionClass} group p-5 rounded-2xl border flex flex-col transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg ${FOCUS_RING} ${darkMode ? 'bg-slate-900 border-slate-700 hover:border-teal-500/40' : 'bg-white border-slate-200 shadow-sm hover:border-teal-400/60 hover:shadow-md'}`}
              >
              <span className={`self-start text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-3 ${darkMode ? 'text-teal-300 bg-teal-500/10 border border-teal-500/20' : 'text-teal-700 bg-teal-50 border border-teal-200'}`}>
                {p.category}
              </span>
              <h3 className={`text-base font-bold mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{p.title}</h3>
              <p className={`text-xs sm:text-sm leading-relaxed mb-4 line-clamp-3 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{p.tagline}</p>
              <div className="mt-auto flex flex-wrap gap-1.5">
                {p.techStack.slice(0, 3).map((t) => (
                  <span key={t} className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${darkMode ? 'text-slate-300 bg-slate-800 border-slate-700' : 'text-slate-600 bg-slate-100 border-slate-200'}`}>{t}</span>
                ))}
              </div>
            </a>
            );
          })}
        </InView>

        <div className="mt-8 flex justify-center">
          <a
            href={ROUTES.caseStudy}
            onClick={(e) => go(e, ROUTES.caseStudy)}
            className={`group inline-flex items-center justify-center gap-2 px-6 py-3.5 sm:py-3 rounded-xl border text-sm font-bold active:scale-95 transition-all ${FOCUS_RING} ${darkMode ? 'border-teal-700/70 text-teal-300 bg-teal-950/40 hover:bg-teal-900/50' : 'border-teal-300 text-teal-800 bg-teal-50/80 hover:bg-teal-100'}`}
          >
            Lihat Semua Karya & Studi Kasus
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* Layanan — ringkas (6 paket + harga); detail & FAQ di /layanan        */
/* ------------------------------------------------------------------ */
export const ServicesTeaser: React.FC<TeaserProps> = ({ darkMode }) => {
  const go = useGo();
  return (
    <section
      id="layanan"
      aria-labelledby="layanan-teaser-heading"
      className={`py-12 md:py-16 transition-colors duration-200 ${darkMode ? 'bg-slate-900/60' : 'bg-white'}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode ? 'text-teal-400 bg-teal-950/60 border border-teal-800' : 'text-teal-600 bg-teal-50 border border-teal-200'}`}>
            <Tag className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Layanan & Harga</span>
          </div>
          <h2 id="layanan-teaser-heading" className={`text-2xl sm:text-3xl font-extrabold tracking-tight mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Layanan & Estimasi Biaya Pengerjaan
          </h2>
          <p className={`text-xs sm:text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            Estimasi awal — harga final ditentukan setelah diskusi kebutuhan. Konsultasi awal selalu gratis.
          </p>
        </div>

        <InView className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {HOME_SERVICES.map((s, i) => (
            <div
              key={s.name}
              style={{ '--i': i } as React.CSSProperties}
              className={`mo-item p-4 sm:p-5 rounded-2xl border transition-all duration-200 hover:-translate-y-1 ${darkMode ? 'bg-slate-900 border-slate-700 hover:border-teal-500/40' : 'bg-slate-50 border-slate-200 hover:border-teal-400/60 hover:shadow-md'}`}
            >
              <h3 className={`text-sm font-bold leading-snug mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{s.name}</h3>
              <p className={`text-lg font-black mb-1 ${darkMode ? 'text-teal-300' : 'text-teal-700'}`}>{s.priceLabel}</p>
              <p className={`text-[11px] font-semibold mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{s.duration}</p>
              <p className={`text-xs leading-relaxed line-clamp-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{s.details}</p>
            </div>
          ))}
        </InView>

        <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
          <a
            href={ROUTES.services}
            onClick={(e) => go(e, ROUTES.services)}
            className={`group inline-flex items-center justify-center gap-2 px-6 py-3.5 sm:py-3 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-sm font-bold shadow-lg shadow-teal-600/20 transition-all ${FOCUS_RING}`}
          >
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            Lihat Semua Layanan, Alur Kerja & FAQ
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* Kontak — ajakan singkat; form lengkap di /kontak                     */
/* ------------------------------------------------------------------ */
export const ContactCTA: React.FC<TeaserProps> = ({ darkMode }) => {
  const go = useGo();
  return (
    <section
      id="kontak"
      aria-labelledby="kontak-teaser-heading"
      className={`py-12 md:py-16 transition-colors duration-200 ${darkMode ? 'bg-slate-950' : 'bg-slate-50'}`}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl p-6 sm:p-10 text-center bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950 border border-slate-800 shadow-xl">
          <div aria-hidden="true" className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-teal-500/15 blur-2xl pointer-events-none" />
          <h2 id="kontak-teaser-heading" className="relative text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
            Punya ide proyek? Konsultasi awal gratis.
          </h2>
          <p className="relative text-sm text-slate-300 max-w-xl mx-auto mb-6">
            Ceritakan kebutuhan website, aplikasi mobile, game, atau AI chatbot Anda — saya balas dengan estimasi biaya dan langkah selanjutnya.
          </p>
          <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
            <a
              href={waUrl('Halo Mas Arzha, saya ingin berdiskusi soal proyek development...')}
              target="_blank"
              rel="noreferrer"
              className={`inline-flex items-center justify-center gap-2 px-6 py-3.5 sm:py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 text-sm font-bold transition-all ${FOCUS_RING}`}
            >
              <MessageCircle className="w-4 h-4" aria-hidden="true" />
              Chat via WhatsApp
            </a>
            <a
              href={ROUTES.contact}
              onClick={(e) => go(e, ROUTES.contact)}
              className={`inline-flex items-center justify-center gap-2 px-6 py-3.5 sm:py-3 rounded-xl border border-slate-600 hover:bg-slate-800 active:scale-95 text-slate-100 text-sm font-semibold transition-all ${FOCUS_RING}`}
            >
              <Mail className="w-4 h-4" aria-hidden="true" />
              Form & Kontak Lengkap
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
