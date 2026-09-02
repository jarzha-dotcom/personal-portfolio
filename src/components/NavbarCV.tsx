import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, Sun, Moon, Printer, LogOut } from 'lucide-react';
import { PERSONAL_INFO } from '../data/portfolioData';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface NavbarCVProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onExit: () => void;
  onPrint: () => void;
}

// CVPage adalah overlay fixed dengan scroll-nya sendiri (id="cv-easter-egg-page"),
// jadi navigasi di sini harus scroll di dalam container itu, bukan window.
const scrollCvTo = (id: string) => {
  const container = document.getElementById('cv-easter-egg-page');
  const target = document.getElementById(id);
  if (container && target) {
    const offset = 72;
    const top = target.offsetTop - offset;
    container.scrollTo({ top, behavior: 'smooth' });
  }
};

export const NavbarCV: React.FC<NavbarCVProps> = ({ darkMode, setDarkMode, onExit, onPrint }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('cv-beranda');
  const drawerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(drawerRef, mobileMenuOpen);

  const navLinks = [
    { name: 'Beranda', id: 'cv-beranda' },
    { name: 'Profil', id: 'cv-tentang' },
    { name: 'Pengalaman', id: 'cv-pengalaman' },
    { name: 'Keahlian', id: 'cv-keahlian' },
    { name: 'Kontak', id: 'cv-kontak' },
  ];

  useEffect(() => {
    const container = document.getElementById('cv-easter-egg-page');
    if (!container) return;

    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        setIsScrolled(container.scrollTop > 30);

        const sections = navLinks.map((link) => document.getElementById(link.id));
        const scrollPosition = container.scrollTop + 140;

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

    container.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Escape menutup drawer mobile (bukan menutup Mode CV — itu ditangani CVPage)
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const handleNavClick = (id: string) => {
    setMobileMenuOpen(false);
    scrollCvTo(id);
  };

  return (
    <header
      id="cv-navbar"
      className={`sticky top-0 z-30 transition-all duration-200 no-print ${isScrolled
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
          {/* Brand */}
          <button
            onClick={() => handleNavClick('cv-beranda')}
            className="flex items-center gap-2.5 group focus:outline-none"
          >
            <div className="w-9 h-9 bg-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-base shadow-sm group-hover:bg-teal-700 transition-colors">
              {PERSONAL_INFO.initials}
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`font-bold text-lg tracking-tight transition-colors ${darkMode ? 'text-white group-hover:text-teal-400' : 'text-slate-800 group-hover:text-teal-600'
                }`}>
                {PERSONAL_INFO.nickname}
              </span>
              <span className="hidden sm:inline-block text-[11px] text-amber-500 font-semibold uppercase tracking-wider">
                Mode CV
              </span>
            </div>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {navLinks.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`text-xs uppercase tracking-wider font-semibold transition-colors ${isActive
                    ? 'text-teal-600 dark:text-teal-400'
                    : darkMode
                      ? 'text-slate-400 hover:text-white'
                      : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  {link.name}
                </button>
              );
            })}
          </nav>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-2.5">
            <button
              onClick={() => setDarkMode(!darkMode)}
              aria-label="Ganti mode gelap/terang"
              className={`p-2 rounded-lg transition-colors ${darkMode
                ? 'bg-slate-900 text-amber-300 hover:bg-slate-800 border border-slate-800'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
            >
              {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onPrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Unduh</span>
            </button>
            <button
              onClick={onExit}
              aria-label="Kembali ke halaman jasa"
              className={`p-2 rounded-lg border transition-colors ${darkMode
                ? 'border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                : 'border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              aria-label="Ganti mode gelap/terang"
              className={`p-2 rounded-lg ${darkMode ? 'bg-slate-900 text-amber-300 border border-slate-800' : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu navigasi"
              aria-expanded={mobileMenuOpen}
              aria-controls="cv-mobile-nav-drawer"
              className={`p-2 rounded-lg ${darkMode ? 'bg-slate-900 text-slate-200 border border-slate-800' : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          id="cv-mobile-nav-drawer"
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menu navigasi Mode CV"
          className={`md:hidden px-4 pt-2 pb-6 border-b animate-in fade-in slide-in-from-top-4 duration-200 outline-none ${darkMode
            ? 'bg-slate-900/98 border-slate-800 text-white'
            : 'bg-white/98 border-slate-200 text-slate-900 shadow-xl'
            }`}
        >
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`px-4 py-3 rounded-lg text-base font-medium flex items-center justify-between text-left ${isActive
                    ? darkMode ? 'bg-teal-500/20 text-teal-400 font-semibold' : 'bg-teal-50 text-teal-700 font-semibold'
                    : darkMode ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                >
                  <span>{link.name}</span>
                  {isActive && <span className="w-2 h-2 rounded-full bg-teal-500"></span>}
                </button>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
            <button
              onClick={onPrint}
              className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Unduh CV</span>
            </button>
            <button
              onClick={onExit}
              className={`w-full py-2.5 px-4 rounded-lg text-sm font-semibold border flex items-center justify-center gap-2 ${darkMode ? 'border-slate-700 text-slate-200' : 'border-slate-300 text-slate-700'
                }`}
            >
              <LogOut className="w-4 h-4" />
              <span>Tutup Mode CV</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
