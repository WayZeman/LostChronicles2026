/** Canonical site origin for OAuth redirects and proposal links (no trailing slash). */
export function getSiteBaseUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "").trim() || "";
  if (fromEnv) return fromEnv;
  if (process.env.VERCEL_URL)
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  return "http://localhost:3000";
}

/**
 * Публічний origin з поточного HTTP-запиту (Vercel: x-forwarded-*).
 * Для Discord OAuth важливо: cookie `state` прив’язаний до хоста, з якого пішли на логін —
 * `redirect_uri` має бути на тому ж хості, інакше буде `?error=oauth`.
 */
export function getRequestOrigin(req: Request): string {
  const hostRaw =
    req.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    req.headers.get("host")?.split(",")[0]?.trim();
  let proto =
    req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";

  if (hostRaw) {
    const h = hostRaw.toLowerCase();
    if (h.startsWith("localhost") || h.startsWith("127.0.0.1")) {
      proto = "http";
    }
    return `${proto}://${hostRaw}`;
  }

  return getSiteBaseUrl();
}
