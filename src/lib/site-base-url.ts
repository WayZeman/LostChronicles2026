/** Canonical site origin for OAuth redirects and proposal links (no trailing slash). */
export function getSiteBaseUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "").trim() || "";
  if (fromEnv) return fromEnv;
  if (process.env.VERCEL_URL)
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  return "http://localhost:3000";
}

type HeaderGet = { get(name: string): string | null };

/**
 * Origin з заголовків (RSC `headers()` або `Request`).
 * Для Discord OAuth важливо: cookie `state` прив’язаний до хоста, з якого пішли на логін —
 * `redirect_uri` має бути на тому ж хості, інакше буде `?error=oauth`.
 */
export function getRequestOriginFromHeaders(h: HeaderGet): string {
  const hostRaw =
    h.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    h.get("host")?.split(",")[0]?.trim();
  let proto =
    h.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";

  if (hostRaw) {
    const host = hostRaw.toLowerCase();
    if (host.startsWith("localhost") || host.startsWith("127.0.0.1")) {
      proto = "http";
    }
    return `${proto}://${hostRaw}`;
  }

  return getSiteBaseUrl();
}

export function getRequestOrigin(req: Request): string {
  return getRequestOriginFromHeaders(req.headers);
}
