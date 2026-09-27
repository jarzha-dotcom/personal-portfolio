/**
 * summaryStore.ts
 * ────────────────────────────────────────────────────────────────────────
 * Abstraksi penyimpanan untuk ringkasan chat yang dibagikan lewat tombol
 * "Chat via WhatsApp" (lihat services/shareSummaryService.ts di frontend,
 * dan api/share-summary.ts + api/ringkasan/[id].ts di sini).
 *
 * Implementasi pakai @upstash/redis (Vercel KV sudah di-sunset per Des 2024
 * — semua store lama otomatis dipindah ke Upstash Redis, dan paket
 * @vercel/kv sendiri sudah deprecated/tidak dirilis lagi sejak itu, jadi
 * ini memang pengganti resminya, bukan sekadar alternatif).
 *
 * Setup:
 *   1. Vercel Dashboard → Project → Storage → cari integrasi "Upstash" di
 *      Marketplace → Create/Connect database → connect ke project ini.
 *      (Kalau project ini dulu pernah pakai Vercel KV, storenya udah otomatis
 *      jadi database Upstash — tinggal di-connect ulang lewat Marketplace.)
 *   2. Env vars `UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN` bakal
 *      ke-inject otomatis ke project. (SDK ini juga tetap baca env var lama
 *      `KV_REST_API_URL`/`KV_REST_API_TOKEN` kalau itu yang ada, jadi aman
 *      dipakai di project yang belum sempat di-rename env-nya.)
 *   3. `npm i @upstash/redis`
 *
 * Kalau nanti mau pindah ke storage lain, cukup ganti ISI dua fungsi di
 * bawah ini — pemanggilnya (api/share-summary.ts & api/ringkasan/[id].ts)
 * tidak perlu tahu/berubah sama sekali.
 */

import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

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
  // @upstash/redis otomatis serialize object ke JSON (gak perlu
  // JSON.stringify manual) — beda dari raw redis client biasa.
  await redis.set(keyFor(id), data, { ex: SUMMARY_TTL_SECONDS });
}

export async function getSummary(id: string): Promise<StoredSummary | null> {
  const data = await redis.get<StoredSummary>(keyFor(id));
  return data ?? null;
}