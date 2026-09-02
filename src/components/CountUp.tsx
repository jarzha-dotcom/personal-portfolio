import React, { useEffect, useState } from 'react';
import { useInView } from '../hooks/useInView';

interface CountUpProps {
  /** Nilai asli dari data, misal '7+', '99%', '100+', '3' */
  value: string;
  className?: string;
}

// Mengurai angka di depan string ('7+' -> 7, sisanya '+' dipakai lagi
// sebagai suffix) lalu animasikan dari 0 ke angka itu saat elemen masuk
// viewport. Kalau formatnya bukan angka di depan, tampilkan apa adanya.
export const CountUp: React.FC<CountUpProps> = ({ value, className }) => {
  const { ref, isInView } = useInView<HTMLSpanElement>();
  const match = value.match(/^(\d+)(.*)$/);
  const target = match ? parseInt(match[1], 10) : null;
  const suffix = match ? match[2] : '';
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView || target === null) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (prefersReducedMotion) {
      setDisplay(target);
      return;
    }

    const duration = 1200;
    const start = performance.now();
    let raf: number;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isInView, target]);

  if (target === null) {
    return (
      <span ref={ref} className={className}>
        {value}
      </span>
    );
  }

  return (
    <span ref={ref} className={className}>
      {display}
      {suffix}
    </span>
  );
};
