import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { useNavigate as useRouterNavigate, useLocation } from 'react-router-dom';

interface ModalEntry {
  id: string;
  onClose: () => void;
}

interface NavigationHistoryContextValue {
  registerModal: (id: string, isOpen: boolean, onClose: () => void) => void;
  showExitConfirm: boolean;
  handleStay: () => void;
  handleLeave: () => void;
  // Pindah rute lewat React Router sambil menutup modal/drawer yang masih
  // terbuka lebih dulu. Dipakai Navbar, CaseStudyPage, dll — bukan <Link>
  // langsung — supaya guard tombol Back di bawah ini tetap konsisten.
  navigate: (path: string) => void;
}

const NavigationHistoryContext = createContext<NavigationHistoryContextValue | null>(null);

// PENTING: provider ini memakai useNavigate()/useLocation() dari
// react-router-dom, jadi wajib dirender di DALAM <BrowserRouter>.
//
// PENTING #2 — kenapa TIDAK ada satu pun panggilan window.history.* mentah
// di file ini: percobaan awal mencampur window.history.pushState/back/go
// langsung dengan BrowserRouter menyebabkan index internal React Router
// desync (ada Back yang diam-diam tidak mengubah URL sama sekali, padahal
// state kita sendiri sudah lanjut). Begitu SEMUA push/back/go dialihkan
// lewat routerNavigate (push ke path yang sama dengan state penanda untuk
// modal/buffer, atau routerNavigate(-n) untuk mundur), index-nya konsisten.
//
// Cara kerja guard: setiap history entry yang KITA tambahkan sendiri (modal
// terbuka ATAU pindah rute lewat navigate()) menambah depthRef sebesar 1.
// Begitu depthRef balik ke 0 (user sudah kembali ke halaman paling awal saat
// app dimuat) lalu ada SATU popstate lagi, itu baru dianggap user benar-benar
// mau keluar situs — saat itulah ExitConfirmModal ditampilkan.
export const NavigationHistoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const modalStackRef = useRef<ModalEntry[]>([]);
  const ignoreNextPopStateRef = useRef(false);
  const isLeavingRef = useRef(false);
  const depthRef = useRef(0);

  const routerNavigate = useRouterNavigate();
  const location = useLocation();
  const locationRef = useRef(location);
  locationRef.current = location;

  // Dorong satu entry baru ke URL yang SAMA dengan sekarang (cuma beda
  // `state`) — dipakai untuk buffer awal & entry modal. Tetap lewat
  // routerNavigate supaya index React Router ikut ter-update.
  const pushMarker = useCallback(
    (state: Record<string, unknown>) => {
      const { pathname, search, hash } = locationRef.current;
      routerNavigate(`${pathname}${search}${hash}`, { state });
    },
    [routerNavigate]
  );

  // Guard awal: tambahkan satu entry "buffer" di bawah halaman yang sedang
  // dibuka, supaya back pertama kali selalu tertangkap handler ini alih-alih
  // langsung membawa user keluar dari situs. Dijalankan sekali per full load.
  useEffect(() => {
    try {
      pushMarker({ appGuard: true });
    } catch (_) {}
    depthRef.current = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      // 1. Popstate ini hasil dari aksi kita sendiri (modal ditutup lewat
      //    tombol UI, atau navigate() melewati modal) — deltanya sudah
      //    disesuaikan di titik pemanggilan masing-masing, jadi di sini
      //    cukup ditelan tanpa mengubah depthRef lagi.
      if (ignoreNextPopStateRef.current) {
        ignoreNextPopStateRef.current = false;
        return;
      }

      // 2. User sudah pilih 'Lanjut Keluar' — biarkan browser bernavigasi.
      if (isLeavingRef.current) return;

      // 3. Ada modal/drawer terbuka lewat tombol Back browser -> tutup yang
      //    paling atas, jangan sampai ke logika exit-confirm.
      if (modalStackRef.current.length > 0) {
        const topModal = modalStackRef.current.pop();
        depthRef.current = Math.max(0, depthRef.current - 1);
        topModal?.onClose();
        return;
      }

      // 4. Tidak ada modal. depthRef > 0 berarti ini cuma perpindahan
      //    halaman biasa — React Router yang menangani render ulangnya,
      //    kita cuma perlu menyesuaikan hitungan.
      if (depthRef.current > 0) {
        depthRef.current -= 1;
        setShowExitConfirm(false);
        return;
      }

      // 5. depthRef sudah 0 — popstate ini melewati buffer awal, artinya
      //    user benar-benar mau keluar situs. Tahan dan tampilkan konfirmasi.
      setShowExitConfirm(true);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleStay = useCallback(() => {
    setShowExitConfirm(false);
    pushMarker({ appGuard: true });
    depthRef.current = 0;
  }, [pushMarker]);

  const handleLeave = useCallback(() => {
    setShowExitConfirm(false);
    isLeavingRef.current = true;
    routerNavigate(-1);
  }, [routerNavigate]);

  const registerModal = useCallback(
    (id: string, isOpen: boolean, onClose: () => void) => {
      const existingIndex = modalStackRef.current.findIndex((m) => m.id === id);

      if (isOpen) {
        if (existingIndex === -1) {
          modalStackRef.current.push({ id, onClose });
          pushMarker({ appGuard: true, modalId: id });
          depthRef.current += 1;
        } else {
          modalStackRef.current[existingIndex].onClose = onClose;
        }
      } else {
        if (existingIndex !== -1) {
          modalStackRef.current.splice(existingIndex, 1);
          if (depthRef.current > 0) {
            ignoreNextPopStateRef.current = true;
            depthRef.current -= 1;
            routerNavigate(-1);
          }
        }
      }
    },
    [pushMarker, routerNavigate]
  );

  // Pindah halaman lewat React Router, sambil menutup modal/drawer yang
  // masih terbuka lebih dulu. Tanpa ini, entry modal yatim tertinggal di
  // bawah halaman baru dan tombol Back berikutnya salah menutup modal yang
  // sudah tidak ada, alih-alih kembali ke halaman sebelumnya.
  const navigate = useCallback(
    (path: string) => {
      const commit = () => {
        routerNavigate(path);
        depthRef.current += 1;
      };

      const openModals = modalStackRef.current.splice(0);
      if (openModals.length === 0) {
        commit();
        return;
      }

      openModals.forEach((m) => m.onClose());
      depthRef.current = Math.max(0, depthRef.current - openModals.length);

      let done = false;
      let timer: number | undefined;
      const finish = () => {
        if (done) return;
        done = true;
        window.removeEventListener('popstate', finish);
        if (timer !== undefined) window.clearTimeout(timer);
        commit();
      };

      // Listener utama di atas terdaftar lebih dulu, jadi ia yang menelan
      // popstate ini (lewat ignoreNextPopStateRef) sebelum finish() jalan.
      ignoreNextPopStateRef.current = true;
      window.addEventListener('popstate', finish);
      timer = window.setTimeout(() => {
        ignoreNextPopStateRef.current = false;
        finish();
      }, 500);
      routerNavigate(-openModals.length);
    },
    [routerNavigate]
  );

  return (
    <NavigationHistoryContext.Provider
      value={{
        registerModal,
        showExitConfirm,
        handleStay,
        handleLeave,
        navigate,
      }}
    >
      {children}
    </NavigationHistoryContext.Provider>
  );
};

export const useNavigationHistory = () => {
  const context = useContext(NavigationHistoryContext);
  if (!context) {
    throw new Error('useNavigationHistory must be used within NavigationHistoryProvider');
  }
  return context;
};

/**
 * Hook praktis untuk menghubungkan modal/drawer mana pun dengan tombol Back browser.
 * Ketika isOpen = true, membuka entry history baru.
 * Ketika user tekan Back di browser, onClose() akan dipanggil otomatis.
 */
export const useRegisterModal = (id: string, isOpen: boolean, onClose: () => void) => {
  const { registerModal } = useNavigationHistory();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    registerModal(id, isOpen, () => onCloseRef.current());
  }, [id, isOpen, registerModal]);
};