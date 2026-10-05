import { useEffect, useState } from 'react';

/** Di bawah breakpoint `sm` Tailwind (640px) — dipakai nudge untuk memilih tampilan ringkas. */
const QUERY = '(max-width: 639px)';

export const useIsMobile = (): boolean => {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(QUERY).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return isMobile;
};
