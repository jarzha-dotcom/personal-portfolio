import React, { useCallback, useEffect, useRef, useState, lazy, Suspense } from 'react';
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
import { ShowcaseBanner } from './components/ShowcaseBanner';
import { PWAManager } from './components/PWAManager';
import { ChunkErrorBoundary } from './components/ChunkErrorBoundary';
import { ZannahWelcomeNudge } from './components/ZannahWelcomeNudge';
import { usePrefersReducedMotion } from './hooks/usePrefersReducedMotion';
import { ArrowUp } from 'lucide-react';
import {
  NavigationHistoryProvider,
  useNavigationHistory,
  useRegisterModal,
} from './context/NavigationHistoryContext';
import { ExitConfirmModal } from './components/ExitConfirmModal';

// Lazy-loaded: keduanya tidak perlu masuk bundle awal. CVPage (berat — isinya
// 9 komponen: NavbarCV, HeroCV, AboutCV, Experience, SkillsCV, ContactCV,
// FooterCV, ChatWidgetCV, CVDocumentModal) cuma dipakai kalau easter egg
// (klik logo 5x) ditemukan — mayoritas pengunjung nggak pernah ke sana.
//
// ChatWidget import-nya SENGAJA tidak langsung dipicu oleh lazy() begitu
// MainPortfolio pertama render — lihat `chatWidgetReady` di bawah. React.lazy
// sendiri cuma menjamin code-splitting (chunk terpisah), bukan menunda kapan
// import()-nya dipanggil; itu baru terjadi begitu komponennya benar-benar
// dirender.
const ChatWidget = lazy(() =>
  import('./components/ChatWidget').then((m) => ({ default: m.ChatWidget }))
);
const CVPage = lazy(() =>
  import('./components/CVPage').then((m) => ({ default: m.CVPage }))
);

function MainPortfolio() {
  const { showExitConfirm, handleStay, handleLeave } = useNavigationHistory();
  const prefersReducedMotion = usePrefersReducedMotion();

  // Menandai apakah tema saat ini adalah pilihan MANUAL user (lewat toggle di
  // Navbar/CVPage) atau masih mengikuti preferensi OS. Dipakai supaya:
  //  (a) kita tidak "mengunci" localStorage.theme di setiap render cuma
  //      karena effect sinkronisasi class `dark` ikut jalan saat mount, dan
  //  (b) listener live-sync ke OS di bawah tahu kapan boleh/tidak boleh
  //      menimpa state.
  const userSetThemeRef = useRef<boolean>(
    typeof window !== 'undefined' && !!localStorage.getItem('theme')
  );

  const [darkMode, setDarkModeState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) return savedTheme === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Setter yang dipakai untuk toggle MANUAL (dari Navbar / CVPage). Berbeda
  // dari setDarkModeState mentah karena ini juga menandai bahwa mulai
  // sekarang preferensi OS tidak boleh menimpa pilihan user lagi.
  const setDarkMode = useCallback((value: boolean) => {
    userSetThemeRef.current = true;
    setDarkModeState(value);
  }, []);

  const [showBackToTop, setShowBackToTop] = useState(false);

  // Easter egg: mode CV lengkap, dibuka lewat klik logo 5x di Navbar
  const [cvEggUnlocked, setCvEggUnlocked] = useState(false);
  const [showUnlockToast, setShowUnlockToast] = useState(false);

  const handleEasterEgg = () => {
    setCvEggUnlocked(true);
    setShowUnlockToast(true);
  };

  // Sinkronkan tombol kembali di browser dengan Mode CV
  useRegisterModal('cv-mode-page', cvEggUnlocked, () => setCvEggUnlocked(false));

  useEffect(() => {
    if (!showUnlockToast) return;
    const timeout = setTimeout(() => setShowUnlockToast(false), 1800);
    return () => clearTimeout(timeout);
  }, [showUnlockToast]);

  // Terapkan class `dark` di <html> setiap kali state berubah. localStorage
  // HANYA ditulis kalau perubahan ini berasal dari pilihan manual user —
  // kalau tidak, preferensi OS yang belum pernah di-override manual akan
  // "terkunci" seolah-olah user sudah memilih sejak awal, dan listener
  // live-sync di bawah jadi percuma.
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    if (userSetThemeRef.current) {
      localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    }
  }, [darkMode]);

  // Live-sync ke preferensi tema OS selama user belum pernah pilih manual.
  // Begitu user toggle manual (userSetThemeRef.current jadi true), listener
  // ini otomatis berhenti berefek tanpa perlu di-unsubscribe.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleOsThemeChange = (e: MediaQueryListEvent) => {
      if (!userSetThemeRef.current) {
        setDarkModeState(e.matches);
      }
    };
    mediaQuery.addEventListener('change', handleOsThemeChange);
    return () => mediaQuery.removeEventListener('change', handleOsThemeChange);
  }, []);

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
      '%c"Buka console log itu mirip ngintip ke balik panggung: kamu bakal tahu mana efek megah yang memang disusun rapi, dan mana yang cuma ditahan pakai isolasi "try...catch."',
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

  // Tunda pemicu dynamic import() ChatWidget sampai browser idle (maksimal
  // 3 detik) ATAU sampai user mulai berinteraksi duluan (scroll/gerak
  // mouse/sentuh/tekan tombol) — mana yang lebih dulu menang. Tujuannya
  // murni memprioritaskan First Contentful Paint di device lambat tanpa
  // bikin tombol chat "hilang" kelamaan begitu user sudah mulai aktif di
  // halaman (sinyal bahwa main thread sudah longgar buat kerja tambahan).
  // Bukan menunda sampai user klik tombol chat itu sendiri, karena tombol
  // togglenya ada di dalam chunk ChatWidget — kalau suatu saat tombolnya
  // dipindah keluar (ke App.tsx), ini bisa diganti gating penuh di balik
  // state `isOpen`.
  const [chatWidgetReady, setChatWidgetReady] = useState(false);
  useEffect(() => {
    let settled = false;
    const markReady = () => {
      if (settled) return;
      settled = true;
      setChatWidgetReady(true);
    };

    const interactionEvents: Array<keyof WindowEventMap> = ['scroll', 'mousemove', 'touchstart', 'keydown'];
    interactionEvents.forEach((evt) =>
      window.addEventListener(evt, markReady, { passive: true, once: true })
    );

    const win = window as typeof window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    let idleId: number | undefined;
    let timeoutId: number | undefined;
    if (win.requestIdleCallback) {
      idleId = win.requestIdleCallback(markReady, { timeout: 3000 });
    } else {
      // Fallback untuk Safari (belum dukung requestIdleCallback)
      timeoutId = window.setTimeout(markReady, 1500);
    }

    return () => {
      interactionEvents.forEach((evt) => window.removeEventListener(evt, markReady));
      if (idleId !== undefined) win.cancelIdleCallback?.(idleId);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  };

  return (
    // id="app-root" dipakai oleh print CSS di CVPage.tsx untuk menyembunyikan
    // seluruh konten halaman jasa saat mode CV di-print — jangan dihapus.
    <div
      id="app-root"
      className={`min-h-screen font-sans transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-900'
        }`}
    >
      {/* Skip link untuk keyboard/screen-reader users — cuma kelihatan saat fokus */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-lg focus:bg-teal-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
      >
        Lewati ke konten utama
      </a>

      {/* License / Showcase Evaluation Banner */}
      <ShowcaseBanner />

      {/* Fixed Navigation Bar */}
      <Navbar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onEasterEgg={handleEasterEgg}
      />

      {/* PWA: service worker registration + install prompt / update toast */}
      <PWAManager darkMode={darkMode} />

      {/* Main Sections Content — fokus penuh ke jasa development.
          Catatan: Experience (rekam jejak kerja) sengaja TIDAK ditampilkan
          di sini karena terlalu "CV-oriented" untuk halaman jasa. Komponen
          Experience sekarang eksklusif dipakai di dalam CVPage. */}
      <main id="main-content">
        <Hero darkMode={darkMode} />
        <Reveal>
          <About darkMode={darkMode} />
        </Reveal>
        <Reveal>
          <Projects darkMode={darkMode} />
        </Reveal>
        <Reveal>
          <Services darkMode={darkMode} />
        </Reveal>
        <Reveal>
          <Skills darkMode={darkMode} />
        </Reveal>
        <Reveal>
          <Contact darkMode={darkMode} />
        </Reveal>
      </main>

      {/* Footer */}
      <Footer />

      {/* Chat Widget — lazy loaded, ditunda sampai idle (lihat chatWidgetReady).
          Dibungkus ErrorBoundary: kalau chunk-nya gagal di-fetch (mis. koneksi
          mobile putus), user dapat kartu kecil dengan tombol "Coba lagi"
          alih-alih Suspense fallback yang nyangkut diam-diam selamanya. */}
      <ChunkErrorBoundary darkMode={darkMode} variant="corner">
        <Suspense fallback={null}>
          {chatWidgetReady && <ChatWidget darkMode={darkMode} />}
        </Suspense>
      </ChunkErrorBoundary>

      {/* Sambutan satu-kali dari Zannah — bubble kecil dekat tombol chat,
          bukan overlay coachmark yang maksa. Baru dijadwalkan muncul setelah
          ChatWidget (dan tombol togglenya) siap. */}
      <ZannahWelcomeNudge darkMode={darkMode} enabled={chatWidgetReady} />

      {/* Floating Action Button (Back to Top) */}
      <div className="fixed bottom-6 right-6 z-40 no-print">
        {showBackToTop && (
          <button
            id="floating-back-to-top"
            onClick={scrollToTop}
            aria-label="Kembali ke atas"
            className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg border transition-all duration-300 ${prefersReducedMotion ? '' : 'hover:scale-110 active:scale-95'
              } ${darkMode
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
          (di bawah) biasanya sudah menutupi jeda loading chunk-nya. Juga
          dibungkus ErrorBoundary (variant="center") untuk kasus chunk gagal
          dimuat. */}
      <ChunkErrorBoundary
        darkMode={darkMode}
        variant="center"
        message="Gagal memuat Mode CV. Cek koneksi internet Kakak, lalu coba lagi."
      >
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
      </ChunkErrorBoundary>

      <EasterEggToast show={showUnlockToast} />

      {/* Modal Peringatan/Konfirmasi saat Tombol Back di browser ditekan di halaman utama */}
      <ExitConfirmModal
        isOpen={showExitConfirm}
        onStay={handleStay}
        onLeave={handleLeave}
        darkMode={darkMode}
      />
    </div>
  );
}

export default function App() {
  return (
    <NavigationHistoryProvider>
      <MainPortfolio />
    </NavigationHistoryProvider>
  );
}