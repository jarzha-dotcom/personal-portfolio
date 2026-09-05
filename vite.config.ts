import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv, Plugin } from 'vite';

const SYSTEM_INSTRUCTION = `Kamu adalah "Zannah", AI Tech Consultant & Business Assistant pribadi dari K. Arzhaning Jagad (Arzha) — Indie Developer & Data Specialist berpengalaman 7+ tahun di Cibitung, Bekasi.

PERAN & KARAKTER UTAMA:
- Kamu adalah konsultan teknologi yang ramah, santai (panggil "Kak"), cerdas, dan punya insting sales konsultatif (consultative selling) tingkat tinggi.
- Gaya bicaramu luwes seperti teman ngobrol tech yang solutif: hangat, solutif, transparan, dan tidak kaku/robotik.
- Misimu: Membantu pengunjung memahami solusi teknis terbaik untuk ide/bisnis mereka, sekaligus secara halus & elegan mengarahkan mereka untuk menggunakan jasa pengembangan dari Mas Arzha.

KEAHLIAN & PRODUCT KNOWLEDGE LENGKAP:
1. Profil & Keunikan Arzha (USP):
   - Menggabungkan ketelitian audit korporat 7+ tahun (data akurat 99%, 100+ audit SOP terselesaikan) dengan kapabilitas modern software engineering.
   - Keuntungan Klien: Aplikasi tidak cuma cantik, tapi logic bisnis rapi, minim bug, data aman, dan arsitektur scalable.

2. Portofolio Live & Bukti Nyata:
   - Zannah AI (Living Proof) → Chatbot AI interaktif di website ini adalah bukti langsung kemampuan Mas Arzha membangun sistem AI cerdas, serverless, responsif, hemat kuota, dan aman dari jailbreak.
   - B-Games (https://bgames.byarzhaning.online/) → Platform multiplayer board game realtime (Ludo, Ular Tangga, Tic Tac Toe) dengan lobby room, state sync, haptic audio. Stack: React Native/Expo, boardgame.io, Node.js/Koa, Supabase, WebSockets. (Rujukan proyek interaktif/realtime/game).
   - Rajendra Pintar (https://rajendrapintar.byarzhaning.online/) → App edukasi anak dwibahasa (ID/EN) dengan fitur Text-to-Speech (TTS), quiz interaktif, PWA offline & Android Capacitor. (Rujukan app edukasi, konten suara, atau mobile ramah anak).
   - Assets GMP (https://assets-gmp.vercel.app/) → Sistem manajemen & audit inventaris aset internal perusahaan, pelacakan mutasi, audit log, export report Excel/PDF. (Rujukan dashboard internal, POS, mini ERP, atau manajemen data perusahaan).

3. Layanan, Estimasi Pengerjaan & Harga:
   - AI Chatbot Custom (Web / Bisnis): Mulai Rp1.500.000 (1-2 minggu) — Integrasi LLM (Gemini, GPT, Claude), custom knowledge base bisnis, arsitektur serverless aman (API key terlindungi), guardrail anti-jailbreak, multi-bahasa, plus opsi Voice/TTS.
   - Landing Page / Web Profil Bisnis: Mulai Rp800.000 (1-2 minggu) — Desain modern, ultra responsif, SEO-ready, conversion-focused.
   - Company Profile / Web App Sederhana: Mulai Rp2.500.000 (2-3 minggu) — Desain multi-halaman custom & form interaktif.
   - Web App Custom / Dashboard Operasional: Mulai Rp6.000.000 (3-6 minggu) — Custom workflow, role permission, manajemen database, integrasi report/export.
   - Mobile App (Android / Cross-platform): Mulai Rp6.000.000 (3-6 minggu) — Performa cepat, offline capability, UI/UX intuitif.
   - Realtime Game / Platform Interaktif: Mulai Rp12.000.000 (4-8 minggu) — Sistem room code, multiplayer sinkron, backend socket stabil.
   - Otomatisasi Data & Sistem Audit Internal: Berdasarkan kompleksitas kebutuhan data.

4. Value & Jaminan Keamanan Klien (Risk Reversal):
   - Pembayaran Bertahap (Milestone-based): Klien bayar sesuai progress — hasil kelihatan dulu baru bayar tahap berikutnya.
   - Garansi Penuh: Gratis maintenance & technical support selama 1 bulan pasca-launching.
   - Promo Peluncuran Terbatas: Diskon khusus 15% + free konsultasi arsitektur untuk 5 klien pertama bulan ini!

STRATEGI SALES CERDAS & HALUS (SMART SOFT-SELLING):
1. Formula Jawaban (Value First -> Bridge -> Call to Curiosity):
   - Berikan jawaban / saran teknis yang bernilai dan mencerahkan terlebih dahulu (1-3 kalimat).
   - Kaitkan secara natural (bridge) dengan pengalaman Arzha atau portofolio yang relevan (misal: "Kebetulan sistem chatbot seperti saya ini dibuat Mas Arzha mulai dari 1,5jt dengan custom knowledge base...").
   - Akhiri SELALU dengan 1 pertanyaan pancingan santai atau ajakan diskusi fitur spesifik.

2. Cerdas Memanfaatkan Buying Signals:
   - Jika tanya CHATBOT / CS OTOMATIS / TANYA TENTANG ZANNAH: Banggakan secara santai bahwa Zannah sendiri adalah contoh hidup (*live proof*) AI bot buatan Mas Arzha. Jelaskan manfaat chatbot AI untuk otomatisasi CS 24/7 dan konversi leads, lalu tanyakan kebutuhan bisnis user.
   - Jika tanya HARGA/BIAYA: Berikan range harga awal yang transparan, sebutkan promo diskon 15%, lalu tanyakan fitur inti yang ingin dibuat agar bisa kasih estimasi lebih presisi.
   - Jika tanya TEKNOLOGI/STACK: Jelaskan stack modern yang dipakai (React, Supabase, Node.js, AI APIs, dll.) beserta alasannya (cepat, hemat biaya server, mudah dikembangkan), lalu tanyakan platform target mereka.
   - Jika tanya BIKIN APLIKASI/IDE TERTENTU: Validasi idenya ("Wah menarik banget idenya kak!"), berikan gambaran alur arsitekturnya secara simpel, lalu tawarkan pembuatan rancangan kasarnya bersama Mas Arzha.
   - Jika SKEPTIS / RAGU: Tanggapi dengan santai dan empati ("Hehe wajar banget kok kak 😊"). Tunjukkan bukti nyata dengan merekomendasikan coba link demo live portofolio dan ingatkan sistem pembayaran termin per progress tanpa risiko.

3. Fitur Cerdas: One-Click WhatsApp Brief Generator (+6282312312734):
   - Jangan buru-buru lempar nomor WA di awal obrolan sapaan.
   - KETIKA user sudah menceritakan proyek/fitur spesifik atau meminta estimasi/kontak, buatkan link WhatsApp yang sudah terisi otomatis (URL encoded) sehingga user tinggal klik:
     Format: [💬 Lanjut Diskusi ke WhatsApp Mas Arzha](https://wa.me/6282312312734?text=Halo%20Mas%20Arzha,%20saya%20tadi%20diskusi%20dengan%20Zannah%20tentang%20proyek%20<NAMA_PROYEK>.<DETAIL_SINGKAT_URL_ENCODED>)
   - Ini membuat calon klien sangat nyaman karena tidak perlu mengetik ulang idenya di WhatsApp.

FORMAT & BATASAN KOMUNIKASI:
- Panjang respon ideal: 2-4 kalimat padat, to-the-point, dan berbobot. Jika memberikan estimasi kasar proyek, gunakan format poin-poin yang rapi dan ringkas.
- Pastikan kalimat selalu tuntas sampai tanda baca akhir (jangan menggantung).
- Selalu bawa suasana obrolan yang menyenangkan, solutif, dan profesional.`;

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

// ── Dev middleware untuk /api/tts (GCP Text-to-Speech) ──────────────────────
// Mirror dari api/tts.ts (endpoint produksi Vercel), supaya fitur Voice Chat
// bisa dites di local dev tanpa perlu `vercel dev`. Tidak ada rate limiting
// di sini (dev only) — rate limiting tetap berlaku di api/tts.ts produksi.
//
// CATATAN: id-ID-Neural2-* kemungkinan besar TIDAK tersedia di GCP TTS.
// id-ID-Wavenet-A dipakai sebagai default. Cek voice aktual via:
//   GET https://texttospeech.googleapis.com/v1/voices?languageCode=id-ID&key=API_KEY
const TTS_DEFAULT_VOICE = 'id-ID-Chirp3-HD-Zephyr';
const TTS_ALLOWED_VOICES = new Set([
  // Google DeepMind Chirp3 HD Voices (Ultra Realistic)
  'id-ID-Chirp3-HD-Zephyr',
  'id-ID-Chirp3-HD-Achernar',
  'id-ID-Chirp3-HD-Aoede',
  'id-ID-Chirp3-HD-Autonoe',
  'id-ID-Chirp3-HD-Callirrhoe',
  'id-ID-Chirp3-HD-Despina',
  'id-ID-Chirp3-HD-Erinome',
  'id-ID-Chirp3-HD-Gacrux',
  'id-ID-Chirp3-HD-Kore',
  'id-ID-Chirp3-HD-Laomedeia',
  'id-ID-Chirp3-HD-Leda',
  'id-ID-Chirp3-HD-Pulcherrima',
  'id-ID-Chirp3-HD-Sulafat',
  'id-ID-Chirp3-HD-Vindemiatrix',
  'id-ID-Chirp3-HD-Achird',
  'id-ID-Chirp3-HD-Algenib',
  'id-ID-Chirp3-HD-Algieba',
  'id-ID-Chirp3-HD-Alnilam',
  'id-ID-Chirp3-HD-Charon',
  'id-ID-Chirp3-HD-Enceladus',
  'id-ID-Chirp3-HD-Fenrir',
  'id-ID-Chirp3-HD-Iapetus',
  'id-ID-Chirp3-HD-Orus',
  'id-ID-Chirp3-HD-Puck',
  'id-ID-Chirp3-HD-Rasalgethi',
  'id-ID-Chirp3-HD-Sadachbia',
  'id-ID-Chirp3-HD-Sadaltager',
  'id-ID-Chirp3-HD-Schedar',
  'id-ID-Chirp3-HD-Umbriel',
  'id-ID-Chirp3-HD-Zubenelgenubi',
  // Wavenet & Standard Voices
  'id-ID-Wavenet-A',
  'id-ID-Wavenet-B',
  'id-ID-Wavenet-C',
  'id-ID-Wavenet-D',
  'id-ID-Standard-A',
  'id-ID-Standard-B',
  'id-ID-Standard-C',
  'id-ID-Standard-D',
]);
const TTS_MAX_CHARS = 800;

function normalizeIndonesianForSpeechDev(text: string): string {
  let s = text;

  // 1. Link & WhatsApp
  s = s.replace(/https?:\/\/(?:wa\.me\S*|\S+)/gi, ' tautan WhatsApp ');
  s = s.replace(/\bwa\.me\S*/gi, ' tautan WhatsApp ');
  s = s.replace(/\bWA\b/g, 'WhatsApp');

  // 2. Format Rentang Harga (Range): Rp1.5jt - Rp2.5jt / Rp800rb - 1.5jt
  s = s.replace(/Rp\s*(\d+(?:[.,]\d+)?)\s*(?:jt|juta)?\s*[-–—]\s*(?:Rp\s*)?(\d+(?:[.,]\d+)?)\s*(?:jt|juta)\b/gi, '$1 sampai $2 juta rupiah');
  s = s.replace(/Rp\s*(\d+(?:[.,]\d+)?)\s*(?:rb|ribu)?\s*[-–—]\s*(?:Rp\s*)?(\d+(?:[.,]\d+)?)\s*(?:rb|ribu)\b/gi, '$1 sampai $2 ribu rupiah');
  s = s.replace(/(\d+(?:[.,]\d+)?)\s*(?:jt|juta)\s*[-–—]\s*(\d+(?:[.,]\d+)?)\s*(?:jt|juta)\b/gi, '$1 sampai $2 juta');
  s = s.replace(/(\d+(?:[.,]\d+)?)\s*(?:rb|ribu)\s*[-–—]\s*(\d+(?:[.,]\d+)?)\s*(?:rb|ribu)\b/gi, '$1 sampai $2 ribu');

  // 3. Format Rentang Angka Umum (mis: 1-2 hari, 3-5 minggu, 7+ tahun)
  s = s.replace(/(\d+)\s*[-–—]\s*(\d+)\s*(hari|minggu|bulan|tahun|orang|item|halaman)/gi, '$1 sampai $2 $3');
  s = s.replace(/(\d+)\+\s*(tahun|bulan|hari|proyek|klien)/gi, '$1 $2 lebih');

  // 4. Format Mata Uang Rupiah dengan Jutaan (mis: Rp1.5jt, Rp 1,5 jt, Rp1.500.000, Rp2.000.000)
  s = s.replace(/Rp\s*(\d+)\.000\.000(?:,-\b)?/gi, '$1 juta rupiah');
  s = s.replace(/Rp\s*(\d+)\.500\.000(?:,-\b)?/gi, '$1,5 juta rupiah');
  s = s.replace(/Rp\s*(\d+(?:[.,]\d+)?)\s*(?:jt|juta)\b/gi, '$1 juta rupiah');

  // 5. Format Mata Uang Rupiah dengan Ribuan (mis: Rp800rb, Rp 800 rb, Rp800.000, Rp50.000)
  s = s.replace(/Rp\s*(\d+)\.000(?:,-\b)?/gi, '$1 ribu rupiah');
  s = s.replace(/Rp\s*(\d+(?:[.,]\d+)?)\s*(?:rb|ribu)\b/gi, '$1 ribu rupiah');
  s = s.replace(/Rp\s*(\d+(?:[.,]\d+)?)\s*(?:k|K)\b/gi, '$1 ribu rupiah');
  s = s.replace(/Rp\s*(\d+)(?:,-\b)?/gi, '$1 rupiah');

  // 6. Standalone angka ribuan / jutaan tanpa 'Rp' (mis: 800rb, 1.5jt, 500k)
  s = s.replace(/(\d+(?:[.,]\d+)?)\s*(?:jt|juta)\b/gi, '$1 juta');
  s = s.replace(/(\d+(?:[.,]\d+)?)\s*(?:rb|ribu)\b/gi, '$1 ribu');
  s = s.replace(/(\d+)\s*(?:k|K)\b/g, '$1 ribu');

  // 7. Nama Proyek & Portofolio Khusus
  s = s.replace(/\bB-Games\b|\bB Games\b|\bBGames\b/gi, 'Bi-Geims');
  s = s.replace(/\bAssets GMP\b|\bAsset GMP\b/gi, 'Aset J-M-P');
  s = s.replace(/\bPT GMP\b/gi, 'P-T J-M-P');

  // 8. Istilah Pemrograman & Tech Stack Multi-Kata (harus sebelum single-word)
  s = s.replace(/\bReact Native\b/gi, 'Riek Neitif');
  s = s.replace(/\bReact\.?js\b|\bReactJS\b|\bReact js\b/gi, 'Riek J-S');
  s = s.replace(/\bNext\.?js\b|\bNextJS\b|\bNext js\b/gi, 'Neks J-S');
  s = s.replace(/\bNode\.?js\b|\bNodeJS\b|\bNode js\b/gi, 'Noud J-S');
  s = s.replace(/\bVue\.?js\b|\bVueJS\b|\bVue js\b/gi, 'Vyu J-S');
  s = s.replace(/\bExpress\.?js\b|\bExpressJS\b|\bExpress js\b/gi, 'Ekspres J-S');
  s = s.replace(/\bTailwind\s*CSS\b|\bTailwindCSS\b/gi, 'Teilwind C-S-S');
  s = s.replace(/\bREST(?:ful)?\s*APIs?\b/gi, 'Rest A-P-I');
  s = s.replace(/\bWebSockets?\b/gi, 'Websoket');
  s = s.replace(/\bboardgame\.io\b/gi, 'Boardgame I-O');
  s = s.replace(/\bLucide\s*Icons?\b|\bLucide\b/gi, 'Lusid Aikon');
  s = s.replace(/\bSAP\s+Business\s+One\b/gi, 'S-A-P Bisnis Wan');
  s = s.replace(/\bPoint\s+of\s+Sales?\b/gi, 'Point of Seils');
  s = s.replace(/\bPivot\s+Tables?\b/gi, 'Pivot Teibel');
  s = s.replace(/\bTech\s*Stack\b/gi, 'Tekstek');
  s = s.replace(/\bLanding\s*Pages?\b/gi, 'Lending Peij');
  s = s.replace(/\bLive\s*Demos?\b/gi, 'Laif Demo');
  s = s.replace(/\bReal-?time\b/gi, 'Riltaym');
  s = s.replace(/\bFull-?stack\b/gi, 'Fulstek');
  s = s.replace(/\bFront-?end\b/gi, 'Front-en');
  s = s.replace(/\bBack-?end\b/gi, 'Bek-en');
  s = s.replace(/\bAPI\s*Keys?\b/gi, 'A-P-I Ki');
  s = s.replace(/\bWeb\s*Apps?\b/gi, 'Web-ep');
  s = s.replace(/\bMobile\s*Apps?\b/gi, 'Mobail-ep');

  // 9. Istilah Pemrograman & Tech Stack Tunggal
  s = s.replace(/\bReact\b/g, 'Riek');
  s = s.replace(/\bVite\b/gi, 'Vait');
  s = s.replace(/\bTypeScript\b|\bTypescript\b/gi, 'Taipskrip');
  s = s.replace(/\bJavaScript\b|\bJavascript\b/gi, 'Javaskrip');
  s = s.replace(/\bTailwind\b/gi, 'Teilwind');
  s = s.replace(/\bCapacitor\b/gi, 'Kapasitor');
  s = s.replace(/\bExpo\b/gi, 'Ekspo');
  s = s.replace(/\bPython\b/gi, 'Paiton');
  s = s.replace(/\bMySQL\b/gi, 'Mai Eskuel');
  s = s.replace(/\bPostgreSQL\b|\bPostgres\b/gi, 'Posgres Q-L');
  s = s.replace(/\bMongoDB\b/gi, 'Mongo D-B');
  s = s.replace(/\bSQLite\b/gi, 'Eskuel Lait');
  s = s.replace(/\bSQL\b/g, 'Eskuel');
  s = s.replace(/\bSupabase\b/gi, 'Superbeis');
  s = s.replace(/\bFirebase\b/gi, 'Fairbeis');
  s = s.replace(/\bGraphQL\b/gi, 'Graf Q-L');
  s = s.replace(/\bJSON\b/g, 'Jeison');
  s = s.replace(/\bGitHub\b|\bGithub\b/gi, 'Git-hab');
  s = s.replace(/\bGitLab\b|\bGitlab\b/gi, 'Git-lab');
  s = s.replace(/\bVercel\b/gi, 'Versel');
  s = s.replace(/\bNetlify\b/gi, 'Netlifai');
  s = s.replace(/\bDocker\b/gi, 'Doker');
  s = s.replace(/\bKubernetes\b/gi, 'Kubernetis');
  s = s.replace(/\bGemini\b/g, 'Jeminai');
  s = s.replace(/\bClaude\b/g, 'Klod');
  s = s.replace(/\bChatGPT\b/gi, 'Chet G-P-T');
  s = s.replace(/\bOpenAI\b/gi, 'Open A-I');
  s = s.replace(/\bChatbots?\b|\bChat\s*bot\b/gi, 'Chetbot');
  s = s.replace(/\bLLMs?\b/g, 'L-L-M');
  s = s.replace(/\bFrameworks?\b/gi, 'Freimwork');
  s = s.replace(/\bLibraries\b|\bLibrary\b/gi, 'Laibrari');
  s = s.replace(/\bDeployments?\b/gi, 'Diployment');
  s = s.replace(/\bDeploy\b/gi, 'Diploy');
  s = s.replace(/\bDebuggings?\b/gi, 'Dibaging');
  s = s.replace(/\bBugs?\b/gi, 'Bag');
  s = s.replace(/\bCachings?\b/gi, 'Keshing');
  s = s.replace(/\bCache\b/gi, 'Kesh');
  s = s.replace(/\bDashboard\b/gi, 'Deshboard');
  s = s.replace(/\bFlashcards?\b/gi, 'Fleshkard');

  // 10. Singkatan Bisnis, Audit, dan Dokumen
  s = s.replace(/\bVLOOKUP\b/gi, 'V-Lookup');
  s = s.replace(/\bXLOOKUP\b/gi, 'X-Lookup');
  s = s.replace(/\bExcel\b/gi, 'Eksel');
  s = s.replace(/\bPowerPoint\b/gi, 'Power Point');
  s = s.replace(/\bSAP\b/g, 'S-A-P');
  s = s.replace(/\bPOS\b/g, 'P-O-S');
  s = s.replace(/\bSOP\b/g, 'S-O-P');
  s = s.replace(/\bQC\b/g, 'Q-C');
  s = s.replace(/\bB2B\b/gi, 'Bi tu Bi');
  s = s.replace(/\bHRD\b/g, 'H-R-D');
  s = s.replace(/\bCV\b/g, 'C-V');
  s = s.replace(/\bHTML5\b/gi, 'H-T-M-L lima');
  s = s.replace(/\bHTML\b/g, 'H-T-M-L');
  s = s.replace(/\bCSS3\b/gi, 'C-S-S tiga');
  s = s.replace(/\bCSS\b/g, 'C-S-S');
  s = s.replace(/\bPHP\b/g, 'P-H-P');
  s = s.replace(/\bUI\/UX\b|\bUI-UX\b/gi, 'U-I U-X');
  s = s.replace(/\bUI\b/g, 'U-I');
  s = s.replace(/\bUX\b/g, 'U-X');
  s = s.replace(/\bSEO\b/g, 'S-E-O');
  s = s.replace(/\bSPA\b/g, 'S-P-A');
  s = s.replace(/\bPWA\b/g, 'P-W-A');
  s = s.replace(/\bSaaS\b/gi, 'Saas');
  s = s.replace(/\bDOM\b/g, 'D-O-M');
  s = s.replace(/\bAPI\b/g, 'A-P-I');
  s = s.replace(/\bSOW\b|\bSoW\b/g, 'Scope of Work');

  // 11. Singkatan Kata Bahasa Indonesia
  s = s.replace(/\bdll\.?/gi, 'dan lain-lain');
  s = s.replace(/\bdsb\.?/gi, 'dan sebagainya');
  s = s.replace(/\bdst\.?/gi, 'dan seterusnya');
  s = s.replace(/\bcth\.?/gi, 'contoh');
  s = s.replace(/\bttg\b/gi, 'tentang');
  s = s.replace(/\byg\b/gi, 'yang');
  s = s.replace(/\bdgn\b/gi, 'dengan');
  s = s.replace(/\butk\b/gi, 'untuk');
  s = s.replace(/\bsbg\b/gi, 'sebagai');
  s = s.replace(/\bblm\b/gi, 'belum');
  s = s.replace(/\bsdh\b/gi, 'sudah');
  s = s.replace(/\baja\b/gi, 'saja');
  s = s.replace(/\bgmn\b/gi, 'bagaimana');
  s = s.replace(/\bkpd\b/gi, 'kepada');

  // 12. Pengulangan kata angka 2 (mis: teman2 -> teman-teman)
  s = s.replace(/([a-zA-Z]+)2\b/g, '$1-$1');

  return s;
}

function sanitizeForSpeechDev(raw: string): string {
  const cleaned = raw
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/#{1,6}\s?/g, '')
    .replace(/[_~]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  const normalized = normalizeIndonesianForSpeechDev(cleaned);

  return normalized
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function localTtsDevPlugin(envGcpApiKey: string): Plugin {
  return {
    name: 'local-tts-dev-middleware',
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
  const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
  const gcpApiKey = env.GCP_API_KEY || process.env.GCP_API_KEY || '';

  // Build ID unik setiap deploy — dipakai sebagai versi cache key localStorage
  // Sehingga setiap code update di production otomatis invalidate chat history lama
  const buildId = `${Date.now()}`;

  return {
    plugins: [react(), tailwindcss(), localChatDevPlugin(apiKey), localTtsDevPlugin(gcpApiKey)],
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