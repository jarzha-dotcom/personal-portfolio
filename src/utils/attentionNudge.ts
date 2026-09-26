/**
 * Koordinator kecil untuk semua "nudge" melayang di app ini (bubble sambutan
 * Zannah, banner install PWA, kartu rekomendasi artikel — dan nudge lain di
 * masa depan). Tujuannya satu: supaya mereka tidak numpuk tampil bersamaan
 * dan berebut perhatian pengunjung di waktu yang sama.
 *
 * Pola pakainya di tiap komponen nudge:
 *   1. Panggil `announceNudgeShown(id)` begitu nudge itu benar-benar tampil
 *      di layar (biasanya lewat useEffect yang bereaksi ke state `visible`).
 *   2. Panggil `announceNudgeDismissed(id)` begitu nudge itu hilang/ditutup
 *      (dismiss, klik CTA, dsb — juga lewat effect yang sama, transisi ke
 *      `visible === false`).
 *   3. Sebelum menampilkan dirinya untuk PERTAMA kali, pakai
 *      `scheduleAttentionReveal(...)` alih-alih `setTimeout` polos — dia
 *      akan menunggu dulu kalau nudge lain kebetulan masih aktif, dengan
 *      batas tunggu (`graceMs`) supaya tidak nyangkut selamanya kalau
 *      nudge lain itu tidak kunjung ditutup pengunjung.
 *
 * Sengaja modul JS polos (bukan React Context) + CustomEvent di window:
 * konsisten dengan pola yang sudah dipakai di app ini untuk komunikasi
 * antar-komponen yang tidak family (mis. 'zannah-chat-opened',
 * 'open-zannah-chat' di ZannahWelcomeNudge/ChatWidget).
 */

export type NudgeId = 'zannah' | 'pwa-install' | 'article-recommendation';

const EVENT_NAME = 'attention-nudge-changed';

interface NudgeChangeDetail {
  id: NudgeId;
  active: boolean;
}

// Module-level state — sengaja bukan di React state manapun, supaya semua
// komponen (yang bahkan tidak bertetangga di tree) bisa baca status yang
// sama persis tanpa perlu Context Provider tambahan.
const activeNudges = new Set<NudgeId>();

/** Tandai nudge ini sedang tampil di layar SAAT INI. */
export const announceNudgeShown = (id: NudgeId): void => {
  activeNudges.add(id);
  window.dispatchEvent(new CustomEvent<NudgeChangeDetail>(EVENT_NAME, { detail: { id, active: true } }));
};

/** Tandai nudge ini sudah tidak tampil lagi (ditutup, di-dismiss, atau CTA-nya diklik). */
export const announceNudgeDismissed = (id: NudgeId): void => {
  activeNudges.delete(id);
  window.dispatchEvent(new CustomEvent<NudgeChangeDetail>(EVENT_NAME, { detail: { id, active: false } }));
};

/** True kalau ada nudge LAIN (selain `selfId`) yang aktif tampil saat ini. */
export const isAnotherNudgeActive = (selfId: NudgeId): boolean => {
  for (const id of activeNudges) {
    if (id !== selfId) return true;
  }
  return false;
};

/** Dengarkan setiap perubahan status nudge manapun (termasuk diri sendiri). */
const subscribeNudgeChange = (callback: (detail: NudgeChangeDetail) => void): (() => void) => {
  const handler = (e: Event) => callback((e as CustomEvent<NudgeChangeDetail>).detail);
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
};

/**
 * Jadwalkan `reveal()` setelah `delayMs` sejak dipanggil. Kalau nudge lain
 * kebetulan masih aktif tepat di momen itu, tunggu dulu sampai giliran
 * kosong (semua nudge lain nonaktif) — dibatasi tambahan `graceMs` supaya
 * tidak menunggu selamanya kalau nudge lain itu tidak kunjung ditutup.
 *
 * Mengembalikan fungsi cleanup: WAJIB dipanggil di return effect React yang
 * memanggil fungsi ini, supaya timer & listener dibatalkan kalau komponen
 * unmount atau kondisinya berubah sebelum sempat tampil.
 */
export const scheduleAttentionReveal = (
  selfId: NudgeId,
  delayMs: number,
  graceMs: number,
  reveal: () => void
): (() => void) => {
  let baseTimer: number | undefined;
  let graceTimer: number | undefined;
  let unsubscribe: (() => void) | undefined;
  let settled = false;

  const attempt = () => {
    if (settled) return;

    if (!isAnotherNudgeActive(selfId)) {
      settled = true;
      reveal();
      return;
    }

    // Ada nudge lain aktif — tunggu sampai dia (atau semuanya) nonaktif,
    // tapi jangan sampai nunggu tanpa batas.
    unsubscribe = subscribeNudgeChange(({ id, active }) => {
      if (settled || id === selfId || active) return;
      if (!isAnotherNudgeActive(selfId)) {
        settled = true;
        unsubscribe?.();
        window.clearTimeout(graceTimer);
        reveal();
      }
    });

    graceTimer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      unsubscribe?.();
      reveal();
    }, graceMs);
  };

  baseTimer = window.setTimeout(attempt, delayMs);

  return () => {
    settled = true; // cegah reveal() ke-invoke setelah cleanup, meski sisa timer/listener sempat balapan
    window.clearTimeout(baseTimer);
    window.clearTimeout(graceTimer);
    unsubscribe?.();
  };
};
