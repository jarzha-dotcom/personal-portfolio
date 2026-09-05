import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageSquare, X, Send, User, Wifi, WifiOff, Mic, Volume2, Square, Loader2, ExternalLink, MessageCircle } from 'lucide-react';
import Fuse from 'fuse.js';
import { CONTACT_INFO } from '../data/portfolioData';
import { sendMessageToGemini, ChatMessage } from '../services/geminiService';
import { saveMessages, loadMessages, saveGeminiHistory, loadGeminiHistory } from '../utils/chatStorage';
import {
    speak,
    stopSpeaking,
    startListening,
    stopListening,
    isSpeechSupported,
    BOT_VOICES,
} from '../services/voiceService';

// Voice Kania: Cewek (Google DeepMind Chirp3 HD Gacrux - Hangat, Ramah, Detail)
const KANIA_VOICE = BOT_VOICES.KANIA;

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
    isAI?: boolean;
    isStreaming?: boolean;
}

// System prompt khusus halaman CV — audiens: HRD / rekruter profesional
const CV_SYSTEM_PROMPT = `Kamu adalah "Kania", asisten virtual profesional Arzha (K. Arzhaning Jagad) yang dirancang khusus untuk menjawab pertanyaan HRD dan rekruter.

PROFIL ARZHA:
- Nama Lengkap: K. Arzhaning Jagad (akrab dipanggil Arzha)
- Domisili: Cibitung, Bekasi — siap kerja di Jabodetabek & Hybrid
- Pengalaman: 7+ tahun korporat, saat ini Staff Audit Internal di PT Global Multipart (Agustus 2019 - sekarang)
- Background sebelumnya: Admin & Kasir, Sales Promotion Boy, Operator Finishing PT Bintang Sempurna (2014-2019)

KOMPETENSI UTAMA:
- Audit Internal: SOP compliance, risk assessment, laporan audit, verifikasi aset
- ERP: SAP Business One (inventory, purchasing, sales order, verifikasi jurnal)
- Office: Excel expert (VLOOKUP, XLOOKUP, Pivot, IF-nested), Word, PowerPoint
- Tech (Side Project): React, TypeScript, Node.js, React Native — 3 proyek live
- Soft Skill: Teliti, detail-oriented, problem solving, komunikasi efektif, bekerja under pressure

KETERSEDIAAN:
- Terbuka untuk posisi audit internal, administrasi bisnis, atau peran yang memanfaatkan kombinasi skill korporat + teknologi
- Siap penempatan Jabodetabek & Hybrid/Remote

PEDOMAN JAWABAN:
- Jawab dengan singkat, padat, profesional namun ramah (1-3 kalimat cukup)
- Gunakan bahasa Indonesia formal-santai
- Jika rekruter butuh detail lebih, arahkan ke tombol WhatsApp
- JANGAN sebut kontak kecuali ditanya cara menghubungi
- Jangan membuat klaim yang tidak ada di knowledge base
- Tutup dengan 1 kalimat tawaran bantuan singkat`;

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

const generateMessageId = (prefix = 'msg'): string => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return `${prefix}-${crypto.randomUUID()}`;
    }
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

const MAX_DISPLAY_MESSAGES = 50;
const nowStr = () => new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
const CV_WELCOME_OPTIONS: QuickOption[] = CATEGORIES.map((c) => ({ id: c.id, label: c.label }));

export const ChatWidgetCV: React.FC<ChatWidgetCVProps> = ({ darkMode }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [aiMode, setAiMode] = useState<'ai' | 'fallback' | 'unknown'>('unknown');
    const [messages, setMessages] = useState<Message[]>(() => {
        const saved = loadMessages<Message>('cv_kania');
        if (saved && saved.length > 0) return saved.slice(-MAX_DISPLAY_MESSAGES);
        return [
            {
                id: 'welcome',
                sender: 'bot',
                text: 'Halo! Saya Kania, asisten Arzha untuk halaman CV 👋\nSilakan tanyakan soal pengalaman kerja, skill, ketersediaan, atau profil profesionalnya.',
                timestamp: nowStr(),
                options: CV_WELCOME_OPTIONS,
                isAI: true,
            },
        ];
    });
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const lastQueryRef = useRef<string>('');
    const geminiHistoryRef = useRef<ChatMessage[]>(loadGeminiHistory<ChatMessage>('cv_kania').slice(-10));
    const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

    // ── Voice Chat state ─────────────────────────────────────────────────────
    const [isListening, setIsListening] = useState(false);
    const [speakingId, setSpeakingId] = useState<string | null>(null);
    const [loadingSpeakId, setLoadingSpeakId] = useState<string | null>(null);
    const [voiceSupport] = useState(() => isSpeechSupported());
    const stopListenRef = useRef<(() => void) | null>(null);

    // Rate limiting — 12 detik antar request (safe untuk free tier)
    const lastRequestTimeRef = useRef<number>(0);
    const REQUEST_COOLDOWN = 12000;

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    // Debounced auto-save messages ke localStorage
    useEffect(() => {
        const timer = setTimeout(() => {
            saveMessages('cv_kania', messages.slice(-MAX_DISPLAY_MESSAGES));
        }, 400);
        return () => clearTimeout(timer);
    }, [messages]);

    useEffect(() => {
        return () => {
            timeoutsRef.current.forEach(clearTimeout);
            // ⚠️ Hentikan mic & audio TTS yang mungkin masih aktif saat widget unmount
            stopListening();
            stopSpeaking();
        };
    }, []);

    const cleanPhone = CONTACT_INFO.phone.replace(/[^0-9]/g, '');

    const standardCTA: QuickOption[] = [
        { id: 'menu', label: '⬅️ Menu Utama' },
        { id: 'whatsapp', label: '💬 Chat via WhatsApp' },
    ];

    const openWhatsApp = useCallback(() => {
        const context = lastQueryRef.current
            ? `Halo, saya ingin tanya soal: ${lastQueryRef.current}`
            : 'Halo, saya tertarik mendiskusikan peluang kerja.';
        window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(context)}`, '_blank');
    }, [cleanPhone]);

    const showCategoryMenu = () => {
        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            setMessages((prev) => [
                ...prev.slice(-(MAX_DISPLAY_MESSAGES - 1)),
                {
                    id: generateMessageId('bot'),
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
                ...prev.slice(-(MAX_DISPLAY_MESSAGES - 1)),
                {
                    id: generateMessageId('bot'),
                    sender: 'bot',
                    text: `Pilih pertanyaan seputar ${category.label.replace(/^\S+\s/, '')}:`,
                    timestamp: nowStr(),
                    options: [...items.map((f) => ({ id: f.id, label: f.quickLabel })), { id: 'menu', label: '⬅️ Menu Utama' }],
                },
            ]);
        }, 400);
    };

    // ── Bot reply helpers ──────────────────────────────────────────────────────
    const appendBotMessage = (text: string, options?: QuickOption[], isAI = false, autoSpeak = false) => {
        const msgId = generateMessageId('bot');
        setMessages((prev) => [
            ...prev.slice(-(MAX_DISPLAY_MESSAGES - 1)),
            {
                id: msgId,
                sender: 'bot',
                text,
                timestamp: nowStr(),
                options,
                isAI,
            },
        ]);
        if (autoSpeak) {
            handleToggleSpeak(msgId, text);
        }
    };

    const streamBotMessage = (
        fullText: string,
        options?: QuickOption[],
        isAI = true,
        autoSpeak = false
    ) => {
        const msgId = generateMessageId('bot');
        setMessages((prev) => [
            ...prev.slice(-(MAX_DISPLAY_MESSAGES - 1)),
            {
                id: msgId,
                sender: 'bot',
                text: '',
                timestamp: nowStr(),
                options: undefined,
                isAI,
                isStreaming: true,
            },
        ]);

        let currentIndex = 0;
        const totalLength = fullText.length;
        const chunkSize = totalLength > 280 ? 3 : totalLength > 120 ? 2 : 1;
        const speedMs = 18;

        const intervalId = window.setInterval(() => {
            currentIndex += chunkSize;
            if (currentIndex >= totalLength) {
                window.clearInterval(intervalId);
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === msgId
                            ? { ...m, text: fullText, options, isStreaming: false }
                            : m
                    )
                );
                if (autoSpeak) {
                    handleToggleSpeak(msgId, fullText);
                }
            } else {
                const partial = fullText.slice(0, currentIndex);
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === msgId ? { ...m, text: partial, isStreaming: true } : m
                    )
                );
            }
        }, speedMs);
    };

    const fallbackCTA: QuickOption[] = [
        { id: 'retry_kania', label: '✨ Coba Panggil Kania Lagi' },
        { id: 'menu', label: '⬅️ Menu Utama' },
        { id: 'whatsapp', label: '💬 Chat via WhatsApp' },
    ];

    const respondWithFAQ = (faq: FAQItem, isFromVoice = false) => {
        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            appendBotMessage(
                faq.answer,
                fallbackCTA,
                false,
                isFromVoice
            );
        }, 600);
    };

    const respondWithFallback = (isFromVoice = false) => {
        setIsTyping(true);
        const text = 'Hmm, saya belum punya data pasti untuk pertanyaan ini. Silakan coba panggil Kania lagi atau langsung hubungi via WhatsApp ya 👇';
        const id = setTimeout(() => {
            setIsTyping(false);
            appendBotMessage(text, fallbackCTA, false, isFromVoice);
        }, 600);
        timeoutsRef.current.push(id);
    };

    // ── AI (Gemini) response — khusus pertanyaan rekruter ──────────────────
    const respondWithAI = async (userText: string, isFromVoice = false) => {
        setIsTyping(true);

        // Cooldown check
        const now = Date.now();
        if (now - lastRequestTimeRef.current < REQUEST_COOLDOWN) {
            // Fallback ke Fuse.js saat cooldown
            const results = fuse.search(userText);
            const id = setTimeout(() => {
                setIsTyping(false);
                if (results.length > 0) {
                    appendBotMessage(`📋 ${results[0].item.answer}`, fallbackCTA, false, isFromVoice);
                } else {
                    respondWithFallback(isFromVoice);
                }
            }, 600);
            timeoutsRef.current.push(id);
            return;
        }
        lastRequestTimeRef.current = now;

        const userMsg: ChatMessage = { role: 'user', parts: [{ text: userText }] };
        try {
            const result = await sendMessageToGemini(
                [
                    // Inject system prompt sebagai pesan pertama dari model
                    { role: 'user', parts: [{ text: CV_SYSTEM_PROMPT }] },
                    { role: 'model', parts: [{ text: 'Siap! Saya Kania, asisten CV Arzha. Silakan tanyakan apa saja kepada saya.' }] },
                    ...geminiHistoryRef.current,
                ],
                userText
            );
            const replyText = result.reply;

            geminiHistoryRef.current = [
                ...geminiHistoryRef.current,
                userMsg,
                { role: 'model', parts: [{ text: replyText }] },
            ].slice(-10); // simpan 5 exchange terakhir

            // Persist Gemini history ke sessionStorage (bertahan selama tab terbuka)
            saveGeminiHistory('cv_kania', geminiHistoryRef.current);

            setAiMode('ai');
            setIsTyping(false);
            streamBotMessage(replyText, standardCTA, true, isFromVoice);

        } catch {
            // Graceful degradation ke Fuse.js
            setAiMode('fallback');
            const results = fuse.search(userText);
            if (results.length > 0) {
                const id = setTimeout(() => {
                    setIsTyping(false);
                    appendBotMessage(`📋 ${results[0].item.answer}`, fallbackCTA, false, isFromVoice);
                }, 600);
                timeoutsRef.current.push(id);
            } else {
                respondWithFallback(isFromVoice);
            }
        }
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
        if (id === 'retry_kania') {
            setAiMode('ai');
            if (lastQueryRef.current) {
                setMessages((prev) => [
                    ...prev.slice(-(MAX_DISPLAY_MESSAGES - 1)),
                    { id: generateMessageId('user'), sender: 'user', text: `✨ Coba tanya Kania: "${lastQueryRef.current}"`, timestamp: nowStr() },
                ]);
                respondWithAI(lastQueryRef.current);
            } else {
                setIsTyping(true);
                setTimeout(() => {
                    setIsTyping(false);
                    appendBotMessage('Hai! Kania sudah siap bantu jawab pertanyaan seputar CV dan pengalaman Mas Arzha lagi 😊', standardCTA, true);
                }, 400);
            }
            return;
        }
        const category = CATEGORIES.find((c) => c.id === id);
        if (category) {
            setMessages((prev) => [...prev.slice(-(MAX_DISPLAY_MESSAGES - 1)), { id: generateMessageId('user'), sender: 'user', text: label, timestamp: nowStr() }]);
            showCategoryQuestions(category);
            return;
        }
        const faq = FAQ_ITEMS.find((f) => f.id === id);
        if (faq) {
            setMessages((prev) => [...prev.slice(-(MAX_DISPLAY_MESSAGES - 1)), { id: generateMessageId('user'), sender: 'user', text: label, timestamp: nowStr() }]);
            lastQueryRef.current = faq.quickLabel;
            respondWithFAQ(faq);
        }
    };

    const sendMessage = (text: string, isFromVoice = false) => {
        if (!text.trim() || isTyping) return;
        const trimmed = text.trim();
        setMessages((prev) => [...prev.slice(-(MAX_DISPLAY_MESSAGES - 1)), { id: generateMessageId('user'), sender: 'user', text: trimmed, timestamp: nowStr() }]);
        setInputValue('');
        lastQueryRef.current = trimmed;

        // Deteksi intent alami jika user meminta kembali ke Kania
        const wantsKania = /kania|panggil kania|coba kania|coba lagi|mode ai|connect ai/i.test(trimmed);
        if (wantsKania && aiMode === 'fallback') {
            setAiMode('ai');
            respondWithAI(trimmed, isFromVoice);
            return;
        }

        // Jika AI sedang fallback, gunakan Fuse.js langsung
        if (aiMode === 'fallback') {
            const results = fuse.search(trimmed);
            if (results.length > 0) {
                respondWithFAQ(results[0].item, isFromVoice);
            } else {
                respondWithFallback(isFromVoice);
            }
        } else {
            // Coba AI dulu, Fuse.js sebagai fallback otomatis di dalam respondWithAI
            respondWithAI(trimmed, isFromVoice);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(inputValue);
        }
    };

    // ── Voice Chat: mic (STT) ────────────────────────────────────────────────
    const handleMicClick = () => {
        if (isListening) {
            stopListenRef.current?.();
            stopListenRef.current = null;
            setIsListening(false);
            return;
        }
        if (!voiceSupport.stt) return;

        stopSpeaking();
        setSpeakingId(null);

        const cleanup = startListening({
            lang: 'id-ID',
            onStart: () => setIsListening(true),
            onResult: (text, isFinal) => {
                setInputValue(text);
                if (isFinal && text.trim()) {
                    sendMessage(text, true);
                    setInputValue('');
                }
            },
            onEnd: () => {
                setIsListening(false);
                stopListenRef.current = null;
            },
            onError: (err) => {
                console.warn('[ChatWidgetCV] STT error:', err);
                setIsListening(false);
                stopListenRef.current = null;
            },
        });
        stopListenRef.current = cleanup;
    };

    // ── Voice Chat: play bot reply (TTS) ─────────────────────────────────────
    const handleToggleSpeak = async (messageId: string, text: string) => {
        if (speakingId === messageId) {
            stopSpeaking();
            setSpeakingId(null);
            return;
        }
        setLoadingSpeakId(messageId);
        await speak(text, {
            voice: KANIA_VOICE,
            onStart: () => {
                setLoadingSpeakId(null);
                setSpeakingId(messageId);
            },
            onEnd: () => {
                setLoadingSpeakId(null);
                setSpeakingId((current) => (current === messageId ? null : current));
            },
            onError: () => {
                setLoadingSpeakId(null);
                setSpeakingId(null);
            },
        });
    };

    // ── Smart Message Content Parser (Markdown + WhatsApp CTA) ────────────────
    const parseBold = (str: string) => {
        const parts = str.split(/(\*\*[^*]+\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return (
                    <strong
                        key={i}
                        className={`font-semibold ${darkMode ? 'text-teal-300' : 'text-teal-700'}`}
                    >
                        {part.slice(2, -2)}
                    </strong>
                );
            }
            return part;
        });
    };

    const formatInlineText = (str: string): React.ReactNode[] => {
        const tokens: React.ReactNode[] = [];
        const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
        let lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = linkRegex.exec(str)) !== null) {
            if (match.index > lastIndex) {
                tokens.push(...parseBold(str.substring(lastIndex, match.index)));
            }
            const label = match[1];
            const url = match[2];
            tokens.push(
                <a
                    key={`link-${match.index}`}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-500 hover:text-teal-400 underline font-medium inline-flex items-center gap-0.5"
                >
                    <span>{label}</span>
                    <ExternalLink className="w-2.5 h-2.5 inline ml-0.5 opacity-70" />
                </a>
            );
            lastIndex = match.index + match[0].length;
        }

        if (lastIndex < str.length) {
            tokens.push(...parseBold(str.substring(lastIndex)));
        }

        return tokens;
    };

    const renderMessageBody = (text: string, isUser: boolean, isStreaming?: boolean) => {
        if (isUser) {
            return <p className="whitespace-pre-wrap">{text}</p>;
        }

        if (!text && isStreaming) {
            return (
                <span className="inline-block w-1.5 h-3.5 align-middle bg-teal-400 animate-pulse" />
            );
        }

        const lines = text.split('\n');

        return (
            <div className="space-y-1.5 leading-relaxed text-xs">
                {lines.map((line, lineIdx) => {
                    if (!line.trim()) {
                        return <div key={lineIdx} className="h-1" />;
                    }

                    const waMatch = line.match(/\[([^\]]+)\]\((https?:\/\/wa\.me\/[^\s)]+)\)/);
                    if (waMatch) {
                        const [fullMatch, label, url] = waMatch;
                        const before = line.substring(0, line.indexOf(fullMatch));
                        const after = line.substring(line.indexOf(fullMatch) + fullMatch.length);

                        return (
                            <div key={lineIdx} className="my-2">
                                {before && <p className="mb-1.5">{formatInlineText(before)}</p>}
                                <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-md shadow-emerald-900/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <MessageCircle className="w-4 h-4 shrink-0 fill-current" />
                                    <span>{label}</span>
                                    <ExternalLink className="w-3 h-3 ml-1 opacity-80" />
                                </a>
                                {after && <p className="mt-1.5">{formatInlineText(after)}</p>}
                            </div>
                        );
                    }

                    const isBullet = line.startsWith('- ') || line.startsWith('* ');
                    const isLastLine = lineIdx === lines.length - 1;
                    return (
                        <p
                            key={lineIdx}
                            className={
                                isBullet
                                    ? `pl-2 border-l-2 ${darkMode ? 'border-teal-500/50' : 'border-teal-400'} my-0.5`
                                    : ''
                            }
                        >
                            {formatInlineText(isBullet ? line.slice(2) : line)}
                            {isStreaming && isLastLine && (
                                <span className="inline-block w-1.5 h-3.5 ml-1 align-middle bg-teal-400 animate-pulse" />
                            )}
                        </p>
                    );
                })}
            </div>
        );
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
                            <div className="relative">
                                <div className={`w-8 h-8 rounded-full text-white flex items-center justify-center text-xs font-bold shadow-md transition-all ${aiMode === 'fallback' ? 'bg-gradient-to-br from-amber-500 to-amber-700' : 'bg-gradient-to-br from-teal-500 to-teal-700'}`}>
                                    KA
                                </div>
                                <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 ${darkMode ? 'border-slate-800' : 'border-white'} ${aiMode === 'fallback' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <p className={`text-xs font-bold leading-none ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                        Kania
                                    </p>
                                    {aiMode !== 'unknown' && (
                                        <span className={`flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full font-medium ${aiMode === 'ai'
                                            ? darkMode ? 'bg-teal-900/60 text-teal-400' : 'bg-teal-50 text-teal-600'
                                            : darkMode ? 'bg-amber-900/50 text-amber-300' : 'bg-amber-50 text-amber-700'
                                            }`}>
                                            {aiMode === 'ai'
                                                ? <><Wifi className="w-2.5 h-2.5" /> Kania (AI)</>
                                                : <><WifiOff className="w-2.5 h-2.5" /> Direktori</>}
                                        </span>
                                    )}
                                </div>
                                <p className={`text-[10px] mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                    Asisten CV Arzha • {aiMode === 'fallback' ? 'Mode Direktori' : 'AI Live'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                stopListenRef.current?.();
                                stopListenRef.current = null;
                                setIsListening(false);
                                stopSpeaking();
                                setSpeakingId(null);
                                setIsOpen(false);
                            }}
                            className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                                }`}
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Fallback Notice Banner */}
                    {aiMode === 'fallback' && (
                        <div className={`px-3 py-1.5 flex items-center justify-between text-[10px] border-b ${darkMode ? 'bg-amber-950/40 border-amber-900/50 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                            <div className="flex items-center gap-1.5 min-w-0 pr-2">
                                <span className="text-xs shrink-0">📋</span>
                                <span className="truncate"><b>Mode Direktori:</b> AI sedang istirahat</span>
                            </div>
                            <button
                                onClick={() => handleOptionClick('retry_kania', 'Coba Kania')}
                                className={`shrink-0 px-2 py-0.5 rounded-md font-bold text-[9.5px] transition-all hover:scale-105 active:scale-95 shadow-sm ${darkMode
                                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                                    : 'bg-amber-500 hover:bg-amber-600 text-white'
                                    }`}
                            >
                                ✨ Coba Kania
                            </button>
                        </div>
                    )}

                    {/* Messages Body */}
                    <div className={`flex-1 p-3.5 overflow-y-auto chat-scrollbar space-y-3 text-xs ${darkMode ? 'bg-slate-900' : 'bg-slate-50'
                        }`}>
                        {messages.map((m) => (
                            <div key={m.id} className={`flex gap-2 animate-message-in ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {m.sender === 'bot' && (
                                    <div
                                        className={`w-6 h-6 rounded-full text-white flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold ${m.isAI === false ? 'bg-gradient-to-br from-amber-500 to-amber-700' : 'bg-gradient-to-br from-teal-500 to-teal-700'}`}
                                        title={m.isAI === false ? 'Kania (Mode Direktori)' : 'Kania (AI)'}
                                    >
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
                                        {renderMessageBody(m.text, m.sender === 'user', m.isStreaming)}
                                        <div className="flex items-center justify-between gap-2 mt-1">
                                            {m.sender === 'bot' ? (
                                                <button
                                                    aria-label={speakingId === m.id ? 'Hentikan suara' : 'Dengarkan jawaban'}
                                                    onClick={() => handleToggleSpeak(m.id, m.text)}
                                                    className={`shrink-0 flex items-center justify-center w-5 h-5 rounded-full transition-colors ${darkMode ? 'text-slate-400 hover:text-teal-400 hover:bg-slate-700/60' : 'text-slate-400 hover:text-teal-600 hover:bg-slate-100'}`}
                                                >
                                                    {loadingSpeakId === m.id ? (
                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                    ) : speakingId === m.id ? (
                                                        <Square className="w-2.5 h-2.5 fill-current" />
                                                    ) : (
                                                        <Volume2 className="w-3.5 h-3.5" />
                                                    )}
                                                </button>
                                            ) : (
                                                <span />
                                            )}
                                            <span className="block text-[9px] opacity-60 text-right">{m.timestamp}</span>
                                        </div>
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
                                <div className={`w-6 h-6 rounded-full text-white flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold ${aiMode === 'fallback' ? 'bg-gradient-to-br from-amber-500 to-amber-700' : 'bg-gradient-to-br from-teal-500 to-teal-700'}`}>
                                    KA
                                </div>
                                <div className={`px-3.5 py-2.5 rounded-xl rounded-bl-none flex items-center gap-1 ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200 shadow-sm'
                                    }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${aiMode === 'fallback' ? 'bg-amber-400' : 'bg-teal-400'}`} style={{ animationDelay: '0ms' }} />
                                    <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${aiMode === 'fallback' ? 'bg-amber-400' : 'bg-teal-400'}`} style={{ animationDelay: '150ms' }} />
                                    <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${aiMode === 'fallback' ? 'bg-amber-400' : 'bg-teal-400'}`} style={{ animationDelay: '300ms' }} />
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
                            placeholder={
                                isListening
                                    ? 'Mendengarkan... bicara sekarang'
                                    : aiMode === 'fallback' ? 'Tanya Kania (direktori)...' : 'Tanya Kania soal pengalaman Arzha...'
                            }
                            className={`flex-1 px-3 py-2 rounded-lg text-xs border focus:outline-none focus:ring-2 focus:ring-teal-500 ${darkMode
                                ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                                }`}
                        />
                        {voiceSupport.stt && (
                            <button
                                aria-label={isListening ? 'Berhenti merekam' : 'Bicara dengan mikrofon'}
                                title={isListening ? 'Berhenti merekam' : 'Bicara dengan mikrofon'}
                                onClick={handleMicClick}
                                disabled={isTyping}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${isListening
                                    ? 'bg-red-500 text-white animate-pulse'
                                    : darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                <Mic className="w-3.5 h-3.5" />
                            </button>
                        )}
                        <button
                            onClick={() => sendMessage(inputValue)}
                            disabled={!inputValue.trim() || isTyping}
                            className={`w-8 h-8 rounded-lg text-white flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${aiMode === 'fallback' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-teal-600 hover:bg-teal-700'}`}
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