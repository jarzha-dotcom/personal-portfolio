import React, { useState } from 'react';
import { 
  Twitter, Linkedin, Link2, Check, 
  MessageCircle, Facebook, Send, Mail, Share2 
} from 'lucide-react';
import { buildShareUrl, copyToClipboard, nativeShare } from '../utils/share';

interface ShareButtonsProps {
  darkMode: boolean;
  url: string;
  title: string;
}

export const ShareButtons: React.FC<ShareButtonsProps> = ({ darkMode, url, title }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const ok = await copyToClipboard(url);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Handler untuk Native Share (Bawaan HP) dengan fallback ke Copy Link
  const handleNativeShare = async () => {
    const success = await nativeShare({ url, title, text: title });
    if (!success) {
      // Jika user membatalkan atau browser tidak support, fallback ke copy link
      await handleCopy();
    }
  };

  const btnBase = `inline-flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 ${
    darkMode 
      ? 'bg-slate-800/70 text-slate-300 hover:bg-teal-500/20 hover:text-teal-300 hover:scale-110' 
      : 'bg-white text-slate-600 hover:bg-teal-50 hover:text-teal-600 hover:scale-110 shadow-sm border border-slate-200'
  }`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={`text-xs font-semibold uppercase tracking-wider mr-1 ${
          darkMode ? 'text-slate-500' : 'text-slate-400'
        }`}
      >
        Bagikan
      </span>

      {/* 1. Native Share (Utama untuk Mobile/PWA) */}
      <button
        type="button"
        onClick={handleNativeShare}
        aria-label="Bagikan via menu bawaan perangkat"
        className={btnBase}
        title="Share Bawaan"
      >
        <Share2 className="w-4 h-4" aria-hidden="true" />
      </button>

      {/* 2. WhatsApp (Sangat penting untuk pasar Indonesia) */}
      <a
        href={buildShareUrl('whatsapp', url, title)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Bagikan ke WhatsApp"
        className={btnBase}
        title="WhatsApp"
      >
        <MessageCircle className="w-4 h-4" aria-hidden="true" />
      </a>

      {/* 3. Facebook */}
      <a
        href={buildShareUrl('facebook', url, title)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Bagikan ke Facebook"
        className={btnBase}
        title="Facebook"
      >
        <Facebook className="w-4 h-4" aria-hidden="true" />
      </a>

      {/* 4. Twitter / X */}
      <a
        href={buildShareUrl('twitter', url, title)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Bagikan ke Twitter"
        className={btnBase}
        title="Twitter / X"
      >
        <Twitter className="w-4 h-4" aria-hidden="true" />
      </a>

      {/* 5. LinkedIn */}
      <a
        href={buildShareUrl('linkedin', url, title)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Bagikan ke LinkedIn"
        className={btnBase}
        title="LinkedIn"
      >
        <Linkedin className="w-4 h-4" aria-hidden="true" />
      </a>

      {/* 6. Telegram */}
      <a
        href={buildShareUrl('telegram', url, title)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Bagikan ke Telegram"
        className={btnBase}
        title="Telegram"
      >
        <Send className="w-4 h-4" aria-hidden="true" />
      </a>

      {/* 7. Email */}
      <a
        href={buildShareUrl('email', url, title)}
        aria-label="Bagikan via Email"
        className={btnBase}
        title="Email"
      >
        <Mail className="w-4 h-4" aria-hidden="true" />
      </a>

      {/* 8. Copy Link (Fallback) */}
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? 'Link tersalin' : 'Salin link'}
        className={btnBase}
        title={copied ? 'Tersalin!' : 'Salin Link'}
      >
        {copied ? (
          <Check className="w-4 h-4 text-emerald-500" aria-hidden="true" />
        ) : (
          <Link2 className="w-4 h-4" aria-hidden="true" />
        )}
      </button>
    </div>
  );
};