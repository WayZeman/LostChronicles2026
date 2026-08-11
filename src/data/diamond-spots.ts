/**
 * Фіксований пул місць для діамантів (поза адмінкою).
 * Щодня з пулу детерміновано обирається diamonds_per_day штук.
 */
export type DiamondSpotDef = {
  id: string;
  /** pathname без query (напр. "/" або "/faq") */
  path: string;
  /** CSS top / left у % від viewport-шару */
  top: number;
  left: number;
};

function spot(
  id: string,
  path: string,
  top: number,
  left: number,
): DiamondSpotDef {
  return { id, path, top, left };
}

/** ≥ 40 місць, щоб щодня змінювався набір із 20. */
export const DIAMOND_SPOT_POOL: DiamondSpotDef[] = [
  // Home
  spot("home-1", "/", 18, 8),
  spot("home-2", "/", 28, 88),
  spot("home-3", "/", 48, 12),
  spot("home-4", "/", 62, 78),
  spot("home-5", "/", 78, 22),
  spot("home-6", "/", 88, 70),
  spot("home-7", "/", 36, 48),
  spot("home-8", "/", 72, 50),
  // FAQ
  spot("faq-1", "/faq", 22, 14),
  spot("faq-2", "/faq", 40, 82),
  spot("faq-3", "/faq", 58, 18),
  spot("faq-4", "/faq", 76, 72),
  spot("faq-5", "/faq", 34, 52),
  // News
  spot("news-1", "/news", 20, 10),
  spot("news-2", "/news", 44, 86),
  spot("news-3", "/news", 66, 16),
  spot("news-4", "/news", 82, 64),
  // Support
  spot("support-1", "/support", 24, 12),
  spot("support-2", "/support", 42, 80),
  spot("support-3", "/support", 60, 20),
  spot("support-4", "/support", 78, 74),
  spot("support-5", "/support", 50, 48),
  // Proposals
  spot("prop-1", "/proposals", 22, 16),
  spot("prop-2", "/proposals", 48, 84),
  spot("prop-3", "/proposals", 70, 14),
  spot("prop-4", "/proposals", 86, 68),
  // Wiki
  spot("wiki-1", "/wiki", 18, 20),
  spot("wiki-2", "/wiki", 38, 78),
  spot("wiki-3", "/wiki", 56, 12),
  spot("wiki-4", "/wiki", 74, 82),
  spot("wiki-5", "/wiki", 88, 40),
  // Map
  spot("map-1", "/map", 26, 10),
  spot("map-2", "/map", 46, 88),
  spot("map-3", "/map", 68, 18),
  spot("map-4", "/map", 84, 72),
  // Apply
  spot("apply-1", "/apply", 30, 14),
  spot("apply-2", "/apply", 52, 82),
  spot("apply-3", "/apply", 74, 24),
  // Profile
  spot("profile-1", "/profile", 28, 18),
  spot("profile-2", "/profile", 58, 76),
  // Auth-required (rarely visited but ok)
  spot("auth-1", "/auth-required", 40, 50),
  // Extra home/faq density
  spot("home-9", "/", 14, 60),
  spot("home-10", "/", 54, 30),
  spot("faq-6", "/faq", 88, 40),
  spot("news-5", "/news", 32, 40),
  spot("wiki-6", "/wiki", 28, 45),
  spot("support-6", "/support", 32, 55),
  spot("prop-5", "/proposals", 36, 40),
  spot("map-5", "/map", 38, 45),
];

export function normalizeDiamondPath(pathname: string): string {
  if (!pathname || pathname === "") return "/";
  const p = pathname.split("?")[0]!.split("#")[0]!;
  if (p.length > 1 && p.endsWith("/")) return p.slice(0, -1);
  return p || "/";
}

export function isDiamondPathAllowed(pathname: string): boolean {
  const p = normalizeDiamondPath(pathname);
  if (p === "/admin" || p.startsWith("/admin/")) return false;
  if (p.startsWith("/api")) return false;
  return true;
}
