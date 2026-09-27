// Definisi rute client-side (React Router). Ubah slug di sini saja — Navbar,
// App, dan halaman terkait mengikuti. Kalau slug diganti, samakan juga di
// SPA_ROUTES di public/sw.js.
// (sitemap.xml TIDAK perlu disamakan manual lagi — sekarang digenerate
// otomatis oleh scripts/prerender.ts dari ROUTES + articles.ts.)
export const ROUTES = {
  home: '/',
  caseStudy: '/hasil-kerja',
  articles: '/artikel',
} as const;

export const articleRoute = (slug: string) => `${ROUTES.articles}/${slug}`;

// Domain kanonik situs — SATU-SATUNYA tempat nilai ini didefinisikan.
// Dipakai untuk og:url, canonical, breadcrumb JSON-LD, dan sitemap.xml, oleh:
// ArticlePage.tsx, ArticlesIndexPage.tsx, dan scripts/prerender.ts.
//
// index.html TIDAK bisa ikut import ini (dia HTML statis, bukan modul JS) —
// nilai og:url/canonical di sana harus disamakan MANUAL kalau domain ini
// berubah. scripts/prerender.ts otomatis mengecek kecocokan itu tiap build
// dan mencetak peringatan (bukan gagal build) kalau keduanya beda.
export const CANONICAL_BASE = 'https://arzhaning.my.id';