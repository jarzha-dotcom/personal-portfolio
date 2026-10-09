// Naikkan CACHE_VERSION tiap kali strategi caching di file ini berubah, biar
// client lama otomatis pindah ke cache baru lewat event 'activate' di bawah.
const CACHE_VERSION = 'v5';
const APP_SHELL_CACHE = `app-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline.html';

// Galeri demo (folder statis di public/demos/, di luar SPA). File HTML demo
// besar (sampai ~4 MB) dan jarang dibuka offline, jadi navigasi ke sana tidak
// ikut di-cache. demos.json dilayani network-first supaya demo baru langsung
// muncul di galeri & DemoShowcaseNudge, bukan telat satu kunjungan.
const DEMOS_PREFIX = '/demos/';
const DEMOS_MANIFEST = '/demos/demos.json';

// Rute client-side yang dilayani index.html (lihat ROUTES di hooks/usePathname.ts).
// Kalau offline dan halaman ini belum pernah dibuka, jatuh ke app shell '/'
// (React yang merender halamannya) alih-alih offline.html.
const SPA_ROUTES = ['/hasil-kerja', '/artikel'];
// Artikel pakai slug dinamis (/artikel/xxx) — dicek lewat prefix, bukan
// daftar tetap seperti SPA_ROUTES di atas.
const SPA_ROUTE_PREFIXES = ['/artikel/'];

// ZhaNotes: aplikasi statis terpisah di /zhanotes/ (satu index.html besar).
// Alamat /zhanotes, /zhanotes/ dan /zhanotes/index.html dianggap halaman yang
// sama: disimpan di satu kunci cache kanonik supaya offline tetap jalan
// walau dibuka lewat alamat yang berbeda dari kunjungan pertama.
const ZHANOTES_PREFIX = '/zhanotes';
const ZHANOTES_CANONICAL = '/zhanotes/';
const isZhaNotesPage = (pathname) =>
    pathname === ZHANOTES_PREFIX ||
    pathname === ZHANOTES_CANONICAL ||
    pathname === ZHANOTES_CANONICAL + 'index.html';

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
                    if (!url.pathname.startsWith(DEMOS_PREFIX)) {
                        const clone = response.clone();
                        const zhaClone = response.ok && isZhaNotesPage(url.pathname) ? response.clone() : null;
                        caches.open(RUNTIME_CACHE).then((cache) => {
                            cache.put(request, clone);
                            if (zhaClone) cache.put(ZHANOTES_CANONICAL, zhaClone);
                        });
                    }
                    return response;
                })
                .catch(() =>
                    caches
                        .match(request)
                        .then((cached) => {
                            if (cached) return cached;
                            if (isZhaNotesPage(url.pathname)) return caches.match(ZHANOTES_CANONICAL);
                            const path = url.pathname.replace(/\/+$/, '') || '/';
                            const isSpaRoute =
                                SPA_ROUTES.includes(path) ||
                                SPA_ROUTE_PREFIXES.some((prefix) => path.startsWith(prefix));
                            return isSpaRoute ? caches.match('/') : undefined;
                        })
                        .then((response) => response || caches.match(OFFLINE_URL))
                )
        );
        return;
    }

    // Daftar demo → network-first, cache hanya sebagai cadangan saat offline.
    if (url.pathname === DEMOS_MANIFEST) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
                    }
                    return response;
                })
                .catch(() => caches.match(request).then((cached) => cached || Response.error()))
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