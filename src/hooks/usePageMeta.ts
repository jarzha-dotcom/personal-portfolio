import { useEffect } from 'react';

const SITE_SUFFIX = 'K. Arzhaning Jagad (Arzha)';

interface PageMeta {
  /** Judul halaman TANPA suffix situs (ditambahkan di sini) */
  title: string;
  description: string;
  canonicalUrl: string;
}

/**
 * Menyamakan title/description/canonical/og:* dengan halaman yang sedang dibuka
 * saat navigasi sisi-klien, lalu mengembalikannya saat halaman ditinggalkan.
 * Nilainya harus sama dengan yang ditulis scripts/prerender.ts untuk URL itu
 * (crawler membaca HTML statis; pengunjung yang pindah via SPA membaca ini).
 */
export function usePageMeta({ title, description, canonicalUrl }: PageMeta) {
  useEffect(() => {
    const fullTitle = `${title} | ${SITE_SUFFIX}`;
    const targets: { selector: string; attr: 'content' | 'href'; value: string }[] = [
      { selector: 'meta[name="description"]', attr: 'content', value: description },
      { selector: 'link[rel="canonical"]', attr: 'href', value: canonicalUrl },
      { selector: 'meta[property="og:url"]', attr: 'content', value: canonicalUrl },
      { selector: 'meta[property="og:title"]', attr: 'content', value: fullTitle },
      { selector: 'meta[property="og:description"]', attr: 'content', value: description },
      { selector: 'meta[name="twitter:title"]', attr: 'content', value: fullTitle },
      { selector: 'meta[name="twitter:description"]', attr: 'content', value: description },
    ];

    const prevTitle = document.title;
    const previous = targets.map(({ selector, attr, value }) => {
      const el = document.querySelector(selector);
      const prev = el?.getAttribute(attr) ?? null;
      el?.setAttribute(attr, value);
      return { el, attr, prev };
    });
    document.title = fullTitle;

    return () => {
      document.title = prevTitle;
      previous.forEach(({ el, attr, prev }) => {
        if (el && prev !== null) el.setAttribute(attr, prev);
      });
    };
  }, [title, description, canonicalUrl]);
}
