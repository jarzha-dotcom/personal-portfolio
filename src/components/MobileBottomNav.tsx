import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Home,
  FolderOpen,
  Code2,
  Send,
  MoreHorizontal,
  User,
  Wrench,
  BadgeCheck,
  Newspaper,
  LayoutGrid,
  Bot,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useRegisterModal } from '../context/NavigationHistoryContext';
import { ROUTES } from '../routes';

export interface BottomNavItem {
  name: string;
  href: string;
  id: string;
  /** true = halaman terpisah (pindah rute); false/undefined = anchor di beranda */
  route?: boolean;
  /** true = halaman statis di luar SPA (pindah halaman penuh) */
  external?: boolean;
}

interface MobileBottomNavProps {
  darkMode: boolean;
  isHome: boolean;
  pathname: string;
  /** id section aktif dari scroll-spy Navbar */
  activeSection: string;
  /** link Artikel hanya tampil kalau ada artikel terbit (sama seperti navbar desktop) */
  hasArticles: boolean;
  /** href final (sudah menyesuaikan rute aktif & tema) — dari Navbar */
  itemHref: (item: BottomNavItem) => string;
  /** handler klik yang sama dengan navbar desktop (scroll halus / pindah rute) */
  onItemClick: (e: React.MouseEvent<HTMLAnchorElement>, item: BottomNavItem) => void;
}

// 4 slot utama + 1 slot "Lainnya" (tombol yang membuka sheet).
const SLOTS: { item: BottomNavItem; icon: LucideIcon }[] = [
  { item: { name: 'Beranda', href: '#beranda', id: 'beranda' }, icon: Home },
  { item: { name: 'Karya', href: '#proyek', id: 'proyek' }, icon: FolderOpen },
  { item: { name: 'Layanan', href: '#layanan', id: 'layanan' }, icon: Code2 },
  { item: { name: 'Kontak', href: '#kontak', id: 'kontak' }, icon: Send },
];

const MORE_ITEMS: { item: BottomNavItem; icon: LucideIcon; desc: string; needsArticles?: boolean }[] = [
  { item: { name: 'Tentang', href: '#tentang', id: 'tentang' }, icon: User, desc: 'Latar belakang & cara kerja' },
  { item: { name: 'Keahlian', href: '#keahlian', id: 'keahlian' }, icon: Wrench, desc: 'Tech stack yang dikuasai' },
  { item: { name: 'Hasil Kerja', href: ROUTES.caseStudy, id: 'hasil-kerja', route: true }, icon: BadgeCheck, desc: 'Studi kasus klien nyata' },
  { item: { name: 'Artikel', href: ROUTES.articles, id: 'artikel', route: true }, icon: Newspaper, desc: 'Tulisan & panduan', needsArticles: true },
  { item: { name: 'Contoh Desain', href: '/demos/index.html', id: 'contoh-desain', external: true }, icon: LayoutGrid, desc: 'Galeri demo interaktif' },
];

const FIELD_SELECTOR =
  'input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]):not([type=range]),textarea,select,[contenteditable=""],[contenteditable="true"]';

/**
 * Navbar bawah khusus mobile (< md). Desain "dock" melayang dengan indikator aktif
 * yang bergeser mengikuti scroll-spy, tersembunyi saat scroll turun / saat mengetik.
 *
 * SEO: semua tujuan adalah <a href> asli dan SELALU ada di DOM (sheet "Lainnya"
 * disembunyikan lewat CSS + inert, bukan di-unmount), jadi crawler mobile-first
 * tetap melihat seluruh tautan navigasi.
 */
export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  darkMode,
  isHome,
  pathname,
  activeSection,
  hasArticles,
  itemHref,
  onItemClick,
}) => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [scrolledAway, setScrolledAway] = useState(false);
  const [typing, setTyping] = useState(false);

  const sheetRef = useRef<HTMLDivElement>(null);
  const moreBtnRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);
  const lastY = useRef(0);

  const closeSheet = useCallback(() => setSheetOpen(false), []);

  // Tombol kembali browser menutup sheet (pola yang sama dengan modal lain di app ini)
  useRegisterModal('mobile-more-sheet', sheetOpen, closeSheet);
  useFocusTrap(sheetRef, sheetOpen);

  // Tutup saat pindah rute
  useEffect(() => {
    setSheetOpen(false);
  }, [pathname]);

  // Escape menutup sheet + kunci scroll latar selama terbuka
  useEffect(() => {
    if (!sheetOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSheetOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.documentElement.style.overflow = prevOverflow;
    };
  }, [sheetOpen]);

  // Kembalikan fokus ke tombol "Lainnya" setelah sheet tertutup
  useEffect(() => {
    if (wasOpenRef.current && !sheetOpen) moreBtnRef.current?.focus({ preventScroll: true });
    wasOpenRef.current = sheetOpen;
  }, [sheetOpen]);

  // Sembunyi saat scroll turun, muncul saat scroll naik / dekat dasar halaman
  useEffect(() => {
    lastY.current = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - lastY.current;
        if (Math.abs(delta) > 6) {
          setScrolledAway(delta > 0 && y > 120);
          lastY.current = y;
        }
        const nearBottom = window.innerHeight + y >= document.documentElement.scrollHeight - 80;
        if (nearBottom) setScrolledAway(false);
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Sembunyi saat form sedang diisi — di HP keyboard sering membuat bar fixed menutupi input
  useEffect(() => {
    let timer: number | undefined;
    const onFocusIn = (e: FocusEvent) => {
      if (e.target instanceof HTMLElement && e.target.matches(FIELD_SELECTOR)) {
        window.clearTimeout(timer);
        setTyping(true);
      }
    };
    const onFocusOut = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setTyping(false), 150);
    };
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, []);

  const visible = sheetOpen || (!scrolledAway && !typing);

  // Beri tahu elemen melayang lain (tombol chat, back-to-top) supaya turun saat bar bersembunyi
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('bnav-hidden', !visible);
    return () => root.classList.remove('bnav-hidden');
  }, [visible]);

  // --- Status aktif ---
  const slotActive = (id: string) =>
    id === 'proyek'
      ? (isHome && activeSection === 'proyek') || pathname === ROUTES.caseStudy
      : isHome && activeSection === id;
  const moreActive =
    (isHome && (activeSection === 'tentang' || activeSection === 'keahlian')) ||
    pathname === ROUTES.articles ||
    pathname.startsWith(`${ROUTES.articles}/`);

  const activeFlags = [...SLOTS.map((s) => slotActive(s.item.id)), moreActive || sheetOpen];
  const activeIndex = activeFlags.indexOf(true);

  const moreItems = MORE_ITEMS.filter((m) => !m.needsArticles || hasArticles);
  const isMoreItemActive = (item: BottomNavItem) =>
    item.external ? false : item.route ? pathname === item.href : isHome && activeSection === item.id;

  const theme = darkMode ? 'is-dark' : '';

  const handleSlotClick = (e: React.MouseEvent<HTMLAnchorElement>, item: BottomNavItem, active: boolean) => {
    // Ketuk slot yang sedang aktif = kembali ke atas bagian itu (pola umum tab bar)
    if (active && item.id === 'beranda') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    onItemClick(e, item);
  };

  const handleMoreClick = (e: React.MouseEvent<HTMLAnchorElement>, item: BottomNavItem) => {
    setSheetOpen(false);
    onItemClick(e, item);
  };

  const askZannah = () => {
    setSheetOpen(false);
    window.dispatchEvent(new Event('open-zannah-chat'));
  };

  return (
    <>
      <nav
        aria-label="Navigasi utama (mobile)"
        className={`bnav no-print ${visible ? '' : 'is-hidden'}`}
        style={{ '--bnav-i': Math.max(activeIndex, 0) } as React.CSSProperties}
      >
        <div className={`bnav-dock ${theme}`}>
          <span aria-hidden="true" className="bnav-ind" data-on={activeIndex >= 0} />
          <ul className="bnav-list">
            {SLOTS.map(({ item, icon: Icon }, i) => {
              const active = activeFlags[i];
              return (
                <li key={item.id}>
                  <a
                    href={itemHref(item)}
                    onClick={(e) => handleSlotClick(e, item, active)}
                    aria-current={active ? 'page' : undefined}
                    data-active={active}
                    className="bnav-item"
                  >
                    <span className="bnav-ico">
                      <Icon key={active ? 'on' : 'off'} className={active ? 'mo-pop' : ''} aria-hidden="true" strokeWidth={active ? 2.4 : 2} />
                    </span>
                    <span>{item.name}</span>
                  </a>
                </li>
              );
            })}
            <li>
              <button
                ref={moreBtnRef}
                id="bnav-more-btn"
                type="button"
                onClick={() => setSheetOpen((o) => !o)}
                aria-haspopup="dialog"
                aria-expanded={sheetOpen}
                aria-controls="bnav-more-sheet"
                data-active={moreActive || sheetOpen}
                className="bnav-item"
              >
                <span className="bnav-ico">
                  <MoreHorizontal aria-hidden="true" strokeWidth={moreActive || sheetOpen ? 2.4 : 2} />
                </span>
                <span>Lainnya</span>
              </button>
            </li>
          </ul>
        </div>
      </nav>

      <div className="bnav-scrim" data-open={sheetOpen} onClick={closeSheet} aria-hidden="true" />

      {/* Selalu ada di DOM (SEO) — tersembunyi lewat CSS + inert saat tertutup */}
      <div
        ref={sheetRef}
        id="bnav-more-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Menu lainnya"
        aria-hidden={!sheetOpen}
        inert={!sheetOpen}
        className={`bnav-sheet no-print ${sheetOpen ? 'is-open' : ''} ${theme}`}
      >
        <div className="bnav-handle" aria-hidden="true" />
        <div className="bnav-title">
          <span>Menu lainnya</span>
          <button type="button" className="bnav-close" onClick={closeSheet} aria-label="Tutup menu">
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <ul className="bnav-grid">
          {moreItems.map(({ item, icon: Icon, desc }, i) => (
            <li
              key={item.id}
              className={moreItems.length % 2 === 1 && i === moreItems.length - 1 ? 'span-2' : ''}
              style={{ '--i': i } as React.CSSProperties}
            >
              <a
                href={itemHref(item)}
                onClick={(e) => handleMoreClick(e, item)}
                aria-current={isMoreItemActive(item) ? 'page' : undefined}
                data-active={isMoreItemActive(item)}
                className="bnav-tile"
              >
                <span className="t-ico">
                  <Icon className="w-[18px] h-[18px]" aria-hidden="true" />
                </span>
                <span>
                  <span className="t-name">{item.name}</span>
                  <span className="t-desc">{desc}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>

        <button type="button" className="bnav-cta" onClick={askZannah}>
          <Bot className="w-4 h-4" aria-hidden="true" />
          <span>Tanya Zannah (AI)</span>
        </button>
      </div>
    </>
  );
};
