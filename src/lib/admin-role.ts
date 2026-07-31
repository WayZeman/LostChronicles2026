/** Ніки з постійною роллю admin (власник). */
export const SUPER_ADMIN_NICKS = ["Way_Zeman"] as const;

export type UserRole = "user" | "admin";

export function normalizeRole(raw: unknown): UserRole {
  return String(raw ?? "").toLowerCase() === "admin" ? "admin" : "user";
}

export function isSuperAdminNick(nick: string | null | undefined): boolean {
  const n = nick?.trim().toLowerCase();
  if (!n) return false;
  return SUPER_ADMIN_NICKS.some((s) => s.toLowerCase() === n);
}

export function isAdminRole(role: UserRole | string | null | undefined): boolean {
  return normalizeRole(role) === "admin";
}
