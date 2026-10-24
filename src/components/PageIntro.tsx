import React from 'react';
import { Breadcrumb } from './Breadcrumb';

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
  return (
    <header className={`pt-24 pb-6 md:pt-28 md:pb-8 transition-colors duration-200 ${darkMode ? 'bg-slate-950' : 'bg-white'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumb
          darkMode={darkMode}
          current={breadcrumb}
          style={{ '--i': 0 } as React.CSSProperties}
          className="mo-rise mb-3"
        />
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
