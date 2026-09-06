// ─────────────────────────────────────────────────────────────────────────
// Storage percakapan chat widget — berbasis IndexedDB.
//
// Kenapa pindah dari localStorage/sessionStorage:
// - localStorage cuma ~5–10MB per origin, synchronous (bisa nge-block main
//   thread), dan cuma nyimpen SATU percakapan flat — nggak cocok kalau mau
//   banyak riwayat obrolan tersimpan sekaligus.
// - sessionStorage otomatis kosong tiap tab baru dibuka, makanya AI
//   "amnesia" walau bubble chat lama masih kelihatan (itu dari localStorage).
// - IndexedDB masuk pool storage yang jauh lebih besar (StorageManager),
//   async (nggak blocking UI), dan wajar dipakai buat nyimpen banyak record
//   (di sini: banyak "percakapan", masing-masing dengan history sendiri).
//
// Satu percakapan = { messages (buat ditampilkan), geminiHistory (konteks
// yang dikirim ke AI) }. Widget bisa punya banyak percakapan tersimpan,
// tapi cuma satu yang "aktif" per botKey (mis. 'zannah') di satu waktu.
// ─────────────────────────────────────────────────────────────────────────

const DB_NAME = 'portfolio-chat-db';
const DB_VERSION = 1;
const STORE_CONVERSATIONS = 'conversations';
const STORE_SETTINGS = 'settings';

export interface StoredConversation<TMessage = unknown, THistory = unknown> {
  id: string;
  botKey: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: TMessage[];
  geminiHistory: THistory[];
}

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDB(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      // Lingkungan tanpa IndexedDB (SSR, browser lawas, dsb) — degradasi
      // dengan aman: chat tetap jalan, cuma nggak persist antar-sesi.
      resolve(null);
      return;
    }
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_CONVERSATIONS)) {
          const store = db.createObjectStore(STORE_CONVERSATIONS, { keyPath: 'id' });
          store.createIndex('botKey', 'botKey', { unique: false });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
          db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
        }
      };

      req.onsuccess = () => resolve(req.result);
      req.onerror = () => {
        console.warn('[chatStorage] Gagal membuka IndexedDB, chat tidak akan tersimpan permanen.', req.error);
        resolve(null);
      };
    } catch (err) {
      console.warn('[chatStorage] IndexedDB tidak tersedia:', err);
      resolve(null);
    }
  });

  return dbPromise;
}

function store(db: IDBDatabase, name: string, mode: IDBTransactionMode) {
  return db.transaction(name, mode).objectStore(name);
}

function genId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Judul singkat diambil dari pesan user pertama, biar gampang dikenali di daftar riwayat. */
export function deriveConversationTitle(messages: Array<{ sender?: string; text?: string }>): string {
  const firstUser = messages.find((m) => m.sender === 'user' && m.text?.trim());
  if (firstUser?.text) {
    const clean = firstUser.text.trim().replace(/\s+/g, ' ');
    return clean.length > 40 ? `${clean.slice(0, 40)}…` : clean;
  }
  return 'Obrolan Baru';
}

/** Varian deriveConversationTitle untuk bentuk pesan { role, content } (dipakai AIChatbotShowcase). */
export function deriveConversationTitleFromRoleContent(messages: Array<{ role?: string; content?: string }>): string {
  const firstUser = messages.find((m) => m.role === 'user' && m.content?.trim());
  if (firstUser?.content) {
    const clean = firstUser.content.trim().replace(/\s+/g, ' ');
    return clean.length > 40 ? `${clean.slice(0, 40)}…` : clean;
  }
  return 'Obrolan Baru';
}

async function getSetting(key: string): Promise<string | undefined> {
  const db = await openDB();
  if (!db) return undefined;
  return new Promise((resolve) => {
    const req = store(db, STORE_SETTINGS, 'readonly').get(key);
    req.onsuccess = () => resolve((req.result as { value: string } | undefined)?.value);
    req.onerror = () => resolve(undefined);
  });
}

async function setSetting(key: string, value: string): Promise<void> {
  const db = await openDB();
  if (!db) return;
  return new Promise((resolve) => {
    const req = store(db, STORE_SETTINGS, 'readwrite').put({ key, value });
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
  });
}

/** Bikin percakapan baru & langsung jadikan aktif buat botKey ini. */
export async function createConversation<TMessage = unknown>(
  botKey: string,
  initialMessages: TMessage[] = []
): Promise<StoredConversation<TMessage>> {
  const now = Date.now();
  const conv: StoredConversation<TMessage> = {
    id: genId(),
    botKey,
    title: 'Obrolan Baru',
    createdAt: now,
    updatedAt: now,
    messages: initialMessages,
    geminiHistory: [],
  };

  const db = await openDB();
  if (db) {
    await new Promise<void>((resolve) => {
      const req = store(db, STORE_CONVERSATIONS, 'readwrite').put(conv);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  }
  await setSetting(`active:${botKey}`, conv.id);
  return conv;
}

/** Ambil id percakapan yang lagi aktif; bikin baru otomatis kalau belum ada. */
export async function getActiveConversationId(botKey: string): Promise<string> {
  const existingId = await getSetting(`active:${botKey}`);
  if (existingId) {
    const conv = await loadConversation(existingId);
    if (conv) return existingId;
  }
  const created = await createConversation(botKey);
  return created.id;
}

export async function setActiveConversationId(botKey: string, id: string): Promise<void> {
  await setSetting(`active:${botKey}`, id);
}

export async function loadConversation<TMessage = unknown, THistory = unknown>(
  id: string
): Promise<StoredConversation<TMessage, THistory> | undefined> {
  const db = await openDB();
  if (!db) return undefined;
  return new Promise((resolve) => {
    const req = store(db, STORE_CONVERSATIONS, 'readonly').get(id);
    req.onsuccess = () => resolve(req.result as StoredConversation<TMessage, THistory> | undefined);
    req.onerror = () => resolve(undefined);
  });
}

/** Upsert sebagian field percakapan (messages / geminiHistory / title). */
export async function saveConversation<TMessage = unknown, THistory = unknown>(
  id: string,
  botKey: string,
  patch: Partial<Pick<StoredConversation<TMessage, THistory>, 'messages' | 'geminiHistory' | 'title'>>
): Promise<void> {
  const db = await openDB();
  if (!db) return;

  const existing = (await loadConversation<TMessage, THistory>(id)) ?? {
    id,
    botKey,
    title: 'Obrolan Baru',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [] as TMessage[],
    geminiHistory: [] as THistory[],
  };

  const updated: StoredConversation<TMessage, THistory> = {
    ...existing,
    ...patch,
    id,
    botKey,
    updatedAt: Date.now(),
  };

  await new Promise<void>((resolve) => {
    const req = store(db, STORE_CONVERSATIONS, 'readwrite').put(updated);
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
  });
}

/** Daftar semua percakapan milik satu bot, terbaru duluan — buat jendela riwayat. */
export async function listConversations<TMessage = unknown>(
  botKey: string
): Promise<StoredConversation<TMessage>[]> {
  const db = await openDB();
  if (!db) return [];
  return new Promise((resolve) => {
    const results: StoredConversation<TMessage>[] = [];
    const index = store(db, STORE_CONVERSATIONS, 'readonly').index('botKey');
    const req = index.openCursor(IDBKeyRange.only(botKey));
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        results.push(cursor.value as StoredConversation<TMessage>);
        cursor.continue();
      } else {
        results.sort((a, b) => b.updatedAt - a.updatedAt);
        resolve(results);
      }
    };
    req.onerror = () => resolve([]);
  });
}

export async function deleteConversation(id: string): Promise<void> {
  const db = await openDB();
  if (!db) return;
  await new Promise<void>((resolve) => {
    const req = store(db, STORE_CONVERSATIONS, 'readwrite').delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
  });
}

// ─────────────────────────────────────────────────────────────────────────
// Pembersihan cache lama — dipanggil sekali saat startup (mis. dari
// main.tsx) untuk beres-beres sisa data dari era localStorage/sessionStorage
// sebelum migrasi ke IndexedDB, plus memangkas percakapan IndexedDB yang
// sudah terlalu lama nganggur biar storage nggak numpuk tanpa batas.
// ─────────────────────────────────────────────────────────────────────────

/** Prefix key localStorage/sessionStorage lama yang perlu dibersihkan (sesuaikan kalau beda). */
const LEGACY_KEY_PREFIXES = ['chat_', 'gemini_history_', 'zannah_', 'kania_', 'portfolio-chat_'];

const STALE_CONVERSATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 hari

function clearLegacyWebStorage(): void {
  const clearFrom = (webStorage: Storage | undefined) => {
    if (!webStorage) return;
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < webStorage.length; i++) {
        const key = webStorage.key(i);
        if (key && LEGACY_KEY_PREFIXES.some((prefix) => key.startsWith(prefix))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => webStorage.removeItem(key));
    } catch (err) {
      console.warn('[chatStorage] Gagal membersihkan web storage lama:', err);
    }
  };

  if (typeof localStorage !== 'undefined') clearFrom(localStorage);
  if (typeof sessionStorage !== 'undefined') clearFrom(sessionStorage);
}

async function pruneStaleConversations(): Promise<void> {
  const db = await openDB();
  if (!db) return;

  const cutoff = Date.now() - STALE_CONVERSATION_MS;

  await new Promise<void>((resolve) => {
    const tx = db.transaction(STORE_CONVERSATIONS, 'readwrite');
    const index = tx.objectStore(STORE_CONVERSATIONS).index('updatedAt');
    // Rentang dari waktu paling awal (0) sampai cutoff — semua yang lebih lama dihapus.
    const req = index.openCursor(IDBKeyRange.upperBound(cutoff));
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        resolve();
      }
    };
    req.onerror = () => resolve();
  });
}

/**
 * Bersihkan cache/storage basi: sisa key localStorage & sessionStorage dari
 * versi sebelum IndexedDB, dan percakapan IndexedDB yang sudah tidak
 * diperbarui lebih dari 30 hari. Aman dipanggil berkali-kali (idempotent)
 * dan tidak melempar error kalau storage tidak tersedia.
 */
export async function cleanupStaleCache(): Promise<void> {
  clearLegacyWebStorage();
  await pruneStaleConversations();
}