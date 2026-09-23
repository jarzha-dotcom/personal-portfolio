// Tipe data untuk platform yang didukung
export type SharePlatform = 
  | 'whatsapp' 
  | 'facebook' 
  | 'twitter' 
  | 'linkedin' 
  | 'telegram' 
  | 'email';

/**
 * Membangun URL share untuk platform spesifik
 */
export function buildShareUrl(platform: SharePlatform, url: string, title: string): string {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  switch (platform) {
    case 'whatsapp':
      // Format WhatsApp: text + url
      return `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`;
    
    case 'facebook':
      // Facebook Sharer
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`;
    
    case 'twitter': // X (Twitter)
      return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
    
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    
    case 'telegram':
      return `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`;
    
    case 'email':
      return `mailto:?subject=${encodedTitle}&body=${encodedUrl}`;
      
    default:
      return url;
  }
}

/**
 * Native Web Share API (Sangat direkomendasikan untuk Mobile/PWA)
 * Mengembalikan true jika berhasil, false jika user membatalkan atau browser tidak support.
 */
export interface NativeShareOptions {
  url: string;
  title: string;
  text?: string;
}

export async function nativeShare(options: NativeShareOptions): Promise<boolean> {
  if (navigator.share) {
    try {
      await navigator.share({
        title: options.title,
        text: options.text || options.title,
        url: options.url,
      });
      return true;
    } catch (err) {
      // User membatalkan share atau terjadi error
      return false;
    }
  }
  return false;
}

/**
 * Fallback: Copy ke Clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback lama untuk browser non-secure context
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}