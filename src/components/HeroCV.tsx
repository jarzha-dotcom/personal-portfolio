import React from 'react';
import { ArrowRight, Mail, MapPin, Briefcase, Printer, ShieldCheck, Percent } from 'lucide-react';
import { PERSONAL_INFO, STATS } from '../data/portfolioData';

interface HeroCVProps {
    darkMode: boolean;
    onPrint: () => void;
}

const scrollCvTo = (id: string) => {
    const container = document.getElementById('cv-easter-egg-page');
    const target = document.getElementById(id);
    if (container && target) {
        const offset = 80;
        const top = target.offsetTop - offset;
        container.scrollTo({ top, behavior: 'smooth' });
    }
};

export const HeroCV: React.FC<HeroCVProps> = ({ darkMode, onPrint }) => {
    return (
        <section
            id="cv-beranda"
            className={`relative pt-8 pb-12 md:pb-16 overflow-hidden transition-colors duration-200 ${darkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-teal-950 p-6 sm:p-8 rounded-2xl text-white shadow-sm border border-slate-800 mb-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
                        <div className="lg:col-span-8 flex flex-col items-start text-left">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                                <Briefcase className="w-3 h-3" />
                                <span>Terbuka untuk Peluang Kerja</span>
                                <span className="text-emerald-400/50">|</span>
                                <span className="flex items-center gap-1 text-slate-200">
                                    <MapPin className="w-3 h-3 text-emerald-400" /> {PERSONAL_INFO.location}
                                </span>
                            </div>

                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight text-white mb-2.5">
                                {PERSONAL_INFO.headline}
                            </h1>

                            <p className="text-slate-200 text-xs sm:text-sm max-w-2xl leading-relaxed mb-5">
                                {PERSONAL_INFO.subheadline}
                            </p>

                            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto no-print">
                                <button
                                    onClick={() => scrollCvTo('cv-pengalaman')}
                                    className="bg-white text-slate-900 px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors flex items-center gap-2"
                                >
                                    <span>Lihat Pengalaman</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={onPrint}
                                    className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/30 px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2"
                                >
                                    <Printer className="w-3.5 h-3.5" />
                                    <span>Cetak / Unduh CV</span>
                                </button>
                                <button
                                    onClick={() => scrollCvTo('cv-kontak')}
                                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2"
                                >
                                    <Mail className="w-3.5 h-3.5" />
                                    <span>Hubungi Saya</span>
                                </button>
                            </div>
                        </div>

                        <div className="lg:col-span-4 flex flex-col items-center lg:items-end justify-center">
                            <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-2xl p-1 bg-gradient-to-tr from-emerald-500 to-indigo-600 shadow-md">
                                <div className="w-full h-full rounded-xl overflow-hidden bg-slate-900 relative">
                                    <img
                                        src={PERSONAL_INFO.avatar}
                                        alt={PERSONAL_INFO.name}
                                        className="w-full h-full object-cover object-top"
                                        referrerPolicy="no-referrer"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
                                    <div className="absolute bottom-2 left-2 right-2 text-center">
                                        <p className="text-white text-xs font-bold truncate">{PERSONAL_INFO.name}</p>
                                        <p className="text-emerald-300 text-[10px] truncate">{PERSONAL_INFO.title}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { icon: Briefcase, label: 'Pengalaman', value: PERSONAL_INFO.yearsOfExperience },
                        { icon: ShieldCheck, label: 'Fokus Bidang', value: 'Audit & SOP' },
                        { icon: Percent, label: 'Akurasi Rekonsiliasi', value: STATS[1]?.value ?? '99%' },
                        { icon: MapPin, label: 'Domisili', value: PERSONAL_INFO.location },
                    ].map((item, i) => {
                        const Icon = item.icon;
                        return (
                            <div key={i} className={`p-3.5 rounded-xl border flex items-center gap-3 transition-colors ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
                                }`}>
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${darkMode ? 'bg-teal-500/20 text-teal-400' : 'bg-teal-500/15 text-teal-600'
                                    }`}>
                                    <Icon className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className={`text-[11px] font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'
                                        }`}>{item.label}</p>
                                    <p className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-slate-900'
                                        }`}>{item.value}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};