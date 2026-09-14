import React from 'react';
import { RotateCw } from 'lucide-react';

interface ChunkErrorBoundaryProps {
  children: React.ReactNode;
  darkMode?: boolean;
  /** Pesan yang tampil di kartu error. Default cocok untuk widget kecil (ChatWidget). */
  message?: string;
  /**
   * Posisi kartu error. 'corner' (default) untuk widget kecil yang mengambang
   * di pojok layar (ChatWidget). 'center' untuk chunk full-page (CVPage).
   */
  variant?: 'corner' | 'center';
}

interface ChunkErrorBoundaryState {
  hasError: boolean;
}

/**
 * Menangkap error dari dynamic import() yang gagal di dalam <Suspense> anak-anaknya
 * (mis. koneksi mobile putus pas fetch chunk `ChatWidget` / `CVPage`). Tanpa boundary
 * ini, Suspense fallback akan nyangkut/putih tanpa ada cara bagi user untuk retry.
 *
 * Catatan: boundary ini HANYA menangkap error saat render (termasuk error dari
 * React.lazy), bukan error async di luar siklus render React.
 */
export class ChunkErrorBoundary extends React.Component<
  ChunkErrorBoundaryProps,
  ChunkErrorBoundaryState
> {
  state: ChunkErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ChunkErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown): void {
    // eslint-disable-next-line no-console
    console.error('[ChunkErrorBoundary] Gagal memuat bagian halaman:', error);
  }

  handleRetry = (): void => {
    // Full reload adalah cara paling andal untuk pulih dari dynamic import
    // yang gagal — kasus paling umum adalah chunk lama sudah di-cache
    // browser tapi filenya sudah tidak ada lagi di server setelah deploy
    // baru (hash chunk berubah). Sekadar reset state error tidak cukup
    // karena import() yang sama kemungkinan besar akan gagal lagi.
    window.location.reload();
  };

  render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { darkMode, variant = 'corner' } = this.props;
    const message =
      this.props.message ?? 'Gagal memuat bagian ini. Cek koneksi internet Kakak, lalu coba lagi.';

    const cardClasses = `rounded-xl border shadow-lg p-3.5 text-xs max-w-[240px] ${
      darkMode
        ? 'bg-slate-900 border-slate-700 text-slate-200'
        : 'bg-white border-slate-200 text-slate-700'
    }`;

    const wrapperClasses =
      variant === 'center'
        ? 'fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 px-4'
        : 'fixed bottom-6 right-6 z-40';

    return (
      <div role="alert" className={wrapperClasses}>
        <div className={cardClasses}>
          <p className="mb-2 leading-relaxed">{message}</p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="flex items-center gap-1.5 font-medium text-teal-500 hover:text-teal-400 hover:underline"
          >
            <RotateCw className="w-3 h-3" />
            Coba lagi
          </button>
        </div>
      </div>
    );
  }
}