import React, { useEffect, useState } from 'react';
import { Download, X, Share, SquarePlus } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallPromptProps {
    darkMode: boolean;
    /** Nama app yang ditampilkan di banner */
    appName?: string;
    /** Path ikon (idealnya 192px) buat thumbnail di banner */
    iconSrc?: string;
}

const DISMISS_KEY = 'pwa-install-dismissed-until';
const REMIND_AFTER_DAYS = 7;
/** Banner baru muncul setelah user sempat lihat-lihat halaman dulu, bukan langsung nge-block */
const SHOW_DELAY_MS = 8000;

const isDismissedForNow = (): boolean => {
    try {
        const raw = localStorage.getItem(DISMISS_KEY);
        if (!raw) return false;
        return Date.now() < Number(raw);
    } catch {
        return false;
    }
};

const dismissForDays = (days: number) => {
    try {
        localStorage.setItem(DISMISS_KEY, String(Date.now() + days * 24 * 60 * 60 * 1000));
    } catch {
        // localStorage bisa gagal (mode privat, dsb) — nggak fatal, banner cuma akan muncul lagi
    }
};

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
    darkMode,
    appName = 'Arzhaning Jagad',
    iconSrc = '/icons/icon-192.png',
}) => {
    const { canInstall, isInstalled, isStandalone, isIOS, promptInstall } = usePWAInstall();
    const [visible, setVisible] = useState(false);
    const [showIOSSteps, setShowIOSSteps] = useState(false);

    const eligible = !isInstalled && !isStandalone && (canInstall || isIOS) && !isDismissedForNow();

    useEffect(() => {
        if (!eligible) {
            setVisible(false);
            return;
        }
        const timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
        return () => clearTimeout(timer);
    }, [eligible]);

    if (!visible) return null;

    const handleDismiss = () => {
        dismissForDays(REMIND_AFTER_DAYS);
        setVisible(false);
        setShowIOSSteps(false);
    };

    const handleInstallClick = async () => {
        if (isIOS) {
            setShowIOSSteps(true);
            return;
        }
        const accepted = await promptInstall();
        if (accepted) setVisible(false);
    };

    return (
        <div
            role="dialog"
            aria-label="Install aplikasi"
            className={`fixed z-40 bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:w-96 rounded-2xl border shadow-xl p-4 animate-pop-in ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                }`}
        >
            {!showIOSSteps ? (
                <div className="flex gap-3">
                    <img src={iconSrc} alt="" className="w-12 h-12 rounded-xl flex-shrink-0 shadow-sm" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{appName}</p>
                        <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            Install ke layar utama biar akses lebih cepat & bisa dibuka tanpa browser.
                        </p>
                        <div className="flex gap-2 mt-3">
                            <button
                                onClick={handleInstallClick}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white transition-colors"
                            >
                                <Download className="w-3.5 h-3.5" />
                                Install
                            </button>
                            <button
                                onClick={handleDismiss}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${darkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                            >
                                Nanti saja
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={handleDismiss}
                        aria-label="Tutup"
                        className={`p-1 h-fit rounded-lg transition-colors ${darkMode ? 'text-slate-500 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                            }`}
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <div>
                    <div className="flex items-center justify-between mb-2.5">
                        <p className="text-sm font-bold">Install di iPhone/iPad</p>
                        <button
                            onClick={handleDismiss}
                            aria-label="Tutup"
                            className={`p-1 rounded-lg transition-colors ${darkMode ? 'text-slate-500 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                                }`}
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <ol className={`space-y-2.5 text-xs ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        <li className="flex items-center gap-2">
                            <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold flex-shrink-0 ${darkMode ? 'bg-slate-800 text-teal-400' : 'bg-slate-100 text-teal-600'}`}>
                                1
                            </span>
                            Tap ikon <Share className="w-3.5 h-3.5 inline mx-1" /> Share di bar Safari.
                        </li>
                        <li className="flex items-center gap-2">
                            <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold flex-shrink-0 ${darkMode ? 'bg-slate-800 text-teal-400' : 'bg-slate-100 text-teal-600'}`}>
                                2
                            </span>
                            Pilih <SquarePlus className="w-3.5 h-3.5 inline mx-1" /> "Add to Home Screen".
                        </li>
                        <li className="flex items-center gap-2">
                            <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold flex-shrink-0 ${darkMode ? 'bg-slate-800 text-teal-400' : 'bg-slate-100 text-teal-600'}`}>
                                3
                            </span>
                            Tap "Add" di pojok kanan atas.
                        </li>
                    </ol>
                </div>
            )}
        </div>
    );
};