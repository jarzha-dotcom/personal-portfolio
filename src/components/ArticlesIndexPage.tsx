import React, { useEffect } from 'react';
import { ArrowLeft, ArrowRight, Clock } from 'lucide-react';
import { ARTICLES } from '../data/articles';
import { useNavigationHistory } from '../context/NavigationHistoryContext';
import { ROUTES, articleRoute } from '../routes';

interface ArticlesIndexPageProps {
  darkMode: boolean;
}

const PAGE_TITLE = 'Artikel | K. Arzhaning Jagad (Arzha)';
const PAGE_DESCRIPTION =
  'Catatan teknis dan panduan seputar pengembangan web, mobile app, dan chatbot — dari pengalaman menangani proyek nyata.';
const CANONICAL_URL = 'https://arzhaning.my.id/artikel';

const FOCUS_RING =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent';

export const ArticlesIndexPage: React.FC<ArticlesIndexPageProps> = ({ darkMode }) => {
  const { navigate } = useNavigationHistory();
  const published = ARTICLES.filter((a) => a.published);

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

  return (
    <div className="pt-28 md:pt-32 pb-16 md:pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <a
          href={ROUTES.home}
          onClick={goHome}
          className={`inline-flex items-center gap-1.5 text-sm font-medium mb-8 rounded-md transition-colors hover:text-teal-500 ${FOCUS_RING} ${
            darkMode ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Kembali ke beranda
        </a>

        <header className="max-w-2xl mb-10">
          <h1
            className={`text-3xl sm:text-4xl font-extrabold tracking-tight mb-3 ${
              darkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            Artikel
          </h1>
          <p className={`text-base leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            Catatan teknis dan panduan praktis seputar pengembangan web, mobile app, dan chatbot.
          </p>
        </header>

        {published.length === 0 ? (
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Belum ada artikel yang dipublikasikan. Kembali lagi nanti.
          </p>
        ) : (
          <div className="space-y-4">
            {published.map((article) => (
              <a
                key={article.slug}
                href={articleRoute(article.slug)}
                onClick={(e) => goToArticle(e, article.slug)}
                className={`block rounded-2xl border p-5 sm:p-6 transition-colors ${FOCUS_RING} ${
                  darkMode
                    ? 'bg-slate-900/60 border-slate-800 hover:border-teal-500/50'
                    : 'bg-white border-slate-200 shadow-sm hover:border-teal-400'
                }`}
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2 text-xs">
                  <span
                    className={`font-semibold uppercase tracking-wide ${
                      darkMode ? 'text-teal-300' : 'text-teal-700'
                    }`}
                  >
                    {article.category}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 ${
                      darkMode ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    <Clock className="w-3 h-3" aria-hidden="true" />
                    {article.readMinutes} menit baca
                  </span>
                </div>
                <h2
                  className={`text-lg font-bold mb-1.5 ${darkMode ? 'text-white' : 'text-slate-900'}`}
                >
                  {article.title}
                </h2>
                <p className={`text-sm leading-relaxed mb-3 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  {article.excerpt}
                </p>
                <span
                  className={`inline-flex items-center gap-1 text-sm font-semibold ${
                    darkMode ? 'text-teal-400' : 'text-teal-600'
                  }`}
                >
                  Baca selengkapnya
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
