import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Printer,
  Mail,
  Phone,
  MapPin,
  Building2
} from 'lucide-react';
import {
  PERSONAL_INFO,
  CONTACT_INFO,
  EXPERIENCES,
  HARD_SKILLS,
  SOFT_SKILLS
} from '../data/portfolioData';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface CVDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Dokumen CV bersih, siap cetak/PDF. Sengaja TIDAK memakai kartu/banner
// bergaya situs (itu urusan CVPage) — modal ini murni untuk hasil cetak
// yang rapi: header, ringkasan, pengalaman, dan keahlian dalam satu alur
// dokumen sederhana, selalu tema terang agar hemat tinta.
//
// PENTING soal print: ada DUA lapis container di sini (overlay luar +
// kartu putih di dalamnya) dan keduanya punya overflow/max-height
// sendiri-sendiri untuk kebutuhan tampilan di layar. Kalau salah satu
// saja lupa di-override saat print, hasilnya kepotong/cuma capture
// bagian yang keliatan di layar — makanya class `print:` di bawah
// dipasang di KEDUA div, bukan cuma yang luar.
export const CVDocumentModal: React.FC<CVDocumentModalProps> = ({ isOpen, onClose }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  useFocusTrap(cardRef, isOpen);

  useEffect(() => {
    if (!isOpen) return;
    // Ganti document.title lewat event beforeprint/afterprint, BUKAN cuma di
    // dalam handlePrint — supaya nama file PDF ("K. Arzhaning Jagad - CV")
    // tetap benar walau user memicu print lewat Ctrl+P atau menu browser,
    // bukan cuma lewat tombol "Cetak / Simpan PDF" di modal ini.
    const originalTitle = document.title;
    const handleBeforePrint = () => {
      document.title = `${PERSONAL_INFO.name} - CV`;
    };
    const handleAfterPrint = () => {
      document.title = originalTitle;
    };
    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
      document.title = originalTitle;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    // Fokuskan card begitu modal terbuka, biar pengguna keyboard/screen
    // reader langsung "masuk" ke dokumen alih-alih tetap di elemen pemicu.
    cardRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  // CATATAN PENTING soal print (dibaca setelah beberapa kali percobaan):
  // Class `print:` di container (fixed -> static, overflow-visible, dst)
  // SEHARUSNYA cukup secara teori, tapi di Chrome nyatanya sering tetap
  // ke-cut cuma sebatas 1 layar. Penyebabnya: elemen `position: fixed`
  // yang berada di DALAM ancestor lain yang overflow-nya ke-lock (mis.
  // body discroll-lock saat modal terbuka) membuat mesin cetak Chrome
  // menghitung tinggi halaman dari viewport yang terkunci itu, BUKAN
  // dari tinggi asli konten setelah `print:static` diterapkan.
  //
  // Solusi paling aman & konsisten lintas-browser: JANGAN mengandalkan
  // reflow otomatis dari fixed->static. Sebagai gantinya pakai teknik
  // "visibility trick" — sembunyikan SEMUA elemen lain di body saat
  // print, lalu tampilkan cuma #cv-document-modal dan posisikan absolute
  // dari titik (0,0). Ini juga sekaligus memaksa html/body overflow
  // kembali visible walau ada scroll-lock dari modal.
  // Portal ke document.body: ini kunci tambahan supaya modal ini benar-benar
  // lepas dari tree <App/> saat ini. Kalau ada container lain di atasnya
  // (mis. #root dengan height:100vh; overflow:hidden — pola umum di layout
  // SPA full-screen) dia akan tetap nge-clip elemen position:absolute kita
  // walau CSS print sudah dipaksa di modal & html/body. Dengan portal,
  // modal jadi child langsung dari <body>, jadi tidak ada lagi ancestor
  // yang bisa clip dia saat print.
  return createPortal(
    <>
      <style>{`
        @media print {
          html, body {
            height: auto !important;
            overflow: visible !important;
          }
          body * {
            visibility: hidden;
          }
          #cv-document-modal,
          #cv-document-modal * {
            visibility: visible;
          }
          #cv-document-modal {
            position: absolute !important;
            top: 0;
            left: 0;
            width: 100%;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            overflow: visible !important;
          }
          #cv-document-card {
            max-height: none !important;
            max-width: none !important;
            height: auto !important;
            width: 100% !important;
            overflow: visible !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 12mm;
          }
        }
      `}</style>
      <div
        id="cv-document-modal"
        className="fixed inset-0 z-[80] overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200 print:static print:block print:p-0 print:bg-white print:backdrop-blur-none print:overflow-visible print:h-auto"
      >
        <div
          id="cv-document-card"
          ref={cardRef}
          role="dialog"
          aria-modal="true"
          aria-label={`Dokumen CV ${PERSONAL_INFO.name}`}
          tabIndex={-1}
          className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 shadow-2xl bg-white text-slate-900 focus:outline-none print:max-h-none print:max-w-none print:overflow-visible print:rounded-none print:border-none print:shadow-none"
        >

          {/* Floating Top Controls (No-print) */}
          <div className="sticky top-0 z-20 px-6 py-4 border-b border-slate-200 flex items-center justify-between no-print backdrop-blur-md bg-white/90">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-600 flex items-center justify-center font-bold text-xs">
                CV
              </div>
              <div>
                <h3 className="font-bold text-sm">Dokumen CV</h3>
                <p className="text-[11px] text-slate-500">Format Resmi Siap Cetak / Unduh PDF</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak / Simpan PDF</span>
              </button>

              <button
                onClick={onClose}
                aria-label="Tutup dokumen CV"
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* CV Document Body */}
          <div className="p-8 sm:p-12 space-y-8 bg-white text-slate-900 print:p-0 print:m-0">

            {/* Header */}
            <div className="border-b border-slate-200 pb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 print:break-inside-avoid">
              <div>
                <h1 className="text-3xl font-extrabold text-slate-950 tracking-tight">
                  {PERSONAL_INFO.name}
                </h1>
                <p className="text-base font-bold text-teal-700 mt-1">
                  {PERSONAL_INFO.title}
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
                  Spesialis Audit Internal, Kepatuhan SOP, Administrasi Korporat & Analisis Data
                </p>
              </div>

              <div className="flex flex-col gap-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-teal-600" />
                  <a href={`mailto:${CONTACT_INFO.email}`} className="hover:underline font-medium print:text-slate-900 print:no-underline">
                    {CONTACT_INFO.email}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-teal-600" />
                  <span className="font-medium">{CONTACT_INFO.displayPhone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-teal-600" />
                  <span>{CONTACT_INFO.location}</span>
                </div>
              </div>
            </div>

            {/* Ringkasan Profil */}
            <div className="print:break-inside-avoid">
              <h2 className="text-sm font-bold uppercase tracking-wider text-teal-800 border-b border-teal-100 pb-1 mb-2">
                Ringkasan Profesional
              </h2>
              <p className="text-xs sm:text-sm leading-relaxed text-slate-700">
                {PERSONAL_INFO.about}
              </p>
            </div>

            {/* Pengalaman Kerja */}
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-teal-800 border-b border-teal-100 pb-1 mb-4">
                Pengalaman Kerja
              </h2>
              <div className="space-y-6">
                {EXPERIENCES.map((exp) => (
                  <div key={exp.id} className="space-y-2 print:break-inside-avoid">
                    <div className="flex flex-wrap items-center justify-between text-xs sm:text-sm">
                      <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-teal-600" />
                        <span>{exp.company}</span>
                      </h3>
                      <span className="font-semibold text-slate-500">{exp.period} | {exp.location}</span>
                    </div>

                    <div className="pl-4 space-y-3 border-l-2 border-slate-200">
                      {exp.roles.map((role, rIdx) => (
                        <div key={rIdx} className="space-y-1 print:break-inside-avoid">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-800">{role.role}</span>
                            {role.period && <span className="text-[11px] text-teal-700 font-medium">{role.period}</span>}
                          </div>
                          <ul className="list-disc list-inside space-y-0.5 text-xs text-slate-600 print:break-inside-avoid">
                            {role.tasks.map((t, tIdx) => (
                              <li key={tIdx} className="leading-relaxed">{t}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Keahlian Teknis & Soft Skills */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 print:break-inside-avoid">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-teal-800 border-b border-teal-100 pb-1 mb-3">
                  Keahlian Teknis (Hard Skills)
                </h2>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {HARD_SKILLS.map((h, i) => (
                    <li key={i} className="flex items-center justify-between">
                      <span className="font-semibold">• {h.name}</span>
                      <span className="text-teal-700 font-bold">{h.level}%</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-teal-800 border-b border-teal-100 pb-1 mb-3">
                  Soft Skills
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {SOFT_SKILLS.map((s, i) => (
                    <span key={i} className="px-2.5 py-1 rounded bg-slate-100 text-slate-800 text-xs font-medium">
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>,
    document.body
  );
};