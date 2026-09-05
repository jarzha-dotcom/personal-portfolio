import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    Send,
    User,
    Sparkles,
    AlertCircle,
    Loader2,
    Trash2,
    Clock,
    RefreshCw,
    Mic,
    Volume2,
    Square,
    Copy,
    Check,
    ChevronDown,
    Code2,
    Rocket,
    BadgeDollarSign,
    PhoneCall,
} from 'lucide-react';
import { sendMessageToGemini, ChatMessage } from '../services/geminiService';
import { saveMessages, loadMessages, saveGeminiHistory, loadGeminiHistory, clearChatStorage } from '../utils/chatStorage';
import {
    speak,
    stopSpeaking,
    startListening,
    stopListening,
    isSpeechSupported,
} from '../services/voiceService';

// ── Persona Showcase: Arka (cowok, portfolio AI assistant) ──────────────────
// Zannah = ChatWidget (cewek), Kania = ChatWidgetCV (cewek) → Arka = Showcase (cowok)
const SHOWCASE_BOT_NAME = 'Arka';
const SHOWCASE_BOT_INITIALS = 'AR';
const SHOWCASE_BOT_ROLE = 'AI Portfolio Assistant';
const SHOWCASE_VOICE = 'id-ID-Wavenet-B'; // Wavenet-B = male voice
const MAX_DISPLAY_MESSAGES = 50;
const MAX_HISTORY_TURNS = 12; // 6 putaran percakapan terakhir

// ── Daftar model AI yang bisa dipilih user ───────────────────────────────────
// Sesuaikan id dengan yang benar-benar didukung backend (geminiService.ts / API route).
interface ModelOption {
    id: string;
    label: string;
    desc: string;
}

const AVAILABLE_MODELS: ModelOption[] = [
    { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash', desc: 'Paling modern & cepat (default)' },
    { id: 'gemini-3.7-flash', label: 'Gemini 3.7 Flash', desc: 'Advanced, latensi rendah' },
    { id: 'gemini-3.6-flash', label: 'Gemini 3.6 Flash', desc: 'Seimbang speed & kualitas' },
    { id: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash', desc: 'Stabil & efisien' },
    { id: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash-Lite', desc: 'Ultra hemat kuota' },
    { id: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro', desc: 'Reasoning mendalam' },
    { id: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash-Lite', desc: 'Fallback paling stabil' },
];

interface AIChatbotShowcaseProps {
    darkMode: boolean;
}

interface DisplayMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp?: string;
    isError?: boolean;
    isRateLimit?: boolean;
    isStreaming?: boolean;
}

interface StarterCard {
    icon: React.ReactNode;
    title: string;
    desc: string;
    prompt: string;
    gradient: string;
}

const STARTER_CARDS: StarterCard[] = [
    {
        icon: <Code2 className="w-4 h-4" />,
        title: 'Skill & Tech Stack',
        desc: 'Keahlian teknis & tools yang dikuasai',
        prompt: 'Apa saja skill teknis dan stack pemrograman yang dikuasai developer ini?',
        gradient: 'from-blue-500/20 to-cyan-500/20 text-cyan-400 border-cyan-500/30',
    },
    {
        icon: <Rocket className="w-4 h-4" />,
        title: 'Proyek Unggulan',
        desc: 'Aplikasi AI, web, & mobile terbaru',
        prompt: 'Ceritakan proyek-proyek unggulan yang pernah dikerjakan dan dampak bisnisnya!',
        gradient: 'from-teal-500/20 to-emerald-500/20 text-teal-400 border-teal-500/30',
    },
    {
        icon: <BadgeDollarSign className="w-4 h-4" />,
        title: 'Jasa & Estimasi',
        desc: 'Layanan AI Chatbot & pembuatan web',
        prompt: 'Berapa estimasi biaya dan fitur untuk pembuatan AI Chatbot atau Web App?',
        gradient: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30',
    },
    {
        icon: <PhoneCall className="w-4 h-4" />,
        title: 'Kontak & Kerja Sama',
        desc: 'Cara merekrut / hire langsung',
        prompt: 'Bagaimana cara menghubungi atau memulai kerja sama proyek?',
        gradient: 'from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30',
    },
];

const QUICK_PILLS = [
    'Pengalaman kerja',
    'Bisa buat fitur apa saja?',
    'Waktu pengerjaan proyek',
    'Portofolio AI',
];

// Helper: safe unique ID generator (bebas dari race condition milidetik)
const generateMessageId = (prefix = 'msg'): string => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return `${prefix}-${crypto.randomUUID()}`;
    }
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

const nowTimeStr = (): string => {
    return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
};

// Helper: analisis komprehensif error AI
interface AIErrorInfo {
    isLimit: boolean;
    isUnavailable: boolean;
    message: string;
}

const analyzeAIError = (error: unknown): AIErrorInfo => {
    if (!error) return { isLimit: false, isUnavailable: false, message: 'Terjadi kesalahan' };

    const status =
        (error as any)?.status ||
        (error as any)?.statusCode ||
        (error as any)?.code ||
        (error as any)?.response?.status;

    const rawMsg = (error instanceof Error ? error.message : String(error)) || '';
    const upperMsg = rawMsg.toUpperCase();
    const lowerMsg = rawMsg.toLowerCase();

    const isUnavailable =
        status === 503 ||
        upperMsg.includes('AI_UNAVAILABLE') ||
        upperMsg.includes('UNAVAILABLE') ||
        upperMsg.includes('OVERLOADED');

    const isLimit =
        status === 429 ||
        isUnavailable ||
        lowerMsg.includes('quota') ||
        lowerMsg.includes('rate limit') ||
        lowerMsg.includes('ratelimit') ||
        lowerMsg.includes('resource_exhausted') ||
        lowerMsg.includes('too many requests') ||
        lowerMsg.includes('limit reached');

    return {
        isLimit,
        isUnavailable,
        message: rawMsg,
    };
};

/**
 * Rich Markdown formatter ringan untuk parsing teks AI:
 * Mendukung **bold**, *italic*, `code snippet`, bullet list (- / *), numbered list (1.), blockquotes (>).
 */
const renderRichMarkdown = (content: string, darkMode: boolean) => {
    const lines = content.split('\n');

    return lines.map((line, lineIdx) => {
        const isBullet = /^\s*[-*•]\s+(.*)/.exec(line);
        const isNumbered = /^\s*(\d+)\.\s+(.*)/.exec(line);
        const isQuote = /^\s*>\s*(.*)/.exec(line);

        let lineContent = line;
        let linePrefix: React.ReactNode = null;

        if (isBullet) {
            linePrefix = (
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-400 mr-2 mt-1.5 flex-shrink-0 align-top" />
            );
            lineContent = isBullet[1];
        } else if (isNumbered) {
            linePrefix = (
                <span className="font-semibold text-teal-400 mr-1.5 flex-shrink-0 text-[11px]">
                    {isNumbered[1]}.
                </span>
            );
            lineContent = isNumbered[2];
        } else if (isQuote) {
            return (
                <div
                    key={lineIdx}
                    className={`pl-2.5 my-1 border-l-2 italic text-[11px] ${darkMode ? 'border-teal-500/60 text-slate-300' : 'border-teal-600 text-slate-600'
                        }`}
                >
                    {renderInlineFormattedText(isQuote[1], darkMode)}
                </div>
            );
        }

        return (
            <div
                key={lineIdx}
                className={`${isBullet || isNumbered ? 'flex items-start my-0.5' : 'min-h-[1rem]'}`}
            >
                {linePrefix}
                <div className="flex-1">{renderInlineFormattedText(lineContent, darkMode)}</div>
            </div>
        );
    });
};

const renderInlineFormattedText = (text: string, darkMode: boolean): React.ReactNode => {
    if (!text) return null;

    // Tokenize bold (**...**), code (`...`), and italic (*...*)
    const parts: React.ReactNode[] = [];
    const regex = /(\*\*.*?\*\*|`.*?`|\*.*?\*)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(text.substring(lastIndex, match.index));
        }

        const raw = match[0];
        if (raw.startsWith('**') && raw.endsWith('**')) {
            parts.push(
                <strong key={match.index} className="font-semibold text-teal-400">
                    {raw.slice(2, -2)}
                </strong>
            );
        } else if (raw.startsWith('`') && raw.endsWith('`')) {
            parts.push(
                <code
                    key={match.index}
                    className={`px-1.5 py-0.5 mx-0.5 rounded text-[10px] font-mono font-medium ${darkMode
                        ? 'bg-slate-950 text-teal-300 border border-slate-700/80'
                        : 'bg-slate-200 text-teal-800 border border-slate-300'
                        }`}
                >
                    {raw.slice(1, -1)}
                </code>
            );
        } else if (raw.startsWith('*') && raw.endsWith('*')) {
            parts.push(
                <em key={match.index} className="italic opacity-90">
                    {raw.slice(1, -1)}
                </em>
            );
        }

        lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
};

export const AIChatbotShowcase: React.FC<AIChatbotShowcaseProps> = ({ darkMode }) => {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [lastUserMessage, setLastUserMessage] = useState<string>('');
    const [activeModel, setActiveModel] = useState<string>(AVAILABLE_MODELS[0].id);
    const [lastLatencyMs, setLastLatencyMs] = useState<number | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [selectedModel, setSelectedModel] = useState<string>(AVAILABLE_MODELS[0].id);
    const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
    const modelMenuRef = useRef<HTMLDivElement>(null);

    const [messages, setMessages] = useState<DisplayMessage[]>(() => {
        const saved = loadMessages<DisplayMessage>('showcase');
        if (saved && saved.length > 0) return saved.slice(-MAX_DISPLAY_MESSAGES);
        return [
            {
                id: 'welcome',
                role: 'assistant',
                content:
                    `Hai! 👋 Nama saya **Arka**, AI Portfolio Assistant. Saya siap menjawab pertanyaan seputar developer ini — skill, proyek, jasa, hingga cara kerjasama. Ini demo live, langsung dijawab AI! 🚀`,
                timestamp: nowTimeStr(),
            },
        ];
    });

    const [history, setHistory] = useState<ChatMessage[]>(() =>
        loadGeminiHistory<ChatMessage>('showcase').slice(-MAX_HISTORY_TURNS)
    );
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const streamIntervalRef = useRef<number | null>(null);

    // ── Voice Chat state ─────────────────────────────────────────────────────
    const [isListening, setIsListening] = useState(false);
    const [speakingId, setSpeakingId] = useState<string | null>(null);
    const [loadingSpeakId, setLoadingSpeakId] = useState<string | null>(null);
    const [voiceSupport] = useState(() => isSpeechSupported());
    const stopListenRef = useRef<(() => void) | null>(null);

    // Auto-scroll ke pesan terbaru
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading, isStreaming]);

    // Debounced auto-save messages ke localStorage
    useEffect(() => {
        if (isStreaming) return;
        const timer = setTimeout(() => {
            saveMessages('showcase', messages.slice(-MAX_DISPLAY_MESSAGES));
        }, 400);
        return () => clearTimeout(timer);
    }, [messages, isStreaming]);

    // Debounced auto-save Gemini history ke sessionStorage
    useEffect(() => {
        const timer = setTimeout(() => {
            saveGeminiHistory('showcase', history.slice(-MAX_HISTORY_TURNS));
        }, 400);
        return () => clearTimeout(timer);
    }, [history]);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Tutup dropdown model saat klik di luar area-nya
    useEffect(() => {
        if (!isModelMenuOpen) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (modelMenuRef.current && !modelMenuRef.current.contains(e.target as Node)) {
                setIsModelMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isModelMenuOpen]);

    // Cleanup audio, mic & interval saat unmount
    useEffect(() => {
        return () => {
            if (streamIntervalRef.current) {
                window.clearInterval(streamIntervalRef.current);
            }
            stopListening();
            stopSpeaking();
        };
    }, []);

    // Typewriter effect untuk menghidupkan balasan AI
    const streamReply = useCallback((msgId: string, fullText: string, onComplete?: () => void) => {
        if (streamIntervalRef.current) {
            window.clearInterval(streamIntervalRef.current);
        }

        setIsStreaming(true);
        let currentIndex = 0;
        const totalLength = fullText.length;
        const chunkSize = totalLength > 300 ? 3 : totalLength > 150 ? 2 : 1;
        const speedMs = 18;

        streamIntervalRef.current = window.setInterval(() => {
            currentIndex += chunkSize;
            if (currentIndex >= totalLength) {
                if (streamIntervalRef.current) {
                    window.clearInterval(streamIntervalRef.current);
                    streamIntervalRef.current = null;
                }
                setMessages((prev) =>
                    prev.map((m) => (m.id === msgId ? { ...m, content: fullText, isStreaming: false } : m))
                );
                setIsStreaming(false);
                onComplete?.();
            } else {
                const partialText = fullText.slice(0, currentIndex);
                setMessages((prev) =>
                    prev.map((m) => (m.id === msgId ? { ...m, content: partialText, isStreaming: true } : m))
                );
            }
        }, speedMs);
    }, []);

    const handleSend = async (textOverride?: string, isFromVoice = false) => {
        const text = (textOverride ?? input).trim();
        if (!text || isLoading || isStreaming) return;

        const userMsgId = generateMessageId('user');
        const userMsg: DisplayMessage = {
            id: userMsgId,
            role: 'user',
            content: text,
            timestamp: nowTimeStr(),
        };

        setMessages((prev) => [...prev.slice(-(MAX_DISPLAY_MESSAGES - 1)), userMsg]);
        setLastUserMessage(text);
        setInput('');
        setIsLoading(true);

        try {
            const currentHistory = history.slice(-MAX_HISTORY_TURNS);
            const t0 = performance.now();
            // NOTE: parameter ke-3 (selectedModel) perlu ditambahkan juga di
            // signature sendMessageToGemini() pada services/geminiService.ts,
            // lalu diteruskan ke API route/backend agar benar-benar dipakai.
            const result = await sendMessageToGemini(currentHistory, text, selectedModel);
            const latency = Math.round(performance.now() - t0);
            setLastLatencyMs(latency);
            const replyText = result.reply;

            if (result.model) setActiveModel(result.model);

            const assistantMsgId = generateMessageId('assistant');
            const assistantMsg: DisplayMessage = {
                id: assistantMsgId,
                role: 'assistant',
                content: '',
                timestamp: nowTimeStr(),
                isStreaming: true,
            };

            setMessages((prev) => [...prev.slice(-(MAX_DISPLAY_MESSAGES - 1)), assistantMsg]);
            setIsLoading(false);

            setHistory((prev) => [
                ...prev.slice(-(MAX_HISTORY_TURNS - 2)),
                { role: 'user', parts: [{ text }] },
                { role: 'model', parts: [{ text: replyText }] },
            ]);

            streamReply(assistantMsgId, replyText, () => {
                if (isFromVoice) {
                    handleToggleSpeak(assistantMsgId, replyText);
                }
            });
        } catch (error) {
            setIsLoading(false);
            setIsStreaming(false);

            const errInfo = analyzeAIError(error);

            if (errInfo.isLimit) {
                const content = errInfo.isUnavailable
                    ? '⚠️ AI sedang tidak tersedia (AI_UNAVAILABLE)\n\nIni biasanya terjadi karena Gemini Free Tier sedang overload. Coba tunggu ~30 detik lalu tekan "Coba Lagi" ya.'
                    : '⏳ Kuota AI sedang habis (Rate Limit)\n\nKarena ini pakai Gemini Free Tier, kuota per menit/harinya terbatas. Coba tunggu sebentar lalu tekan "Coba Lagi".';

                setMessages((prev) => [
                    ...prev.slice(-(MAX_DISPLAY_MESSAGES - 1)),
                    {
                        id: generateMessageId('limit'),
                        role: 'assistant',
                        content,
                        timestamp: nowTimeStr(),
                        isRateLimit: true,
                    },
                ]);
            } else {
                const errMsg = errInfo.message || 'Terjadi kesalahan';
                setMessages((prev) => [
                    ...prev.slice(-(MAX_DISPLAY_MESSAGES - 1)),
                    {
                        id: generateMessageId('error'),
                        role: 'assistant',
                        content: `Maaf, terjadi kesalahan: ${errMsg}`,
                        timestamp: nowTimeStr(),
                        isError: true,
                    },
                ]);
            }
        }
    };

    const handleRetry = () => {
        if (lastUserMessage && !isLoading && !isStreaming) {
            handleSend(lastUserMessage);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleReset = () => {
        if (isLoading || isStreaming) return;

        if (streamIntervalRef.current) {
            window.clearInterval(streamIntervalRef.current);
            streamIntervalRef.current = null;
        }

        stopListenRef.current?.();
        stopListenRef.current = null;
        setIsListening(false);
        stopSpeaking();
        setSpeakingId(null);

        clearChatStorage('showcase');
        setMessages([
            {
                id: generateMessageId('welcome-reset'),
                role: 'assistant',
                content: `Percakapan direset. Saya **Arka** siap lagi! Pilih topik atau ketik pertanyaanmu 😊`,
                timestamp: nowTimeStr(),
            },
        ]);
        setHistory([]);
        setLastUserMessage('');
    };

    // ── Copy Message Action ──────────────────────────────────────────────────
    const handleCopy = (messageId: string, text: string) => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
            setCopiedId(messageId);
            setTimeout(() => setCopiedId(null), 2000);
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
        if (!voiceSupport.stt || isLoading || isStreaming) return;

        stopSpeaking();
        setSpeakingId(null);

        const cleanup = startListening({
            lang: 'id-ID',
            onStart: () => setIsListening(true),
            onResult: (text, isFinal) => {
                setInput(text);
                if (isFinal && text.trim()) {
                    handleSend(text, true);
                    setInput('');
                }
            },
            onEnd: () => {
                setIsListening(false);
                stopListenRef.current = null;
            },
            onError: (err) => {
                console.warn('[AIChatbotShowcase] STT error:', err);
                setIsListening(false);
                stopListenRef.current = null;
            },
        });
        stopListenRef.current = cleanup;
    };

    // ── Voice Chat: play assistant reply (TTS) ───────────────────────────────
    const handleToggleSpeak = async (messageId: string, text: string) => {
        if (speakingId === messageId) {
            stopSpeaking();
            setSpeakingId(null);
            return;
        }
        setLoadingSpeakId(messageId);
        await speak(text, {
            voice: SHOWCASE_VOICE,
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

    return (
        <div className="flex flex-col h-full min-h-0 flex-1 relative select-text">
            {/* Chat Header Info */}
            <div
                className={`px-4 py-2.5 border-b flex items-center justify-between flex-shrink-0 backdrop-blur-md ${darkMode ? 'border-slate-700/80 bg-slate-800/80' : 'border-slate-200 bg-slate-50/90'
                    }`}
            >
                <div className="flex items-center gap-2.5">
                    <div className="relative">
                        {/* Avatar Arka — gradien biru-teal, inisial AR */}
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-extrabold bg-gradient-to-br from-blue-500 via-teal-500 to-emerald-500 shadow-md shadow-teal-900/30 ring-2 ring-teal-500/20 tracking-tight">
                            {SHOWCASE_BOT_INITIALS}
                        </div>
                        <span
                            className={`absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 ${darkMode ? 'border-slate-800' : 'border-white'
                                }`}
                        />
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <h4 className={`text-sm font-bold leading-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                {SHOWCASE_BOT_NAME}
                            </h4>
                            <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                Online
                            </span>
                        </div>
                        {/* Live AI Stats Chips */}
                        <div className="flex items-center gap-1 flex-wrap mt-0.5">
                            <span className={`inline-flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded-full border ${darkMode ? 'bg-teal-500/10 border-teal-500/30 text-teal-300' : 'bg-teal-50 border-teal-200 text-teal-700'
                                }`}>
                                ⚡ {lastLatencyMs !== null ? `${(lastLatencyMs / 1000).toFixed(1)}s` : '—'}
                            </span>
                            <span className={`inline-flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded-full border ${darkMode ? 'bg-blue-500/10 border-blue-500/30 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-700'
                                }`}>
                                🧠 {history.length > 0 ? Math.min(history.length, MAX_HISTORY_TURNS) : 0}-Turn Memory
                            </span>
                            <span className={`inline-flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded-full border ${darkMode ? 'bg-slate-700/80 border-slate-600 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'
                                }`}>
                                🔒 Serverless
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={handleReset}
                        title="Reset percakapan"
                        className={`p-1.5 rounded-lg transition-colors ${darkMode
                            ? 'text-slate-400 hover:text-white hover:bg-slate-700/60'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/70'
                            }`}
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div
                className={`flex-1 min-h-0 overflow-y-auto chat-scrollbar px-4 py-4 space-y-3.5 ${darkMode ? 'bg-slate-900/60' : 'bg-slate-50/40'
                    }`}
            >
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex gap-2.5 animate-message-in ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        {msg.role === 'assistant' && (
                            <div
                                className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-extrabold shadow-sm tracking-tight ${msg.isRateLimit
                                    ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-white'
                                    : msg.isError
                                        ? 'bg-gradient-to-br from-red-500 to-red-700 text-white'
                                        : 'bg-gradient-to-br from-blue-500 via-teal-500 to-emerald-500 text-white ring-1 ring-teal-500/30'
                                    }`}
                            >
                                {msg.isRateLimit ? (
                                    <Clock className="w-3.5 h-3.5 text-white" />
                                ) : msg.isError ? (
                                    <AlertCircle className="w-3.5 h-3.5 text-white" />
                                ) : (
                                    SHOWCASE_BOT_INITIALS
                                )}
                            </div>
                        )}

                        <div
                            className={`group relative max-w-[82%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed transition-all shadow-sm ${msg.role === 'user'
                                ? 'bg-gradient-to-r from-teal-600 to-teal-500 text-white rounded-br-sm shadow-teal-900/20'
                                : msg.isRateLimit
                                    ? darkMode
                                        ? 'bg-amber-500/10 text-amber-200 border border-amber-500/30 rounded-bl-sm'
                                        : 'bg-amber-50 text-amber-800 border border-amber-200 rounded-bl-sm'
                                    : msg.isError
                                        ? darkMode
                                            ? 'bg-red-500/10 text-red-300 border border-red-500/30 rounded-bl-sm'
                                            : 'bg-red-50 text-red-700 border border-red-200 rounded-bl-sm'
                                        : darkMode
                                            ? 'bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-bl-sm'
                                            : 'bg-white text-slate-700 border border-slate-200/90 rounded-bl-sm shadow-slate-100'
                                }`}
                        >
                            {/* Formatted Markdown Body */}
                            <div className="space-y-1">
                                {msg.role === 'assistant' && !msg.isError && !msg.isRateLimit
                                    ? renderRichMarkdown(msg.content, darkMode)
                                    : <span>{msg.content}</span>}

                                {msg.isStreaming && (
                                    <span className="inline-block w-1.5 h-3.5 ml-0.5 align-middle bg-teal-400 animate-pulse" />
                                )}
                            </div>

                            {/* Bottom Info Bar: Speech Soundwave + Copy + Timestamp */}
                            <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-slate-700/20">
                                {msg.role === 'assistant' && !msg.isError && !msg.isRateLimit && !msg.isStreaming ? (
                                    <div className="flex items-center gap-1">
                                        {/* TTS Audio Button & Soundwave visualizer */}
                                        <button
                                            aria-label={speakingId === msg.id ? 'Hentikan suara' : 'Dengarkan suara'}
                                            title={speakingId === msg.id ? 'Hentikan suara' : 'Dengarkan suara'}
                                            onClick={() => handleToggleSpeak(msg.id, msg.content)}
                                            className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium transition-colors ${speakingId === msg.id
                                                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                                                : darkMode
                                                    ? 'text-slate-400 hover:text-teal-400 hover:bg-slate-700/60'
                                                    : 'text-slate-500 hover:text-teal-600 hover:bg-slate-100'
                                                }`}
                                        >
                                            {loadingSpeakId === msg.id ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : speakingId === msg.id ? (
                                                <>
                                                    <Square className="w-2.5 h-2.5 fill-current text-teal-400" />
                                                    <div className="flex items-end gap-0.5 h-3 px-0.5">
                                                        <span className="w-0.5 bg-teal-400 rounded-full animate-soundwave-1" />
                                                        <span className="w-0.5 bg-teal-400 rounded-full animate-soundwave-2" />
                                                        <span className="w-0.5 bg-teal-400 rounded-full animate-soundwave-3" />
                                                        <span className="w-0.5 bg-teal-400 rounded-full animate-soundwave-4" />
                                                    </div>
                                                </>
                                            ) : (
                                                <Volume2 className="w-3.5 h-3.5" />
                                            )}
                                        </button>

                                        {/* 1-Click Copy Button */}
                                        <button
                                            aria-label="Salin teks"
                                            title="Salin pesan ini"
                                            onClick={() => handleCopy(msg.id, msg.content)}
                                            className={`p-1 rounded-md text-[10px] transition-colors ${copiedId === msg.id
                                                ? 'text-emerald-400 font-semibold'
                                                : darkMode
                                                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/60'
                                                    : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
                                                }`}
                                        >
                                            {copiedId === msg.id ? (
                                                <span className="flex items-center gap-1 text-[9px]">
                                                    <Check className="w-3 h-3 text-emerald-400" />
                                                    Tersalin
                                                </span>
                                            ) : (
                                                <Copy className="w-3 h-3" />
                                            )}
                                        </button>
                                    </div>
                                ) : (
                                    <span />
                                )}

                                {msg.timestamp && (
                                    <span className="text-[9px] opacity-60 text-right select-none ml-auto">
                                        {msg.timestamp}
                                    </span>
                                )}
                            </div>

                            {msg.isRateLimit && (
                                <button
                                    onClick={handleRetry}
                                    disabled={isLoading || isStreaming || !lastUserMessage}
                                    className={`mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${darkMode
                                        ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40'
                                        : 'bg-amber-500 text-white hover:bg-amber-600 border border-amber-600'
                                        }`}
                                >
                                    <RefreshCw className="w-3 h-3" />
                                    Coba Lagi
                                </button>
                            )}
                        </div>

                        {msg.role === 'user' && (
                            <div
                                className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'
                                    }`}
                            >
                                <User className="w-3.5 h-3.5" />
                            </div>
                        )}
                    </div>
                ))}

                {/* Hero Starter Cards saat chat masih baru */}
                {messages.length === 1 && !isLoading && !isStreaming && (
                    <div className="pt-2 pb-1 space-y-3 animate-message-in">
                        <div className="flex items-center justify-between">
                            <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                Topik Percakapan Cepat:
                            </p>
                            <span className="text-[9px] text-teal-400 font-medium">Klik untuk mencoba ✨</span>
                        </div>

                        {/* Grid 4 Kartu Interaktif */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {STARTER_CARDS.map((card, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSend(card.prompt)}
                                    disabled={isLoading || isStreaming}
                                    className={`p-2.5 rounded-xl border text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 flex items-start gap-2.5 group ${darkMode
                                        ? 'bg-slate-800/70 border-slate-700/80 hover:border-teal-500/60 hover:bg-slate-800'
                                        : 'bg-white border-slate-200 hover:border-teal-500/60 hover:bg-teal-50/40 shadow-sm'
                                        }`}
                                >
                                    <div
                                        className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border transition-transform group-hover:scale-110 ${card.gradient}`}
                                    >
                                        {card.icon}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h5 className={`text-[11px] font-bold leading-tight group-hover:text-teal-400 transition-colors ${darkMode ? 'text-white' : 'text-slate-800'
                                            }`}>
                                            {card.title}
                                        </h5>
                                        <p className={`text-[10px] line-clamp-1 mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'
                                            }`}>
                                            {card.desc}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Secondary Pills */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                            {QUICK_PILLS.map((q) => (
                                <button
                                    key={q}
                                    onClick={() => handleSend(q)}
                                    disabled={isLoading || isStreaming}
                                    className={`text-[10px] px-2.5 py-1 rounded-full border transition-all hover:scale-105 active:scale-95 ${darkMode
                                        ? 'border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-teal-500/50'
                                        : 'border-slate-200 text-slate-600 hover:bg-white hover:border-teal-500/50 shadow-sm'
                                        } disabled:opacity-50`}
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Animated 3-Dots Typing Indicator */}
                {isLoading && (
                    <div className="flex gap-2.5 justify-start animate-message-in">
                        <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-extrabold tracking-tight bg-gradient-to-br from-blue-500 via-teal-500 to-emerald-500 text-white shadow-sm">
                            {SHOWCASE_BOT_INITIALS}
                        </div>
                        <div
                            className={`px-3.5 py-2.5 rounded-2xl rounded-bl-sm flex items-center gap-1.5 ${darkMode
                                ? 'bg-slate-800 border border-slate-700'
                                : 'bg-white border border-slate-200 shadow-sm'
                                }`}
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* ── Tech Stack Info Bar (selalu tampil) ─────────────────────── */}
            <div
                className={`px-4 py-2 border-t flex-shrink-0 flex items-center justify-between gap-2 flex-wrap ${darkMode
                    ? 'bg-slate-900/80 border-slate-800 text-slate-400'
                    : 'bg-slate-50/90 border-slate-200 text-slate-500'
                    }`}
            >
                {/* Kiri: Selector model + feature badges */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Model Selector Dropdown */}
                    <div className="relative" ref={modelMenuRef}>
                        <button
                            type="button"
                            onClick={() => setIsModelMenuOpen((prev) => !prev)}
                            disabled={isLoading || isStreaming}
                            aria-haspopup="listbox"
                            aria-expanded={isModelMenuOpen}
                            className={`inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-md border transition-colors disabled:opacity-50 ${darkMode
                                ? 'bg-teal-500/10 border-teal-500/30 text-teal-300 hover:bg-teal-500/20'
                                : 'bg-teal-50 border-teal-300 text-teal-700 hover:bg-teal-100'
                                }`}
                        >
                            <Sparkles className="w-2.5 h-2.5" />
                            {AVAILABLE_MODELS.find((m) => m.id === selectedModel)?.label ?? selectedModel}
                            <ChevronDown className={`w-2.5 h-2.5 transition-transform ${isModelMenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isModelMenuOpen && (
                            <div
                                role="listbox"
                                className={`absolute bottom-full left-0 mb-1.5 w-48 rounded-lg border shadow-lg overflow-hidden z-10 ${darkMode
                                    ? 'bg-slate-800 border-slate-700'
                                    : 'bg-white border-slate-200'
                                    }`}
                            >
                                {AVAILABLE_MODELS.map((m) => (
                                    <button
                                        key={m.id}
                                        type="button"
                                        role="option"
                                        aria-selected={m.id === selectedModel}
                                        onClick={() => {
                                            setSelectedModel(m.id);
                                            setIsModelMenuOpen(false);
                                        }}
                                        className={`w-full text-left px-2.5 py-1.5 text-[10px] transition-colors ${m.id === selectedModel
                                            ? darkMode
                                                ? 'bg-teal-500/15 text-teal-300'
                                                : 'bg-teal-50 text-teal-700'
                                            : darkMode
                                                ? 'text-slate-300 hover:bg-slate-700'
                                                : 'text-slate-700 hover:bg-slate-100'
                                            }`}
                                    >
                                        <div className="font-semibold">{m.label}</div>
                                        <div className={`text-[9px] ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                            {m.desc}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    {/* Info kecil kalau model yang benar-benar merespons berbeda (fallback backend) */}
                    {activeModel && activeModel !== selectedModel && (
                        <span
                            title={`Backend fallback ke ${activeModel} (kuota/limit model pilihan mungkin habis)`}
                            className={`text-[9px] italic ${darkMode ? 'text-amber-400/80' : 'text-amber-600'}`}
                        >
                            fallback: {activeModel}
                        </span>
                    )}
                    {/* Divider */}
                    <span className={`text-[9px] ${darkMode ? 'text-slate-700' : 'text-slate-300'}`}>|</span>
                    {/* Feature badges */}
                    {[
                        { label: 'Voice AI', color: darkMode ? 'text-violet-300' : 'text-violet-600' },
                        { label: 'STT+TTS', color: darkMode ? 'text-sky-300' : 'text-sky-600' },
                        { label: 'Multi-LLM', color: darkMode ? 'text-amber-300' : 'text-amber-600' },
                        { label: 'Serverless', color: darkMode ? 'text-emerald-300' : 'text-emerald-600' },
                    ].map(({ label, color }) => (
                        <span key={label} className={`text-[9px] font-medium ${color}`}>
                            {label}
                        </span>
                    ))}
                </div>

                {/* Kanan: Status mic recording (hanya saat aktif) */}
                {isListening ? (
                    <span className="flex items-center gap-1 text-[9px] font-semibold text-red-400 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        Merekam...
                    </span>
                ) : (
                    <span className={`text-[9px] ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>
                        Auto-failover • Rate Limited
                    </span>
                )}
            </div>

            {/* Input Form Bar */}
            <div
                className={`p-3 border-t flex-shrink-0 ${darkMode ? 'border-slate-700/80 bg-slate-900' : 'border-slate-200 bg-white'
                    }`}
            >
                <div
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition-all ${isListening
                        ? 'border-red-500 ring-2 ring-red-500/20'
                        : darkMode
                            ? 'bg-slate-800/90 border-slate-700 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20'
                            : 'bg-slate-50/80 border-slate-300 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20'
                        }`}
                >
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isListening ? 'Mendengarkan suara Anda...' : 'Tanyakan sesuatu atau klik kartu di atas...'}
                        disabled={isLoading || isStreaming}
                        className={`flex-1 bg-transparent outline-none text-xs placeholder:text-slate-400 ${darkMode ? 'text-white' : 'text-slate-900'
                            } disabled:opacity-50`}
                    />

                    {/* Microphone STT Button with Ripple Glow */}
                    {voiceSupport.stt && (
                        <div className="relative">
                            {isListening && (
                                <span className="absolute inset-0 rounded-lg bg-red-500 animate-ping opacity-40 pointer-events-none" />
                            )}
                            <button
                                aria-label={isListening ? 'Berhenti merekam' : 'Bicara dengan mikrofon'}
                                title={isListening ? 'Berhenti merekam' : 'Bicara dengan mikrofon'}
                                onClick={handleMicClick}
                                disabled={isLoading || isStreaming}
                                className={`relative p-1.5 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed ${isListening
                                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                                    : darkMode
                                        ? 'text-slate-400 hover:text-white hover:bg-slate-700'
                                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                                    }`}
                            >
                                <Mic className={`w-4 h-4 ${isListening ? 'animate-pulse' : ''}`} />
                            </button>
                        </div>
                    )}

                    {/* Send Button */}
                    <button
                        onClick={() => handleSend()}
                        disabled={!input.trim() || isLoading || isStreaming}
                        className={`p-1.5 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95 ${darkMode
                            ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:from-teal-400 hover:to-emerald-400 shadow-md shadow-teal-900/30'
                            : 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white hover:from-teal-700 hover:to-emerald-700 shadow-md shadow-teal-600/20'
                            }`}
                        aria-label="Kirim pesan"
                    >
                        <Send className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
};