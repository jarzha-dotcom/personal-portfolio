import React from 'react';
import { HelpCircle } from 'lucide-react';
import { FAQ_ITEMS } from '../data/seoContent';
import { InView } from './InView';

interface FaqSectionProps {
  darkMode: boolean;
}

/**
 * FAQ lengkap — SEMUA pertanyaan tampil terbuka (bukan accordion tertutup) karena
 * JSON-LD FAQPage di halaman ini mewajibkan isinya terlihat. Sumber teks yang sama
 * dengan JSON-LD yang ditulis scripts/prerender.ts (data/seoContent.ts).
 */
export const FaqSection: React.FC<FaqSectionProps> = ({ darkMode }) => (
  <section
    id="faq"
    aria-labelledby="faq-heading"
    className={`py-12 md:py-16 transition-colors duration-200 ${darkMode ? 'bg-slate-900/60' : 'bg-slate-50'}`}
  >
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-8">
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode ? 'text-teal-400 bg-teal-950/60 border border-teal-800' : 'text-teal-600 bg-teal-50 border border-teal-200'}`}>
          <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
          <span>FAQ</span>
        </div>
        <h2 id="faq-heading" className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Pertanyaan yang Sering Diajukan (FAQ)
        </h2>
      </div>

      <InView className="grid gap-3">
        {FAQ_ITEMS.map((item, i) => (
          <div
            key={item.q}
            style={{ '--i': i } as React.CSSProperties}
            className={`mo-item p-4 sm:p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}
          >
            <h3 className={`text-sm sm:text-base font-bold mb-1.5 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{item.q}</h3>
            <p className={`text-xs sm:text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{item.a}</p>
          </div>
        ))}
      </InView>
    </div>
  </section>
);
