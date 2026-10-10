import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv, type Plugin } from 'vite';

// Pengganti __dirname yang jalan di semua loader config Vite (bundle maupun native/ESM murni).
const ROOT_DIR = path.dirname(fileURLToPath(import.meta.url));

function localChatDevPlugin(): Plugin {
  return {
    name: 'local-chat-dev-middleware',
    apply: 'serve', // HANYA aktif saat dev server (vite dev), tidak dipanggil saat build
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.startsWith('/api/chat') && req.method === 'POST') {
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
                  const envLocalPath = path.resolve(ROOT_DIR, '.env.local');
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

              // Dimuat lewat pipeline Vite: tidak bergantung jenis loader config, dan
              // perubahan di api/chat.ts langsung berlaku tanpa restart dev server.
              const { default: chatHandler } = await server.ssrLoadModule('/api/chat.ts');
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

// ── Dev middleware untuk /api/tts ─────────────────────────────────────────────
// Menjalankan handler produksi api/tts.ts APA ADANYA (fallback tier Chirp →
// WaveNet, quota gate Redis, saklar GCP_TTS, rate limit, dan endpoint
// GET usage-check), jadi perilaku dev = produksi dan tidak ada kode TTS kedua
// yang harus dijaga sinkron. Env (GCP_API_KEY, GCP_TTS, TTS_USAGE_PIN, kredensial
// Upstash, dst.) dibaca dari .env / .env.local lewat defineConfig di bawah.
function localTtsDevPlugin(): Plugin {
  return {
    name: 'local-tts-dev-middleware',
    apply: 'serve', // HANYA aktif saat dev server (vite dev), tidak dipanggil saat build
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!/^\/api\/tts(?:\?|$)/.test(req.url || '')) return next();

        let rawBody = '';
        req.on('data', (chunk) => {
          rawBody += chunk;
        });

        req.on('end', async () => {
          try {
            let body: unknown = {};
            try {
              body = JSON.parse(rawBody || '{}');
            } catch (_) {}
            (req as any).body = body;

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

            // Dimuat lewat pipeline Vite (ssrLoadModule): tidak bergantung jenis loader
            // config, mengikuti import './_lib/ttsQuota.js' -> .ts, dan edit api/tts.ts
            // langsung berlaku tanpa restart dev server.
            const { default: ttsHandler } = await server.ssrLoadModule('/api/tts.ts');
            await ttsHandler(req as any, vercelRes);
          } catch (err: any) {
            console.error('[Local Dev TTS API] Error:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err?.message || 'Server error' }));
          }
        });
      });
    },
  };
}

// ── Dev middleware untuk /api/zhanotes-cloud (sinkron awan ZhaNotes) ─────────
// Tanpa ini, `vite dev` menyajikan file api/zhanotes-cloud.ts sebagai JavaScript
// (bukan menjalankan fungsinya), sehingga sinkron terbaca "belum aktif" di lokal.
// Handler produksi dijalankan APA ADANYA, jadi perilaku dev = produksi. Env
// (ZHANOTES_TOKEN, BLOB_READ_WRITE_TOKEN, Upstash/KV) dibaca dari .env / .env.local.
// Beda dengan chat/tts: body bisa biner (potongan terenkripsi), jadi dibaca sebagai
// Buffer lalu diberikan seperti Vercel (JSON -> objek, selain itu -> Buffer).
function localZhaNotesCloudDevPlugin(): Plugin {
  return {
    name: 'local-zhanotes-cloud-dev-middleware',
    apply: 'serve', // HANYA aktif saat dev server (vite dev), tidak dipanggil saat build
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!/^\/api\/zhanotes-cloud(?:\?|$)/.test(req.url || '')) return next();

        const chunks: Buffer[] = [];
        req.on('data', (c: Buffer) => chunks.push(Buffer.from(c)));
        req.on('end', async () => {
          try {
            const raw = Buffer.concat(chunks);
            const url = new URL(req.url || '', 'http://localhost');
            const ctype = String(req.headers['content-type'] || '');
            let body: unknown = undefined;
            if (raw.length) {
              if (ctype.includes('application/json')) {
                try {
                  body = JSON.parse(raw.toString('utf8'));
                } catch (_) {
                  body = {};
                }
              } else {
                body = raw;
              }
            }
            (req as any).query = Object.fromEntries(url.searchParams);
            (req as any).body = body;

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
            vercelRes.send = function (data: any) {
              if (!this.getHeader('Content-Type')) this.setHeader('Content-Type', 'application/octet-stream');
              this.end(Buffer.isBuffer(data) ? data : typeof data === 'string' ? data : JSON.stringify(data));
              return this;
            };

            const { default: cloudHandler } = await server.ssrLoadModule('/api/zhanotes-cloud.ts');
            await cloudHandler(req as any, vercelRes);
          } catch (err: any) {
            console.error('[Local Dev ZhaNotes Cloud API] Error:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'INTERNAL_SERVER_ERROR', detail: err?.message || 'Server error' }));
          }
        });
      });
    },
  };
}

function localStaticRoutesPlugin(): Plugin {
  return {
    name: 'local-static-routes',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const rawUrl = req.url || '';
        const pathOnly = rawUrl.split('?')[0];
        if (pathOnly === '/zhanotes' || pathOnly === '/zhanotes/') {
          req.url = '/zhanotes/index.html' + (rawUrl.includes('?') ? rawUrl.slice(rawUrl.indexOf('?')) : '');
        } else if (pathOnly === '/demos' || pathOnly === '/demos/') {
          req.url = '/demos/index.html' + (rawUrl.includes('?') ? rawUrl.slice(rawUrl.indexOf('?')) : '');
        }
        next();
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Handler api/*.ts membaca process.env langsung (persis seperti di Vercel), jadi
  // salin semua variabel dari .env / .env.local ke process.env. Variabel yang
  // sudah di-set dari shell tidak ditimpa.
  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] === undefined) process.env[key] = value;
  }

  // Build ID unik setiap deploy — dipakai sebagai versi cache key localStorage
  // Sehingga setiap code update di production otomatis invalidate chat history lama
  const buildId = `${Date.now()}`;

  return {
    plugins: [react(), tailwindcss(), localChatDevPlugin(), localTtsDevPlugin(), localZhaNotesCloudDevPlugin(), localStaticRoutesPlugin()],
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
        '@': path.resolve(ROOT_DIR, '.'),
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