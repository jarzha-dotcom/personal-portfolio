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
  isAI?: boolean;
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
  { id: 'proses', label: '⏱️ Alur & Garansi' },
  { id: 'tech', label: '🛠️ Skill & Teknis' },
  { id: 'portfolio', label: '📂 Bukti Proyek' },
  { id: 'kontak', label: '📞 Kontak & Konsultasi' },
];

const FAQ_ITEMS: FAQItem[] = [
  // ── 💰 Harga & Paket ──
  {
    id: 'harga-landing',
    categoryId: 'harga',
    quickLabel: 'Harga landing page / profil?',
    keywords: ['harga landing page', 'biaya landing page', 'landing page berapa', 'halaman tunggal', 'company profile 1 halaman', 'web profil'],
    answer: 'Landing page (1 halaman responsif) mulai dari Rp800rb. Cocok buat UMKM, event, atau portofolio bisnis. Desain custom, cepat, dan mobile-friendly! 🎯',
  },
  {
    id: 'harga-webapp',
    categoryId: 'harga',
    quickLabel: 'Harga web app / dashboard?',
    keywords: ['harga web app', 'biaya dashboard', 'harga sistem internal', 'harga aplikasi web', 'web app berapa', 'sistem kasir', 'crm'],
    answer: 'Web app custom (dashboard admin, sistem manajemen inventaris, portal internal) mulai dari Rp6 juta, tergantung kompleksitas fitur dan database yang dibutuhkan.',
  },
  {
    id: 'harga-mobile',
    categoryId: 'harga',
    quickLabel: 'Harga aplikasi mobile?',
    keywords: ['harga aplikasi mobile', 'biaya bikin app', 'harga app android', 'harga aplikasi ios', 'mobile app berapa', 'bikin aplikasi hp'],
    answer: 'Aplikasi mobile custom (Android & iOS) mulai dari Rp6 juta. Dibangun pakai React Native / Expo sehingga performa kencang dan bisa langsung dua platform sekaligus.',
  },
  {
    id: 'harga-game',
    categoryId: 'harga',
    quickLabel: 'Harga pembuatan game?',
    keywords: ['harga game', 'biaya bikin game', 'harga platform multiplayer', 'game berapa', 'harga board game'],
    answer: 'Game / platform multiplayer realtime online mulai dari Rp12 juta. Backend menggunakan boardgame.io + WebSockets untuk sinkronisasi antar pemain tanpa lag.',
  },
  {
    id: 'harga-ecommerce',
    categoryId: 'harga',
    quickLabel: 'Bisa bikin toko online?',
    keywords: ['toko online', 'ecommerce', 'e-commerce', 'olshop', 'jual beli online', 'katalog produk'],
    answer: 'Bisa banget! Toko online custom tanpa potongan komisi marketplace. Bisa integrasi checkout via WhatsApp otomatis atau Payment Gateway otomatis (QRIS, VA, Kartu Kredit).',
  },
  {
    id: 'harga-promo',
    categoryId: 'harga',
    quickLabel: 'Ada promo apa sekarang?',
    keywords: ['promo', 'diskon', 'harga spesial', 'promo peluncuran', 'potongan harga'],
    answer: '🔥 Ada promo peluncuran khusus 5 klien pertama: Diskon 15% (jika bersedia jadi studi kasus portofolio), GRATIS technical support 1 bulan, dan tambahan 2x revisi mayor gratis!',
  },
  {
    id: 'objection-mahal',
    categoryId: 'harga',
    quickLabel: 'Budget terbatas, bisa nego?',
    keywords: ['mahal', 'kemahalan', 'kurang murah', 'bisa nego', 'budget minim', 'diskon dong', 'ada potongan', 'bisa cicil', 'uang pas-pasan'],
    answer: 'Bisa banget diobrolin kok kak! Fitur dan budget bisa kita sesuaikan. Kita bisa mulai dari versi MVP (fitur inti dulu) biar hemat biaya tapi bisnis kakak langsung bisa jalan 😊',
  },
  // ── ⏱️ Alur & Garansi ──
  {
    id: 'proses-durasi',
    categoryId: 'proses',
    quickLabel: 'Berapa lama pengerjaan?',
    keywords: ['berapa lama', 'durasi pengerjaan', 'estimasi waktu', 'lama proyek', 'timeline', 'bisa cepat'],
    answer: 'Estimasi standar: Landing page 1-2 minggu, Web App / Mobile App 3-6 minggu, Game 6-10 minggu. Kalau butuh timeline ekspres/mepet, bisa disepakati di awal konsultasi.',
  },
  {
    id: 'proses-alur',
    categoryId: 'proses',
    quickLabel: 'Gimana tahapan alur kerjanya?',
    keywords: ['alur kerja', 'proses kerja', 'tahapan proyek', 'cara kerja', 'workflow', 'step by step'],
    answer: 'Ada 4 tahap transparan: 1) Diskusi Kebutuhan & Desain, 2) Development & Coding, 3) Testing bareng klien, 4) Deployment & Serah Terima. Progres di-update rutin via WhatsApp.',
  },
  {
    id: 'proses-pembayaran',
    categoryId: 'proses',
    quickLabel: 'Sistem pembayarannya gimana?',
    keywords: ['pembayaran', 'dp', 'cicilan', 'bayar gimana', 'termin', 'sistem bayar', 'skema pembayaran'],
    answer: 'Sistemnya bertahap per milestone (DP awal, termin tengah saat fitur jadi, pelunasan saat rilis). Jadi Kakak lihat progres nyata dulu baru bayar. Aman & nol risiko!',
  },
  {
    id: 'proses-garansi',
    categoryId: 'proses',
    quickLabel: 'Ada garansi kalau ada bug?',
    keywords: ['garansi', 'bug', 'error', 'rusak', 'maintenance', 'support', 'after sales'],
    answer: 'Pasti ada! Setiap proyek dapat garansi technical support gratis 1 bulan pasca rilis. Kalau ada bug atau kendala teknis, Arzha beresin tuntas tanpa biaya tambahan.',
  },
  {
    id: 'proses-sourcecode',
    categoryId: 'proses',
    quickLabel: 'Source code dikasih ke klien?',
    keywords: ['source code', 'kodingan', 'repo', 'github', 'hak milik', 'milik siapa', 'dapet kodingan'],
    answer: '100% dikasih! Seluruh source code, repositori GitHub, dan aset project diserahkan penuh jadi hak milik Kakak tanpa biaya lisensi tersembunyi.',
  },
  {
    id: 'proses-hosting',
    categoryId: 'proses',
    quickLabel: 'Hosting & domain gimana?',
    keywords: ['hosting', 'domain', 'server', 'pasang web', 'deploy', 'cloud'],
    answer: 'Bisa dibantu setup sampai live! Mau pakai cloud modern hemat biaya (Vercel, Cloudflare, Supabase) atau server/hosting milik Kakak sendiri, semuanya siap dikonfigurasi.',
  },
  {
    id: 'objection-trust',
    categoryId: 'proses',
    quickLabel: 'Kenapa bisa percaya sama Arzha?',
    keywords: ['ga percaya', 'tidak percaya', 'ragu', 'takut ditipu', 'penipuan', 'aman ga', 'terpercaya', 'bukti kerja', 'ga mau', 'kabur'],
    answer: 'Hehe wajar banget kalau ragu di awal kak 😊 Arzha punya latar belakang internal audit korporat 7+ tahun yang terbiasa kerja disiplin dan berintegritas tinggi. Plus ada 3 proyek live nyata yang bisa dicoba langsung, dan sistem bayarnya bertahap (hasil kelihatan dulu baru bayar).',
  },
  // ── 🛠️ Skill & Teknis ──
  {
    id: 'tech-stack',
    categoryId: 'tech',
    quickLabel: 'Teknologi yang dipakai apa saja?',
    keywords: ['teknologi', 'tech stack', 'pakai bahasa apa', 'framework', 'react node', 'koding pake apa'],
    answer: 'Frontend: React, TypeScript, Tailwind CSS, Vite. Backend: Node.js, Supabase, PostgreSQL. Mobile: React Native, Expo. Game: boardgame.io, WebSockets. Cepat, modern, dan scalable!',
  },
  {
    id: 'tech-custom',
    categoryId: 'tech',
    quickLabel: 'Bisa request fitur khusus/custom?',
    keywords: ['bisa bikin seperti', 'custom request', 'fitur khusus', 'bisa nggak', 'request fitur'],
    answer: 'Sangat bisa! Mau integrasi API pihak ketiga, upload file, ekspor laporan Excel/PDF, sistem notifikasi WhatsApp, sampai dashboard analitik bisa dibuat sesuai kebutuhan.',
  },
  {
    id: 'tech-payment',
    categoryId: 'tech',
    quickLabel: 'Bisa pasang payment gateway?',
    keywords: ['payment gateway', 'midtrans', 'xendit', 'qris', 'bayar otomatis', 'transfer bank otomatis'],
    answer: 'Bisa banget! Arzha bisa integrasikan sistem pembayaran otomatis seperti Midtrans atau Xendit untuk terima QRIS, Virtual Account, dan kartu kredit secara realtime.',
  },
  {
    id: 'objection-keunggulan',
    categoryId: 'tech',
    quickLabel: 'Apa keunggulan jasa Arzha?',
    keywords: ['keunggulan', 'kelebihan', 'kenapa harus arzha', 'bedanya apa', 'keistimewaan'],
    answer: '3 poin unggulan: 1) Ketelitian & kedisiplinan audit korporat 7+ tahun (anti-ngilang), 2) Tech stack modern & kencang tanpa bloatware, 3) Pendampingan teknis ramah & garansi support 1 bulan.',
  },
  // ── 📂 Bukti Proyek ──
  {
    id: 'portfolio-proyek',
    categoryId: 'portfolio',
    quickLabel: 'Apa saja contoh proyek yang sudah rilis?',
    keywords: ['portfolio', 'contoh kerjaan', 'proyek apa aja', 'pernah bikin apa', 'demo', 'hasil karya'],
    answer: 'Ada 3 proyek live yang bisa dicoba langsung: 1) B-Games (game board multiplayer online), 2) Rajendra Pintar (app edukasi anak dwibahasa + suara TTS), 3) Assets GMP (sistem inventaris aset perusahaan). Cek demonya di bagian Proyek ya!',
  },
  {
    id: 'portfolio-bgames',
    categoryId: 'portfolio',
    quickLabel: 'Tentang proyek B-Games?',
    keywords: ['bgames', 'b-games', 'game multiplayer', 'ludo', 'ular tangga'],
    answer: 'B-Games adalah platform board game online realtime (Ludo, Ular Tangga, Tic Tac Toe) dengan room code multiplayer, chat room, dan matchmaking otomatis. Demo: bgames.byarzhaning.online',
  },
  {
    id: 'portfolio-rajendra',
    categoryId: 'portfolio',
    quickLabel: 'Tentang proyek Rajendra Pintar?',
    keywords: ['rajendra', 'rajendra pintar', 'edukasi anak', 'aplikasi anak', 'tts'],
    answer: 'Aplikasi belajar anak interaktif usia 4-8 tahun dengan suara Text-to-Speech dwibahasa (ID/EN), kuis tebak suara, dan animasi menarik. Demo: rajendrapintar.byarzhaning.online',
  },
  {
    id: 'portfolio-assets',
    categoryId: 'portfolio',
    quickLabel: 'Tentang proyek Assets GMP?',
    keywords: ['assets', 'assets gmp', 'manajemen aset', 'inventaris', 'sistem internal'],
    answer: 'Aplikasi internal perusahaan untuk tracking aset fisik, pencatatan mutasi barang, dan ekspor laporan inventaris otomatis ke Excel untuk audit. Demo: assets-gmp.vercel.app',
  },
  // ── 📞 Kontak & Konsultasi ──
  {
    id: 'kontak-wa',
    categoryId: 'kontak',
    quickLabel: 'Kontak WhatsApp & Email?',
    keywords: ['kontak', 'whatsapp', 'nomor hp', 'email', 'hubungi', 'wa'],
    answer: 'Bisa langsung hubungi WhatsApp di +6282312312734 atau email ke Jarzha@gmail.com. Mau tanya-tanya santai dulu atau langsung konsultasi ide proyek, siap dilayani!',
  },
  {
    id: 'kontak-konsultasi',
    categoryId: 'kontak',
    quickLabel: 'Konsultasi awal gratis gak?',
    keywords: ['konsultasi gratis', 'biaya konsultasi', 'tanya dulu', 'ngobrol dulu', 'bayar ga'],
    answer: '100% GRATIS! Kakak bisa curhat kebutuhan sistem, minta estimasi timeline, atau tanya-tanya budget tanpa ada kewajiban order apa pun kok',
  },
  {
    id: 'kontak-availability',
    categoryId: 'kontak',
    quickLabel: 'Masih buka untuk proyek baru?',
    keywords: ['masih buka', 'terima proyek', 'available', 'slot kosong', 'lagi kosong gak'],
    answer: 'Masih buka untuk proyek baru! Apalagi ada promo peluncuran potongan 15% buat klien awal. Yuk amankan slot kakak sebelum kuotanya habis!',
  },
];

const fuse = new Fuse(FAQ_ITEMS, {
  keys: [
    { name: 'quickLabel', weight: 0.5 },
    { name: 'keywords', weight: 0.4 },
    { name: 'answer', weight: 0.1 },
  ],
  threshold: 0.45,
  ignoreLocation: true,
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
const nowStr = () => new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

/** Estimate typing delay from response length (80ms/char, min 800ms, max 2500ms) */
const typingDelay = (text: string) =>
  Math.min(2500, Math.max(800, Math.round((text.length * 80) / 10)));

const WELCOME_OPTIONS: QuickOption[] = CATEGORIES.map((c) => ({ id: c.id, label: c.label }));

// ── Component ───────────────────────────────────────────────────────────────
export const ChatWidget: React.FC<ChatWidgetProps> = ({ darkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [aiMode, setAiMode] = useState<'ai' | 'fallback' | 'unknown'>('unknown');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Halo! Saya Zannah, asisten Arzha 👋 Mau nanya soal apa? Pilih kategori atau langsung ketik aja!',
      timestamp: nowStr(),
      options: WELCOME_OPTIONS,
      isAI: true,
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastQueryRef = useRef<string>('');

  // Rate limiting refs
  const lastRequestTimeRef = useRef<number>(0);
  const REQUEST_COOLDOWN = 12000; // 12 seconds between requests (safe for 5 RPM limit)

  // Gemini conversation history (exclude welcome msg)
  const geminiHistoryRef = useRef<ChatMessage[]>([]);

  // ⚠️ Cleanup setTimeout untuk mencegah memory leak saat unmount
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, []);

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
    const id = setTimeout(() => {
      setIsTyping(false);
      appendBotMessage(faq.answer, standardCTA, false);
    }, typingDelay(faq.answer));
    timeoutsRef.current.push(id);
  };

  const respondWithFallback = () => {
    setIsTyping(true);
    const text =
      '📋 [Radit - Standby Bot]\nHalo kak! Saya Radit (asisten direktori cepat pengganti Zannah). Karena saya model sederhana non-AI, saya belum punya data persis untuk pertanyaan ini. Tapi Kakak bisa klik topik di bawah atau langsung tanya santai ke WhatsApp Arzha ya 👇';
    const id = setTimeout(() => {
      setIsTyping(false);
      appendBotMessage(
        text,
        [
          { id: 'menu', label: '📂 Buka Menu Topik' },
          { id: 'whatsapp', label: '💬 Chat via WhatsApp' },
        ],
        false,
      );
    }, typingDelay(text));
    timeoutsRef.current.push(id);
  };

  // AI (Gemini) response — with automatic Radit fallback & Cooldown
  const respondWithAI = async (userText: string) => {
    setIsTyping(true);

    // ── Cooldown / Rate Limiting Check ──
    const now = Date.now();
    if (now - lastRequestTimeRef.current < REQUEST_COOLDOWN) {
      console.warn('[ChatWidget] Cooldown active, falling back to Radit.');
      setAiMode('fallback');
      const results = fuse.search(userText);
      const id = setTimeout(() => {
        setIsTyping(false);
        if (results.length > 0) {
          appendBotMessage(`📋 [Radit - Standby Bot]\n${results[0].item.answer}`, standardCTA, false);
        } else {
          respondWithFallback();
        }
      }, 600);
      timeoutsRef.current.push(id);
      return;
    }
    lastRequestTimeRef.current = now;
    // ──────────────────────────────────

    const userMsg: ChatMessage = { role: 'user', parts: [{ text: userText }] };
    try {
      const result = await sendMessageToGemini(geminiHistoryRef.current, userText);
      const replyText = result.reply;

      // Update history with successful exchange
      geminiHistoryRef.current = [
        ...geminiHistoryRef.current,
        userMsg,
        { role: 'model', parts: [{ text: replyText }] },
      ].slice(-12); // keep last 6 exchanges

      setAiMode('ai');
      const delay = typingDelay(replyText);
      const id = setTimeout(() => {
        setIsTyping(false);
        appendBotMessage(replyText, standardCTA, true);
      }, delay);
      timeoutsRef.current.push(id);
    } catch (err: unknown) {
      // ── Graceful degradation: fall to Radit (Directory Model) ──────────
      console.warn('[ChatWidget] Zannah AI unavailable, falling back to Radit:', err);
      setAiMode('fallback');
      const results = fuse.search(userText);
      if (results.length > 0) {
        const id = setTimeout(() => {
          setIsTyping(false);
          appendBotMessage(
            `📋 [Radit - Standby Bot]\n${results[0].item.answer}`,
            standardCTA,
            false,
          );
        }, typingDelay(results[0].item.answer));
        timeoutsRef.current.push(id);
      } else {
        const id = setTimeout(() => {
          setIsTyping(false);
          respondWithFallback();
        }, 600);
        timeoutsRef.current.push(id);
      }
    }
  };

  // ── Category / quick-option flow ──────────────────────────────────────────
  const showCategoryMenu = () => {
    setIsTyping(true);
    const id = setTimeout(() => {
      setIsTyping(false);
      appendBotMessage('Mau tanya soal apa lagi?', WELCOME_OPTIONS);
    }, 400);
    timeoutsRef.current.push(id);
  };

  const showCategoryQuestions = (category: Category) => {
    const items = FAQ_ITEMS.filter((f) => f.categoryId === category.id);
    setIsTyping(true);
    const id = setTimeout(() => {
      setIsTyping(false);
      appendBotMessage(
        `Pilih pertanyaan seputar ${category.label.replace(/^\S+\s/, '')}:`,
        [
          ...items.map((f) => ({ id: f.id, label: f.quickLabel })),
          { id: 'menu', label: '⬅️ Menu Utama' },
        ],
      );
    }, 400);
    timeoutsRef.current.push(id);
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
      respondWithFAQ(faq);
      return;
    }
    respondWithAI(label);
  };

  const sendMessage = (text: string) => {
    if (!text.trim() || isTyping) return;
    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, sender: 'user', text, timestamp: nowStr() },
    ]);
    lastQueryRef.current = text;
    setInputValue('');
    if (aiMode === 'fallback') {
      const results = fuse.search(text);
      if (results.length > 0) {
        respondWithFAQ(results[0].item);
      } else {
        respondWithFallback();
      }
    } else {
      respondWithAI(text);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!isTyping) {
        sendMessage(inputValue);
      }
    }
  };

  // ── Mode badge ─────────────────────────────────────────────────────────────
  const ModeBadge = () => {
    if (aiMode === 'unknown') return null;
    const isAI = aiMode === 'ai';
    return (
      <span
        className={`flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full font-medium ${isAI
            ? darkMode
              ? 'bg-teal-900/60 text-teal-400'
              : 'bg-teal-50 text-teal-600'
            : darkMode
              ? 'bg-amber-900/50 text-amber-300'
              : 'bg-amber-50 text-amber-700'
          }`}
        title={isAI ? 'Zannah AI aktif' : 'Radit standby (Model direktori non-AI)'}
      >
        {isAI ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
        {isAI ? ' Zannah (AI)' : '📋 Radit (Non-AI)'}
      </span>
    );
  };

  // ─ Render ─────────────────────────────────────────────────────────────────
  const isRadit = aiMode === 'fallback';

  return (
    <div className="fixed bottom-6 left-6 z-50 no-print">
      {isOpen && (
        <div
          className={`w-80 sm:w-96 h-[480px] rounded-2xl shadow-2xl border flex flex-col mb-3 overflow-hidden transition-all ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
            }`}
        >
          {/* Header */}
          <div
            className={`p-3.5 flex items-center justify-between border-b ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div
                  className={`w-9 h-9 rounded-full text-white flex items-center justify-center text-xs font-bold shadow-md transition-all ${isRadit
                      ? 'bg-gradient-to-br from-amber-500 to-amber-700'
                      : 'bg-gradient-to-br from-teal-500 to-teal-700'
                    }`}
                >
                  {isRadit ? 'RD' : 'ZA'}
                </div>
                {/* Online dot */}
                <span
                  className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-800 ${isRadit ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p
                    className={`text-xs font-bold leading-none ${darkMode ? 'text-white' : 'text-slate-900'
                      }`}
                  >
                    {isRadit ? 'Radit' : 'Zannah'}
                  </p>
                  <ModeBadge />
                </div>
                <p
                  className={`text-[10px] mt-0.5 flex items-center gap-1 ${isRadit
                      ? darkMode
                        ? 'text-amber-400 font-medium'
                        : 'text-amber-600 font-medium'
                      : darkMode
                        ? 'text-slate-400'
                        : 'text-slate-500'
                    }`}
                >
                  {isRadit ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block animate-pulse" />
                      Model Direktori • Backup Zannah
                    </>
                  ) : (
                    'Asisten Arzha • AI Live'
                  )}
                </p>
              </div>
            </div>
            <button
              aria-label="Tutup chat"
              onClick={() => setIsOpen(false)}
              className={`p-1.5 rounded-lg transition-colors ${darkMode
                  ? 'text-slate-400 hover:text-white hover:bg-slate-700'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Fallback Notice Banner */}
          {isRadit && (
            <div
              className={`px-3 py-1.5 flex items-center justify-between text-[10px] border-b transition-all ${darkMode
                  ? 'bg-amber-950/40 border-amber-900/50 text-amber-300'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-xs">📋</span>
                <span>
                  <b>Radit (Non-AI) standby:</b> Zannah lagi istirahat kuota, Radit bantu via direktori ya!
                </span>
              </div>
            </div>
          )}

          {/* Messages Body */}
          <div
            className={`flex-1 p-3.5 overflow-y-auto space-y-3 text-xs ${darkMode ? 'bg-slate-900' : 'bg-slate-50'
              }`}
          >
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'bot' && (
                  <div
                    className={`w-6 h-6 rounded-full text-white flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold ${m.isAI === false
                        ? 'bg-gradient-to-br from-amber-500 to-amber-700'
                        : 'bg-gradient-to-br from-teal-500 to-teal-700'
                      }`}
                    title={m.isAI === false ? 'Radit (Model Direktori)' : 'Zannah (AI)'}
                  >
                    {m.isAI === false ? 'RD' : 'ZA'}
                  </div>
                )}
                <div className="max-w-[85%] flex flex-col gap-1.5">
                  <div
                    className={`px-3 py-2 rounded-xl leading-relaxed ${m.sender === 'user'
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
                          className={`text-[10.5px] px-2.5 py-1.5 rounded-full border font-medium transition-all active:scale-95 ${opt.id === 'whatsapp'
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
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'
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
                <div
                  className={`w-6 h-6 rounded-full text-white flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold ${isRadit
                      ? 'bg-gradient-to-br from-amber-500 to-amber-700'
                      : 'bg-gradient-to-br from-teal-500 to-teal-700'
                    }`}
                >
                  {isRadit ? 'RD' : 'ZA'}
                </div>
                <div
                  className={`px-3.5 py-2.5 rounded-xl rounded-bl-none flex items-center gap-1 ${darkMode
                      ? 'bg-slate-800 border border-slate-700'
                      : 'bg-white border border-slate-200 shadow-sm'
                    }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full animate-bounce ${isRadit ? 'bg-amber-400' : 'bg-teal-400'
                      }`}
                    style={{ animationDelay: '0ms' }}
                  />
                  <span
                    className={`w-1.5 h-1.5 rounded-full animate-bounce ${isRadit ? 'bg-amber-400' : 'bg-teal-400'
                      }`}
                    style={{ animationDelay: '150ms' }}
                  />
                  <span
                    className={`w-1.5 h-1.5 rounded-full animate-bounce ${isRadit ? 'bg-amber-400' : 'bg-teal-400'
                      }`}
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div
            className={`p-2.5 border-t flex items-center gap-2 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
              }`}
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isRadit ? 'Tanya Radit (katalog direktori)...' : 'Tanya Zannah sesuatu...'}
              className={`flex-1 px-3 py-2 rounded-lg text-xs border focus:outline-none focus:ring-2 focus:ring-teal-500 ${darkMode
                  ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
            />
            <button
              aria-label="Kirim pesan"
              onClick={() => sendMessage(inputValue)}
              disabled={!inputValue.trim() || isTyping}
              className={`w-8 h-8 rounded-lg text-white flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${isRadit ? 'bg-amber-600 hover:bg-amber-700' : 'bg-teal-600 hover:bg-teal-700'
                }`}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        aria-label={isOpen ? 'Tutup chat widget' : 'Buka chat widget'}
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center shadow-xl shadow-amber-500/25 transition-all hover:scale-105 active:scale-95 border-2 border-slate-900"
        title={isRadit ? 'Chat dengan Radit (Standby Bot)' : 'Chat dengan Zannah (AI)'}
      >
        {isOpen ? <X className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
      </button>
    </div>
  );
};