import { useSyncExternalStore } from 'react';

// Daftar rute client-side. Ubah slug di sini saja; Navbar, App, dan halaman
// Hasil Kerja mengikuti. Kalau slug diganti, samakan juga di public/sitemap.xml
// dan SPA_ROUTES di public/sw.js.
export const ROUTES = {
  home: '/',
  caseStudy: '/hasil-kerja',
} as const;

// pushState tidak memicu event apa pun di browser, jadi navigate() di
// NavigationHistoryContext memancarkan event ini setelah pushState.
export const ROUTE_CHANGE_EVENT = 'app:routechange';

const normalize = (path: string) =>
  path.length > 1 ? path.replace(/\/+$/, '') || '/' : path;

const subscribe = (onChange: () => void) => {
  window.addEventListener('popstate', onChange);
  window.addEventListener(ROUTE_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('popstate', onChange);
    window.removeEventListener(ROUTE_CHANGE_EVENT, onChange);
  };
};

const getSnapshot = () => normalize(window.location.pathname);
const getServerSnapshot = () => ROUTES.home as string;

export const usePathname = (): string =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
