import React from 'react';
import {
    Code2,
    Gamepad2,
    GraduationCap,
    FileSpreadsheet,
    ArrowRight,
    CheckCircle2,
    Sparkles,
    Zap,
    Shield,
    MessageCircle
} from 'lucide-react';
import { CONTACT_INFO } from '../data/portfolioData';

interface ServicesProps {
    darkMode: boolean;
}

export const Services: React.FC<ServicesProps> = ({ darkMode }) => {
    const services = [
        {
            icon: <Gamepad2 className="w-6 h-6" />,
            title: 'Game Multiplayer & Board Game',
            description:
                'Pembuatan game berbasis web/mobile dengan fitur realtime multiplayer, lobby, matchmaking, sistem achievement, dan animasi interaktif (seperti B-Games).',
            features: ['Realtime Multiplayer', 'Lobby & Matchmaking', 'Custom Animations', 'Leaderboard'],
            color: 'amber'
        },
        {
            icon: <GraduationCap className="w-6 h-6" />,
            title: 'Aplikasi Edukasi Interaktif',
            description:
                'Pengembangan app edukasi anak dengan fitur Text-to-Speech (TTS), kuis gamifikasi, flashcard, dan dashboard progress untuk orang tua.',
            features: ['Text-to-Speech', 'Gamifikasi Badge', 'Mode Offline PWA', 'Dashboard Orang Tua'],
            color: 'teal'
        },
        {
            icon: <FileSpreadsheet className="w-6 h-6" />,
            title: 'Internal Tools & Dashboard Bisnis',
            description:
                'Pembuatan web app untuk manajemen aset, rekonsiliasi data, otomasi laporan, dan dashboard analitik untuk efisiensi operasional perusahaan.',
            features: ['Data Reconciliation', 'Export Excel/PDF', 'Realtime Dashboard', 'Audit Log'],
            color: 'indigo'
        }
    ];

    const workflow = [
        { step: '01', title: 'Konsultasi Kebutuhan', desc: 'Diskusi ide, fitur, dan target pengguna' },
        { step: '02', title: 'Desain & Prototipe', desc: 'Wireframe UI/UX dan preview interaktif' },
        { step: '03', title: 'Development & Testing', desc: 'Coding, integrasi, dan QA menyeluruh' },
        { step: '04', title: 'Deployment & Rilis', desc: 'Deploy ke Vercel/Play Store + maintenance' }
    ];

    const getColorClasses = (color: string) => {
        switch (color) {
            case 'amber':
                return {
                    iconBg: darkMode ? 'bg-amber-500/20' : 'bg-amber-500/10',
                    iconText: darkMode ? 'text-amber-400' : 'text-amber-600',
                    dot: 'bg-amber-500',
                    featureBg: darkMode ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' : 'bg-amber-50 text-amber-700 border-amber-200'
                };
            case 'teal':
                return {
                    iconBg: darkMode ? 'bg-teal-500/20' : 'bg-teal-500/10',
                    iconText: darkMode ? 'text-teal-400' : 'text-teal-600',
                    dot: 'bg-teal-500',
                    featureBg: darkMode ? 'bg-teal-500/10 text-teal-300 border-teal-500/20' : 'bg-teal-50 text-teal-700 border-teal-200'
                };
            case 'indigo':
                return {
                    iconBg: darkMode ? 'bg-indigo-500/20' : 'bg-indigo-500/10',
                    iconText: darkMode ? 'text-indigo-400' : 'text-indigo-600',
                    dot: 'bg-indigo-500',
                    featureBg: darkMode ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                };
            default:
                return {
                    iconBg: darkMode ? 'bg-slate-500/20' : 'bg-slate-500/10',
                    iconText: darkMode ? 'text-slate-400' : 'text-slate-600',
                    dot: 'bg-slate-500',
                    featureBg: darkMode ? 'bg-slate-500/10 text-slate-300 border-slate-500/20' : 'bg-slate-50 text-slate-700 border-slate-200'
                };
        }
    };

    const cleanPhone = CONTACT_INFO.phone.replace(/[^0-9]/g, '');

    return (
        <section
            id="layanan"
            className={`py-14 md:py-20 transition-colors duration-200 ${darkMode ? 'bg-slate-950 border-t border-slate-800' : 'bg-white border-t border-slate-200'
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <div
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-3 ${darkMode
                                ? 'text-teal-400 bg-teal-950/60 border border-teal-800'
                                : 'text-teal-600 bg-teal-50 border border-teal-200'
                            }`}
                    >
                        <Code2 className="w-3.5 h-3.5" />
                        <span>Jasa Pengembangan</span>
                    </div>
                    <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight mb-3 ${darkMode ? 'text-white' : 'text-slate-900'
                        }`}>
                        Butuh Aplikasi atau Game Serupa?
                    </h2>
                    <p className={`text-sm sm:text-base ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        Saya menerima proyek{' '}
                        <span className={`font-semibold ${darkMode ? 'text-teal-400' : 'text-teal-600'}`}>
                            freelance / kontrak
                        </span>{' '}
                        untuk membangun aplikasi web, mobile, atau game dari konsep hingga rilis. Dikerjakan secara mandiri dengan standar kualitas profesional.
                    </p>
                </div>

                {/* Services Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {services.map((service, idx) => {
                        const colors = getColorClasses(service.color);
                        return (
                            <div
                                key={idx}
                                className={`p-6 rounded-2xl border transition-all duration-200 hover:-translate-y-1 ${darkMode
                                        ? 'bg-slate-900 border-slate-700 hover:border-slate-600'
                                        : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:shadow-md'
                                    }`}
                            >
                                <div
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${colors.iconBg} ${colors.iconText}`}
                                >
                                    {service.icon}
                                </div>
                                <h3 className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                    {service.title}
                                </h3>
                                <p className={`text-sm leading-relaxed mb-4 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                    {service.description}
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {service.features.map((feat, i) => (
                                        <span
                                            key={i}
                                            className={`text-[10px] font-semibold px-2 py-1 rounded-md border ${colors.featureBg}`}
                                        >
                                            {feat}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Why Choose Me — Mini Value Props */}
                <div className={`p-6 rounded-2xl border mb-10 ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
                    }`}>
                    <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 text-center justify-center ${darkMode ? 'text-white' : 'text-slate-900'
                        }`}>
                        <Sparkles className={`w-4 h-4 ${darkMode ? 'text-teal-400' : 'text-teal-600'}`} />
                        Kenapa Bekerja Sama dengan Saya?
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            {
                                icon: <Zap className="w-4 h-4" />,
                                title: 'Solo Developer End-to-End',
                                desc: 'Dari ide, desain, coding, hingga deployment — dikerjakan satu tangan, komunikasi langsung tanpa perantara.'
                            },
                            {
                                icon: <Shield className="w-4 h-4" />,
                                title: 'Berpengalaman Korporat 7+ Tahun',
                                desc: 'Memahami kebutuhan bisnis nyata, bukan hanya coding. Hasilnya aplikasi yang fungsional, rapi, dan sesuai kebutuhan operasional bisnis.'
                            },
                            {
                                icon: <MessageCircle className="w-4 h-4" />,
                                title: 'Komunikasi Responsif',
                                desc: 'Update progres berkala via WhatsApp, transparan, dan terbuka untuk revisi selama pengembangan.'
                            }
                        ].map((item, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${darkMode ? 'bg-teal-500/20 text-teal-400' : 'bg-teal-500/10 text-teal-600'
                                    }`}>
                                    {item.icon}
                                </div>
                                <div>
                                    <h4 className={`text-xs font-bold mb-0.5 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                        {item.title}
                                    </h4>
                                    <p className={`text-[11px] leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                        {item.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Workflow / Process */}
                <div
                    className={`p-6 sm:p-8 rounded-2xl border ${darkMode
                            ? 'bg-slate-900/50 border-slate-700'
                            : 'bg-teal-50/50 border-teal-200'
                        }`}
                >
                    <h3 className={`text-sm font-bold uppercase tracking-wider mb-6 text-center ${darkMode ? 'text-white' : 'text-slate-900'
                        }`}>
                        Alur Kerja Sederhana & Transparan
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {workflow.map((step, i) => (
                            <div key={i} className="flex items-start gap-2.5">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${darkMode ? 'bg-teal-500/20 text-teal-400' : 'bg-teal-600 text-white'
                                    }`}>
                                    {step.step}
                                </div>
                                <div>
                                    <p className={`text-xs sm:text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                        {step.title}
                                    </p>
                                    <p className={`text-[11px] leading-snug ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                        {step.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="text-center">
                        <a
                            href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                                'Halo Pak Arzha, saya tertarik dengan jasa development aplikasi. Boleh diskusi lebih lanjut?'
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold shadow-lg shadow-teal-600/20 transition-all hover:scale-105 active:scale-95"
                        >
                            <MessageCircle className="w-4 h-4" />
                            <span>Diskusikan Proyek Anda via WhatsApp</span>
                            <ArrowRight className="w-4 h-4" />
                        </a>
                        <p className={`text-[11px] mt-3 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            Konsultasi awal gratis, tanpa komitmen.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};
