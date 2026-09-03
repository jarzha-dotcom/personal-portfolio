import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, User } from 'lucide-react';
import Fuse from 'fuse.js';
import { CONTACT_INFO } from '../data/portfolioData';

interface ChatWidgetCVProps {
    darkMode: boolean;
}

interface QuickOption {
    id: string;
    label: string;
}

interface Message {
    id: string;
    sender: 'user' | 'bot';
    text: string;
    timestamp: string;
    options?: QuickOption[];
}

interface Category {
    id: string;
    label: string;
}

interface FAQItem {
    id: string;
    categoryId: string;
    quickLabel: string;
    keywords: string[];
    answer: string;
}

// Widget ini khusus Mode CV — semua isi FAQ fokus ke pertanyaan
// perekrut (pengalaman audit, skill ERP, ketersediaan), bukan
// pertanyaan calon klien jasa development (itu porsi ChatWidget biasa).
const CATEGORIES: Category[] = [
    { id: 'pengalaman', label: '💼 Pengalaman Kerja' },
    { id: 'skill', label: '🛠️ Skill & Kompetensi' },
    { id: 'ketersediaan', label: '📋 Ketersediaan' },
    { id: 'dokumen', label: '📄 Dokumen & Portfolio' },
    { id: 'kontak', label: '📞 Kontak' },
];

const FAQ_ITEMS: FAQItem[] = [
    {
        id: 'peng-audit', categoryId: 'pengalaman', quickLabel: 'Pengalaman audit berapa lama?',
        keywords: ['pengalaman audit', 'lama kerja', 'berapa tahun', 'pengalaman kerja'],
        answer: '7+ tahun pengalaman di sektor korporat, saat ini sebagai Staff Audit Internal di PT Global Multipart.',
    },
    {
        id: 'peng-posisi', categoryId: 'pengalaman', quickLabel: 'Posisi terakhir apa?',
        keywords: ['posisi terakhir', 'jabatan sekarang', 'kerja di mana', 'pekerjaan sekarang'],
        answer: 'Staff Audit Internal di PT Global Multipart (Agustus 2019 - sekarang). Sebelumnya juga pernah di posisi Admin & Kasir serta Sales Promotion Boy di perusahaan yang sama.',
    },
    {
        id: 'peng-riwayat', categoryId: 'pengalaman', quickLabel: 'Riwayat kerja sebelumnya?',
        keywords: ['riwayat kerja', 'pernah kerja di mana', 'pengalaman sebelumnya', 'history kerja'],
        answer: 'Karir dimulai dari Sales Promotion Boy & Cleaning Service (2011), Operator Finishing di PT Bintang Sempurna (2014-2019), lalu berkembang jadi Admin/Kasir hingga Staff Audit Internal di PT Global Multipart (2019-sekarang).',
    },
    {
        id: 'skill-erp', categoryId: 'skill', quickLabel: 'Skill ERP/SAP?',
        keywords: ['sap', 'erp', 'sap business one', 'sistem erp'],
        answer: 'Menguasai SAP Business One untuk modul inventory, purchasing, sales order, dan verifikasi jurnal transaksi ERP.',
    },
    {
        id: 'skill-excel', categoryId: 'skill', quickLabel: 'Kemampuan Excel?',
        keywords: ['excel', 'microsoft office', 'spreadsheet', 'rumus excel'],
        answer: 'Expert di Excel — VLOOKUP, XLOOKUP, Pivot Table, IF-Nested — plus pelaporan Word dan presentasi PowerPoint.',
    },
    {
        id: 'skill-soft', categoryId: 'skill', quickLabel: 'Soft skill apa aja?',
        keywords: ['soft skill', 'kemampuan interpersonal', 'karakter kerja'],
        answer: 'Teliti & detail-oriented, problem solving, kerja sama tim, komunikasi efektif, manajemen waktu, dan terbiasa bekerja under pressure.',
    },
    {
        id: 'ketersediaan-status', categoryId: 'ketersediaan', quickLabel: 'Masih cari kerja?',
        keywords: ['masih cari kerja', 'available', 'terbuka lowongan', 'buka peluang'],
        answer: 'Terbuka untuk peluang kerja penuh waktu maupun kolaborasi, khususnya di bidang audit internal dan administrasi bisnis.',
    },
    {
        id: 'ketersediaan-lokasi', categoryId: 'ketersediaan', quickLabel: 'Siap penempatan di mana?',
        keywords: ['lokasi kerja', 'penempatan', 'domisili', 'remote atau onsite'],
        answer: 'Berdomisili di Cibitung, Bekasi. Siap untuk penempatan Jabodetabek & Hybrid.',
    },
    {
        id: 'dokumen-cv', categoryId: 'dokumen', quickLabel: 'Bisa minta CV lengkap?',
        keywords: ['cv lengkap', 'download cv', 'minta cv', 'pdf cv'],
        answer: 'Bisa! Klik tombol "Cetak / Unduh" di navbar atas, nanti muncul dokumen CV lengkap yang siap disimpan sebagai PDF.',
    },
    {
        id: 'dokumen-portfolio', categoryId: 'dokumen', quickLabel: 'Ada portofolio proyek dev juga?',
        keywords: ['portofolio developer', 'proyek coding', 'side project', 'indie developer'],
        answer: 'Ya, di luar audit saya juga aktif sebagai indie developer — sudah merilis 3 proyek: B-Games, Rajendra Pintar, dan Assets GMP. Detailnya ada di bagian Keahlian halaman ini.',
    },
    {
        id: 'kontak-cv', categoryId: 'kontak', quickLabel: 'Kontak & email?',
        keywords: ['kontak', 'email', 'whatsapp', 'nomor hp'],
        answer: 'Email atau WhatsApp lewat tombol di bawah, atau isi form di bagian Kontak halaman ini.',
    },
];

const fuse = new Fuse(FAQ_ITEMS, {
    keys: ['keywords', 'quickLabel'],
    threshold: 0.4,
    ignoreLocation: true,
});

const nowStr = () => new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

export const ChatWidgetCV: React.FC<ChatWidgetCVProps> = ({ darkMode }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            sender: 'bot',
            text: 'Halo! Saya asisten virtual Arzha 👋 Ada yang ingin ditanyakan soal pengalaman kerja, skill, atau ketersediaan?',
            timestamp: nowStr(),
            options: CATEGORIES.map((c) => ({ id: c.id, label: c.label })),
        },
    ]);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const lastQueryRef = useRef<string>('');

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const cleanPhone = CONTACT_INFO.phone.replace(/[^0-9]/g, '');

    const openWhatsApp = () => {
        const context = lastQueryRef.current
            ? `Halo, saya ingin tanya soal: ${lastQueryRef.current}`
            : 'Halo, saya tertarik mendiskusikan peluang kerja.';
        window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(context)}`, '_blank');
    };

    const showCategoryMenu = () => {
        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            setMessages((prev) => [
                ...prev,
                {
                    id: `bot-${Date.now()}`,
                    sender: 'bot',
                    text: 'Mau tanya soal apa lagi?',
                    timestamp: nowStr(),
                    options: CATEGORIES.map((c) => ({ id: c.id, label: c.label })),
                },
            ]);
        }, 400);
    };

    const showCategoryQuestions = (category: Category) => {
        const items = FAQ_ITEMS.filter((f) => f.categoryId === category.id);
        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            setMessages((prev) => [
                ...prev,
                {
                    id: `bot-${Date.now()}`,
                    sender: 'bot',
                    text: `Pilih pertanyaan seputar ${category.label.replace(/^\S+\s/, '')}:`,
                    timestamp: nowStr(),
                    options: [...items.map((f) => ({ id: f.id, label: f.quickLabel })), { id: 'menu', label: '⬅️ Menu Utama' }],
                },
            ]);
        }, 400);
    };

    const respondWithFAQ = (faq: FAQItem) => {
        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            setMessages((prev) => [
                ...prev,
                {
                    id: `bot-${Date.now()}`,
                    sender: 'bot',
                    text: faq.answer,
                    timestamp: nowStr(),
                    options: [
                        { id: 'menu', label: '⬅️ Menu Utama' },
                        { id: 'whatsapp', label: '💬 Chat via WhatsApp' },
                    ],
                },
            ]);
        }, 600);
    };

    const respondWithFallback = () => {
        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            setMessages((prev) => [
                ...prev,
                {
                    id: `bot-${Date.now()}`,
                    sender: 'bot',
                    text: 'Hmm, aku belum punya jawaban pasti soal itu. Tapi bisa langsung tanya lewat WhatsApp, nanti dijawab langsung 👇',
                    timestamp: nowStr(),
                    options: [
                        { id: 'menu', label: '⬅️ Menu Utama' },
                        { id: 'whatsapp', label: '💬 Chat via WhatsApp' },
                    ],
                },
            ]);
        }, 600);
    };

    const handleOptionClick = (id: string, label: string) => {
        if (id === 'whatsapp') {
            openWhatsApp();
            return;
        }
        if (id === 'menu') {
            showCategoryMenu();
            return;
        }
        const category = CATEGORIES.find((c) => c.id === id);
        if (category) {
            setMessages((prev) => [...prev, { id: `user-${Date.now()}`, sender: 'user', text: label, timestamp: nowStr() }]);
            showCategoryQuestions(category);
            return;
        }
        const faq = FAQ_ITEMS.find((f) => f.id === id);
        if (faq) {
            setMessages((prev) => [...prev, { id: `user-${Date.now()}`, sender: 'user', text: label, timestamp: nowStr() }]);
            lastQueryRef.current = faq.quickLabel;
            respondWithFAQ(faq);
        }
    };

    const sendMessage = (text: string) => {
        if (!text.trim()) return;
        const trimmed = text.trim();
        setMessages((prev) => [...prev, { id: `user-${Date.now()}`, sender: 'user', text: trimmed, timestamp: nowStr() }]);
        setInputValue('');

        const results = fuse.search(trimmed);
        if (results.length > 0) {
            lastQueryRef.current = trimmed;
            respondWithFAQ(results[0].item);
        } else {
            lastQueryRef.current = trimmed;
            respondWithFallback();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(inputValue);
        }
    };

    return (
        <div className="fixed bottom-6 left-6 z-50 no-print">
            {isOpen && (
                <div
                    className={`w-80 sm:w-96 h-[460px] rounded-2xl shadow-2xl border flex flex-col mb-3 overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
                        }`}
                >
                    {/* Header */}
                    <div className={`p-3.5 flex items-center justify-between border-b ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                        }`}>
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold">
                                KA
                            </div>
                            <div>
                                <p className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                    Asisten Mode CV
                                </p>
                                <p className={`text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                    Online • Siap menjawab
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                                }`}
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Messages Body */}
                    <div className={`flex-1 p-3.5 overflow-y-auto space-y-3 text-xs ${darkMode ? 'bg-slate-900' : 'bg-slate-50'
                        }`}>
                        {messages.map((m) => (
                            <div key={m.id} className={`flex gap-2 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {m.sender === 'bot' && (
                                    <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">
                                        KA
                                    </div>
                                )}
                                <div className="max-w-[85%] flex flex-col gap-1.5">
                                    <div
                                        className={`px-3 py-2 rounded-xl ${m.sender === 'user'
                                            ? 'bg-teal-600 text-white rounded-br-none ml-auto'
                                            : darkMode
                                                ? 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
                                                : 'bg-white text-slate-700 border border-slate-200 shadow-sm rounded-bl-none'
                                            }`}
                                    >
                                        <p>{m.text}</p>
                                        <span className="block text-[9px] opacity-60 text-right mt-1">{m.timestamp}</span>
                                    </div>
                                    {m.options && m.options.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {m.options.map((opt) => (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => handleOptionClick(opt.id, opt.label)}
                                                    className={`text-[10.5px] px-2.5 py-1.5 rounded-full border font-medium transition-colors ${opt.id === 'whatsapp'
                                                        ? darkMode
                                                            ? 'border-emerald-700 text-emerald-400 bg-emerald-950/40 hover:bg-emerald-900/40'
                                                            : 'border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                                                        : opt.id === 'menu'
                                                            ? darkMode
                                                                ? 'border-slate-600 text-slate-300 hover:bg-slate-700'
                                                                : 'border-slate-300 text-slate-600 hover:bg-slate-100'
                                                            : darkMode
                                                                ? 'border-teal-700 text-teal-300 bg-teal-950/30 hover:bg-teal-900/40'
                                                                : 'border-teal-200 text-teal-700 bg-teal-50 hover:bg-teal-100'
                                                        }`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {m.sender === 'user' && (
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'
                                        }`}>
                                        <User className="w-3 h-3" />
                                    </div>
                                )}
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex gap-2 justify-start">
                                <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">
                                    KA
                                </div>
                                <div className={`px-3.5 py-2.5 rounded-xl rounded-bl-none flex items-center gap-1 ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200 shadow-sm'
                                    }`}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className={`p-2.5 border-t flex items-center gap-2 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
                        }`}>
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ketik pertanyaan..."
                            className={`flex-1 px-3 py-2 rounded-lg text-xs border focus:outline-none focus:ring-2 focus:ring-teal-500 ${darkMode
                                ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                                }`}
                        />
                        <button
                            onClick={() => sendMessage(inputValue)}
                            className="w-8 h-8 rounded-lg bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center transition-colors"
                        >
                            <Send className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-12 h-12 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center shadow-xl shadow-amber-500/25 transition-all hover:scale-105 active:scale-95 border-2 border-slate-900"
                title="Tanya Asisten Mode CV"
            >
                {isOpen ? <X className="w-5 h-5" /> : <MessageSquare className="w-5 h-5 font-bold" />}
            </button>
        </div>
    );
};