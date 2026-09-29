import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv, Plugin } from 'vite';

function localChatDevPlugin(): Plugin {
  return {
    name: 'local-chat-dev-middleware',
    apply: 'serve', // HANYA aktif saat dev server (vite dev), tidak dipanggil saat build
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.startsWith('/api/chat') && req.method === 'POST') {
          const { default: chatHandler } = await import('./api/chat');
          let rawBody = '';
          req.on('data', (chunk) => {
            rawBody += chunk;
          });

          req.on('end', async () => {
            try {
              let body = {};
              try {
                body = JSON.parse(rawBody || '{}');
              } catch (_) {}

              (req as any).body = body;

              // Pastikan process.env memiliki key dari .env.local jika belum ada
              if (!process.env.GEMINI_API_KEY) {
                try {
                  const envLocalPath = path.resolve(__dirname, '.env.local');
                  if (fs.existsSync(envLocalPath)) {
                    const content = fs.readFileSync(envLocalPath, 'utf8');
                    content.split(/\r?\n/).forEach((line) => {
                      const match = line.match(/^([^=]+)=(.*)$/);
                      if (match) {
                        const k = match[1].trim();
                        const v = match[2].trim();
                        if (!process.env[k]) process.env[k] = v;
                      }
                    });
                  }
                } catch (_) {}
              }

              // Adapt Node ServerResponse ke interface VercelResponse
              const vercelRes = res as any;
              vercelRes.status = function (statusCode: number) {
                this.statusCode = statusCode;
                return this;
              };
              vercelRes.json = function (data: any) {
                this.setHeader('Content-Type', 'application/json');
                this.end(JSON.stringify(data));
                return this;
              };

              await chatHandler(req as any, vercelRes);
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

// ── Dev middleware untuk /api/tts (GCP Text-to-Speech) ──────────────────────
// Mirror dari api/tts.ts (endpoint produksi Vercel), supaya fitur Voice Chat
// bisa dites di local dev tanpa perlu `vercel dev`. Tidak ada rate limiting
// di sini (dev only) — rate limiting tetap berlaku di api/tts.ts produksi.
//
// CATATAN: id-ID-Neural2-* kemungkinan besar TIDAK tersedia di GCP TTS.
// id-ID-Wavenet-A dipakai sebagai default. Cek voice aktual via:
//   GET https://texttospeech.googleapis.com/v1/voices?languageCode=id-ID&key=API_KEY
const TTS_DEFAULT_VOICE = 'id-ID-Wavenet-A';
const TTS_ALLOWED_VOICES = new Set([
  // Google Cloud Text-to-Speech WaveNet Voices (Free Tier)
  'id-ID-Wavenet-A',
  'id-ID-Wavenet-B',
  'id-ID-Wavenet-C',
  'id-ID-Wavenet-D',
  // Google Cloud Text-to-Speech Standard Voices
  'id-ID-Standard-A',
  'id-ID-Standard-B',
  'id-ID-Standard-C',
  'id-ID-Standard-D',
]);
const TTS_MAX_CHARS = 800;

// Sama seperti api/tts.ts: server HANYA membersihkan markdown/emoji. Normalisasi
// pelafalan dilakukan sekali di frontend lewat speechNormalizer.ts (dipanggil
// dari voiceService.ts), jadi jangan diulang di middleware dev ini.
function sanitizeForSpeechDev(raw: string): string {
  return raw
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[_~]/g, '')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function localTtsDevPlugin(envGcpApiKey: string): Plugin {
  return {
    name: 'local-tts-dev-middleware',
    apply: 'serve', // HANYA aktif saat dev server (vite dev), tidak dipanggil saat build
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.startsWith('/api/tts') && req.method === 'POST') {
          let rawBody = '';
          req.on('data', (chunk) => {
            rawBody += chunk;
          });

          req.on('end', async () => {
            try {
              let gcpApiKey = envGcpApiKey || process.env.GCP_API_KEY;
              if (!gcpApiKey) {
                try {
                  const envLocalPath = path.resolve(__dirname, '.env.local');
                  if (fs.existsSync(envLocalPath)) {
                    const content = fs.readFileSync(envLocalPath, 'utf8');
                    const match = content.match(/GCP_API_KEY=(.+)/);
                    if (match) gcpApiKey = match[1].trim();
                  }
                } catch (_) { }
              }

              if (!gcpApiKey) {
                // Bukan error fatal — voiceService.ts otomatis fallback ke
                // Web Speech API browser kalau endpoint ini balas 503.
                res.statusCode = 503;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'TTS_UNAVAILABLE', detail: 'GCP_API_KEY belum dikonfigurasi' }));
                return;
              }

              const { text, voice } = JSON.parse(rawBody || '{}');
              if (!text || typeof text !== 'string' || !text.trim()) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Teks tidak valid' }));
                return;
              }

              const selectedVoice = voice && TTS_ALLOWED_VOICES.has(voice) ? voice : TTS_DEFAULT_VOICE;
              const cleanText = sanitizeForSpeechDev(text).slice(0, TTS_MAX_CHARS);

              if (!cleanText) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Teks kosong setelah dibersihkan' }));
                return;
              }

              const ttsRes = await fetch(
                `https://texttospeech.googleapis.com/v1/text:synthesize?key=${gcpApiKey}`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    input: { text: cleanText },
                    voice: { languageCode: 'id-ID', name: selectedVoice },
                    audioConfig: { audioEncoding: 'MP3', speakingRate: 1.0, pitch: 0 },
                  }),
                },
              );

              if (!ttsRes.ok) {
                const errData = await ttsRes.json().catch(() => ({}));
                res.statusCode = 502;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'TTS_FAILED', detail: errData }));
                return;
              }

              const data = await ttsRes.json();
              const audioContent = data.audioContent;

              if (!audioContent) {
                res.statusCode = 502;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'TTS_FAILED', detail: 'Empty audio response' }));
                return;
              }

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ audioContent, voice: selectedVoice }));
            } catch (err: any) {
              console.error('[Local Dev TTS API] Error:', err);
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
  if (env.GEMINI_API_KEY) process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;
  if (env.GCP_API_KEY) process.env.GCP_API_KEY = env.GCP_API_KEY;
  const gcpApiKey = env.GCP_API_KEY || process.env.GCP_API_KEY || '';

  // Build ID unik setiap deploy — dipakai sebagai versi cache key localStorage
  // Sehingga setiap code update di production otomatis invalidate chat history lama
  const buildId = `${Date.now()}`;

  return {
    plugins: [react(), tailwindcss(), localChatDevPlugin(), localTtsDevPlugin(gcpApiKey)],
    define: {
      // Tersedia sebagai konstanta global di semua komponen React
      __CHAT_BUILD_ID__: JSON.stringify(buildId),
    },
    build: {
      // Menghasilkan dist/.vite/manifest.json yang memetakan path source
      // (mis. "src/assets/images/Foo.jpeg") ke file hasil build yang sudah
      // di-hash (mis. "assets/Foo-a1b2c3d4.jpeg"). Dipakai scripts/prerender.ts
      // (dijalankan sebagai postbuild, di luar Vite) untuk resolve URL asli
      // gambar artikel supaya og:image per-artikel akurat — tanpa ini,
      // prerender tidak punya cara mengetahui nama file hasil hash.
      manifest: true,
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