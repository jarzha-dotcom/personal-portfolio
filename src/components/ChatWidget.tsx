import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageSquare, X, Send, User, Wifi, WifiOff } from 'lucide-react';
import Fuse from 'fuse.js';
import { CONTACT_INFO } from '../data/portfolioData';
import { sendMessageToGemini, ChatMessage } from '../services/geminiService';

interface ChatWidgetProps {
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
  isAI?: boolean; // true = AI-generated, false = FAQ fallback
}

// ─── FAQ Fallback Data (Fuse.js) ────────────────────────────────────────────

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

const CATEGORIES: Category[] = [
  { id: 'harga', label: '💰 Harga & Paket' },
  { id: 'proses', label: '⏱️ Proses & Durasi' },
  { id: 'tech', label: '🛠️ Skill & Tech Stack' },
  { id: 'portfolio', label: '📂 Portfolio' },
  { id: 'kontak', label: '📞 Kontak & Ketersediaan' },
];

const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'harga-landing', categoryId: 'harga', quickLabel: 'Harga landing page?',
    keywords: ['harga landing page', 'biaya landing page', 'landing page berapa', 'halaman tunggal', 'company profile 1 halaman'],
    answer: 'Landing page (1 halaman) mulai dari Rp800rb. Harga final tergantung kompleksitas desain & fitur — konsultasi awal gratis buat estimasi pasti! 🎯',
  },
  {
    id: 'harga-webapp', categoryId: 'harga', quickLabel: 'Harga web app custom?',
    keywords: ['harga web app', 'biaya dashboard', 'harga sistem internal', 'harga aplikasi web', 'web app berapa'],
    answer: 'Web app custom (dashboard, sistem internal, tools bisnis) mulai dari Rp6 juta, tergantung kompleksitas fitur yang dibutuhkan.',
  },
  {
    id: 'harga-mobile', categoryId: 'harga', quickLabel: 'Harga aplikasi mobile?',
    keywords: ['harga aplikasi mobile', 'biaya bikin app', 'harga app android', 'harga aplikasi ios', 'mobile app berapa'],
    answer: 'Aplikasi mobile custom mulai dari Rp6 juta, tergantung fitur & platform (Android/iOS).',
  },
  {
    id: 'harga-game', categoryId: 'harga', quickLabel: 'Harga bikin game?',
    keywords: ['harga game', 'biaya bikin game', 'harga platform multiplayer', 'game berapa', 'harga board game'],
    answer: 'Game / platform multiplayer mulai dari Rp12 juta — realtime multiplayer & backend butuh effort lebih dari web app biasa.',
  },
  {
    id: 'harga-promo', categoryId: 'harga', quickLabel: 'Ada promo?',
    keywords: ['promo', 'diskon', 'harga spesial', 'promo peluncuran'],
    answer: '🔥 Ada promo peluncuran buat 5 klien pertama: gratis technical support 1 bulan, tambahan 2x revisi mayor, dan diskon 15% kalau proyeknya jadi studi kasus portofolio. Slot terbatas!',
  },
  {
    id: 'proses-durasi', categoryId: 'proses', quickLabel: 'Berapa lama pengerjaan?',
    keywords: ['berapa lama', 'durasi pengerjaan', 'estimasi waktu', 'lama proyek', 'timeline'],
    answer: 'Tergantung kompleksitas — landing page 1-2 minggu, web app/mobile app 3-6 minggu, game 6-10 minggu. Timeline pasti dibahas di awal konsultasi.',
  },
  {
    id: 'proses-alur', categoryId: 'proses', quickLabel: 'Gimana alur kerjanya?',
    keywords: ['alur kerja', 'proses kerja', 'tahapan proyek', 'cara kerja', 'workflow'],
    answer: '4 tahap: Konsultasi → Desain & Prototipe → Development & Testing → Deployment & Rilis. Update progres berkala via WhatsApp — transparan dari awal sampai rilis.',
  },
  {
    id: 'proses-revisi', categoryId: 'proses', quickLabel: 'Ada revisi?',
    keywords: ['revisi', 'ganti desain', 'ubah fitur', 'koreksi'],
    answer: 'Setiap paket termasuk revisi standar. Klien promo peluncuran malah dapat tambahan 2x revisi mayor gratis di luar itu.',
  },
  {
    id: 'proses-pembayaran', categoryId: 'proses', quickLabel: 'Sistem pembayaran?',
    keywords: ['pembayaran', 'dp', 'cicilan', 'bayar gimana', 'termin'],
    answer: 'Skema DP & termin disesuaikan sama skala proyek — dibahas langsung pas konsultasi di WhatsApp biar jelas & fair buat dua belah pihak.',
  },
  {
    id: 'tech-stack', categoryId: 'tech', quickLabel: 'Teknologi apa yang dipakai?',
    keywords: ['teknologi', 'tech stack', 'pakai bahasa apa', 'framework', 'react node'],
    answer: 'React, TypeScript, Node.js, Supabase buat web app. React Native & Expo buat mobile. Khusus game pakai boardgame.io + WebSockets buat realtime multiplayer.',
  },
  {
    id: 'tech-custom', categoryId: 'tech', quickLabel: 'Bisa bikin sesuai kebutuhan khusus?',
    keywords: ['bisa bikin seperti', 'custom request', 'fitur khusus', 'bisa nggak'],
    answer: 'Bisa! Ceritain detail kebutuhannya langsung di WhatsApp, nanti kita diskusiin feasibility & estimasinya bareng.',
  },
  {
    id: 'portfolio-proyek', categoryId: 'portfolio', quickLabel: 'Ada contoh kerjaan?',
    keywords: ['portfolio', 'contoh kerjaan', 'proyek apa aja', 'pernah bikin apa', 'demo'],
    answer: 'Ada 3 proyek rilis: B-Games (game multiplayer online), Rajendra Pintar (app edukasi anak), Assets GMP (sistem manajemen aset). Scroll ke bagian Proyek buat lihat detail & demo live-nya! 👇',
  },
  {
    id: 'portfolio-pengalaman', categoryId: 'portfolio', quickLabel: 'Pengalaman development berapa lama?',
    keywords: ['pengalaman kerja', 'sudah berapa lama', 'pengalaman development'],
    answer: 'Development jadi fokus utama sekarang, dengan 3 proyek nyata yang udah rilis. Didukung juga 7+ tahun latar belakang korporat yang ngebentuk kedisiplinan kerja.',
  },
  {
    id: 'kontak-wa', categoryId: 'kontak', quickLabel: 'Kontak & WhatsApp?',
    keywords: ['kontak', 'whatsapp', 'nomor hp', 'email', 'hubungi'],
    answer: 'Bisa langsung chat WhatsApp atau email lewat tombol di bawah, atau isi form di bagian Kontak halaman ini.',
  },
  {
    id: 'kontak-availability', categoryId: 'kontak', quickLabel: 'Masih terima proyek baru?',
    keywords: ['masih buka', 'terima proyek', 'available', 'slot kosong'],
    answer: 'Masih buka untuk proyek baru! Apalagi lagi ada promo peluncuran buat klien-klien awal — cek bagian Layanan buat detailnya.',
  },
];

const fuse = new Fuse(FAQ_ITEMS, {
  keys: ['keywords', 'quickLabel'],
  threshold: 0.4,
  ignoreLocation: true,
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

const nowStr = () => new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

/** Estimate typing delay from response length (80ms/char, min 800ms, max 2500ms) */
const typingDelay = (text: string) =>
  Math.min(2500, Math.max(800, Math.round(text.length * 80 / 10)));

const WELCOME_OPTIONS: QuickOption[] = CATEGORIES.map((c) => ({ id: c.id, label: c.label }));

// ─── Component ───────────────────────────────────────────────────────────────

export const ChatWidget: React.FC<ChatWidgetProps> = ({ darkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [aiMode, setAiMode] = useState<'ai' | 'fallback' | 'unknown'>('unknown');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Halo! Saya Kana, asisten Arzha 👋 Mau nanya soal apa? Pilih kategori atau langsung ketik aja!',
      timestamp: nowStr(),
      options: WELCOME_OPTIONS,
      isAI: true,
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastQueryRef = useRef<string>('');
  // Gemini conversation history (exclude welcome msg)
  const geminiHistoryRef = useRef<ChatMessage[]>([]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const cleanPhone = CONTACT_INFO.phone.replace(/[^0-9]/g, '');

  const openWhatsApp = useCallback(() => {
    const context = lastQueryRef.current
      ? `Halo Arzha, saya ingin tanya soal: ${lastQueryRef.current}`
      : 'Halo Arzha, saya tertarik dengan jasa development kamu.';
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(context)}`, '_blank');
  }, [cleanPhone]);

  // ── Bot reply helpers ──────────────────────────────────────────────────────

  const appendBotMessage = (text: string, options?: QuickOption[], isAI = false) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text,
        timestamp: nowStr(),
        options,
        isAI,
      },
    ]);
  };

  const standardCTA: QuickOption[] = [
    { id: 'menu', label: '⬅️ Menu Utama' },
    { id: 'whatsapp', label: '💬 Chat via WhatsApp' },
  ];

  // FAQ fallback response
  const respondWithFAQ = (faq: FAQItem) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      appendBotMessage(faq.answer, standardCTA, false);
    }, typingDelay(faq.answer));
  };

  const respondWithFallback = () => {
    setIsTyping(true);
    const text =
      'Hmm, aku belum punya jawaban pasti soal itu. Tapi bisa langsung tanya Arzha lewat WhatsApp — dijawab langsung! 👇';
    setTimeout(() => {
      setIsTyping(false);
      appendBotMessage(text, standardCTA, false);
    }, typingDelay(text));
  };

  // AI (Gemini) response — with automatic Fuse.js fallback
  const respondWithAI = async (userText: string) => {
    setIsTyping(true);

    // Optimistic history update
    const userMsg: ChatMessage = { role: 'user', parts: [{ text: userText }] };

    try {
      const reply = await sendMessageToGemini(geminiHistoryRef.current, userText);

      // Update history with successful exchange
      geminiHistoryRef.current = [
        ...geminiHistoryRef.current,
        userMsg,
        { role: 'model', parts: [{ text: reply }] },
      ].slice(-12); // keep last 6 exchanges

      setAiMode('ai');
      const delay = typingDelay(reply);
      setTimeout(() => {
        setIsTyping(false);
        appendBotMessage(reply, standardCTA, true);
      }, delay);
    } catch (err: unknown) {
      // ── Graceful degradation: fall to Fuse.js FAQ ──────────────────────
      console.warn('[ChatWidget] Gemini unavailable, falling back to FAQ:', err);
      setAiMode('fallback');

      const results = fuse.search(userText);
      if (results.length > 0) {
        setTimeout(() => {
          setIsTyping(false);
          appendBotMessage(results[0].item.answer, standardCTA, false);
        }, typingDelay(results[0].item.answer));
      } else {
        setTimeout(() => {
          setIsTyping(false);
          respondWithFallback();
        }, 600);
      }
    }
  };

  // ── Category / quick-option flow ──────────────────────────────────────────

  const showCategoryMenu = () => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      appendBotMessage('Mau tanya soal apa lagi?', WELCOME_OPTIONS);
    }, 400);
  };

  const showCategoryQuestions = (category: Category) => {
    const items = FAQ_ITEMS.filter((f) => f.categoryId === category.id);
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      appendBotMessage(
        `Pilih pertanyaan seputar ${category.label.replace(/^\S+\s/, '')}:`,
        [
          ...items.map((f) => ({ id: f.id, label: f.quickLabel })),
          { id: 'menu', label: '⬅️ Menu Utama' },
        ],
      );
    }, 400);
  };

  const handleOptionClick = (id: string, label: string) => {
    if (id === 'whatsapp') { openWhatsApp(); return; }
    if (id === 'menu') { showCategoryMenu(); return; }

    const category = CATEGORIES.find((c) => c.id === id);
    if (category) {
      setMessages((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, sender: 'user', text: label, timestamp: nowStr() },
      ]);
      showCategoryQuestions(category);
      return;
    }

    const faq = FAQ_ITEMS.find((f) => f.id === id);
    if (faq) {
      setMessages((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, sender: 'user', text: label, timestamp: nowStr() },
      ]);
      lastQueryRef.current = faq.quickLabel;
      respondWithFAQ(faq);
    }
  };

  // ── Free-text message send ─────────────────────────────────────────────────

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const trimmed = text.trim();
    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, sender: 'user', text: trimmed, timestamp: nowStr() },
    ]);
    setInputValue('');
    lastQueryRef.current = trimmed;
    respondWithAI(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  // ── Mode badge ─────────────────────────────────────────────────────────────

  const ModeBadge = () => {
    if (aiMode === 'unknown') return null;
    const isAI = aiMode === 'ai';
    return (
      <span
        className={`flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
          isAI
            ? darkMode ? 'bg-teal-900/60 text-teal-400' : 'bg-teal-50 text-teal-600'
            : darkMode ? 'bg-amber-900/50 text-amber-400' : 'bg-amber-50 text-amber-600'
        }`}
        title={isAI ? 'Mode AI aktif' : 'Mode FAQ (AI tidak tersedia)'}
      >
        {isAI ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
        {isAI ? 'AI' : 'FAQ'}
      </span>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="fixed bottom-6 left-6 z-50 no-print">
      {isOpen && (
        <div
          className={`w-80 sm:w-96 h-[480px] rounded-2xl shadow-2xl border flex flex-col mb-3 overflow-hidden transition-all ${
            darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
          }`}
        >
          {/* Header */}
          <div
            className={`p-3.5 flex items-center justify-between border-b ${
              darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 text-white flex items-center justify-center text-xs font-bold shadow-md">
                  KA
                </div>
                {/* Online dot */}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white dark:border-slate-800" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className={`text-xs font-bold leading-none ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    Kana
                  </p>
                  <ModeBadge />
                </div>
                <p className={`text-[10px] mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Asisten Arzha • Online
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className={`p-1.5 rounded-lg transition-colors ${
                darkMode
                  ? 'text-slate-400 hover:text-white hover:bg-slate-700'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Body */}
          <div
            className={`flex-1 p-3.5 overflow-y-auto space-y-3 text-xs ${
              darkMode ? 'bg-slate-900' : 'bg-slate-50'
            }`}
          >
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'bot' && (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 text-white flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">
                    KA
                  </div>
                )}
                <div className="max-w-[85%] flex flex-col gap-1.5">
                  <div
                    className={`px-3 py-2 rounded-xl leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-teal-600 text-white rounded-br-none ml-auto'
                        : darkMode
                        ? 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
                        : 'bg-white text-slate-700 border border-slate-200 shadow-sm rounded-bl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.text}</p>
                    <span className="block text-[9px] opacity-50 text-right mt-1">
                      {m.timestamp}
                    </span>
                  </div>
                  {m.options && m.options.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {m.options.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => handleOptionClick(opt.id, opt.label)}
                          className={`text-[10.5px] px-2.5 py-1.5 rounded-full border font-medium transition-all active:scale-95 ${
                            opt.id === 'whatsapp'
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
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    <User className="w-3 h-3" />
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-2 justify-start">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 text-white flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">
                  KA
                </div>
                <div
                  className={`px-3.5 py-2.5 rounded-xl rounded-bl-none flex items-center gap-1 ${
                    darkMode
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

          {/* Input Area */}
          <div
            className={`p-2.5 border-t flex items-center gap-2 ${
              darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
            }`}
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tanya Kana sesuatu..."
              className={`flex-1 px-3 py-2 rounded-lg text-xs border focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                darkMode
                  ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
              }`}
            />
            <button
              onClick={() => sendMessage(inputValue)}
              disabled={!inputValue.trim() || isTyping}
              className="w-8 h-8 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors"
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
        title="Chat dengan Kana"
      >
        {isOpen ? <X className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
      </button>
    </div>
  );
};