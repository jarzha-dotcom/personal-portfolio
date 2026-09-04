import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { cleanupStaleCache } from './utils/chatStorage';

// Bersihkan cache chat dari build lama saat app pertama kali load
cleanupStaleCache();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
