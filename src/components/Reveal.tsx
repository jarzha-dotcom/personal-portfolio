import React, { useEffect, useState } from 'react';
import { useInView } from '../hooks/useInView';

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
}

const TRANSITION_MS = 500;

// Dipicu saat bagian atas section masih ±30% tinggi layar di bawah tepi layar,
// jadi fade-in sudah berjalan sebelum user sampai. Sebelumnya (threshold 15%
// dari TINGGI section) section yang panjang di HP baru muncul setelah ratusan
// piksel-nya terlihat — layar tampak blank selama itu.
const PRELOAD_MARGIN = '0px 0px 30% 0px';

// Fade-in-up sekali saat elemen pertama kali kelihatan di layar. Dipakai
// membungkus section-section di App.tsx & CVPage.tsx — Hero/HeroCV sengaja
// TIDAK dibungkus karena keduanya langsung kelihatan tanpa perlu discroll,
// jadi animasinya justru bikin first impression lebih lambat, bukan bagus.
export const Reveal: React.FC<RevealProps> = ({ children, delay = 0 }) => {
  const { ref, isInView } = useInView<HTMLDivElement>(0, PRELOAD_MARGIN);
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

  const translateClass = settled ? '' : isInView ? 'translate-y-0' : 'translate-y-4';

  return (
    <div
      ref={ref}
      className={`transition-all duration-500 ease-out ${
        isInView ? 'opacity-100' : 'opacity-0'
      } ${translateClass}`}
      style={{ transitionDelay: isInView ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  );
};