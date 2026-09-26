import React, { useEffect, useMemo, useRef } from 'react';
import { ArrowRight, BookOpen, Calendar, ChevronLeft, ChevronRight, Clock, Sparkles } from 'lucide-react';
import { ARTICLES } from '../data/articles';
import { useNavigationHistory } from '../context/NavigationHistoryContext';
import { ROUTES, articleRoute } from '../routes';
import { formatIDDate, toISODate } from '../utils/formatDate';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { ArticleIllustration } from './ArticleIllustration';

interface ArticlesPreviewProps {
  darkMode: boolean;
}

const FOCUS_RING =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent';

export const ArticlesPreview: React.FC<ArticlesPreviewProps> = ({ darkMode }) => {
  const { navigate } = useNavigationHistory();
  const prefersReducedMotion = usePrefersReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);

  // Semua artikel published ditampilkan (bukan cuma 3 teratas) — tetap
  // terurut terbaru -> terlama, sama seperti asumsi `latestArticle` di
  // ArticlesIndexPage.
  const articles = useMemo(() => ARTICLES.filter((a) => a.published), []);

  // Loop tak berujung: track-nya berisi 2 salinan berurutan dari daftar yang
  // sama. Begitu scroll melewati separuh (= akhir salinan pertama / awal
  // salinan kedua), listener di bawah diam-diam "melompat" balik ke titik
  // yang sama-persis di salinan pertama — karena isinya identik, lompatan
  // ini tidak terlihat sama sekali, hasilnya terasa scroll tanpa akhir.
  // Kalau cuma ada 1 artikel, tidak ada yang perlu di-loop.
  const isLoopable = articles.length > 1;
  const trackItems = useMemo(
    () => (isLoopable ? [...articles, ...articles] : articles),
    [articles, isLoopable]
  );

  useEffect(() => {
    const el = trackRef.current;
    if (!el || !isLoopable) return;
    const handleScroll = () => {
      const half = el.scrollWidth / 2;
      if (el.scrollLeft >= half) {
        el.scrollLeft -= half;
      }
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [isLoopable]);

  // Geser satu "layar penuh" (3 card di desktop, 1 di mobile — mengikuti
  // lebar container yang sedang terlihat, tanpa perlu hitung breakpoint
  // manual di JS karena scroll-snap yang merapikan hasil akhirnya).
  const scrollByPage = (direction: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    // Mundur dari dekat titik paling awal: lompat diam-diam ke posisi yang
    // sama-persis di salinan kedua dulu (masih terlihat sama karena
    // duplikat), supaya selalu ada "ruang" untuk digeser mundur — inilah
    // yang membuat tombol prev terasa tak berujung juga, bukan cuma next.
    if (direction === -1 && el.scrollLeft < el.clientWidth) {
      el.scrollLeft += el.scrollWidth / 2;
    }
    el.scrollBy({
      left: direction * el.clientWidth,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  };

  // Section ini sengaja tidak dirender sama sekali kalau belum ada artikel
  // yang dipublikasikan — sama seperti link "Artikel" di Navbar yang juga
  // disembunyikan lewat `hasPublishedArticles`.
  if (articles.length === 0) return null;

  const goToArticle = (e: React.MouseEvent<HTMLAnchorElement>, slug: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    navigate(articleRoute(slug));
  };

  const goToIndex = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    navigate(ROUTES.articles);
  };

  return (
    <section
      id="artikel"
      aria-labelledby="artikel-heading"
      className={`py-16 md:py-24 transition-colors duration-200 relative overflow-hidden ${
        darkMode ? 'bg-slate-950 border-t border-slate-800/80' : 'bg-slate-50 border-t border-slate-200'
      }`}
    >
      {/* Subtle background glow, konsisten dengan section Proyek */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-0 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10">
          <div className="max-w-2xl">
            <div
              className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-3 shadow-sm ${
                darkMode
                  ? 'text-teal-300 bg-teal-950/80 border border-teal-800/80'
                  : 'text-teal-700 bg-teal-50 border border-teal-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Artikel Terbaru</span>
            </div>
            <h2
              id="artikel-heading"
              className={`text-2xl sm:text-4xl font-extrabold tracking-tight mb-3 ${
                darkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              Catatan & Panduan Teknis
            </h2>
            <p className={`text-xs sm:text-base leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Tulisan seputar pengembangan web, chatbot, dan automasi — dari pengalaman menangani proyek nyata.
            </p>
          </div>

          {/* Panah navigasi — cuma tampil di layar sm ke atas (di mobile
              cukup swipe langsung, panah cuma makan tempat) dan cuma kalau
              ada lebih dari 1 artikel untuk di-loop. Tidak pernah disabled
              karena track-nya melingkar terus. */}
          {isLoopable && (
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => scrollByPage(-1)}
                aria-label="Artikel sebelumnya"
                className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${FOCUS_RING} ${
                  darkMode
                    ? 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800 hover:border-teal-500/50'
                    : 'bg-white border-slate-200 text-slate-700 shadow-sm hover:bg-slate-50 hover:border-teal-300'
                }`}
              >
                <ChevronLeft className="w-5 h-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => scrollByPage(1)}
                aria-label="Artikel selanjutnya"
                className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${FOCUS_RING} ${
                  darkMode
                    ? 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800 hover:border-teal-500/50'
                    : 'bg-white border-slate-200 text-slate-700 shadow-sm hover:bg-slate-50 hover:border-teal-300'
                }`}
              >
                <ChevronRight className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        {/* Track carousel — scroll-snap horizontal. 1 card penuh per layar
            di mobile, membesar jadi 2 (tablet) lalu 3 (desktop) lewat lebar
            basis tiap card, BUKAN lewat grid-cols. Scrollbar disembunyikan
            (native, swipe/touch tetap jalan) supaya terlihat seperti
            carousel, bukan area scroll biasa. */}
        <div
          ref={trackRef}
          className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth -mx-3 px-3 pb-4 mb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {trackItems.map((article, i) => {
            const isDuplicate = i >= articles.length;
            return (
            <div key={`${article.slug}-${i}`} className="snap-start shrink-0 w-full sm:w-1/2 lg:w-1/3 px-3">
              <a
                href={articleRoute(article.slug)}
                onClick={(e) => goToArticle(e, article.slug)}
                aria-hidden={isDuplicate || undefined}
                tabIndex={isDuplicate ? -1 : undefined}
                className={`group h-full rounded-2xl border transition-all duration-300 hover:-translate-y-1.5 flex flex-col overflow-hidden ${FOCUS_RING} ${
                  darkMode
                    ? 'bg-slate-900/90 border-slate-800 hover:border-teal-500/50 hover:shadow-xl hover:shadow-teal-500/5'
                    : 'bg-white border-slate-200/90 shadow-sm hover:shadow-xl hover:border-teal-300'
                }`}
              >
                <ArticleIllustration
                  slug={article.slug}
                  category={article.category}
                  darkMode={darkMode}
                  size="middle"
                  position="top"
                  edgeToEdge
                />

                <div className="p-5 flex-1 flex flex-col">
                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mb-2.5 text-[11px]">
                    <span
                      className={`inline-flex items-center gap-1.5 font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                        darkMode
                          ? 'text-teal-300 bg-teal-500/10 border border-teal-500/20'
                          : 'text-teal-700 bg-teal-50 border border-teal-200'
                      }`}
                    >
                      <Sparkles className="w-3 h-3" aria-hidden="true" />
                      {article.category}
                    </span>
                    {article.publishedAt && (
                      <time
                        dateTime={toISODate(article.publishedAt)}
                        className={`inline-flex items-center gap-1 ${
                          darkMode ? 'text-slate-500' : 'text-slate-400'
                        }`}
                      >
                        <Calendar className="w-3 h-3" aria-hidden="true" />
                        {formatIDDate(article.publishedAt)}
                      </time>
                    )}
                  </div>

                  {/* Title */}
                  <h3
                    className={`text-base sm:text-lg font-bold mb-2 leading-snug transition-colors group-hover:text-teal-500 ${
                      darkMode ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {article.title}
                  </h3>

                  {/* Excerpt */}
                  <p
                    className={`text-xs sm:text-sm leading-relaxed mb-4 line-clamp-2 ${
                      darkMode ? 'text-slate-300' : 'text-slate-600'
                    }`}
                  >
                    {article.excerpt}
                  </p>

                  {/* Footer: read time + CTA, didorong ke bawah card */}
                  <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-700/40 dark:border-slate-800">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] ${
                        darkMode ? 'text-slate-500' : 'text-slate-400'
                      }`}
                    >
                      <Clock className="w-3 h-3" aria-hidden="true" />
                      {article.readMinutes} menit baca
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold ${
                        darkMode ? 'text-teal-400' : 'text-teal-600'
                      }`}
                    >
                      Baca
                      <ArrowRight
                        className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                    </span>
                  </div>
                </div>
              </a>
            </div>
            );
          })}
        </div>

        {/* CTA lihat semua artikel */}
        <div className="text-center">
          <a
            href={ROUTES.articles}
            onClick={goToIndex}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border transition-colors ${FOCUS_RING} ${
              darkMode
                ? 'border-teal-700/70 text-teal-300 bg-teal-950/40 hover:bg-teal-900/50'
                : 'border-teal-300 text-teal-800 bg-teal-50/80 hover:bg-teal-100'
            }`}
          >
            <span>Lihat Semua Artikel</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
};