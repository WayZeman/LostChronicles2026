/**
 * Підказки про мережу в браузері (Save-Data, effectiveType) для полегшення UI
 * на мобільних і повільних з’єднаннях. Без зовнішніх залежностей.
 */

export type NetworkEffectiveType =
  | "slow-2g"
  | "2g"
  | "3g"
  | "4g"
  | "unknown";

type NavConn = {
  saveData?: boolean;
  effectiveType?: string;
};

export function readClientNetworkHints(): {
  saveData: boolean;
  effectiveType: NetworkEffectiveType;
  /** Save-Data або типово повільні типи радіо */
  isConstrained: boolean;
} {
  if (typeof navigator === "undefined") {
    return {
      saveData: false,
      effectiveType: "unknown",
      isConstrained: false,
    };
  }
  const conn = (navigator as Navigator & { connection?: NavConn }).connection;
  const saveData = Boolean(conn?.saveData);
  const raw = conn?.effectiveType ?? "";
  const effectiveType: NetworkEffectiveType =
    raw === "slow-2g" ||
    raw === "2g" ||
    raw === "3g" ||
    raw === "4g"
      ? raw
      : "unknown";
  const isConstrained =
    saveData ||
    effectiveType === "slow-2g" ||
    effectiveType === "2g" ||
    effectiveType === "3g";
  return { saveData, effectiveType, isConstrained };
}
