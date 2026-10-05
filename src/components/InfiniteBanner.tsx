import React, { useId, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { LayoutGrid, Mail, MessageCircle, type LucideIcon } from 'lucide-react';
import { ARTICLES } from '../data/articles';
import { CONTACT_INFO } from '../data/portfolioData';
import { useNavigationHistory } from '../context/NavigationHistoryContext';
import { articleRoute } from '../routes';
import { getArticleIcon } from './ArticleIllustration';

interface InfiniteBannerProps {
  darkMode: boolean;
  articleCount?: number;
  /** Tinggi navbar (px) — dipakai untuk offset sticky. Sesuaikan dengan Navbar aktual. */
  navbarHeight?: number;
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
  navbarHeight = 72,
}) => {
  const { navigate } = useNavigationHistory();
  const reactId = useId().replace(/[:]/g, '');

  const wrapperRef = useRef<HTMLDivElement>(null);
  const bannerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const [isPinned, setIsPinned] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [bannerHeight, setBannerHeight] = useState(0);
  const [spotlight, setSpotlight] = useState({ x: 0, y: 0, active: false });
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const lastScrollY = useRef(0);

  // Deteksi touch device — spotlight tidak berguna di touch (tidak ada hover)
  useEffect(() => {
    setIsTouchDevice(window.matchMedia('(pointer: coarse)').matches);
  }, []);

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
    // Galeri demo = halaman statis di luar SPA (public/demos/), jadi pakai
    // <a> biasa + tab baru, bukan navigate(). Di mobile ini menggantikan
    // DemoShowcaseNudge yang sengaja desktop-only.
    {
      kind: 'contact',
      label: 'Lihat Galeri Contoh Desain',
      href: '/demos/',
      Icon: LayoutGrid,
      external: true,
    },
    ...latestArticles.map((a) => ({
      kind: 'article' as const,
      label: a.title,
      href: articleRoute(a.slug),
      Icon: getArticleIcon(a.slug, a.category),
    })),
  ];

  const track = [...items, ...items];

  // --- Measure banner height untuk height compensation saat pinned ---
  useLayoutEffect(() => {
    const measure = () => {
      if (bannerRef.current) {
        setBannerHeight(bannerRef.current.offsetHeight);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // --- Sticky detection via IntersectionObserver pada sentinel ---
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const pinned = !entry.isIntersecting;
        setIsPinned(pinned);
        if (!pinned) setIsHidden(false); // reset hide state saat tidak pinned
      },
      { threshold: 0, rootMargin: `-${navbarHeight + 1}px 0px 0px 0px` }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [navbarHeight]);

  // --- Scroll direction detection (hide on down, reveal on up) ---
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        setIsPinned((pinned) => {
          if (!pinned) {
            setIsHidden(false);
            return pinned;
          }
          const delta = y - lastScrollY.current;
          if (Math.abs(delta) > 5) {
            setIsHidden(delta > 0 && y > navbarHeight + 100);
          }
          lastScrollY.current = y;
          return pinned;
        });
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [navbarHeight]);

  const goToArticle = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    navigate(href);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isTouchDevice) return;
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;
    setSpotlight({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: true,
    });
  };

  const renderItem = (item: BannerItem, key: string) => {
    const pillClass = `
      inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full whitespace-nowrap
      text-xs sm:text-[13px] font-medium transition-all duration-300 ease-out
      hover:scale-[1.04] hover:-translate-y-0.5 cursor-pointer
      focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/60 focus-visible:ring-offset-2
      ${
        darkMode
          ? 'text-slate-300 bg-slate-800/40 hover:bg-slate-800/90 hover:text-white hover:shadow-[0_0_0_1px_rgba(45,212,191,0.3),0_8px_24px_-8px_rgba(45,212,191,0.25)] focus-visible:ring-offset-slate-900'
          : 'text-slate-600 bg-white/50 hover:bg-white hover:text-slate-900 hover:shadow-[0_0_0_1px_rgba(13,148,136,0.2),0_8px_24px_-8px_rgba(13,148,136,0.2)] focus-visible:ring-offset-white'
      }
    `;

    const iconWrapperClass = `
      flex items-center justify-center w-6 h-6 rounded-full shrink-0
      ${darkMode ? 'bg-teal-500/15 text-teal-300' : 'bg-teal-500/15 text-teal-700'}
      transition-colors group-hover:bg-teal-500/25
    `;

    if (item.kind === 'contact') {
      return (
        <a
          key={key}
          href={item.href}
          {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className={`group ${pillClass}`}
        >
          {item.dot && (
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 ring-2 ring-emerald-500/30" />
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
        className={`group ${pillClass}`}
      >
        <span className={iconWrapperClass}>
          <item.Icon className="w-3.5 h-3.5" aria-hidden="true" strokeWidth={2.5} />
        </span>
        <span>{item.label}</span>
      </a>
    );
  };

  return (
    <>
      {/* Sentinel: elemen tak terlihat untuk IntersectionObserver.
          Saat sentinel keluar viewport (di atas navbar), banner jadi sticky. */}
      <div ref={sentinelRef} aria-hidden className="h-0 w-full pointer-events-none" />

      {/* Wrapper dengan tinggi tetap saat pinned — mencegah konten di bawahnya "lompat" */}
      <div
        ref={wrapperRef}
        style={{ height: isPinned ? bannerHeight : 'auto' }}
        aria-label="Quick access banner"
      >
        <div
          ref={bannerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setSpotlight((s) => ({ ...s, active: false }))}
          style={{
            position: isPinned ? 'fixed' : 'relative',
            top: isPinned ? navbarHeight : undefined,
            left: 0,
            right: 0,
            zIndex: 30, // di bawah navbar (z-40/50), di atas konten
            transform: isHidden ? 'translateY(-110%)' : 'translateY(0)',
            transition: 'transform 350ms cubic-bezier(0.4, 0, 0.2, 1)',
            ['--spotlight-x' as any]: `${spotlight.x}px`,
            ['--spotlight-y' as any]: `${spotlight.y}px`,
          }}
          className={`
            kaj-banner-${reactId}
            relative w-full overflow-hidden
            ${isPinned ? 'py-2 shadow-lg shadow-black/5' : 'py-3'}
            ${
              darkMode
                ? 'bg-slate-900/80 border-y border-slate-700/50'
                : 'bg-white/80 border-y border-slate-200/60'
            }
            backdrop-blur-xl transition-[padding,background] duration-300
          `}
        >
          {/* Animated gradient border — garis atas & bawah yang "mengalir" */}
          <div
            aria-hidden
            className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-[length:200%_100%] ${
              darkMode
                ? 'bg-[linear-gradient(90deg,transparent,rgba(45,212,191,0.6),transparent)]'
                : 'bg-[linear-gradient(90deg,transparent,rgba(13,148,136,0.5),transparent)]'
            }`}
            style={{ animation: `kaj-border-flow-${reactId} 6s linear infinite` }}
          />
          <div
            aria-hidden
            className={`pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[length:200%_100%] ${
              darkMode
                ? 'bg-[linear-gradient(90deg,transparent,rgba(45,212,191,0.6),transparent)]'
                : 'bg-[linear-gradient(90deg,transparent,rgba(13,148,136,0.5),transparent)]'
            }`}
            style={{ animation: `kaj-border-flow-${reactId} 6s linear infinite reverse` }}
          />

          {/* Cursor spotlight overlay (disabled di touch device) */}
          {!isTouchDevice && spotlight.active && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 transition-opacity duration-300"
              style={{
                background: `radial-gradient(300px circle at var(--spotlight-x) var(--spotlight-y), ${
                  darkMode ? 'rgba(45,212,191,0.08)' : 'rgba(13,148,136,0.06)'
                }, transparent 60%)`,
              }}
            />
          )}

          {/* Shimmer sweep — cahaya lewat sesekali */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background: `linear-gradient(110deg, transparent 30%, ${
                darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.5)'
              } 50%, transparent 70%)`,
              backgroundSize: '200% 100%',
              animation: `kaj-shimmer-${reactId} 8s ease-in-out infinite`,
            }}
          />

          {/* Track marquee */}
          <div
            className={`relative flex w-max items-center gap-2 kaj-marquee-${reactId}`}
            style={{
              maskImage:
                'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
              WebkitMaskImage:
                'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
            }}
          >
            {track.map((item, i) => (
              <React.Fragment key={i}>
                {renderItem(item, `${i}`)}
                <span
                  className={`select-none text-[10px] ${
                    darkMode ? 'text-slate-600' : 'text-slate-300'
                  }`}
                  aria-hidden="true"
                  style={{
                    animation: `kaj-sparkle-${reactId} 3s ease-in-out infinite`,
                    animationDelay: `${(i % 5) * 0.3}s`,
                  }}
                >
                  ✦
                </span>
              </React.Fragment>
            ))}
          </div>

          {/* LIVE badge — pojok kiri atas saat pinned */}
          {isPinned && (
            <div
              className={`absolute left-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider ${
                darkMode
                  ? 'bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/30'
                  : 'bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/30'
              }`}
              aria-hidden
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              LIVE
            </div>
          )}
        </div>
      </div>

      <style>{`
        .kaj-marquee-${reactId} {
          animation: kaj-marquee-scroll-${reactId} 45s linear infinite;
        }
        .kaj-banner-${reactId}:hover .kaj-marquee-${reactId} {
          animation-play-state: paused;
        }
        @keyframes kaj-marquee-scroll-${reactId} {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes kaj-border-flow-${reactId} {
          from { background-position: 0% 0; }
          to { background-position: 200% 0; }
        }
        @keyframes kaj-shimmer-${reactId} {
          0%, 100% { background-position: 200% 0; }
          50% { background-position: -100% 0; }
        }
        @keyframes kaj-sparkle-${reactId} {
          0%, 100% { opacity: 0.3; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .kaj-marquee-${reactId} { animation: none; }
          .kaj-banner-${reactId} [style*="animation"] { animation: none !important; }
        }
      `}</style>
    </>
  );
};