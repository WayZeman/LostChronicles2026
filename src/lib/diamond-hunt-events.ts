/** Клієнтська подія після збору діаманта / оновлення стейту івенту. */
export const DIAMOND_HUNT_CHANGED_EVENT = "lc:diamond-hunt-changed";

export type DiamondHuntChangedDetail = {
  balance?: number;
  total?: number;
  finishPlace?: number | null;
  justFinished?: boolean;
  endAt?: string | null;
  title?: string;
  blurb?: string;
  active?: boolean;
  /** @deprecated */
  todayCollected?: number;
  /** @deprecated */
  todayTotal?: number;
};

export function notifyDiamondHuntChanged(detail?: DiamondHuntChangedDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(DIAMOND_HUNT_CHANGED_EVENT, { detail: detail ?? {} }),
  );
}
