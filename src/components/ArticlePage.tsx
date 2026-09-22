import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';
import { getArticleBySlug } from '../data/articles';
import { useNavigationHistory } from '../context/NavigationHistoryContext';
import { ROUTES, articleRoute } from '../routes';

interface ArticlePageProps {
  darkMode: boolean;
}

const CANONICAL_BASE = 'https://arzhaning.my.id';

export const ArticlePage: React.FC<ArticlePageProps> = ({ darkMode }) => {
  const { slug } = useParams<{ slug: string }>();
  const { navigate } = useNavigationHistory();
  const article = slug ? getArticleBySlug(slug) : undefined;

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
      if (canonical && prevCanonical !== null) canonical.setAttribute('href', prevCanonical);
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

  // Slug tidak ditemukan atau belum published — jangan tebak-tebak
  // maksud user, cukup arahkan balik ke daftar artikel.
  if (!article) {
    return (
      <div className="pt-28 md:pt-32 pb-16 md:pb-24">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className={`text-2xl font-extrabold mb-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Artikel tidak ditemukan
          </h1>
          <p className={`text-sm mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Artikel ini mungkin belum dipublikasikan atau sudah dipindahkan.
          </p>
          <a href={ROUTES.articles} onClick={(e) => goTo(e, ROUTES.articles)} className={backLinkClass}>
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Lihat semua artikel
          </a>
        </div>
      </div>
    );
  }

  return (
    <article className="pt-28 md:pt-32 pb-16 md:pb-24">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <a href={ROUTES.articles} onClick={(e) => goTo(e, ROUTES.articles)} className={backLinkClass}>
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Semua artikel
        </a>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3 text-xs">
          <span className={`font-semibold uppercase tracking-wide ${darkMode ? 'text-teal-300' : 'text-teal-700'}`}>
            {article.category}
          </span>
          <span className={`inline-flex items-center gap-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            <Clock className="w-3 h-3" aria-hidden="true" />
            {article.readMinutes} menit baca
          </span>
        </div>

        <h1
          className={`text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 ${
            darkMode ? 'text-white' : 'text-slate-900'
          }`}
        >
          {article.title}
        </h1>

        <p className={`text-lg leading-relaxed mb-8 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
          {article.excerpt}
        </p>

        <div className={`space-y-8 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
          {article.body.map((block, i) => (
            <div key={i} className="space-y-3">
              {block.heading && (
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  {block.heading}
                </h2>
              )}
              {block.paragraphs.map((paragraph, j) => (
                <p key={j} className="text-base leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          ))}
        </div>
      </div>
    </article>
  );
};