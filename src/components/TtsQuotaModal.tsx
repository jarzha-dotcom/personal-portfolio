import React, { useState } from 'react';
import { X, Loader2, ShieldAlert } from 'lucide-react';

interface TierUsage {
  used: number;
  limit: number;
}

interface TtsUsageResponse {
  chirp: TierUsage;
  wavenet: TierUsage;
  standard: TierUsage;
}

interface TtsQuotaModalProps {
  onClose: () => void;
}

const fmt = (n: number) => n.toLocaleString('id-ID');
const pct = (used: number, limit: number) => (limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0);

/**
 * Modal "rahasia" buat ngecek pemakaian kuota TTS bulan ini -- dipicu dari
 * easter egg (tap berulang di suatu elemen, lihat Footer.tsx). Minta PIN
 * dulu tiap dibuka; PIN gak pernah disimpan di frontend/localStorage,
 * cuma dikirim sekali ke api/tts-usage.ts buat divalidasi server-side.
 */
export const TtsQuotaModal: React.FC<TtsQuotaModalProps> = ({ onClose }) => {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TtsUsageResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/tts-usage', {
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
      if (!res.ok) {
        setError('Gagal ambil data usage.');
        return;
      }
      const json = (await res.json()) as TtsUsageResponse;
      setData(json);
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
      aria-label="TTS Quota Usage"
      className="fixed inset-0 z-[999] bg-black/70 flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-xl p-5 w-full max-w-sm text-slate-200 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-teal-400" /> TTS Quota Usage
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
            {(['chirp', 'wavenet', 'standard'] as const).map((tier) => {
              const { used, limit } = data[tier];
              const percentage = pct(used, limit);
              const label = tier === 'chirp' ? 'Chirp 3 HD' : tier === 'wavenet' ? 'WaveNet' : 'Standard';
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
          </div>
        )}
      </div>
    </div>
  );
};