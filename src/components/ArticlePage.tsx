import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Clock, Calendar, Sparkles } from 'lucide-react';
import { getArticleBySlug, getAdjacentArticles } from '../data/articles';
import { useNavigationHistory } from '../context/NavigationHistoryContext';
import { ROUTES, articleRoute } from '../routes';
import { useBreadcrumbSchema } from '../hooks/useBreadcrumbSchema';
import { formatIDDate, toISODate } from '../utils/formatDate';
import { ReadingProgress } from '../components/ReadingProgress';
import { ShareButtons } from '../components/ShareButtons';
import { AuthorCard } from '../components/AuthorCard';
import { ArticleIllustration, hasArticleImages } from '../components/ArticleIllustration';
import { RelatedArticles } from '../components/RelatedArticles';

interface ArticlePageProps {
  darkMode: boolean;
}

const CANONICAL_BASE = 'https://arzhaning.my.id';

export const ArticlePage: React.FC<ArticlePageProps> = ({ darkMode }) => {
  const { slug } = useParams<{ slug: string }>();
  const { navigate } = useNavigationHistory();
  const article = slug ? getArticleBySlug(slug) : undefined;

  useBreadcrumbSchema(
    article
      ? [
          { name: 'Beranda', url: `${CANONICAL_BASE}/` },
          { name: 'Artikel', url: `${CANONICAL_BASE}${ROUTES.articles}` },
          { name: article.title, url: `${CANONICAL_BASE}${articleRoute(article.slug)}` },
        ]
      : [
          { name: 'Beranda', url: `${CANONICAL_BASE}/` },
          { name: 'Artikel', url: `${CANONICAL_BASE}${ROUTES.articles}` },
        ]
  );

  useEffect(() => {
    if (!article) return;
    const prevTitle = document.title;
    const desc = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const prevDesc = desc?.getAttribute('content') ?? null;
    const prevCanonical = canonical?.getAttribute('href') ?? null;

    document.title = `${article.title} | K. Arzhaning Jagad (Arzha)`;
    desc?.setAttribute('content', article.excerpt);
    canonical?.setAttribute('href', `${CANONICAL_BASE}${articleRoute(article.slug)}`);

    return () => {
      document.title = prevTitle;
      if (desc && prevDesc !== null) desc.setAttribute('content', prevDesc);
      if (canonical && prevCanonical !== null)
        canonical.setAttribute('href', prevCanonical);
    };
  }, [article]);

  const goTo = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    navigate(path);
  };

  const backLinkClass = `inline-flex items-center gap-1.5 text-sm font-medium mb-8 rounded-md transition-colors hover:text-teal-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${
    darkMode ? 'text-slate-400' : 'text-slate-500'
  }`;

  if (!article) {
    return (
      <div className="pt-28 md:pt-32 pb-16 md:pb-24">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1
            className={`text-2xl font-extrabold mb-3 ${
              darkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            Artikel tidak ditemukan
          </h1>
          <p className={`text-sm mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Artikel ini mungkin belum dipublikasikan atau sudah dipindahkan.
          </p>
          <a
            href={ROUTES.articles}
            onClick={(e) => goTo(e, ROUTES.articles)}
            className={backLinkClass}
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Lihat semua artikel
          </a>
        </div>
      </div>
    );
  }

  const { prev, next } = getAdjacentArticles(article.slug);
  const articleUrl = `${CANONICAL_BASE}${articleRoute(article.slug)}`;

  // Sisipkan gambar "middle" persis di tengah body artikel (hanya untuk slug
  // yang memang punya foto custom, biar artikel tanpa foto tidak dipaksa
  // menampilkan kotak ikon di tengah teks).
  const showMiddleImage = hasArticleImages(article.slug) && article.body.length > 1;
  const middleImageIndex = Math.ceil(article.body.length / 2);

  const navCardClass = (align: 'left' | 'right') =>
    `group flex-1 rounded-xl border p-4 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${
      align === 'right' ? 'text-right' : 'text-left'
    } ${
      darkMode
        ? 'bg-slate-900/60 border-slate-800 hover:border-teal-500/50 hover:-translate-y-0.5'
        : 'bg-white border-slate-200 shadow-sm hover:border-teal-400 hover:-translate-y-0.5 hover:shadow-md'
    }`;

  return (
    <>
      <ReadingProgress />
      <article className="relative pt-28 md:pt-32 pb-16 md:pb-24">
        {/* Decorative hero glow — overflow-hidden dipindah ke wrapper kecil
            ini sendiri (bukan di <article>), karena overflow selain visible
            di ancestor manapun akan mematikan position:sticky pada sidebar
            di bawah. */}
        <div
          className="absolute inset-x-0 top-0 h-[400px] overflow-hidden pointer-events-none"
          aria-hidden="true"
        >
          <div
            className={`absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-3xl opacity-20 ${
              darkMode ? 'bg-teal-500' : 'bg-teal-300'
            }`}
          />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,42rem)_1fr] gap-10 lg:gap-16 items-start">
            <div className="min-w-0">
              {/* Back link */}
              <a
                href={ROUTES.articles}
                onClick={(e) => goTo(e, ROUTES.articles)}
                className={backLinkClass}
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                Semua artikel
              </a>

              {/* Ilustrasi hero */}
              <ArticleIllustration
                slug={article.slug}
                category={article.category}
                darkMode={darkMode}
                size="hero"
                className="mb-8"
              />

              {/* Meta bar — kategori, tanggal, read time */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-4 text-xs">
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

              {/* Judul */}
              <h1
                className={`text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4 leading-[1.15] ${
                  darkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                {article.title}
              </h1>

              {/* Excerpt */}
              <p
                className={`text-lg sm:text-xl leading-relaxed mb-6 ${
                  darkMode ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                {article.excerpt}
              </p>

              {/* Share bar atas */}
              <div
                className={`flex items-center justify-between py-3 mb-8 border-y ${
                  darkMode ? 'border-slate-800' : 'border-slate-200'
                }`}
              >
                <ShareButtons
                  darkMode={darkMode}
                  url={articleUrl}
                  title={article.title}
                />
              </div>

              {/* Body artikel dengan drop cap di paragraf pertama */}
              <div
                className={`space-y-8 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}
              >
                {article.body.map((block, i) => {
                  const isFirstBlock = i === 0;
                  return (
                    <React.Fragment key={i}>
                      {showMiddleImage && i === middleImageIndex && (
                        <figure className="not-prose py-2">
                          <ArticleIllustration
                            slug={article.slug}
                            category={article.category}
                            darkMode={darkMode}
                            size="middle"
                            position="middle"
                          />
                        </figure>
                      )}
                      <div className="space-y-3">
                        {block.heading && (
                          <h2
                            className={`text-xl sm:text-2xl font-bold mt-10 first:mt-0 ${
                              darkMode ? 'text-white' : 'text-slate-900'
                            }`}
                          >
                            {block.heading}
                          </h2>
                        )}
                        {block.paragraphs.map((paragraph, j) => {
                          const isFirstParagraph = isFirstBlock && j === 0;
                          return (
                            <p
                              key={j}
                              className={`text-base sm:text-[17px] leading-[1.8] ${
                                isFirstParagraph
                                  ? darkMode
                                    ? 'first-letter:text-5xl first-letter:font-extrabold first-letter:text-teal-400 first-letter:mr-2 first-letter:float-left first-letter:leading-none first-letter:mt-1'
                                    : 'first-letter:text-5xl first-letter:font-extrabold first-letter:text-teal-600 first-letter:mr-2 first-letter:float-left first-letter:leading-none first-letter:mt-1'
                                  : ''
                              }`}
                            >
                              {paragraph}
                            </p>
                          );
                        })}
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Divider dekoratif sebelum Author Card */}
              <div
                className="flex items-center justify-center gap-3 my-14"
                aria-hidden="true"
              >
                <span
                  className={`h-px flex-1 max-w-[80px] ${
                    darkMode ? 'bg-slate-800' : 'bg-slate-200'
                  }`}
                />
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    darkMode ? 'bg-teal-500' : 'bg-teal-500'
                  }`}
                />
                <span
                  className={`w-2 h-2 rounded-full ${
                    darkMode ? 'bg-teal-400' : 'bg-teal-500'
                  }`}
                />
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    darkMode ? 'bg-teal-500' : 'bg-teal-500'
                  }`}
                />
                <span
                  className={`h-px flex-1 max-w-[80px] ${
                    darkMode ? 'bg-slate-800' : 'bg-slate-200'
                  }`}
                />
              </div>

              {/* Author Card */}
              <AuthorCard darkMode={darkMode} />

              {/* Share bar bawah (di atas navigasi) */}
              <div
                className={`flex items-center justify-between py-4 mt-10 border-t ${
                  darkMode ? 'border-slate-800' : 'border-slate-200'
                }`}
              >
                <span
                  className={`text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  Suka artikel ini?
                </span>
                <ShareButtons
                  darkMode={darkMode}
                  url={articleUrl}
                  title={article.title}
                />
              </div>

              {/* Navigasi prev/next */}
              {(prev || next) && (
                <nav
                  aria-label="Navigasi artikel"
                  className={`mt-8 pt-8 border-t flex flex-col sm:flex-row gap-3 ${
                    darkMode ? 'border-slate-800' : 'border-slate-200'
                  }`}
                >
                  {prev ? (
                    <a
                      href={articleRoute(prev.slug)}
                      onClick={(e) => goTo(e, articleRoute(prev.slug))}
                      className={navCardClass('left')}
                    >
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold mb-1 ${
                          darkMode ? 'text-slate-500' : 'text-slate-400'
                        }`}
                      >
                        <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                        Artikel sebelumnya
                      </span>
                      <span
                        className={`block text-sm font-bold leading-snug group-hover:text-teal-500 transition-colors ${
                          darkMode ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        {prev.title}
                      </span>
                    </a>
                  ) : (
                    <div className="flex-1" />
                  )}
                  {next ? (
                    <a
                      href={articleRoute(next.slug)}
                      onClick={(e) => goTo(e, articleRoute(next.slug))}
                      className={navCardClass('right')}
                    >
                      <span
                        className={`inline-flex items-center justify-end gap-1.5 text-xs font-semibold mb-1 ${
                          darkMode ? 'text-slate-500' : 'text-slate-400'
                        }`}
                      >
                        Artikel selanjutnya
                        <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </span>
                      <span
                        className={`block text-sm font-bold leading-snug group-hover:text-teal-500 transition-colors ${
                          darkMode ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        {next.title}
                      </span>
                    </a>
                  ) : (
                    <div className="flex-1" />
                  )}
                </nav>
              )}
            </div>

            {/* Sidebar Artikel Terkait — sticky di layar lebar (lg+), turun jadi
            section biasa di bawah konten saat layar sempit (grid-cols-1). */}
            <aside
              className={`lg:sticky lg:top-28 lg:border-l lg:pl-10 ${
                darkMode ? 'lg:border-slate-800' : 'lg:border-slate-200'
              }`}
            >
              <RelatedArticles slug={article.slug} darkMode={darkMode} />
            </aside>
          </div>
        </div>
      </article>
    </>
  );
};