import { useEffect } from 'react';

export interface BreadcrumbItem {
  name: string;
  url: string;
}

const SCRIPT_ID = 'breadcrumb-schema';

// Menyuntikkan <script type="application/ld+json"> BreadcrumbList ke <head>
// selama halaman ini aktif, dan membersihkannya saat halaman ditinggalkan —
// supaya breadcrumb yang terbaca crawler selalu sesuai halaman yang sedang
// dibuka, bukan breadcrumb halaman lain yang kebawa nyangkut.
export const useBreadcrumbSchema = (items: BreadcrumbItem[]) => {
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = SCRIPT_ID;
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: item.name,
        item: item.url,
      })),
    });
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(items)]);
};
