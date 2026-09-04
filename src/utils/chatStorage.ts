/**
 * chatStorage.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Utility untuk menyimpan & memuat chat history ke localStorage/sessionStorage.
 *
 * Aturan:
 * 1. Di LOCALHOST → tidak menyimpan apa pun (selalu fresh state)
 * 2. Di PRODUCTION → simpan ke localStorage dengan key yang mengandung BUILD_ID
 *    Setiap deploy baru = BUILD_ID baru = cache lama otomatis terinvalidasi
 * 3. Gemini conversation history (untuk konteks AI) → sessionStorage
 *    (hilang saat tab ditutup, tapi bertahan selama sesi browsing)
 */

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Cek apakah running di localhost / dev environment */
export function isLocalhost(): boolean {
  if (typeof window === 'undefined') return false;
  const { hostname } = window.location;
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname.startsWith('192.168.') ||
    hostname.endsWith('.local')
  );
}

/**
 * Buat versioned key untuk localStorage.
 * Key mengandung BUILD_ID sehingga setiap deploy production otomatis
 * menghasilkan key baru → data lama tidak terbaca → cache ter-invalidate.
 */
function makeKey(widgetId: string, dataType: 'messages' | 'history'): string {
  // __CHAT_BUILD_ID__ diinjeksi oleh vite.config.ts pada saat build
  const buildId = typeof __CHAT_BUILD_ID__ !== 'undefined' ? __CHAT_BUILD_ID__ : 'dev';
  return `arzha_chat_v${buildId}_${widgetId}_${dataType}`;
}

// ── Message Persistence (localStorage) ────────────────────────────────────────

/**
 * Simpan array messages ke localStorage.
 * Diabaikan di localhost, dibatasi maksimum 50 pesan terakhir.
 */
export function saveMessages<T>(widgetId: string, messages: T[]): void {
  if (isLocalhost()) return; // ← tidak cache di localhost
  try {
    const key = makeKey(widgetId, 'messages');
    // Simpan max 50 pesan terakhir agar localStorage tidak membengkak
    const toSave = messages.slice(-50);
    localStorage.setItem(key, JSON.stringify(toSave));
  } catch {
    // Abaikan StorageQuotaExceeded atau private browsing restrictions
  }
}

/**
 * Muat messages dari localStorage.
 * Returns null jika tidak ada data, di localhost, atau data rusak.
 */
export function loadMessages<T>(widgetId: string): T[] | null {
  if (isLocalhost()) return null; // ← tidak pakai cache di localhost
  try {
    const key = makeKey(widgetId, 'messages');
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

// ── Gemini History Persistence (sessionStorage) ────────────────────────────────

/**
 * Simpan Gemini conversation history ke sessionStorage.
 * sessionStorage bertahan selama tab terbuka, hilang saat tab/browser ditutup.
 * Tetap diabaikan di localhost.
 */
export function saveGeminiHistory<T>(widgetId: string, history: T[]): void {
  if (isLocalhost()) return;
  try {
    const key = `arzha_gemini_${widgetId}_history`;
    sessionStorage.setItem(key, JSON.stringify(history.slice(-12)));
  } catch {
    // Ignore
  }
}

/**
 * Muat Gemini conversation history dari sessionStorage.
 */
export function loadGeminiHistory<T>(widgetId: string): T[] {
  if (isLocalhost()) return [];
  try {
    const key = `arzha_gemini_${widgetId}_history`;
    const raw = sessionStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Hapus cache chat tertentu (localStorage & sessionStorage).
 * Berguna saat user menekan tombol clear/reset chat.
 */
export function clearChatStorage(widgetId: string): void {
  if (isLocalhost()) return;
  try {
    const keyMsg = makeKey(widgetId, 'messages');
    localStorage.removeItem(keyMsg);
    const keyHist = `arzha_gemini_${widgetId}_history`;
    sessionStorage.removeItem(keyHist);
  } catch {
    // Ignore
  }
}

// ── Cleanup ────────────────────────────────────────────────────────────────────

/**
 * Hapus semua entry localStorage yang milik chat Arzha tapi BUKAN dari build saat ini.
 * Dipanggil sekali saat app load untuk membersihkan cache lama secara otomatis.
 */
export function cleanupStaleCache(): void {
  if (isLocalhost()) return;
  try {
    const buildId = typeof __CHAT_BUILD_ID__ !== 'undefined' ? __CHAT_BUILD_ID__ : 'dev';
    const currentPrefix = `arzha_chat_v${buildId}_`;
    const staleKeys: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('arzha_chat_v') && !key.startsWith(currentPrefix)) {
        staleKeys.push(key);
      }
    }
    staleKeys.forEach((k) => localStorage.removeItem(k));
    if (staleKeys.length > 0) {
      console.info(`[chatStorage] Cleaned ${staleKeys.length} stale cache entries from previous build.`);
    }
  } catch {
    // Ignore
  }
}


