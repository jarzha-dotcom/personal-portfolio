// scripts/prerender.ts
//
// Generate HTML statis per-route langsung dari data (src/data/*.ts) — tanpa
// merender komponen React di Node. Dijalankan sebagai langkah "postbuild"
// setelah `vite build`, jadi template yang dipakai adalah dist/index.html
// yang SUDAH dibangun Vite (path asset sudah di-hash, CSS Tailwind sudah
// final). Script ini hanya:
//   1. Mengganti tag SEO di <head> (title, description, canonical, og:*,
//      twitter:*, + breadcrumb JSON-LD) sesuai halaman.
//   2. Mengganti isi "Semantic Static Shell" di dalam <div id="root">
//      dengan konten statis sesuai halaman itu.
// Sisanya (splash screen, <script type="module">, dst) dibiarkan utuh, jadi
// begitu JS jalan, React tetap mount seperti biasa dan menimpa isi #root
// (lihat MutationObserver di index.html) — tidak ada risiko hydration
// mismatch karena ini bukan hydrateRoot, cuma createRoot().render().
//
// Jalankan manual: npm run prerender (setelah ada dist/index.html)
// Otomatis: npm run build (lihat "postbuild" di package.json)

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ARTICLES, getAdjacentArticles, getRelatedArticles, type Article } from '../src/data/articles.ts';
import { PROJECTS, CONTACT_INFO } from '../src/data/portfolioData.ts';
import { TESTIMONIALS } from '../src/data/testimonials.ts';
import { ROUTES, articleRoute } from '../src/routes.ts';
import { formatIDDate, toISODate } from '../src/utils/formatDate.ts';
import type { ProjectItem } from '../src/types.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');
const DIST_DIR = join(ROOT_DIR, 'dist');
const VERCEL_JSON_PATH = join(ROOT_DIR, 'vercel.json');

const CANONICAL_BASE = 'https://arzhaning.my.id';
const SITE_SUFFIX = 'K. Arzhaning Jagad (Arzha)';
const ARTICLES_PER_PAGE = 9;

// ---------------------------------------------------------------------------
// Util dasar
// ---------------------------------------------------------------------------

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const jsonLdScript = (data: unknown): string => {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return `<script type="application/ld+json">${json}</script>`;
};

const breadcrumbJsonLd = (items: { name: string; url: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: item.name,
    item: item.url,
  })),
});

// ---------------------------------------------------------------------------
// Template dist/index.html — head & shell #root
// ---------------------------------------------------------------------------

let baseHtmlCache: string | null = null;
const readBaseHtml = (): string => {
  if (baseHtmlCache) return baseHtmlCache;
  const path = join(DIST_DIR, 'index.html');
  if (!existsSync(path)) {
    throw new Error(
      `[prerender] dist/index.html tidak ditemukan di ${path}. ` +
        `Jalankan "vite build" dulu sebelum prerender (script ini butuh HTML hasil build, bukan index.html sumber).`
    );
  }
  baseHtmlCache = readFileSync(path, 'utf-8');
  return baseHtmlCache;
};

interface HeadOptions {
  title: string;
  description: string;
  canonicalUrl: string;
  breadcrumb: { name: string; url: string }[];
  extraJsonLd?: unknown[];
}

const REQUIRED_HEAD_ANCHORS = [
  /<title>[\s\S]*?<\/title>/,
  /<meta name="description"\s+content="[^"]*"\s*\/>/,
  /<link rel="canonical" href="[^"]*" \/>/,
  /<meta property="og:url" content="[^"]*" \/>/,
  /<meta property="og:title" content="[^"]*" \/>/,
  /<meta property="og:description"\s+content="[^"]*"\s*\/>/,
  /<meta name="twitter:title" content="[^"]*" \/>/,
  /<meta name="twitter:description"\s+content="[^"]*"\s*\/>/,
];

const applyHead = (html: string, opts: HeadOptions): string => {
  // Guard: kalau salah satu pola tag ini sudah tidak ada di dist/index.html
  // (misal index.html sumber diubah strukturnya), gagal keras dengan pesan
  // jelas — daripada diam-diam menghasilkan halaman dengan title/canonical
  // homepage yang salah tempel ke semua artikel.
  for (const pattern of REQUIRED_HEAD_ANCHORS) {
    if (!pattern.test(html)) {
      throw new Error(
        `[prerender] Tag head yang diharapkan tidak ditemukan di dist/index.html (pola: ${pattern}). ` +
          `Kemungkinan struktur index.html sumber berubah — sesuaikan REQUIRED_HEAD_ANCHORS/applyHead di scripts/prerender.ts.`
      );
    }
  }

  const title = `${escapeHtml(opts.title)} | ${SITE_SUFFIX}`;
  const desc = escapeHtml(opts.description);
  const url = opts.canonicalUrl;

  let out = html;
  out = out.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
  out = out.replace(
    /<meta name="description"\s+content="[^"]*"\s*\/>/,
    `<meta name="description" content="${desc}" />`
  );
  out = out.replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${url}" />`);
  out = out.replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${url}" />`);
  out = out.replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${title}" />`);
  out = out.replace(
    /<meta property="og:description"\s+content="[^"]*"\s*\/>/,
    `<meta property="og:description" content="${desc}" />`
  );
  out = out.replace(/<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${title}" />`);
  out = out.replace(
    /<meta name="twitter:description"\s+content="[^"]*"\s*\/>/,
    `<meta name="twitter:description" content="${desc}" />`
  );

  // Breadcrumb + JSON-LD tambahan disisipkan tepat sebelum </head>.
  const ldScripts = [breadcrumbJsonLd(opts.breadcrumb), ...(opts.extraJsonLd ?? [])]
    .map(jsonLdScript)
    .join('\n  ');
  out = out.replace('</head>', `  ${ldScripts}\n</head>`);

  return out;
};

const ROOT_OPEN_TAG = '<div id="root">';
const SPLASH_HIDE_MARKER = '<!-- Menyembunyikan splash';

const replaceRootShell = (html: string, innerHtml: string): string => {
  const rootOpenIdx = html.indexOf(ROOT_OPEN_TAG);
  const splashIdx = html.indexOf(SPLASH_HIDE_MARKER);
  if (rootOpenIdx === -1 || splashIdx === -1) {
    throw new Error(
      '[prerender] Penanda <div id="root"> atau komentar "Menyembunyikan splash" tidak ditemukan di dist/index.html. ' +
        'Struktur index.html sumber kemungkinan berubah — sesuaikan replaceRootShell di scripts/prerender.ts.'
    );
  }
  const contentStart = rootOpenIdx + ROOT_OPEN_TAG.length;
  const rootCloseIdx = html.lastIndexOf('</div>', splashIdx);
  if (rootCloseIdx === -1 || rootCloseIdx < contentStart) {
    throw new Error('[prerender] Tidak menemukan tag penutup </div> untuk #root sebelum splash script.');
  }

  const before = html.slice(0, contentStart);
  const after = html.slice(rootCloseIdx); // mulai dari '</div>' penutup #root

  return `${before}\n${innerHtml}\n  ${after}`;
};

const writePage = (routePath: string, html: string) => {
  // routePath contoh: '/hasil-kerja', '/artikel', '/artikel/page/2', '/artikel/<slug>'
  const outDir = join(DIST_DIR, routePath.replace(/^\//, ''));
  mkdirSync(outDir, { recursive: true });
  const outFile = join(outDir, 'index.html');
  writeFileSync(outFile, html, 'utf-8');
  return outFile;
};

// ---------------------------------------------------------------------------
// Komponen HTML kecil (inline style — TIDAK pakai class Tailwind arbitrary,
// karena file ini di luar cakupan content-scan Tailwind v4 sehingga class
// baru yang ditulis di sini akan ke-purge dari CSS hasil build. Warna
// mengikuti token yang sudah dipakai di "Semantic Static Shell" index.html:
// teal #0d9488, heading #0f172a/#1e293b, body #475569/#64748b, border
// #e2e8f0.)
// ---------------------------------------------------------------------------

const styleSection = 'margin-bottom: 3rem;';
const styleH2 =
  'font-size: 1.5rem; font-weight: 700; color: #1e293b; border-bottom: 2px solid #0d9488; padding-bottom: 0.5rem;';
const styleCard = 'padding: 1.25rem; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;';
const styleMetaText = 'color: #64748b; font-size: 0.85rem; margin: 0 0 0.5rem 0;';
const styleBodyText = 'color: #475569; line-height: 1.7;';
const styleBackLink =
  'display: inline-flex; align-items: center; gap: 0.375rem; color: #0d9488; font-weight: 600; text-decoration: none; margin-bottom: 1.5rem;';

const pageHeader = (title: string, subtitle: string, breadcrumbLabel: string) => `
    <header style="padding: 2rem 1rem; max-width: 1200px; margin: 0 auto;">
      <a href="/" style="${styleBackLink}">&larr; Beranda</a>
      <nav aria-label="Breadcrumb" style="font-size: 0.8rem; color: #94a3b8; margin-bottom: 0.75rem;">
        <a href="/" style="color: #94a3b8; text-decoration: none;">Beranda</a> / ${escapeHtml(breadcrumbLabel)}
      </nav>
      <h1 style="font-size: 2rem; font-weight: 800; color: #0d9488; margin-bottom: 0.5rem;">${escapeHtml(title)}</h1>
      <p style="font-size: 1.05rem; color: #475569; max-width: 760px;">${escapeHtml(subtitle)}</p>
    </header>`;

const pageFooter = () => `
    <footer style="text-align: center; padding: 2rem 1rem; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 0.9rem; max-width: 1200px; margin: 0 auto;">
      <p>&copy; 2026 K. Arzhaning Jagad (Arzha) &bull; Cibitung, Bekasi, Jawa Barat, Indonesia.</p>
      <p><a href="/" style="color: #0d9488; font-weight: 600;">Hubungi lewat halaman utama &rarr;</a></p>
    </footer>`;

// ---------------------------------------------------------------------------
// Halaman: /hasil-kerja
// ---------------------------------------------------------------------------

const buildHasilKerjaPage = () => {
  const approvedTestimonials = TESTIMONIALS.filter((t) => t.approved);
  const testimonialByProject = new Map(approvedTestimonials.map((t) => [t.projectId, t]));

  const renderProject = (project: ProjectItem) => {
    const testimonial = testimonialByProject.get(project.id);
    const bc = project.businessCase;
    return `
        <article style="${styleCard} margin-bottom: 1rem;">
          <h3 style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin: 0 0 0.25rem 0;">
            ${escapeHtml(project.title)}${project.client ? ` <span style="font-weight: 500; color: #0d9488; font-size: 0.85rem;">&mdash; Klien: ${escapeHtml(project.client)}</span>` : ''}
          </h3>
          <p style="${styleMetaText}">${escapeHtml(project.badge)} &bull; ${escapeHtml(project.year)} &bull; ${escapeHtml(project.role)}</p>
          <p style="${styleBodyText}">${escapeHtml(project.description)}</p>
          ${
            bc
              ? `
          <div style="margin-top: 0.75rem; display: grid; gap: 0.5rem;">
            <p style="${styleBodyText}"><strong style="color: #0f172a;">Masalah:</strong> ${escapeHtml(bc.problem)}</p>
            <p style="${styleBodyText}"><strong style="color: #0f172a;">Solusi:</strong> ${escapeHtml(bc.solution)}</p>
            <p style="${styleBodyText}"><strong style="color: #0f172a;">Hasil:</strong> ${escapeHtml(bc.impact)}</p>
          </div>`
              : ''
          }
          <ul style="margin: 0.75rem 0 0 0; padding-left: 1.1rem; color: #475569;">
            ${project.highlights.map((h) => `<li style="margin-bottom: 0.25rem;">${escapeHtml(h)}</li>`).join('\n            ')}
          </ul>
          <p style="margin-top: 0.75rem; font-size: 0.8rem; color: #94a3b8;">
            ${project.techStack.map(escapeHtml).join(' &bull; ')}
          </p>
          ${
            testimonial
              ? `
          <blockquote style="margin: 1rem 0 0 0; padding: 0.75rem 1rem; border-left: 3px solid #0d9488; background: #f0fdfa; color: #334155; font-style: italic;">
            &ldquo;${escapeHtml(testimonial.quote)}&rdquo;
            <footer style="margin-top: 0.5rem; font-style: normal; font-size: 0.85rem; color: #64748b;">
              &mdash; ${escapeHtml(testimonial.author)}${testimonial.role ? `, ${escapeHtml(testimonial.role)}` : ''}${testimonial.company ? ` (${escapeHtml(testimonial.company)})` : ''}
            </footer>
          </blockquote>`
              : ''
          }
          ${
            project.demoUrl
              ? `<p style="margin-top: 0.75rem;"><a href="${escapeHtml(project.demoUrl)}" target="_blank" rel="noopener noreferrer" style="color: #0d9488; font-weight: 600;">Coba demo langsung &rarr;</a></p>`
              : ''
          }
        </article>`;
  };

  const title = 'Hasil Kerja & Studi Kasus';
  const description =
    'Studi kasus proyek nyata: sistem manajemen aset klien, platform board game multiplayer, dan aplikasi edukasi anak — lengkap dengan masalah, solusi, dan hasilnya.';
  const canonicalUrl = `${CANONICAL_BASE}${ROUTES.caseStudy}`;

  const inner = `
    <div id="prerendered-shell">${pageHeader(
      title,
      description,
      'Hasil Kerja'
    )}
      <main style="max-width: 1200px; margin: 0 auto; padding: 0 1rem;">
        <section style="${styleSection}">
          <h2 style="${styleH2}">Proyek</h2>
          <div style="margin-top: 1rem;">
            ${PROJECTS.map(renderProject).join('\n            ')}
          </div>
        </section>
      </main>${pageFooter()}
    </div>`;

  const softwareApplicationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Hasil Kerja & Studi Kasus K. Arzhaning Jagad',
    itemListElement: PROJECTS.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'SoftwareApplication',
        name: p.title,
        applicationCategory: p.category,
        url: p.demoUrl,
        description: p.description,
      },
    })),
  };

  const html = applyHead(readBaseHtml(), {
    title,
    description,
    canonicalUrl,
    breadcrumb: [
      { name: 'Beranda', url: `${CANONICAL_BASE}/` },
      { name: 'Hasil Kerja', url: canonicalUrl },
    ],
    extraJsonLd: [softwareApplicationJsonLd],
  });

  const finalHtml = replaceRootShell(html, inner);
  return writePage(ROUTES.caseStudy, finalHtml);
};

// ---------------------------------------------------------------------------
// Halaman: /artikel (+ /artikel/page/N)
// ---------------------------------------------------------------------------

const publishedArticles = (): Article[] => ARTICLES.filter((a) => a.published);

const renderArticleListItem = (article: Article) => `
          <li style="${styleCard} margin-bottom: 1rem; list-style: none;">
            <p style="${styleMetaText}">
              <span style="color: #0d9488; font-weight: 600;">${escapeHtml(article.category)}</span>
              ${article.publishedAt ? ` &bull; <time datetime="${toISODate(article.publishedAt)}">${escapeHtml(formatIDDate(article.publishedAt))}</time>` : ''}
              &bull; ${article.readMinutes} menit baca
            </p>
            <h3 style="font-size: 1.15rem; font-weight: 700; margin: 0 0 0.35rem 0;">
              <a href="${articleRoute(article.slug)}" style="color: #0f172a; text-decoration: none;">${escapeHtml(article.title)}</a>
            </h3>
            <p style="${styleBodyText}">${escapeHtml(article.excerpt)}</p>
          </li>`;

// Meniru PERSIS logika ArticlesIndexPage.tsx: artikel ter-baru (published[0])
// tampil sebagai featured card TERPISAH cuma di halaman 1, dan tidak ikut
// dihitung ke kuota per-halaman daftar biasa di bawahnya. Paginationnya
// sendiri di React pakai query param (?page=N, lewat useSearchParams), BUKAN
// path segment — jadi file statis /artikel/page/N/index.html di sini tetap
// dibuat (perlu file fisik buat destination rewrite), tapi semua href/
// canonical/rel-next-prev yang ditulis ke HTML memakai bentuk ?page=N supaya
// persis sama dengan URL yang dipakai React setelah hydrate.
const buildArtikelIndexPages = () => {
  const published = publishedArticles();
  const featured = published[0] ?? null;
  const listArticles = featured ? published.slice(1) : published;
  const totalPages = Math.max(1, Math.ceil(listArticles.length / ARTICLES_PER_PAGE));
  const outputs: string[] = [];

  const pageUrl = (page: number) => (page <= 1 ? ROUTES.articles : `${ROUTES.articles}?page=${page}`);

  for (let page = 1; page <= totalPages; page++) {
    const pageItems = listArticles.slice((page - 1) * ARTICLES_PER_PAGE, page * ARTICLES_PER_PAGE);
    // Path FILE fisik tetap per-halaman (dibutuhkan sebagai rewrite
    // destination) — beda dari path yang tampil di URL (yang pakai ?page=).
    const outputPath = page === 1 ? ROUTES.articles : `${ROUTES.articles}/page/${page}`;
    const canonicalUrl = `${CANONICAL_BASE}${pageUrl(page)}`;
    const title = page === 1 ? 'Artikel' : `Artikel — Halaman ${page}`;
    const description =
      'Catatan teknis dan panduan seputar pengembangan web, mobile app, dan chatbot — dari pengalaman menangani proyek nyata.';

    let paginationNav = '';
    if (totalPages > 1) {
      const prevHref = page > 1 ? pageUrl(page - 1) : null;
      const nextHref = page < totalPages ? pageUrl(page + 1) : null;
      paginationNav = `
        <nav aria-label="Navigasi halaman artikel" style="display: flex; justify-content: space-between; margin-top: 1.5rem; font-weight: 600;">
          ${prevHref ? `<a href="${prevHref}" style="color: #0d9488;">&larr; Halaman sebelumnya</a>` : '<span></span>'}
          <span style="color: #94a3b8; font-weight: 400;">Halaman ${page} dari ${totalPages}</span>
          ${nextHref ? `<a href="${nextHref}" style="color: #0d9488;">Halaman selanjutnya &rarr;</a>` : '<span></span>'}
        </nav>`;
    }

    const featuredHtml =
      page === 1 && featured
        ? `
        <li style="${styleCard} margin-bottom: 1.5rem; list-style: none; border-color: #0d9488;">
          <p style="${styleMetaText}">
            <span style="color: #b45309; font-weight: 700;">&#10024; Terbaru</span> &bull;
            <span style="color: #0d9488; font-weight: 600;">${escapeHtml(featured.category)}</span>
            ${featured.publishedAt ? ` &bull; <time datetime="${toISODate(featured.publishedAt)}">${escapeHtml(formatIDDate(featured.publishedAt))}</time>` : ''}
            &bull; ${featured.readMinutes} menit baca
          </p>
          <h2 style="font-size: 1.35rem; font-weight: 800; margin: 0 0 0.35rem 0;">
            <a href="${articleRoute(featured.slug)}" style="color: #0f172a; text-decoration: none;">${escapeHtml(featured.title)}</a>
          </h2>
          <p style="${styleBodyText}">${escapeHtml(featured.excerpt)}</p>
        </li>`
        : '';

    const inner = `
    <div id="prerendered-shell">${pageHeader(title, description, page === 1 ? 'Artikel' : `Artikel / Halaman ${page}`)}
      <main style="max-width: 800px; margin: 0 auto; padding: 0 1rem;">
        <ul style="padding: 0; margin: 0;">
          ${featuredHtml}
          ${pageItems.map(renderArticleListItem).join('\n          ')}
        </ul>
        ${paginationNav}
      </main>${pageFooter()}
    </div>`;

    let html = applyHead(readBaseHtml(), {
      title,
      description,
      canonicalUrl,
      breadcrumb: [
        { name: 'Beranda', url: `${CANONICAL_BASE}/` },
        { name: 'Artikel', url: `${CANONICAL_BASE}${ROUTES.articles}` },
        ...(page > 1 ? [{ name: `Halaman ${page}`, url: canonicalUrl }] : []),
      ],
    });

    // rel=prev/next — sinyal pagination standar untuk crawler (memakai URL
    // ?page=N yang sama dengan yang dipakai React, bukan path /page/N).
    const relLinks: string[] = [];
    if (page > 1) relLinks.push(`<link rel="prev" href="${CANONICAL_BASE}${pageUrl(page - 1)}" />`);
    if (page < totalPages) relLinks.push(`<link rel="next" href="${CANONICAL_BASE}${pageUrl(page + 1)}" />`);
    if (relLinks.length) {
      html = html.replace('</head>', `  ${relLinks.join('\n  ')}\n</head>`);
    }

    const finalHtml = replaceRootShell(html, inner);
    outputs.push(writePage(outputPath, finalHtml));
  }

  return { outputs, totalPages, publishedCount: published.length, pageUrl };
};

// ---------------------------------------------------------------------------
// Halaman: /artikel/<slug>
// ---------------------------------------------------------------------------

const buildArticlePage = (article: Article) => {
  const { prev, next } = getAdjacentArticles(article.slug);
  const canonicalUrl = `${CANONICAL_BASE}${articleRoute(article.slug)}`;

  const bodyHtml = article.body
    .map((block) => {
      const heading = block.heading
        ? `<h2 style="font-size: 1.3rem; font-weight: 700; color: #0f172a; margin: 1.75rem 0 0.5rem 0;">${escapeHtml(block.heading)}</h2>`
        : '';
      const paragraphs = block.paragraphs
        .map((p) => `<p style="${styleBodyText} margin: 0 0 1rem 0;">${escapeHtml(p)}</p>`)
        .join('\n            ');
      return `${heading}\n            ${paragraphs}`;
    })
    .join('\n            ');

  const navLink = (a: Article | null, label: string, align: 'left' | 'right') =>
    a
      ? `<a href="${articleRoute(a.slug)}" style="flex: 1; ${styleCard} text-decoration: none; text-align: ${align};">
            <span style="display: block; font-size: 0.75rem; color: #94a3b8; margin-bottom: 0.25rem;">${label}</span>
            <span style="display: block; font-weight: 700; color: #0f172a;">${escapeHtml(a.title)}</span>
          </a>`
      : '<span style="flex: 1;"></span>';

  const inner = `
    <div id="prerendered-shell">
      <header style="padding: 2rem 1rem; max-width: 720px; margin: 0 auto;">
        <a href="${ROUTES.articles}" style="${styleBackLink}">&larr; Semua artikel</a>
        <nav aria-label="Breadcrumb" style="font-size: 0.8rem; color: #94a3b8; margin-bottom: 0.75rem;">
          <a href="/" style="color: #94a3b8; text-decoration: none;">Beranda</a> /
          <a href="${ROUTES.articles}" style="color: #94a3b8; text-decoration: none;">Artikel</a> /
          ${escapeHtml(article.title)}
        </nav>
        <p style="${styleMetaText}">
          <span style="color: #0d9488; font-weight: 600;">${escapeHtml(article.category)}</span>
          ${article.publishedAt ? ` &bull; <time datetime="${toISODate(article.publishedAt)}">${escapeHtml(formatIDDate(article.publishedAt))}</time>` : ''}
          &bull; ${article.readMinutes} menit baca
        </p>
        <h1 style="font-size: 2rem; font-weight: 800; color: #0f172a; margin: 0 0 0.75rem 0; line-height: 1.2;">${escapeHtml(article.title)}</h1>
        <p style="font-size: 1.1rem; color: #475569; margin: 0;">${escapeHtml(article.excerpt)}</p>
      </header>
      <main style="max-width: 720px; margin: 0 auto; padding: 0 1rem;">
        <article>
            ${bodyHtml}
        </article>
        ${
          prev || next
            ? `
        <nav aria-label="Navigasi artikel" style="display: flex; gap: 1rem; margin-top: 2rem;">
          ${navLink(prev, 'Artikel sebelumnya', 'left')}
          ${navLink(next, 'Artikel selanjutnya', 'right')}
        </nav>`
            : ''
        }
        ${(() => {
          const related = getRelatedArticles(article.slug, 3);
          if (!related.length) return '';
          return `
        <section aria-label="Artikel terkait" style="margin-top: 2.5rem;">
          <h2 style="${styleH2}">Artikel Terkait</h2>
          <ul style="padding: 0; margin: 1rem 0 0 0;">
            ${related.map(renderArticleListItem).join('\n            ')}
          </ul>
        </section>`;
        })()}
      </main>${pageFooter()}
    </div>`;

  const blogPostingJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.excerpt,
    url: canonicalUrl,
    ...(article.publishedAt ? { datePublished: article.publishedAt } : {}),
    author: { '@type': 'Person', name: 'K. Arzhaning Jagad' },
    articleSection: article.category,
  };

  const html = applyHead(readBaseHtml(), {
    title: article.title,
    description: article.excerpt,
    canonicalUrl,
    breadcrumb: [
      { name: 'Beranda', url: `${CANONICAL_BASE}/` },
      { name: 'Artikel', url: `${CANONICAL_BASE}${ROUTES.articles}` },
      { name: article.title, url: canonicalUrl },
    ],
    extraJsonLd: [blogPostingJsonLd],
  });

  const finalHtml = replaceRootShell(html, inner);
  return writePage(articleRoute(article.slug), finalHtml);
};

// ---------------------------------------------------------------------------
// sitemap.xml — digenerate penuh dari data (bukan ditulis manual lagi).
// Ini gantikan public/sitemap.xml yang sebelumnya di-maintain manual dan
// ketahuan basi (urutan & isinya beda dari ARTICLES asli). Halaman statis
// non-artikel (beranda, privacy-policy, terms) tetap di-hardcode di sini
// karena memang tidak berasal dari data manapun di repo ini — kalau URL-nya
// berubah, update di STATIC_SITEMAP_ENTRIES.
// ---------------------------------------------------------------------------

interface SitemapEntry {
  loc: string;
  lastmod: string;
  changefreq: 'weekly' | 'monthly' | 'yearly';
  priority: string;
}

const today = (): string => new Date().toISOString().slice(0, 10);

const STATIC_SITEMAP_ENTRIES: SitemapEntry[] = [
  { loc: `${CANONICAL_BASE}/`, lastmod: today(), changefreq: 'weekly', priority: '1.0' },
  { loc: `${CANONICAL_BASE}${ROUTES.caseStudy}`, lastmod: today(), changefreq: 'monthly', priority: '0.8' },
  // Tanggal 2 halaman ini TIDAK di-auto-update (bukan berasal dari data
  // artikel) — ubah manual kalau isi privacy-policy/terms memang direvisi.
  { loc: `${CANONICAL_BASE}/privacy-policy/`, lastmod: '2026-09-20', changefreq: 'yearly', priority: '0.3' },
  { loc: `${CANONICAL_BASE}/terms/`, lastmod: '2026-09-20', changefreq: 'yearly', priority: '0.3' },
];

const buildSitemap = (paginationInfo: { totalPages: number; pageUrl: (page: number) => string }) => {
  const published = publishedArticles();

  const articleEntries: SitemapEntry[] = [
    {
      loc: `${CANONICAL_BASE}${ROUTES.articles}`,
      lastmod: published[0]?.publishedAt ?? today(),
      changefreq: 'weekly',
      priority: '0.7',
    },
    ...published.map((a) => ({
      loc: `${CANONICAL_BASE}${articleRoute(a.slug)}`,
      lastmod: a.publishedAt ?? today(),
      changefreq: 'monthly' as const,
      priority: '0.6',
    })),
  ];

  // Halaman /artikel?page=2 dst SENGAJA disertakan di sitemap meski biasanya
  // halaman pagination tidak perlu masuk sitemap — soalnya kontrol paginasi
  // di ArticlesIndexPage.tsx cuma <button onClick>, bukan <a href>, jadi
  // TIDAK ADA jalur crawl sama sekali dari /artikel ke halaman berikutnya.
  // Sitemap ini satu-satunya cara crawler menemukan halaman 2 dst. (Idealnya
  // tombol paginasi diubah jadi <a href> asli juga — lihat catatan di ringkasan.)
  const paginationEntries: SitemapEntry[] = [];
  for (let page = 2; page <= paginationInfo.totalPages; page++) {
    paginationEntries.push({
      loc: `${CANONICAL_BASE}${paginationInfo.pageUrl(page)}`,
      lastmod: today(),
      changefreq: 'weekly',
      priority: '0.4',
    });
  }

  const allEntries = [...STATIC_SITEMAP_ENTRIES.slice(0, 2), ...articleEntries, ...paginationEntries, ...STATIC_SITEMAP_ENTRIES.slice(2)];

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    allEntries
      .map(
        (e) =>
          `  <url>\n    <loc>${e.loc}</loc>\n    <lastmod>${e.lastmod}</lastmod>\n    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority}</priority>\n  </url>`
      )
      .join('\n') +
    '\n</urlset>\n';

  const outPath = join(DIST_DIR, 'sitemap.xml');
  writeFileSync(outPath, xml, 'utf-8');
  return outPath;
};

// ---------------------------------------------------------------------------
// Guard anti-drift: bandingkan slug published di articles.ts dengan rewrite
// exact-match yang ada di vercel.json. Ini persis mengulang bug yang
// ditemukan di index.html (daftar JSON-LD artikel ditulis manual dan basi) —
// supaya tidak terulang diam-diam untuk vercel.json, cek ini SELALU jalan
// tiap build dan mencetak peringatan (tidak menggagalkan build) kalau ada
// slug published yang belum punya rewrite, atau rewrite basi yang slug-nya
// sudah tidak published/tidak ada.
// ---------------------------------------------------------------------------

const checkVercelRewriteDrift = (publishedSlugs: string[], totalPages: number) => {
  if (!existsSync(VERCEL_JSON_PATH)) return;
  const vercelConfig = JSON.parse(readFileSync(VERCEL_JSON_PATH, 'utf-8'));
  const rewrites: { source: string; destination: string; has?: { type: string; key: string; value: string }[] }[] =
    vercelConfig.rewrites ?? [];

  const articleRewriteSlugs = new Set(
    rewrites
      .map((r) => r.source.match(/^\/artikel\/([^/]+)$/)?.[1])
      .filter((slug): slug is string => Boolean(slug))
  );
  const missing = publishedSlugs.filter((slug) => !articleRewriteSlugs.has(slug));
  const stale = [...articleRewriteSlugs].filter((slug) => !publishedSlugs.includes(slug));

  if (missing.length) {
    console.warn(
      `\n[prerender] PERINGATAN: ${missing.length} artikel published belum punya rewrite exact-match di vercel.json:\n` +
        missing.map((s) => `  - ${s}`).join('\n') +
        `\n  Tambahkan entri { "source": "/artikel/${missing[0]}", "destination": "/artikel/${missing[0]}/index.html" } (letakkan sebelum rewrite catch-all SPA), atau halaman ini akan tetap ke-fallback ke shell generik homepage untuk crawler.\n`
    );
  }
  if (stale.length) {
    console.warn(
      `\n[prerender] PERINGATAN: vercel.json punya rewrite artikel yang slug-nya sudah tidak published (atau sudah tidak ada) di articles.ts:\n` +
        stale.map((s) => `  - ${s}`).join('\n') +
        `\n  Aman dibiarkan (cuma jadi rewrite mati), tapi sebaiknya dihapus biar tidak membingungkan.\n`
    );
  }

  // Rewrite pagination pakai query ?page=N (has: query). Cek tiap halaman
  // 2..totalPages punya rewrite yang cocok.
  const paginationRewritePages = new Set(
    rewrites
      .filter((r) => r.source === ROUTES.articles && r.has?.some((h) => h.type === 'query' && h.key === 'page'))
      .map((r) => r.has!.find((h) => h.type === 'query' && h.key === 'page')!.value)
  );
  const missingPages: number[] = [];
  for (let page = 2; page <= totalPages; page++) {
    if (!paginationRewritePages.has(String(page))) missingPages.push(page);
  }
  if (missingPages.length) {
    console.warn(
      `\n[prerender] PERINGATAN: ${missingPages.length} halaman /artikel?page=N belum punya rewrite "has query" di vercel.json:\n` +
        missingPages.map((p) => `  - /artikel?page=${p}`).join('\n') +
        `\n  Tambahkan entri { "source": "/artikel", "has": [{ "type": "query", "key": "page", "value": "${missingPages[0]}" }], "destination": "/artikel/page/${missingPages[0]}/index.html" }.\n`
    );
  }
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const main = () => {
  const written: string[] = [];

  written.push(buildHasilKerjaPage());

  const { outputs: artikelIndexOutputs, totalPages, publishedCount, pageUrl } = buildArtikelIndexPages();
  written.push(...artikelIndexOutputs);

  const published = publishedArticles();
  for (const article of published) {
    written.push(buildArticlePage(article));
  }

  const sitemapPath = buildSitemap({ totalPages, pageUrl });
  written.push(sitemapPath);

  checkVercelRewriteDrift(
    published.map((a) => a.slug),
    totalPages
  );

  console.log(`\n[prerender] Selesai. ${written.length} file ditulis:`);
  for (const file of written) {
    console.log(`  - ${file.replace(DIST_DIR, 'dist')}`);
  }
  console.log(
    `\n[prerender] ${publishedCount} artikel published, ${totalPages} halaman index /artikel (${ARTICLES_PER_PAGE}/halaman, featured card di halaman 1 tidak dihitung ke kuota).`
  );
};

main();