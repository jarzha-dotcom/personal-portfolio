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

  // wa.me butuh format digit murni (tanpa '+', spasi, atau strip).
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

  // Track dirender dua kali berurutan (bukan cuma sekali) supaya animasi
  // translateX(-50%) bisa loop mulus tanpa "patah" di titik sambungan.
  const track = [...items, ...items];

  const goToArticle = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    navigate(href);
  };

  const renderItem = (item: BannerItem, key: string) => {
    const pillClass = `inline-flex items-center gap-2 whitespace-nowrap text-xs sm:text-[13px] font-medium transition-colors hover:text-teal-500 ${
      darkMode ? 'text-slate-300' : 'text-slate-600'
    }`;

    if (item.kind === 'contact') {
      return (
        <a
          key={key}
          href={item.href}
          {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className={pillClass}
        >
          {item.dot && (
            <span className="relative inline-flex w-2 h-2 shrink-0">
              <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />
              <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-500" />
            </span>
          )}
          <item.Icon
            className="w-3.5 h-3.5 shrink-0 text-teal-500"
            aria-hidden="true"
            strokeWidth={2}
          />
          {item.label}
        </a>
      );
    }

    // Artikel — internal route, pakai navigate() supaya tidak full page reload.
    return (
      <a
        key={key}
        href={item.href}
        onClick={(e) => goToArticle(e, item.href)}
        className={pillClass}
      >
        <item.Icon
          className="w-3.5 h-3.5 shrink-0 text-teal-500"
          aria-hidden="true"
          strokeWidth={2}
        />
        {item.label}
      </a>
    );
  };

  return (
    <div
      className={`relative w-full overflow-hidden border-y py-2.5 group kaj-marquee-${reactId}-wrapper ${
        darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
      }`}
      style={{
        maskImage:
          'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
        WebkitMaskImage:
          'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
      }}
    >
      <div className={`flex w-max items-center gap-6 kaj-marquee-${reactId}`}>
        {track.map((item, i) => (
          <React.Fragment key={i}>
            {renderItem(item, `${i}`)}
            <span
              className={`select-none ${darkMode ? 'text-slate-700' : 'text-slate-300'}`}
              aria-hidden="true"
            >
              •
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* Keyframes + pause-on-hover + prefers-reduced-motion di-scope ke instance
          ini lewat className unik (reactId), supaya aman dipakai berkali-kali
          di halaman yang sama tanpa bentrok. */}
      <style>{`
        .kaj-marquee-${reactId} {
          animation: kaj-marquee-scroll-${reactId} 50s linear infinite;
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