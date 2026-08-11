/**
 * Рівно 100 діамантів. path: точний шлях або префікс `/wiki/*`, `/proposals/*`.
 * kind "page" — % від [data-diamond-page]; "slot" — [data-diamond-slot].
 * На мобілці top ≤ 82%, щоб не ховатись під нижню навігацію.
 */
export const DIAMOND_EVENT_TOTAL = 100;
export const DIAMOND_EVENT_DURATION_DAYS = 10;

export type DiamondSpotDef =
  | {
      id: string;
      path: string;
      kind: "page";
      top: number;
      left: number;
      size?: "sm" | "md";
      opacity?: number;
    }
  | {
      id: string;
      path: string;
      kind: "slot";
      slot: string;
      top?: number;
      left?: number;
      size?: "sm" | "md";
      opacity?: number;
    };

function page(
  id: string,
  path: string,
  top: number,
  left: number,
  opts?: { size?: "sm" | "md"; opacity?: number },
): DiamondSpotDef {
  return {
    id,
    path,
    kind: "page",
    top,
    left,
    size: opts?.size ?? "md",
    opacity: opts?.opacity ?? 0.92,
  };
}

function slot(
  id: string,
  path: string,
  slotId: string,
  opts?: { size?: "sm" | "md"; opacity?: number },
): DiamondSpotDef {
  return {
    id,
    path,
    kind: "slot",
    slot: slotId,
    size: opts?.size ?? "md",
    opacity: opts?.opacity ?? 0.92,
  };
}

/**
 * Розкидано по всьому сайту: головна, FAQ, магазин, вікі (країни/довідник),
 * новини, пропозиції (+ створення / деталі), мапа, анкета, профіль.
 */
export const DIAMOND_SPOTS: DiamondSpotDef[] = [
  // ——— Home 16 ———
  page("d001", "/", 8, 10),
  page("d002", "/", 12, 78),
  page("d003", "/", 18, 36),
  page("d004", "/", 24, 88),
  page("d005", "/", 32, 14),
  page("d006", "/", 38, 62),
  page("d007", "/", 46, 28),
  page("d008", "/", 52, 82),
  page("d009", "/", 58, 18),
  page("d010", "/", 64, 70),
  page("d011", "/", 70, 42),
  page("d012", "/", 76, 12),
  slot("d013", "/", "home-online"),
  slot("d014", "/", "home-join"),
  slot("d015", "/", "home-social"),
  slot("d016", "/", "home-support"),

  // ——— FAQ 14 ———
  page("d017", "/faq", 8, 16),
  page("d018", "/faq", 12, 84),
  slot("d019", "/faq", "faq-ans-0"),
  slot("d020", "/faq", "faq-ans-1"),
  slot("d021", "/faq", "faq-ans-2"),
  slot("d022", "/faq", "faq-ans-3"),
  slot("d023", "/faq", "faq-ans-4"),
  slot("d024", "/faq", "faq-ans-5"),
  slot("d025", "/faq", "faq-ans-6"),
  slot("d026", "/faq", "faq-ans-7"),
  slot("d027", "/faq", "faq-ans-8"),
  slot("d028", "/faq", "faq-ans-9"),
  slot("d029", "/faq", "faq-ans-10"),
  slot("d030", "/faq", "faq-ans-11"),

  // ——— Support 14 ———
  page("d031", "/support", 8, 12),
  page("d032", "/support", 14, 80),
  page("d033", "/support", 48, 10),
  page("d034", "/support", 55, 88),
  slot("d035", "/support", "support-header"),
  slot("d036", "/support", "support-card-0"),
  slot("d037", "/support", "support-card-1"),
  slot("d038", "/support", "support-card-2"),
  slot("d039", "/support", "support-card-3"),
  slot("d040", "/support", "support-card-4"),
  slot("d041", "/support", "support-card-5"),
  slot("d042", "/support", "support-card-6"),
  slot("d043", "/support", "support-card-7"),
  slot("d044", "/support", "support-supporters"),

  // ——— Wiki home 12 ———
  page("d045", "/wiki", 10, 14),
  page("d046", "/wiki", 16, 82),
  slot("d047", "/wiki", "wiki-header"),
  slot("d048", "/wiki", "wiki-search"),
  slot("d049", "/wiki", "wiki-sec-0"),
  slot("d050", "/wiki", "wiki-sec-1"),
  slot("d051", "/wiki", "wiki-sec-2"),
  slot("d052", "/wiki", "wiki-cat-0"),
  slot("d053", "/wiki", "wiki-cat-1"),
  slot("d054", "/wiki", "wiki-cat-2"),
  slot("d055", "/wiki", "wiki-cat-3"),
  slot("d056", "/wiki", "wiki-cat-4"),

  // ——— Wiki any subpage (країни, довідник цін, статті…) 12 ———
  page("d057", "/wiki/*", 10, 18),
  page("d058", "/wiki/*", 18, 76),
  page("d059", "/wiki/*", 62, 22),
  page("d060", "/wiki/*", 72, 70),
  slot("d061", "/wiki/*", "wiki-sub-0"),
  slot("d062", "/wiki/*", "wiki-sub-1"),
  slot("d063", "/wiki/*", "wiki-sub-2"),
  slot("d064", "/wiki/*", "wiki-sub-3"),
  slot("d065", "/wiki/*", "wiki-pagecard-0"),
  slot("d066", "/wiki/*", "wiki-pagecard-1"),
  slot("d067", "/wiki/*", "wiki-pagecard-2"),
  slot("d068", "/wiki/*", "wiki-article-header"),

  // ——— News 7 ———
  page("d069", "/news", 10, 16),
  page("d070", "/news", 20, 78),
  page("d071", "/news", 55, 24),
  slot("d072", "/news", "news-header"),
  slot("d073", "/news", "news-post-0"),
  slot("d074", "/news", "news-post-1"),
  slot("d075", "/news", "news-post-2"),

  // ——— Proposals list 6 ———
  page("d076", "/proposals", 12, 14),
  page("d077", "/proposals", 28, 82),
  slot("d078", "/proposals", "prop-header"),
  slot("d079", "/proposals", "prop-card-0"),
  slot("d080", "/proposals", "prop-card-1"),
  slot("d081", "/proposals", "prop-card-2"),

  // ——— Create proposal 4 ———
  slot("d082", "/proposals/new", "prop-new-header"),
  slot("d083", "/proposals/new", "prop-new-kind"),
  slot("d084", "/proposals/new", "prop-new-form"),
  page("d085", "/proposals/new", 70, 40),

  // ——— Proposal detail (будь-яке /proposals/123) 5 ———
  slot("d086", "/proposals/*", "prop-detail-header"),
  slot("d087", "/proposals/*", "prop-detail-body"),
  slot("d088", "/proposals/*", "prop-detail-vote"),
  page("d089", "/proposals/*", 40, 18),
  page("d090", "/proposals/*", 68, 78),

  // ——— Map 4 ———
  page("d091", "/map", 14, 20),
  page("d092", "/map", 36, 74),
  slot("d093", "/map", "map-header"),
  slot("d094", "/map", "map-cta"),

  // ——— Apply 6 ———
  page("d095", "/apply", 12, 22),
  slot("d096", "/apply", "apply-header"),
  slot("d097", "/apply", "apply-q-0"),
  slot("d098", "/apply", "apply-q-1"),
  slot("d099", "/apply", "apply-q-2"),
  slot("d100", "/apply", "apply-q-3"),
];

if (DIAMOND_SPOTS.length !== DIAMOND_EVENT_TOTAL) {
  throw new Error(
    `DIAMOND_SPOTS must be exactly ${DIAMOND_EVENT_TOTAL}, got ${DIAMOND_SPOTS.length}`,
  );
}

const idSet = new Set(DIAMOND_SPOTS.map((s) => s.id));
if (idSet.size !== DIAMOND_EVENT_TOTAL) {
  throw new Error("DIAMOND_SPOTS ids must be unique");
}

export function normalizeDiamondPath(pathname: string): string {
  if (!pathname || pathname === "") return "/";
  let raw = pathname.split("?")[0]!.split("#")[0]!;
  try {
    raw = decodeURIComponent(raw);
  } catch {
    /* keep raw */
  }
  if (raw.length > 1 && raw.endsWith("/")) raw = raw.slice(0, -1);
  return raw || "/";
}

/** Чи збігається spot.path з актуальним pathname (підтримка `/wiki/*`). */
export function spotPathMatches(spotPath: string, pathname: string): boolean {
  const actual = normalizeDiamondPath(pathname);
  const pattern = normalizeDiamondPath(spotPath);

  if (pattern.endsWith("/*")) {
    const base = pattern.slice(0, -2);
    if (!actual.startsWith(`${base}/`)) return false;
    const rest = actual.slice(base.length + 1);
    if (!rest) return false;
    // /proposals/* — лише деталь (/proposals/123), не /new
    if (base === "/proposals") {
      if (rest === "new") return false;
      if (rest.includes("/")) return false;
    }
    return true;
  }

  return pattern === actual;
}

export function isDiamondPathAllowed(pathname: string): boolean {
  const p = normalizeDiamondPath(pathname);
  if (p === "/admin" || p.startsWith("/admin/")) return false;
  if (p.startsWith("/api")) return false;
  return true;
}

export function getSpotsForPath(pathname: string): DiamondSpotDef[] {
  return DIAMOND_SPOTS.filter((s) => spotPathMatches(s.path, pathname));
}

export function getSpotById(id: string): DiamondSpotDef | undefined {
  return DIAMOND_SPOTS.find((s) => s.id === id);
}
