/**
 * api/_lib/whatsappState.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Manajemen state, filter kontak, jeda pintar (burst coalescing), riwayat chat
 * 24 jam, serta penjaga kuota bulanan (Meta 950 pesan gratis & Vertex AI Rp5.000)
 * berbasis Upstash Redis dengan fallback memori lokal otomatis untuk lingkungan
 * pengujian / dev lokal.
 */

import { Redis } from '@upstash/redis';

export interface PendingBubble {
    id: string;
    timestamp: number;
    senderName?: string;
    text: string;
    mediaId?: string;
    mediaMimeType?: string;
    mediaKind?: 'image' | 'audio' | 'document';
    filename?: string;
}

export interface WaChatTurn {
    role: 'user' | 'model';
    parts: { text: string }[];
}

export interface WaLastDeliveryInfo {
    state: 'sent' | 'delivered' | 'read' | 'failed' | 'ai_error';
    code?: number;
    detail?: string;
    at: string;
}

export interface WaAdminSnapshot {
    enabled: boolean;
    redisConfigured: boolean;
    metaRepliesUsed: number;
    metaRepliesLimit: number;
    aiSpendIdr: number;
    aiBudgetIdr: number;
    skipList: string[];
    syncedContactsCount: number;
    skipSavedContacts: boolean;
    smartDelaySec: number;
    lastSelfCommand: { cmd: string; at: string } | null;
    lastDelivery: WaLastDeliveryInfo | null;
}

// ── Normalisasi Nomor WhatsApp (Standar Internasional Tanpa '+') ──────────────

/**
 * Mengubah format nomor telepon Indonesia/internasional menjadi digit kanonik
 * sesuai format WhatsApp Cloud API (contoh: "0812-3456-789" -> "628123456789").
 * Mengembalikan string kosong "" jika input adalah grup (@g.us) atau tidak valid.
 */
export function normalizeWaPhone(raw: string | undefined | null): string {
    if (!raw || typeof raw !== 'string') return '';
    const trimmed = raw.trim();
    if (!trimmed || trimmed.includes('@g.us')) return '';

    // Buang sufiks JID jika ada (@s.whatsapp.net / @c.us)
    const withoutJid = trimmed.split('@')[0] || '';
    let digits = withoutJid.replace(/\D/g, '');

    if (digits.startsWith('00')) {
        digits = digits.slice(2);
    } else if (digits.startsWith('08')) {
        digits = '62' + digits.slice(1);
    } else if (digits.startsWith('8') && digits.length >= 9 && digits.length <= 13) {
        digits = '62' + digits;
    }

    if (digits.length < 8 || digits.length > 16) return '';
    return digits;
}

// ── Abstraksi Store (Upstash Redis + Fallback In-Memory untuk Test/Dev) ───────

interface KvAdapter {
    isRedis: boolean;
    getString(key: string): Promise<string | null>;
    setString(key: string, value: string, ttlSec?: number): Promise<void>;
    setNx(key: string, value: string, ttlSec: number): Promise<boolean>;
    del(key: string): Promise<void>;
    incrBy(key: string, amount: number, ttlSec: number): Promise<number>;
    decrBy(key: string, amount: number): Promise<number>;
    sadd(key: string, members: string[]): Promise<void>;
    srem(key: string, members: string[]): Promise<void>;
    sismember(key: string, member: string): Promise<boolean>;
    smembers(key: string): Promise<string[]>;
    scard(key: string): Promise<number>;
    rpush(key: string, item: string, ttlSec: number): Promise<void>;
    lrangeAndDel(key: string): Promise<string[]>;
}

let cachedRedis: Redis | null = null;

export function isWaRedisConfigured(): boolean {
    const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '';
    const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '';
    return Boolean(url.trim() && token.trim());
}

function getUpstashClient(): Redis {
    if (!cachedRedis) {
        const url = (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '').trim();
        const token = (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '').trim();
        cachedRedis = new Redis({ url, token });
    }
    return cachedRedis;
}

// Fallback memori untuk unit test & pengembangan lokal tanpa kredensial Redis
const memStrings = new Map<string, { val: string; exp: number }>();
const memSets = new Map<string, Set<string>>();
const memLists = new Map<string, { items: string[]; exp: number }>();

export function resetWaMemoryStoreForTests(): void {
    memStrings.clear();
    memSets.clear();
    memLists.clear();
    cachedRedis = null;
}

function getMemStringRaw(key: string): string | null {
    const rec = memStrings.get(key);
    if (!rec) return null;
    if (rec.exp > 0 && Date.now() > rec.exp) {
        memStrings.delete(key);
        return null;
    }
    return rec.val;
}

const memoryAdapter: KvAdapter = {
    isRedis: false,
    async getString(key) {
        return getMemStringRaw(key);
    },
    async setString(key, value, ttlSec) {
        memStrings.set(key, {
            val: String(value),
            exp: ttlSec && ttlSec > 0 ? Date.now() + ttlSec * 1000 : 0,
        });
    },
    async setNx(key, value, ttlSec) {
        if (getMemStringRaw(key) !== null) return false;
        memStrings.set(key, { val: String(value), exp: Date.now() + ttlSec * 1000 });
        return true;
    },
    async del(key) {
        memStrings.delete(key);
        memSets.delete(key);
        memLists.delete(key);
    },
    async incrBy(key, amount, ttlSec) {
        const cur = Number(getMemStringRaw(key) ?? '0') || 0;
        const next = cur + amount;
        const existing = memStrings.get(key);
        const exp = existing && existing.exp > Date.now() ? existing.exp : Date.now() + ttlSec * 1000;
        memStrings.set(key, { val: String(next), exp });
        return next;
    },
    async decrBy(key, amount) {
        const cur = Number(getMemStringRaw(key) ?? '0') || 0;
        const next = Math.max(0, cur - amount);
        const existing = memStrings.get(key);
        memStrings.set(key, { val: String(next), exp: existing?.exp ?? 0 });
        return next;
    },
    async sadd(key, members) {
        if (members.length === 0) return;
        let set = memSets.get(key);
        if (!set) {
            set = new Set<string>();
            memSets.set(key, set);
        }
        for (const m of members) if (m) set.add(m);
    },
    async srem(key, members) {
        const set = memSets.get(key);
        if (!set) return;
        for (const m of members) set.delete(m);
    },
    async sismember(key, member) {
        const set = memSets.get(key);
        return Boolean(set?.has(member));
    },
    async smembers(key) {
        return Array.from(memSets.get(key) ?? []);
    },
    async scard(key) {
        return memSets.get(key)?.size ?? 0;
    },
    async rpush(key, item, ttlSec) {
        const rec = memLists.get(key);
        const valid = rec && (rec.exp === 0 || Date.now() <= rec.exp);
        const items = valid ? rec.items : [];
        items.push(item);
        memLists.set(key, { items, exp: Date.now() + ttlSec * 1000 });
    },
    async lrangeAndDel(key) {
        const rec = memLists.get(key);
        memLists.delete(key);
        if (!rec || (rec.exp > 0 && Date.now() > rec.exp)) return [];
        return [...rec.items];
    },
};

const redisAdapter: KvAdapter = {
    isRedis: true,
    async getString(key) {
        const val = await getUpstashClient().get<unknown>(key);
        if (val === null || val === undefined) return null;
        return typeof val === 'string' ? val : JSON.stringify(val);
    },
    async setString(key, value, ttlSec) {
        if (ttlSec && ttlSec > 0) {
            await getUpstashClient().set(key, value, { ex: ttlSec });
        } else {
            await getUpstashClient().set(key, value);
        }
    },
    async setNx(key, value, ttlSec) {
        const res = await getUpstashClient().set(key, value, { nx: true, ex: ttlSec });
        return res === 'OK';
    },
    async del(key) {
        await getUpstashClient().del(key);
    },
    async incrBy(key, amount, ttlSec) {
        const redis = getUpstashClient();
        const next = await redis.incrby(key, amount);
        if (next === amount) {
            await redis.expire(key, ttlSec).catch(() => undefined);
        }
        return next;
    },
    async decrBy(key, amount) {
        return await getUpstashClient().decrby(key, amount);
    },
    async sadd(key, members) {
        const clean = members.filter(Boolean);
        if (clean.length === 0) return;
        await (getUpstashClient().sadd as (k: string, ...m: string[]) => Promise<number>)(key, ...clean);
    },
    async srem(key, members) {
        const clean = members.filter(Boolean);
        if (clean.length === 0) return;
        await (getUpstashClient().srem as (k: string, ...m: string[]) => Promise<number>)(key, ...clean);
    },
    async sismember(key, member) {
        const res = await getUpstashClient().sismember(key, member);
        return res === 1;
    },
    async smembers(key) {
        return await getUpstashClient().smembers<string[]>(key);
    },
    async scard(key) {
        return await getUpstashClient().scard(key);
    },
    async rpush(key, item, ttlSec) {
        const redis = getUpstashClient();
        await redis.rpush(key, item);
        await redis.expire(key, ttlSec).catch(() => undefined);
    },
    async lrangeAndDel(key) {
        const redis = getUpstashClient();
        const items = await redis.lrange<unknown>(key, 0, -1);
        await redis.del(key);
        return (items ?? []).map((x) => (typeof x === 'string' ? x : JSON.stringify(x)));
    },
};

function store(): KvAdapter {
    return isWaRedisConfigured() ? redisAdapter : memoryAdapter;
}

// ── Kunci Redis & Perhitungan Bulan ───────────────────────────────────────────

const KEY_ENABLED = 'wa:config:enabled';
const KEY_LAST_SELF_CMD = 'wa:config:last_self_cmd';
const KEY_LAST_DELIVERY = 'wa:diag:last_delivery';
const KEY_SKIP_SET = 'wa:contacts:skip';
const KEY_SYNCED_SET = 'wa:contacts:synced';
const MONTH_TTL_SEC = 40 * 24 * 60 * 60; // 40 hari
const DAY_TTL_SEC = 24 * 60 * 60; // 24 jam

const PT_MONTH_FMT = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
});

function gcpBillingMonthSlug(): string {
    const parts = PT_MONTH_FMT.formatToParts(new Date());
    const y = parts.find((p) => p.type === 'year')?.value;
    const m = parts.find((p) => p.type === 'month')?.value;
    return `${y}-${m}`;
}

function utcMonthSlug(): string {
    return new Date().toISOString().slice(0, 7); // YYYY-MM UTC
}

function metaQuotaKey(): string {
    return `wa:quota:meta:${utcMonthSlug()}`;
}

function aiMilliIdrKey(): string {
    return `wa:quota:ai_milli_idr:${gcpBillingMonthSlug()}`;
}

// ── Konfigurasi & Kuota Bulanan (Double Hard-Cap) ─────────────────────────────

export function getMetaMonthlyMessageLimit(): number {
    const allowPaid = (process.env.WA_ALLOW_PAID_META_MESSAGES || '').trim().toLowerCase() === 'true';
    const raw = process.env.WA_MONTHLY_MESSAGE_LIMIT;
    const parsed = raw !== undefined && raw.trim() !== '' ? Number(raw) : 950;
    const base = Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 950;
    // Clamp keras di 990 pesan agar jatah gratis 1.000 Meta tidak pernah bocor tanpa izin eksplisit
    return allowPaid ? base : Math.min(base, 990);
}

export function getAiMonthlyBudgetIdr(): number {
    const raw = process.env.WA_MONTHLY_BUDGET_IDR;
    const parsed = raw !== undefined && raw.trim() !== '' ? Number(raw) : 5000;
    return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 5000;
}

export function shouldSkipSavedContacts(): boolean {
    const raw = (process.env.WA_SKIP_SAVED_CONTACTS || 'true').trim().toLowerCase();
    return raw !== 'false' && raw !== '0';
}

export function getSmartDelayMs(isOngoingConversation: boolean): number {
    const rawFirst = process.env.WA_SMART_DELAY_MS;
    if (rawFirst !== undefined && rawFirst.trim() !== '') {
        const n = Number(rawFirst);
        if (Number.isFinite(n) && n >= 0) {
            return isOngoingConversation ? Math.min(Math.floor(n), 4000) : Math.min(Math.floor(n), 25000);
        }
    }
    return isOngoingConversation ? 3500 : 15000;
}

/**
 * Reservasi 1 jatah pesan balasan bulanan Meta secara atomic sebelum mengirim balasan.
 */
export async function reserveMetaReplyQuota(): Promise<boolean> {
    const limit = getMetaMonthlyMessageLimit();
    if (limit <= 0) return false;
    const s = store();
    const key = metaQuotaKey();
    const next = await s.incrBy(key, 1, MONTH_TTL_SEC);
    if (next > limit) {
        await s.decrBy(key, 1);
        return false;
    }
    return true;
}

export async function releaseMetaReplyQuota(): Promise<void> {
    await store().decrBy(metaQuotaKey(), 1);
}

export async function getMetaRepliesUsed(): Promise<number> {
    const val = await store().getString(metaQuotaKey());
    return Math.max(0, Number(val ?? '0') || 0);
}

/**
 * Cek apakah estimasi pengeluaran AI bulan berjalan masih di bawah WA_MONTHLY_BUDGET_IDR.
 * Disimpan dalam satuan milli-Rupiah (1 Rp = 1000 unit) agar presisi sub-Rupiah akurat.
 */
export async function hasAiBudgetRemaining(): Promise<boolean> {
    const budgetIdr = getAiMonthlyBudgetIdr();
    if (budgetIdr <= 0) return false;
    const usedMilli = Number((await store().getString(aiMilliIdrKey())) ?? '0') || 0;
    return usedMilli < budgetIdr * 1000;
}

export async function recordAiSpendIdr(costIdr: number): Promise<void> {
    if (!Number.isFinite(costIdr) || costIdr <= 0) return;
    const milli = Math.max(1, Math.round(costIdr * 1000));
    await store().incrBy(aiMilliIdrKey(), milli, MONTH_TTL_SEC);
}

export async function getAiSpendIdr(): Promise<number> {
    const usedMilli = Number((await store().getString(aiMilliIdrKey())) ?? '0') || 0;
    return Math.round((usedMilli / 1000) * 100) / 100;
}

// ── Saklar Global, Skip List, Kontak Tersimpan, & Pause 24 Jam ───────────────

export async function isWaBotEnabled(): Promise<boolean> {
    const val = await store().getString(KEY_ENABLED);
    if (val === null) {
        return (process.env.WA_DEFAULT_ENABLED || 'true').trim().toLowerCase() !== 'false';
    }
    return val !== '0' && val.toLowerCase() !== 'false';
}

export async function setWaBotEnabled(enabled: boolean): Promise<void> {
    await store().setString(KEY_ENABLED, enabled ? '1' : '0');
}

export async function recordLastSelfCommand(cmd: string): Promise<void> {
    await store().setString(
        KEY_LAST_SELF_CMD,
        JSON.stringify({ cmd, at: new Date().toISOString() }),
        MONTH_TTL_SEC
    );
}

export async function recordLastDeliveryInfo(info: Omit<WaLastDeliveryInfo, 'at'> & { at?: string }): Promise<void> {
    const payload: WaLastDeliveryInfo = {
        state: info.state,
        ...(info.code !== undefined ? { code: info.code } : {}),
        ...(info.detail ? { detail: info.detail.slice(0, 280) } : {}),
        at: info.at || new Date().toISOString(),
    };
    await store().setString(KEY_LAST_DELIVERY, JSON.stringify(payload), 7 * DAY_TTL_SEC);
}

export async function addSkipPhones(phones: string[]): Promise<string[]> {
    const normalized = phones.map(normalizeWaPhone).filter(Boolean);
    if (normalized.length > 0) {
        await store().sadd(KEY_SKIP_SET, normalized);
    }
    return normalized;
}

export async function removeSkipPhones(phones: string[]): Promise<string[]> {
    const normalized = phones.map(normalizeWaPhone).filter(Boolean);
    if (normalized.length > 0) {
        await store().srem(KEY_SKIP_SET, normalized);
    }
    return normalized;
}

export async function listSkipPhones(): Promise<string[]> {
    const envStatic = (process.env.WA_SKIP_PHONES || '')
        .split(',')
        .map(normalizeWaPhone)
        .filter(Boolean);
    const dynamic = await store().smembers(KEY_SKIP_SET);
    return Array.from(new Set([...envStatic, ...dynamic])).sort();
}

export async function isPhoneSkipped(phone: string): Promise<boolean> {
    const norm = normalizeWaPhone(phone);
    if (!norm) return true;
    const envStatic = (process.env.WA_SKIP_PHONES || '')
        .split(',')
        .map(normalizeWaPhone)
        .filter(Boolean);
    if (envStatic.includes(norm)) return true;
    return await store().sismember(KEY_SKIP_SET, norm);
}

export async function syncPhoneContacts(addPhones: string[], removePhones: string[]): Promise<void> {
    const s = store();
    const toAdd = addPhones.map(normalizeWaPhone).filter(Boolean);
    const toRem = removePhones.map(normalizeWaPhone).filter(Boolean);
    if (toAdd.length > 0) await s.sadd(KEY_SYNCED_SET, toAdd);
    if (toRem.length > 0) await s.srem(KEY_SYNCED_SET, toRem);
}

export async function isPhoneInSyncedContacts(phone: string): Promise<boolean> {
    const norm = normalizeWaPhone(phone);
    if (!norm) return false;
    return await store().sismember(KEY_SYNCED_SET, norm);
}

export async function pausePhoneForHumanTakeover(phone: string, ttlSec = DAY_TTL_SEC): Promise<void> {
    const norm = normalizeWaPhone(phone);
    if (!norm) return;
    await store().setString(`wa:pause:${norm}`, String(Date.now()), ttlSec);
}

export async function clearPhonePause(phone: string): Promise<void> {
    const norm = normalizeWaPhone(phone);
    if (!norm) return;
    await store().del(`wa:pause:${norm}`);
}

export async function isPhonePaused(phone: string): Promise<boolean> {
    const norm = normalizeWaPhone(phone);
    if (!norm) return false;
    return (await store().getString(`wa:pause:${norm}`)) !== null;
}

// ── Deduplikasi Webhook & Rate Limit Per Pengirim ─────────────────────────────

export async function claimMessageDedup(wamid: string): Promise<boolean> {
    if (!wamid || typeof wamid !== 'string') return false;
    return await store().setNx(`wa:dedup:${wamid}`, '1', DAY_TTL_SEC);
}

export async function checkSenderRateLimit(phone: string, maxPerMinute = 8): Promise<boolean> {
    const norm = normalizeWaPhone(phone);
    if (!norm) return false;
    const minuteBucket = Math.floor(Date.now() / 60000);
    const count = await store().incrBy(`wa:rl:${norm}:${minuteBucket}`, 1, 90);
    return count <= maxPerMinute;
}

// ── Burst Coalescing (Gabung Chat Beruntun + Jeda Pintar) ─────────────────────

const PENDING_TTL_SEC = 300; // 5 menit

export async function enqueuePendingBubble(phone: string, bubble: PendingBubble): Promise<void> {
    const norm = normalizeWaPhone(phone);
    if (!norm) return;
    const s = store();
    await s.rpush(`wa:pending:${norm}`, JSON.stringify(bubble), PENDING_TTL_SEC);
    await s.setString(`wa:debounce:${norm}`, bubble.id, PENDING_TTL_SEC);
}

export async function isLatestBurstBubble(phone: string, bubbleId: string): Promise<boolean> {
    const norm = normalizeWaPhone(phone);
    if (!norm) return false;
    const latest = await store().getString(`wa:debounce:${norm}`);
    return latest === bubbleId;
}

export async function drainPendingBubbles(phone: string): Promise<PendingBubble[]> {
    const norm = normalizeWaPhone(phone);
    if (!norm) return [];
    const s = store();
    const rawItems = await s.lrangeAndDel(`wa:pending:${norm}`);
    await s.del(`wa:debounce:${norm}`);
    const parsed: PendingBubble[] = [];
    for (const raw of rawItems) {
        try {
            const obj = JSON.parse(raw) as PendingBubble;
            if (obj && typeof obj.id === 'string') parsed.push(obj);
        } catch {
            // lewati item korup
        }
    }
    return parsed;
}

export async function clearPendingBubbles(phone: string): Promise<void> {
    const norm = normalizeWaPhone(phone);
    if (!norm) return;
    const s = store();
    await s.del(`wa:pending:${norm}`);
    await s.del(`wa:debounce:${norm}`);
}

// ── Riwayat Percakapan per Nomor WA (TTL Otomatis 24 Jam) ─────────────────────

const MAX_RECENT_TURNS = 12; // 6 pasang chat terakhir untuk konteks model cepat & hemat token
const MAX_TRANSCRIPT_TURNS = 30; // Transkrip lengkap 24 jam khusus ekstraksi checklist RAB

export async function getWaHistory(phone: string): Promise<WaChatTurn[]> {
    const norm = normalizeWaPhone(phone);
    if (!norm) return [];
    const raw = await store().getString(`wa:history:${norm}`);
    if (!raw) return [];
    try {
        const arr = JSON.parse(raw);
        return Array.isArray(arr) ? (arr as WaChatTurn[]) : [];
    } catch {
        return [];
    }
}

export async function getWaFullTranscript(phone: string): Promise<WaChatTurn[]> {
    const norm = normalizeWaPhone(phone);
    if (!norm) return [];
    const raw = await store().getString(`wa:transcript:${norm}`);
    if (!raw) return [];
    try {
        const arr = JSON.parse(raw);
        return Array.isArray(arr) ? (arr as WaChatTurn[]) : [];
    } catch {
        return [];
    }
}

export async function appendWaHistory(phone: string, userText: string, modelReply: string): Promise<void> {
    const norm = normalizeWaPhone(phone);
    if (!norm) return;
    const s = store();

    const recent = await getWaHistory(norm);
    recent.push(
        { role: 'user', parts: [{ text: userText.slice(0, 2000) }] },
        { role: 'model', parts: [{ text: modelReply.slice(0, 3000) }] }
    );
    const trimmedRecent = recent.slice(-MAX_RECENT_TURNS);
    await s.setString(`wa:history:${norm}`, JSON.stringify(trimmedRecent), DAY_TTL_SEC);

    const full = await getWaFullTranscript(norm);
    full.push(
        { role: 'user', parts: [{ text: userText.slice(0, 3000) }] },
        { role: 'model', parts: [{ text: modelReply.slice(0, 4000) }] }
    );
    const trimmedFull = full.slice(-MAX_TRANSCRIPT_TURNS);
    await s.setString(`wa:transcript:${norm}`, JSON.stringify(trimmedFull), DAY_TTL_SEC);
}

export async function clearWaHistory(phone: string): Promise<void> {
    const norm = normalizeWaPhone(phone);
    if (!norm) return;
    const s = store();
    await s.del(`wa:history:${norm}`);
    await s.del(`wa:transcript:${norm}`);
}

// ── Snapshot untuk Panel Admin Ber-PIN (TtsQuotaModal) ────────────────────────

export async function getWaAdminSnapshot(): Promise<WaAdminSnapshot> {
    const s = store();
    const [enabled, metaRepliesUsed, aiSpendIdr, skipList, syncedContactsCount, lastCmdRaw, lastDelivRaw] = await Promise.all([
        isWaBotEnabled(),
        getMetaRepliesUsed(),
        getAiSpendIdr(),
        listSkipPhones(),
        s.scard(KEY_SYNCED_SET),
        s.getString(KEY_LAST_SELF_CMD),
        s.getString(KEY_LAST_DELIVERY),
    ]);

    let lastSelfCommand: { cmd: string; at: string } | null = null;
    if (lastCmdRaw) {
        try {
            lastSelfCommand = JSON.parse(lastCmdRaw) as { cmd: string; at: string };
        } catch {
            lastSelfCommand = null;
        }
    }

    let lastDelivery: WaLastDeliveryInfo | null = null;
    if (lastDelivRaw) {
        try {
            lastDelivery = JSON.parse(lastDelivRaw) as WaLastDeliveryInfo;
        } catch {
            lastDelivery = null;
        }
    }

    return {
        enabled,
        redisConfigured: isWaRedisConfigured(),
        metaRepliesUsed,
        metaRepliesLimit: getMetaMonthlyMessageLimit(),
        aiSpendIdr,
        aiBudgetIdr: getAiMonthlyBudgetIdr(),
        skipList,
        syncedContactsCount,
        skipSavedContacts: shouldSkipSavedContacts(),
        smartDelaySec: Math.round(getSmartDelayMs(false) / 1000),
        lastSelfCommand,
        lastDelivery,
    };
}

