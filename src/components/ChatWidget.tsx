import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageSquare, X, Send, User, Wifi, WifiOff, Mic, Volume2, Square, Loader2, ExternalLink, MessageCircle, Paperclip, FileText, Download, Plus, History, Trash2, Share2 } from 'lucide-react';
import Fuse from 'fuse.js';
import { Portal } from './Portal';
import { CONTACT_INFO } from '../data/portfolioData';
import { sendMessageToGemini, ChatMessage, Attachment, OutgoingFile, AgentIntentAction } from '../services/geminiService';
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
import { downloadChatSummaryFile, shareChatSummaryFile, canShareChatSummary } from '../utils/chatSummaryGenerator';

const ZANNAH_LOADING_STATUSES = [
  'Menyiapkan respon...',
  'Menganalisis kebutuhan Kakak...',
  'Menyusun rekomendasi solutif...',
  'Menyempurnakan detail jawaban...',
];

// Status khusus saat Antigravity Agent lagi jalan (dipicu opt-in lewat tombol
// aksi agent — estimasi biaya, riset pasar, analisis file). Lebih jujur soal
// prosesnya lebih berat & makan waktu lebih lama dari balasan teks biasa.
const AGENT_LOADING_STATUSES = [
  '🤖 Menjalankan AI Agent...',
  '🔎 Mengumpulkan & menyusun data...',
  '📊 Menyiapkan file hasil kerja...',
  '✍️ Merangkum hasil analisis...',
];

interface ChatWidgetProps {
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
  /** File yang di-upload user bareng pesan ini (buat ditampilkan sbg thumbnail) */
  uploadedFiles?: PendingFile[];
  /** File hasil kerja Antigravity yang bisa didownload (mis. RAB.xlsx, laporan.pdf) */
  attachments?: Attachment[];
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

const buildWelcomeMessage = (): Message => ({
  id: 'welcome',
  sender: 'bot',
  text: 'Halo! Saya Zannah, asisten Arzha 👋 Mau nanya soal apa? Pilih kategori atau langsung ketik aja!',
  timestamp: nowStr(),
  options: WELCOME_OPTIONS,
  isAI: true,
});

const generateMessageId = (prefix = 'msg'): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

const MAX_DISPLAY_MESSAGES = 50;

// Dipindah ke luar ChatWidget: sebelumnya didefinisikan ulang di setiap
// render sebagai komponen baru, yang membuat React selalu remount elemen
// ini alih-alih update biasa (nggak fatal karena tidak ada state internal,
// tapi tetap bukan best practice).
const ModeBadge: React.FC<{ aiMode: 'ai' | 'fallback' | 'unknown'; darkMode: boolean }> = ({
  aiMode,
  darkMode,
}) => {
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

// ── Component ───────────────────────────────────────────────────────────────
export const ChatWidget: React.FC<ChatWidgetProps> = ({ darkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  // True selama request yang sedang berjalan dipicu lewat tombol aksi AI
  // Agent (opt-in) — dipakai buat nunjukkin status loading yang lebih jujur
  // ("menjalankan agent...") dibanding status generik balasan teks biasa.
  const [isAgentBusy, setIsAgentBusy] = useState(false);
  const [downloadSummarySuccess, setDownloadSummarySuccess] = useState(false);
  const [shareSummaryState, setShareSummaryState] = useState<'idle' | 'sharing' | 'shared' | 'error'>('idle');
  // Dicek sekali per mount (bukan tiap render) — kapabilitas Web Share API
  // (File sharing) gak berubah selama sesi browser berjalan.
  const [canShareSummary] = useState<boolean>(() => canShareChatSummary());
  const [aiMode, setAiMode] = useState<'ai' | 'fallback' | 'unknown'>('unknown');
  const [activeModel, setActiveModel] = useState<string>('');
  const isRadit = aiMode === 'fallback';

  useEffect(() => {
    if (!isTyping) {
      setLoadingTextIndex(0);
      return;
    }
    const statusCount = isAgentBusy ? AGENT_LOADING_STATUSES.length : ZANNAH_LOADING_STATUSES.length;
    const interval = setInterval(() => {
      setLoadingTextIndex((prev) => (prev + 1) % statusCount);
    }, 2200);
    return () => clearInterval(interval);
  }, [isTyping, isAgentBusy]);

  // Inisialisasi messages dengan welcome msg dulu (sinkron); isi asli
  // percakapan yang tersimpan dimuat belakangan dari IndexedDB (async) lewat
  // effect di bawah, karena IndexedDB nggak bisa dibaca secara sinkron.
  const [messages, setMessages] = useState<Message[]>(() => [buildWelcomeMessage()]);
  // id percakapan yang lagi aktif di IndexedDB. null selama proses load awal
  // berlangsung — dipakai buat menahan auto-save biar nggak menimpa data
  // tersimpan dengan welcome msg kosong sebelum load selesai.
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isStorageReady, setIsStorageReady] = useState(false);
  // Jendela riwayat percakapan (dibuka lewat klik avatar bot)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyList, setHistoryList] = useState<StoredConversation<Message>[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastQueryRef = useRef<string>('');
  // File terakhir yang diupload user (kalau ada) — dipakai buat tombol aksi
  // "Analisis Lebih Dalam pakai AI Agent" yang perlu ngirim ulang file yang
  // sama tanpa user harus upload lagi.
  const lastFilesRef = useRef<OutgoingFile[] | undefined>(undefined);

  // Helper terpusat untuk menambah pesan baru ke state, sekaligus menjaga
  // batas MAX_DISPLAY_MESSAGES. Sebelumnya pola
  // `prev.slice(-(MAX_DISPLAY_MESSAGES - 1))` diulang manual di banyak
  // tempat — riskan lupa di-trim kalau ada penambahan fitur baru nanti.
  const pushMessage = (message: Message) => {
    setMessages((prev) => [...prev.slice(-(MAX_DISPLAY_MESSAGES - 1)), message]);
  };

  const handleDownloadSummary = () => {
    const botName = isRadit ? 'Radit' : 'Zannah';
    const ok = downloadChatSummaryFile(messages, botName);
    if (ok) {
      setDownloadSummarySuccess(true);
      setTimeout(() => setDownloadSummarySuccess(false), 3000);
    }
  };

  // Share rangkuman langsung ke WhatsApp (atau target lain) lewat native
  // share-sheet HP — cuma tersedia kalau browser dukung File di Web Share API
  // (lihat canShareChatSummary()). Kalau ternyata gagal/unsupported pas
  // dipanggil (mis. env berubah), fallback diam-diam ke download biasa.
  const handleShareSummary = async () => {
    const botName = isRadit ? 'Radit' : 'Zannah';
    setShareSummaryState('sharing');
    const result = await shareChatSummaryFile(messages, botName);
    if (result === 'shared') {
      setShareSummaryState('shared');
      setTimeout(() => setShareSummaryState('idle'), 3000);
    } else if (result === 'cancelled') {
      setShareSummaryState('idle');
    } else {
      // 'unsupported' atau 'error' — fallback ke download manual biar user
      // tetap dapet filenya walau share-sheet gagal/gak didukung.
      setShareSummaryState('idle');
      handleDownloadSummary();
    }
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

  // Trigger download langsung dari base64 (gak butuh storage eksternal sama
  // sekali — file dari sandbox Antigravity dikirim base64 lewat chat.ts,
  // browser yang bikin file-nya jadi nyata lewat Blob + <a download>).
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

  // Tipe file yang diizinkan didownload lewat data: URI di teks pesan AI.
  // Dibatasi ke tipe "aman" (bukan executable/script) — konten dari backend
  // sendiri, tapi tetap dijaga in case suatu saat model ngasih mime aneh.
  const ALLOWED_DATA_URI_MIME_TYPES = ['text/html', 'text/plain', 'text/csv', 'application/json', 'image/svg+xml', 'application/pdf'];

  const extensionForMime = (mime: string): string => {
    const map: Record<string, string> = {
      'text/html': 'html',
      'text/plain': 'txt',
      'text/csv': 'csv',
      'application/json': 'json',
      'image/svg+xml': 'svg',
      'application/pdf': 'pdf',
    };
    return map[mime] || 'txt';
  };

  const parseDataUri = (uri: string): { mimeType: string; isBase64: boolean; content: string } | null => {
    const m = uri.match(/^data:([^,]*),([\s\S]*)$/);
    if (!m) return null;
    const meta = m[1] || '';
    const content = m[2] || '';
    const isBase64 = /;base64$/i.test(meta);
    const mimeType = (meta.replace(/;base64$/i, '').split(';')[0] || 'text/plain').trim() || 'text/plain';
    return { mimeType, isBase64, content };
  };

  // Trigger download dari data: URI yang muncul di teks balasan AI (mis.
  // '[Klik di Sini](data:text/html;charset=utf-8,...)'). Didekode & dibikin
  // Blob asli, bukan langsung href=data:..., karena banyak browser mobile
  // nggak konsisten nge-download data: URI raw yang panjang lewat klik link.
  const downloadFromDataUri = (label: string, dataUri: string) => {
    try {
      const parsed = parseDataUri(dataUri);
      if (!parsed) throw new Error('Format data URI tidak valid');
      if (!ALLOWED_DATA_URI_MIME_TYPES.includes(parsed.mimeType)) {
        console.warn('[ChatWidget] Tipe file dari data URI tidak diizinkan:', parsed.mimeType);
        return;
      }
      let blob: Blob;
      if (parsed.isBase64) {
        const byteChars = atob(parsed.content);
        const byteNumbers = new Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
        blob = new Blob([new Uint8Array(byteNumbers)], { type: parsed.mimeType });
      } else {
        blob = new Blob([decodeURIComponent(parsed.content)], { type: parsed.mimeType });
      }
      const cleanLabel = label.replace(/[\\/:*?"<>|]/g, '').trim() || 'file';
      const hasExt = /\.[a-zA-Z0-9]{1,5}$/.test(cleanLabel);
      const filename = hasExt ? cleanLabel : `${cleanLabel}.${extensionForMime(parsed.mimeType)}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (err) {
      console.error('Gagal download file dari data URI:', err);
    }
  };

  // ── Voice Chat: STT + TTS lewat hook bersama (lihat hooks/useVoiceChat.ts) ──
  const { isListening, speakingId, loadingSpeakId, voiceSupport, handleMicClick: micToggle, handleToggleSpeak } =
    useVoiceChat({ logLabel: 'ChatWidget' });
  // Kalau hasil final STT datang saat bot masih mengetik, teks ditampung di
  // sini dulu dan otomatis dikirim begitu bot selesai (lihat effect di bawah),
  // bukan langsung dibuang diam-diam seperti sebelumnya.
  const pendingVoiceTextRef = useRef<string | null>(null);

  // Rate limiting refs
  const lastRequestTimeRef = useRef<number>(0);
  const REQUEST_COOLDOWN = 12000; // 12 seconds between requests (safe for 5 RPM limit)

  // Gemini conversation history (exclude welcome msg). Mulai kosong lalu
  // diisi oleh effect pemuatan awal dari IndexedDB (lihat effect di bawah)
  // begitu percakapan aktif berhasil dimuat.
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
      const id = await getActiveConversationId('zannah');
      const conv = await loadConversation<Message, ChatMessage>(id);
      if (cancelled) return;

      if (conv && conv.messages.length > 0) {
        setMessages(conv.messages.slice(-MAX_DISPLAY_MESSAGES));
        // Penting: history Gemini di-slice(-12) lagi di sini, sama seperti
        // batas yang dipakai tiap kali kirim pesan — jadi begitu percakapan
        // lama dibuka lagi, AI tetap "ingat" konteksnya, bukan mulai kosong.
        geminiHistoryRef.current = (conv.geminiHistory ?? []).slice(-12);
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
    const created = await createConversation<Message>('zannah', [welcome]);
    geminiHistoryRef.current = [];
    setMessages([welcome]);
    setConversationId(created.id);
    setAiMode('unknown');
    resetComposer();
    setIsHistoryOpen(false);
  }, [resetComposer]);

  /** Buka salah satu percakapan lama dari daftar riwayat. */
  const openConversationById = useCallback(async (id: string) => {
    const conv = await loadConversation<Message, ChatMessage>(id);
    if (!conv) return;
    setMessages(conv.messages.length > 0 ? conv.messages.slice(-MAX_DISPLAY_MESSAGES) : [buildWelcomeMessage()]);
    // Sama seperti saat load awal: slice(-12) supaya AI tetap ingat konteks
    // obrolan lama ini, bukan dianggap chat baru.
    geminiHistoryRef.current = (conv.geminiHistory ?? []).slice(-12);
    setConversationId(id);
    await setActiveConversationId('zannah', id);
    resetComposer();
    setIsHistoryOpen(false);
  }, [resetComposer]);

  /** Buka jendela riwayat & muat daftar percakapan tersimpan. */
  const openHistoryPanel = useCallback(async () => {
    setIsHistoryOpen(true);
    setIsHistoryLoading(true);
    const list = await listConversations<Message>('zannah');
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
        // Kalau yang dihapus adalah percakapan yang lagi aktif, mulai baru.
        await startNewChat();
      }
    },
    [conversationId, startNewChat]
  );

  // ⚠️ Cleanup setTimeout untuk mencegah memory leak saat unmount
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const streamText = useStreamingText();

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
      saveConversation<Message, ChatMessage>(conversationId, 'zannah', {
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

  const openWhatsApp = useCallback(() => {
    const context = lastQueryRef.current
      ? `Halo Arzha, saya ingin tanya soal: ${lastQueryRef.current}`
      : 'Halo Arzha, saya tertarik dengan jasa development kamu.';
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(context)}`, '_blank');
  }, [cleanPhone]);

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
      handleToggleSpeak(msgId, text, !isAI ? BOT_VOICES.RADIT : BOT_VOICES.ZANNAH);
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
      onStart: autoSpeak ? () => handleToggleSpeak(msgId, fullText, !isAI ? BOT_VOICES.RADIT : BOT_VOICES.ZANNAH) : undefined,
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

  // `AgentIntentAction` diimpor dari geminiService.ts — dipakai buat
  // highlight/dahulukan tombol yang relevan berdasarkan saran heuristic
  // backend (suggestedAgentAction), BUKAN buat auto-invoke Antigravity.
  // Backend sudah tidak pernah memanggil Antigravity sendiri berdasar
  // heuristic ini; user tetap yang klik tombol.
  const buildAgentCTA = (hasRecentFiles: boolean, highlight?: AgentIntentAction | null): QuickOption[] => {
    const opts: QuickOption[] = [
      { id: 'agent_estimate', label: '📊 Buatkan Estimasi Biaya & Timeline' },
      { id: 'agent_research', label: '🔎 Riset Kompetitor/Pasar Singkat' },
    ];
    if (hasRecentFiles) {
      opts.push({ id: 'agent_file_analysis', label: '📈 Analisis Lebih Dalam pakai AI Agent' });
    }
    if (!highlight) return opts;

    // Zannah cuma punya 3 tombol agent (estimate/research/file_analysis) —
    // 'live_demo' itu saran khusus buat Rajendra (showcase) yang gak punya
    // padanan tombol di sini, jadi diabaikan aja kalau kebetulan muncul.
    const highlightId =
      highlight === 'estimate' ? 'agent_estimate' : highlight === 'research' ? 'agent_research' : highlight === 'file_analysis' ? 'agent_file_analysis' : null;
    if (!highlightId) return opts;

    // Tandai & dahulukan tombol yang paling relevan sama konteks obrolan
    // barusan — ini bagian "wow, AI-nya ngerti" tanpa perlu bakar kuota
    // Antigravity secara diam-diam buat ngedeteksinya.
    return [...opts]
      .sort((a, b) => (a.id === highlightId ? -1 : b.id === highlightId ? 1 : 0))
      .map((o) => (o.id === highlightId ? { ...o, label: `⭐ ${o.label}` } : o));
  };

  // Opsi cepat (quick reply) yang ditampilkan di bawah tiap balasan Zannah AI.
  // Aksi AI Agent SENGAJA berupa tombol opt-in (bukan auto-trigger) — biar
  // user yang memutuskan kapan mau pakai kemampuan yang lebih "berat" & makan
  // kuota Antigravity (100 RPD), bukan heuristic yang nebak-nebak sendiri.
  const standardCTA = (hasRecentFiles: boolean, highlight?: AgentIntentAction | null): QuickOption[] => [
    ...buildAgentCTA(hasRecentFiles, highlight),
    { id: 'menu', label: '⬅️ Menu Utama' },
    { id: 'whatsapp', label: '💬 Chat via WhatsApp' },
  ];

  const raditCTA: QuickOption[] = [
    { id: 'retry_zannah', label: '✨ Coba Panggil Zannah Lagi' },
    { id: 'menu', label: '📂 Buka Menu Topik' },
    { id: 'whatsapp', label: '💬 Chat via WhatsApp' },
  ];

  // FAQ fallback response
  const respondWithFAQ = (faq: FAQItem, isFromVoice = false) => {
    setIsTyping(true);
    const id = setTimeout(() => {
      setIsTyping(false);
      appendBotMessage(faq.answer, raditCTA, false, isFromVoice);
    }, typingDelay(faq.answer));
    timeoutsRef.current.push(id);
  };

  const respondWithFallback = (isFromVoice = false) => {
    setIsTyping(true);
    const text =
      '📋 [Radit - Standby Bot]\nHalo kak! Saya Radit (asisten direktori cepat pengganti Zannah). Karena saya model sederhana non-AI, saya belum punya data persis untuk pertanyaan ini. Tapi Kakak bisa coba panggil Zannah lagi atau langsung tanya santai ke WhatsApp Arzha ya 👇';
    const id = setTimeout(() => {
      setIsTyping(false);
      appendBotMessage(
        text,
        raditCTA,
        false,
        isFromVoice,
      );
    }, typingDelay(text));
    timeoutsRef.current.push(id);
  };

  // AI (Gemini) response — with automatic Radit fallback & Cooldown.
  // `agentMode = true` dipakai KHUSUS oleh tombol aksi AI Agent opt-in
  // (estimasi biaya, riset pasar, analisis file) — bukan trigger otomatis.
  const respondWithAI = async (userText: string, isFromVoice = false, files?: OutgoingFile[], agentMode = false) => {
    setIsTyping(true);
    setIsAgentBusy(agentMode);

    // ── Cooldown / Rate Limiting Check ──
    const now = Date.now();
    if (now - lastRequestTimeRef.current < REQUEST_COOLDOWN) {
      console.warn('[ChatWidget] Cooldown active, falling back to Radit.');
      setAiMode('fallback');
      setIsAgentBusy(false);
      const results = fuse.search(userText);
      const id = setTimeout(() => {
        setIsTyping(false);
        if (results.length > 0) {
          appendBotMessage(`📋 [Radit - Standby Bot]\n${results[0].item.answer}`, raditCTA, false, isFromVoice);
        } else {
          respondWithFallback(isFromVoice);
        }
      }, 600);
      timeoutsRef.current.push(id);
      return;
    }
    lastRequestTimeRef.current = now;
    // Catatan: cooldown sengaja "direservasi" di sini, SEBELUM await ke API,
    // bukan cuma setelah sukses. Ini disengaja — tujuannya menahan laju
    // permintaan (anti-hammering) terlepas dari hasil request itu nanti
    // sukses atau gagal, bukan cuma membatasi request yang berhasil saja.
    // ──────────────────────────────────

    const userMsg: ChatMessage = { role: 'user', parts: [{ text: userText }] };
    try {
      const result = await sendMessageToGemini(geminiHistoryRef.current, userText, undefined, undefined, agentMode || undefined, files);
      const replyText = result.reply;

      // Simpan model yang aktif untuk ditampilkan di UI
      if (result.model) setActiveModel(result.model);

      // Update history with successful exchange
      geminiHistoryRef.current = [
        ...geminiHistoryRef.current,
        userMsg,
        { role: 'model', parts: [{ text: replyText }] },
      ].slice(-12); // keep last 6 exchanges

      // Persist Gemini history ke IndexedDB, terikat ke percakapan yang lagi
      // aktif — jadi kalau percakapan ini dibuka lagi nanti, AI tetap ingat.
      if (conversationId) {
        saveConversation<Message, ChatMessage>(conversationId, 'zannah', {
          geminiHistory: geminiHistoryRef.current,
        });
      }
      setAiMode('ai');
      setIsTyping(false);
      setIsAgentBusy(false);
      // `result.suggestedAgentAction` datang dari heuristic backend (lihat
      // detectAgentIntent di chat.ts) — dipakai buat highlight tombol agent
      // yang relevan, TANPA memanggil Antigravity secara otomatis. Kalau
      // balasan ini justru hasil Antigravity (agentMode manual), backend
      // tidak pernah menyertakan field ini, jadi tombol tampil normal.
      streamBotMessage(
        replyText,
        standardCTA(!!lastFilesRef.current, result.suggestedAgentAction),
        true,
        isFromVoice,
        result.attachments
      );
    } catch (err: unknown) {
      // ── Graceful degradation: fall to Radit (Directory Model) ──────────
      console.warn('[ChatWidget] Zannah AI unavailable, falling back to Radit:', err);
      setAiMode('fallback');
      setIsAgentBusy(false);
      const results = fuse.search(userText);
      if (results.length > 0) {
        const id = setTimeout(() => {
          setIsTyping(false);
          appendBotMessage(
            `📋 [Radit - Standby Bot]\n${results[0].item.answer}`,
            raditCTA,
            false,
            isFromVoice,
          );
        }, typingDelay(results[0].item.answer));
        timeoutsRef.current.push(id);
      } else {
        const id = setTimeout(() => {
          setIsTyping(false);
          respondWithFallback(isFromVoice);
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
      pushMessage({
        id: generateMessageId('bot'),
        sender: 'bot',
        text: 'Lanjut ke topik berikutnya? Pilih di bawah ya! 👇',
        timestamp: nowStr(),
        options: CATEGORIES.map((c) => ({ id: c.id, label: c.label })),
        isAI: false,
      });
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
    if (id === 'retry_zannah') {
      setAiMode('ai');
      if (lastQueryRef.current) {
        pushUserMessage(`✨ Coba tanya Zannah: "${lastQueryRef.current}"`);
        respondWithAI(lastQueryRef.current);
      } else {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          appendBotMessage(
            'Hai Kak! Zannah sudah siap bantu diskusi lagi nih 😊 Ada ide proyek atau hal yang mau ditanyakan?',
            standardCTA(!!lastFilesRef.current),
            true,
          );
        }, 400);
      }
      return;
    }

    // ── Aksi AI Agent (opt-in, dipicu tombol) ────────────────────────────
    // Ketiganya sengaja pakai agentMode=true secara EKSPLISIT (bukan
    // mengandalkan heuristic AGENT_TRIGGER_PATTERNS di backend) — user yang
    // memilih kapan mau pakai kemampuan Antigravity yang lebih berat & makan
    // kuota (100 RPD), bukan sistem yang nebak sendiri.
    if (id === 'agent_estimate') {
      const prompt =
        'Tolong buatkan estimasi biaya, breakdown item pekerjaan, dan timeline pengerjaan yang realistis untuk proyek yang barusan kita diskusikan, dalam bentuk file yang bisa saya unduh.';
      pushUserMessage(label);
      respondWithAI(prompt, false, undefined, true);
      return;
    }
    if (id === 'agent_research') {
      const prompt =
        'Tolong lakukan riset singkat mengenai kompetitor atau tren pasar yang relevan dengan topik/ide proyek yang barusan kita diskusikan, lalu rangkum insight pentingnya buat saya.';
      pushUserMessage(label);
      respondWithAI(prompt, false, undefined, true);
      return;
    }
    if (id === 'agent_file_analysis') {
      if (!lastFilesRef.current || lastFilesRef.current.length === 0) {
        appendBotMessage(
          'Hmm, sepertinya belum ada file yang bisa dianalisis lebih dalam nih, Kak. Coba lampirkan filenya dulu ya 😊',
          standardCTA(false),
          true,
        );
        return;
      }
      const prompt =
        'Tolong analisis lebih dalam file yang saya lampirkan sebelumnya (data, angka, atau insight bisnis yang relevan) menggunakan kemampuan AI Agent, lalu rangkum temuannya buat saya.';
      pushUserMessage(label);
      respondWithAI(prompt, false, lastFilesRef.current, true);
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
      respondWithFAQ(faq);
      return;
    }
    respondWithAI(label);
  };

  const sendMessage = (text: string, isFromVoice = false) => {
    const trimmed = text.trim();
    if ((!trimmed && pendingFiles.length === 0) || isTyping) return;
    // Kalau user cuma lampirin file tanpa nulis apa-apa, kasih caption default
    // biar backend tetap punya instruksi jelas.
    const cleanText = trimmed || 'Tolong analisis file yang saya lampirkan ini.';
    const filesForThisMessage = pendingFiles;
    pushUserMessage(cleanText, filesForThisMessage);
    lastQueryRef.current = cleanText;
    setInputValue('');
    setPendingFiles([]); // preview di-clear, tapi objectURL-nya masih dipakai bubble di atas
    setUploadError(null);

    const outgoingFiles: OutgoingFile[] | undefined = filesForThisMessage.length > 0
      ? filesForThisMessage.map((f) => ({ mimeType: f.mimeType, data: f.data, name: f.name }))
      : undefined;
    // Simpan file ini buat opsi "Analisis Lebih Dalam pakai AI Agent" nanti —
    // sengaja di-overwrite tiap kirim pesan baru (termasuk balik ke undefined
    // kalau pesan berikutnya nggak ada file), jadi tombol itu selalu ngerujuk
    // ke lampiran PALING BARU, bukan numpuk dari upload lama.
    lastFilesRef.current = outgoingFiles;

    // Deteksi intent alami jika user meminta kembali ke Zannah
    const wantsZannah = /zannah|panggil zannah|coba zannah|coba lagi|mode ai|connect ai/i.test(cleanText);
    if (wantsZannah && aiMode === 'fallback') {
      setAiMode('ai');
      respondWithAI(cleanText, isFromVoice, outgoingFiles);
      return;
    }

    // Kalau ada file dilampirkan, selalu pakai AI (FAQ fallback gak bisa proses file).
    if (aiMode === 'fallback' && !outgoingFiles) {
      const results = fuse.search(cleanText);
      if (results.length > 0) {
        respondWithFAQ(results[0].item, isFromVoice);
      } else {
        respondWithFallback(isFromVoice);
      }
    } else {
      respondWithAI(cleanText, isFromVoice, outgoingFiles);
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

  // ── Voice Chat: mic (STT) — wrapper tipis di atas hook, karena logika
  // "tampilkan transkrip sementara di input & kirim saat final" itu spesifik
  // ke komponen ini (beda struktur pesan di tiap file).
  const handleMicClick = () => {
    micToggle((text, isFinal) => {
      setInputValue(text);
      if (isFinal && text.trim()) {
        // Kalau bot masih mengetik, tunda dulu — dikirim otomatis oleh
        // effect isTyping di atas begitu bot selesai, bukan dibuang diam-diam.
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

          // Deteksi link file data: URI (mis. hasil generate galeri/laporan
          // HTML) & ubah jadi tombol download asli, bukan <a href> mentah —
          // link http(s) biasa di formatInlineText nggak nangkep data: URI,
          // makanya sebelumnya cuma nongol sebagai teks markdown polos.
          const dataUriMatch = line.match(/\[([^\]]+)\]\((data:[^\s)]+)\)/);
          if (dataUriMatch) {
            const [fullMatch, label, dataUri] = dataUriMatch;
            const before = line.substring(0, line.indexOf(fullMatch));
            const after = line.substring(line.indexOf(fullMatch) + fullMatch.length);

            return (
              <div key={lineIdx} className="my-2">
                {before && <p className="mb-1.5">{formatInlineText(before)}</p>}
                <button
                  type="button"
                  onClick={() => downloadFromDataUri(label, dataUri)}
                  className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border transition-colors ${darkMode
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                    }`}
                >
                  <Download className="w-3 h-3" />
                  {label}
                </button>
                {after && <p className="mt-1.5">{formatInlineText(after)}</p>}
              </div>
            );
          }

          // Deteksi link WhatsApp khusus untuk diubah jadi CTA Button interaktif
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

          // Bullet points atau baris teks biasa
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

  // ─ Render ─────────────────────────────────────────────────────────────────
  // Cek bot mana yang membalas pesan terakhir agar avatar dan nama di header sinkron
  const lastBotMessage = [...messages].reverse().find((m) => m.sender === 'bot' && !m.isStreaming);
  const isHeaderRadit = lastBotMessage ? lastBotMessage.isAI === false : (aiMode === 'fallback');

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
              className={`relative w-full h-full sm:w-80 sm:h-[460px] md:w-96 rounded-none sm:rounded-2xl shadow-2xl border-0 sm:border flex flex-col overflow-hidden pointer-events-auto animate-in fade-in slide-in-from-bottom-5 duration-200 ${darkMode ? 'bg-slate-900 sm:border-slate-700' : 'bg-white sm:border-slate-200'
                }`}
            >
              {/* Header */}
              <div
                className={`p-3.5 border-b flex items-center justify-between transition-colors ${darkMode
                  ? 'bg-slate-800/80 border-slate-700'
                  : 'bg-slate-50 border-slate-100'
                  }`}
              >
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={openHistoryPanel}
                    aria-label="Lihat riwayat obrolan tersimpan"
                    title="Lihat riwayat obrolan tersimpan"
                    className="relative rounded-full focus:outline-none focus:ring-2 focus:ring-teal-400 shrink-0"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold transition-all ${isHeaderRadit
                        ? 'bg-gradient-to-br from-amber-500 to-amber-700 shadow-amber-900/30'
                        : 'bg-gradient-to-br from-teal-500 to-teal-700 shadow-teal-900/30'
                        } shadow-md`}
                    >
                      {isHeaderRadit ? 'RD' : 'ZA'}
                    </div>
                    <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 rounded-full ${darkMode ? 'border-slate-800' : 'border-white'}`} />
                  </button>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className={`font-bold text-xs ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        {isHeaderRadit ? 'Radit' : 'Zannah'}
                      </h3>
                      <ModeBadge aiMode={isHeaderRadit ? 'fallback' : (aiMode === 'unknown' ? 'ai' : aiMode)} darkMode={darkMode} />
                    </div>
                    <p className={`text-[10px] ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>
                      {isHeaderRadit ? 'Model Direktori (FAQ)' : 'Konsultan & Asisten AI'}
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
                  {messages.length > 1 && canShareSummary && (
                    <button
                      type="button"
                      aria-label="Bagikan rangkuman obrolan ke WhatsApp"
                      title="Bagikan rangkuman obrolan langsung ke WhatsApp Mas Arzha"
                      onClick={handleShareSummary}
                      disabled={shareSummaryState === 'sharing'}
                      className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-medium disabled:opacity-60 ${shareSummaryState === 'shared'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : darkMode
                          ? 'text-slate-300 hover:text-white hover:bg-slate-700'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                        }`}
                    >
                      {shareSummaryState === 'sharing' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Share2 className="w-3.5 h-3.5" />
                      )}
                      <span className="hidden sm:inline">
                        {shareSummaryState === 'shared' ? 'Terkirim!' : shareSummaryState === 'sharing' ? 'Membuka...' : 'Bagikan'}
                      </span>
                    </button>
                  )}
                  <button
                    aria-label="Tutup jendela chat"
                    onClick={() => setIsOpen(false)}
                    className={`p-1.5 rounded-lg transition-colors ${darkMode
                      ? 'text-slate-400 hover:text-white hover:bg-slate-700'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                      }`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Jendela Riwayat Percakapan — overlay penuh di dalam kartu chat,
                  dibuka lewat klik avatar bot di header. */}
              {isHistoryOpen && (
                <div className={`absolute inset-0 z-30 flex flex-col ${darkMode ? 'bg-slate-900' : 'bg-white'}`}>
                  <div
                    className={`p-3.5 border-b flex items-center justify-between ${darkMode
                      ? 'bg-slate-800/80 border-slate-700'
                      : 'bg-slate-50 border-slate-100'
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
                      className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-white transition-colors ${isRadit ? 'bg-amber-600 hover:bg-amber-700' : 'bg-teal-600 hover:bg-teal-700'
                        }`}
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
                  ? `${isRadit ? 'Radit' : 'Zannah'} sedang mengetik…`
                  : lastFinalizedBotMessage?.text ?? ''}
              </div>

              {/* Fallback Notice Banner with Quick Reconnect Button */}
              {isRadit && (
                <div
                  className={`px-3 py-1.5 flex items-center justify-between text-[10px] border-b transition-all ${darkMode
                    ? 'bg-amber-950/40 border-amber-900/50 text-amber-300'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                    }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0 pr-2">
                    <span className="text-xs shrink-0">📋</span>
                    <span className="truncate">
                      <b>Radit (Non-AI):</b> Zannah lagi istirahat kuota
                    </span>
                  </div>
                  <button
                    onClick={() => handleOptionClick('retry_zannah', 'Coba Zannah')}
                    className={`shrink-0 px-2 py-0.5 rounded-md font-bold text-[9.5px] transition-all hover:scale-105 active:scale-95 shadow-sm ${darkMode
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                      : 'bg-amber-500 hover:bg-amber-600 text-white'
                      }`}
                  >
                    ✨ Coba Zannah
                  </button>
                </div>
              )}

              {/* Messages Body */}
              <div
                role="log"
                aria-relevant="additions"
                className={`flex-1 p-3.5 overflow-y-auto chat-scrollbar space-y-3 text-xs ${darkMode ? 'bg-slate-900' : 'bg-slate-50'
                  }`}
              >
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex gap-2 animate-message-in ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
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
                        {renderMessageBody(m.text, m.sender === 'user', m.isStreaming)}
                        <div className="flex items-center justify-between gap-2 mt-1">
                          {m.sender === 'bot' ? (
                            <button
                              aria-label={speakingId === m.id ? 'Hentikan suara' : 'Dengarkan jawaban'}
                              onClick={() => handleToggleSpeak(m.id, m.text, m.isAI === false ? BOT_VOICES.RADIT : BOT_VOICES.ZANNAH)}
                              className={`shrink-0 flex items-center justify-center w-5 h-5 rounded-full transition-colors ${darkMode
                                ? 'text-slate-400 hover:text-teal-400 hover:bg-slate-700/60'
                                : 'text-slate-400 hover:text-teal-600 hover:bg-slate-100'
                                }`}
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
                          <span className="block text-[9px] opacity-50 text-right">
                            {m.timestamp}
                          </span>
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

                      {/* File hasil kerja Zannah (mis. RAB.xlsx, laporan.pdf) — siap didownload */}
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

                {/* Typing indicator with Progressive Status Text */}
                {isTyping && (
                  <div className="flex gap-2 justify-start">
                    <div
                      className={`w-6 h-6 rounded-full text-white flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold ${isHeaderRadit
                        ? 'bg-gradient-to-br from-amber-500 to-amber-700'
                        : 'bg-gradient-to-br from-teal-500 to-teal-700'
                        }`}
                    >
                      {isHeaderRadit ? 'RD' : 'ZA'}
                    </div>
                    <div
                      className={`px-3.5 py-2.5 rounded-xl rounded-bl-none flex items-center gap-2 ${darkMode
                        ? 'bg-slate-800 border border-slate-700'
                        : 'bg-white border border-slate-200 shadow-sm'
                        }`}
                    >
                      <div className="flex items-center gap-1">
                        <span
                          className={`w-1.5 h-1.5 rounded-full animate-bounce ${isHeaderRadit ? 'bg-amber-400' : 'bg-teal-400'
                            }`}
                          style={{ animationDelay: '0ms' }}
                        />
                        <span
                          className={`w-1.5 h-1.5 rounded-full animate-bounce ${isHeaderRadit ? 'bg-amber-400' : 'bg-teal-400'
                            }`}
                          style={{ animationDelay: '150ms' }}
                        />
                        <span
                          className={`w-1.5 h-1.5 rounded-full animate-bounce ${isHeaderRadit ? 'bg-amber-400' : 'bg-teal-400'
                            }`}
                          style={{ animationDelay: '300ms' }}
                        />
                      </div>
                      <span className={`text-[11px] font-medium transition-all duration-300 ${isHeaderRadit
                        ? darkMode ? 'text-amber-300/90' : 'text-amber-700/90'
                        : darkMode ? 'text-teal-300/90' : 'text-teal-700/90'
                        }`}>
                        {isHeaderRadit
                          ? 'Mencari jawaban FAQ...'
                          : isAgentBusy
                            ? AGENT_LOADING_STATUSES[loadingTextIndex]
                            : ZANNAH_LOADING_STATUSES[loadingTextIndex]}
                      </span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div
                className={`p-2.5 border-t ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
                  }`}
              >
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
                    title="Lampirkan foto, PDF, atau CSV"
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
                        : isRadit
                          ? 'Tanya Radit (katalog direktori)...'
                          : 'Tanya Zannah sesuatu...'
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
                        : darkMode
                          ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                      <Mic className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    aria-label="Kirim pesan"
                    onClick={() => sendMessage(inputValue)}
                    disabled={(!inputValue.trim() && pendingFiles.length === 0) || isTyping}
                    className={`w-8 h-8 rounded-lg text-white flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${isRadit ? 'bg-amber-600 hover:bg-amber-700' : 'bg-teal-600 hover:bg-teal-700'
                      }`}
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
        title={isRadit ? 'Chat dengan Radit (Standby Bot)' : 'Chat dengan Zannah (AI)'}
      >
        {isOpen ? <X className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
      </button>
    </div>
  );
};