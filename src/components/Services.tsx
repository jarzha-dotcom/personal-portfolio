import React from 'react';
import {
    Code2,
    Gamepad2,
    GraduationCap,
    FileSpreadsheet,
    ArrowRight,
    Sparkles,
    Zap,
    Shield,
    MessageCircle,
    Tag,
    Rocket,
    CheckCircle2,
    Globe,
    LayoutDashboard,
    Smartphone,
    Bot,
} from 'lucide-react';
import { CONTACT_INFO } from '../data/portfolioData';

interface ServicesProps {
    darkMode: boolean;
}

// ⚠️ MANUAL — situs ini nggak punya backend, jadi angka ini HARUS kamu
// update sendiri tiap dapat klien baru dari promo peluncuran. Begitu
// PROMO_SLOTS_TAKEN mencapai PROMO_SLOTS_TOTAL, sebaiknya banner promo
// di bawah dihapus/diganti (biar nggak keliatan "penuh" selamanya).
const PROMO_SLOTS_TOTAL = 5;
const PROMO_SLOTS_TAKEN = 1;

export const Services: React.FC<ServicesProps> = ({ darkMode }) => {
    const services = [
        {
            icon: <Gamepad2 className="w-6 h-6" />,
            title: 'Game Multiplayer & Board Game',
            description:
                'Pembuatan game berbasis web/mobile dengan fitur realtime multiplayer, lobby, matchmaking, sistem achievement, dan animasi interaktif (seperti B-Games).',
            features: ['Realtime Multiplayer', 'Lobby & Matchmaking', 'Custom Animations', 'Leaderboard'],
            color: 'amber',
        },
        {
            icon: <GraduationCap className="w-6 h-6" />,
            title: 'Aplikasi Edukasi Interaktif',
            description:
                'Pengembangan app edukasi anak dengan fitur Text-to-Speech (TTS), kuis gamifikasi, flashcard, dan dashboard progress untuk orang tua.',
            features: ['Text-to-Speech', 'Gamifikasi Badge', 'Mode Offline PWA', 'Dashboard Orang Tua'],
            color: 'teal',
        },
        {
            icon: <FileSpreadsheet className="w-6 h-6" />,
            title: 'Internal Tools & Dashboard Bisnis',
            description:
                'Pembuatan web app untuk manajemen aset, rekonsiliasi data, otomasi laporan, dan dashboard analitik untuk efisiensi operasional perusahaan.',
            features: ['Data Reconciliation', 'Export Excel/PDF', 'Realtime Dashboard', 'Audit Log'],
            color: 'indigo',
        },
        {
            icon: <Bot className="w-6 h-6" />,
            title: 'AI Chatbot & Voice Assistant',
            description:
                'Chatbot AI interaktif 2-arah (Teks & Suara) untuk website/bisnis. Dilengkapi lead generator WhatsApp otomatis, guardrail serverless aman, dan hybrid fallback zero-downtime.',
            features: ['Suara 2-Arah (STT + TTS)', 'Lead Generator WhatsApp', 'Multi-LLM (Gemini/GPT/Claude)', 'Hybrid Fallback Zero-Downtime'],
            color: 'purple',
        },
    ];

    // Estimasi harga "mulai dari" — bukan harga final. Final tetap lewat
    // diskusi kebutuhan (fitur, kompleksitas, timeline) di WhatsApp/form.
    const pricingTiers = [
        {
            icon: <Globe className="w-5 h-5" />,
            title: 'Landing Page',
            price: 'Rp 800rb',
            desc: 'Satu halaman untuk personal branding atau promosi produk tunggal.',
        },
        {
            icon: <LayoutDashboard className="w-5 h-5" />,
            title: 'Company Profile / Web App Sederhana',
            price: 'Rp 2,5jt',
            desc: 'Beberapa halaman informasi bisnis dengan desain custom & form kontak.',
        },
        {
            icon: <Bot className="w-5 h-5" />,
            title: 'AI Chatbot & Virtual Agent',
            price: 'Rp 1,5jt',
            desc: 'Chatbot AI cerdas + Suara 2-arah Chirp3-HD + WhatsApp lead generator + guardrail serverless.',
        },
        {
            icon: <FileSpreadsheet className="w-5 h-5" />,
            title: 'Web App Custom',
            price: 'Rp 6jt',
            desc: 'Dashboard, sistem internal, atau tools bisnis sesuai kebutuhan spesifik.',
        },
        {
            icon: <Smartphone className="w-5 h-5" />,
            title: 'Aplikasi Mobile',
            price: 'Rp 6jt',
            desc: 'Aplikasi Android/iOS dengan fitur custom sesuai kebutuhan.',
        },
        {
            icon: <Gamepad2 className="w-5 h-5" />,
            title: 'Game / Platform Multiplayer',
            price: 'Rp 12jt',
            desc: 'Game interaktif dengan backend realtime, matchmaking, dan sistem skor.',
        },
    ];

    const workflow = [
        { step: '01', title: 'Konsultasi Kebutuhan', desc: 'Diskusi ide, fitur, dan target pengguna' },
        { step: '02', title: 'Desain & Prototipe', desc: 'Wireframe UI/UX dan preview interaktif' },
        { step: '03', title: 'Development & Testing', desc: 'Coding, integrasi, dan QA menyeluruh' },
        { step: '04', title: 'Deployment & Rilis', desc: 'Deploy ke Vercel/Play Store + maintenance' },
    ];

    const getColorClasses = (color: string) => {
        switch (color) {
            case 'amber':
                return {
                    iconBg: darkMode ? 'bg-amber-500/20' : 'bg-amber-500/10',
                    iconText: darkMode ? 'text-amber-400' : 'text-amber-600',
                    dot: 'bg-amber-500',
                    featureBg: darkMode ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' : 'bg-amber-50 text-amber-700 border-amber-200',
                };
            case 'teal':
                return {
                    iconBg: darkMode ? 'bg-teal-500/20' : 'bg-teal-500/10',
                    iconText: darkMode ? 'text-teal-400' : 'text-teal-600',
                    dot: 'bg-teal-500',
                    featureBg: darkMode ? 'bg-teal-500/10 text-teal-300 border-teal-500/20' : 'bg-teal-50 text-teal-700 border-teal-200',
                };
            case 'indigo':
                return {
                    iconBg: darkMode ? 'bg-indigo-500/20' : 'bg-indigo-500/10',
                    iconText: darkMode ? 'text-indigo-400' : 'text-indigo-600',
                    dot: 'bg-indigo-500',
                    featureBg: darkMode ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' : 'bg-indigo-50 text-indigo-700 border-indigo-200',
                };
            case 'purple':
                return {
                    iconBg: darkMode ? 'bg-purple-500/20' : 'bg-purple-500/10',
                    iconText: darkMode ? 'text-purple-400' : 'text-purple-600',
                    dot: 'bg-purple-500',
                    featureBg: darkMode ? 'bg-purple-500/10 text-purple-300 border-purple-500/20' : 'bg-purple-50 text-purple-700 border-purple-200',
                };
            default:
                return {
                    iconBg: darkMode ? 'bg-slate-500/20' : 'bg-slate-500/10',
                    iconText: darkMode ? 'text-slate-400' : 'text-slate-600',
                    dot: 'bg-slate-500',
                    featureBg: darkMode ? 'bg-slate-500/10 text-slate-300 border-slate-500/20' : 'bg-slate-50 text-slate-700 border-slate-200',
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
                    <h2
                        className={`text-2xl sm:text-3xl font-extrabold tracking-tight mb-3 ${darkMode ? 'text-white' : 'text-slate-900'
                            }`}
                    >
                        Butuh Aplikasi atau Game Serupa?
                    </h2>
                    <p className={`text-sm sm:text-base ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        Saya menerima proyek{' '}
                        <span className={`font-semibold ${darkMode ? 'text-teal-400' : 'text-teal-600'}`}>
                            freelance / kontrak
                        </span>{' '}
                        untuk membangun aplikasi web, mobile, game, atau chatbot AI dari konsep hingga rilis. Dikerjakan secara mandiri dengan standar kualitas profesional.
                    </p>
                </div>

                {/* Services Grid — 4 kolom di desktop */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
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

                {/* Promo Peluncuran Banner */}
                <div
                    className={`relative overflow-hidden p-5 sm:p-6 rounded-2xl border mb-6 ${darkMode
                            ? 'bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border-amber-800/40'
                            : 'bg-gradient-to-r from-amber-50 via-white to-white border-amber-200'
                        }`}
                >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div
                            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${darkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-500/15 text-amber-600'
                                }`}
                        >
                            <Rocket className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                    Promo Peluncuran — Kuota 5 Klien Pertama
                                </h3>
                                <span
                                    className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${darkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-500/15 text-amber-700'
                                        }`}
                                >
                                    Terbatas
                                </span>
                            </div>
                            <ul className={`space-y-1 text-xs leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                <li className="flex items-start gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                    <span>Gratis technical support & bug fix 1 bulan pasca rilis di semua paket</span>
                                </li>
                                <li className="flex items-start gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                    <span>Tambahan 2x revisi mayor (di luar revisi standar)</span>
                                </li>
                                <li className="flex items-start gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                    <span>Bersedia proyek Anda dijadikan studi kasus portofolio (+testimoni)? Dapatkan diskon tambahan 15% dari estimasi harga</span>
                                </li>
                            </ul>
                            {/* Progress kuota — angkanya di-update manual di const di atas */}
                            <div className="mt-3 pt-3 border-t border-amber-500/20">
                                <div className="flex items-center justify-between text-[11px] mb-1.5">
                                    <span className={darkMode ? 'text-slate-300' : 'text-slate-600'}>Slot promo terisi</span>
                                    <span className={`font-bold ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                                        {PROMO_SLOTS_TAKEN} / {PROMO_SLOTS_TOTAL}
                                    </span>
                                </div>
                                <div
                                    className={`w-full h-2 rounded-full overflow-hidden ${darkMode ? 'bg-slate-800' : 'bg-amber-100'
                                        }`}
                                >
                                    <div
                                        className="bg-amber-500 h-full rounded-full transition-all duration-700"
                                        style={{ width: `${Math.min((PROMO_SLOTS_TAKEN / PROMO_SLOTS_TOTAL) * 100, 100)}%` }}
                                        role="progressbar"
                                        aria-valuenow={PROMO_SLOTS_TAKEN}
                                        aria-valuemin={0}
                                        aria-valuemax={PROMO_SLOTS_TOTAL}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pricing Tiers — 6 item, grid 3x2 di desktop */}
                <div
                    className={`p-6 rounded-2xl border mb-10 ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
                        }`}
                >
                    <div className="flex items-center gap-2 mb-5">
                        <Tag className={`w-4 h-4 ${darkMode ? 'text-teal-400' : 'text-teal-600'}`} />
                        <h3 className={`text-sm font-bold uppercase tracking-wider ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            Paket & Estimasi Harga
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {pricingTiers.map((tier, i) => (
                            <div
                                key={i}
                                className={`p-4 rounded-xl border flex flex-col ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                                    }`}
                            >
                                <div
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2.5 ${darkMode ? 'bg-teal-500/20 text-teal-400' : 'bg-teal-500/15 text-teal-600'
                                        }`}
                                >
                                    {tier.icon}
                                </div>
                                <h4 className={`text-xs font-bold mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                    {tier.title}
                                </h4>
                                <p className={`text-base font-extrabold mb-1.5 ${darkMode ? 'text-teal-400' : 'text-teal-600'}`}>
                                    Mulai {tier.price}
                                </p>
                                <p className={`text-[11px] leading-snug ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {tier.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                    <p className={`text-[11px] mt-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Harga di atas adalah estimasi awal — harga final ditentukan setelah diskusi kebutuhan detail (fitur, kompleksitas, timeline). Konsultasi awal selalu gratis.
                    </p>
                </div>

                {/* Why Choose Me — Mini Value Props */}
                <div
                    className={`p-6 rounded-2xl border mb-10 ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
                        }`}
                >
                    <h3
                        className={`text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 text-center justify-center ${darkMode ? 'text-white' : 'text-slate-900'
                            }`}
                    >
                        <Sparkles className={`w-4 h-4 ${darkMode ? 'text-teal-400' : 'text-teal-600'}`} />
                        Kenapa Bekerja Sama dengan Saya?
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            {
                                icon: <Zap className="w-4 h-4" />,
                                title: 'End-to-End, Tanpa Perantara',
                                desc: 'Dari ide, desain, coding, hingga deployment ditangani langsung oleh saya — tanpa estafet antar tim yang sering bikin miskomunikasi atau delay.',
                            },
                            {
                                icon: <Shield className="w-4 h-4" />,
                                title: 'Berpengalaman Korporat 7+ Tahun',
                                desc: 'Memahami kebutuhan bisnis nyata, bukan hanya coding. Hasilnya aplikasi yang fungsional, rapi, dan sesuai kebutuhan operasional bisnis.',
                            },
                            {
                                icon: <MessageCircle className="w-4 h-4" />,
                                title: 'Komunikasi Responsif',
                                desc: 'Update progres berkala via WhatsApp, transparan, dan terbuka untuk revisi selama pengembangan.',
                            },
                        ].map((item, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <div
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${darkMode ? 'bg-teal-500/20 text-teal-400' : 'bg-teal-500/10 text-teal-600'
                                        }`}
                                >
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
                    className={`p-6 sm:p-8 rounded-2xl border ${darkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-teal-50/50 border-teal-200'
                        }`}
                >
                    <h3
                        className={`text-sm font-bold uppercase tracking-wider mb-6 text-center ${darkMode ? 'text-white' : 'text-slate-900'
                            }`}
                    >
                        Alur Kerja Sederhana & Transparan
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {workflow.map((step, i) => (
                            <div key={i} className="flex items-start gap-2.5">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${darkMode ? 'bg-teal-500/20 text-teal-400' : 'bg-teal-600 text-white'
                                        }`}
                                >
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
                                'Halo Pak Arzha, saya tertarik dengan jasa development aplikasi (lihat ada promo peluncuran juga). Boleh diskusi lebih lanjut?'
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