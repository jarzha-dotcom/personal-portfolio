import React from 'react';
import { useInView } from '../hooks/useInView';

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
}

// Fade-in-up sekali saat elemen pertama kali kelihatan di layar. Dipakai
// membungkus section-section di App.tsx & CVPage.tsx — Hero/HeroCV sengaja
// TIDAK dibungkus karena keduanya langsung kelihatan tanpa perlu discroll,
// jadi animasinya justru bikin first impression lebih lambat, bukan bagus.
export const Reveal: React.FC<RevealProps> = ({ children, delay = 0 }) => {
  const { ref, isInView } = useInView<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
      style={{ transitionDelay: isInView ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  );
};
