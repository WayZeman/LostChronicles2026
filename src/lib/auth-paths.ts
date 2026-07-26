/** Безпечний внутрішній шлях після логіну (захист від open redirect). */
export function sanitizeOAuthNextPath(
  raw: string | null | undefined,
): string | null {
  if (raw == null) return null;
  const t = raw.trim();
  if (t.length === 0 || t.length > 256) return null;
  if (!t.startsWith("/") || t.startsWith("//")) return null;
  if (t.includes("://") || t.includes("\\") || t.includes("@")) return null;
  return t;
}

/** Шлях для OAuth `next=` (pathname + search). */
export function buildOAuthNextFromPath(pathname: string, search = ""): string {
  const raw = `${pathname}${search}`;
  return sanitizeOAuthNextPath(raw) ?? pathname;
}

/** URL старту Discord-логіну з поверненням на внутрішній шлях. */
export function discordLoginPath(nextPath: string): string {
  const safe = sanitizeOAuthNextPath(nextPath) ?? "/";
  return `/api/auth/discord?next=${encodeURIComponent(safe)}`;
}

/** URL старту Google-логіну з поверненням на внутрішній шлях. */
export function googleLoginPath(nextPath: string): string {
  const safe = sanitizeOAuthNextPath(nextPath) ?? "/";
  return `/api/auth/google?next=${encodeURIComponent(safe)}`;
}

/** Сторінка з поясненням + кнопки входу (перед OAuth). */
export function authRequiredPath(
  nextPath: string,
  error?: string | null,
): string {
  const safe = sanitizeOAuthNextPath(nextPath) ?? "/";
  const params = new URLSearchParams({ next: safe });
  if (error) params.set("error", error);
  return `/auth-required?${params.toString()}`;
}
