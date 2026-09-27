import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUsage, getMonthlyLimit } from './_lib/ttsQuota';

// PIN ini SENGAJA cuma disimpan sebagai env var server-side (Vercel env
// vars, bukan VITE_*/NEXT_PUBLIC_* dsb) -- jangan pernah di-expose ke
// frontend bundle. Kalau di-hardcode/di-inject ke client JS, siapapun yang
// buka devtools bisa baca isinya, jadi PIN-nya gak ada gunanya. Endpoint
// ini minta user (kamu) ngetik PIN manual tiap buka modal easter egg-nya.
const TTS_USAGE_PIN = process.env.TTS_USAGE_PIN;

// Rate limit ringan per IP -- endpoint ini nerima PIN dari request, jadi
// perlu dijagain dari brute-force nebak PIN pendek. Pola sama seperti
// checkRateLimit di tts.ts, dipisah biar gak nyampur sama rate limit TTS.
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const rateLimitMap = new Map<string, RateLimitRecord>();
const RATE_LIMIT_PER_IP = 8; // 8 percobaan / menit / IP -- cukup buat salah ketik beberapa kali, gak cukup buat brute-force
const RATE_WINDOW = 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (record.count >= RATE_LIMIT_PER_IP) return false;
  record.count += 1;
  return true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-tts-usage-pin');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  if (!TTS_USAGE_PIN) {
    // Belum di-setting -- tolak semua request daripada kebuka tanpa proteksi.
    return res.status(503).json({ error: 'TTS_USAGE_PIN belum dikonfigurasi di server' });
  }

  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Terlalu banyak percobaan, coba lagi sebentar' });
  }

  const providedPin = req.headers['x-tts-usage-pin'];
  if (providedPin !== TTS_USAGE_PIN) {
    return res.status(401).json({ error: 'PIN salah' });
  }

  try {
    const [chirpUsed, wavenetUsed, standardUsed] = await Promise.all([
      getUsage('chirp'),
      getUsage('wavenet'),
      getUsage('standard'),
    ]);

    return res.status(200).json({
      chirp: { used: chirpUsed, limit: getMonthlyLimit('chirp') },
      wavenet: { used: wavenetUsed, limit: getMonthlyLimit('wavenet') },
      standard: { used: standardUsed, limit: getMonthlyLimit('standard') },
    });
  } catch (error) {
    console.error('[tts-usage.ts] Gagal ambil usage dari Redis:', error);
    return res.status(502).json({ error: 'Gagal ambil data usage dari Redis' });
  }
}
