import React from 'react';
import { useScrollProgress } from '../hooks/useScrollProgress';

export const ReadingProgress: React.FC = () => {
  const progress = useScrollProgress();

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-transparent"
    >
      <div
        className="h-full bg-gradient-to-r from-teal-400 via-teal-500 to-emerald-500 transition-[width] duration-150 ease-out shadow-[0_0_8px_rgba(20,184,166,0.5)]"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};