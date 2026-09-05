import React from 'react';
import {
  ArrowUp,
  Linkedin,
  Github,
  Instagram,
  Mail,
  Phone,
  Code2,
  MapPin
} from 'lucide-react';
import { PERSONAL_INFO, CONTACT_INFO } from '../data/portfolioData';

export const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <footer id="main-footer" className="bg-slate-950 text-slate-300 border-t border-slate-800 pt-10 pb-8 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-8 border-b border-slate-800/80">

          {/* Col 1: Brand & Bio */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-slate-950 font-black text-sm">
                {PERSONAL_INFO.initials}
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">
                  {PERSONAL_INFO.name}
                </h3>
                <p className="text-[11px] text-teal-400 font-medium flex items-center gap-1">
                  <Code2 className="w-3 h-3" /> Indie Developer
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Solo developer yang membangun aplikasi web, mobile, dan game dengan standar ketelitian tinggi — dari konsep sampai rilis.
            </p>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <MapPin className="w-3 h-3 text-teal-400" />
              <span>{CONTACT_INFO.location}</span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="md:col-span-3 space-y-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-white">
              Navigasi Halaman
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>
                <a href="#beranda" className="hover:text-teal-400 transition-colors">Beranda Utama</a>
              </li>
              <li>
                <a href="#tentang" className="hover:text-teal-400 transition-colors">Tentang Saya</a>
              </li>
              <li>
                <a href="#layanan" className="hover:text-teal-400 transition-colors">Jasa Development</a>
              </li>
              <li>
                <a href="#keahlian" className="hover:text-teal-400 transition-colors">Keahlian</a>
              </li>
              <li>
                <a href="#kontak" className="hover:text-teal-400 transition-colors">Kontak</a>
              </li>
            </ul>
          </div>

          {/* Col 3: Direct Connect & Socials */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-white">
              Koneksi Profesional
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Terhubung melalui email atau platform jejaring:
            </p>

            <div className="flex items-center gap-2">
              <a
                href={`mailto:${CONTACT_INFO.email}`}
                title="Kirim Email"
                className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 hover:border-teal-500 hover:text-teal-400 flex items-center justify-center transition-colors text-slate-300"
              >
                <Mail className="w-3.5 h-3.5" />
              </a>

              <a
                href={`https://wa.me/${CONTACT_INFO.phone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                title="WhatsApp"
                className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500 hover:text-emerald-400 flex items-center justify-center transition-colors text-slate-300"
              >
                <Phone className="w-3.5 h-3.5" />
              </a>

              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                title="LinkedIn"
                className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500 hover:text-indigo-400 flex items-center justify-center transition-colors text-slate-300"
              >
                <Linkedin className="w-3.5 h-3.5" />
              </a>

              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                title="GitHub"
                className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-400 hover:text-white flex items-center justify-center transition-colors text-slate-300"
              >
                <Github className="w-3.5 h-3.5" />
              </a>

              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                title="Instagram"
                className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 hover:border-pink-500 hover:text-pink-400 flex items-center justify-center transition-colors text-slate-300"
              >
                <Instagram className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="pt-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900 text-teal-400 border border-slate-800 text-[10px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
                Tersedia untuk Proyek & Development
              </span>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <p>
            © 2026 K. Arzhaning Jagad. All rights reserved.
          </p>

          <button
            onClick={scrollToTop}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors border border-slate-800 text-xs"
          >
            <span>Kembali ke Atas</span>
            <ArrowUp className="w-3 h-3" />
          </button>
        </div>

      </div>
    </footer>
  );
};
