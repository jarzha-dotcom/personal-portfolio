import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useNavigationHistory } from '../context/NavigationHistoryContext';
import { ROUTES } from '../routes';

interface PageIntroProps {
  darkMode: boolean;
  /** <h1> halaman — samakan dengan H1 di scripts/prerender.ts */
  h1: string;
  subtitle: string;
  /** Label breadcrumb terakhir (halaman ini) */
  breadcrumb: string;
}

/** Kepala halaman per-tab: breadcrumb + H1 + subjudul. */
export const PageIntro: React.FC<PageIntroProps> = ({ darkMode, h1, subtitle, breadcrumb }) => {
  const { navigate } = useNavigationHistory();

  const goHome = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    navigate(ROUTES.home);
  };

  return (
    <header className={`pt-24 pb-6 md:pt-28 md:pb-8 transition-colors duration-200 ${darkMode ? 'bg-slate-950' : 'bg-white'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" style={{ '--i': 0 } as React.CSSProperties} className="mo-rise mb-3">
          <ol className={`flex items-center gap-1.5 text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            <li>
              <a
                href={ROUTES.home}
                onClick={goHome}
                className={`rounded px-1 py-0.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${darkMode ? 'hover:text-teal-300' : 'hover:text-teal-700'}`}
              >
                Beranda
              </a>
            </li>
            <li aria-hidden="true"><ChevronRight className="w-3 h-3" /></li>
            <li aria-current="page" className={`font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{breadcrumb}</li>
          </ol>
        </nav>
        <h1
          style={{ '--i': 1 } as React.CSSProperties}
          className={`mo-rise text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight max-w-4xl bg-clip-text text-transparent bg-gradient-to-r ${darkMode ? 'from-white via-teal-200 to-teal-400' : 'from-slate-900 via-teal-700 to-teal-500'}`}
        >
          {h1}
        </h1>
        <p
          style={{ '--i': 2 } as React.CSSProperties}
          className={`mo-rise mt-3 text-sm sm:text-base leading-relaxed max-w-3xl ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}
        >
          {subtitle}
        </p>
      </div>
    </header>
  );
};
