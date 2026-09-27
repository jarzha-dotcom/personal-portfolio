/**
 * summaryStore.ts
 * ────────────────────────────────────────────────────────────────────────
 * Abstraksi penyimpanan untuk ringkasan chat yang dibagikan lewat tombol
 * "Chat via WhatsApp" (lihat services/shareSummaryService.ts di frontend,
 * dan api/share-summary.ts + api/ringkasan/[id].ts di sini).
 *
 * Implementasi sekarang pakai Vercel KV (Redis-compatible) karena hosting
 * situs ini sudah di Vercel (lihat Kebijakan Privasi §6 — index.html).
 * Kalau kamu belum aktifkan integrasinya:
 *   1. Vercel Dashboard → Project → Storage → Create Database → KV
 *   2. Connect ke project ini (env vars KV_URL dkk otomatis ke-inject)
 *   3. `npm i @vercel/kv`
 *
 * Kalau nanti mau pindah ke storage lain (Supabase, Upstash langsung, dst),
 * cukup ganti ISI dua fungsi di bawah ini — pemanggilnya (api/share-summary.ts
 * & api/ringkasan/[id].ts) tidak perlu tahu/berubah sama sekali.
 */

import { kv } from '@vercel/kv';

// 7 hari — SAMAKAN dengan angka retention yang disebut di Kebijakan Privasi
// §4a & §7 (index.html). Kalau ubah angka ini, jangan lupa update teksnya
// juga di sana biar kebijakan & implementasi gak drift.
export const SUMMARY_TTL_SECONDS = 7 * 24 * 60 * 60;

export interface StoredSummaryMessage {
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

export interface StoredSummary {
  botName: string;
  messages: StoredSummaryMessage[];
  createdAt: string; // ISO string
}

const keyFor = (id: string) => `chat-summary:${id}`;

export async function saveSummary(id: string, data: StoredSummary): Promise<void> {
  await kv.set(keyFor(id), data, { ex: SUMMARY_TTL_SECONDS });
}

export async function getSummary(id: string): Promise<StoredSummary | null> {
  const data = await kv.get<StoredSummary>(keyFor(id));
  return data ?? null;
}
