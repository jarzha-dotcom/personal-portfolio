import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageSquare, X, Send, User, Wifi, WifiOff, Mic, Volume2, Square, Loader2, ExternalLink, MessageCircle, Paperclip, FileText, Download, Plus, History, Trash2 } from 'lucide-react';
import Fuse from 'fuse.js';
import { Portal } from './Portal';
import { CONTACT_INFO } from '../data/portfolioData';
import { sendMessageToGemini, ChatMessage, Attachment, OutgoingFile } from '../services/geminiService';
import {
    createConversation,
    getActiveConversationId,
    setActiveConversationId,
    loadConversation,
    saveConversation,
    listConversations,
    deleteConversation,
    deriveConversationTitle,
    StoredConversation,
} from '../utils/chatStorage';
import { BOT_VOICES } from '../services/voiceService';
import { useVoiceChat } from '../hooks/useVoiceChat';
import { useStreamingText } from '../hooks/useStreamingText';
import { downloadChatSummaryFile } from '../utils/chatSummaryGenerator';
import { useRegisterModal } from '../context/NavigationHistoryContext';

const KANIA_LOADING_STATUSES = [
    'Menyiapkan informasi...',
    'Mengecek portofolio & data CV...',
    'Menyusun jawaban profesional...',
    'Menyempurnakan detail jawaban...',
];

// Voice Kania: Cewek (Google DeepMind Chirp3 HD Gacrux - Hangat, Ramah, Detail)
const KANIA_VOICE = BOT_VOICES.KANIA;

interface ChatWidgetCVProps {
    darkMode: boolean;
}

interface QuickOption {
    id: string;
    label: string;
}

/** File yang lagi disiapkan user buat diupload (preview sebelum dikirim) */
interface PendingFile {
    id: string;
    name: string;
    mimeType: string;
    data: string; // base64 tanpa prefix data:...;base64,
    previewUrl?: string; // cuma ada kalau image, buat thumbnail
}

const ALLOWED_UPLOAD_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf', 'text/csv'];
const MAX_UPLOAD_FILES = 3;
const MAX_UPLOAD_FILE_BYTES = 6 * 1024 * 1024; // cocokkan dengan limit di chat.ts

interface Message {
    id: string;
    sender: 'user' | 'bot';
    text: string;
    timestamp: string;
    options?: QuickOption[];
    isAI?: boolean;
    isStreaming?: boolean;
    /** File yang di-upload user bareng pesan ini (mis. CV/portofolio buat direview) */
    uploadedFiles?: PendingFile[];
    /** Kania tidak lewat Antigravity Agent, jadi field ini praktis selalu kosong —
     * tetap disediakan biar tipe & pola render konsisten dengan widget lain. */
    attachments?: Attachment[];
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

const buildWelcomeMessage = (): Message => ({
    id: 'welcome',
    sender: 'bot',
    text: 'Halo! Saya Kania, asisten Arzha untuk halaman CV 👋\nSilakan tanyakan soal pengalaman kerja, skill, ketersediaan, atau profil profesionalnya.',
    timestamp: nowStr(),
    options: CV_WELCOME_OPTIONS,
    isAI: true,
});

export const ChatWidgetCV: React.FC<ChatWidgetCVProps> = ({ darkMode }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Hubungkan tombol kembali browser agar menutup popup chat widget di mode CV
    useRegisterModal('chat-widget-cv-drawer', isOpen, () => setIsOpen(false));

    const [isTyping, setIsTyping] = useState(false);
    const [loadingTextIndex, setLoadingTextIndex] = useState(0);
    const [downloadSummarySuccess, setDownloadSummarySuccess] = useState(false);
    const [aiMode, setAiMode] = useState<'ai' | 'fallback' | 'unknown'>('unknown');

    useEffect(() => {
        if (!isTyping) {
            setLoadingTextIndex(0);
            return;
        }
        const interval = setInterval(() => {
            setLoadingTextIndex((prev) => (prev + 1) % KANIA_LOADING_STATUSES.length);
        }, 2200);
        return () => clearInterval(interval);
    }, [isTyping]);

    const handleDownloadSummary = () => {
        const ok = downloadChatSummaryFile(messages, 'Kania');
        if (ok) {
            setDownloadSummarySuccess(true);
            setTimeout(() => setDownloadSummarySuccess(false), 3000);
        }
    };
    // Inisialisasi messages dengan welcome msg dulu (sinkron); isi asli
    // percakapan yang tersimpan dimuat belakangan dari IndexedDB (async) lewat
    // effect di bawah, karena IndexedDB nggak bisa dibaca secara sinkron.
    const [messages, setMessages] = useState<Message[]>(() => [buildWelcomeMessage()]);
    // id percakapan yang lagi aktif di IndexedDB. Auto-save ditahan sampai
    // isStorageReady true, biar nggak menimpa data tersimpan dengan welcome
    // msg kosong sebelum load awal selesai.
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [isStorageReady, setIsStorageReady] = useState(false);
    // Jendela riwayat percakapan (dibuka lewat klik avatar Kania)
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [historyList, setHistoryList] = useState<StoredConversation<Message>[]>([]);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const lastQueryRef = useRef<string>('');

    // Helper terpusat untuk menambah pesan baru ke state, sekaligus menjaga
    // batas MAX_DISPLAY_MESSAGES, biar pola trim manual tidak diulang di
    // banyak tempat (riskan lupa di-trim kalau ada fitur baru nanti).
    const pushMessage = (message: Message) => {
        setMessages((prev) => [...prev.slice(-(MAX_DISPLAY_MESSAGES - 1)), message]);
    };

    const pushUserMessage = (text: string, uploadedFiles?: PendingFile[]) => {
        pushMessage({
            id: generateMessageId('user'),
            sender: 'user',
            text,
            timestamp: nowStr(),
            uploadedFiles: uploadedFiles && uploadedFiles.length > 0 ? uploadedFiles : undefined,
        });
    };

    // Baca file jadi base64 murni (tanpa prefix "data:...;base64,")
    const readFileAsBase64 = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result as string;
                resolve(result.split(',')[1] ?? '');
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
        });

    const handleFilesSelected = async (fileList: FileList | null) => {
        if (!fileList || fileList.length === 0) return;
        setUploadError(null);

        const incoming = Array.from(fileList);
        const room = MAX_UPLOAD_FILES - pendingFiles.length;
        if (room <= 0) {
            setUploadError(`Maksimal ${MAX_UPLOAD_FILES} file per pesan.`);
            return;
        }

        const accepted: PendingFile[] = [];
        for (const file of incoming.slice(0, room)) {
            if (!ALLOWED_UPLOAD_MIME_TYPES.includes(file.type)) {
                setUploadError('Format belum didukung. Pakai JPG/PNG/WebP, PDF, atau CSV ya.');
                continue;
            }
            if (file.size > MAX_UPLOAD_FILE_BYTES) {
                setUploadError(`"${file.name}" kegedean (maks ${Math.round(MAX_UPLOAD_FILE_BYTES / (1024 * 1024))}MB).`);
                continue;
            }
            try {
                const base64 = await readFileAsBase64(file);
                accepted.push({
                    id: generateMessageId('file'),
                    name: file.name,
                    mimeType: file.type,
                    data: base64,
                    previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
                });
            } catch {
                setUploadError(`Gagal membaca file "${file.name}".`);
            }
        }
        if (accepted.length > 0) {
            setPendingFiles((prev) => [...prev, ...accepted]);
        }
    };

    const removePendingFile = (id: string) => {
        setPendingFiles((prev) => {
            const target = prev.find((f) => f.id === id);
            if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
            return prev.filter((f) => f.id !== id);
        });
    };

    // Trigger download langsung dari base64 (praktis tidak pernah dipakai untuk
    // Kania karena Antigravity Agent sengaja tidak diaktifkan di persona ini —
    // tetap disediakan biar polanya konsisten dengan ChatWidget/AIChatbotShowcase).
    const downloadAttachment = (att: Attachment) => {
        try {
            const byteChars = atob(att.base64);
            const byteNumbers = new Array(byteChars.length);
            for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
            const blob = new Blob([new Uint8Array(byteNumbers)], { type: att.mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = att.name;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 5000);
        } catch (err) {
            console.error('Gagal download attachment:', err);
        }
    };
    // Gemini conversation history. Mulai kosong lalu diisi oleh effect
    // pemuatan awal dari IndexedDB (lihat effect di bawah) begitu percakapan
    // aktif berhasil dimuat.
    const geminiHistoryRef = useRef<ChatMessage[]>([]);

    // ── Reset komposer (input teks + file pending) ──────────────────────────
    const resetComposer = useCallback(() => {
        setInputValue('');
        setPendingFiles((prev) => {
            prev.forEach((f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
            return [];
        });
        setUploadError(null);
    }, []);

    // ── Muat percakapan aktif dari IndexedDB sekali saat widget pertama mount ──
    useEffect(() => {
        let cancelled = false;
        (async () => {
            const id = await getActiveConversationId('cv_kania');
            const conv = await loadConversation<Message, ChatMessage>(id);
            if (cancelled) return;

            if (conv && conv.messages.length > 0) {
                setMessages(conv.messages.slice(-MAX_DISPLAY_MESSAGES));
                // Penting: history Gemini di-slice(-10) lagi di sini, sama
                // seperti batas yang dipakai tiap kirim pesan — jadi begitu
                // percakapan lama dibuka lagi, AI tetap "ingat" konteksnya.
                geminiHistoryRef.current = (conv.geminiHistory ?? []).slice(-10);
            } else {
                setMessages([buildWelcomeMessage()]);
                geminiHistoryRef.current = [];
            }
            setConversationId(id);
            setIsStorageReady(true);
        })();
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /** Mulai percakapan baru: bikin record IndexedDB baru & jadikan aktif. */
    const startNewChat = useCallback(async () => {
        const welcome = buildWelcomeMessage();
        const created = await createConversation<Message>('cv_kania', [welcome]);
        geminiHistoryRef.current = [];
        setMessages([welcome]);
        setConversationId(created.id);
        resetComposer();
        setIsHistoryOpen(false);
    }, [resetComposer]);

    /** Buka salah satu percakapan lama dari daftar riwayat. */
    const openConversationById = useCallback(async (id: string) => {
        const conv = await loadConversation<Message, ChatMessage>(id);
        if (!conv) return;
        setMessages(conv.messages.length > 0 ? conv.messages.slice(-MAX_DISPLAY_MESSAGES) : [buildWelcomeMessage()]);
        // Sama seperti saat load awal: slice(-10) supaya AI tetap ingat
        // konteks obrolan lama ini, bukan dianggap chat baru.
        geminiHistoryRef.current = (conv.geminiHistory ?? []).slice(-10);
        setConversationId(id);
        await setActiveConversationId('cv_kania', id);
        resetComposer();
        setIsHistoryOpen(false);
    }, [resetComposer]);

    /** Buka jendela riwayat & muat daftar percakapan tersimpan. */
    const openHistoryPanel = useCallback(async () => {
        setIsHistoryOpen(true);
        setIsHistoryLoading(true);
        const list = await listConversations<Message>('cv_kania');
        setHistoryList(list);
        setIsHistoryLoading(false);
    }, []);

    /** Hapus satu percakapan dari riwayat (tanpa membuka percakapan itu dulu). */
    const handleDeleteConversation = useCallback(
        async (id: string, e: React.MouseEvent) => {
            e.stopPropagation();
            await deleteConversation(id);
            setHistoryList((prev) => prev.filter((c) => c.id !== id));
            if (id === conversationId) {
                await startNewChat();
            }
        },
        [conversationId, startNewChat]
    );
    const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
    // ── Voice Chat: STT + TTS lewat hook bersama (lihat hooks/useVoiceChat.ts) ──
    const { isListening, speakingId, loadingSpeakId, voiceSupport, handleMicClick: micToggle, handleToggleSpeak, stopAll } =
        useVoiceChat({ logLabel: 'ChatWidgetCV' });
    // Kalau hasil final STT datang saat bot masih mengetik, teks ditampung di
    // sini dulu dan otomatis dikirim begitu bot selesai (lihat effect di bawah).
    const pendingVoiceTextRef = useRef<string | null>(null);
    const streamText = useStreamingText();

    // Rate limiting — 12 detik antar request (safe untuk free tier)
    const lastRequestTimeRef = useRef<number>(0);
    const REQUEST_COOLDOWN = 12000;

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    // Debounced auto-save messages ke IndexedDB setiap kali berubah.
    // Ditahan sampai isStorageReady true, biar nggak menimpa percakapan
    // tersimpan dengan welcome msg kosong sebelum load awal selesai.
    useEffect(() => {
        if (!isStorageReady || !conversationId) return;
        const timer = setTimeout(() => {
            const trimmed = messages.slice(-MAX_DISPLAY_MESSAGES);
            saveConversation<Message, ChatMessage>(conversationId, 'cv_kania', {
                messages: trimmed,
                title: deriveConversationTitle(trimmed),
            });
        }, 400);
        return () => clearTimeout(timer);
    }, [messages, isStorageReady, conversationId]);

    useEffect(() => {
        return () => {
            timeoutsRef.current.forEach(clearTimeout);
            // mic/TTS & interval animasi dibersihkan masing-masing oleh
            // useVoiceChat & useStreamingText.
        };
    }, []);

    // Kirim otomatis hasil STT yang sempat tertunda begitu bot selesai mengetik.
    useEffect(() => {
        if (!isTyping && pendingVoiceTextRef.current) {
            const pending = pendingVoiceTextRef.current;
            pendingVoiceTextRef.current = null;
            sendMessage(pending, true);
        }
    }, [isTyping]);

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
            pushMessage({
                id: generateMessageId('bot'),
                sender: 'bot',
                text: 'Lanjut ke topik berikutnya? Pilih di bawah ya! 👇',
                timestamp: nowStr(),
                options: CATEGORIES.map((c) => ({ id: c.id, label: c.label })),
            });
        }, 400);
    };

    const showCategoryQuestions = (category: Category) => {
        const items = FAQ_ITEMS.filter((f) => f.categoryId === category.id);
        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            pushMessage({
                id: generateMessageId('bot'),
                sender: 'bot',
                text: `Pilih pertanyaan seputar ${category.label.replace(/^\S+\s/, '')}:`,
                timestamp: nowStr(),
                options: [...items.map((f) => ({ id: f.id, label: f.quickLabel })), { id: 'menu', label: '⬅️ Menu Utama' }],
            });
        }, 400);
    };

    // ── Bot reply helpers ──────────────────────────────────────────────────────
    const appendBotMessage = (text: string, options?: QuickOption[], isAI = false, autoSpeak = false) => {
        const msgId = generateMessageId('bot');
        pushMessage({
            id: msgId,
            sender: 'bot',
            text,
            timestamp: nowStr(),
            options,
            isAI,
        });
        if (autoSpeak) {
            handleToggleSpeak(msgId, text, KANIA_VOICE);
        }
    };

    const streamBotMessage = (
        fullText: string,
        options?: QuickOption[],
        isAI = true,
        autoSpeak = false,
        attachments?: Attachment[]
    ) => {
        const msgId = generateMessageId('bot');
        pushMessage({
            id: msgId,
            sender: 'bot',
            text: '',
            timestamp: nowStr(),
            options: undefined,
            isAI,
            isStreaming: true,
            attachments: attachments && attachments.length > 0 ? attachments : undefined,
        });

        streamText(fullText, {
            isVoice: autoSpeak,
            // Opsi A: TTS dipicu paralel begitu animasi mulai, tidak menunggu
            // animasi ketik selesai — menghilangkan delay bertumpuk sebelum suara keluar.
            onStart: autoSpeak ? () => handleToggleSpeak(msgId, fullText, KANIA_VOICE) : undefined,
            onTick: (partial, isDone) => {
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === msgId
                            ? isDone
                                ? { ...m, text: fullText, options, isStreaming: false }
                                : { ...m, text: partial, isStreaming: true }
                            : m
                    )
                );
            },
        });
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
    const respondWithAI = async (userText: string, isFromVoice = false, files?: OutgoingFile[]) => {
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
        // Catatan: cooldown sengaja "direservasi" di sini, SEBELUM await ke API,
        // bukan cuma setelah sukses — biar laju request tertahan (anti-hammering)
        // terlepas dari hasilnya nanti sukses atau gagal.

        const userMsg: ChatMessage = { role: 'user', parts: [{ text: userText }] };
        try {
            const result = await sendMessageToGemini(
                geminiHistoryRef.current,
                userText,
                undefined,
                'kania',
                undefined,
                files
            );
            const replyText = result.reply;

            geminiHistoryRef.current = [
                ...geminiHistoryRef.current,
                userMsg,
                { role: 'model', parts: [{ text: replyText }] },
            ].slice(-10); // simpan 5 exchange terakhir

            // Persist Gemini history ke IndexedDB, terikat ke percakapan yang
            // lagi aktif — jadi kalau percakapan ini dibuka lagi nanti, AI tetap ingat.
            if (conversationId) {
                saveConversation<Message, ChatMessage>(conversationId, 'cv_kania', {
                    geminiHistory: geminiHistoryRef.current,
                });
            }

            setAiMode('ai');
            setIsTyping(false);
            streamBotMessage(replyText, standardCTA, true, isFromVoice, result.attachments);

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
                pushUserMessage(`✨ Coba tanya Kania: "${lastQueryRef.current}"`);
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
            pushUserMessage(label);
            showCategoryQuestions(category);
            return;
        }
        const faq = FAQ_ITEMS.find((f) => f.id === id);
        if (faq) {
            pushUserMessage(label);
            lastQueryRef.current = faq.quickLabel;
            respondWithFAQ(faq);
        }
    };

    const sendMessage = (text: string, isFromVoice = false) => {
        const trimmed = text.trim();
        if ((!trimmed && pendingFiles.length === 0) || isTyping) return;
        // Kalau user cuma lampirin file (mis. CV/portofolio) tanpa nulis apa-apa,
        // kasih caption default biar backend tetap punya instruksi jelas.
        const cleanText = trimmed || 'Tolong tinjau file yang saya lampirkan ini.';
        const filesForThisMessage = pendingFiles;
        pushUserMessage(cleanText, filesForThisMessage);
        setInputValue('');
        setPendingFiles([]); // preview di-clear, objectURL-nya masih dipakai bubble di atas
        setUploadError(null);
        lastQueryRef.current = cleanText;

        const outgoingFiles: OutgoingFile[] | undefined = filesForThisMessage.length > 0
            ? filesForThisMessage.map((f) => ({ mimeType: f.mimeType, data: f.data, name: f.name }))
            : undefined;

        // Deteksi intent alami jika user meminta kembali ke Kania
        const wantsKania = /kania|panggil kania|coba kania|coba lagi|mode ai|connect ai/i.test(cleanText);
        if (wantsKania && aiMode === 'fallback') {
            setAiMode('ai');
            respondWithAI(cleanText, isFromVoice, outgoingFiles);
            return;
        }

        // Jika AI sedang fallback, gunakan Fuse.js langsung — kecuali ada file
        // dilampirkan, karena FAQ lokal (Fuse.js) tidak bisa memproses file.
        if (aiMode === 'fallback' && !outgoingFiles) {
            const results = fuse.search(cleanText);
            if (results.length > 0) {
                respondWithFAQ(results[0].item, isFromVoice);
            } else {
                respondWithFallback(isFromVoice);
            }
        } else {
            // Coba AI dulu, Fuse.js sebagai fallback otomatis di dalam respondWithAI
            respondWithAI(cleanText, isFromVoice, outgoingFiles);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(inputValue);
        }
    };

    // ── Voice Chat: mic (STT) — wrapper tipis di atas hook, karena logika
    // "tampilkan transkrip sementara di input & kirim saat final" spesifik
    // ke komponen ini.
    const handleMicClick = () => {
        micToggle((text, isFinal) => {
            setInputValue(text);
            if (isFinal && text.trim()) {
                // Kalau bot masih mengetik, tunda dulu — dikirim otomatis oleh
                // effect isTyping di atas begitu bot selesai.
                if (isTyping) {
                    pendingVoiceTextRef.current = text.trim();
                } else {
                    sendMessage(text, true);
                }
                setInputValue('');
            }
        });
    };

    // ── Voice Chat: play bot reply (TTS) ─────────────────────────────────────
    // handleToggleSpeak sekarang datang langsung dari hook useVoiceChat di atas.

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

    // Untuk aria-live: cuma umumkan pesan bot yang SUDAH final (bukan yang lagi
    // di-stream karakter-per-karakter), supaya screen reader tidak membaca
    // bubble kosong di awal animasi ketik atau berulang kali di tiap tick.
    const lastFinalizedBotMessage = [...messages].reverse().find((m) => m.sender === 'bot' && !m.isStreaming);

    return (
        <div className="fixed bottom-6 left-6 z-50 no-print">
            {isOpen && (
                <Portal>
                    {/* Backdrop — full overlay on mobile (layar sempit) so user fokus ke chat; invisible & click-through on desktop */}
                    <div
                        className="fixed inset-0 z-[9999] flex items-end justify-start p-0 sm:pb-24 sm:pl-6 bg-black/60 backdrop-blur-sm sm:bg-transparent sm:backdrop-blur-none sm:pointer-events-none"
                        onClick={() => setIsOpen(false)}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className={`relative w-full h-full sm:w-80 sm:h-[460px] md:w-96 rounded-none sm:rounded-2xl shadow-2xl border-0 sm:border flex flex-col overflow-hidden pointer-events-auto ${darkMode ? 'bg-slate-900 sm:border-slate-700' : 'bg-white sm:border-slate-200'
                                }`}
                        >
                            {/* Header */}
                            <div className={`p-3.5 flex items-center justify-between border-b ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                                }`}>
                                <div className="flex items-center gap-2.5">
                                    <button
                                        type="button"
                                        onClick={openHistoryPanel}
                                        aria-label="Lihat riwayat obrolan tersimpan"
                                        title="Lihat riwayat obrolan tersimpan"
                                        className="relative rounded-full focus:outline-none focus:ring-2 focus:ring-teal-400 shrink-0"
                                    >
                                        <div className={`w-8 h-8 rounded-full text-white flex items-center justify-center text-xs font-bold shadow-md transition-all ${aiMode === 'fallback' ? 'bg-gradient-to-br from-amber-500 to-amber-700' : 'bg-gradient-to-br from-teal-500 to-teal-700'}`}>
                                            KA
                                        </div>
                                        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 ${darkMode ? 'border-slate-800' : 'border-white'} ${aiMode === 'fallback' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                                    </button>
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
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        aria-label="Mulai obrolan baru"
                                        title="Mulai obrolan baru"
                                        onClick={startNewChat}
                                        className={`p-1.5 rounded-lg transition-colors ${darkMode
                                            ? 'text-slate-300 hover:text-white hover:bg-slate-700'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                                            }`}
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                    {messages.length > 1 && (
                                        <button
                                            type="button"
                                            aria-label="Unduh rangkuman obrolan"
                                            title="Unduh rangkuman obrolan (.txt) untuk lanjut ke WhatsApp Mas Arzha"
                                            onClick={handleDownloadSummary}
                                            className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-medium ${downloadSummarySuccess
                                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                                : darkMode
                                                    ? 'text-slate-300 hover:text-white hover:bg-slate-700'
                                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                                                }`}
                                        >
                                            <FileText className="w-3.5 h-3.5" />
                                            <span className="hidden sm:inline">{downloadSummarySuccess ? 'Tersimpan!' : 'Rangkuman'}</span>
                                        </button>
                                    )}
                                    <button
                                        aria-label="Tutup jendela chat"
                                        onClick={() => {
                                            stopAll();
                                            setIsOpen(false);
                                        }}
                                        className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                                            }`}
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Jendela Riwayat Percakapan — overlay penuh di dalam kartu chat,
                                dibuka lewat klik avatar Kania di header. */}
                            {isHistoryOpen && (
                                <div className={`absolute inset-0 z-30 flex flex-col ${darkMode ? 'bg-slate-900' : 'bg-white'}`}>
                                    <div
                                        className={`p-3.5 flex items-center justify-between border-b ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                                            }`}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <History className={`w-4 h-4 ${darkMode ? 'text-teal-400' : 'text-teal-600'}`} />
                                            <h3 className={`font-bold text-xs ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                                Riwayat Obrolan
                                            </h3>
                                        </div>
                                        <button
                                            type="button"
                                            aria-label="Tutup riwayat obrolan"
                                            onClick={() => setIsHistoryOpen(false)}
                                            className={`p-1.5 rounded-lg transition-colors ${darkMode
                                                ? 'text-slate-400 hover:text-white hover:bg-slate-700'
                                                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                                                }`}
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                                        {isHistoryLoading && (
                                            <p className={`text-xs text-center py-6 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                                Memuat riwayat...
                                            </p>
                                        )}
                                        {!isHistoryLoading && historyList.length === 0 && (
                                            <p className={`text-xs text-center py-6 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                                Belum ada obrolan tersimpan.
                                            </p>
                                        )}
                                        {!isHistoryLoading &&
                                            historyList.map((conv) => (
                                                <button
                                                    key={conv.id}
                                                    type="button"
                                                    onClick={() => openConversationById(conv.id)}
                                                    className={`w-full text-left p-2.5 rounded-xl border transition-colors flex items-start justify-between gap-2 ${conv.id === conversationId
                                                        ? darkMode
                                                            ? 'border-teal-500 bg-teal-950/30'
                                                            : 'border-teal-400 bg-teal-50'
                                                        : darkMode
                                                            ? 'border-slate-700 hover:border-slate-600 bg-slate-800/50'
                                                            : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                                                        }`}
                                                >
                                                    <div className="min-w-0">
                                                        <p className={`text-xs font-semibold truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                                            {conv.title || 'Obrolan Baru'}
                                                        </p>
                                                        <p className={`text-[10px] mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                                            {new Date(conv.updatedAt).toLocaleString('id-ID', {
                                                                day: '2-digit',
                                                                month: 'short',
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })}
                                                        </p>
                                                    </div>
                                                    <span
                                                        role="button"
                                                        tabIndex={0}
                                                        onClick={(e) => handleDeleteConversation(conv.id, e)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' || e.key === ' ') handleDeleteConversation(conv.id, e as unknown as React.MouseEvent);
                                                        }}
                                                        aria-label="Hapus obrolan ini"
                                                        title="Hapus obrolan ini"
                                                        className={`shrink-0 p-1 rounded-lg transition-colors ${darkMode
                                                            ? 'text-slate-500 hover:text-red-400 hover:bg-red-950/40'
                                                            : 'text-slate-400 hover:text-red-500 hover:bg-red-50'
                                                            }`}
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </span>
                                                </button>
                                            ))}
                                    </div>

                                    <div className={`p-2.5 border-t ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                                        <button
                                            type="button"
                                            onClick={startNewChat}
                                            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-white transition-colors bg-teal-600 hover:bg-teal-700"
                                        >
                                            <Plus className="w-3.5 h-3.5" /> Obrolan Baru
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Region tersembunyi khusus screen reader: umumkan status mengetik
                                dan balasan bot yang sudah final, terpisah dari bubble visual
                                supaya tidak ikut ke-baca ulang tiap tick animasi streaming. */}
                            <div className="sr-only" aria-live="polite" aria-atomic="true">
                                {isTyping
                                    ? 'Kania sedang mengetik…'
                                    : lastFinalizedBotMessage?.text ?? ''}
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
                            <div
                                role="log"
                                aria-relevant="additions"
                                className={`flex-1 p-3.5 overflow-y-auto chat-scrollbar space-y-3 text-xs ${darkMode ? 'bg-slate-900' : 'bg-slate-50'
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
                                                            onClick={() => handleToggleSpeak(m.id, m.text, KANIA_VOICE)}
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

                                            {/* Thumbnail file yang diupload user bareng pesan ini */}
                                            {m.uploadedFiles && m.uploadedFiles.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {m.uploadedFiles.map((f) => (
                                                        f.previewUrl ? (
                                                            <img
                                                                key={f.id}
                                                                src={f.previewUrl}
                                                                alt={f.name}
                                                                className="w-12 h-12 object-cover rounded-lg border border-slate-300 dark:border-slate-600"
                                                            />
                                                        ) : (
                                                            <span
                                                                key={f.id}
                                                                className={`inline-flex items-center gap-1 text-[9.5px] px-2 py-1 rounded-md border ${darkMode ? 'bg-slate-800 border-slate-600 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-600'}`}
                                                                title={f.name}
                                                            >
                                                                <FileText className="w-3 h-3" />
                                                                {f.name.length > 16 ? f.name.slice(0, 16) + '…' : f.name}
                                                            </span>
                                                        )
                                                    ))}
                                                </div>
                                            )}

                                            {/* File hasil kerja Kania (jarang muncul — Antigravity Agent tidak
                                                diaktifkan untuk persona ini, tapi tetap disediakan biar konsisten) */}
                                            {m.attachments && m.attachments.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {m.attachments.map((att, i) => (
                                                        <button
                                                            key={`${m.id}-att-${i}`}
                                                            type="button"
                                                            onClick={() => downloadAttachment(att)}
                                                            className={`inline-flex items-center gap-1.5 text-[9.5px] font-semibold px-2 py-1.5 rounded-lg border transition-colors ${darkMode
                                                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                                                                : 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                                                                }`}
                                                        >
                                                            <Download className="w-3 h-3" />
                                                            {att.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

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
                                        <div className={`px-3.5 py-2.5 rounded-xl rounded-bl-none flex items-center gap-2 ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200 shadow-sm'
                                            }`}>
                                            <div className="flex items-center gap-1">
                                                <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${aiMode === 'fallback' ? 'bg-amber-400' : 'bg-teal-400'}`} style={{ animationDelay: '0ms' }} />
                                                <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${aiMode === 'fallback' ? 'bg-amber-400' : 'bg-teal-400'}`} style={{ animationDelay: '150ms' }} />
                                                <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${aiMode === 'fallback' ? 'bg-amber-400' : 'bg-teal-400'}`} style={{ animationDelay: '300ms' }} />
                                            </div>
                                            <span className={`text-[11px] font-medium transition-all duration-300 ${aiMode === 'fallback'
                                                ? darkMode ? 'text-amber-300/90' : 'text-amber-700/90'
                                                : darkMode ? 'text-teal-300/90' : 'text-teal-700/90'
                                                }`}>
                                                {aiMode === 'fallback' ? 'Mencari jawaban...' : KANIA_LOADING_STATUSES[loadingTextIndex]}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className={`p-2.5 border-t ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
                                }`}>
                                {/* Preview file yang lagi disiapkan buat dikirim */}
                                {pendingFiles.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                        {pendingFiles.map((f) => (
                                            <div key={f.id} className="relative group">
                                                {f.previewUrl ? (
                                                    <img src={f.previewUrl} alt={f.name} className="w-11 h-11 object-cover rounded-lg border border-slate-300 dark:border-slate-600" />
                                                ) : (
                                                    <div className={`w-11 h-11 flex items-center justify-center rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-600'}`}>
                                                        <FileText className="w-4 h-4" />
                                                    </div>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => removePendingFile(f.id)}
                                                    aria-label={`Hapus ${f.name}`}
                                                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
                                                >
                                                    <X className="w-2.5 h-2.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {uploadError && (
                                    <p className="text-[10px] text-red-500 mb-1.5">{uploadError}</p>
                                )}

                                <div className="flex items-center gap-2">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept={ALLOWED_UPLOAD_MIME_TYPES.join(',')}
                                        multiple
                                        className="hidden"
                                        onChange={(e) => {
                                            handleFilesSelected(e.target.files);
                                            e.target.value = ''; // biar bisa pilih file yang sama lagi kalau dihapus
                                        }}
                                    />
                                    <button
                                        aria-label="Lampirkan file"
                                        title="Lampirkan CV, portofolio, atau dokumen (foto/PDF/CSV)"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isTyping}
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${darkMode
                                            ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                    >
                                        <Paperclip className="w-3.5 h-3.5" />
                                    </button>
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
                                        disabled={(!inputValue.trim() && pendingFiles.length === 0) || isTyping}
                                        className={`w-8 h-8 rounded-lg text-white flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${aiMode === 'fallback' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-teal-600 hover:bg-teal-700'}`}
                                    >
                                        <Send className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </Portal>
            )}

            {/* Toggle Button */}
            <button
                aria-label={isOpen ? 'Tutup chat widget' : 'Buka chat widget'}
                onClick={() => setIsOpen(!isOpen)}
                className="w-12 h-12 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center shadow-xl shadow-amber-500/25 transition-all hover:scale-105 active:scale-95 border-2 border-slate-900"
                title="Tanya Asisten Mode CV"
            >
                {isOpen ? <X className="w-5 h-5" /> : <MessageSquare className="w-5 h-5 font-bold" />}
            </button>
        </div>
    );
};