import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, BookOpen, Clock, Sparkles, X } from 'lucide-react';
import { ARTICLES } from '../data/articles';
import { useNavigationHistory } from '../context/NavigationHistoryContext';
import { articleRoute } from '../routes';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { announceNudgeShown, announceNudgeDismissed, scheduleAttentionReveal } from '../utils/attentionNudge';
import { ArticleIllustration } from './ArticleIllustration';

interface ArticleRecommendationNudgeProps {
  darkMode: boolean;
  /**
   * Cuma boleh benar-benar TAMPIL kalau true — dipakai App.tsx: true hanya
   * saat pathname sedang di beranda. Timer 10 detik tetap berjalan begitu
   * komponen mount TERLEPAS dari nilai ini (supaya tidak me-reset kalau user
   * sempat pindah rute sebentar sebelum 10 detik berlalu); begitu waktunya
   * tiba, baru dicek apakah saat itu memang lagi di beranda.
   */
  enabled: boolean;
}

const BASE_DELAY_MS = 10_000; // 10 detik pertama landing page dibuka
const ATTENTION_GRACE_MS = 6_000; // jeda tambahan MAKSIMAL kalau nudge lain masih tampil di detik ke-10

const FOCUS_RING =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2';

/**
 * Card rekomendasi artikel acak, muncul sendiri 10 detik setelah beranda
 * dibuka — pojok KANAN ATAS, sengaja beda sudut dari bubble Zannah (kiri
 * bawah) dan prompt install PWA (kanan bawah) supaya 3-3nya tidak pernah
 * bertabrakan secara visual.
 *
 * Sengaja HANYA desktop/tablet (`sm` ke atas) — di layar mobile yang sudah
 * ramai oleh 2 nudge lain, popup ketiga gampang terasa spammy dan menutupi
 * konten. Pengunjung mobile tetap kebagian lewat section ArticlesPreview di
 * body halaman.
 *
 * Koordinasi dengan nudge lain (Zannah, prompt install PWA): pakai
 * `scheduleAttentionReveal` dari utils/attentionNudge.ts. Kalau salah satu
 * dari mereka kebetulan masih tampil tepat di detik ke-10, card ini
 * menunggu dulu (maksimal ATTENTION_GRACE_MS) supaya tidak ada 2 popup
 * "meminta perhatian" dalam waktu bersamaan.
 *
 * Sama seperti ZannahWelcomeNudge: tampil sekali per pageview (bukan per
 * browser/localStorage) — reload penuh = kunjungan baru.
 */
export const ArticleRecommendationNudge: React.FC<ArticleRecommendationNudgeProps> = ({
  darkMode,
  enabled,
}) => {
  const { navigate } = useNavigationHistory();
  const prefersReducedMotion = usePrefersReducedMotion();

  const [visible, setVisible] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const enabledRef = useRef(enabled);

  // Artikel dipilih SEKALI secara acak per pageview, bukan tiap render.
  const [article] = useState(() => {
    const published = ARTICLES.filter((a) => a.published);
    if (published.length === 0) return null;
    return published[Math.floor(Math.random() * published.length)];
  });

  useEffect(() => {
    enabledRef.current = enabled;
    // Ganti rute keluar dari beranda sebelum sempat di-dismiss manual —
    // sembunyikan, jangan sampai kartu rekomendasi artikel nyangkut di
    // halaman Hasil Kerja atau Artikel itu sendiri.
    if (!enabled) setVisible(false);
  }, [enabled]);

  useEffect(() => {
    if (!article) return;
    return scheduleAttentionReveal('article-recommendation', BASE_DELAY_MS, ATTENTION_GRACE_MS, () => {
      if (enabledRef.current) setVisible(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [article]);

  // Siarkan status ke koordinator bersama — kalau suatu saat ada nudge lain
  // yang perlu "sopan" menunggu card ini juga, dia sudah punya sinyalnya.
  useEffect(() => {
    if (visible) {
      announceNudgeShown('article-recommendation');
    } else {
      announceNudgeDismissed('article-recommendation');
    }
  }, [visible]);

  // Fokus & Escape — pola sama dengan ZannahWelcomeNudge, supaya konsisten
  // dari sisi aksesibilitas di seluruh app.
  useEffect(() => {
    if (visible) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
      dialogRef.current?.focus();
    } else {
      previouslyFocusedRef.current?.focus();
    }
  }, [visible]);

  const dismiss = () => setVisible(false);

  useEffect(() => {
    if (!visible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible || !article) return null;

  const handleRead = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    setVisible(false);
    navigate(articleRoute(article.slug));
  };

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-label="Rekomendasi artikel"
      aria-modal="false"
      className={`hidden sm:block fixed top-24 right-6 z-[60] w-80 max-w-[calc(100vw-2rem)] outline-none ${
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
        {/* Aksen tipis di tepi atas — sama seperti ZannahWelcomeNudge, biar
            terasa satu keluarga visual dengan nudge lain di app ini. */}
        <div className="absolute inset-x-0 top-0 h-1 z-10 bg-gradient-to-r from-teal-500 via-teal-400 to-indigo-500" />

        <button
          type="button"
          aria-label="Tutup rekomendasi artikel"
          onClick={dismiss}
          className={`absolute top-3 right-3 z-10 flex h-7 w-7 items-center justify-center rounded-full backdrop-blur transition-colors ${FOCUS_RING} ${
            darkMode
              ? 'bg-slate-950/60 text-slate-300 hover:bg-slate-800 hover:text-white'
              : 'bg-white/80 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
          }`}
        >
          <X className="h-4 w-4" />
        </button>

        {/* Seluruh badan card bisa diklik — konsisten dengan card artikel di
            tempat lain (ArticlesPreview, ArticlesIndexPage): klik = buka
            artikel, tombol X terpisah = tutup. */}
        <a href={articleRoute(article.slug)} onClick={handleRead} className={`group block rounded-3xl ${FOCUS_RING}`}>
          <ArticleIllustration
            slug={article.slug}
            category={article.category}
            darkMode={darkMode}
            size="middle"
            position="top"
            edgeToEdge
          />

          <div className="p-4">
            <div
              className={`inline-flex items-center gap-1.5 mb-2 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                darkMode
                  ? 'text-teal-300 bg-teal-500/10 border border-teal-500/20'
                  : 'text-teal-700 bg-teal-50 border border-teal-200'
              }`}
            >
              <BookOpen className="w-3 h-3" aria-hidden="true" />
              <span>Rekomendasi Bacaan</span>
            </div>

            <h3
              className={`text-sm font-bold leading-snug mb-1.5 line-clamp-2 transition-colors group-hover:text-teal-500 ${
                darkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              {article.title}
            </h3>

            <div
              className={`flex items-center gap-x-2.5 text-[11px] mb-3 ${
                darkMode ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              <span className="inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3" aria-hidden="true" />
                {article.category}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3" aria-hidden="true" />
                {article.readMinutes} menit
              </span>
            </div>

            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                darkMode ? 'text-teal-400' : 'text-teal-600'
              }`}
            >
              Baca artikel
              <ArrowRight
                className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1"
                aria-hidden="true"
              />
            </span>
          </div>
        </a>
      </div>
    </div>
  );
};