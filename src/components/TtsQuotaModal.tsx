import React, { useState } from 'react';
import { X, Loader2, ShieldAlert, RefreshCw, MessageSquare, Power, Plus, Trash2 } from 'lucide-react';

interface TierUsage {
  used: number;
  limit: number;
}

interface TtsUsageResponse {
  chirp: TierUsage;
  wavenet: TierUsage;
}

/** Bentuk respons GET /api/chat?view=grounding (getGroundingDiagnostics di groundedSearch.ts). */
interface GroundingStatus {
  usedToday: number;
  dailyCap: number;
  lastGoodModel: string | null;
  discoveredAt: string | null;
  candidatePool: string[];
  blocked: Record<string, string>;
  cacheSize: number;
  ipHourlyCap: number;
  mode: string;
  version?: string;
  versions?: { chat: string; intent: string };
  fallbackModels?: string[];
  env?: { groundingModels: boolean; discovery: string; totalMs: number };
  stats: {
    ok: number;
    cached: number;
    failed: number;
    failByReason: Record<string, number>;
    lastResult: null | { at: string; ok: boolean; model?: string; reason?: string; sources?: number };
  };
  instanceUptimeSec: number;
}

interface ProbeRow {
  model: string;
  ok: boolean;
  status: number | null;
  ms: number;
  sources: number;
  queries: number;
  textLen: number;
  finishReason?: string;
  error?: string;
  restingNow?: string;
}

interface ProbeResponse {
  probe: {
    source: string;
    listedCount: number;
    listedGemma: string[];
    discoveryFailed: boolean;
    timeoutMs: number;
    rows: ProbeRow[];
  };
  classifier: { version: string; ms: number; verdict: null | { needsWeb: boolean; clarify: boolean }; note?: string };
}

interface WaAdminStatus {
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
  lastDelivery?: {
    state: 'sent' | 'delivered' | 'read' | 'failed' | 'ai_error';
    code?: number;
    detail?: string;
    at: string;
  } | null;
  ownerPhone: string;
  aiMode: 'vertex' | 'aistudio_dedicated' | 'aistudio_shared' | 'unconfigured';
  aiConfigured: boolean;
  privacySafeForMedia: boolean;
  graphConfigured: boolean;
  missingEnv: string[];
}

interface TtsQuotaModalProps {
  onClose: () => void;
}

const FAIL_LABEL: Record<string, string> = {
  no_key: 'API key kosong',
  local_cap: 'batas harian lokal',
  ip_limit: 'batas per IP',
  quota: 'kuota API habis',
  timeout: 'timeout',
  error: 'error lain',
  empty: 'tanpa sumber',
};

const fmtUptime = (sec: number) => {
  if (sec < 90) return `${sec} dtk`;
  if (sec < 5400) return `${Math.round(sec / 60)} mnt`;
  return `${(sec / 3600).toFixed(1)} jam`;
};

const fmtTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return iso;
  }
};

const fmt = (n: number) => n.toLocaleString('id-ID');
const pct = (used: number, limit: number) => (limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0);

/**
 * Modal "rahasia" buat ngecek pemakaian kuota TTS bulan ini -- dipicu dari
 * easter egg (tap berulang di suatu elemen, lihat Footer.tsx). Minta PIN
 * dulu tiap dibuka; PIN gak pernah disimpan di frontend/localStorage,
 * cuma dikirim sekali ke GET /api/tts (api/tts.ts) buat divalidasi server-side.
 */
export const TtsQuotaModal: React.FC<TtsQuotaModalProps> = ({ onClose }) => {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TtsUsageResponse | null>(null);
  const [search, setSearch] = useState<GroundingStatus | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [probe, setProbe] = useState<ProbeResponse | null>(null);
  const [probeLoading, setProbeLoading] = useState(false);
  const [probeError, setProbeError] = useState<string | null>(null);
  const [waStatus, setWaStatus] = useState<WaAdminStatus | null>(null);
  const [waLoading, setWaLoading] = useState(false);
  const [waActionBusy, setWaActionBusy] = useState(false);
  const [waError, setWaError] = useState<string | null>(null);
  const [newSkipPhone, setNewSkipPhone] = useState('');

  const fetchWaStatus = async (pinValue: string) => {
    setWaLoading(true);
    setWaError(null);
    try {
      const res = await fetch('/api/whatsapp?view=admin', {
        method: 'GET',
        headers: { 'x-tts-usage-pin': pinValue },
        cache: 'no-store',
      });
      if (res.status === 401) return setWaError('PIN ditolak oleh endpoint WhatsApp.');
      if (res.status === 404 || res.status === 405) return setWaError('Endpoint /api/whatsapp belum terdeploy.');
      if (!res.ok) return setWaError('Gagal memuat status WhatsApp Zannah.');
      setWaStatus((await res.json()) as WaAdminStatus);
    } catch {
      setWaError('Gagal terhubung ke endpoint WhatsApp.');
    } finally {
      setWaLoading(false);
    }
  };

  const runWaAdminAction = async (payload: Record<string, unknown>) => {
    if (!pin || waActionBusy) return;
    setWaActionBusy(true);
    setWaError(null);
    try {
      const res = await fetch('/api/whatsapp?action=admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tts-usage-pin': pin,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        setWaError(`Aksi WhatsApp gagal (HTTP ${res.status}).`);
        return;
      }
      setWaStatus((await res.json()) as WaAdminStatus);
    } catch {
      setWaError('Gagal mengirim perintah ke server WhatsApp.');
    } finally {
      setWaActionBusy(false);
    }
  };

  // Tes LANGSUNG: server memanggil tiap model grounding + klasifikator sungguhan (maks ~6 panggilan API).
  const runProbe = async () => {
    setProbeLoading(true);
    setProbeError(null);
    try {
      const res = await fetch('/api/chat?view=grounding&probe=1&t=15000', {
        method: 'GET',
        headers: { 'x-tts-usage-pin': pin },
        cache: 'no-store',
      });
      if (!res.ok) {
        setProbeError(`Tes gagal (HTTP ${res.status}). Kalau 504, naikkan maxDuration fungsi atau kecilkan &t=.`);
        return;
      }
      const json = (await res.json()) as ProbeResponse & GroundingStatus;
      setProbe({ probe: json.probe, classifier: json.classifier });
      setSearch(json);
    } catch {
      setProbeError('Gagal konek ke server (mungkin kena batas waktu fungsi).');
    } finally {
      setProbeLoading(false);
    }
  };

  // Status riset web (Search Grounding). Dipisah dari kuota TTS supaya kegagalannya
  // (mis. endpoint belum terdeploy) TIDAK menghalangi tampilan kuota TTS. PIN yang sama
  // dikirim lagi lewat header; PIN hanya hidup di state komponen ini selama modal terbuka.
  const fetchSearchStatus = async (pinValue: string) => {
    setSearchLoading(true);
    setSearchError(null);
    try {
      const res = await fetch('/api/chat?view=grounding', {
        method: 'GET',
        headers: { 'x-tts-usage-pin': pinValue },
        cache: 'no-store',
      });
      if (res.status === 401) return setSearchError('PIN ditolak oleh endpoint riset.');
      if (res.status === 429) return setSearchError('Kebanyakan coba, tunggu sebentar.');
      if (res.status === 503) return setSearchError('TTS_USAGE_PIN belum diset di server.');
      if (res.status === 405 || res.status === 404) return setSearchError('Endpoint status riset belum terdeploy.');
      if (!res.ok) return setSearchError('Gagal ambil status riset web.');
      setSearch((await res.json()) as GroundingStatus);
    } catch {
      setSearchError('Gagal konek ke server.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/tts', {
        method: 'GET',
        headers: { 'x-tts-usage-pin': pin },
      });
      if (res.status === 401) {
        setError('PIN salah.');
        return;
      }
      if (res.status === 429) {
        setError('Kebanyakan coba, tunggu sebentar.');
        return;
      }
      if (res.status === 503) {
        setError('TTS_USAGE_PIN belum diset di server.');
        return;
      }
      if (!res.ok) {
        setError('Gagal ambil data usage.');
        return;
      }
      const json = (await res.json()) as TtsUsageResponse;
      setData(json);
      // Tidak di-await: tampilan TTS langsung muncul, status riset & WA menyusul.
      void fetchSearchStatus(pin);
      void fetchWaStatus(pin);
    } catch {
      setError('Gagal konek ke server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Kuota & Usage"
      className="fixed inset-0 z-[999] bg-black/70 flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-xl p-5 w-full max-w-sm text-slate-200 shadow-xl max-h-[88vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-teal-400" /> Kuota & Usage
          </h2>
          <button onClick={onClose} aria-label="Tutup" className="text-slate-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {!data ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="password"
              inputMode="numeric"
              autoFocus
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="PIN"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-500 text-white"
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading || !pin}
              className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-semibold py-2 rounded-lg flex items-center justify-center gap-1.5"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Cek Kuota'}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            {(['chirp', 'wavenet'] as const).map((tier) => {
              const { used, limit } = data[tier];
              const percentage = pct(used, limit);
              const label = tier === 'chirp' ? 'Chirp 3 HD' : 'WaveNet';
              return (
                <div key={tier}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium">{label}</span>
                    <span className="text-slate-400">
                      {fmt(used)} / {fmt(limit)} ({percentage}%)
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        percentage >= 90 ? 'bg-red-500' : percentage >= 70 ? 'bg-amber-500' : 'bg-teal-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
            <p className="text-[10px] text-slate-500 pt-1">Reset otomatis tiap awal bulan.</p>

            {/* ── Riset Web (Search Grounding) ─────────────────────────────── */}
            <div className="border-t border-slate-800 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-200">Riset Web (Search Grounding)</h3>
                <button
                  type="button"
                  onClick={() => void fetchSearchStatus(pin)}
                  disabled={searchLoading}
                  aria-label="Muat ulang status riset"
                  className="text-slate-500 hover:text-white disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${searchLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {!search && searchLoading && (
                <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin" /> Mengambil status...
                </p>
              )}
              {searchError && <p className="text-xs text-red-400">{searchError}</p>}

              {search && (() => {
                const usedPct = pct(search.usedToday, search.dailyCap);
                const { stats } = search;
                const failEntries = Object.entries(stats.failByReason);
                return (
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium">Pencarian hari ini</span>
                        <span className="text-slate-400">
                          {fmt(search.usedToday)} / {fmt(search.dailyCap)} ({usedPct}%)
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            usedPct >= 90 ? 'bg-red-500' : usedPct >= 70 ? 'bg-amber-500' : 'bg-teal-500'
                          }`}
                          style={{ width: `${usedPct}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Batas lokal per instance server (bukan kuota resmi Google; cek dashboard AI Studio untuk itu).
                      </p>
                    </div>

                    <div className="text-[11px] space-y-1">
                      <div className="flex justify-between gap-3">
                        <span className="text-slate-400">Model terakhir berhasil</span>
                        <span className="font-mono text-slate-200 text-right">{search.lastGoodModel || '-'}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-slate-400">Mode pemilihan</span>
                        <span className="text-slate-200 text-right">{search.mode}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-slate-400">Versi kode di server</span>
                        <span className="font-mono text-slate-200 text-right text-[10px] leading-tight">
                          {search.version ? (
                            <>
                              {search.version}
                              <br />
                              {search.versions?.chat} · {search.versions?.intent}
                            </>
                          ) : (
                            'tidak ada penanda (kode lama)'
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-slate-400">Cache hasil</span>
                        <span className="text-slate-200">{fmt(search.cacheSize)} entri</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-[11px] text-slate-400 mb-1">Urutan fallback model</p>
                      <ul className="space-y-1">
                        {search.candidatePool.map((m, i) => {
                          const blockedInfo = search.blocked[m];
                          return (
                            <li key={m} className="flex items-center justify-between gap-2 text-[11px]">
                              <span className="font-mono text-slate-200 truncate">
                                {i + 1}. {m}
                              </span>
                              {blockedInfo ? (
                                <span className="shrink-0 px-1.5 py-0.5 rounded bg-red-500/15 text-red-300 border border-red-500/30">
                                  istirahat {blockedInfo}
                                </span>
                              ) : m === search.lastGoodModel ? (
                                <span className="shrink-0 px-1.5 py-0.5 rounded bg-teal-500/15 text-teal-300 border border-teal-500/30">
                                  aktif
                                </span>
                              ) : (
                                <span className="shrink-0 px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                  siap
                                </span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    <div className="text-[11px] space-y-1">
                      <div className="flex justify-between gap-3">
                        <span className="text-slate-400">Sejak server menyala</span>
                        <span className="text-slate-200 text-right">
                          {fmt(stats.ok)} berhasil · {fmt(stats.cached)} cache · {fmt(stats.failed)} gagal
                        </span>
                      </div>
                      {failEntries.length > 0 && (
                        <p className="text-slate-500">
                          Gagal:{' '}
                          {failEntries.map(([k, v]) => `${FAIL_LABEL[k] || k} ${fmt(v)}x`).join(', ')}
                        </p>
                      )}
                      {stats.lastResult && (
                        <p className="text-slate-500">
                          Terakhir {fmtTime(stats.lastResult.at)}:{' '}
                          {stats.lastResult.ok
                            ? `berhasil (${stats.lastResult.model}, ${stats.lastResult.sources} sumber)`
                            : `gagal (${FAIL_LABEL[stats.lastResult.reason || ''] || stats.lastResult.reason})`}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2 pt-1">
                      <button
                        type="button"
                        onClick={() => void runProbe()}
                        disabled={probeLoading}
                        className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-teal-300 text-xs font-semibold py-2 rounded-lg flex items-center justify-center gap-1.5 border border-slate-700"
                      >
                        {probeLoading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Menguji model (sampai ~15 dtk)...
                          </>
                        ) : (
                          'Tes riset langsung'
                        )}
                      </button>
                      {probeError && <p className="text-xs text-red-400">{probeError}</p>}
                      {probe && (
                        <div className="text-[11px] space-y-2">
                          <p className="text-slate-400">
                            Sumber daftar: <span className="text-slate-200">{probe.probe.source}</span>
                            {probe.probe.discoveryFailed ? ' (ListModels gagal)' : ` (${probe.probe.listedCount} model terdaftar)`}
                            {' · '}Gemma di ListModels:{' '}
                            <span className="text-slate-200 font-mono">
                              {probe.probe.listedGemma.length ? probe.probe.listedGemma.join(', ') : 'tidak ada'}
                            </span>
                          </p>
                          <ul className="space-y-1.5">
                            {probe.probe.rows.map((r) => (
                              <li key={r.model} className="rounded border border-slate-800 bg-slate-950/60 px-2 py-1.5">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-mono text-slate-200 truncate">{r.model}</span>
                                  <span className={r.ok ? 'text-teal-300 shrink-0' : 'text-red-300 shrink-0'}>
                                    {r.ok ? `OK · ${r.sources} sumber` : `GAGAL${r.status ? ` · ${r.status}` : ''}`} · {fmt(r.ms)} ms
                                  </span>
                                </div>
                                {(r.error || r.finishReason || r.restingNow) && (
                                  <p className="text-slate-500 break-words mt-0.5">
                                    {r.restingNow ? `[istirahat ${r.restingNow}] ` : ''}
                                    {r.finishReason && r.finishReason !== 'STOP' ? `finish=${r.finishReason} ` : ''}
                                    {r.error || ''}
                                  </p>
                                )}
                              </li>
                            ))}
                          </ul>
                          <div className="flex justify-between gap-3">
                            <span className="text-slate-400">Klasifikator niat (Gemma)</span>
                            <span className="text-slate-200 text-right">
                              {probe.classifier.verdict
                                ? `needs_web=${String(probe.classifier.verdict.needsWeb)} · ${fmt(probe.classifier.ms)} ms`
                                : `gagal/timeout · ${fmt(probe.classifier.ms)} ms`}
                              {probe.classifier.note ? ` · ${probe.classifier.note}` : ''}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <p className="text-[10px] text-slate-500 leading-snug">
                      Angka ini dari memori satu instance server (aktif {fmtUptime(search.instanceUptimeSec)}); bisa
                      berbeda antar refresh kalau Vercel melayani dari instance lain dan kembali 0 saat cold start.
                    </p>
                  </div>
                );
              })()}
            </div>

            {/* ── WhatsApp Zannah AI (Mode Coexistence) ────────────────────── */}
            <div className="border-t border-slate-800 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp Zannah AI
                </h3>
                <button
                  type="button"
                  onClick={() => void fetchWaStatus(pin)}
                  disabled={waLoading}
                  aria-label="Muat ulang status WhatsApp"
                  className="text-slate-500 hover:text-white disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${waLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {!waStatus && waLoading && (
                <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin" /> Mengambil status WhatsApp...
                </p>
              )}
              {waError && <p className="text-xs text-red-400">{waError}</p>}

              {waStatus && (() => {
                const metaPct = pct(waStatus.metaRepliesUsed, waStatus.metaRepliesLimit);
                const budgetPct = pct(Math.round(waStatus.aiSpendIdr), waStatus.aiBudgetIdr);
                const aiLabelMap: Record<WaAdminStatus['aiMode'], string> = {
                  vertex: 'GCP Vertex AI (Aman)',
                  aistudio_dedicated: 'AI Studio Key Khusus',
                  aistudio_shared: 'Shared AI Studio',
                  unconfigured: 'Belum dikonfigurasi',
                };

                return (
                  <div className="space-y-3">
                    {/* Saklar Global ON / OFF */}
                    <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2">
                      <div>
                        <p className="text-xs font-semibold text-slate-200">
                          Status Bot: {waStatus.enabled ? 'Aktif Menjaga WA' : 'Nonaktif (Diam)'}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Jeda pintar {waStatus.smartDelaySec} dtk · +{waStatus.ownerPhone}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={waActionBusy}
                        onClick={() => void runWaAdminAction({ op: 'toggle', enabled: !waStatus.enabled })}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-colors disabled:opacity-50 ${
                          waStatus.enabled
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                        }`}
                      >
                        <Power className="w-3 h-3" />
                        {waStatus.enabled ? 'ON' : 'OFF'}
                      </button>
                    </div>

                    {/* Kuota Gratis 1.000 Pesan Meta */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium">Balasan Gratis Meta</span>
                        <span className="text-slate-400">
                          {fmt(waStatus.metaRepliesUsed)} / {fmt(waStatus.metaRepliesLimit)} ({metaPct}%)
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            metaPct >= 90 ? 'bg-red-500' : metaPct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${metaPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Pagu Anggaran Bulanan Vertex AI */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium">Anggaran AI Bulanan</span>
                        <span className="text-slate-400">
                          Rp{waStatus.aiSpendIdr.toLocaleString('id-ID')} / Rp{fmt(waStatus.aiBudgetIdr)} ({budgetPct}%)
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            budgetPct >= 90 ? 'bg-red-500' : budgetPct >= 70 ? 'bg-amber-500' : 'bg-teal-500'
                          }`}
                          style={{ width: `${budgetPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Ringkasan Konfigurasi */}
                    <div className="text-[11px] space-y-1">
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-400">Otak AI WA</span>
                        <span className="text-slate-200 text-right">{aiLabelMap[waStatus.aiMode]}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-400">Kontak HP Tersinkron</span>
                        <span className="text-slate-200">
                          {fmt(waStatus.syncedContactsCount)} kontak ({waStatus.skipSavedContacts ? 'auto-skip' : 'aktif'})
                        </span>
                      </div>
                      {waStatus.lastSelfCommand && (
                        <div className="flex justify-between gap-2">
                          <span className="text-slate-400">Perintah WA Terakhir</span>
                          <span className="font-mono text-slate-300 truncate max-w-[160px]">
                            {waStatus.lastSelfCommand.cmd} ({fmtTime(waStatus.lastSelfCommand.at)})
                          </span>
                        </div>
                      )}
                      {waStatus.lastDelivery && (
                        <div
                          className={`rounded px-2 py-1.5 mt-1 border text-[10px] leading-snug ${
                            waStatus.lastDelivery.state === 'failed' || waStatus.lastDelivery.state === 'ai_error'
                              ? 'bg-red-500/10 border-red-500/30 text-red-300'
                              : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                          }`}
                        >
                          <div className="flex justify-between font-medium">
                            <span>
                              Status Kirim Terakhir:{' '}
                              {waStatus.lastDelivery.state === 'failed'
                                ? `GAGAL${waStatus.lastDelivery.code ? ` (#${waStatus.lastDelivery.code})` : ''}`
                                : waStatus.lastDelivery.state === 'ai_error'
                                ? 'AI ERROR'
                                : waStatus.lastDelivery.state.toUpperCase()}
                            </span>
                            <span className="opacity-75">{fmtTime(waStatus.lastDelivery.at)}</span>
                          </div>
                          {waStatus.lastDelivery.detail && (
                            <p className="mt-0.5 break-words opacity-90">{waStatus.lastDelivery.detail}</p>
                          )}
                        </div>
                      )}
                      {waStatus.missingEnv.length > 0 && (
                        <p className="text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/25 rounded px-2 py-1 mt-1">
                          Env belum diset: {waStatus.missingEnv.join(', ')}
                        </p>
                      )}
                    </div>

                    {/* Daftar Nomor Pengecualian Manual (Skip List) */}
                    <div className="space-y-2 pt-1">
                      <p className="text-[11px] font-medium text-slate-300">
                        Daftar Nomor Pengecualian ({waStatus.skipList.length})
                      </p>
                      <div className="flex gap-1.5">
                        <input
                          type="tel"
                          value={newSkipPhone}
                          onChange={(e) => setNewSkipPhone(e.target.value)}
                          placeholder="0812xxxx (abaikan Zannah)"
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-teal-500 text-white"
                        />
                        <button
                          type="button"
                          disabled={waActionBusy || !newSkipPhone.trim()}
                          onClick={() => {
                            const val = newSkipPhone.trim();
                            if (!val) return;
                            setNewSkipPhone('');
                            void runWaAdminAction({ op: 'add_skip', phone: val });
                          }}
                          aria-label="Tambah nomor pengecualian"
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-teal-300 rounded-lg border border-slate-700 flex items-center gap-1 text-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {waStatus.skipList.length > 0 && (
                        <ul className="max-h-28 overflow-y-auto space-y-1 pr-0.5">
                          {waStatus.skipList.map((p) => (
                            <li
                              key={p}
                              className="flex items-center justify-between text-[11px] bg-slate-950/60 border border-slate-800 rounded px-2 py-1"
                            >
                              <span className="font-mono text-slate-300">+{p}</span>
                              <button
                                type="button"
                                disabled={waActionBusy}
                                onClick={() => void runWaAdminAction({ op: 'remove_skip', phone: p })}
                                aria-label={`Hapus ${p}`}
                                className="text-slate-500 hover:text-red-400 disabled:opacity-50"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};