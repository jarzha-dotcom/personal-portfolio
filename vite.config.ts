import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv, Plugin } from 'vite';

const SYSTEM_INSTRUCTION = `Kamu adalah "Zannah", asisten ramah & konsultan santai dari Arzha (Kidung Arzhaning Jagad) — indie developer & data specialist 7+ tahun di Cibitung, Bekasi.

PERAN & KARAKTER:
- Bersikap seperti teman diskusi tech yang paham solusi, santai, dan proaktif.
- Jangan pasif (hanya menjawab lalu diam), tapi juga JANGAN hard-selling/agresif menyuruh transaksi.

PANJANG JAWABAN & ALUR:
- Sapaan / Pertanyaan Ringan: Jawab pendek & santai (1-2 kalimat). Wajib tutup dengan 1 pertanyaan balik yang relevan untuk memancing obrolan (misal: "Lagi ada rencana bikin sistem apa nih kak?").
- Pertanyaan Teknis / Harga / Proses: Jawab padat & jelas (2-4 kalimat). Berikan gambaran singkat solusinya, lalu ajak diskusi lebih lanjut tentang kebutuhan spesifiknya.

ATURAN KONTAK WHATSAPP (+6282312312734):
- Sebutkan kontak WhatsApp HANYA JIKA:
  1. Pengguna bertanya cara menghubungi/order.
  2. Pengguna sudah membagikan detail proyek yang siap dieksekusi atau minta estimasi biaya resmi.
- Jika belum masuk tahap itu, tetap lakukan diskusi di sini.

CARA MENGARAHKAN PERCAKAPAN (PROAKTIF TAPI SANTAI):
- Setiap kali menjawab, selalu akhiri dengan 1 pertanyaan terbuka atau tawaran bantuan spesifik yang berkaitan dengan topik pengguna (misal: ingin lihat demo, diskusi alur fitur, atau cek ketersediaan tech stack).

KNOWLEDGE BASE:
- Portofolio Live:
  * B-Games (bgames.byarzhaning.online) — Board game multiplayer online.
  * Rajendra Pintar (rajendrapintar.byarzhaning.online) — App edukasi anak dwibahasa + audio TTS.
  * Assets GMP (assets-gmp.vercel.app) — Sistem inventaris & manajemen aset internal.
- Layanan & Harga:
  * Landing Page / Web Profil: Mulai Rp800rb (1-2 minggu)
  * Web App Custom / Dashboard: Mulai Rp6jt (3-6 minggu)
  * Mobile App (Android/iOS): Mulai Rp6jt
  * Game Realtime: Mulai Rp12jt
- Keamanan Klien: Pembayaran bertahap per milestone (hasil jadi dulu baru bayar), garansi support 1 bulan.
- Promo Peluncuran: 5 klien pertama dapat diskon 15% + gratis technical support 1 bulan.

OBJECTION HANDLING (JANGAN MARAH/PASRAH):
- Kalau dibilang "ga percaya / ragu": Rangkul santai: "Hehe wajar banget kok kak kalau ragu 😊 Memang paling enak lihat buktinya langsung. Kakak bisa jajal 3 proyek live Arzha di portofolio (ada B-Games, Rajendra Pintar, Assets GMP). Plus bayarnya sistem termin per progress, jadi hasil kelihatan dulu baru bayar. Santai aja kak, gak ada paksaan sama sekali kok 🙏"

ATURAN UTAMA:
- Kalimat harus tuntas sampai tanda baca akhir (jangan sampai terpotong).
- Jaga obrolan tetap menyenangkan, jujur, dan tidak berlebihan.`;

function localChatDevPlugin(envApiKey: string): Plugin {
  return {
    name: 'local-chat-dev-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.startsWith('/api/chat') && req.method === 'POST') {
          let rawBody = '';
          req.on('data', (chunk) => {
            rawBody += chunk;
          });

          req.on('end', async () => {
            try {
              let apiKey = envApiKey || process.env.GEMINI_API_KEY;
              if (!apiKey) {
                try {
                  const envLocalPath = path.resolve(__dirname, '.env.local');
                  if (fs.existsSync(envLocalPath)) {
                    const content = fs.readFileSync(envLocalPath, 'utf8');
                    const match = content.match(/GEMINI_API_KEY=(.+)/);
                    if (match) apiKey = match[1].trim();
                  }
                } catch (_) { }
              }

              if (!apiKey) {
                res.statusCode = 503;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'AI_UNAVAILABLE' }));
                return;
              }

              const { history, message } = JSON.parse(rawBody || '{}');
              if (!message) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Pesan tidak valid' }));
                return;
              }

              const sanitizedHistory = (history || []).slice(-12).map((h: any) => ({
                role: h.role === 'user' ? 'user' : 'model',
                parts: [{ text: String(h.parts?.[0]?.text || '').slice(0, 1000) }],
              }));

              const contents = [
                ...sanitizedHistory,
                { role: 'user', parts: [{ text: String(message).slice(0, 1000) }] },
              ];

              const targetModel = 'gemini-3.5-flash';
              const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;

              const geminiRes = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents,
                  systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
                  generationConfig: {
                    temperature: 0.85,
                    maxOutputTokens: 2048,
                  },
                }),
              });

              if (!geminiRes.ok) {
                const errData = await geminiRes.json().catch(() => ({}));
                res.statusCode = geminiRes.status === 429 ? 429 : 502;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'AI_UNAVAILABLE', detail: errData }));
                return;
              }

              const data = await geminiRes.json();
              const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;

              if (!reply) {
                res.statusCode = 502;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'AI_UNAVAILABLE' }));
                return;
              }

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ reply: reply.trim() }));
            } catch (err: any) {
              console.error('[Local Dev Chat API] Error:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err?.message || 'Server error' }));
            }
          });
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';

  // Build ID unik setiap deploy — dipakai sebagai versi cache key localStorage
  // Sehingga setiap code update di production otomatis invalidate chat history lama
  const buildId = `${Date.now()}`;

  return {
    plugins: [react(), tailwindcss(), localChatDevPlugin(apiKey)],
    define: {
      // Tersedia sebagai konstanta global di semua komponen React
      __CHAT_BUILD_ID__: JSON.stringify(buildId),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

