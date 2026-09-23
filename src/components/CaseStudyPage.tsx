import React, { useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  ExternalLink,
  MessageCircle,
  Quote,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  Workflow,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { PROJECTS, CONTACT_INFO } from '../data/portfolioData';
import { TESTIMONIALS } from '../data/testimonials';
import { useNavigationHistory } from '../context/NavigationHistoryContext';
import { ROUTES } from '../routes';
import { Reveal } from './Reveal';
import { useBreadcrumbSchema } from '../hooks/useBreadcrumbSchema';
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
        statCard: 'bg-slate-900/80 border-slate-800',
        problemIcon: 'bg-amber-500/15 text-amber-400',
        solutionIcon: 'bg-indigo-500/15 text-indigo-400',
        impactIcon: 'bg-teal-500/15 text-teal-400',
        flowNode: 'bg-slate-900/90 border-slate-700 text-slate-200',
        flowBadge: 'bg-teal-500/20 text-teal-300',
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
        statCard: 'bg-white border-slate-200 shadow-sm',
        problemIcon: 'bg-amber-100 text-amber-600',
        solutionIcon: 'bg-indigo-100 text-indigo-600',
        impactIcon: 'bg-teal-100 text-teal-600',
        flowNode: 'bg-white border-slate-200 text-slate-800',
        flowBadge: 'bg-teal-100 text-teal-800',
      };

type Tokens = ReturnType<typeof getTokens>;

/* ===== Business Case Card dengan ikon & visual yang lebih dramatis ===== */
const BusinessCaseCard: React.FC<{
  type: 'problem' | 'solution' | 'impact';
  text: string;
  c: Tokens;
}> = ({ type, text, c }) => {
  const config = {
    problem: {
      label: 'Masalah',
      icon: AlertTriangle,
      iconClass: c.problemIcon,
      border: 'border-amber-500/30',
    },
    solution: {
      label: 'Solusi',
      icon: Lightbulb,
      iconClass: c.solutionIcon,
      border: 'border-indigo-500/30',
    },
    impact: {
      label: 'Dampak',
      icon: TrendingUp,
      iconClass: c.impactIcon,
      border: 'border-teal-500/40',
    },
  }[type];

  const Icon = config.icon;

  return (
    <div
      className={`relative rounded-2xl border p-5 ${c.inner} ${config.border} transition-transform duration-300 hover:-translate-y-1`}
    >
      <div className="flex items-center gap-3 mb-3">
        <span
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.iconClass}`}
        >
          <Icon className="w-5 h-5" aria-hidden="true" />
        </span>
        <h3 className={`text-sm font-bold ${c.heading}`}>{config.label}</h3>
      </div>
      <p className={`text-sm leading-relaxed ${c.body}`}>{text}</p>
    </div>
  );
};

/* ===== Architecture Flow yang lebih visual ===== */
const ArchitectureFlow: React.FC<{
  steps: string[];
  darkMode: boolean;
  c: Tokens;
}> = ({ steps, darkMode, c }) => (
  <div className="mt-8">
    <h3 className={`text-base font-bold mb-4 flex items-center gap-2 ${c.heading}`}>
      <Workflow className="w-4 h-4 text-teal-500" aria-hidden="true" />
      Alur Sistem
    </h3>
    <div className={`rounded-2xl border p-5 overflow-x-auto ${c.inner}`}>
      <ol className="flex items-center gap-0 min-w-max">
        {steps.map((step, idx) => (
          <React.Fragment key={step}>
            <li className="flex flex-col items-center gap-2 group">
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-transform group-hover:scale-110 ${c.flowBadge}`}
              >
                {idx + 1}
              </span>
              <span
                className={`px-4 py-2 rounded-xl border text-xs font-medium text-center max-w-[140px] transition-colors ${c.flowNode} ${
                  darkMode ? 'group-hover:border-teal-500/50' : 'group-hover:border-teal-300'
                }`}
              >
                {step}
              </span>
            </li>
            {idx < steps.length - 1 && (
              <li className="flex items-center px-1 pb-8" aria-hidden="true">
                <div className={`w-8 h-px ${darkMode ? 'bg-slate-700' : 'bg-slate-300'}`} />
                <ArrowRight className={`w-4 h-4 -ml-1 ${c.muted}`} />
              </li>
            )}
          </React.Fragment>
        ))}
      </ol>
    </div>
  </div>
);

/* ===== Client Case Card utama ===== */
const ClientCase: React.FC<{
  project: ProjectItem;
  darkMode: boolean;
  c: Tokens;
}> = ({ project, darkMode, c }) => {
  const testimonial = TESTIMONIALS.find(
    (t) => t.projectId === project.id && t.approved
  );
  const bc = project.businessCase;

  return (
    <Reveal>
      <article
        aria-labelledby={`case-${project.id}`}
        className={`rounded-3xl border p-6 sm:p-10 ${c.card} transition-shadow duration-300 hover:shadow-xl`}
      >
        {/* Header dengan client badge */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold border ${
              darkMode
                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                : 'bg-indigo-50 border-indigo-200 text-indigo-700'
            }`}
          >
            <Building2 className="w-4 h-4" aria-hidden="true" />
            {project.client}
          </span>
          <span className={`text-sm ${c.muted}`}>{project.year}</span>
          <span className={`text-sm ${c.muted}`}>•</span>
          <span className={`text-sm ${c.muted}`}>{project.role}</span>
        </div>

        <h2
          id={`case-${project.id}`}
          className={`text-2xl sm:text-3xl font-extrabold tracking-tight mb-3 ${c.heading}`}
        >
          {project.title}
        </h2>
        <p className={`text-base sm:text-lg leading-relaxed max-w-3xl mb-8 ${c.body}`}>
          {project.tagline}
        </p>

        {/* Business Case: Masalah → Solusi → Dampak */}
        {bc && (
          <div className="grid gap-4 md:grid-cols-3 mb-8">
            <BusinessCaseCard type="problem" text={bc.problem} c={c} />
            <BusinessCaseCard type="solution" text={bc.solution} c={c} />
            <BusinessCaseCard type="impact" text={bc.impact} c={c} />
          </div>
        )}

        {/* Testimonial premium */}
        {testimonial && (
          <figure
            className={`relative mt-8 rounded-2xl border p-6 sm:p-8 overflow-hidden ${c.inner}`}
          >
            <div
              className="absolute top-0 right-0 w-32 h-32 opacity-5 pointer-events-none"
              aria-hidden="true"
            >
              <Quote className="w-full h-full" />
            </div>
            <Quote
              className="w-8 h-8 text-teal-500 mb-4"
              aria-hidden="true"
            />
            <blockquote
              className={`text-lg sm:text-xl leading-relaxed font-medium ${c.heading}`}
            >
              "{testimonial.quote}"
            </blockquote>
            <figcaption className={`mt-5 flex items-center gap-3 ${c.muted}`}>
              <span
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                  darkMode
                    ? 'bg-teal-500/20 text-teal-300'
                    : 'bg-teal-100 text-teal-700'
                }`}
                aria-hidden="true"
              >
                {testimonial.author.charAt(0)}
              </span>
              <div>
                <span className={`block text-sm font-semibold ${c.heading}`}>
                  {testimonial.author}
                </span>
                {(testimonial.role || testimonial.company) && (
                  <span className="block text-xs">
                    {[testimonial.role, testimonial.company]
                      .filter(Boolean)
                      .join(' di ')}
                  </span>
                )}
              </div>
            </figcaption>
          </figure>
        )}

        {/* Highlights / Yang dibangun */}
        {project.highlights.length > 0 && (
          <div className="mt-10">
            <h3 className={`text-base font-bold mb-4 flex items-center gap-2 ${c.heading}`}>
              <Sparkles className="w-4 h-4 text-teal-500" aria-hidden="true" />
              Yang Dibangun
            </h3>
            <ul className="grid gap-x-8 gap-y-4 md:grid-cols-2">
              {project.highlights.map((h) => {
                const { head, body } = splitHighlight(h);
                return (
                  <li key={h} className={`flex items-start gap-3 text-sm leading-relaxed ${c.body}`}>
                    <CheckCircle2
                      className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <span>
                      {head && (
                        <span className={`font-semibold ${c.heading}`}>
                          {head}.{' '}
                        </span>
                      )}
                      {body}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Architecture Flow */}
        {project.architectureFlow && project.architectureFlow.length > 0 && (
          <ArchitectureFlow
            steps={project.architectureFlow}
            darkMode={darkMode}
            c={c}
          />
        )}

        {/* Tech Stack */}
        <div className="flex flex-wrap gap-2 mt-10" aria-label="Teknologi yang dipakai">
          {project.techStack.map((tech) => (
            <span
              key={tech}
              className={`text-xs font-semibold px-3.5 py-1.5 rounded-lg border transition-transform hover:scale-105 ${c.chip}`}
            >
              {tech}
            </span>
          ))}
        </div>

        {/* Footer card: disclaimer + demo button */}
        <div
          className={`mt-10 pt-8 border-t flex flex-wrap items-center justify-between gap-5 ${c.divider}`}
        >
          <p className={`flex items-start gap-3 text-xs leading-relaxed max-w-xl ${c.muted}`}>
            <ShieldCheck
              className="w-5 h-5 text-indigo-500 flex-shrink-0"
              aria-hidden="true"
            />
            <span>
              Sistem aslinya aktif dipakai untuk operasional internal{' '}
              <strong className={c.heading}>{project.client}</strong>. Demo publik
              memakai data simulasi demi menjaga privasi data perusahaan.
            </span>
          </p>
          {project.demoUrl && (
            <a
              href={project.demoUrl}
              target="_blank"
              rel="noreferrer"
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold shadow-lg shadow-teal-600/25 transition-all hover:shadow-teal-500/30 hover:-translate-y-0.5 ${FOCUS_RING}`}
            >
              Buka Demo
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
            </a>
          )}
        </div>
      </article>
    </Reveal>
  );
};

/* ===== Halaman utama ===== */
export const CaseStudyPage: React.FC<CaseStudyPageProps> = ({ darkMode }) => {
  const { navigate } = useNavigationHistory();
  const c = getTokens(darkMode);
    useBreadcrumbSchema([
    { name: 'Beranda', url: 'https://arzhaning.my.id/' },
    { name: 'Hasil Kerja', url: `https://arzhaning.my.id${ROUTES.caseStudy}` },
  ]);
  const clientProjects = PROJECTS.filter((p) => p.client);
  const ownProjects = PROJECTS.filter((p) => !p.client);

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
      if (canonical && prevCanonical !== null)
        canonical.setAttribute('href', prevCanonical);
    };
  }, []);

  const goHome = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    navigate(ROUTES.home);
  };

  const uniqueTechCount = new Set(
    PROJECTS.flatMap((p) => p.techStack)
  ).size;

  return (
    <div className="pt-28 md:pt-32 pb-16 md:pb-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back link */}
        <a
          href={ROUTES.home}
          onClick={goHome}
          className={`inline-flex items-center gap-1.5 text-sm font-medium mb-8 rounded-md transition-colors hover:text-teal-500 ${FOCUS_RING} ${c.muted}`}
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Kembali ke beranda
        </a>

        {/* Hero yang lebih impactful */}
        <Reveal>
          <header className="max-w-3xl mb-14">
            <div
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold mb-5 ${
                darkMode
                  ? 'bg-teal-500/10 border-teal-500/30 text-teal-300'
                  : 'bg-teal-50 border-teal-200 text-teal-700'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
              Portofolio Klien Terverifikasi
            </div>

            <h1
              className={`text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 ${c.heading}`}
            >
              Hasil kerja untuk{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-indigo-500">
                klien nyata
              </span>
            </h1>

            <p className={`text-base sm:text-lg leading-relaxed max-w-2xl ${c.body}`}>
              Bukan sekadar mockup — ini sistem yang dipakai setiap hari oleh bisnis.
              Lihat masalah awalnya, solusi yang dibangun, dan dampaknya bagi
              operasional mereka.
            </p>

            {/* Stats bar */}
            <div className="mt-8 flex flex-wrap gap-4">
              {[
                { value: `${clientProjects.length}`, label: 'Proyek Klien' },
                { value: `${uniqueTechCount}+`, label: 'Teknologi Dipakai' },
                { value: '100%', label: 'Data Demo Disamarkan' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className={`px-5 py-3 rounded-2xl border ${c.statCard}`}
                >
                  <div className={`text-2xl font-extrabold ${c.heading}`}>
                    {stat.value}
                  </div>
                  <div className={`text-xs font-medium ${c.muted}`}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </header>
        </Reveal>

        {/* Client projects */}
        <div className="space-y-10">
          {clientProjects.map((p) => (
            <ClientCase key={p.id} project={p} darkMode={darkMode} c={c} />
          ))}
        </div>

        {/* Own projects */}
        {ownProjects.length > 0 && (
          <Reveal>
            <section aria-labelledby="own-projects-heading" className="mt-20">
              <h2
                id="own-projects-heading"
                className={`text-2xl sm:text-3xl font-extrabold tracking-tight mb-3 ${c.heading}`}
              >
                Produk yang saya bangun sendiri
              </h2>
              <p className={`text-base leading-relaxed max-w-2xl mb-8 ${c.body}`}>
                Dirancang, dikembangkan, dan dirilis sendiri dari nol. Bisa dicoba
                langsung.
              </p>
              <div className="grid gap-5 md:grid-cols-2">
                {ownProjects.map((p) => (
                  <article
                    key={p.id}
                    className={`rounded-2xl border p-6 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${c.card}`}
                  >
                    <h3 className={`text-lg font-bold mb-2 ${c.heading}`}>
                      {p.title}
                    </h3>
                    <p className={`text-sm leading-relaxed mb-5 ${c.body}`}>
                      {p.tagline}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-6">
                      {p.techStack.slice(0, 5).map((tech) => (
                        <span
                          key={tech}
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded-md border ${c.chip}`}
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
                        Coba Demo
                        <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                      </a>
                    )}
                  </article>
                ))}
              </div>
            </section>
          </Reveal>
        )}

        {/* CTA yang lebih menggoda */}
        <Reveal>
          <section
            aria-labelledby="case-cta-heading"
            className={`mt-20 rounded-3xl border p-8 sm:p-12 relative overflow-hidden ${c.impact}`}
          >
            <div
              className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent pointer-events-none"
              aria-hidden="true"
            />
            <div className="relative flex flex-wrap items-center justify-between gap-6">
              <div className="max-w-xl">
                <h2
                  id="case-cta-heading"
                  className={`text-2xl sm:text-3xl font-extrabold tracking-tight mb-3 ${c.heading}`}
                >
                  Punya kebutuhan serupa?
                </h2>
                <p className={`text-base leading-relaxed ${c.body}`}>
                  Ceritakan proses bisnismu. Konsultasi awal gratis, tanpa kewajiban
                  order. Kita bahas dulu, baru tentukan solusi yang paling pas.
                </p>
              </div>
              <a
                href={WA_URL}
                target="_blank"
                rel="noreferrer"
                className={`inline-flex items-center gap-2.5 px-7 py-4 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white text-base font-bold shadow-xl shadow-teal-600/30 transition-all hover:shadow-teal-500/40 hover:-translate-y-0.5 ${FOCUS_RING}`}
              >
                <MessageCircle className="w-5 h-5" aria-hidden="true" />
                Konsultasi via WhatsApp
              </a>
            </div>
          </section>
        </Reveal>
      </div>
    </div>
  );
};