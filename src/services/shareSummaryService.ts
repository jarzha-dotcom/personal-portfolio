/**
 * shareSummaryService.ts
 * ────────────────────────────────────────────────────────────────────────
 * Dipakai KHUSUS oleh tombol "Chat via WhatsApp" di ChatWidget.tsx.
 *
 * Kenapa ini perlu ada: sebelumnya klik "Chat via WhatsApp" cuma buka
 * wa.me dengan teks generik ("saya ingin tanya soal X") — Arzha gak punya
 * konteks obrolan sebelum balas. Sekarang, pas tombol ini diklik, transkrip
 * chat yang SEDANG ditampilkan ke user dikirim ke backend (`POST /api/summary`),
 * disimpan sementara (lihat retention di api/lib/summaryStore.ts), dan
 * dibalikin sebagai link privat (`GET /api/summary?id=...`) yang otomatis
 * ikut ke-embed di teks WhatsApp.
 *
 * Catatan teknis: create & view SENGAJA digabung jadi SATU file/function
 * (`api/summary.ts`, dibedain lewat method POST vs GET) alih-alih 2 file
 * terpisah, karena Vercel Hobby plan cuma boleh maks. 12 Serverless
 * Functions per deployment — projek ini sempat kepentok limit itu waktu
 * fiturnya masih dipecah jadi 2 function.
 *
 * PENTING soal privasi (selaras dengan Kebijakan Privasi §2 & §4a di
 * index.html): fungsi ini SENGAJA cuma dipanggil dari satu tempat
 * (openWhatsApp di ChatWidget.tsx), yaitu pas user benar-benar menekan
 * tombol itu — BUKAN dipanggil otomatis di setiap pesan/setiap render.
 * Kalau nanti dipakai di tempat lain, pastikan tetap opt-in seperti ini.
 */

export interface ShareableChatMessage {
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

interface ShareSummaryResponse {
  id: string;
  url: string;
}

/**
 * Upload transkrip ke backend & minta link ringkasan privat.
 *
 * Mengembalikan `null` (bukan throw) kalau gagal — network error, backend
 * down, atau response gak valid — supaya pemanggil (openWhatsApp) bisa
 * dengan mudah fallback ke teks WhatsApp biasa tanpa link, alih-alih block
 * user gara-gara fitur tambahan ini gagal.
 */
export async function createShareableSummaryLink(
  botName: 'Zannah' | 'Radit',
  messages: ShareableChatMessage[]
): Promise<ShareSummaryResponse | null> {
  if (messages.length === 0) return null;

  try {
    const res = await fetch('/api/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ botName, messages }),
    });

    if (!res.ok) {
      console.warn('[shareSummaryService] Server menolak request:', res.status);
      return null;
    }

    const data = await res.json();
    if (typeof data?.id !== 'string' || typeof data?.url !== 'string') {
      console.warn('[shareSummaryService] Response tidak sesuai format yang diharapkan.');
      return null;
    }

    return { id: data.id, url: data.url };
  } catch (err) {
    // Offline, timeout, CORS, dst — semua digagalkan dengan lembut ke null.
    console.warn('[shareSummaryService] Gagal membuat link ringkasan:', err);
    return null;
  }
}