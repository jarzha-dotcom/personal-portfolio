/**
 * chatSummaryGenerator.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Utility untuk membuat dan mengunduh file rangkuman diskusi obrolan chatbot
 * agar calon klien/customer bisa dengan mudah melanjutkan obrolan ke Mas Arzha
 * via WhatsApp atau email secara langsung dengan konteks yang lengkap.
 */

import { CONTACT_INFO } from '../data/portfolioData';

export interface ChatSummaryMessage {
  role?: string;
  sender?: string;
  content?: string;
  text?: string;
  timestamp?: string;
}

/**
 * Format tanggal dan waktu dalam bahasa Indonesia (WIB)
 */
function getFormattedDateTime(): string {
  const now = new Date();
  return now.toLocaleString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

/**
 * Susun dokumen teks rangkuman diskusi yang bersih, profesional, dan siap baca
 */
export function buildChatSummaryText(
  messages: ChatSummaryMessage[],
  botName: string = 'Rajendra'
): string {
  const dateTimeStr = getFormattedDateTime();

  // Filter pesan (skip welcome message standar jika diinginkan, atau sertakan percakapan inti)
  const conversationLines = messages
    .map((m) => {
      const isUser = m.role === 'user' || m.sender === 'user';
      const senderName = isUser ? 'Klien (Pengunjung)' : `${botName} (AI Assistant)`;
      const body = m.content || m.text || '';
      const time = m.timestamp ? ` [${m.timestamp}]` : '';
      if (!body.trim()) return '';
      return `${senderName}${time}:\n${body.trim()}\n`;
    })
    .filter(Boolean);

  // Ekstrak pesan-pesan user untuk poin cepat
  const userInquiries = messages
    .filter((m) => (m.role === 'user' || m.sender === 'user') && (m.content || m.text))
    .map((m, idx) => `${idx + 1}. ${(m.content || m.text || '').trim()}`);

  const separator = '='.repeat(64);
  const subSeparator = '-'.repeat(64);

  return `${separator}
  RANGKUMAN DISKUSI PROYEK - K. ARZHANING JAGAD (ARZHA)
${separator}
Waktu Sesi Diskusi : ${dateTimeStr}
Platform / Bot      : ${botName} (AI Tech Consultant / Portfolio Assistant)
Website             : https://byarzhaning.online

${subSeparator}
1. INTI KEBUTUHAN / PERTANYAAN KLIEN:
${subSeparator}
${userInquiries.length > 0 ? userInquiries.join('\n') : '- Konsultasi umum seputar portofolio & layanan pengembang.'}

${subSeparator}
2. TRANSKRIP LENGKAP PERCAKAPAN:
${subSeparator}
${conversationLines.length > 0 ? conversationLines.join('\n') : '(Tidak ada riwayat percakapan)'}

${subSeparator}
3. INFORMASI KONTAK PENGEMBANG (LANJUTKAN DISKUSI LANGSUNG):
${subSeparator}
Nama Pengembang : K. Arzhaning Jagad (Arzha)
Spesialisasi    : Web, Mobile Apps, Realtime System & AI Integration (7+ Tahun Pengalaman)
WhatsApp        : ${CONTACT_INFO.displayPhone} (${CONTACT_INFO.phone})
Email           : ${CONTACT_INFO.email}
Lokasi          : ${CONTACT_INFO.location}

Link Chat WhatsApp Langsung:
https://wa.me/${CONTACT_INFO.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
    `Halo Mas Arzha, saya tadi berdiskusi dengan ${botName} di website portofolio dan ingin melanjutkan pembahasan proyek langsung dengan Mas Arzha.`
  )}

${separator}
File ini digenerate secara otomatis oleh sistem AI Portfolio K. Arzhaning Jagad.
${separator}
`;
}

/**
 * Unduh teks rangkuman percakapan sebagai file .txt di browser
 */
export function downloadChatSummaryFile(
  messages: ChatSummaryMessage[],
  botName: string = 'Rajendra'
): boolean {
  if (typeof window === 'undefined' || !messages || messages.length === 0) return false;

  try {
    const summaryText = buildChatSummaryText(messages, botName);
    const blob = new Blob([summaryText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const dateSlug = new Date().toISOString().slice(0, 10);
    const filename = `Rangkuman-Diskusi-${botName}-${dateSlug}.txt`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    return true;
  } catch (error) {
    console.error('Gagal mengunduh file rangkuman chat:', error);
    return false;
  }
}

/**
 * Buat URL WhatsApp langsung dengan ringkasan singkat dari percakapan
 */
export function createWhatsAppSummaryUrl(
  messages: ChatSummaryMessage[],
  botName: string = 'Rajendra'
): string {
  const userMessages = messages
    .filter((m) => (m.role === 'user' || m.sender === 'user') && (m.content || m.text))
    .map((m) => (m.content || m.text || '').trim());

  const latestTopic = userMessages.length > 0 ? userMessages[userMessages.length - 1] : 'proyek web/aplikasi';
  const cleanPhone = CONTACT_INFO.phone.replace(/[^0-9]/g, '');

  const text = `Halo Mas Arzha, saya tadi konsultasi dengan ${botName} di web portofolio mengenai "${latestTopic.slice(0, 80)}...". Saya ingin diskusi lanjutan langsung dengan Mas Arzha.`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}
