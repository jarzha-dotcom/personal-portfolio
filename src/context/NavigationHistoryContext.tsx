import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from 'react';

interface ModalEntry {
  id: string;
  onClose: () => void;
}

interface NavigationHistoryContextValue {
  registerModal: (id: string, isOpen: boolean, onClose: () => void) => void;
  showExitConfirm: boolean;
  handleStay: () => void;
  handleLeave: () => void;
}

const NavigationHistoryContext = createContext<NavigationHistoryContextValue | null>(null);

export const NavigationHistoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const modalStackRef = useRef<ModalEntry[]>([]);
  const ignoreNextPopStateRef = useRef(false);
  const isLeavingRef = useRef(false);

  // Inisialisasi guard history saat halaman pertama kali dimuat
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const currentState = window.history.state;
      if (!currentState || currentState.appState !== 'app_active') {
        window.history.replaceState({ appState: 'root_guard' }, '');
        window.history.pushState({ appState: 'app_active' }, '');
      }
    } catch (_) {}

    const handlePopState = (event: PopStateEvent) => {
      // 1. Abaikan jika popstate ini dipicu oleh history.back() internal saat modal ditutup lewat tombol UI
      if (ignoreNextPopStateRef.current) {
        ignoreNextPopStateRef.current = false;
        return;
      }

      // 2. Jika user sudah klik 'Lanjut Keluar', biarkan browser bernavigasi
      if (isLeavingRef.current) {
        return;
      }

      // 3. Jika ada modal / layer yang sedang terbuka, tutup modal teratas
      if (modalStackRef.current.length > 0) {
        const topModal = modalStackRef.current.pop();
        if (topModal) {
          topModal.onClose();
        }
        return;
      }

      // 4. Tidak ada modal yang terbuka
      const state = event.state;
      if (state?.appState === 'app_active') {
        setShowExitConfirm(false);
        return;
      }

      if (!state || state.appState === 'root_guard' || state.appState !== 'app_active') {
        // Tampilkan modal konfirmasi sebelum meninggalkan situs
        setShowExitConfirm(true);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Fungsi saat user memilih 'Batal / Tetap di Sini'
  const handleStay = useCallback(() => {
    setShowExitConfirm(false);
    if (typeof window !== 'undefined') {
      window.history.pushState({ appState: 'app_active' }, '');
    }
  }, []);

  // Fungsi saat user memilih 'Lanjut Keluar'
  const handleLeave = useCallback(() => {
    setShowExitConfirm(false);
    isLeavingRef.current = true;
    if (typeof window !== 'undefined') {
      window.history.back();
    }
  }, []);

  // Registrasi modal ke history stack
  const registerModal = useCallback(
    (id: string, isOpen: boolean, onClose: () => void) => {
      const existingIndex = modalStackRef.current.findIndex((m) => m.id === id);

      if (isOpen) {
        if (existingIndex === -1) {
          modalStackRef.current.push({ id, onClose });
          if (typeof window !== 'undefined') {
            window.history.pushState({ appState: 'modal', modalId: id }, '');
          }
        } else {
          modalStackRef.current[existingIndex].onClose = onClose;
        }
      } else {
        if (existingIndex !== -1) {
          modalStackRef.current.splice(existingIndex, 1);
          if (typeof window !== 'undefined' && window.history.state?.appState === 'modal') {
            ignoreNextPopStateRef.current = true;
            window.history.back();
          }
        }
      }
    },
    []
  );

  return (
    <NavigationHistoryContext.Provider
      value={{
        registerModal,
        showExitConfirm,
        handleStay,
        handleLeave,
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
