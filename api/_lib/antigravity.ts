import { Attachment } from './documentGenerator.js';
import { checkRateLimit } from './rateLimiter.js';

// LABEL STABIL untuk UI & chat.ts (mis. `requestedModel === ANTIGRAVITY_MODEL` dan perbandingan
// `result.model` di AIChatbotShowcase). Ini BUKAN lagi ID agen yang dikirim ke API: ID sebenarnya
// ada di ANTIGRAVITY_AGENT_ID_* di bawah. Dipisah supaya ID agen bisa naik versi tanpa menyentuh
// frontend.
export const ANTIGRAVITY_MODEL = 'antigravity-preview-05-2026';
export const ANTIGRAVITY_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

// ID agen yang dikirim ke API. Dokumentasi Google terbaru (diperbarui 24 Sep 2026) memakai
// `antigravity-preview-09-2026`; ID lama `-05-2026` hanya dipakai sebagai cadangan kalau yang baru
// ditolak (404). Override tanpa deploy ulang: env ANTIGRAVITY_AGENT_ID.
const ANTIGRAVITY_AGENT_ID_LEGACY = 'antigravity-preview-05-2026';
const ANTIGRAVITY_AGENT_ID_PRIMARY = process.env.ANTIGRAVITY_AGENT_ID?.trim() || 'antigravity-preview-09-2026';
// Kalau ID utama ditolak (404), ia diistirahatkan 30 menit lalu dicoba lagi. Sengaja TIDAK "menempel"
// ke ID lama selamanya: ID lama tidak menerima agent_config (anggaran token), jadi semakin cepat
// kembali ke ID baru semakin cepat perlindungan biaya aktif lagi.
const PRIMARY_REST_MS = 30 * 60 * 1000;
let primaryBlockedUntil = 0;

function agentIdCandidates(): string[] {
    const list: string[] = [];
    if (Date.now() >= primaryBlockedUntil) list.push(ANTIGRAVITY_AGENT_ID_PRIMARY);
    if (!list.includes(ANTIGRAVITY_AGENT_ID_LEGACY)) list.push(ANTIGRAVITY_AGENT_ID_LEGACY);
    return list;
}

/** Khusus pengujian. */
export function __resetAntigravityState() {
    primaryBlockedUntil = 0;
    backgroundBlockedUntil = 0;
}

// Model dasar agen yang didukung `agent_config.model` (dokumentasi Antigravity agent).
const SUPPORTED_BASE_MODELS = ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite'];

function envInt(name: string, fallback: number, min: number, max: number): number {
    const n = parseInt(process.env[name] || '', 10);
    if (Number.isNaN(n)) return fallback;
    return Math.min(max, Math.max(min, n));
}

// ── Anggaran token per interaksi ────────────────────────────────────────────
// Satu interaksi agen menjalankan banyak loop otonom dan bisa memakan ratusan ribu sampai jutaan
// token. `agent_config.max_total_tokens` membatasinya (best-effort; status jadi "incomplete" kalau
// tercapai). Default 150.000, ubah lewat env ANTIGRAVITY_MAX_TOTAL_TOKENS.
const MAX_TOTAL_TOKENS = envInt('ANTIGRAVITY_MAX_TOTAL_TOKENS', 150_000, 10_000, 1_000_000);
let agentTimeoutMs = envInt('ANTIGRAVITY_TIMEOUT_MS', 25_000, 10_000, 55_000);

// ── Mode background + polling + cancel ─────────────────────────────────────
// Dulu panggilan sinkron di-abort di sisi kita setelah batas waktu, tetapi interaksinya (dugaan kuat)
// tetap jalan di Google dan tetap memakan token. Sekarang interaksi dijalankan `background: true`:
// kita mendapat ID langsung, mem-polling statusnya, dan kalau batas waktu habis kita MEMBATALKANNYA
// (`POST /interactions/{id}:cancel`) supaya tidak ada token terbuang untuk jawaban yang tidak akan dibaca.
// Sesuai dokumentasi: background wajib store=true (bawaan), REST memakai header Api-Revision.
// Kalau API menolak mode ini (HTTP 400 bukan soal ID agen), kode otomatis kembali ke mode sinkron
// dan mencoba background lagi setelah 30 menit. Matikan manual: ANTIGRAVITY_BACKGROUND=off.
const API_REVISION = '2026-05-20';
const BACKGROUND_REST_MS = 30 * 60 * 1000;
let backgroundBlockedUntil = 0;
const POLL_FIRST_MS = 1000;
const POLL_MAX_MS = 2500;

function backgroundEnabled(): boolean {
    if ((process.env.ANTIGRAVITY_BACKGROUND || '').trim().toLowerCase() === 'off') return false;
    return Date.now() >= backgroundBlockedUntil;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Batalkan interaksi background yang masih berjalan (best-effort, maks 3 detik). */
async function cancelInteraction(apiKey: string, interactionId: string): Promise<void> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    try {
        const res = await fetch(`${ANTIGRAVITY_ENDPOINT}/${encodeURIComponent(interactionId)}:cancel`, {
            method: 'POST',
            headers: { 'x-goog-api-key': apiKey },
            signal: controller.signal,
        });
        console.log(`[antigravity] Interaksi ${interactionId} dibatalkan (HTTP ${res.status}).`);
    } catch {
        console.warn(`[antigravity] Gagal membatalkan interaksi ${interactionId}; anggaran token tetap membatasi pemakaiannya.`);
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * Polling sampai status bukan "in_progress" atau `deadlineAt` terlewati. Tiga kegagalan poll beruntun
 * menghentikan polling. Mengembalikan data final (atau null) + environment_id terakhir yang terlihat
 * (supaya sandbox tetap bisa dibersihkan walau interaksi dibatalkan).
 */
async function pollInteraction(
    apiKey: string,
    interactionId: string,
    deadlineAt: number
): Promise<{ data: any | null; environmentId?: string }> {
    let delay = POLL_FIRST_MS;
    let consecutiveErrors = 0;
    let environmentId: string | undefined;

    while (Date.now() < deadlineAt) {
        await sleep(Math.max(0, Math.min(delay, deadlineAt - Date.now())));
        const remaining = deadlineAt - Date.now();
        if (remaining <= 0) break;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), Math.min(6000, remaining));
        try {
            const res = await fetch(`${ANTIGRAVITY_ENDPOINT}/${encodeURIComponent(interactionId)}`, {
                method: 'GET',
                headers: { 'x-goog-api-key': apiKey },
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (res.ok) {
                const d: any = await res.json();
                if (typeof d?.environment_id === 'string') environmentId = d.environment_id;
                if (d?.status !== 'in_progress') return { data: d, environmentId };
                consecutiveErrors = 0;
            } else {
                consecutiveErrors += 1;
                console.warn(`[antigravity] Poll ${interactionId} -> HTTP ${res.status} (${consecutiveErrors}/3)`);
            }
        } catch {
            clearTimeout(timeoutId);
            consecutiveErrors += 1;
        }
        if (consecutiveErrors >= 3) break;
        delay = Math.min(POLL_MAX_MS, delay + 500);
    }
    return { data: null, environmentId };
}

/** Khusus pengujian. */
export function __setAgentTimeoutForTest(ms: number) {
    agentTimeoutMs = ms;
}

// ── Jaringan sandbox (per persona) ──────────────────────────────────────────
// Bawaan Google: sandbox bebas mengakses internet keluar. Sikap kita berbeda per persona:
//   - Rajendra (Live Demo): agen menjalankan KODE dari prompt pengunjung publik -> default
//     `allowlist` ketat, hanya registry paket (`pip install` / `npm install` tetap jalan).
//   - Zannah (riset/analisis): butuh membaca web secara luas -> default `open`. Sebagian besar
//     riset Zannah kini lewat groundedSearch.ts, jadi jalur agennya jarang dipakai.
//   - Persona lain/tak dikenal: `allowlist` (paling aman).
// Mode: allowlist | disabled (tanpa jaringan) | open (bebas).
// Urutan prioritas env (yang pertama terisi menang):
//   ANTIGRAVITY_NETWORK_RAJENDRA / ANTIGRAVITY_NETWORK_ZANNAH  ->  ANTIGRAVITY_NETWORK (semua persona)  ->  default persona
// Domain tambahan allowlist: ANTIGRAVITY_ALLOWED_DOMAINS (semua persona) dan
// ANTIGRAVITY_ALLOWED_DOMAINS_RAJENDRA / _ZANNAH (khusus persona), format "a.com,*.b.com".
// Catatan dari dokumentasi: "*.x.com" TIDAK mencakup "x.com" sendiri; tulis keduanya kalau perlu.
const DEFAULT_ALLOWED_DOMAINS = ['pypi.org', 'files.pythonhosted.org', 'registry.npmjs.org'];

export type AntigravityNetworkMode = 'allowlist' | 'disabled' | 'open';
export type AntigravityPersona = 'rajendra' | 'zannah' | 'other';

function personaFromBotName(botName: string): AntigravityPersona {
    const n = (botName || '').toLowerCase();
    if (n.includes('rajendra')) return 'rajendra';
    if (n.includes('zannah')) return 'zannah';
    return 'other';
}

const PERSONA_DEFAULT_MODE: Record<AntigravityPersona, AntigravityNetworkMode> = {
    rajendra: 'allowlist',
    zannah: 'open',
    other: 'allowlist',
};

function parseMode(raw: string | undefined): AntigravityNetworkMode | null {
    const m = (raw || '').trim().toLowerCase();
    return m === 'allowlist' || m === 'disabled' || m === 'open' ? m : null;
}

function getNetworkMode(persona: AntigravityPersona): AntigravityNetworkMode {
    const perPersona = persona === 'other' ? null : parseMode(process.env[`ANTIGRAVITY_NETWORK_${persona.toUpperCase()}`]);
    return perPersona || parseMode(process.env.ANTIGRAVITY_NETWORK) || PERSONA_DEFAULT_MODE[persona];
}

function parseDomains(raw: string | undefined): string[] {
    return (raw || '')
        .split(',')
        .map((d) => d.trim().toLowerCase())
        .filter((d) => /^(\*\.)?[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/.test(d) || d === '*');
}

function getAllowedDomains(persona: AntigravityPersona): string[] {
    const personaExtra = persona === 'other' ? [] : parseDomains(process.env[`ANTIGRAVITY_ALLOWED_DOMAINS_${persona.toUpperCase()}`]);
    return Array.from(new Set([...DEFAULT_ALLOWED_DOMAINS, ...parseDomains(process.env.ANTIGRAVITY_ALLOWED_DOMAINS), ...personaExtra]));
}

// ── Input file ──────────────────────────────────────────────────────────────
// Dokumentasi: input agen saat ini HANYA text + image (document/audio/video belum didukung), dan
// agen hanya bisa membaca file teks/gambar di sandbox. Jadi: gambar -> input image; CSV (teks) ->
// dimount sebagai sumber `inline` (maks 1 MB/file, 2 MB total); selain itu (mis. PDF) tidak bisa
// lewat agen -> callAntigravity mengembalikan null agar cascade Gemini biasa (yang membaca PDF
// secara native) yang menangani.
const INLINE_MAX_BYTES_PER_FILE = 1_000_000;
const INLINE_MAX_BYTES_TOTAL = 2_000_000;

interface InlineSource {
    type: 'inline';
    target: string;
    content: string;
}

function safeUploadName(name: string | undefined, index: number): string {
    const base = (name || `data-${index + 1}.csv`).split(/[\\/]/).pop() || `data-${index + 1}.csv`;
    let clean = base.replace(/[^A-Za-z0-9._-]/g, '_').replace(/^\.+/, '').slice(0, 60) || `data-${index + 1}.csv`;
    if (!clean.toLowerCase().endsWith('.csv')) clean += '.csv';
    return clean;
}

function prepareFilesForAgent(files: UploadedFile[]): {
    images: UploadedFile[];
    sources: InlineSource[];
    unsupported: UploadedFile[];
} {
    const images: UploadedFile[] = [];
    const sources: InlineSource[] = [];
    const unsupported: UploadedFile[] = [];
    const usedNames = new Set<string>();
    let totalBytes = 0;

    files.forEach((f, i) => {
        if (f.mimeType.startsWith('image/')) {
            images.push(f);
            return;
        }
        if (f.mimeType === 'text/csv') {
            const content = Buffer.from(f.data, 'base64').toString('utf8');
            const bytes = Buffer.byteLength(content, 'utf8');
            if (bytes > INLINE_MAX_BYTES_PER_FILE || totalBytes + bytes > INLINE_MAX_BYTES_TOTAL) {
                unsupported.push(f);
                return;
            }
            let name = safeUploadName(f.name, i);
            let n = 1;
            while (usedNames.has(name)) name = name.replace(/(\.csv)$/i, `-${++n}$1`);
            usedNames.add(name);
            totalBytes += bytes;
            sources.push({ type: 'inline', target: `/workspace/uploads/${name}`, content });
            return;
        }
        unsupported.push(f);
    });

    return { images, sources, unsupported };
}

function buildEnvironment(sources: InlineSource[], persona: AntigravityPersona): string | Record<string, unknown> {
    const mode = getNetworkMode(persona);
    if (mode === 'open' && sources.length === 0) return 'remote';

    const env: Record<string, unknown> = { type: 'remote' };
    if (sources.length > 0) env.sources = sources;
    if (mode === 'disabled') env.network = 'disabled';
    else if (mode === 'allowlist') env.network = { allowlist: getAllowedDomains(persona).map((domain) => ({ domain })) };
    return env;
}

export interface AgentStep {
    type: string;
    label: string;
}

export interface UploadedFile {
    mimeType: string;
    data: string;
    name?: string;
}

export const DELIVERABLE_EXTENSIONS = [
    '.pdf', '.xlsx', '.xls', '.docx', '.pptx', '.csv',
    '.png', '.jpg', '.jpeg', '.html', '.zip', '.txt', '.md', '.json'
];

export const SKIP_PATH_SEGMENTS = [
    'node_modules/', '.git/', '__pycache__/', '.cache/',
    '.npm/', '/proc/', '/sys/', '/usr/', '/lib/', '/bin/', '/sbin/', '/etc/', '/var/', '.venv/'
];

export const MAX_ATTACHMENTS = 4;
export const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024; // 8MB per file

export function guessMimeTypeFromName(filename: string): string {
    const ext = filename.toLowerCase().split('.').pop() || '';
    const map: Record<string, string> = {
        pdf: 'application/pdf',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        xls: 'application/vnd.ms-excel',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        csv: 'text/csv',
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        html: 'text/html',
        zip: 'application/zip',
        txt: 'text/plain',
        md: 'text/markdown',
        json: 'application/json',
    };
    return map[ext] || 'application/octet-stream';
}

export function labelForStep(step: any): string {
    const toolName: string | undefined = step?.function_call?.name || step?.tool_name || step?.tool;
    if (step?.type === 'thought') return '🧠 Menyusun rencana...';
    if (step?.type === 'function_call') {
        if (toolName?.includes('search')) return '🔎 Mencari di web...';
        if (toolName?.includes('code')) return '💻 Menjalankan kode...';
        if (toolName?.includes('url')) return '📄 Membaca halaman...';
        if (toolName?.includes('file')) return '📁 Mengelola file...';
        return '🛠️ Menjalankan tool...';
    }
    if (step?.type === 'model_output') return '✍️ Menyusun jawaban...';
    return '⚙️ Memproses...';
}

export async function extractTarEntries(
    buffer: Buffer
): Promise<Array<{ name: string; data: Buffer; mtime: number }>> {
    const tar = await import('tar-stream');
    const { Readable } = await import('stream');

    return new Promise((resolve, reject) => {
        const extract = tar.extract();
        const entries: Array<{ name: string; data: Buffer; mtime: number }> = [];

        extract.on('entry', (header: any, stream: any, next: any) => {
            if (header.type !== 'file') {
                stream.resume();
                return next();
            }
            const chunks: Buffer[] = [];
            stream.on('data', (c: Buffer) => chunks.push(c));
            stream.on('end', () => {
                entries.push({
                    name: header.name,
                    data: Buffer.concat(chunks),
                    mtime: header.mtime ? new Date(header.mtime).getTime() : 0,
                });
                next();
            });
            stream.resume();
        });

        extract.on('finish', () => resolve(entries));
        extract.on('error', reject);

        Readable.from(buffer).pipe(extract);
    });
}

/** Unduh arsip tar dari endpoint environment files (yang baru). Mengembalikan null kalau gagal. */
async function fetchTar(apiKey: string, url: string): Promise<Buffer | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    try {
        const response = await fetch(url, { headers: { 'x-goog-api-key': apiKey }, signal: controller.signal });
        clearTimeout(timeoutId);
        if (!response.ok) return null;
        const declared = parseInt(response.headers.get('content-length') || '0', 10);
        if (declared > 80 * 1024 * 1024) {
            console.warn(`[antigravity] Arsip sandbox terlalu besar (${declared} byte), dilewati.`);
            return null;
        }
        return Buffer.from(await response.arrayBuffer());
    } catch {
        clearTimeout(timeoutId);
        return null;
    }
}

export async function downloadAntigravityFiles(
    apiKey: string,
    environmentId: string
): Promise<Attachment[]> {
    if (!environmentId) return [];

    try {
        // Endpoint lama `/files/environment-{id}:download` sudah ditandai DEPRECATED oleh Google.
        // Urutan: (1) environments/{id}/files/workspace (rekursif), (2) root environment (rekursif),
        // (3) endpoint lama sebagai pengaman terakhir selama belum dihapus.
        const envBase = `${GEMINI_API_BASE}/environments/${encodeURIComponent(environmentId)}/files`;
        const attempts = [
            `${envBase}/workspace?alt=media&recursive=true`,
            `${envBase}?alt=media&recursive=true`,
            `${GEMINI_API_BASE}/files/environment-${encodeURIComponent(environmentId)}:download?alt=media`,
        ];

        let entries: Array<{ name: string; data: Buffer; mtime: number }> = [];
        for (let i = 0; i < attempts.length; i++) {
            const buffer = await fetchTar(apiKey, attempts[i]);
            if (!buffer || buffer.length === 0) continue;
            try {
                entries = await extractTarEntries(buffer);
            } catch (err) {
                console.warn(`[antigravity] Gagal membaca arsip dari endpoint #${i + 1}:`, err);
                continue;
            }
            if (entries.length > 0) break;
        }
        if (entries.length === 0) {
            console.warn('[antigravity] Tidak ada arsip sandbox yang bisa diambil, skip attachment.');
            return [];
        }

        const candidates = entries
            .filter((e) => {
                const lower = e.name.toLowerCase();
                if (SKIP_PATH_SEGMENTS.some((seg) => lower.includes(seg))) return false;
                if (lower.includes('/uploads/') || lower.startsWith('uploads/')) return false; // file kiriman user sendiri
                if (!DELIVERABLE_EXTENSIONS.some((ext) => lower.endsWith(ext))) return false;
                if (e.data.length === 0 || e.data.length > MAX_ATTACHMENT_BYTES) return false;
                return true;
            })
            .sort((a, b) => b.mtime - a.mtime)
            .slice(0, MAX_ATTACHMENTS);

        return candidates.map((c) => ({
            name: c.name.split('/').pop() || c.name,
            mimeType: guessMimeTypeFromName(c.name),
            base64: c.data.toString('base64'),
        }));
    } catch (error: unknown) {
        console.warn('[antigravity] Error download/extract sandbox:', error);
        return [];
    }
}

/**
 * Hapus sandbox setelah hasilnya diambil (best-effort, maks 3 detik). Tanpa ini sandbox -- berikut
 * file yang diunggah pengunjung (gambar/CSV) -- tetap tersimpan di Google sampai TTL 7 hari habis.
 * Matikan dengan env ANTIGRAVITY_DELETE_ENV=off.
 */
async function deleteEnvironment(apiKey: string, environmentId: string): Promise<void> {
    if ((process.env.ANTIGRAVITY_DELETE_ENV || '').toLowerCase() === 'off') return;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    try {
        const res = await fetch(`${GEMINI_API_BASE}/environments/${encodeURIComponent(environmentId)}`, {
            method: 'DELETE',
            headers: { 'x-goog-api-key': apiKey },
            signal: controller.signal,
        });
        if (!res.ok) console.warn(`[antigravity] Hapus environment gagal (HTTP ${res.status}); akan kedaluwarsa otomatis (TTL 7 hari).`);
    } catch {
        // abaikan: TTL 7 hari akan membersihkannya
    } finally {
        clearTimeout(timeoutId);
    }
}

export async function callAntigravity(
    apiKey: string,
    message: string,
    history: Array<{ role: string; parts: { text: string }[] }>,
    ip: string,
    systemInstruction: string,
    botName: string,
    files: UploadedFile[] = []
): Promise<{
    reply: string;
    model: string;
    remainingQuota: number;
    agentSteps: AgentStep[];
    attachments: Attachment[];
} | null> {
    const rateLimitStatus = checkRateLimit(ip, 'antigravity');
    if (!rateLimitStatus.allowed) {
        console.log('[antigravity] Rate limited locally, skipping...');
        return null;
    }

    // File yang tidak bisa dibaca agen (mis. PDF) -> serahkan ke cascade Gemini biasa (baca PDF native).
    const { images, sources, unsupported } = prepareFilesForAgent(files);
    if (unsupported.length > 0) {
        console.log(
            `[antigravity] ${unsupported.length} file tidak didukung agen (${unsupported.map((f) => f.mimeType).join(', ')}); dilewati agar ditangani Gemini biasa.`
        );
        return null;
    }

    const historyText = history
        .map((h) => `${h.role === 'user' ? 'User' : botName}: ${h.parts?.[0]?.text || ''}`)
        .filter(Boolean)
        .join('\n');

    const attachedNote =
        sources.length > 0
            ? `\n\n[FILE CSV DARI USER SUDAH ADA DI SANDBOX]\n${sources.map((s) => `- ${s.target}`).join('\n')}\n`
            : '';

    const prompt = `[SYSTEM INSTRUCTION]\n${systemInstruction}\n\n[CONVERSATION HISTORY]\n${historyText ? historyText + '\n\n' : ''}User: ${message}${attachedNote}\n${botName}:`;

    const antigravityInput =
        images.length > 0
            ? [
                { type: 'text', text: prompt },
                ...images.map((f) => ({ type: 'image', data: f.data, mime_type: f.mimeType })),
            ]
            : prompt;

    const persona = personaFromBotName(botName);
    const environment = buildEnvironment(sources, persona);
    const baseModel = process.env.ANTIGRAVITY_BASE_MODEL?.trim();
    if (baseModel && !SUPPORTED_BASE_MODELS.includes(baseModel)) {
        console.warn(`[antigravity] ANTIGRAVITY_BASE_MODEL "${baseModel}" tidak ada di daftar yang didukung, diabaikan.`);
    }

    const startedAt = Date.now();
    const deadlineAt = startedAt + agentTimeoutMs;
    let data: any = null;
    let usedAgentId = '';
    let useBackground = backgroundEnabled();

    /** Buat interaksi. Background: balasan langsung berisi ID + status in_progress; sinkron: hasil penuh. */
    const postCreate = async (
        agentId: string,
        background: boolean
    ): Promise<{ ok: true; json: any } | { ok: false; status: number; msg: string }> => {
        const remaining = deadlineAt - Date.now();
        const body: Record<string, unknown> = {
            agent: agentId,
            input: antigravityInput,
            environment,
        };
        // agent_config (anggaran token + pilihan model) hanya dikirim ke ID agen baru; skema ID lama tidak dijamin.
        if (agentId !== ANTIGRAVITY_AGENT_ID_LEGACY) {
            const agentConfig: Record<string, unknown> = { type: 'antigravity', max_total_tokens: MAX_TOTAL_TOKENS };
            if (baseModel && SUPPORTED_BASE_MODELS.includes(baseModel)) agentConfig.model = baseModel;
            body.agent_config = agentConfig;
        }
        const headers: Record<string, string> = { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey };
        if (background) {
            body.background = true;
            headers['Api-Revision'] = API_REVISION;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), background ? Math.min(12000, remaining) : remaining);
        try {
            const response = await fetch(ANTIGRAVITY_ENDPOINT, {
                method: 'POST',
                headers,
                signal: controller.signal,
                body: JSON.stringify(body),
            });
            if (!response.ok) {
                const err: any = await response.json().catch(() => ({}));
                return { ok: false, status: response.status, msg: err?.error?.message || response.statusText || '' };
            }
            return { ok: true, json: await response.json() };
        } finally {
            clearTimeout(timeoutId);
        }
    };

    try {
        // Coba ID agen berurutan; hanya pindah ke kandidat berikutnya kalau ID-nya yang ditolak.
        for (const agentId of agentIdCandidates()) {
            if (deadlineAt - Date.now() < 4000) break;

            let res = await postCreate(agentId, useBackground);

            // Mode background ditolak (400 yang bukan soal ID agen) -> kembali ke mode sinkron untuk sementara.
            if (!res.ok && res.status === 400 && useBackground && !/agent/i.test(res.msg)) {
                console.warn(`[antigravity][${agentId}] Mode background ditolak (400: ${res.msg}); memakai mode sinkron selama 30 menit.`);
                backgroundBlockedUntil = Date.now() + BACKGROUND_REST_MS;
                useBackground = false;
                res = await postCreate(agentId, false);
            }

            if (!res.ok) {
                console.warn(`[antigravity][${agentId}] Error ${res.status}:`, res.msg);
                const agentIdProblem = res.status === 404 || (res.status === 400 && /agent/i.test(res.msg));
                if (agentIdProblem) {
                    if (agentId === ANTIGRAVITY_AGENT_ID_PRIMARY) primaryBlockedUntil = Date.now() + PRIMARY_REST_MS;
                    continue; // coba kandidat ID berikutnya
                }
                return null;
            }

            usedAgentId = agentId;
            if (agentId === ANTIGRAVITY_AGENT_ID_LEGACY && ANTIGRAVITY_AGENT_ID_PRIMARY !== ANTIGRAVITY_AGENT_ID_LEGACY) {
                console.warn('[antigravity] Memakai ID agen lama: anggaran token (max_total_tokens) TIDAK aktif pada interaksi ini.');
            }

            const created: any = res.json;
            if (useBackground && created?.status === 'in_progress') {
                const interactionId: string | undefined = created.id;
                if (!interactionId) {
                    console.warn('[antigravity] Respons background tanpa id interaksi, tidak bisa dipolling.');
                    return null;
                }
                const polled = await pollInteraction(apiKey, interactionId, deadlineAt);
                if (!polled.data) {
                    console.warn(`[antigravity] Interaksi belum selesai dalam ${agentTimeoutMs}ms; membatalkan agar tidak memakan token.`);
                    await cancelInteraction(apiKey, interactionId);
                    const strayEnvId: string | undefined = polled.environmentId || created.environment_id;
                    if (strayEnvId) await deleteEnvironment(apiKey, strayEnvId);
                    return null;
                }
                data = {
                    ...polled.data,
                    environment_id: polled.data.environment_id ?? polled.environmentId ?? created.environment_id,
                };
            } else {
                data = created; // mode sinkron, atau background yang langsung selesai
            }
            break;
        }
        if (!data) return null;

        const status: string | undefined = data.status;
        if (status === 'failed' || status === 'cancelled' || status === 'requires_action' || status === 'in_progress') {
            console.warn(`[antigravity][${usedAgentId}] Interaksi berakhir dengan status "${status}", dianggap gagal.`);
            if (typeof data.environment_id === 'string') await deleteEnvironment(apiKey, data.environment_id);
            return null;
        }

        // Pakai output_text resmi kalau ada; fallback ke susunan steps TANPA langkah thought/user_input
        // (supaya isi berpikir agen atau prompt sistem tidak ikut bocor ke balasan).
        let reply = typeof data.output_text === 'string' ? data.output_text : '';
        const hasOutputText = reply.trim().length > 0;
        const agentSteps: AgentStep[] = [];
        if (Array.isArray(data.steps)) {
            for (const step of data.steps) {
                if (!hasOutputText && step.type !== 'thought' && step.type !== 'user_input' && Array.isArray(step.content)) {
                    for (const item of step.content) {
                        if (item?.text) reply += item.text;
                    }
                }
                if (step.type && step.type !== 'user_input') {
                    const label = labelForStep(step);
                    if (agentSteps[agentSteps.length - 1]?.label !== label) {
                        agentSteps.push({ type: step.type, label });
                    }
                }
            }
        }

        reply = reply.replace(new RegExp(`^(?:${botName}):\\s*`, 'i'), '').trim();
        const totalTokens = data?.usage?.total_tokens;
        console.log(
            `[antigravity][${usedAgentId}] status=${status || '-'} tokens=${totalTokens ?? '-'} mode=${useBackground ? 'background' : 'sinkron'} persona=${persona} network=${getNetworkMode(persona)} durasi=${Date.now() - startedAt}ms`
        );

        if (!reply) {
            console.warn('[antigravity] Empty response from agent');
            const emptyEnvId: string | undefined = data.environment_id;
            if (emptyEnvId) await deleteEnvironment(apiKey, emptyEnvId);
            return null;
        }
        if (status === 'incomplete') {
            reply += '\n\n_(Agen berhenti lebih awal karena batas anggaran token per sesi, jadi hasil di atas mungkin belum lengkap.)_';
        }

        let attachments: Attachment[] = [];
        const environmentId: string | undefined = data.environment_id;
        if (environmentId) {
            attachments = await downloadAntigravityFiles(apiKey, environmentId);
            await deleteEnvironment(apiKey, environmentId);
        }

        return {
            reply,
            model: ANTIGRAVITY_MODEL,
            remainingQuota: rateLimitStatus.remaining,
            agentSteps,
            attachments,
        };
    } catch (error: unknown) {
        const isTimeout = error instanceof Error && error.name === 'AbortError';
        console.warn(`[antigravity] ${isTimeout ? 'timeout' : 'error'}:`, error);
        return null;
    }
}