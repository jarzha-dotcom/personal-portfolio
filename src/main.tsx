import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { cleanupStaleCache } from './utils/chatStorage';
import { printConsoleGreeting } from './utils/consoleGreeting';

// Bersihkan cache chat dari build lama saat app pertama kali load
cleanupStaleCache();

// Sapaan buat yang suka ngoprek (dicetak sekali, di luar React)
printConsoleGreeting();

// Tangani kegagalan dynamic import Vite (misal saat versi baru dideploy / chunk hash berubah)
window.addEventListener('vite:preloadError', (event) => {
  console.warn('Dynamic import chunk failed to load, reloading to fetch latest assets...', event);
  window.location.reload();
});

// Registrasi Service Worker untuk PWA & offline caching
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Service Worker registration failed:', err);
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);