import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, User } from 'lucide-react';

interface ChatWidgetCVProps {
    darkMode: boolean;
}

interface Message {
    id: string;
    sender: 'user' | 'bot';
    text: string;
    timestamp: string;
}

const quickQuestions = [
    'Pengalaman audit?',
    'Skill ERP & administrasi?',
    'Ketersediaan kerja?',
    'Kontak & CV?',
];

const botResponses: Record<string, string> = {
    'Pengalaman audit?':
        'Saya memiliki 7+ tahun pengalaman di sektor korporat, saat ini sebagai Staff Audit Internal di PT Global Multipart — menyusun rencana audit, rekonsiliasi stok, dan laporan kepatuhan SOP.',
    'Skill ERP & administrasi?':
        'Hard skills utama: SAP Business One, Microsoft Excel (Advanced), Audit Internal & SOP Compliance, Administrasi & Pembukuan, serta Analisis Data & Reporting.',
    'Ketersediaan kerja?':
        'Saat ini saya terbuka untuk peluang kerja penuh waktu maupun kolaborasi, khususnya di bidang audit internal dan administrasi bisnis. Siap untuk penempatan Jabodetabek & Hybrid.',
    'Kontak & CV?':
        'Anda bisa menghubungi saya via WhatsApp di 0823-1231-2734 atau email ke Jarzha@gmail.com. Tombol "Cetak / Unduh" di navbar juga bisa dipakai untuk menyimpan CV ini sebagai PDF.',
};

export const ChatWidgetCV: React.FC<ChatWidgetCVProps> = ({ darkMode }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            sender: 'bot',
            text: 'Halo! Saya asisten virtual Arzha. Ada yang ingin ditanyakan soal pengalaman kerja, skill, atau ketersediaan untuk bergabung?',
            timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        },
    ]);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = (text: string) => {
        if (!text.trim()) return;

        const userMsg: Message = {
            id: `user-${Date.now()}`,
            sender: 'user',
            text: text.trim(),
            timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInputValue('');

        setTimeout(() => {
            let reply = 'Terima kasih atas pertanyaannya! Untuk informasi lebih detail, silakan hubungi langsung via WhatsApp atau email yang tertera di bagian Kontak.';
            for (const [key, val] of Object.entries(botResponses)) {
                if (text.toLowerCase().includes(key.toLowerCase().replace('?', '').slice(0, 8))) {
                    reply = val;
                    break;
                }
            }
            const botMsg: Message = {
                id: `bot-${Date.now()}`,
                sender: 'bot',
                text: reply,
                timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            };
            setMessages((prev) => [...prev, botMsg]);
        }, 600);
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
                    className={`w-80 sm:w-96 h-[420px] rounded-2xl shadow-2xl border flex flex-col mb-3 overflow-hidden ${darkMode
                        ? 'bg-slate-900 border-slate-700'
                        : 'bg-white border-slate-200'
                        }`}
                >
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

                    <div className={`flex-1 p-3.5 overflow-y-auto space-y-3 text-xs ${darkMode ? 'bg-slate-900' : 'bg-slate-50'
                        }`}>
                        {messages.map((m) => (
                            <div
                                key={m.id}
                                className={`flex gap-2 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                {m.sender === 'bot' && (
                                    <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">
                                        KA
                                    </div>
                                )}
                                <div
                                    className={`max-w-[80%] px-3 py-2 rounded-xl ${m.sender === 'user'
                                        ? 'bg-teal-600 text-white rounded-br-none'
                                        : darkMode
                                            ? 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
                                            : 'bg-white text-slate-700 border border-slate-200 shadow-sm rounded-bl-none'
                                        }`}
                                >
                                    <p>{m.text}</p>
                                    <span className="block text-[9px] opacity-60 text-right mt-1">
                                        {m.timestamp}
                                    </span>
                                </div>
                                {m.sender === 'user' && (
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'
                                        }`}>
                                        <User className="w-3 h-3" />
                                    </div>
                                )}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className={`p-2 border-t flex flex-wrap gap-1.5 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
                        }`}>
                        {quickQuestions.map((q, idx) => (
                            <button
                                key={idx}
                                onClick={() => sendMessage(q)}
                                className={`text-[10px] px-2 py-1 rounded-full border font-medium transition-colors ${darkMode
                                    ? 'border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white'
                                    : 'border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                    }`}
                            >
                                {q}
                            </button>
                        ))}
                    </div>

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