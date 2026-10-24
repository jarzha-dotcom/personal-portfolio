import React from 'react';
import { Contact } from './Contact';
import { PageIntro } from './PageIntro';
import { usePageMeta } from '../hooks/usePageMeta';
import { useBreadcrumbSchema } from '../hooks/useBreadcrumbSchema';
import { ROUTES, CANONICAL_BASE } from '../routes';

// Teks ini HARUS sama dengan buildKontakPage() di scripts/prerender.ts.
const H1 = 'Kontak & Konsultasi Proyek Gratis';
const TITLE = 'Kontak & Konsultasi Proyek Gratis';
const DESCRIPTION =
  'Hubungi Arzha untuk konsultasi gratis pembuatan website, aplikasi mobile, game, atau AI chatbot lewat WhatsApp, email, atau chat dengan Zannah AI.';

export const KontakPage: React.FC<{ darkMode: boolean }> = ({ darkMode }) => {
  usePageMeta({ title: TITLE, description: DESCRIPTION, canonicalUrl: `${CANONICAL_BASE}${ROUTES.contact}` });
  useBreadcrumbSchema([
    { name: 'Beranda', url: `${CANONICAL_BASE}/` },
    { name: 'Kontak', url: `${CANONICAL_BASE}${ROUTES.contact}` },
  ]);

  return (
    <>
      <PageIntro darkMode={darkMode} h1={H1} subtitle={DESCRIPTION} breadcrumb="Kontak" />
      <Contact darkMode={darkMode} />
    </>
  );
};
