import React, { useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  ExternalLink,
  MessageCircle,
  Quote,
  ShieldCheck,
} from 'lucide-react';
import { PROJECTS, CONTACT_INFO } from '../data/portfolioData';
import { TESTIMONIALS } from '../data/testimonials';
import { useNavigationHistory } from '../context/NavigationHistoryContext';
import { ROUTES } from '../routes';
import type { ProjectItem } from '../types';

interface CaseStudyPageProps {
  darkMode: boolean;
}

const PAGE_TITLE = 'Hasil Kerja & Studi Kasus | K. Arzhaning Jagad (Arzha)';
const PAGE_DESCRIPTION =
  'Proyek yang sudah dipakai langsung oleh bisnis: masalah awal, solusi yang dibangun, dan dampaknya. Lengkap dengan demo yang bisa dicoba.';
const CANONICAL_URL = 'https://arzhaning.my.id/hasil-kerja';

const WA_URL = `https://wa.me/${CONTACT_INFO.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
  'Halo Mas Arzha, saya sudah lihat halaman Hasil Kerja dan tertarik membuat proyek serupa. Boleh konsultasi kebutuhan saya?'
)}`;

const FOCUS_RING =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent';

// Highlight di data berformat "Judul: penjelasan". Judulnya ditebalkan supaya
// gampang dipindai; kalau formatnya beda, teks ditampilkan apa adanya.
const splitHighlight = (text: string): { head?: string; body: string } => {
  const i = text.indexOf(': ');
  return i > 0 && i <= 48
    ? { head: text.slice(0, i), body: text.slice(i + 2) }
    : { body: text };
};

const getTokens = (darkMode: boolean) =>
  darkMode
    ? {
        heading: 'text-white',
        body: 'text-slate-300',
        muted: 'text-slate-400',
        card: 'bg-slate-900/60 border-slate-800',
        inner: 'bg-slate-800/50 border-slate-700',
        chip: 'bg-slate-800 border-slate-700 text-slate-200',
        impact: 'bg-teal-500/10 border-teal-500/40',
        divider: 'border-slate-800',
        outlineBtn: 'border-slate-700 text-slate-200 hover:bg-slate-800',
      }
    : {
        heading: 'text-slate-900',
        body: 'text-slate-700',
        muted: 'text-slate-500',
        card: 'bg-white border-slate-200 shadow-sm',
        inner: 'bg-slate-50 border-slate-200',
        chip: 'bg-slate-100 border-slate-200 text-slate-800',
        impact: 'bg-teal-50 border-teal-300',
        divider: 'border-slate-200',
        outlineBtn: 'border-slate-300 text-slate-800 hover:bg-slate-100',
      };

type Tokens = ReturnType<typeof getTokens>;

const ClientCase: React.FC<{ project: ProjectItem; darkMode: boolean; c: Tokens }> = ({
  project,
  darkMode,
  c,
}) => {
  const testimonial = TESTIMONIALS.find((t) => t.projectId === project.id && t.approved);
  const bc = project.businessCase;

  return (
    <article
      aria-labelledby={`case-${project.id}`}
      className={`rounded-2xl border p-5 sm:p-8 ${c.card}`}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4 text-sm">
        <span
          className={`inline-flex items-center gap-1.5 font-semibold ${
            darkMode ? 'text-indigo-300' : 'text-indigo-700'
          }`}
        >
          <Building2 className="w-4 h-4" aria-hidden="true" />
          {project.client}
        </span>
        <span className={c.muted}>{project.year}</span>
        <span className={c.muted}>{project.role}</span>
      </div>

      <h2
        id={`case-${project.id}`}
        className={`text-xl sm:text-2xl font-extrabold tracking-tight mb-2 ${c.heading}`}
      >
        {project.title}
      </h2>
      <p className={`text-sm sm:text-base leading-relaxed max-w-3xl ${c.body}`}>
        {project.tagline}
      </p>

      {bc && (
        <div className="grid gap-3 md:grid-cols-3 mt-8">
          <div className={`rounded-xl border p-4 ${c.inner}`}>
            <h3 className={`text-sm font-bold mb-1.5 ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>
              Masalah
            </h3>
            <p className={`text-sm leading-relaxed ${c.body}`}>{bc.problem}</p>
          </div>
          <div className={`rounded-xl border p-4 ${c.inner}`}>
            <h3 className={`text-sm font-bold mb-1.5 ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>
              Solusi
            </h3>
            <p className={`text-sm leading-relaxed ${c.body}`}>{bc.solution}</p>
          </div>
          <div className={`rounded-xl border p-4 ${c.impact}`}>
            <h3 className={`text-sm font-bold mb-1.5 ${darkMode ? 'text-teal-300' : 'text-teal-700'}`}>
              Dampak
            </h3>
            <p className={`text-sm leading-relaxed ${c.body}`}>{bc.impact}</p>
          </div>
        </div>
      )}

      {testimonial && (
        <figure className={`mt-6 rounded-xl border p-5 ${c.inner}`}>
          <Quote className="w-5 h-5 text-teal-500 mb-2" aria-hidden="true" />
          <blockquote className={`text-base leading-relaxed ${c.heading}`}>
            {testimonial.quote}
          </blockquote>
          <figcaption className={`mt-3 text-sm ${c.muted}`}>
            <span className="font-semibold">{testimonial.author}</span>
            {(testimonial.role || testimonial.company) && (
              <span>, {[testimonial.role, testimonial.company].filter(Boolean).join(' di ')}</span>
            )}
          </figcaption>
        </figure>
      )}

      {project.highlights.length > 0 && (
        <div className="mt-8">
          <h3 className={`text-base font-bold mb-3 ${c.heading}`}>Yang dibangun</h3>
          <ul className="grid gap-x-8 gap-y-3 md:grid-cols-2">
            {project.highlights.map((h) => {
              const { head, body } = splitHighlight(h);
              return (
                <li key={h} className={`text-sm leading-relaxed ${c.body}`}>
                  {head && <span className={`font-semibold ${c.heading}`}>{head}. </span>}
                  {body}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {project.architectureFlow && project.architectureFlow.length > 0 && (
        <div className="mt-8">
          <h3 className={`text-base font-bold mb-3 ${c.heading}`}>Alur sistem</h3>
          <div className={`rounded-xl border p-3.5 overflow-x-auto ${c.inner}`}>
            <ol className="flex items-center gap-2 min-w-max">
              {project.architectureFlow.map((step, idx) => (
                <React.Fragment key={step}>
                  <li
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${
                      darkMode
                        ? 'bg-slate-900/90 border-slate-700 text-slate-200'
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        darkMode ? 'bg-teal-500/20 text-teal-300' : 'bg-teal-100 text-teal-800'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    {step}
                  </li>
                  {idx < project.architectureFlow!.length - 1 && (
                    <ArrowRight className={`w-3.5 h-3.5 flex-shrink-0 ${c.muted}`} aria-hidden="true" />
                  )}
                </React.Fragment>
              ))}
            </ol>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mt-8" aria-label="Teknologi yang dipakai">
        {project.techStack.map((tech) => (
          <span key={tech} className={`text-xs font-semibold px-3 py-1 rounded-lg border ${c.chip}`}>
            {tech}
          </span>
        ))}
      </div>

      <div
        className={`mt-8 pt-6 border-t flex flex-wrap items-start justify-between gap-4 ${c.divider}`}
      >
        <p className={`flex items-start gap-2.5 text-xs leading-relaxed max-w-xl ${c.muted}`}>
          <ShieldCheck className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            Sistem aslinya aktif dipakai untuk operasional internal {project.client}. Demo publik
            memakai data simulasi demi menjaga privasi data perusahaan.
          </span>
        </p>
        {project.demoUrl && (
          <a
            href={project.demoUrl}
            target="_blank"
            rel="noreferrer"
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold shadow-md transition-colors ${FOCUS_RING}`}
          >
            Buka demo
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </a>
        )}
      </div>
    </article>
  );
};

export const CaseStudyPage: React.FC<CaseStudyPageProps> = ({ darkMode }) => {
  const { navigate } = useNavigationHistory();
  const c = getTokens(darkMode);

  const clientProjects = PROJECTS.filter((p) => p.client);
  const ownProjects = PROJECTS.filter((p) => !p.client);

  // Judul, deskripsi, dan canonical khusus halaman ini; dikembalikan saat
  // pengunjung pindah lagi ke beranda.
  useEffect(() => {
    const prevTitle = document.title;
    const desc = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const prevDesc = desc?.getAttribute('content') ?? null;
    const prevCanonical = canonical?.getAttribute('href') ?? null;

    document.title = PAGE_TITLE;
    desc?.setAttribute('content', PAGE_DESCRIPTION);
    canonical?.setAttribute('href', CANONICAL_URL);

    return () => {
      document.title = prevTitle;
      if (desc && prevDesc !== null) desc.setAttribute('content', prevDesc);
      if (canonical && prevCanonical !== null) canonical.setAttribute('href', prevCanonical);
    };
  }, []);

  const goHome = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Biarkan ctrl/cmd/middle-click membuka tab baru seperti link biasa
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    navigate(ROUTES.home);
  };

  return (
    <div className="pt-28 md:pt-32 pb-16 md:pb-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <a
          href={ROUTES.home}
          onClick={goHome}
          className={`inline-flex items-center gap-1.5 text-sm font-medium mb-8 rounded-md transition-colors hover:text-teal-500 ${FOCUS_RING} ${c.muted}`}
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Kembali ke beranda
        </a>

        <header className="max-w-3xl mb-10">
          <h1 className={`text-3xl sm:text-4xl font-extrabold tracking-tight mb-3 ${c.heading}`}>
            Hasil kerja untuk klien nyata
          </h1>
          <p className={`text-base leading-relaxed ${c.body}`}>
            Proyek yang sudah dipakai langsung oleh bisnis: masalah awalnya, solusi yang dibangun,
            dan dampaknya bagi operasional mereka.
          </p>
        </header>

        <div className="space-y-8">
          {clientProjects.map((p) => (
            <ClientCase key={p.id} project={p} darkMode={darkMode} c={c} />
          ))}
        </div>

        {ownProjects.length > 0 && (
          <section aria-labelledby="own-projects-heading" className="mt-16">
            <h2
              id="own-projects-heading"
              className={`text-xl sm:text-2xl font-extrabold tracking-tight mb-2 ${c.heading}`}
            >
              Produk yang saya bangun sendiri
            </h2>
            <p className={`text-sm leading-relaxed max-w-2xl mb-6 ${c.body}`}>
              Dirancang, dikembangkan, dan dirilis sendiri dari nol. Bisa dicoba langsung.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {ownProjects.map((p) => (
                <article key={p.id} className={`rounded-2xl border p-5 flex flex-col ${c.card}`}>
                  <h3 className={`text-base font-bold mb-1.5 ${c.heading}`}>{p.title}</h3>
                  <p className={`text-sm leading-relaxed mb-4 ${c.body}`}>{p.tagline}</p>
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {p.techStack.slice(0, 5).map((tech) => (
                      <span
                        key={tech}
                        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md border ${c.chip}`}
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                  {p.demoUrl && (
                    <a
                      href={p.demoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={`mt-auto self-start inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-semibold transition-colors ${FOCUS_RING} ${c.outlineBtn}`}
                    >
                      Coba demo
                      <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                    </a>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        <section
          aria-labelledby="case-cta-heading"
          className={`mt-16 rounded-2xl border p-6 sm:p-8 flex flex-wrap items-center justify-between gap-5 ${c.impact}`}
        >
          <div className="max-w-xl">
            <h2
              id="case-cta-heading"
              className={`text-xl font-extrabold tracking-tight mb-1.5 ${c.heading}`}
            >
              Punya kebutuhan serupa?
            </h2>
            <p className={`text-sm leading-relaxed ${c.body}`}>
              Ceritakan proses bisnismu. Konsultasi awal gratis, tanpa kewajiban order.
            </p>
          </div>
          <a
            href={WA_URL}
            target="_blank"
            rel="noreferrer"
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold shadow-lg shadow-teal-600/20 transition-colors ${FOCUS_RING}`}
          >
            <MessageCircle className="w-4 h-4" aria-hidden="true" />
            Konsultasi via WhatsApp
          </a>
        </section>
      </div>
    </div>
  );
};