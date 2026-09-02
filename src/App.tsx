import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { About } from './components/About';
import { Projects } from './components/Projects';
import { Services } from './components/Services';
import { Skills } from './components/Skills';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';
import { EasterEggToast } from './components/EasterEggToast';
import { Reveal } from './components/Reveal';
import { ArrowUp, MessageCircle } from 'lucide-react';
import { CONTACT_INFO } from './data/portfolioData';

// Lazy-loaded: keduanya tidak perlu masuk bundle awal. ChatWidget baru
// benar-benar dipakai kalau tombolnya diklik, dan CVPage (berat — isinya
// 9 komponen: NavbarCV, HeroCV, AboutCV, Experience, SkillsCV, ContactCV,
// FooterCV, ChatWidgetCV, CVDocumentModal) cuma dipakai kalau easter egg
// (klik logo 5x) ditemukan — mayoritas pengunjung nggak pernah ke sana.
const ChatWidget = lazy(() =>
  import('./components/ChatWidget').then((m) => ({ default: m.ChatWidget }))
);
const CVPage = lazy(() =>
  import('./components/CVPage').then((m) => ({ default: m.CVPage }))
);

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) return savedTheme === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [showBackToTop, setShowBackToTop] = useState(false);

  // Easter egg: mode CV lengkap, dibuka lewat klik logo 5x di Navbar
  const [cvEggUnlocked, setCvEggUnlocked] = useState(false);
  const [showUnlockToast, setShowUnlockToast] = useState(false);

  const handleEasterEgg = () => {
    setCvEggUnlocked(true);
    setShowUnlockToast(true);
  };

  useEffect(() => {
    if (!showUnlockToast) return;
    const timeout = setTimeout(() => setShowUnlockToast(false), 1800);
    return () => clearTimeout(timeout);
  }, [showUnlockToast]);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        setShowBackToTop(window.scrollY > 400);
        ticking = false;
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Hint buat yang suka buka console — bagian dari easter egg
  useEffect(() => {
    console.log(
      '%c👋 Suka ngoprek ya?',
      'font-size:16px;font-weight:bold;color:#0d9488;'
    );
    console.log(
      '%cCoba klik logo di navbar 5x cepat-cepat...',
      'font-size:12px;color:#64748b;'
    );
  }, []);

  // Kunci scroll body waktu mode CV sedang terbuka
  useEffect(() => {
    document.body.style.overflow = cvEggUnlocked ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [cvEggUnlocked]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cleanPhone = CONTACT_INFO.phone.replace(/[^0-9]/g, '');

  return (
    // id="app-root" dipakai oleh print CSS di CVPage.tsx untuk menyembunyikan
    // seluruh konten halaman jasa saat mode CV di-print — jangan dihapus.
    <div
      id="app-root"
      className={`min-h-screen font-sans transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-900'
        }`}
    >
      {/* Fixed Navigation Bar */}
      <Navbar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onEasterEgg={handleEasterEgg}
      />

      {/* Main Sections Content — fokus penuh ke jasa development.
          Catatan: Experience (rekam jejak kerja) sengaja TIDAK ditampilkan
          di sini karena terlalu "CV-oriented" untuk halaman jasa. Komponen
          Experience sekarang eksklusif dipakai di dalam CVPage. */}
      <main id="main-content">
        <Hero darkMode={darkMode} />
        <Reveal><About darkMode={darkMode} /></Reveal>
        <Reveal><Projects darkMode={darkMode} /></Reveal>
        <Reveal><Services darkMode={darkMode} /></Reveal>
        <Reveal><Skills darkMode={darkMode} /></Reveal>
        <Reveal><Contact darkMode={darkMode} /></Reveal>
      </main>

      {/* Footer */}
      <Footer />

      {/* Chat Widget — lazy loaded */}
      <Suspense fallback={null}>
        <ChatWidget darkMode={darkMode} />
      </Suspense>

      {/* Floating Action Buttons (Back to Top & Quick WhatsApp) */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-center gap-3 no-print">
        {/* WhatsApp Quick Chat Floating Pill */}
        <a
          id="floating-wa-btn"
          href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
            'Halo Pak Kidung Arzhaning, saya melihat portofolio Anda dan ingin berdiskusi...'
          )}`}
          target="_blank"
          rel="noreferrer"
          title="Hubungi via WhatsApp"
          className="w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-all hover:scale-110 active:scale-95"
        >
          <MessageCircle className="w-6 h-6" />
        </a>

        {/* Back To Top Floating Button */}
        {showBackToTop && (
          <button
            id="floating-back-to-top"
            onClick={scrollToTop}
            aria-label="Kembali ke atas"
            className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg border transition-all duration-300 hover:scale-110 active:scale-95 ${darkMode
              ? 'bg-slate-900/90 border-slate-700 text-teal-400 hover:bg-slate-800'
              : 'bg-white/90 border-slate-200 text-teal-600 hover:bg-slate-100 shadow-slate-300/50'
              }`}
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Easter Egg: Mode CV — full page transform, lazy loaded.
          Fallback spinner ini jarang kelihatan karena EasterEggToast
          (di bawah) biasanya sudah menutupi jeda loading chunk-nya. */}
      <Suspense
        fallback={
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950">
            <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        {cvEggUnlocked && (
          <CVPage
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            onExit={() => setCvEggUnlocked(false)}
          />
        )}
      </Suspense>
      <EasterEggToast show={showUnlockToast} />
    </div>
  );
}
