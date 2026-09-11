// Naikkan CACHE_VERSION tiap kali strategi caching di file ini berubah, biar
// client lama otomatis pindah ke cache baru lewat event 'activate' di bawah.
const CACHE_VERSION = 'v2';
const APP_SHELL_CACHE = `app-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline.html';

// File minimal yang wajib ada biar halaman tetap bisa dibuka waktu offline.
// Sengaja tidak precache semua asset JS/CSS hasil build (nama file berubah
// tiap build/hash) — itu ditangani runtime cache di bagian fetch handler.
const APP_SHELL_FILES = [
    '/',
    '/offline.html',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(APP_SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL_FILES))
    );
    // Sengaja TIDAK skipWaiting() otomatis di sini — biar tab yang lagi aktif
    // nggak ke-reload paksa. Update baru dipasang setelah user klik "Muat ulang"
    // di PWAUpdateToast (lihat pesan 'SKIP_WAITING' di bawah).
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    keys
                        .filter((key) => key !== APP_SHELL_CACHE && key !== RUNTIME_CACHE)
                        .map((key) => caches.delete(key))
                )
            )
            .then(() => self.clients.claim())
    );
});

self.addEventListener('message', (event) => {
    if (event.data?.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);
    // Request cross-origin (Google Fonts, dsb) dibiarkan apa adanya — jangan
    // ikut cache/intercept biar tidak ada masalah CORS dengan cache API.
    if (url.origin !== self.location.origin) return;

    // Navigasi halaman (buka link / reload) → network-first, fallback ke cache,
    // fallback terakhir ke halaman offline.
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const clone = response.clone();
                    caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
                    return response;
                })
                .catch(() => caches.match(request).then((cached) => cached || caches.match(OFFLINE_URL)))
        );
        return;
    }

    // Asset statis (JS/CSS/gambar/font lokal) → stale-while-revalidate: langsung
    // sajikan dari cache kalau ada (cepat), sambil diam-diam update di background.
    event.respondWith(
        caches.match(request).then((cached) => {
            const networkFetch = fetch(request)
                .then((response) => {
                    if (response.ok) {
                        const contentType = response.headers.get('content-type') || '';
                        // Cegah caching jika server merespon dengan text/html (misal fallback SPA 404) untuk file JS/CSS
                        const isInvalidAsset =
                            (url.pathname.endsWith('.js') && !contentType.includes('javascript')) ||
                            (url.pathname.endsWith('.css') && !contentType.includes('css'));

                        if (!isInvalidAsset) {
                            const clone = response.clone();
                            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
                        }
                    }
                    return response;
                })
                .catch(() => cached);

            // Validasi file cached: jika file .js di cache bertipe text/html, hapus dan paksa fetch dari network
            if (cached) {
                const cachedType = cached.headers.get('content-type') || '';
                if (url.pathname.endsWith('.js') && !cachedType.includes('javascript')) {
                    caches.open(RUNTIME_CACHE).then((cache) => cache.delete(request));
                    return networkFetch;
                }
            }

            return cached || networkFetch;
        })
    );
});