import { useEffect, useState } from 'react';

/**
 * Membaca preferensi `prefers-reduced-motion` OS dan tetap live-sync kalau
 * user mengubahnya di tengah sesi (mis. lewat Settings aksesibilitas).
 * Dipakai untuk mematikan animasi non-esensial (hover scale, slide-in, dll)
 * buat user yang secara eksplisit meminta lebih sedikit gerakan di layar.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return reduced;
}
