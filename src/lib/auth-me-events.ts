/** Крос-компонентне оновлення /api/auth/me після логіну / профілю / логауту. */
export const AUTH_ME_CHANGED_EVENT = "lc:auth-me-changed";

export function notifyAuthMeChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_ME_CHANGED_EVENT));
  }
}
