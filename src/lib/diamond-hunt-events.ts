/** Клієнтська подія після збору діаманта / оновлення стейту івенту. */
export const DIAMOND_HUNT_CHANGED_EVENT = "lc:diamond-hunt-changed";

export type DiamondHuntChangedDetail = {
  balance?: number;
  todayCollected?: number;
  todayTotal?: number;
};

export function notifyDiamondHuntChanged(detail?: DiamondHuntChangedDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(DIAMOND_HUNT_CHANGED_EVENT, { detail: detail ?? {} }),
  );
}
