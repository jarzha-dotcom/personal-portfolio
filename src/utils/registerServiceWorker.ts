const isLocalDevHost = (): boolean => {
    const { hostname } = window.location;
    return (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '[::1]' ||
        hostname.endsWith('.local')
    );
};

/**
 * Bersihkan service worker + cache lama. Dipanggil otomatis saat dev/localhost
 * terdeteksi, jaga-jaga kalau sebelumnya sempat ke-register (mis. dari nyoba
 * `vite preview` atau build production di mesin yang sama) — tanpa ini, SW
 * lama bisa nyangkut dan bikin perubahan kode terasa "nggak update" walau
 * file sudah jelas berubah, karena browser masih nyajiin dari cache lama.
 */
const unregisterAndClearCaches = async () => {
    try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((reg) => reg.unregister()));
    } catch (err) {
        console.warn('Gagal unregister service worker lama:', err);
    }

    if ('caches' in window) {
        try {
            const keys = await caches.keys();
            await Promise.all(keys.map((key) => caches.delete(key)));
        } catch (err) {
            console.warn('Gagal hapus cache lama:', err);
        }
    }
};

/**
 * Registrasi service worker + deteksi update.
 * Dipanggil sekali dari PWAManager, idealnya setelah window 'load' biar tidak
 * mengganggu render pertama halaman.
 *
 * SENGAJA tidak jalan di dev/localhost — service worker gampang bikin cache
 * "nyangkut" saat development (kode sudah kamu ubah tapi browser masih nyajiin
 * versi lama dari SW). Fitur offline/update cuma relevan di build production
 * yang sudah di-deploy ke domain asli.
 */
export const registerServiceWorker = (
    onUpdateAvailable?: (registration: ServiceWorkerRegistration) => void
) => {
    if (!('serviceWorker' in navigator)) return;

    const isDev = Boolean(import.meta.env?.DEV);
    if (isDev || isLocalDevHost()) {
        void unregisterAndClearCaches();
        return;
    }

    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/sw.js')
            .then((registration) => {
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (!newWorker) return;

                    newWorker.addEventListener('statechange', () => {
                        // 'installed' + sudah ada controller aktif = versi baru siap,
                        // bukan instalasi service worker pertama kali.
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            onUpdateAvailable?.(registration);
                        }
                    });
                });
            })
            .catch((err) => {
                console.error('Gagal mendaftarkan service worker:', err);
            });
    });
};

/** Kirim sinyal ke service worker yang lagi "waiting" supaya langsung aktif, lalu reload halaman */
export const applyServiceWorkerUpdate = (registration: ServiceWorkerRegistration) => {
    const waitingWorker = registration.waiting;
    if (!waitingWorker) {
        window.location.reload();
        return;
    }

    const handleControllerChange = () => {
        window.location.reload();
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
};