import React, { useState } from 'react';
import {
    Mail,
    Phone,
    MapPin,
    Send,
    CheckCircle,
    Copy,
    MessageSquare,
    MessageCircle
} from 'lucide-react';
import { CONTACT_INFO } from '../data/portfolioData';

interface ContactCVProps {
    darkMode: boolean;
}

export const ContactCV: React.FC<ContactCVProps> = ({ darkMode }) => {
    const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
    const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [copiedEmail, setCopiedEmail] = useState(false);
    const [copiedPhone, setCopiedPhone] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.message) {
            setFormStatus('error');
            return;
        }
        setFormStatus('submitting');
        setTimeout(() => {
            setFormStatus('success');
            const mailtoUrl = `mailto:${CONTACT_INFO.email}?subject=${encodeURIComponent(
                formData.subject || `Peluang Kerja dari ${formData.name}`
            )}&body=${encodeURIComponent(
                `Nama: ${formData.name}\nEmail: ${formData.email}\n\nPesan:\n${formData.message}`
            )}`;
            window.location.href = mailtoUrl;
        }, 800);
    };

    const copyToClipboard = (text: string, type: 'email' | 'phone') => {
        navigator.clipboard.writeText(text);
        if (type === 'email') { setCopiedEmail(true); setTimeout(() => setCopiedEmail(false), 2000); }
        else { setCopiedPhone(true); setTimeout(() => setCopiedPhone(false), 2000); }
    };

    const cleanPhone = CONTACT_INFO.phone.replace(/[^0-9]/g, '');

    return (
        <section
            id="cv-kontak"
            className={`py-12 md:py-16 transition-colors duration-200 relative overflow-hidden ${darkMode ? 'bg-slate-900/80' : 'bg-slate-50'
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-10">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode
                        ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-800'
                        : 'text-emerald-600 bg-emerald-50 border border-emerald-200'
                        }`}>
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Tertarik Merekrut Saya?</span>
                    </div>
                    <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight mb-2 ${darkMode ? 'text-white' : 'text-slate-900'
                        }`}>
                        Mari Terhubung untuk Peluang Kerja
                    </h2>
                    <p className={`text-xs sm:text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        Terbuka untuk peluang kerja penuh waktu, posisi audit internal,{' '}
                        <span className={darkMode ? 'text-emerald-400 font-semibold' : 'text-emerald-600 font-semibold'}>
                            maupun undangan wawancara
                        </span>.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {/* Email */}
                    <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
                        }`}>
                        <div className="flex items-center justify-between mb-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-500/15 text-emerald-600'
                                }`}>
                                <Mail className="w-4 h-4" />
                            </div>
                            <button
                                onClick={() => copyToClipboard(CONTACT_INFO.email, 'email')}
                                className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-[11px] ${darkMode ? 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800' : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                                    }`}
                            >
                                {copiedEmail ? <><CheckCircle className="w-3 h-3" /> Tersalin</> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                        </div>
                        <h3 className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-400'
                            }`}>Email Resmi</h3>
                        <a href={`mailto:${CONTACT_INFO.email}`} className={`text-sm font-bold block break-all transition-colors ${darkMode ? 'text-white hover:text-emerald-400' : 'text-slate-900 hover:text-emerald-600'
                            }`}>{CONTACT_INFO.email}</a>
                        <p className={`text-[11px] mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            Respon cepat untuk undangan wawancara
                        </p>
                    </div>

                    {/* Phone */}
                    <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
                        }`}>
                        <div className="flex items-center justify-between mb-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-500/15 text-indigo-600'
                                }`}>
                                <Phone className="w-4 h-4" />
                            </div>
                            <a
                                href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent('Halo, saya tertarik mendiskusikan peluang kerja...')}`}
                                target="_blank" rel="noreferrer"
                                className={`px-2 py-0.5 text-[10px] font-semibold rounded flex items-center gap-1 transition-colors ${darkMode ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25' : 'bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25'
                                    }`}
                            >
                                <MessageCircle className="w-3 h-3" /> WhatsApp
                            </a>
                        </div>
                        <h3 className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-400'
                            }`}>Telepon & WhatsApp</h3>
                        <a href={`tel:${CONTACT_INFO.phone}`} className={`text-sm font-bold block transition-colors ${darkMode ? 'text-white hover:text-indigo-400' : 'text-slate-900 hover:text-indigo-600'
                            }`}>{CONTACT_INFO.displayPhone}</a>
                        <p className={`text-[11px] mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            Tersedia pada jam kerja
                        </p>
                    </div>

                    {/* Location */}
                    <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
                        }`}>
                        <div className="flex items-center justify-between mb-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-500/15 text-emerald-600'
                                }`}>
                                <MapPin className="w-4 h-4" />
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                                }`}>Domisili</span>
                        </div>
                        <h3 className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-400'
                            }`}>Lokasi Domisili</h3>
                        <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            {CONTACT_INFO.location}
                        </p>
                        <p className={`text-[11px] mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            Siap untuk penempatan Jabodetabek & Hybrid
                        </p>
                    </div>
                </div>

                <div className={`max-w-2xl mx-auto p-5 sm:p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
                    }`}>
                    <div className={`mb-4 pb-3 border-b ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                        <h3 className={`text-base font-bold mb-0.5 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            Kirimkan Pesan Langsung
                        </h3>
                        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            Isi formulir di bawah untuk undangan wawancara, tawaran posisi, atau diskusi lebih lanjut
                        </p>
                    </div>

                    {formStatus === 'success' ? (
                        <div className={`p-4 rounded-xl border text-center space-y-2 ${darkMode ? 'bg-emerald-950/60 border-emerald-800' : 'bg-emerald-50 border-emerald-200'
                            }`}>
                            <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto">
                                <CheckCircle className="w-5 h-5" />
                            </div>
                            <h4 className={`text-sm font-bold ${darkMode ? 'text-emerald-200' : 'text-emerald-900'}`}>
                                Pesan Telah Disiapkan!
                            </h4>
                            <p className={`text-xs ${darkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
                                Aplikasi email Anda akan otomatis terbuka.
                            </p>
                            <button
                                onClick={() => { setFormStatus('idle'); setFormData({ name: '', email: '', subject: '', message: '' }); }}
                                className="mt-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                            >Kirim Pesan Lain</button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <input type="text" required placeholder="Nama Anda" value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className={`w-full p-2.5 rounded-lg text-xs border focus:outline-none focus:ring-2 focus:ring-teal-500 ${darkMode ? 'bg-slate-800 border-slate-600 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                                        }`} />
                                <input type="email" required placeholder="Alamat Email" value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className={`w-full p-2.5 rounded-lg text-xs border focus:outline-none focus:ring-2 focus:ring-teal-500 ${darkMode ? 'bg-slate-800 border-slate-600 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                                        }`} />
                            </div>
                            <input type="text" placeholder="Subjek / Posisi yang Ditawarkan / Wawancara..." value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                className={`w-full p-2.5 rounded-lg text-xs border focus:outline-none focus:ring-2 focus:ring-teal-500 ${darkMode ? 'bg-slate-800 border-slate-600 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                                    }`} />
                            <textarea required rows={3} placeholder="Pesan Anda..." value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                className={`w-full p-2.5 rounded-lg text-xs border focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none ${darkMode ? 'bg-slate-800 border-slate-600 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                                    }`} />
                            {formStatus === 'error' && <p className="text-xs text-rose-500 font-medium">Harap lengkapi semua kolom wajib.</p>}
                            <div className="pt-1 flex items-center justify-between">
                                <span className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-400'}`}>Data dijaga kerahasiaannya.</span>
                                <button type="submit" disabled={formStatus === 'submitting'}
                                    className={`py-2 px-5 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 transition-colors ${darkMode ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-900 hover:bg-slate-800'
                                        }`}>
                                    <Send className="w-3.5 h-3.5" />
                                    <span>Kirim Pesan</span>
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </section>
    );
};