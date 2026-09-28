import React, { useId } from 'react';
import { Mail, MessageCircle, type LucideIcon } from 'lucide-react';
import { ARTICLES } from '../data/articles';
import { CONTACT_INFO } from '../data/portfolioData';
import { useNavigationHistory } from '../context/NavigationHistoryContext';
import { articleRoute } from '../routes';
import { getArticleIcon } from './ArticleIllustration';

interface InfiniteBannerProps {
  darkMode: boolean;
  /** Berapa artikel terbaru yang ikut ditampilkan. Default 6. */
  articleCount?: number;
}

type BannerItem =
  | {
      kind: 'contact';
      label: string;
      href: string;
      Icon: LucideIcon;
      dot?: boolean;
      external?: boolean;
    }
  | { kind: 'article'; label: string; href: string; Icon: LucideIcon };

export const InfiniteBanner: React.FC<InfiniteBannerProps> = ({
  darkMode,
  articleCount = 6,
}) => {
  const { navigate } = useNavigationHistory();
  const reactId = useId().replace(/[:]/g, '');
  
  const latestArticles = ARTICLES.filter((a) => a.published).slice(0, articleCount);
  const whatsappDigits = CONTACT_INFO.phone.replace(/\D/g, '');

  const items: BannerItem[] = [
    {
      kind: 'contact',
      label: CONTACT_INFO.availableForWork
        ? 'Tersedia untuk Proyek Baru — Chat WhatsApp'
        : 'Chat via WhatsApp',
      href: `https://wa.me/${whatsappDigits}`,
      Icon: MessageCircle,
      dot: CONTACT_INFO.availableForWork,
      external: true,
    },
    {
      kind: 'contact',
      label: CONTACT_INFO.email,
      href: `mailto:${CONTACT_INFO.email}`,
      Icon: Mail,
    },
    ...latestArticles.map((a) => ({
      kind: 'article' as const,
      label: a.title,
      href: articleRoute(a.slug),
      Icon: getArticleIcon(a.slug, a.category),
    })),
  ];

  // Track dirender dua kali berurutan supaya animasi loop mulus
  const track = [...items, ...items];

  const goToArticle = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    navigate(href);
  };

  const renderItem = (item: BannerItem, key: string) => {
    // ✨ Pill class dengan efek glassmorphism & micro-interaction saat hover
    const pillClass = `
      inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full whitespace-nowrap 
      text-xs sm:text-[13px] font-medium transition-all duration-300 ease-out
      hover:scale-105 hover:-translate-y-0.5 cursor-pointer
      ${darkMode 
        ? 'text-slate-300 hover:bg-slate-800/80 hover:text-white hover:shadow-lg hover:shadow-teal-500/10' 
        : 'text-slate-600 hover:bg-white/80 hover:text-slate-900 hover:shadow-md hover:shadow-slate-200/50'}
    `;

    // ✨ Wrapper ikon berbentuk lingkaran (badge) agar lebih menonjol
    const iconWrapperClass = `
      flex items-center justify-center w-6 h-6 rounded-full shrink-0
      ${darkMode ? 'bg-teal-500/10 text-teal-400' : 'bg-teal-500/10 text-teal-600'}
      transition-colors
    `;

    if (item.kind === 'contact') {
      return (
        <a
          key={key}
          href={item.href}
          {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className={pillClass}
        >
          {/* ✨ Indikator "Available" yang lebih premium dengan ring */}
          {item.dot && (
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 ring-2 ring-emerald-500/20"></span>
            </span>
          )}
          <span className={iconWrapperClass}>
            <item.Icon className="w-3.5 h-3.5" aria-hidden="true" strokeWidth={2.5} />
          </span>
          <span>{item.label}</span>
        </a>
      );
    }

    return (
      <a
        key={key}
        href={item.href}
        onClick={(e) => goToArticle(e, item.href)}
        className={pillClass}
      >
        <span className={iconWrapperClass}>
          <item.Icon className="w-3.5 h-3.5" aria-hidden="true" strokeWidth={2.5} />
        </span>
        <span>{item.label}</span>
      </a>
    );
  };

  return (
    <div
      className={`
        relative w-full overflow-hidden border-y py-3 
        group kaj-marquee-${reactId}-wrapper
        ${darkMode 
          ? 'bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 border-slate-700/50' 
          : 'bg-gradient-to-r from-white/90 via-slate-50/90 to-white/90 border-slate-200/50'}
        backdrop-blur-md
      `}
      style={{
        // Fade edge yang lebih halus untuk efek infinite yang seamless
        maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
        WebkitMaskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
      }}
    >
      <div className={`flex w-max items-center gap-2 kaj-marquee-${reactId}`}>
        {track.map((item, i) => (
          <React.Fragment key={i}>
            {renderItem(item, `${i}`)}
            {/* ✨ Separator berbentuk sparkle (✦) untuk kesan lebih elegan */}
            <span 
              className={`select-none text-[10px] ${darkMode ? 'text-slate-600' : 'text-slate-300'}`} 
              aria-hidden="true"
            >
              ✦
            </span>
          </React.Fragment>
        ))}
      </div>

      <style>{`
        .kaj-marquee-${reactId} {
          animation: kaj-marquee-scroll-${reactId} 45s linear infinite;
        }
        .group:hover .kaj-marquee-${reactId} {
          animation-play-state: paused;
        }
        @keyframes kaj-marquee-scroll-${reactId} {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .kaj-marquee-${reactId} {
            animation: none;
          }
          .kaj-marquee-${reactId}-wrapper {
            overflow-x: auto !important;
          }
        }
      `}</style>
    </div>
  );
};