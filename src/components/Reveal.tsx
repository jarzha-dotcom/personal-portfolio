import React, { useEffect, useState } from 'react';
import { useInView } from '../hooks/useInView';

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
}

const TRANSITION_MS = 700;

// Fade-in-up sekali saat elemen pertama kali kelihatan di layar. Dipakai
// membungkus section-section di App.tsx & CVPage.tsx — Hero/HeroCV sengaja
// TIDAK dibungkus karena keduanya langsung kelihatan tanpa perlu discroll,
// jadi animasinya justru bikin first impression lebih lambat, bukan bagus.
export const Reveal: React.FC<RevealProps> = ({ children, delay = 0 }) => {
  const { ref, isInView } = useInView<HTMLDivElement>();
  const [settled, setSettled] = useState(false);

  // Begitu transisi selesai, class translate-y-* dilepas SELURUHNYA dari
  // wrapper ini — bukan cuma dibiarkan di translate-y-0. Elemen dengan
  // `transform` apa pun yang ter-set (termasuk translate(0,0), yang secara
  // visual sama saja dengan tanpa transform) tetap membuat containing block
  // baru di browser, dan itu mematahkan `position: sticky` pada SEMUA
  // descendant-nya — termasuk section apa pun yang kebetulan dibungkus
  // Reveal ini dan berisi elemen sticky (mis. sidebar chatbot di Projects).
  // Menghapus transform sepenuhnya setelah animasi kelar tidak menimbulkan
  // kedutan visual karena translate(0,0) dan "tanpa transform" identik
  // secara tampilan — bedanya cuma di belakang layar.
  useEffect(() => {
    if (!isInView || settled) return;
    const t = window.setTimeout(() => setSettled(true), TRANSITION_MS + delay + 50);
    return () => window.clearTimeout(t);
  }, [isInView, settled, delay]);

  const translateClass = settled ? '' : isInView ? 'translate-y-0' : 'translate-y-6';

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isInView ? 'opacity-100' : 'opacity-0'
      } ${translateClass}`}
      style={{ transitionDelay: isInView ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  );
};