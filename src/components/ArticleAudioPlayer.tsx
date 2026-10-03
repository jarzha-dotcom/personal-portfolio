import React, { useEffect, useRef, useState } from 'react';
import { Headphones, Pause, Play, ScrollText } from 'lucide-react';
import articleAudio from '../data/articleAudio.json';

// Peta slug -> info audio, ditulis otomatis oleh scripts/generate-article-audio.ts.
// `sections` = peta waktu per bagian artikel (judul + tiap blok), dipakai untuk menyorot
// teks yang sedang dibacakan dan menggulir halaman mengikutinya. Entri lama tanpa
// `sections` tetap bisa diputar, hanya tanpa sorotan/auto-scroll.
export interface AudioSection {
  kind: 'title' | 'block';
  /** Indeks blok di body artikel (tidak ada untuk judul). */
  blockIndex?: number;
  start: number;
  end: number;
}
interface AudioEntry {
  url: string;
  voice: string;
  duration?: number;
  sections?: AudioSection[];
}
const AUDIO = articleAudio as unknown as Record<string, AudioEntry>;

/** Dipakai halaman lain (mis. badge di daftar artikel) untuk cek apakah artikel ini punya audio. */
export const hasArticleAudio = (slug: string): boolean => !!AUDIO[slug];

/** Indeks bagian yang sedang dibacakan pada detik `t` (bagian terakhir yang start-nya <= t). */
export const findActiveSection = (sections: AudioSection[], t: number): number => {
  let lo = 0;
  let hi = sections.length - 1;
  let answer = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (sections[mid].start <= t) {
      answer = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return answer;
};

// Halaman artikel menandai elemennya dengan data-audio-title (judul) dan
// data-audio-block={indeks} (pembungkus tiap blok: heading + paragraf + template).
const findSectionElement = (section: AudioSection): HTMLElement | null =>
  document.querySelector<HTMLElement>(
    section.kind === 'title' ? '[data-audio-title]' : `[data-audio-block="${section.blockIndex}"]`,
  );

const SPEEDS = [1, 1.25, 1.5, 2];

const FOCUS_RING =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2';

const formatTime = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const prefersReducedMotion = (): boolean =>
  typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Gulir ke elemen hanya kalau belum terlihat nyaman di layar (menghindari loncatan yang tidak perlu). */
const scrollIntoComfortView = (el: HTMLElement) => {
  const rect = el.getBoundingClientRect();
  const margin = 96; // ruang untuk navbar di atas dan jeda di bawah
  const fullyVisible = rect.top >= margin && rect.bottom <= window.innerHeight - margin;
  if (fullyVisible) return;
  el.scrollIntoView({
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    // Blok yang lebih tinggi dari ~65% layar dimulai dari atasnya, supaya awal kalimat tidak terpotong.
    block: rect.height > window.innerHeight * 0.65 ? 'start' : 'center',
  });
};

interface ArticleAudioPlayerProps {
  slug: string;
  darkMode: boolean;
}

/**
 * Pemutar audio artikel. Tidak dirender sama sekali kalau artikel belum punya
 * file audio (atau file gagal dimuat), jadi aman dipasang di semua artikel.
 * Tidak pernah autoplay: audio baru diunduh bagian metadatanya saja
 * (preload="metadata") sampai pembaca menekan tombol putar.
 *
 * Kalau entri punya `sections`: bagian yang sedang dibacakan disorot dan halaman
 * digulir mengikutinya. Auto-scroll berhenti sendiri begitu pembaca menggulir manual
 * (roda mouse, sentuh, tombol panah/PageUp/PageDown), dan bisa dinyalakan lagi lewat
 * tombol "Ikuti teks".
 */
export const ArticleAudioPlayer: React.FC<ArticleAudioPlayerProps> = ({ slug, darkMode }) => {
  const entry = AUDIO[slug];
  const sections = entry?.sections && entry.sections.length > 0 ? entry.sections : null;
  const audioRef = useRef<HTMLAudioElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(entry?.duration ?? 0);
  const [speedIndex, setSpeedIndex] = useState(0);
  const [failed, setFailed] = useState(false);
  const [follow, setFollow] = useState(true);

  // Pindah artikel (komponen dipakai ulang oleh router): reset semua state.
  useEffect(() => {
    setPlaying(false);
    setCurrent(0);
    setDuration(AUDIO[slug]?.duration ?? 0);
    setSpeedIndex(0);
    setFailed(false);
    setFollow(true);
  }, [slug]);

  // Sorotan hanya tampil setelah audio mulai diputar (atau sedang di tengah-tengah).
  const activeIndex = sections && (playing || current > 0) ? findActiveSection(sections, current) : -1;

  // Tandai elemen bagian aktif di halaman (gayanya ada di <style> di bawah).
  useEffect(() => {
    if (!sections || activeIndex < 0) return;
    const el = findSectionElement(sections[activeIndex]);
    if (!el) return;
    el.setAttribute('data-audio-active', 'true');
    return () => el.removeAttribute('data-audio-active');
  }, [sections, activeIndex]);

  // Auto-scroll: tiap pindah bagian, dan saat "Ikuti teks" dinyalakan lagi.
  // Judul hanya disorot, tidak digulir: pemutar biasanya tepat di bawahnya, dan menekan
  // "putar" tidak boleh membuat halaman bergeser sebelum bagian pertama dibacakan.
  useEffect(() => {
    if (!sections || !follow || activeIndex < 0) return;
    const section = sections[activeIndex];
    if (section.kind === 'title') return;
    const el = findSectionElement(section);
    if (el) scrollIntoComfortView(el);
  }, [sections, follow, activeIndex]);

  // Pembaca menggulir sendiri -> berhenti mengikuti. Interaksi di dalam pemutar
  // (mis. menggeser slider di layar sentuh) tidak dihitung.
  useEffect(() => {
    if (!sections || !follow) return;
    const stop = (event: Event) => {
      if (rootRef.current && event.target instanceof Node && rootRef.current.contains(event.target)) return;
      setFollow(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(event.key)) stop(event);
    };
    window.addEventListener('wheel', stop, { passive: true });
    window.addEventListener('touchmove', stop, { passive: true });
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('wheel', stop);
      window.removeEventListener('touchmove', stop);
      window.removeEventListener('keydown', onKey);
    };
  }, [sections, follow]);

  if (!entry || failed) return null;

  const updateDuration = (value: number) => {
    if (Number.isFinite(value) && value > 0) setDuration(value);
  };

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      el.play().catch(() => setFailed(true));
    } else {
      el.pause();
    }
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = audioRef.current;
    if (!el) return;
    const value = Number(e.target.value);
    el.currentTime = value;
    setCurrent(value);
  };

  const cycleSpeed = () => {
    const next = (speedIndex + 1) % SPEEDS.length;
    setSpeedIndex(next);
    if (audioRef.current) audioRef.current.playbackRate = SPEEDS[next];
  };

  const tint = darkMode ? 'rgba(45,212,191,0.14)' : 'rgba(13,148,136,0.10)';
  const highlightCss = `
[data-audio-block],[data-audio-title]{scroll-margin-top:6rem;border-radius:.5rem;transition:background-color .3s ease,box-shadow .3s ease}
[data-audio-active="true"]{background-color:${tint};box-shadow:0 0 0 .5rem ${tint}}
@media (prefers-reduced-motion:reduce){[data-audio-block],[data-audio-title]{transition:none}}`;

  return (
    <div
      ref={rootRef}
      role="group"
      aria-label="Dengarkan artikel ini"
      className={`mb-8 rounded-2xl border p-4 ${
        darkMode ? 'bg-slate-900/80 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
      }`}
    >
      {sections && <style>{highlightCss}</style>}
      <audio
        // key per URL: elemen baru tiap artikel/versi audio, sehingga audio lama pasti berhenti.
        key={entry.url}
        ref={audioRef}
        src={entry.url}
        preload="metadata"
        // Abaikan NaN/Infinity (sebelum metadata siap) supaya durasi dari manifest tidak tertimpa.
        onLoadedMetadata={(e) => updateDuration(e.currentTarget.duration)}
        onDurationChange={(e) => updateDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setCurrent(0);
        }}
        onError={() => setFailed(true)}
      />

      <div
        className={`flex items-center gap-1.5 mb-3 text-xs font-semibold uppercase tracking-wide ${
          darkMode ? 'text-teal-300' : 'text-teal-700'
        }`}
      >
        <Headphones className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Dengarkan artikel ini</span>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? 'Jeda audio' : 'Putar audio'}
          className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-white bg-teal-600 hover:bg-teal-500 transition-colors ${FOCUS_RING} ${
            darkMode ? 'focus-visible:ring-offset-slate-900' : ''
          }`}
        >
          {playing ? (
            <Pause className="w-5 h-5" aria-hidden="true" />
          ) : (
            <Play className="w-5 h-5 ml-0.5" aria-hidden="true" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={1}
            value={Math.min(current, duration || 0)}
            onChange={seek}
            aria-label="Posisi audio"
            aria-valuetext={`${formatTime(current)} dari ${formatTime(duration)}`}
            className={`w-full accent-teal-500 cursor-pointer ${FOCUS_RING}`}
          />
          <div
            className={`flex justify-between text-[11px] tabular-nums ${
              darkMode ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            <span>{formatTime(current)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={cycleSpeed}
          aria-label={`Kecepatan putar ${SPEEDS[speedIndex]} kali, ketuk untuk mengganti`}
          className={`shrink-0 min-w-[3.25rem] px-2.5 py-1.5 rounded-lg text-xs font-bold border tabular-nums transition-colors ${FOCUS_RING} ${
            darkMode
              ? 'border-slate-600 text-slate-200 hover:bg-slate-800 focus-visible:ring-offset-slate-900'
              : 'border-slate-300 text-slate-700 hover:bg-slate-50'
          }`}
        >
          {SPEEDS[speedIndex]}x
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className={`text-[11px] ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
          Dibacakan oleh Zannah AI.
        </p>
        {sections && (
          <button
            type="button"
            onClick={() => setFollow((value) => !value)}
            aria-pressed={follow}
            aria-label="Ikuti teks saat audio diputar"
            className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${FOCUS_RING} ${
              follow
                ? darkMode
                  ? 'border-teal-400/60 bg-teal-500/15 text-teal-200 focus-visible:ring-offset-slate-900'
                  : 'border-teal-600/40 bg-teal-50 text-teal-700'
                : darkMode
                  ? 'border-slate-600 text-slate-400 hover:bg-slate-800 focus-visible:ring-offset-slate-900'
                  : 'border-slate-300 text-slate-500 hover:bg-slate-50'
            }`}
          >
            <ScrollText className="w-3.5 h-3.5" aria-hidden="true" />
            Ikuti teks
          </button>
        )}
      </div>
    </div>
  );
};