import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, User } from 'lucide-react';
import Fuse from 'fuse.js';
import { CONTACT_INFO } from '../data/portfolioData';

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

// Widget ini khusus halaman JASA — semua isi FAQ fokus ke pertanyaan
// calon klien (harga, proses, tech stack), bukan pertanyaan rekrutmen
// (itu porsi ChatWidgetCV).
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
    answer: 'Landing page (1 halaman) mulai dari Rp800rb. Harga final tergantung kompleksitas desain & fitur — konsultasi awal gratis buat estimasi pasti.',
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
    answer: 'Ada! Promo peluncuran buat 5 klien pertama: gratis technical support 1 bulan pasca rilis, tambahan 2x revisi mayor, dan diskon tambahan 15% kalau bersedia proyeknya dijadikan studi kasus portofolio. Cek detail lengkapnya di bagian Layanan ya.',
  },
  {
    id: 'proses-durasi', categoryId: 'proses', quickLabel: 'Berapa lama pengerjaan?',
    keywords: ['berapa lama', 'durasi pengerjaan', 'estimasi waktu', 'lama proyek', 'timeline'],
    answer: 'Tergantung kompleksitas — landing page biasanya 1-2 minggu, web app/mobile app 3-6 minggu, game 6-10 minggu tergantung fitur. Timeline pasti dibahas di awal konsultasi.',
  },
  {
    id: 'proses-alur', categoryId: 'proses', quickLabel: 'Gimana alur kerjanya?',
    keywords: ['alur kerja', 'proses kerja', 'tahapan proyek', 'cara kerja', 'workflow'],
    answer: '4 tahap: Konsultasi Kebutuhan → Desain & Prototipe → Development & Testing → Deployment & Rilis. Transparan, update progres berkala via WhatsApp.',
  },
  {
    id: 'proses-revisi', categoryId: 'proses', quickLabel: 'Ada revisi?',
    keywords: ['revisi', 'ganti desain', 'ubah fitur', 'koreksi'],
    answer: 'Setiap paket termasuk revisi standar. Klien promo peluncuran malah dapat tambahan 2x revisi mayor gratis di luar itu.',
  },
  {
    id: 'proses-pembayaran', categoryId: 'proses', quickLabel: 'Sistem pembayaran?',
    keywords: ['pembayaran', 'dp', 'cicilan', 'bayar gimana', 'termin'],
    answer: 'Skema pembayaran (DP & termin) disesuaikan sama skala proyek — dibahas langsung pas konsultasi di WhatsApp biar jelas & fair buat dua belah pihak.',
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
    answer: 'Ada 3 proyek yang udah rilis: B-Games (game multiplayer), Rajendra Pintar (app edukasi anak), Assets GMP (sistem manajemen aset). Scroll ke bagian Proyek di halaman ini buat lihat detail & demo live-nya.',
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

const nowStr = () => new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

export const ChatWidget: React.FC<ChatWidgetProps> = ({ darkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Halo! Saya asisten virtual Arzha 👋 Mau tanya soal apa?',
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
      : 'Halo, saya tertarik dengan jasa development Anda.';
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
                  Asisten Portofolio
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
        title="Tanya Asisten / Chat"
      >
        {isOpen ? <X className="w-5 h-5" /> : <MessageSquare className="w-5 h-5 font-bold" />}
      </button>
    </div>
  );
};