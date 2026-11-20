/**
 * src/lib/waAttachment.ts
 * Helper klien untuk lampiran yang dikirim dari Inbox WhatsApp (Fase 5).
 * Batas 3 MB mengikuti server (base64 dalam JSON harus muat di 4,5 MB Vercel).
 */

/** Batas jalur inline (base64 dalam JSON ke Vercel). Di atas ini → unggah langsung ke Drive (Fase 5b). */
export const WA_SEND_MAX_BYTES = 3 * 1024 * 1024;
/** Batas atas di browser (server menegakkan batas sebenarnya: WA_MEDIA_MAX_MB & batas per jenis Meta). */
export const WA_LARGE_MAX_BYTES = 15 * 1024 * 1024;

/** Selaras dengan whitelist keluar di server (tanpa image/webp). */
export const WA_SEND_ACCEPT =
  'image/jpeg,image/png,image/webp,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,video/mp4,video/3gpp,audio/ogg,audio/mpeg,audio/mp4,audio/aac,audio/amr';

const SENDABLE_MIME = new Set([
  'image/jpeg', 'image/png', 'video/mp4', 'video/3gpp',
  'audio/ogg', 'audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/amr',
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
]);

const EXT_MIME: Record<string, string> = {
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt: 'text/plain',
  pdf: 'application/pdf',
};

export interface PreparedAttachment {
  blob: Blob;
  fileName: string;
  mimeType: string;
  isAudio: boolean;
  isImage: boolean;
  /** true bila > 3 MB: diunggah langsung ke Drive lalu diteruskan server ke WhatsApp. */
  viaDrive: boolean;
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function resolveMime(file: File): string {
  const base = (file.type || '').split(';')[0].trim().toLowerCase();
  if (base) return base;
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  return EXT_MIME[ext] ?? '';
}

/** Gambar besar / WebP diperkecil ke JPEG (maks 1600 px) agar muat batas unggah. */
async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas tidak tersedia untuk kompresi gambar.');
  ctx.fillStyle = '#ffffff'; // PNG transparan → latar putih (JPEG tanpa alpha)
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.82));
  if (!blob) throw new Error('Gagal mengompres gambar.');
  return blob;
}

/** Memvalidasi tipe & ukuran; mengompres gambar bila perlu. Melempar Error berpesan Indonesia. */
export async function prepareAttachment(file: File): Promise<PreparedAttachment> {
  let mimeType = resolveMime(file);
  const isImageInput = mimeType.startsWith('image/');
  if (!SENDABLE_MIME.has(mimeType) && mimeType !== 'image/webp') {
    throw new Error('Format berkas tidak didukung WhatsApp (gunakan JPEG/PNG, PDF, Office, TXT, MP4, atau audio).');
  }

  let blob: Blob = file;
  let fileName = file.name || 'berkas';

  if (isImageInput && (mimeType === 'image/webp' || file.size > 1024 * 1024)) {
    blob = await compressImage(file);
    mimeType = 'image/jpeg';
    fileName = fileName.replace(/\.[A-Za-z0-9]+$/, '') + '.jpg';
  }

  if (blob.size > WA_LARGE_MAX_BYTES) {
    throw new Error(
      `Berkas ${formatBytes(blob.size)} melebihi batas ${formatBytes(WA_LARGE_MAX_BYTES)}. Perkecil berkas, atau kirim lewat aplikasi WhatsApp di HP.`
    );
  }

  return {
    blob,
    fileName,
    mimeType,
    isAudio: mimeType.startsWith('audio/'),
    isImage: mimeType.startsWith('image/'),
    viaDrive: blob.size > WA_SEND_MAX_BYTES,
  };
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] ?? '');
    r.onerror = () => reject(new Error('Gagal membaca berkas.'));
    r.readAsDataURL(blob);
  });
}

/**
 * Mengirim berkas langsung ke sesi upload resumable Google Drive (tanpa melewati Vercel),
 * dengan progres. Mengembalikan ID file Drive.
 */
export function uploadToDriveSession(
  sessionUrl: string,
  blob: Blob,
  mimeType: string,
  onProgress: (fraction: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', sessionUrl);
    xhr.setRequestHeader('Content-Type', mimeType);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded / e.total);
    };
    xhr.onerror = () =>
      reject(new Error('Upload ke Google Drive gagal (jaringan atau CORS). Coba lagi, atau kirim dari aplikasi WhatsApp di HP.'));
    xhr.ontimeout = () => reject(new Error('Upload ke Google Drive melewati batas waktu.'));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const id = JSON.parse(xhr.responseText)?.id;
          if (typeof id === 'string' && id) return resolve(id);
        } catch { /* jatuh ke galat di bawah */ }
        return reject(new Error('Google Drive tidak mengembalikan ID file.'));
      }
      reject(new Error(`Upload ke Google Drive ditolak (HTTP ${xhr.status}).`));
    };
    xhr.send(blob);
  });
}
