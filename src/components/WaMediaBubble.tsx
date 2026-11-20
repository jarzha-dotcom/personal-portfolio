import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Download,
  ExternalLink,
  FileText,
  FileSpreadsheet,
  Film,
  Loader2,
  Mic,
  Play,
  X,
  AlertTriangle,
} from 'lucide-react';

export type WaMediaKind = 'image' | 'document' | 'video' | 'audio';

export interface WaMediaAttachment {
  type: WaMediaKind;
  driveFileId: string;
  driveViewLink: string;
  fileName?: string;
  mimeType: string;
  fileSizeBytes?: number;
  caption?: string;
}

/**
 * `<img>`/`<video>` tidak bisa mengirim header PIN, jadi file diambil dengan `fetch`
 * (header `x-tts-usage-pin`) lalu dipakai lewat object URL. URL dilepas saat unmount.
 */
function useProtectedBlob(pin: string, fileId: string) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const urlRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const release = useCallback(() => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
  }, []);

  const load = useCallback(async (): Promise<string | null> => {
    if (urlRef.current) return urlRef.current;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/wa-media?id=${encodeURIComponent(fileId)}`, {
        headers: { 'x-tts-usage-pin': pin },
        signal: ctrl.signal,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      urlRef.current = objectUrl;
      setUrl(objectUrl);
      return objectUrl;
    } catch (e: any) {
      if (e?.name !== 'AbortError') setError(e?.message || 'Gagal memuat file');
      return null;
    } finally {
      if (abortRef.current === ctrl) setLoading(false);
    }
  }, [pin, fileId]);

  useEffect(
    () => () => {
      abortRef.current?.abort();
      release();
    },
    [release]
  );

  return { url, loading, error, load };
}

function formatBytes(n?: number): string {
  if (!n || n <= 0) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/** Teks turn yang hanya placeholder/label otomatis tidak ditampilkan lagi di atas bubble media. */
export function stripMediaPlaceholder(text: string): string {
  return text
    .split('\n')
    .filter((line) => {
      const t = line.trim();
      if (!t) return true;
      if (/^\[(Pengirim|Lampiran dokumen)[^\]]*\]$/.test(t)) return false;
      if (/^\[(📷|🎥|🎤|📄)[^\]]*\]$/.test(t)) return false;
      return true;
    })
    .join('\n')
    .trim();
}

interface Props {
  media: WaMediaAttachment;
  pin: string;
}

const ErrorLine: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <div className="flex items-center gap-1.5 text-[11px] text-red-400">
    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
    <span className="truncate">{message}</span>
    <button type="button" onClick={onRetry} className="underline hover:text-red-300 shrink-0">
      Coba lagi
    </button>
  </div>
);

/* ── Gambar: dimuat otomatis, klik untuk lightbox ── */
const ImageMedia: React.FC<Props> = ({ media, pin }) => {
  const { url, loading, error, load } = useProtectedBlob(pin, media.driveFileId);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (error) return <ErrorLine message={error} onRetry={() => void load()} />;
  if (!url) {
    return (
      <div className="w-48 h-32 rounded-lg bg-slate-800/60 border border-slate-700 flex items-center justify-center text-slate-500">
        {loading && <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />}
      </div>
    );
  }
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="block rounded-lg overflow-hidden border border-slate-700/80">
        <img
          src={url}
          alt={media.fileName || 'Foto dari pengirim'}
          className="max-h-64 max-w-full object-cover"
          draggable={false}
        />
      </button>
      {open && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 text-white hover:bg-slate-700"
            title="Tutup (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={url}
            alt={media.fileName || 'Foto dari pengirim'}
            className="max-h-full max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

/* ── Dokumen: kartu dengan Buka & Unduh (diambil saat diklik) ── */
const DocumentMedia: React.FC<Props> = ({ media, pin }) => {
  const { loading, error, load } = useProtectedBlob(pin, media.driveFileId);
  const isSheet = /sheet|excel|csv/i.test(media.mimeType);
  const isPdf = media.mimeType === 'application/pdf';
  const Icon = isSheet ? FileSpreadsheet : FileText;
  const name = media.fileName || 'Dokumen';

  const open = async () => {
    // Buka tab kosong SEKARANG (masih dalam gestur klik) agar tidak diblokir pop-up blocker,
    // lalu arahkan ke blob setelah file selesai diunduh.
    const w = window.open('', '_blank');
    if (w) w.opener = null;
    const u = await load();
    if (!u) {
      w?.close();
      return;
    }
    if (w) w.location.href = u;
    else window.open(u, '_blank');
  };

  const download = async () => {
    const u = await load();
    if (!u) return;
    const a = document.createElement('a');
    a.href = u;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2.5 rounded-lg bg-slate-950/60 border border-slate-700/80 p-2.5 min-w-[13rem]">
        <div className="w-9 h-9 rounded bg-emerald-500/15 text-emerald-300 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-slate-100 truncate" title={name}>
            {name}
          </p>
          <p className="text-[10px] text-slate-400">{formatBytes(media.fileSizeBytes) || 'Dokumen'}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {isPdf && (
            <button
              type="button"
              onClick={() => void open()}
              disabled={loading}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white disabled:opacity-50"
              title="Buka di tab baru"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
            </button>
          )}
          <button
            type="button"
            onClick={() => void download()}
            disabled={loading}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white disabled:opacity-50"
            title="Unduh"
          >
            {loading && !isPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          </button>
        </div>
      </div>
      {error && <ErrorLine message={error} onRetry={() => void load()} />}
    </div>
  );
};

/* ── Video & audio: diunduh hanya setelah diklik (hemat kuota/transfer) ── */
const PlayerMedia: React.FC<Props> = ({ media, pin }) => {
  const { url, loading, error, load } = useProtectedBlob(pin, media.driveFileId);
  const isVideo = media.type === 'video';
  const Icon = isVideo ? Film : Mic;

  if (url) {
    return isVideo ? (
      <video src={url} controls autoPlay playsInline className="max-h-64 max-w-full rounded-lg border border-slate-700/80" />
    ) : (
      <audio src={url} controls autoPlay className="w-60 max-w-full" />
    );
  }

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={() => void load()}
        disabled={loading}
        className="flex items-center gap-2.5 rounded-lg bg-slate-950/60 border border-slate-700/80 hover:border-emerald-500/50 p-2.5 min-w-[13rem] text-left disabled:opacity-70 transition-colors"
      >
        <div className="w-9 h-9 rounded-full bg-emerald-500/15 text-emerald-300 flex items-center justify-center shrink-0">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-slate-100 flex items-center gap-1">
            <Icon className="w-3 h-3 text-slate-400" />
            {isVideo ? 'Putar video' : 'Putar audio'}
          </p>
          <p className="text-[10px] text-slate-400">{formatBytes(media.fileSizeBytes) || 'Ketuk untuk memuat'}</p>
        </div>
      </button>
      {error && <ErrorLine message={error} onRetry={() => void load()} />}
    </div>
  );
};

export const WaMediaBubble: React.FC<Props> = ({ media, pin }) => {
  if (!media?.driveFileId) return null;
  switch (media.type) {
    case 'image':
      return <ImageMedia media={media} pin={pin} />;
    case 'video':
    case 'audio':
      return <PlayerMedia media={media} pin={pin} />;
    default:
      return <DocumentMedia media={media} pin={pin} />;
  }
};
