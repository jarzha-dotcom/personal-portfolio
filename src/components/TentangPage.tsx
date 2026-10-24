import React from 'react';
import { About } from './About';
import { Skills } from './Skills';
import { PageIntro } from './PageIntro';
import { Reveal } from './Reveal';
import { usePageMeta } from '../hooks/usePageMeta';
import { useBreadcrumbSchema } from '../hooks/useBreadcrumbSchema';
import { ROUTES, CANONICAL_BASE } from '../routes';

// Teks ini HARUS sama dengan buildTentangPage() di scripts/prerender.ts.
const H1 = 'Tentang Arzha — Indie Developer & Data Specialist di Bekasi';
const TITLE = 'Tentang Arzha — Indie Developer & Data Specialist';
const DESCRIPTION =
  'Profil Arzha: indie developer & data specialist di Bekasi dengan 7+ tahun pengalaman korporat. Tech stack, cara kerja, dan portofolio aplikasi web, mobile & game.';

export const TentangPage: React.FC<{ darkMode: boolean }> = ({ darkMode }) => {
  usePageMeta({ title: TITLE, description: DESCRIPTION, canonicalUrl: `${CANONICAL_BASE}${ROUTES.about}` });
  useBreadcrumbSchema([
    { name: 'Beranda', url: `${CANONICAL_BASE}/` },
    { name: 'Tentang', url: `${CANONICAL_BASE}${ROUTES.about}` },
  ]);

  return (
    <>
      <PageIntro darkMode={darkMode} h1={H1} subtitle={DESCRIPTION} breadcrumb="Tentang" />
      <About darkMode={darkMode} />
      <Reveal>
        <Skills darkMode={darkMode} />
      </Reveal>
    </>
  );
};
