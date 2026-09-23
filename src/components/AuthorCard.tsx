import React from 'react';
import { MessageCircle, Mail, Github, ArrowRight, Quote } from 'lucide-react';
import {
  AUTHOR_AVATAR,
  AUTHOR_BIO,
  AUTHOR_SOCIALS,
  AUTHOR_ABOUT_URL,
} from '../data/author';
import { PERSONAL_INFO } from '../data/portfolioData';
import { useNavigationHistory } from '../context/NavigationHistoryContext';

interface AuthorCardProps {
  darkMode: boolean;
}

export const AuthorCard: React.FC<AuthorCardProps> = ({ darkMode }) => {
  const { navigate } = useNavigationHistory();

  const goTo = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    navigate(path);
  };

  return (
    <aside
      aria-label="Tentang penulis"
      className={`relative mt-16 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5 ${
        darkMode
          ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 hover:border-teal-500/40'
          : 'bg-white border border-slate-200 shadow-lg hover:shadow-xl'
      }`}
    >
      {/* Decorative gradient accent (top + left) */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-500"
      />
      <div
        aria-hidden="true"
        className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${
          darkMode ? 'from-teal-400 to-teal-700' : 'from-teal-500 to-teal-700'
        }`}
      />

      {/* Soft glow di pojok */}
      <div
        aria-hidden="true"
        className={`absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none ${
          darkMode ? 'bg-teal-500' : 'bg-teal-300'
        }`}
      />

      <div className="relative flex flex-col sm:flex-row gap-5 p-6 sm:p-7">
        {/* Avatar dengan ring gradient */}
        <div className="shrink-0 self-start">
          <div
            className={`relative inline-block p-[2px] rounded-full bg-gradient-to-br ${
              darkMode
                ? 'from-teal-400 via-emerald-400 to-teal-600'
                : 'from-teal-500 via-emerald-500 to-teal-700'
            }`}
          >
            <img
              src={AUTHOR_AVATAR}
              alt={`Foto ${PERSONAL_INFO.name}`}
              className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover ${
                darkMode ? 'bg-slate-900' : 'bg-white'
              }`}
              loading="lazy"
            />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {/* Badge */}
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                darkMode
                  ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                  : 'bg-teal-50 text-teal-700 border border-teal-200'
              }`}
            >
              <Quote className="w-3 h-3" aria-hidden="true" />
              Ditulis oleh
            </span>
          </div>

          <h3
            className={`text-xl font-extrabold tracking-tight leading-tight ${
              darkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            {PERSONAL_INFO.name}
          </h3>
          <p
            className={`text-sm font-medium mt-0.5 mb-3 ${
              darkMode ? 'text-teal-300' : 'text-teal-700'
            }`}
          >
            {PERSONAL_INFO.titleJasa}
          </p>

          <p
            className={`text-sm leading-relaxed mb-4 ${
              darkMode ? 'text-slate-300' : 'text-slate-600'
            }`}
          >
            {AUTHOR_BIO}
          </p>

          {/* Social + About */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <SocialIcon
              href={AUTHOR_SOCIALS.whatsapp}
              label="WhatsApp"
              icon={<MessageCircle className="w-4 h-4" aria-hidden="true" />}
              darkMode={darkMode}
              external
            />
            <SocialIcon
              href={AUTHOR_SOCIALS.email}
              label="Email"
              icon={<Mail className="w-4 h-4" aria-hidden="true" />}
              darkMode={darkMode}
            />
            <SocialIcon
              href={AUTHOR_SOCIALS.github}
              label="GitHub"
              icon={<Github className="w-4 h-4" aria-hidden="true" />}
              darkMode={darkMode}
              external
            />

            <span
              className={`mx-1.5 h-4 w-px ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}
              aria-hidden="true"
            />

            <a
              href={AUTHOR_ABOUT_URL}
              onClick={(e) => goTo(e, AUTHOR_ABOUT_URL)}
              className={`inline-flex items-center gap-1 text-xs font-bold rounded-md px-2.5 py-1.5 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                darkMode
                  ? 'text-teal-300 hover:text-white hover:bg-teal-500/15'
                  : 'text-teal-700 hover:text-teal-900 hover:bg-teal-50'
              }`}
            >
              Tentang saya
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
};

interface SocialIconProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  darkMode: boolean;
  external?: boolean;
}

const SocialIcon: React.FC<SocialIconProps> = ({ href, label, icon, darkMode, external }) => (
  <a
    href={href}
    {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    aria-label={label}
    className={`inline-flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
      darkMode
        ? 'text-slate-400 hover:text-teal-300 hover:bg-slate-800 hover:scale-110'
        : 'text-slate-500 hover:text-teal-600 hover:bg-slate-100 hover:scale-110'
    }`}
  >
    {icon}
  </a>
);