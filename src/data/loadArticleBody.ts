// Loader isi artikel untuk BROWSER (dipakai ArticlePage.tsx).
//
// Memakai import.meta.glob, fitur khusus Vite — jadi file ini JANGAN diimpor
// dari scripts/prerender.ts (jalan di Node lewat tsx, tidak ada glob di sana).
// Prerender memuat file pilar sendiri lewat import() dinamis biasa.
//
// Vite memecah tiap file di ./article-bodies/ jadi chunk JS sendiri, sehingga
// isi sebuah pilar baru diunduh saat artikel di pilar itu dibuka.
import { ARTICLES, type ArticleBlock } from './articles';

const bodyLoaders = import.meta.glob<{ bodies: Record<string, ArticleBlock[]> }>(
  './article-bodies/*.ts'
);

// Return null kalau artikel/file pilar/isinya tidak ada, atau gagal dimuat.
export const loadArticleBody = async (slug: string): Promise<ArticleBlock[] | null> => {
  const article = ARTICLES.find((a) => a.slug === slug);
  if (!article) return null;
  const load = bodyLoaders[`./article-bodies/${article.pillar}.ts`];
  if (!load) return null;
  try {
    return (await load()).bodies[slug] ?? null;
  } catch {
    return null;
  }
};
