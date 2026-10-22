import { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

/**
 * Menunda unmount supaya animasi keluar sempat jalan.
 *   const { mounted, closing } = usePresence(isOpen, 200);
 *   if (!mounted) return null;  // pasang kelas "is-closing" saat closing
 * Reduced motion → unmount langsung.
 */
export function usePresence(open: boolean, exitMs = 200) {
  const reduced = usePrefersReducedMotion();
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setClosing(false);
      return;
    }
    if (!mounted) return;
    if (reduced || exitMs <= 0) {
      setMounted(false);
      return;
    }
    setClosing(true);
    const t = window.setTimeout(() => {
      setMounted(false);
      setClosing(false);
    }, exitMs);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, exitMs, reduced]);

  return { mounted: open || mounted, closing: !open && closing };
}
