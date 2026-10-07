import React, { useEffect, useRef, useState } from 'react';
import {
  Menu,
  X,
  Sun,
  Moon,
  Send,
  ChevronDown
} from 'lucide-react';
import { PERSONAL_INFO } from '../data/portfolioData';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { useRegisterModal, useNavigationHistory } from '../context/NavigationHistoryContext';
import { ROUTES } from '../routes';
import { useLocation } from 'react-router-dom';
import { ARTICLES } from '../data/articles';

interface NavbarProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onEasterEgg: () => void;
}

interface NavItem {
  name: string;
  href: string;
  id: string;
  // true = halaman terpisah (pindah rute), false/undefined = anchor di beranda
  route?: boolean;
  // true = halaman statis di luar aplikasi React ini (pindah halaman penuh di tab yang sama)
  external?: boolean;
}

interface NavGroup {
  id: string;
  name: string;
  children: NavItem[];
}

type NavEntry = NavItem | NavGroup;
const isGroup = (e: NavEntry): e is NavGroup => 'children' in e;

const NAV_ITEMS: NavItem[] = [
  { name: 'Beranda', href: '#beranda', id: 'beranda' },
  { name: 'Tentang', href: '#tentang', id: 'tentang' },
  { name: 'Portofolio', href: '#proyek', id: 'proyek' },
  { name: 'Layanan', href: '#layanan', id: 'layanan' },
  { name: 'Hasil Kerja', href: ROUTES.caseStudy, id: 'hasil-kerja', route: true },
  { name: 'Artikel', href: ROUTES.articles, id: 'artikel', route: true },
  { name: 'Keahlian', href: '#keahlian', id: 'keahlian' },
  { name: 'Kontak', href: '#kontak', id: 'kontak' },
];

// Hanya anchor beranda yang ikut scroll-spy; index-nya harus sejajar dengan
// sectionElementsRef di bawah.
const navLinks = NAV_ITEMS.filter((l) => !l.route);

// Link "Artikel" baru tampil kalau minimal satu artikel sudah dipublikasikan
// — supaya tidak ada link ke halaman yang isinya kosong.
const hasPublishedArticles = ARTICLES.some((a) => a.published);

// Halaman galeri contoh desain (statis, di public/demos)
const DESIGN_GALLERY_URL = '/demos/index.html';

// Grup dropdown "Karya": menggabungkan Portofolio, Hasil Kerja, dan Contoh Desain
const KARYA_GROUP: NavGroup = {
  id: 'karya',
  name: 'Karya',
  children: [
    { name: 'Proyek', href: '#proyek', id: 'proyek' },
    { name: 'Hasil Kerja', href: ROUTES.caseStudy, id: 'hasil-kerja', route: true },
    { name: 'Contoh Desain', href: DESIGN_GALLERY_URL, id: 'contoh-desain', external: true },
  ],
};

// Urutan tampil di navbar: grup Karya menggantikan posisi "Portofolio",
// sedangkan "Hasil Kerja" masuk ke dalam grup. Scroll-spy tetap memakai navLinks.
const NAV_ENTRIES: NavEntry[] = NAV_ITEMS.flatMap((item): NavEntry[] => {
  if (item.id === 'proyek') return [KARYA_GROUP];
  if (item.id === 'hasil-kerja') return [];
  if (item.id === 'artikel' && !hasPublishedArticles) return [];
  return [item];
});

// Class helper dipakai berulang di semua tombol/link interaktif supaya
// keyboard user (Tab) selalu dapat indikasi fokus yang jelas — sebelumnya
// cuma mengandalkan outline default browser (atau malah `focus:outline-none`
// tanpa pengganti, seperti di logo).
const FOCUS_RING =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent';

export const Navbar: React.FC<NavbarProps> = ({ darkMode, setDarkMode, onEasterEgg }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('beranda');
  const [karyaOpen, setKaryaOpen] = useState(false);
  const karyaRef = useRef<HTMLDivElement>(null);
  const karyaBtnRef = useRef<HTMLButtonElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const location = useLocation();
  const pathname = location.pathname;
  const { navigate } = useNavigationHistory();
  // Path tak dikenal ikut menampilkan beranda (sama seperti App.tsx)
  const isHome = pathname !== ROUTES.caseStudy && pathname !== ROUTES.articles && !pathname.startsWith(`${ROUTES.articles}/`);

  // Hubungkan tombol kembali browser agar menutup menu navigasi mobile
  useRegisterModal('mobile-nav-drawer', mobileMenuOpen, () => setMobileMenuOpen(false));

  // Menyimpan timestamp klik logo untuk deteksi easter egg
  const logoClickTimestamps = useRef<number[]>([]);
  const drawerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(drawerRef, mobileMenuOpen);

  // Ref ke tombol hamburger, dipakai untuk mengembalikan fokus ke situ
  // setelah drawer ditutup lewat cara SELAIN klik tombol itu sendiri
  // (Escape, klik link di dalam drawer) — lihat effect di bawah.
  const mobileMenuBtnRef = useRef<HTMLButtonElement>(null);
  const wasMenuOpenRef = useRef(false);

  useEffect(() => {
    if (wasMenuOpenRef.current && !mobileMenuOpen) {
      // Drawer baru saja tertutup (transisi true -> false). Tanpa ini,
      // fokus keyboard/screen-reader "hilang jejak" balik ke awal <body>
      // alih-alih kembali logis ke tombol yang membuka drawer tadi.
      mobileMenuBtnRef.current?.focus();
    }
    wasMenuOpenRef.current = mobileMenuOpen;
  }, [mobileMenuOpen]);

  // Cache elemen section sekali di mount — sebelumnya di-query ulang lewat
  // `document.getElementById` di SETIAP tick scroll (lewat requestAnimationFrame),
  // padahal elemen-elemen ini statis dan tidak pernah berpindah identity.
  const sectionElementsRef = useRef<(HTMLElement | null)[]>([]);
  useEffect(() => {
    sectionElementsRef.current = navLinks.map((link) => document.getElementById(link.id));
    // Section beranda di-unmount saat pindah ke halaman lain; cache harus
    // diambil ulang tiap rute berganti.
  }, [pathname]);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        setIsScrolled(window.scrollY > 30);

        // Active section calculation — pakai cache, bukan query DOM lagi
        const sections = sectionElementsRef.current;
        const scrollPosition = window.scrollY + 140;

        for (let i = sections.length - 1; i >= 0; i--) {
          const section = sections[i];
          if (section && section.offsetTop <= scrollPosition) {
            setActiveSection(navLinks[i].id);
            break;
          }
        }
        ticking = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Escape menutup drawer mobile
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // Dropdown Karya: tutup saat klik di luar, Escape, atau pindah rute
  useEffect(() => {
    if (!karyaOpen) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (karyaRef.current && !karyaRef.current.contains(e.target as Node)) {
        setKaryaOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setKaryaOpen(false);
        karyaBtnRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [karyaOpen]);

  useEffect(() => {
    setKaryaOpen(false);
  }, [pathname]);

  // Di halaman lain, anchor beranda diarahkan ke '/#anchor'
  const anchorHref = (href: string) => (isHome ? href : `/${href}`);

  const goToRoute = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    setMobileMenuOpen(false);
    if (pathname === path) {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      return;
    }
    navigate(path);
  };

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    if (!isHome) {
      navigate(`/${href}`);
      return;
    }
    const target = document.querySelector(href);
    if (target) {
      const navOffset = 80;
      const elementPosition = target.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
      });
    }
  };

  const isItemActive = (l: NavItem) =>
    l.external ? false : l.route ? pathname === l.href : isHome && activeSection === l.id;

  // Link eksternal membawa tema aktif supaya galeri tampil senada (terang/gelap)
  const itemHref = (l: NavItem) =>
    l.external
      ? `${l.href}?theme=${darkMode ? 'dark' : 'light'}`
      : l.route
        ? l.href
        : anchorHref(l.href);

  const handleItemClick = (e: React.MouseEvent<HTMLAnchorElement>, l: NavItem) => {
    setKaryaOpen(false);
    if (l.external) {
      setMobileMenuOpen(false);
      return; // biarkan browser pindah halaman di tab yang sama
    }
    if (l.route) goToRoute(e, l.href);
    else scrollToSection(e, l.href);
  };

  // Easter egg: klik logo 5x dalam rentang 2.5 detik akan membuka Mode CV
  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    scrollToSection(e, '#beranda');

    const now = Date.now();
    const recentClicks = [...logoClickTimestamps.current, now].filter(
      (t) => now - t < 2500
    );
    logoClickTimestamps.current = recentClicks;

    if (recentClicks.length >= 5) {
      logoClickTimestamps.current = [];
      onEasterEgg();
    }
  };

  return (
    <header
      id="main-navbar"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${isScrolled
        ? darkMode
          ? 'bg-slate-950/95 backdrop-blur-md border-b border-slate-800 shadow-sm'
          : 'bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs'
        : darkMode
          ? 'bg-slate-950/80 backdrop-blur-xs border-b border-slate-900'
          : 'bg-white/80 backdrop-blur-xs border-b border-slate-100'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo — juga jadi trigger easter egg (klik 5x) */}
          <a
            href="#beranda"
            onClick={handleLogoClick}
            className={`flex items-center gap-2.5 group select-none rounded-lg ${FOCUS_RING}`}
            id="nav-logo-link"
          >
            <img
              src="/icons/icon-512.png"
              alt={PERSONAL_INFO.nickname}
              className="w-9 h-9 rounded-lg object-cover shadow-sm"
            />
            <div className="flex items-baseline gap-2">
              <span className={`font-bold text-lg tracking-tight transition-colors ${darkMode ? 'text-white group-hover:text-teal-400' : 'text-slate-800 group-hover:text-teal-600'
                }`}>
                {PERSONAL_INFO.nickname}
              </span>
              <span className="hidden sm:inline-block text-[11px] text-teal-600 dark:text-teal-400 font-semibold uppercase tracking-wider">
                Dev & Digital Services
              </span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-4 lg:gap-6 text-sm font-medium">
            {NAV_ENTRIES.map((entry) => {
              const linkTone = (active: boolean) =>
                active
                  ? 'text-teal-600 dark:text-teal-400'
                  : darkMode
                    ? 'text-slate-400 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900';

              if (isGroup(entry)) {
                const groupActive = entry.children.some(isItemActive);
                return (
                  <div key={entry.id} ref={karyaRef} className="relative">
                    <button
                      ref={karyaBtnRef}
                      id={`nav-link-${entry.id}`}
                      type="button"
                      aria-expanded={karyaOpen}
                      aria-controls="nav-karya-menu"
                      onClick={() => setKaryaOpen((o) => !o)}
                      className={`inline-flex items-center gap-1 text-xs uppercase tracking-wider font-semibold transition-colors rounded-md px-0.5 ${FOCUS_RING} ${linkTone(groupActive || karyaOpen)}`}
                    >
                      {entry.name}
                      <ChevronDown
                        className={`w-3 h-3 transition-transform ${karyaOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {karyaOpen && (
                      <div
                        id="nav-karya-menu"
                        className={`absolute left-0 top-full mt-3 w-56 rounded-xl border p-1.5 shadow-xl ${darkMode
                            ? 'bg-slate-900 border-slate-800 shadow-black/40'
                            : 'bg-white border-slate-200 shadow-slate-200/80'
                          }`}
                      >
                        {entry.children.map((child) => {
                          const active = isItemActive(child);
                          return (
                            <a
                              key={child.id}
                              href={itemHref(child)}
                              aria-current={active ? 'page' : undefined}
                              onClick={(e) => handleItemClick(e, child)}
                              className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium normal-case tracking-normal ${FOCUS_RING} ${active
                                  ? darkMode
                                    ? 'bg-teal-500/20 text-teal-400'
                                    : 'bg-teal-50 text-teal-700'
                                  : darkMode
                                    ? 'text-slate-200 hover:bg-slate-800'
                                    : 'text-slate-700 hover:bg-slate-100'
                                }`}
                            >
                              <span>{child.name}</span>
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              const isActive = isItemActive(entry);
              return (
                <a
                  key={entry.id}
                  id={`nav-link-${entry.id}`}
                  href={itemHref(entry)}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={(e) => handleItemClick(e, entry)}
                  className={`text-xs uppercase tracking-wider font-semibold transition-colors rounded-md px-0.5 ${FOCUS_RING} ${linkTone(isActive)}`}
                >
                  {entry.name}
                </a>
              );
            })}
          </nav>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Dark Mode Toggle */}
            <button
              id="theme-toggle-desktop"
              onClick={() => setDarkMode(!darkMode)}
              aria-label={darkMode ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'}
              className={`p-2 rounded-lg transition-colors ${FOCUS_RING} ${darkMode
                ? 'bg-slate-900 text-amber-300 hover:bg-slate-800 border border-slate-800'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
            >
              {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Mobile Actions: Dark Mode & Hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              id="theme-toggle-mobile"
              onClick={() => setDarkMode(!darkMode)}
              aria-label="Ganti mode gelap/terang"
              className={`p-2 rounded-lg ${FOCUS_RING} ${darkMode ? 'bg-slate-900 text-amber-300 border border-slate-800' : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              id="mobile-menu-btn"
              ref={mobileMenuBtnRef}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu navigasi"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav-drawer"
              className={`p-2 rounded-lg ${FOCUS_RING} ${darkMode ? 'bg-slate-900 text-slate-200 border border-slate-800' : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div
          id="mobile-nav-drawer"
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menu navigasi"
          className={`md:hidden px-4 pt-2 pb-6 border-b transition-all outline-none ${prefersReducedMotion ? '' : 'animate-in fade-in slide-in-from-top-4 duration-200'
            } ${darkMode
              ? 'bg-slate-900/98 border-slate-800 text-white'
              : 'bg-white/98 border-slate-200 text-slate-900 shadow-xl'
            }`}
        >
          <div className="flex flex-col space-y-1">
            {NAV_ENTRIES.map((entry) => {
              const drawerLink = (link: NavItem, nested: boolean) => {
                const isActive = isItemActive(link);
                return (
                  <a
                    key={link.id}
                    href={itemHref(link)}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={(e) => handleItemClick(e, link)}
                    className={`${nested ? 'pl-8 pr-4' : 'px-4'} py-3 rounded-lg text-base font-medium flex items-center justify-between ${FOCUS_RING} ${isActive
                      ? darkMode
                        ? 'bg-teal-500/20 text-teal-400 font-semibold'
                        : 'bg-teal-50 text-teal-700 font-semibold'
                      : darkMode
                        ? 'text-slate-200 hover:bg-slate-800'
                        : 'text-slate-700 hover:bg-slate-100'
                      }`}
                  >
                    <span>{link.name}</span>
                    {isActive && <span className="w-2 h-2 rounded-full bg-teal-500"></span>}
                  </a>
                );
              };

              if (isGroup(entry)) {
                return (
                  <div key={entry.id} className="pt-1">
                    <p className={`px-4 pt-2 pb-1 text-xs font-semibold ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                      {entry.name}
                    </p>
                    {entry.children.map((child) => drawerLink(child, true))}
                  </div>
                );
              }
              return drawerLink(entry, false);
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
            <a
              href="#kontak"
              onClick={(e) => scrollToSection(e, '#kontak')}
              className={`w-full py-2.5 px-4 rounded-lg text-sm font-semibold bg-gradient-to-r from-teal-600 to-indigo-600 text-white flex items-center justify-center gap-2 shadow-md ${FOCUS_RING}`}
            >
              <Send className="w-4 h-4" />
              <span>Hubungi Saya Sekarang</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
};