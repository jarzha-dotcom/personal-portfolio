import { useEffect, useRef, useState } from 'react';

/**
 * Mendeteksi kapan sebuah elemen pertama kali masuk viewport, lalu
 * berhenti mengamati (animasi cuma jalan sekali, tidak "kedip" lagi
 * saat user scroll naik-turun berulang). `rootMargin` positif di sisi bawah
 * (mis. '0px 0px 30% 0px') memicu LEBIH AWAL, sebelum elemen masuk layar. Menghormati preferensi
 * prefers-reduced-motion — kalau user mengaktifkan itu di OS-nya,
 * elemen langsung dianggap "in view" tanpa observer sama sekali.
 */
export function useInView<T extends HTMLElement>(threshold = 0.15, rootMargin = '0px') {
  const ref = useRef<T>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReducedMotion) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return { ref, isInView };
}
