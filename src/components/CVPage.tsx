import React, { useEffect, useState } from 'react';
import { NavbarCV } from './NavbarCV';
import { HeroCV } from './HeroCV';
import { AboutCV } from './AboutCV';
import { Experience } from './Experience';
import { SkillsCV } from './SkillsCV';
import { ContactCV } from './ContactCV';
import { FooterCV } from './FooterCV';
import { ChatWidgetCV } from './ChatWidgetCV';
import { CVDocumentModal } from './CVDocumentModal';

interface CVPageProps {
    darkMode: boolean;
    setDarkMode: (val: boolean) => void;
    onExit: () => void;
}

// Halaman ini muncul sebagai overlay full-screen saat easter egg
// (klik logo 5x di Navbar) ditemukan. Strukturnya "mirror" dari halaman
// jasa (Navbar, Hero, Kontak, Footer, ChatWidget) untuk dijelajahi
// on-screen. Tombol "Cetak / Unduh" TIDAK nge-print halaman ini langsung
// (kartu/banner-nya nggak enak dicetak) — melainkan membuka
// CVDocumentModal, dokumen CV bersih yang memang didesain untuk print/PDF.
export const CVPage: React.FC<CVPageProps> = ({ darkMode, setDarkMode, onExit }) => {
    const [showDocModal, setShowDocModal] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !showDocModal) onExit();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onExit, showDocModal]);

    return (
        <div
            id="cv-easter-egg-page"
            className={`fixed inset-0 z-[70] overflow-y-auto animate-in fade-in duration-300 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-900'
                }`}
        >
            {/*
        PRINT: saat CVDocumentModal terbuka dan user menekan cetak, kita
        HANYA ingin modal itu yang tercetak — bukan halaman jasa di
        belakangnya, bukan juga NavbarCV/HeroCV/dsb di Mode CV ini.
      */}
            <style>{`
        @page {
          size: A4;
          margin: 14mm 12mm;
        }
        @media print {
          html, body {
            height: auto !important;
            overflow: visible !important;
          }
          #app-root > *:not(#cv-easter-egg-page) {
            display: none !important;
          }
          #cv-easter-egg-page > *:not(#cv-document-modal) {
            display: none !important;
          }
          #cv-document-modal .no-print {
            display: none !important;
          }
        }
      `}</style>

            <NavbarCV
                darkMode={darkMode}
                setDarkMode={setDarkMode}
                onExit={onExit}
                onPrint={() => setShowDocModal(true)}
            />

            <main>
                <HeroCV darkMode={darkMode} onPrint={() => setShowDocModal(true)} />
                <AboutCV darkMode={darkMode} />
                <Experience darkMode={darkMode} />
                <SkillsCV darkMode={darkMode} />
                <ContactCV darkMode={darkMode} />
            </main>

            <FooterCV />
            <ChatWidgetCV darkMode={darkMode} />

            <CVDocumentModal isOpen={showDocModal} onClose={() => setShowDocModal(false)} />
        </div>
    );
};