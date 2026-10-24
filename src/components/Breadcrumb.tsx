import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useNavigationHistory } from '../context/NavigationHistoryContext';
import { ROUTES } from '../routes';

export interface BreadcrumbItem {
  name: string;
  href?: string;
}

interface BreadcrumbProps {
  darkMode: boolean;
  /** Label halaman saat ini (item terakhir) untuk pola default Beranda › current */
  current?: string;
  /** Daftar item breadcrumb kustom jika ada hierarki bertingkat */
  items?: BreadcrumbItem[];
  className?: string;
  style?: React.CSSProperties;
}

/** Breadcrumb terpadu — dipakai semua halaman non-beranda supaya tampilannya seragam dan konsisten. */
export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  darkMode,
  current,
  items,
  className = '',
  style,
}) => {
  const { navigate } = useNavigationHistory();

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    if (href.startsWith('http')) return; // Tautan eksternal biarkan default
    e.preventDefault();
    navigate(href);
  };

  const breadcrumbs: BreadcrumbItem[] = items && items.length > 0
    ? items
    : [
        { name: 'Beranda', href: ROUTES.home },
        { name: current || '' },
      ];

  return (
    <nav aria-label="Breadcrumb" style={style} className={className}>
      <ol className={`flex flex-wrap items-center gap-1.5 text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;
          return (
            <React.Fragment key={`${item.name}-${index}`}>
              {index > 0 && (
                <li aria-hidden="true" className="opacity-60 flex-shrink-0">
                  <ChevronRight className="w-3 h-3" />
                </li>
              )}
              {isLast || !item.href ? (
                <li
                  aria-current="page"
                  className={`font-semibold truncate max-w-[200px] sm:max-w-xs ${
                    darkMode ? 'text-slate-200' : 'text-slate-700'
                  }`}
                >
                  {item.name}
                </li>
              ) : (
                <li>
                  <a
                    href={item.href}
                    onClick={(e) => handleLinkClick(e, item.href!)}
                    className={`rounded px-1 py-0.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                      darkMode ? 'hover:text-teal-300' : 'hover:text-teal-700'
                    }`}
                  >
                    {item.name}
                  </a>
                </li>
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
};
