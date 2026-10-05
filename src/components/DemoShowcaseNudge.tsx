import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, ExternalLink, LayoutGrid, X } from 'lucide-react';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { useIsMobile } from '../hooks/useIsMobile';
import { announceNudgeShown, announceNudgeDismissed, scheduleAttentionReveal } from '../utils/attentionNudge';

interface DemoShowcaseNudgeProps {
  darkMode: boolean;
  /** true hanya saat pathname di beranda (sama seperti ArticleRecommendationNudge). */
  enabled: boolean;
}

interface DemoItem {
  file: string;
  thumb?: string;
  title: string;
  desc: string;
  tags?: string[];
}

/**
 * Folder galeri demo (statis, di luar SPA). Sesuaikan kalau galeri di-host di
 * path lain. Isinya: index.html (galeri), demos.json, demo-*.html, thumbs/.
 */
const DEMO_BASE = '/demos/';

const ACTIVE_DELAY_MS = 30_000; // waktu AKTIF (tab terlihat, di beranda) sebelum muncul
const ENGAGED_DELAY_MS = 15_000; // lebih cepat kalau pengunjung sudah scroll jauh
const ENGAGED_SCROLL_RATIO = 0.4;
const ATTENTION_GRACE_MS = 6_000;
const MOBILE_ACTIVE_DELAY_MS = 60_000; // mobile: setelah kartu artikel (detik ke-30); tanpa jalur cepat scroll
const MOBILE_AUTO_HIDE_MS = 25_000; // mobile: kartu ringkas hilang sendiri (tanpa cooldown)
const TICK_MS = 1_000;

const DISMISS_KEY = 'demo-nudge-dismissed-until';
const LAST_SHOWN_KEY = 'demo-nudge-last-shown';
const DISMISS_DAYS = 3; // ditutup (X / Escape)
const CLICKED_DAYS = 7; // sudah klik ke demo/galeri — tidak perlu diingatkan lagi

const FOCUS_RING =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2';

const isCoolingDown = (): boolean => {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    return !!raw && Date.now() < Number(raw);
  } catch {
    return false;
  }
};

const startCooldown = (days: number) => {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now() + days * 24 * 60 * 60 * 1000));
  } catch {
    // localStorage bisa gagal (mode privat) — nggak fatal
  }
};

const isValidDemo = (d: unknown): d is DemoItem => {
  const x = d as DemoItem;
  return !!x && typeof x.file === 'string' && typeof x.title === 'string' && typeof x.desc === 'string';
};

/** Pilih demo acak, hindari demo yang terakhir ditampilkan. */
const pickDemo = (list: DemoItem[]): DemoItem => {
  let last: string | null = null;
  try {
    last = localStorage.getItem(LAST_SHOWN_KEY);
  } catch {
    /* abaikan */
  }
  const pool = list.length > 1 ? list.filter((d) => d.file !== last) : list;
  const chosen = pool[Math.floor(Math.random() * pool.length)];
  try {
    localStorage.setItem(LAST_SHOWN_KEY, chosen.file);
  } catch {
    /* abaikan */
  }
  return chosen;
};

/**
 * Kartu promosi galeri contoh desain: menampilkan satu demo acak + link ke

 * halaman galeri. Desktop: tengah atas (beda dari nudge artikel di kanan atas),
 * desktop saja (`lg` ke atas) — di bawah itu lebarnya bisa menabrak kartu artikel.
 *
 * Beda dengan nudge artikel, ini bersifat promosi, jadi lebih disiplin:
 *  - Hitung waktu AKTIF saja: tab harus terlihat dan user sedang di beranda.
 *    Muncul setelah 30 detik, atau 15 detik kalau sudah scroll >40%.
 *    Mobile (<640px): kartu ringkas di bawah banner, tepat di detik ke-60 aktif.
 *  - Cooldown lintas kunjungan lewat localStorage (3 hari setelah ditutup,
 *    7 hari setelah klik), seperti PWAInstallPrompt.
 *  - Tidak muncul kalau chat Zannah sudah dibuka di kunjungan ini.
 *  - Muncul sekali per pageview, dan lewat koordinator attentionNudge supaya
 *    tidak bareng dengan nudge lain.
 *  - Daftar demo di-fetch dari demos.json (sumber yang sama dengan galeri).
 *    Kalau gagal/kosong, kartu tidak tampil sama sekali.
 */
export const DemoShowcaseNudge: React.FC<DemoShowcaseNudgeProps> = ({ darkMode, enabled }) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const isMobile = useIsMobile();
  const isMobileRef = useRef(isMobile);
  isMobileRef.current = isMobile;

  // Dicek sekali saat mount: kalau masih cooldown, komponen ini diam total.
  const [suppressed] = useState(isCoolingDown);

  const [ready, setReady] = useState(false); // sudah cukup lama aktif
  const [demo, setDemo] = useState<DemoItem | null>(null);
  const [visible, setVisible] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);

  const enabledRef = useRef(enabled);
  const handledRef = useRef(false); // sudah tampil/ditutup di pageview ini
  const chatOpenedRef = useRef(false);
  const elapsedRef = useRef(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    enabledRef.current = enabled;
    if (!enabled) setVisible(false); // pindah rute dari beranda — sembunyikan
  }, [enabled]);

  // Chat Zannah dibuka lewat cara apa pun → jangan ganggu lagi di kunjungan ini.
  useEffect(() => {
    const onChatOpened = () => {
      chatOpenedRef.current = true;
      setVisible(false);
    };
    window.addEventListener('zannah-chat-opened', onChatOpened);
    return () => window.removeEventListener('zannah-chat-opened', onChatOpened);
  }, []);

  // Penghitung waktu aktif. Tidak jalan kalau tab di-background atau user
  // sedang bukan di beranda; akumulasinya tetap tersimpan di elapsedRef.
  useEffect(() => {
    if (suppressed || ready || !enabled) return;
    const id = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      elapsedRef.current += TICK_MS;

      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const engaged = scrollable > 0 && window.scrollY / scrollable >= ENGAGED_SCROLL_RATIO;
      const threshold = isMobileRef.current
        ? MOBILE_ACTIVE_DELAY_MS
        : engaged
          ? ENGAGED_DELAY_MS
          : ACTIVE_DELAY_MS;

      if (elapsedRef.current >= threshold) setReady(true);
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [suppressed, ready, enabled]);

  // Waktunya tiba → baru fetch daftar demo (tidak membebani load awal).
  useEffect(() => {
    if (!ready || demo) return;
    const controller = new AbortController();
    fetch(`${DEMO_BASE}demos.json`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: unknown) => {
        const list = Array.isArray(data) ? data.filter(isValidDemo) : [];
        if (list.length > 0) setDemo(pickDemo(list));
      })
      .catch(() => {
        /* gagal → nudge tidak tampil, tanpa kartu kosong */
      });
    return () => controller.abort();
  }, [ready, demo]);

  // Tampilkan lewat koordinator (delay 0: jeda 60 detik sudah kita hitung
  // sendiri di atas; di sini cuma perlu menunggu nudge lain selesai).
  useEffect(() => {
    if (!demo || !enabled || handledRef.current) return;
    return scheduleAttentionReveal('demo-showcase', 0, ATTENTION_GRACE_MS, () => {
      if (!enabledRef.current || chatOpenedRef.current || handledRef.current) return;
      handledRef.current = true;
      setThumbFailed(false);
      setVisible(true);
    });
  }, [demo, enabled]);

  useEffect(() => {
    if (visible) announceNudgeShown('demo-showcase');
    else announceNudgeDismissed('demo-showcase');
  }, [visible]);

  // Fokus & Escape — pola sama dengan nudge lain.
  useEffect(() => {
    if (visible) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
      dialogRef.current?.focus();
    } else {
      previouslyFocusedRef.current?.focus();
    }
  }, [visible]);

  useEffect(() => {
    if (!visible || !isMobile) return;
    const id = window.setTimeout(() => setVisible(false), MOBILE_AUTO_HIDE_MS);
    return () => window.clearTimeout(id);
  }, [visible, isMobile]);

  const dismiss = () => {
    startCooldown(DISMISS_DAYS);
    setVisible(false);
  };

  useEffect(() => {
    if (!visible) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible || !demo) return null;

  // Link biasa ke file HTML statis di luar SPA → buka tab baru, bukan navigate().
  const handleVisit = () => {
    startCooldown(CLICKED_DAYS);
    setVisible(false);
  };

  const showThumb = !!demo.thumb && !thumbFailed;

  // Mobile: kartu ringkas (thumbnail kecil + dua link), di bawah navbar + banner.
  if (isMobile) {
    return (
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-label="Contoh desain"
        aria-modal="false"
        className={`fixed top-32 inset-x-3 z-[60] outline-none ${
          prefersReducedMotion ? '' : 'animate-in fade-in slide-in-from-top-3 duration-300'
        }`}
      >
        <div
          className={`relative overflow-hidden rounded-2xl border ring-1 ${
            darkMode
              ? 'bg-slate-900 border-slate-700 text-slate-100 ring-white/5 shadow-[0_18px_40px_-18px_rgba(45,212,191,0.3)]'
              : 'bg-white border-slate-200 text-slate-900 ring-black/5 shadow-[0_18px_40px_-18px_rgba(13,148,136,0.35)]'
          }`}
        >
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-teal-500 via-teal-400 to-indigo-500" />
          <button
            type="button"
            aria-label="Tutup contoh desain"
            onClick={dismiss}
            className={`absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full transition-colors ${FOCUS_RING} ${
              darkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-400 hover:bg-slate-100'
            }`}
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex gap-3 p-3 pr-10">
            <div
              className={`flex h-16 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg ${
                darkMode ? 'bg-slate-800' : 'bg-slate-100'
              }`}
            >
              {showThumb ? (
                <img
                  src={`${DEMO_BASE}${demo.thumb}`}
                  alt=""
                  loading="lazy"
                  onError={() => setThumbFailed(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-teal-500/70" aria-hidden="true">
                  {demo.title.charAt(0)}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-teal-500">
                Contoh Desain
              </span>
              <h3 className="line-clamp-2 text-[13px] font-bold leading-snug">{demo.title}</h3>
              <div className="mt-1.5 flex items-center gap-3">
                <a
                  href={`${DEMO_BASE}${demo.file}`}
                  target="_blank"
                  rel="noopener"
                  onClick={handleVisit}
                  className={`inline-flex items-center gap-1 rounded-lg bg-teal-600 px-2.5 py-1 text-[11px] font-semibold text-white ${FOCUS_RING}`}
                >
                  Lihat demo
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
                <a
                  href={DEMO_BASE}
                  target="_blank"
                  rel="noopener"
                  onClick={handleVisit}
                  className={`text-[11px] font-semibold ${FOCUS_RING} ${darkMode ? 'text-teal-400' : 'text-teal-600'}`}
                >
                  Semua contoh
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    // Wrapper yang memusatkan kartu. Sengaja BUKAN `left-1/2 -translate-x-1/2`
    // di elemen beranimasi: animate-in memakai `transform` sendiri dan akan
    // menimpa translate itu, sehingga kartu melompat saat animasi masuk.
    <div className="hidden lg:flex fixed inset-x-0 top-24 z-[60] justify-center pointer-events-none">
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-label="Contoh desain"
      aria-modal="false"
      className={`pointer-events-auto w-80 max-w-[calc(100vw-2rem)] outline-none ${
        prefersReducedMotion ? '' : 'animate-in fade-in slide-in-from-top-3 zoom-in-95 duration-300'
      }`}
    >
      <div
        className={`relative overflow-hidden rounded-3xl border ring-1 ${
          darkMode
            ? 'bg-slate-900 border-slate-700 text-slate-100 ring-white/5 shadow-[0_25px_60px_-20px_rgba(45,212,191,0.3)]'
            : 'bg-white border-slate-200 text-slate-900 ring-black/5 shadow-[0_25px_60px_-20px_rgba(13,148,136,0.35)]'
        }`}
      >
        <div className="absolute inset-x-0 top-0 h-1 z-10 bg-gradient-to-r from-teal-500 via-teal-400 to-indigo-500" />

        <button
          type="button"
          aria-label="Tutup contoh desain"
          onClick={dismiss}
          className={`absolute top-3 right-3 z-10 flex h-7 w-7 items-center justify-center rounded-full backdrop-blur transition-colors ${FOCUS_RING} ${
            darkMode
              ? 'bg-slate-950/60 text-slate-300 hover:bg-slate-800 hover:text-white'
              : 'bg-white/80 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
          }`}
        >
          <X className="h-4 w-4" />
        </button>

        {/* Thumbnail: kalau gambar gagal dimuat, jatuh ke blok gradien + inisial */}
        <div
          className={`aspect-[16/9] w-full overflow-hidden flex items-center justify-center ${
            darkMode ? 'bg-slate-800' : 'bg-slate-100'
          }`}
        >
          {showThumb ? (
            <img
              src={`${DEMO_BASE}${demo.thumb}`}
              alt={`Cuplikan ${demo.title}`}
              loading="lazy"
              onError={() => setThumbFailed(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-4xl font-bold text-teal-500/70" aria-hidden="true">
              {demo.title.charAt(0)}
            </span>
          )}
        </div>

        <div className="p-4">
          <div
            className={`inline-flex items-center gap-1.5 mb-2 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
              darkMode
                ? 'text-teal-300 bg-teal-500/10 border border-teal-500/20'
                : 'text-teal-700 bg-teal-50 border border-teal-200'
            }`}
          >
            <LayoutGrid className="w-3 h-3" aria-hidden="true" />
            <span>Contoh Desain</span>
          </div>

          <h3 className={`text-sm font-bold leading-snug mb-1 line-clamp-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            {demo.title}
          </h3>
          <p className={`text-xs leading-relaxed mb-2 line-clamp-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {demo.desc}
          </p>

          {demo.tags && demo.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {demo.tags.slice(0, 3).map((t) => (
                <span
                  key={t}
                  className={`text-[10px] rounded-md border px-1.5 py-0.5 ${
                    darkMode ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-500'
                  }`}
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <a
              href={`${DEMO_BASE}${demo.file}`}
              target="_blank"
              rel="noopener"
              onClick={handleVisit}
              className={`inline-flex items-center justify-center gap-1.5 rounded-xl bg-teal-600 py-2 text-xs font-semibold text-white transition-colors hover:bg-teal-700 ${FOCUS_RING}`}
            >
              Lihat demo
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
            <a
              href={DEMO_BASE}
              target="_blank"
              rel="noopener"
              onClick={handleVisit}
              className={`group inline-flex items-center justify-center gap-1.5 rounded-lg py-1 text-xs font-semibold ${FOCUS_RING} ${
                darkMode ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-700'
              }`}
            >
              Lihat semua contoh
              <ArrowRight
                className={`w-3.5 h-3.5 ${prefersReducedMotion ? '' : 'transition-transform duration-200 group-hover:translate-x-1'}`}
                aria-hidden="true"
              />
            </a>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};