/** Клієнтський хелпер: не вважаємо 503 «вийшов з акаунта». */
export type AuthMeUser = {
  id: number;
  username: string;
  displayName: string;
  gameNickname: string | null;
  needsNickname: boolean;
  avatarUrl: string;
  hasCustomAvatar: boolean;
  role: string;
  isAdmin: boolean;
  canEditWiki: boolean;
};

export type AuthMeResult = {
  user: AuthMeUser | null;
  /** Тимчасова помилка сервера / мережі — не скидати сесію. */
  unavailable: boolean;
};

export async function fetchAuthMe(): Promise<AuthMeResult> {
  try {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    if (res.status === 503) {
      return { user: null, unavailable: true };
    }
    const data = (await res.json()) as { user?: AuthMeUser | null };
    return { user: data.user ?? null, unavailable: false };
  } catch {
    return { user: null, unavailable: true };
  }
}
