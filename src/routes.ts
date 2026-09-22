// Definisi rute client-side (React Router). Ubah slug di sini saja — Navbar,
// App, dan halaman terkait mengikuti. Kalau slug diganti, samakan juga di
// public/sitemap.xml dan SPA_ROUTES di public/sw.js.
export const ROUTES = {
  home: '/',
  caseStudy: '/hasil-kerja',
  articles: '/artikel',
} as const;

export const articleRoute = (slug: string) => `${ROUTES.articles}/${slug}`;
