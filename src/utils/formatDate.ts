// Format tanggal Indonesia: "23 September 2026"
// Input: ISO string (mis. "2026-09-23") atau Date
export function formatIDDate(value: string | Date | undefined): string {
  if (!value) return '';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

// Untuk atribut dateTime <time>, pakai format YYYY-MM-DD
export function toISODate(value: string | Date | undefined): string {
  if (!value) return '';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}