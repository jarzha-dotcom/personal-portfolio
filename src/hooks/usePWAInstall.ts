import { useCallback, useEffect, useRef, useState } from 'react';

// Event 'beforeinstallprompt' belum masuk ke lib.dom.d.ts TypeScript bawaan,
// jadi tipenya didefinisikan manual di sini.
interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
    prompt(): Promise<void>;
}

const isIOSDevice = (): boolean => {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    // iPadOS 13+ menyamar sebagai "Macintosh" di user agent, dibedakan lewat touch support
    const isIPadOS = ua.includes('Macintosh') && navigator.maxTouchPoints > 1;
    return isIOS || isIPadOS;
};

const isStandaloneMode = (): boolean => {
    if (typeof window === 'undefined') return false;
    const mql = window.matchMedia('(display-mode: standalone)').matches;
    // Property non-standar yang dipakai Safari lama untuk deteksi mode standalone
    const iosStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    return mql || iosStandalone;
};

export interface UsePWAInstallResult {
    /** True kalau browser sudah nge-fire beforeinstallprompt & siap dipromptkan */
    canInstall: boolean;
    /** True setelah user berhasil install (event 'appinstalled') */
    isInstalled: boolean;
    /** True kalau app sudah berjalan dalam mode standalone (sudah ter-install) */
    isStandalone: boolean;
    /** Safari iOS tidak support beforeinstallprompt, jadi perlu instruksi manual */
    isIOS: boolean;
    /** Panggil dari klik tombol "Install" — resolve true kalau user accept */
    promptInstall: () => Promise<boolean>;
}

export const usePWAInstall = (): UsePWAInstallResult => {
    const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
    const [canInstall, setCanInstall] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            deferredPromptRef.current = e as BeforeInstallPromptEvent;
            setCanInstall(true);
        };

        const handleAppInstalled = () => {
            deferredPromptRef.current = null;
            setCanInstall(false);
            setIsInstalled(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const promptInstall = useCallback(async (): Promise<boolean> => {
        const deferred = deferredPromptRef.current;
        if (!deferred) return false;

        await deferred.prompt();
        const { outcome } = await deferred.userChoice;
        deferredPromptRef.current = null;
        setCanInstall(false);
        return outcome === 'accepted';
    }, []);

    return {
        canInstall,
        isInstalled,
        isStandalone: isStandaloneMode(),
        isIOS: isIOSDevice(),
        promptInstall,
    };
};