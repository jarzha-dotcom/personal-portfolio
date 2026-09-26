import React, { useEffect, useRef, useState } from 'react';
import { Clock, Layers } from 'lucide-react';
import { getRelatedArticles, PILLARS } from '../data/articles';
import { useNavigationHistory } from '../context/NavigationHistoryContext';
import { articleRoute } from '../routes';
import { ArticleIllustration } from './ArticleIllustration';

interface RelatedArticlesProps {
  slug: string;
  darkMode: boolean;
  limit?: number;
}

// Section "Artikel Terkait" di halaman artikel, direkomendasikan berdasarkan
// PILAR yang sama (lihat getRelatedArticles di data/articles.ts) -- bukan
// cuma prev/next kronologis seperti navigasi di bagian bawah halaman.
//
// Perhitungan (getRelatedArticles) dan render card-nya sengaja ditunda
// sampai elemen trigger <div ref={triggerRef}> di bawah body artikel masuk
// viewport, dipantau lewat IntersectionObserver (bukan listener "scroll"
// biasa) supaya tidak menambah kerja di initial paint halaman & lebih ringan
// dari sisi performa saat discroll.
export const RelatedArticles: React.FC<RelatedArticlesProps> = ({
  slug,
  darkMode,
  limit = 3,
}) => {
  const { navigate } = useNavigationHistory();
  const triggerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Kalau slug berganti (pindah ke artikel lain tanpa full page reload),
  // reset supaya trigger dipasang ulang untuk artikel yang baru.
  useEffect(() => {
    setIsVisible(false);
  }, [slug]);

  useEffect(() => {
    if (isVisible) return;
    const el = triggerRef.current;

    // Fallback untuk browser tanpa dukungan IntersectionObserver: tampilkan
    // langsung daripada section-nya tidak pernah muncul sama sekali.
    if (!el || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px 0px' } // mulai render sedikit sebelum benar-benar terlihat
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isVisible, slug]);

  const related = isVisible ? getRelatedArticles(slug, limit) : [];

  const goToArticle = (e: React.MouseEvent<HTMLAnchorElement>, targetSlug: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    navigate(articleRoute(targetSlug));
  };

  // Belum waktunya render (belum masuk viewport) ATAU tidak ada rekomendasi
  // sama sekali (mis. baru 1 artikel published) -- tetap render div kosong
  // ber-ref supaya observer di atas tetap punya elemen untuk dipantau.
  if (isVisible && related.length === 0) {
    return null;
  }

  return (
    <div ref={triggerRef} className="mt-14 lg:mt-0">
      {isVisible && related.length > 0 && (
        <section aria-labelledby="related-articles-heading">
          <div className="flex items-center gap-2 mb-5">
            <Layers
              className={`w-4 h-4 ${darkMode ? 'text-teal-400' : 'text-teal-600'}`}
              aria-hidden="true"
            />
            <h2
              id="related-articles-heading"
              className={`text-xs font-semibold uppercase tracking-wider ${
                darkMode ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Artikel terkait
            </h2>
          </div>

          {/* 1 kolom di mobile, 3 kolom saat masih section lebar di bawah
              konten (sm–lg), balik ke 1 kolom di lg+ karena di situ komponen
              ini jadi sidebar sempit di samping artikel, bukan section penuh. */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4">
            {related.map((item) => (
              <a
                key={item.slug}
                href={articleRoute(item.slug)}
                onClick={(e) => goToArticle(e, item.slug)}
                className={`group flex flex-col rounded-xl border overflow-hidden transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${
                  darkMode
                    ? 'bg-slate-900/60 border-slate-800 hover:border-teal-500/50'
                    : 'bg-white border-slate-200 shadow-sm hover:border-teal-400 hover:shadow-md'
                }`}
              >
                <ArticleIllustration
                  slug={item.slug}
                  category={item.category}
                  darkMode={darkMode}
                  size="middle"
                  position="top"
                  edgeToEdge
                  className="aspect-[16/9]"
                />
                <div className="flex flex-col flex-1 p-4">
                  <span
                    className={`inline-flex self-start items-center text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full mb-2 ${
                      darkMode
                        ? 'text-teal-300 bg-teal-500/10 border border-teal-500/20'
                        : 'text-teal-700 bg-teal-50 border border-teal-200'
                    }`}
                  >
                    {PILLARS[item.pillar]}
                  </span>
                  <h3
                    className={`text-sm font-bold leading-snug mb-2 transition-colors group-hover:text-teal-500 ${
                      darkMode ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {item.title}
                  </h3>
                  <span
                    className={`mt-auto inline-flex items-center gap-1 text-xs ${
                      darkMode ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    <Clock className="w-3 h-3" aria-hidden="true" />
                    {item.readMinutes} menit baca
                  </span>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};