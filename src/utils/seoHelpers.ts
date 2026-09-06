/**
 * seoHelpers.ts
 *
 * Utility untuk inject/update JSON-LD structured data di runtime.
 * Dipisah dari index.html karena beberapa skema (daftar layanan, daftar
 * proyek) datanya sudah ada di komponen React (Services.tsx, Projects.tsx)
 * — jauh lebih maintainable menyusun ulang di sini daripada menduplikasi
 * data itu secara manual dalam <head> statis.
 *
 * Skema yang TIDAK bergantung data dinamis (Person, WebSite,
 * ProfessionalService) tetap ditaruh statis di index.html, karena crawler
 * yang tidak menjalankan JS masih bisa membacanya langsung dari HTML awal.
 */

const SITE_URL = 'https://byarzhaning.online';

type JsonLd = Record<string, unknown>;

/**
 * Menyisipkan (atau memperbarui) satu blok <script type="application/ld+json">
 * di <head>, diidentifikasi lewat atribut data-seo-id. Dipanggil ulang
 * dengan id yang sama akan meng-update isinya, bukan menumpuk script baru.
 */
export function injectJsonLd(id: string, data: JsonLd): void {
  if (typeof document === 'undefined') return;

  const json = JSON.stringify(data);
  const existing = document.querySelector<HTMLScriptElement>(
    `script[data-seo-id="${id}"]`
  );

  if (existing) {
    existing.textContent = json;
    return;
  }

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.dataset.seoId = id;
  script.textContent = json;
  document.head.appendChild(script);
}

/** Menghapus blok JSON-LD dinamis — dipanggil saat komponen unmount. */
export function removeJsonLd(id: string): void {
  if (typeof document === 'undefined') return;
  document.querySelector(`script[data-seo-id="${id}"]`)?.remove();
}

interface ServiceLike {
  title: string;
  description: string;
}

/**
 * Skema ItemList of Service, dipakai di Services.tsx.
 * Membantu Google memahami daftar jasa yang ditawarkan sebagai entitas
 * terpisah, bukan sekadar teks di dalam halaman.
 */
export function buildServicesJsonLd(services: ServiceLike[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Layanan Development K. Arzhaning Jagad',
    itemListElement: services.map((service, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Service',
        name: service.title,
        description: service.description,
        provider: {
          '@type': 'Person',
          name: 'K. Arzhaning Jagad',
          url: SITE_URL,
        },
      },
    })),
  };
}

interface ProjectLike {
  title: string;
  description: string;
  demoUrl?: string;
  githubUrl?: string;
}

/**
 * Skema ItemList berisi SoftwareApplication, dipakai di Projects.tsx.
 * Hanya proyek dengan demoUrl yang disertakan — SoftwareApplication tanpa
 * URL valid tidak banyak berguna untuk rich result dan berisiko dianggap
 * data tidak lengkap oleh Google.
 */
export function buildProjectsJsonLd(projects: ProjectLike[]): JsonLd {
  const releasedProjects = projects.filter((p) => p.demoUrl);

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Proyek K. Arzhaning Jagad',
    itemListElement: releasedProjects.map((project, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'SoftwareApplication',
        name: project.title,
        description: project.description,
        url: project.demoUrl,
        applicationCategory: 'WebApplication',
        author: {
          '@type': 'Person',
          name: 'K. Arzhaning Jagad',
          url: SITE_URL,
        },
        ...(project.githubUrl ? { codeRepository: project.githubUrl } : {}),
      },
    })),
  };
}
