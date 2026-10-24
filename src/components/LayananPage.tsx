import React from 'react';
import { Services } from './Services';
import { FaqSection } from './FaqSection';
import { PageIntro } from './PageIntro';
import { Reveal } from './Reveal';
import { usePageMeta } from '../hooks/usePageMeta';
import { useBreadcrumbSchema } from '../hooks/useBreadcrumbSchema';
import { ROUTES, CANONICAL_BASE } from '../routes';

// Teks ini HARUS sama dengan buildLayananPage() di scripts/prerender.ts.
const H1 = 'Layanan & Estimasi Biaya Jasa Pembuatan Website, Aplikasi Mobile, Game & AI';
const TITLE = 'Jasa Pembuatan Website, Aplikasi & AI — Layanan dan Biaya';
const DESCRIPTION =
  'Jasa pembuatan website, aplikasi mobile, web app custom, AI chatbot & game multiplayer. Estimasi biaya mulai Rp800.000, lama pengerjaan, alur kerja, dan FAQ.';

export const LayananPage: React.FC<{ darkMode: boolean }> = ({ darkMode }) => {
  usePageMeta({ title: TITLE, description: DESCRIPTION, canonicalUrl: `${CANONICAL_BASE}${ROUTES.services}` });
  useBreadcrumbSchema([
    { name: 'Beranda', url: `${CANONICAL_BASE}/` },
    { name: 'Layanan', url: `${CANONICAL_BASE}${ROUTES.services}` },
  ]);

  return (
    <>
      <PageIntro darkMode={darkMode} h1={H1} subtitle={DESCRIPTION} breadcrumb="Layanan" />
      <Services darkMode={darkMode} />
      <Reveal>
        <FaqSection darkMode={darkMode} />
      </Reveal>
    </>
  );
};
