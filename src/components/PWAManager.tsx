import React, { useEffect, useState } from 'react';
import { PWAInstallPrompt } from './PWAInstallPrompt';
import { PWAUpdateToast } from './PWAUpdateToast';
import { registerServiceWorker, applyServiceWorkerUpdate } from '../utils/registerServiceWorker';

interface PWAManagerProps {
    darkMode: boolean;
}

/**
 * Satu titik integrasi untuk semua fitur PWA: daftarin service worker, lalu
 * tampilkan banner install (Android/desktop/iOS) dan toast update kalau ada
 * versi baru. Cukup taruh <PWAManager darkMode={darkMode} /> sekali di App.tsx
 * (di luar konten utama, sejajar dengan Navbar).
 */
export const PWAManager: React.FC<PWAManagerProps> = ({ darkMode }) => {
    const [updateReg, setUpdateReg] = useState<ServiceWorkerRegistration | null>(null);

    useEffect(() => {
        registerServiceWorker((registration) => setUpdateReg(registration));
    }, []);

    return (
        <>
            <PWAInstallPrompt darkMode={darkMode} />
            {updateReg && (
                <PWAUpdateToast darkMode={darkMode} onReload={() => applyServiceWorkerUpdate(updateReg)} />
            )}
        </>
    );
};