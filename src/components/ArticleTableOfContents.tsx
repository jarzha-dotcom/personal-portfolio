import React, { useEffect, useState } from 'react';
import { AlignLeft, ChevronDown, ListOrdered } from 'lucide-react';
import { type ArticleBlock } from '../data/articles';

export interface TocItem {
  id: string;
  title: string;
  index: number;
}

interface ArticleTableOfContentsProps {
  blocks: ArticleBlock[];
  darkMode: boolean;
  className?: string;
  isMobile?: boolean;
}

export const getHeadingId = (heading: string, index: number): string => {
  const clean = heading
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  return `section-${index}-${clean || 'heading'}`;
};

export const ArticleTableOfContents: React.FC<ArticleTableOfContentsProps> = ({
  blocks,
  darkMode,
  className = '',
  isMobile = false,
}) => {
  const [activeId, setActiveId] = useState<string>('');
  const [isOpenMobile, setIsOpenMobile] = useState<boolean>(false);

  // Kumpulkan item heading dari blocks
  const items: TocItem[] = blocks
    .map((b, idx) => ({
      id: getHeadingId(b.heading || '', idx),
      title: b.heading || '',
      index: idx,
    }))
    .filter((item) => Boolean(item.title));

  useEffect(() => {
    if (items.length === 0) return;

    // Scrollspy menggunakan IntersectionObserver
    const observer = new IntersectionObserver(
      (entries) => {
        // Ambil elemen yang sedang intersecting di bagian atas viewport
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) {
          setActiveId(visible.target.id);
        }
      },
      {
        rootMargin: '-80px 0px -60% 0px',
        threshold: 0,
      }
    );

    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  if (items.length < 2) {
    // Kalau cuma ada 0 atau 1 heading, tidak perlu menampilkan daftar isi
    return null;
  }

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -90; // offset navbar
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActiveId(id);
      if (isMobile) setIsOpenMobile(false);
    }
  };

  // Versi Mobile: Collapsible Card yang ringkas
  if (isMobile) {
    return (
      <div
        className={`my-6 rounded-xl border transition-all ${
          darkMode
            ? 'bg-slate-900/80 border-slate-800'
            : 'bg-slate-50/90 border-slate-200'
        } ${className}`}
      >
        <button
          type="button"
          onClick={() => setIsOpenMobile((prev) => !prev)}
          className="w-full flex items-center justify-between p-3.5 text-left font-semibold text-xs sm:text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded-xl"
          aria-expanded={isOpenMobile}
        >
          <span className="flex items-center gap-2">
            <ListOrdered className={`w-4 h-4 ${darkMode ? 'text-teal-400' : 'text-teal-600'}`} />
            <span>Daftar Isi ({items.length} Bagian)</span>
          </span>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              isOpenMobile ? 'rotate-180 text-teal-500' : 'text-slate-400'
            }`}
          />
        </button>

        {isOpenMobile && (
          <nav aria-label="Daftar isi artikel mobile" className="px-4 pb-4 pt-1 border-t border-dashed border-slate-700/40">
            <ol className="space-y-2 mt-2 text-xs leading-relaxed">
              {items.map((item, idx) => {
                const isActive = activeId === item.id;
                return (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      onClick={(e) => handleScrollTo(e, item.id)}
                      className={`flex items-start gap-2 py-1 transition-colors ${
                        isActive
                          ? darkMode
                            ? 'text-teal-300 font-semibold'
                            : 'text-teal-700 font-semibold'
                          : darkMode
                          ? 'text-slate-400 hover:text-slate-200'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span className="opacity-60 text-[11px] font-mono">{idx + 1}.</span>
                      <span className="flex-1">{item.title}</span>
                    </a>
                  </li>
                );
              })}
            </ol>
          </nav>
        )}
      </div>
    );
  }

  // Versi Desktop: Sticky Sidebar TOC
  return (
    <nav
      aria-label="Daftar isi artikel"
      className={`rounded-2xl border p-5 mb-8 backdrop-blur-sm transition-colors ${
        darkMode
          ? 'bg-slate-900/60 border-slate-800'
          : 'bg-white/80 border-slate-200 shadow-sm'
      } ${className}`}
    >
      <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
        <AlignLeft className={`w-4 h-4 ${darkMode ? 'text-teal-400' : 'text-teal-600'}`} />
        <h3
          className={`text-xs font-bold uppercase tracking-wider ${
            darkMode ? 'text-slate-300' : 'text-slate-700'
          }`}
        >
          Daftar Isi
        </h3>
      </div>

      <ol className="space-y-2.5 text-xs sm:text-[13px] leading-snug">
        {items.map((item, idx) => {
          const isActive = activeId === item.id;
          return (
            <li key={item.id} className="relative">
              <a
                href={`#${item.id}`}
                onClick={(e) => handleScrollTo(e, item.id)}
                className={`group flex items-start gap-2.5 py-1 px-2 rounded-lg transition-all ${
                  isActive
                    ? darkMode
                      ? 'bg-teal-500/10 text-teal-300 font-medium pl-3 border-l-2 border-teal-400'
                      : 'bg-teal-50 text-teal-800 font-medium pl-3 border-l-2 border-teal-600'
                    : darkMode
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                }`}
              >
                <span
                  className={`text-[11px] font-mono transition-colors ${
                    isActive
                      ? darkMode
                        ? 'text-teal-300'
                        : 'text-teal-700'
                      : 'opacity-50'
                  }`}
                >
                  {(idx + 1).toString().padStart(2, '0')}
                </span>
                <span className="flex-1 line-clamp-2">{item.title}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
