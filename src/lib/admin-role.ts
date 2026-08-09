/** Ніки з постійною роллю admin (власник). */
export const SUPER_ADMIN_NICKS = ["Way_Zeman"] as const;

export type UserRole = "user" | "wiki_editor" | "admin";

export function normalizeRole(raw: unknown): UserRole {
  const v = String(raw ?? "")
    .toLowerCase()
    .trim();
  if (v === "admin") return "admin";
  if (v === "wiki_editor") return "wiki_editor";
  return "user";
}

export function isSuperAdminNick(nick: string | null | undefined): boolean {
  const n = nick?.trim().toLowerCase();
  if (!n) return false;
  return SUPER_ADMIN_NICKS.some((s) => s.toLowerCase() === n);
}

export function isAdminRole(role: UserRole | string | null | undefined): boolean {
  return normalizeRole(role) === "admin";
}

/** Адмін автоматично має права вікі-редактора. */
export function canEditWiki(
  role: UserRole | string | null | undefined,
): boolean {
  const r = normalizeRole(role);
  return r === "admin" || r === "wiki_editor";
}

export function roleLabelUk(role: UserRole | string | null | undefined): string {
  switch (normalizeRole(role)) {
    case "admin":
      return "Адмін";
    case "wiki_editor":
      return "Вікі редактор";
    default:
      return "Гравець";
  }
}
