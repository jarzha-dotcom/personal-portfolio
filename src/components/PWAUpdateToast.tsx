import React from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';

interface PWAUpdateToastProps {
    darkMode: boolean;
    onReload: () => void;
}

export const PWAUpdateToast: React.FC<PWAUpdateToastProps> = ({ darkMode, onReload }) => (
    <div
        role="status"
        className={`fixed z-50 bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 rounded-full border shadow-lg pl-4 pr-2 py-2 animate-pop-in ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
    >
        <Sparkles className="w-4 h-4 text-teal-500 flex-shrink-0" />
        <span className="text-xs font-medium whitespace-nowrap">Versi baru tersedia</span>
        <button
            onClick={onReload}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white transition-colors whitespace-nowrap"
        >
            <RefreshCw className="w-3 h-3" />
            Muat ulang
        </button>
    </div>
);