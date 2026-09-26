import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar,
  Search,
  Sparkles,
  FileText,
  X,
} from 'lucide-react';
import { ARTICLES } from '../data/articles';
import { useNavigationHistory } from '../context/NavigationHistoryContext';
import { ROUTES, articleRoute } from '../routes';
import { useBreadcrumbSchema } from '../hooks/useBreadcrumbSchema';
import { formatIDDate, toISODate } from '../utils/formatDate';
import { ArticleIllustration } from '../components/ArticleIllustration';

interface ArticlesIndexPageProps {
  darkMode: boolean;
}

const PAGE_TITLE = 'Artikel | K. Arzhaning Jagad (Arzha)';
const PAGE_DESCRIPTION =
  'Catatan teknis dan panduan seputar pengembangan web, mobile app, dan chatbot — dari pengalaman menangani proyek nyata.';
const CANONICAL_URL = 'https://arzhaning.my.id/artikel';

const FOCUS_RING =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent';

// Jumlah artikel non-featured per halaman. Featured card (artikel terbaru)
// cuma tampil di halaman 1 saat tidak ada filter aktif, jadi tidak dihitung
// ke kuota ini.
const ARTICLES_PER_PAGE = 9;

// Nomor halaman yang ditampilkan di pagination, dengan "..." kalau jumlah
// halaman banyak -- selalu menyertakan halaman pertama, terakhir, dan
// beberapa halaman di sekitar halaman aktif.
const getPageNumbers = (current: number, total: number): (number | 'ellipsis')[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = new Set<number>([1, total, current - 1, current, current + 1]);
  const sorted = Array.from(pages)
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);

  const result: (number | 'ellipsis')[] = [];
  sorted.forEach((page, i) => {
    if (i > 0 && page - sorted[i - 1] > 1) result.push('ellipsis');
    result.push(page);
  });
  return result;
};

export const ArticlesIndexPage: React.FC<ArticlesIndexPageProps> = ({ darkMode }) => {
  const { navigate } = useNavigationHistory();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const listTopRef = useRef<HTMLDivElement>(null);

  const published = useMemo(() => ARTICLES.filter((a) => a.published), []);

  // Kategori unik dari artikel yang published
  const categories = useMemo(() => {
    const cats = new Set(published.map((a) => a.category));
    return Array.from(cats);
  }, [published]);

  // Filter berdasarkan search + kategori
  const filtered = useMemo(() => {
    let result = published;
    if (activeCategory) {
      result = result.filter((a) => a.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(query) ||
          a.excerpt.toLowerCase().includes(query) ||
          a.category.toLowerCase().includes(query)
      );
    }
    return result;
  }, [published, searchQuery, activeCategory]);

  // Artikel terbaru (first item, asumsinya sudah di-sort descending)
  const latestArticle = published[0];

  const hasActiveFilters = searchQuery.trim() !== '' || activeCategory !== null;

  // Featured card cuma tampil saat tidak ada filter aktif -- jadi daftar
  // "biasa" di bawahnya mengecualikan artikel itu hanya dalam kondisi yang
  // sama. Inilah array yang dipaginasi, BUKAN `filtered` mentah, supaya
  // featured card tidak ikut menggeser hitungan per halaman.
  const listArticles = useMemo(
    () => filtered.filter((a) => hasActiveFilters || a.slug !== latestArticle?.slug),
    [filtered, hasActiveFilters, latestArticle]
  );

  const totalPages = Math.max(1, Math.ceil(listArticles.length / ARTICLES_PER_PAGE));
  const rawPage = parseInt(searchParams.get('page') || '1', 10);
  const currentPage = Math.min(Math.max(1, Number.isNaN(rawPage) ? 1 : rawPage), totalPages);

  const pagedArticles = listArticles.slice(
    (currentPage - 1) * ARTICLES_PER_PAGE,
    currentPage * ARTICLES_PER_PAGE
  );

  const goToPage = (page: number) => {
    const clamped = Math.min(Math.max(1, page), totalPages);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (clamped <= 1) next.delete('page');
        else next.set('page', String(clamped));
        return next;
      },
      { replace: false }
    );
    listTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Kalau filter berubah (search/kategori), balik ke halaman 1 -- daftar
  // hasil filter yang baru mungkin lebih pendek dari halaman yang lagi dibuka.
  useEffect(() => {
    if (searchParams.get('page')) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete('page');
          return next;
        },
        { replace: true }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, activeCategory]);

  useBreadcrumbSchema([
    { name: 'Beranda', url: 'https://arzhaning.my.id/' },
    { name: 'Artikel', url: `https://arzhaning.my.id${ROUTES.articles}` },
  ]);

  useEffect(() => {
    const prevTitle = document.title;
    const desc = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const prevDesc = desc?.getAttribute('content') ?? null;
    const prevCanonical = canonical?.getAttribute('href') ?? null;
    document.title = PAGE_TITLE;
    desc?.setAttribute('content', PAGE_DESCRIPTION);
    canonical?.setAttribute('href', CANONICAL_URL);
    return () => {
      document.title = prevTitle;
      if (desc && prevDesc !== null) desc.setAttribute('content', prevDesc);
      if (canonical && prevCanonical !== null) canonical.setAttribute('href', prevCanonical);
    };
  }, []);

  const goHome = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    navigate(ROUTES.home);
  };

  const goToArticle = (e: React.MouseEvent<HTMLAnchorElement>, slug: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    navigate(articleRoute(slug));
  };

  // URL asli buat tiap nomor halaman (dipakai sebagai href, bukan cuma state
  // internal) -- supaya kontrol paginasi jadi <a> yang beneran bisa di-crawl,
  // di-buka-tab-baru (cmd/ctrl-klik), dan tetap jalan sebelum JS termuat.
  // Cuma param `page` yang pernah masuk URL (search/kategori tetap di state
  // lokal, tidak di-encode ke URL), jadi cukup begini saja.
  const buildPageHref = (page: number): string => {
    const clamped = Math.min(Math.max(1, page), totalPages);
    return clamped <= 1 ? ROUTES.articles : `${ROUTES.articles}?page=${clamped}`;
  };

  const goToPageLink = (e: React.MouseEvent<HTMLAnchorElement>, page: number) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    goToPage(page);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setActiveCategory(null);
  };

  return (
    <div className="relative pt-28 md:pt-32 pb-16 md:pb-24 overflow-hidden">
      {/* Decorative background glow */}
      <div
        aria-hidden="true"
        className={`absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full blur-3xl opacity-15 pointer-events-none ${
          darkMode ? 'bg-teal-500' : 'bg-teal-300'
        }`}
      />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back link */}
        <a
          href={ROUTES.home}
          onClick={goHome}
          className={`inline-flex items-center gap-1.5 text-sm font-medium mb-10 rounded-md transition-colors hover:text-teal-500 ${FOCUS_RING} ${
            darkMode ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Kembali ke beranda
        </a>

        {/* Hero Section */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${
                darkMode
                  ? 'bg-teal-500/15 border border-teal-500/30'
                  : 'bg-teal-50 border border-teal-200'
              }`}
            >
              <FileText
                className={`w-6 h-6 ${darkMode ? 'text-teal-300' : 'text-teal-600'}`}
                aria-hidden="true"
              />
            </div>
            <div>
              <p
                className={`text-xs font-semibold uppercase tracking-wider ${
                  darkMode ? 'text-teal-300' : 'text-teal-700'
                }`}
              >
                Blog & Catatan
              </p>
              <div className="flex items-center gap-2">
                <h1
                  className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
                    darkMode ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  Artikel
                </h1>
                <span
                  className={`inline-flex items-center justify-center min-w-[2rem] h-7 px-2 rounded-full text-sm font-bold ${
                    darkMode
                      ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                      : 'bg-teal-50 text-teal-700 border border-teal-200'
                  }`}
                >
                  {published.length}
                </span>
              </div>
            </div>
          </div>
          <p
            className={`text-base sm:text-lg leading-relaxed max-w-2xl ${
              darkMode ? 'text-slate-300' : 'text-slate-600'
            }`}
          >
            Catatan teknis dan panduan praktis seputar pengembangan web, mobile app, dan chatbot —
            ditulis dari pengalaman menangani proyek nyata.
          </p>
        </header>

        {/* Search & Filter Section */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search
              className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${
                darkMode ? 'text-slate-500' : 'text-slate-400'
              }`}
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari artikel..."
              aria-label="Cari artikel"
              className={`w-full pl-11 pr-10 py-3 rounded-xl text-sm transition-all duration-200 ${FOCUS_RING} ${
                darkMode
                  ? 'bg-slate-900/60 border border-slate-800 text-white placeholder-slate-500 focus:border-teal-500/50'
                  : 'bg-white border border-slate-200 text-slate-900 placeholder-slate-400 shadow-sm focus:border-teal-400'
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Hapus pencarian"
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors ${
                  darkMode
                    ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                }`}
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveCategory(null)}
              aria-pressed={activeCategory === null}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${FOCUS_RING} ${
                activeCategory === null
                  ? darkMode
                    ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/25'
                    : 'bg-teal-600 text-white shadow-lg shadow-teal-600/25'
                  : darkMode
                  ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <Sparkles className="w-3 h-3" aria-hidden="true" />
              Semua
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                aria-pressed={activeCategory === cat}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${FOCUS_RING} ${
                  activeCategory === cat
                    ? darkMode
                      ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/25'
                      : 'bg-teal-600 text-white shadow-lg shadow-teal-600/25'
                    : darkMode
                    ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Active filter indicator */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2">
              <span
                className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}
              >
                Menampilkan {filtered.length} artikel
                {activeCategory && ` di kategori "${activeCategory}"`}
                {searchQuery.trim() && ` untuk "${searchQuery.trim()}"`}
              </span>
              <button
                type="button"
                onClick={clearFilters}
                className={`inline-flex items-center gap-1 text-xs font-semibold rounded-md px-2 py-1 transition-colors ${FOCUS_RING} ${
                  darkMode
                    ? 'text-teal-300 hover:bg-teal-500/10'
                    : 'text-teal-700 hover:bg-teal-50'
                }`}
              >
                <X className="w-3 h-3" aria-hidden="true" />
                Reset filter
              </button>
            </div>
          )}
        </div>

        {/* Articles List */}
        <div ref={listTopRef} className="scroll-mt-24" />
        {published.length === 0 ? (
          <div className="text-center py-16">
            <FileText
              className={`w-12 h-12 mx-auto mb-4 ${
                darkMode ? 'text-slate-700' : 'text-slate-300'
              }`}
              aria-hidden="true"
            />
            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Belum ada artikel yang dipublikasikan. Kembali lagi nanti.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          /* Empty state saat filter aktif tapi tidak ada hasil */
          <div className="text-center py-16">
            <Search
              className={`w-12 h-12 mx-auto mb-4 ${
                darkMode ? 'text-slate-700' : 'text-slate-300'
              }`}
              aria-hidden="true"
            />
            <p
              className={`text-sm font-medium mb-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              Tidak ada artikel yang cocok
            </p>
            <p className={`text-xs mb-4 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              Coba kata kunci lain atau reset filter.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className={`inline-flex items-center gap-1.5 text-sm font-semibold rounded-lg px-4 py-2 transition-colors ${FOCUS_RING} ${
                darkMode
                  ? 'bg-teal-500/15 text-teal-300 hover:bg-teal-500/25 border border-teal-500/30'
                  : 'bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200'
              }`}
            >
              <X className="w-4 h-4" aria-hidden="true" />
              Reset semua filter
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Featured card — artikel terbaru tampil besar dengan gambar penuh
                di atas. Cuma di halaman 1 tanpa filter, biar tidak ikut
                nongol lagi kalau user pindah ke halaman 2 dst. */}
            {!hasActiveFilters && currentPage === 1 && latestArticle && (
              <a
                href={articleRoute(latestArticle.slug)}
                onClick={(e) => goToArticle(e, latestArticle.slug)}
                className={`group relative block rounded-2xl border overflow-hidden transition-all duration-300 hover:-translate-y-1 ${FOCUS_RING} ${
                  darkMode
                    ? 'bg-slate-900/60 border-slate-800 hover:border-teal-500/50 hover:shadow-xl hover:shadow-teal-500/5'
                    : 'bg-white border-slate-200 shadow-sm hover:border-teal-400 hover:shadow-xl hover:shadow-teal-500/10'
                } animate-[fadeInUp_0.5s_ease-out_both]`}
              >
                <div className="relative">
                  <ArticleIllustration
                    slug={latestArticle.slug}
                    category={latestArticle.category}
                    darkMode={darkMode}
                    size="hero"
                    position="top"
                    edgeToEdge
                    className={`border-b ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}
                  />
                  {/* Badge terbaru di atas gambar */}
                  <div
                    aria-hidden="true"
                    className={`absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-lg ${
                      darkMode
                        ? 'bg-slate-950/80 backdrop-blur text-amber-300 border border-amber-500/30'
                        : 'bg-white/90 backdrop-blur text-amber-700 border border-amber-200'
                    }`}
                  >
                    ✨ Terbaru
                  </div>
                </div>

                <div className="p-5 sm:p-7">
                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-3 text-xs">
                    <span
                      className={`inline-flex items-center gap-1.5 font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full ${
                        darkMode
                          ? 'text-teal-300 bg-teal-500/10 border border-teal-500/20'
                          : 'text-teal-700 bg-teal-50 border border-teal-200'
                      }`}
                    >
                      <Sparkles className="w-3 h-3" aria-hidden="true" />
                      {latestArticle.category}
                    </span>

                    {latestArticle.publishedAt && (
                      <>
                        <span
                          className={`h-3 w-px ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}
                          aria-hidden="true"
                        />
                        <time
                          dateTime={toISODate(latestArticle.publishedAt)}
                          className={`inline-flex items-center gap-1 ${
                            darkMode ? 'text-slate-400' : 'text-slate-500'
                          }`}
                        >
                          <Calendar className="w-3 h-3" aria-hidden="true" />
                          {formatIDDate(latestArticle.publishedAt)}
                        </time>
                      </>
                    )}

                    <span
                      className={`h-3 w-px ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}
                      aria-hidden="true"
                    />
                    <span
                      className={`inline-flex items-center gap-1 ${
                        darkMode ? 'text-slate-500' : 'text-slate-400'
                      }`}
                    >
                      <Clock className="w-3 h-3" aria-hidden="true" />
                      {latestArticle.readMinutes} menit baca
                    </span>
                  </div>

                  {/* Title */}
                  <h2
                    className={`text-xl sm:text-2xl font-bold mb-2 leading-snug transition-colors group-hover:text-teal-500 ${
                      darkMode ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {latestArticle.title}
                  </h2>

                  {/* Excerpt */}
                  <p
                    className={`text-sm sm:text-base leading-relaxed mb-4 ${
                      darkMode ? 'text-slate-300' : 'text-slate-600'
                    }`}
                  >
                    {latestArticle.excerpt}
                  </p>

                  {/* Read more CTA */}
                  <span
                    className={`inline-flex items-center gap-1.5 text-sm font-semibold ${
                      darkMode ? 'text-teal-400' : 'text-teal-600'
                    }`}
                  >
                    Baca selengkapnya
                    <ArrowRight
                      className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </span>
                </div>
              </a>
            )}

            {/* Daftar artikel lainnya — thumbnail landscape di kiri, proporsional dengan rasio foto asli */}
            <div className="space-y-5">
              {pagedArticles.map((article, index) => (
                  <a
                    key={article.slug}
                    href={articleRoute(article.slug)}
                    onClick={(e) => goToArticle(e, article.slug)}
                    style={{ animationDelay: `${index * 80}ms` }}
                    className={`group relative block rounded-2xl border overflow-hidden transition-all duration-300 hover:-translate-y-1 ${FOCUS_RING} ${
                      darkMode
                        ? 'bg-slate-900/60 border-slate-800 hover:border-teal-500/50 hover:shadow-xl hover:shadow-teal-500/5'
                        : 'bg-white border-slate-200 shadow-sm hover:border-teal-400 hover:shadow-xl hover:shadow-teal-500/10'
                    } animate-[fadeInUp_0.5s_ease-out_both]`}
                  >
                    {/* Gradient accent bar (left), muncul saat hover */}
                    <div
                      aria-hidden="true"
                      className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                        darkMode ? 'from-teal-400 to-teal-600' : 'from-teal-500 to-teal-700'
                      }`}
                    />

                    <div className="flex flex-col sm:flex-row">
                      <ArticleIllustration
                        slug={article.slug}
                        category={article.category}
                        darkMode={darkMode}
                        size="middle"
                        position="top"
                        edgeToEdge
                        className="sm:w-56 md:w-64 shrink-0"
                      />
                      <div className="min-w-0 flex-1 p-5 sm:p-6">
                        {/* Meta row */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-3 text-xs">
                          <span
                            className={`inline-flex items-center gap-1.5 font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full ${
                              darkMode
                                ? 'text-teal-300 bg-teal-500/10 border border-teal-500/20'
                                : 'text-teal-700 bg-teal-50 border border-teal-200'
                            }`}
                          >
                            <Sparkles className="w-3 h-3" aria-hidden="true" />
                            {article.category}
                          </span>

                          {article.publishedAt && (
                            <>
                              <span
                                className={`h-3 w-px ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}
                                aria-hidden="true"
                              />
                              <time
                                dateTime={toISODate(article.publishedAt)}
                                className={`inline-flex items-center gap-1 ${
                                  darkMode ? 'text-slate-400' : 'text-slate-500'
                                }`}
                              >
                                <Calendar className="w-3 h-3" aria-hidden="true" />
                                {formatIDDate(article.publishedAt)}
                              </time>
                            </>
                          )}

                          <span
                            className={`h-3 w-px ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}
                            aria-hidden="true"
                          />
                          <span
                            className={`inline-flex items-center gap-1 ${
                              darkMode ? 'text-slate-500' : 'text-slate-400'
                            }`}
                          >
                            <Clock className="w-3 h-3" aria-hidden="true" />
                            {article.readMinutes} menit baca
                          </span>
                        </div>

                        {/* Title */}
                        <h2
                          className={`text-lg sm:text-xl font-bold mb-2 leading-snug transition-colors group-hover:text-teal-500 ${
                            darkMode ? 'text-white' : 'text-slate-900'
                          }`}
                        >
                          {article.title}
                        </h2>

                        {/* Excerpt */}
                        <p
                          className={`text-sm sm:text-[15px] leading-relaxed mb-4 ${
                            darkMode ? 'text-slate-300' : 'text-slate-600'
                          }`}
                        >
                          {article.excerpt}
                        </p>

                        {/* Read more CTA */}
                        <span
                          className={`inline-flex items-center gap-1.5 text-sm font-semibold ${
                            darkMode ? 'text-teal-400' : 'text-teal-600'
                          }`}
                        >
                          Baca selengkapnya
                          <ArrowRight
                            className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
                            aria-hidden="true"
                          />
                        </span>
                      </div>
                    </div>
                  </a>
                ))}
            </div>

            {/* Pagination — cuma tampil kalau daftar (di luar featured card) lebih dari 1 halaman */}
            {totalPages > 1 && (
              <nav
                aria-label="Navigasi halaman artikel"
                className="flex flex-col items-center gap-3 pt-4"
              >
                <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  Halaman {currentPage} dari {totalPages} &middot; {listArticles.length} artikel
                  {hasActiveFilters ? ' cocok' : ' lainnya'}
                </p>
                <div className="flex items-center gap-1.5">
                  {currentPage === 1 ? (
                    <span
                      aria-hidden="true"
                      className={`inline-flex items-center justify-center w-9 h-9 rounded-full opacity-30 cursor-not-allowed ${
                        darkMode
                          ? 'bg-slate-800/80 text-slate-300 border border-slate-700'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                    </span>
                  ) : (
                    <a
                      href={buildPageHref(currentPage - 1)}
                      onClick={(e) => goToPageLink(e, currentPage - 1)}
                      aria-label="Halaman sebelumnya"
                      className={`inline-flex items-center justify-center w-9 h-9 rounded-full transition-colors ${FOCUS_RING} ${
                        darkMode
                          ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                    </a>
                  )}

                  {getPageNumbers(currentPage, totalPages).map((page, i) =>
                    page === 'ellipsis' ? (
                      <span
                        key={`ellipsis-${i}`}
                        className={`w-9 h-9 inline-flex items-center justify-center text-sm ${
                          darkMode ? 'text-slate-600' : 'text-slate-400'
                        }`}
                        aria-hidden="true"
                      >
                        &hellip;
                      </span>
                    ) : page === currentPage ? (
                      <span
                        key={page}
                        aria-current="page"
                        className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-sm font-semibold ${
                          darkMode
                            ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/25'
                            : 'bg-teal-600 text-white shadow-lg shadow-teal-600/25'
                        }`}
                      >
                        {page}
                      </span>
                    ) : (
                      <a
                        key={page}
                        href={buildPageHref(page)}
                        onClick={(e) => goToPageLink(e, page)}
                        aria-label={`Ke halaman ${page}`}
                        className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-sm font-semibold transition-all duration-200 ${FOCUS_RING} ${
                          darkMode
                            ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                        }`}
                      >
                        {page}
                      </a>
                    )
                  )}

                  {currentPage === totalPages ? (
                    <span
                      aria-hidden="true"
                      className={`inline-flex items-center justify-center w-9 h-9 rounded-full opacity-30 cursor-not-allowed ${
                        darkMode
                          ? 'bg-slate-800/80 text-slate-300 border border-slate-700'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      <ChevronRight className="w-4 h-4" aria-hidden="true" />
                    </span>
                  ) : (
                    <a
                      href={buildPageHref(currentPage + 1)}
                      onClick={(e) => goToPageLink(e, currentPage + 1)}
                      aria-label="Halaman berikutnya"
                      className={`inline-flex items-center justify-center w-9 h-9 rounded-full transition-colors ${FOCUS_RING} ${
                        darkMode
                          ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      <ChevronRight className="w-4 h-4" aria-hidden="true" />
                    </a>
                  )}
                </div>
              </nav>
            )}
          </div>
        )}
      </div>

      {/* Keyframe animation */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};