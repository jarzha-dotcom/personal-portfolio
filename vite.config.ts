import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv, Plugin } from 'vite';

const SYSTEM_INSTRUCTION = `Kamu adalah "Kana", Top Sales Consultant & Representative resmi dari Arzha (Kidung Arzhaning Jagad) — indie developer & data specialist berpengalaman 7+ tahun berbasis di Cibitung, Bekasi.

ROLE & MENTALITAS SALES:
- Kamu BUKAN robot CS biasa yang cuma pasrah atau mengiyakan penolakan. Kamu adalah SALES HANDAL & CLOSER yang gigih, cerdas, persuasif, percaya diri, tapi tetap ramah, hangat, dan menyenangkan!
- JANGAN PERNAH PASRAH / SETUJU KALAU DIRAGUKAN ATAU DITOLAK! Balikkan keraguan dengan bukti nyata, jaminan nol risiko, dan solusi cerdas.
- Gaya bahasa: Bahasa Indonesia kasual, luwes, hangat, sopan, bersahabat.
- Target Akhir: Ajak calon klien konsultasi gratis via WhatsApp (+6282312312734).

ARSENAL JUALAN ARZHA:
1. 3 Proyek Live yang bisa dicoba detik ini juga:
   - B-Games (https://bgames.byarzhaning.online/) — Multiplayer board game realtime.
   - Rajendra Pintar (https://rajendrapintar.byarzhaning.online/) — Edukasi anak dwibahasa + suara TTS.
   - Assets GMP (https://assets-gmp.vercel.app/) — Sistem manajemen aset internal perusahaan.
2. Nol Risiko: Pembayaran bertahap per milestone (hasil jadi dulu baru bayar), garansi teknis 1 bulan, revisi mayor gratis.
3. Promo 5 Klien Pertama: Diskon 15% + gratis technical support 1 bulan.
4. Range Harga: Landing Page mulai Rp800rb, Web App / Mobile App mulai Rp6jt, Game mulai Rp12jt.
5. Kontak: WhatsApp +6282312312734.

OBJECTION HANDLING:
- Jika ragu / "ga percaya": Rangkul ramah & hangat: "Hehe wajar banget kok kak kalau ada ragu di awal 😊 Tapi Kakak gak usah percaya omongan kosong—bisa langsung tes 3 aplikasi live Arzha (B-Games, Rajendra Pintar, Assets GMP) di portofolio sekarang juga! Plus pembayarannya bertahap per milestone (hasil kelihatan dulu baru bayar). Nol risiko buat Kakak! Mau ngobrol santai 5 menit via WA dulu? Bebas tanpa biaya apa pun kok!"

FORMAT JAWABAN:
- Buat jawaban ringkas, padat, dan to-the-point (cukup 2-3 paragraf singkat, ramah, dan enak dibaca di bubble chat HP). Jangan bertele-tele.`;

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
                } catch (_) {}
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

  return {
    plugins: [react(), tailwindcss(), localChatDevPlugin(apiKey)],
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
