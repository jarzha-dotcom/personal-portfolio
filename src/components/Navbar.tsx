import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  X,
  Sun,
  Moon,
  Send
} from 'lucide-react';
import { PERSONAL_INFO } from '../data/portfolioData';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface NavbarProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onEasterEgg: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ darkMode, setDarkMode, onEasterEgg }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('beranda');

  // Menyimpan timestamp klik logo untuk deteksi easter egg
  const logoClickTimestamps = useRef<number[]>([]);
  const drawerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(drawerRef, mobileMenuOpen);

  const navLinks = [
    { name: 'Beranda', href: '#beranda', id: 'beranda' },
    { name: 'Tentang', href: '#tentang', id: 'tentang' },
    { name: 'Pengalaman', href: '#pengalaman', id: 'pengalaman' },
    { name: 'Layanan', href: '#layanan', id: 'layanan' },
    { name: 'Keahlian', href: '#keahlian', id: 'keahlian' },
    { name: 'Kontak', href: '#kontak', id: 'kontak' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 30) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      // Active section calculation
      const sections = navLinks.map(link => document.getElementById(link.id));
      const scrollPosition = window.scrollY + 140;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(navLinks[i].id);
          break;
        }
      }
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

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const target = document.querySelector(href);
    if (target) {
      const navOffset = 80;
      const elementPosition = target.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
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
            className="flex items-center gap-2.5 group focus:outline-none select-none"
            id="nav-logo-link"
          >
            <div className="w-9 h-9 bg-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-base shadow-sm group-hover:bg-teal-700 transition-colors">
              {PERSONAL_INFO.initials}
            </div>
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
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {navLinks.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <a
                  key={link.id}
                  id={`nav-link-${link.id}`}
                  href={link.href}
                  onClick={(e) => scrollToSection(e, link.href)}
                  className={`text-xs uppercase tracking-wider font-semibold transition-colors ${isActive
                    ? 'text-teal-600 dark:text-teal-400'
                    : darkMode
                      ? 'text-slate-400 hover:text-white'
                      : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  {link.name}
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
              className={`p-2 rounded-lg transition-colors focus:outline-none ${darkMode
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
              className={`p-2 rounded-lg ${darkMode ? 'bg-slate-900 text-amber-300 border border-slate-800' : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              id="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu navigasi"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav-drawer"
              className={`p-2 rounded-lg ${darkMode ? 'bg-slate-900 text-slate-200 border border-slate-800' : 'bg-slate-100 text-slate-700 border border-slate-200'
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
          className={`md:hidden px-4 pt-2 pb-6 border-b transition-all animate-in fade-in slide-in-from-top-4 duration-200 outline-none ${darkMode
            ? 'bg-slate-900/98 border-slate-800 text-white'
            : 'bg-white/98 border-slate-200 text-slate-900 shadow-xl'
            }`}
        >
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <a
                  key={link.id}
                  href={link.href}
                  onClick={(e) => scrollToSection(e, link.href)}
                  className={`px-4 py-3 rounded-lg text-base font-medium flex items-center justify-between ${isActive
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
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
            <a
              href="#kontak"
              onClick={(e) => scrollToSection(e, '#kontak')}
              className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold bg-gradient-to-r from-teal-600 to-indigo-600 text-white flex items-center justify-center gap-2 shadow-md"
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
