import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, AlertCircle, Loader2, Trash2, Clock, RefreshCw } from 'lucide-react';
import { sendMessageToGemini, ChatMessage } from '../services/geminiService';
import { saveMessages, loadMessages, saveGeminiHistory, loadGeminiHistory, clearChatStorage } from '../utils/chatStorage';

interface AIChatbotShowcaseProps {
    darkMode: boolean;
}

interface DisplayMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    isError?: boolean;
    isRateLimit?: boolean;
}

const SUGGESTED_QUESTIONS = [
    'Apa saja skill developer ini?',
    'Ceritakan tentang proyek terbaru',
    'Teknologi apa yang dikuasai?',
    'Bagaimana cara menghubungi?',
];

// Helper: deteksi apakah error dari Gemini adalah rate limit / quota / unavailable
const isRateLimitError = (error: unknown): boolean => {
    if (!error) return false;

    // Cek status code (Gemini SDK biasanya expose ini)
    const status =
        (error as any)?.status ||
        (error as any)?.statusCode ||
        (error as any)?.code ||
        (error as any)?.response?.status;

    if (status === 429 || status === 503) return true;

    // Cek dari message string (fallback)
    const message =
        (error instanceof Error ? error.message : String(error)) || '';
    const upperMsg = message.toUpperCase();
    const lowerMsg = message.toLowerCase();

    return (
        upperMsg.includes('AI_UNAVAILABLE') ||
        upperMsg.includes('UNAVAILABLE') ||
        lowerMsg.includes('quota') ||
        lowerMsg.includes('rate limit') ||
        lowerMsg.includes('ratelimit') ||
        lowerMsg.includes('resource_exhausted') ||
        lowerMsg.includes('429') ||
        lowerMsg.includes('too many requests') ||
        lowerMsg.includes('limit reached') ||
        lowerMsg.includes('overloaded')
    );
};

// Helper: bedakan antara "limit habis" vs "model lagi down/busy"
const isModelUnavailable = (error: unknown): boolean => {
    const message = (error instanceof Error ? error.message : String(error)) || '';
    const upperMsg = message.toUpperCase();
    return (
        upperMsg.includes('AI_UNAVAILABLE') ||
        upperMsg.includes('UNAVAILABLE') ||
        upperMsg.includes('OVERLOADED')
    );
};

export const AIChatbotShowcase: React.FC<AIChatbotShowcaseProps> = ({ darkMode }) => {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [lastUserMessage, setLastUserMessage] = useState<string>('');
    const [activeModel, setActiveModel] = useState<string>('gemini-3.8-flash');
    const [messages, setMessages] = useState<DisplayMessage[]>(() => {
        const saved = loadMessages<DisplayMessage>('showcase');
        if (saved && saved.length > 0) return saved;
        return [
            {
                id: 'welcome',
                role: 'assistant',
                content:
                    'Halo! 👋 Saya asisten AI. Coba tanyakan apa saja tentang developer, proyek, atau skill-nya. Ini demo live — powered by Gemini API!',
            },
        ];
    });
    const [history, setHistory] = useState<ChatMessage[]>(() => loadGeminiHistory<ChatMessage>('showcase'));
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Auto-save messages ke localStorage
    useEffect(() => {
        saveMessages('showcase', messages);
    }, [messages]);

    // Auto-save Gemini context history ke sessionStorage
    useEffect(() => {
        saveGeminiHistory('showcase', history);
    }, [history]);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSend = async (textOverride?: string) => {
        const text = (textOverride ?? input).trim();
        if (!text || isLoading) return;

        const userMsg: DisplayMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: text,
        };
        setMessages((prev) => [...prev, userMsg]);
        setLastUserMessage(text);
        setInput('');
        setIsLoading(true);

        try {
            const result = await sendMessageToGemini(history, text);
            const replyText = result.reply;

            // Update model label sesuai model yang aktif dipilih server
            if (result.model) setActiveModel(result.model);

            const assistantMsg: DisplayMessage = {
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                content: replyText,
            };
            setMessages((prev) => [...prev, assistantMsg]);
            setHistory((prev) => [
                ...prev,
                { role: 'user', parts: [{ text }] },
                { role: 'model', parts: [{ text: replyText }] },
            ]);
        } catch (error) {
            const isLimit = isRateLimitError(error);
            const isUnavailable = isModelUnavailable(error);

            if (isLimit) {
                // Pesan berbeda tergantung jenis error
                const content = isUnavailable
                    ? '⚠️ AI sedang tidak tersedia (AI_UNAVAILABLE)\n\nIni biasanya terjadi karena Gemini Free Tier sedang overload atau ada banyak user yang mengakses bersamaan. Coba tunggu ~30 detik lalu tekan "Coba Lagi" ya.'
                    : '⏳ Kuota AI sedang habis (Rate Limit)\n\nKarena ini pakai Gemini Free Tier, kuota per menit/harinya terbatas. Coba tunggu sebentar lalu tekan "Coba Lagi".';

                setMessages((prev) => [
                    ...prev,
                    {
                        id: `limit-${Date.now()}`,
                        role: 'assistant',
                        content,
                        isRateLimit: true,
                    },
                ]);
            } else {
                const errMsg = error instanceof Error ? error.message : 'Terjadi kesalahan';
                setMessages((prev) => [
                    ...prev,
                    {
                        id: `error-${Date.now()}`,
                        role: 'assistant',
                        content: `Maaf, terjadi kesalahan: ${errMsg}`,
                        isError: true,
                    },
                ]);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleRetry = () => {
        if (lastUserMessage && !isLoading) {
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
        clearChatStorage('showcase');
        setMessages([
            {
                id: 'welcome-reset',
                role: 'assistant',
                content: 'Percakapan direset. Silakan tanya lagi ya! ',
            },
        ]);
        setHistory([]);
        setLastUserMessage('');
    };

    return (
        <div className="flex flex-col h-full min-h-0 flex-1">
            {/* Chat Header Info */}
            <div
                className={`px-4 py-2.5 border-b flex items-center justify-between flex-shrink-0 ${darkMode ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-50'
                    }`}
            >
                <div className="flex items-center gap-2">
                    <div
                        className={`relative w-8 h-8 rounded-full flex items-center justify-center ${darkMode ? 'bg-teal-500/20' : 'bg-teal-100'
                            }`}
                    >
                        <Bot className={`w-4 h-4 ${darkMode ? 'text-teal-400' : 'text-teal-600'}`} />
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
                    </div>
                    <div>
                        <h4 className={`text-sm font-bold leading-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            AI Assistant Demo
                        </h4>
                        <p className={`text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            {activeModel} • Live
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleReset}
                    title="Reset percakapan"
                    className={`p-1.5 rounded-lg transition-colors ${darkMode
                            ? 'text-slate-400 hover:text-white hover:bg-slate-700'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                        }`}
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {/* Messages Area */}
            <div
                className={`flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3 ${darkMode ? 'bg-slate-900/40' : 'bg-white'
                    }`}
            >
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        {msg.role === 'assistant' && (
                            <div
                                className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center ${msg.isRateLimit
                                        ? darkMode
                                            ? 'bg-amber-500/20'
                                            : 'bg-amber-100'
                                        : msg.isError
                                            ? darkMode
                                                ? 'bg-red-500/20'
                                                : 'bg-red-100'
                                            : darkMode
                                                ? 'bg-teal-500/20'
                                                : 'bg-teal-100'
                                    }`}
                            >
                                {msg.isRateLimit ? (
                                    <Clock className={`w-3.5 h-3.5 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
                                ) : msg.isError ? (
                                    <AlertCircle className={`w-3.5 h-3.5 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
                                ) : (
                                    <Bot className={`w-3.5 h-3.5 ${darkMode ? 'text-teal-400' : 'text-teal-600'}`} />
                                )}
                            </div>
                        )}
                        <div
                            className={`max-w-[75%] px-3 py-2 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${msg.role === 'user'
                                    ? 'bg-teal-600 text-white rounded-br-sm'
                                    : msg.isRateLimit
                                        ? darkMode
                                            ? 'bg-amber-500/10 text-amber-200 border border-amber-500/30 rounded-bl-sm'
                                            : 'bg-amber-50 text-amber-800 border border-amber-200 rounded-bl-sm'
                                        : msg.isError
                                            ? darkMode
                                                ? 'bg-red-500/10 text-red-300 border border-red-500/30'
                                                : 'bg-red-50 text-red-700 border border-red-200'
                                            : darkMode
                                                ? 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-sm'
                                                : 'bg-slate-100 text-slate-700 border border-slate-200 rounded-bl-sm'
                                }`}
                        >
                            {msg.content}

                            {msg.isRateLimit && (
                                <button
                                    onClick={handleRetry}
                                    disabled={isLoading || !lastUserMessage}
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
                                className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center ${darkMode ? 'bg-slate-700' : 'bg-slate-200'
                                    }`}
                            >
                                <User className={`w-3.5 h-3.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`} />
                            </div>
                        )}
                    </div>
                ))}

                {messages.length === 1 && (
                    <div className="pt-2">
                        <p className={`text-[10px] font-semibold uppercase tracking-wider mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                            Coba tanya:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {SUGGESTED_QUESTIONS.map((q) => (
                                <button
                                    key={q}
                                    onClick={() => handleSend(q)}
                                    disabled={isLoading}
                                    className={`text-[11px] px-2.5 py-1.5 rounded-full border transition-colors ${darkMode
                                            ? 'border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-teal-500/50'
                                            : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-teal-500/50'
                                        } disabled:opacity-50`}
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {isLoading && (
                    <div className="flex gap-2 justify-start">
                        <div
                            className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center ${darkMode ? 'bg-teal-500/20' : 'bg-teal-100'
                                }`}
                        >
                            <Bot className={`w-3.5 h-3.5 ${darkMode ? 'text-teal-400' : 'text-teal-600'}`} />
                        </div>
                        <div
                            className={`px-3 py-2 rounded-2xl rounded-bl-sm ${darkMode
                                    ? 'bg-slate-800 border border-slate-700'
                                    : 'bg-slate-100 border border-slate-200'
                                }`}
                        >
                            <Loader2 className={`w-4 h-4 animate-spin ${darkMode ? 'text-teal-400' : 'text-teal-600'}`} />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Disclaimer */}
            <div
                className={`px-4 py-1.5 border-t flex-shrink-0 flex items-center gap-1.5 text-[10px] ${darkMode
                        ? 'bg-slate-900 border-slate-800 text-slate-500'
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
            >
                <Sparkles className="w-3 h-3 flex-shrink-0" />
                <span>
                    <b className={darkMode ? 'text-slate-300' : 'text-slate-700'}>Multi-model AI</b> — otomatis pakai model terbaik yang tersedia ({activeModel})
                </span>
            </div>

            {/* Input */}
            <div
                className={`p-3 border-t flex-shrink-0 ${darkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'
                    }`}
            >
                <div
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${darkMode
                            ? 'bg-slate-800 border-slate-700 focus-within:border-teal-500'
                            : 'bg-white border-slate-300 focus-within:border-teal-500'
                        }`}
                >
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ketik pertanyaan..."
                        disabled={isLoading}
                        className={`flex-1 bg-transparent outline-none text-xs placeholder:text-slate-400 ${darkMode ? 'text-white' : 'text-slate-900'
                            } disabled:opacity-50`}
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={!input.trim() || isLoading}
                        className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${darkMode
                                ? 'bg-teal-500 text-white hover:bg-teal-600'
                                : 'bg-teal-600 text-white hover:bg-teal-700'
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