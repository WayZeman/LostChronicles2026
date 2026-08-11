/**
 * Рівно 100 діамантів. path: точний шлях або префікс `/wiki/*`, `/proposals/*`.
 * kind "page" — % від [data-diamond-page]; "slot" — [data-diamond-slot].
 * На мобілці top ≤ 82%, щоб не ховатись під нижню навігацію.
 * Розміри/прозорість/поворот — хаотично, щоб не виглядало «в одну лінію».
 */
export const DIAMOND_EVENT_TOTAL = 100;
export const DIAMOND_EVENT_DURATION_DAYS = 10;

export type DiamondSize = "xs" | "sm" | "md" | "lg";

export type DiamondSpotDef =
  | {
      id: string;
      path: string;
      kind: "page";
      top: number;
      left: number;
      size?: DiamondSize;
      opacity?: number;
      rotate?: number;
    }
  | {
      id: string;
      path: string;
      kind: "slot";
      slot: string;
      top?: number;
      left?: number;
      size?: DiamondSize;
      opacity?: number;
      rotate?: number;
    };

/** Детермінований «хаос» від індексу діаманта (стабільний між рендерами). */
function vibe(n: number): {
  size: DiamondSize;
  opacity: number;
  rotate: number;
} {
  const sizes: DiamondSize[] = [
    "xs",
    "sm",
    "md",
    "lg",
    "sm",
    "md",
    "xs",
    "lg",
    "md",
    "sm",
  ];
  const size = sizes[n % sizes.length]!;
  const opacity = 0.68 + ((n * 19 + 7) % 28) / 100;
  const rotate = ((n * 47 + 11) % 61) - 30; // −30…+30°
  return { size, opacity, rotate };
}

function page(
  n: number,
  id: string,
  path: string,
  top: number,
  left: number,
): DiamondSpotDef {
  const v = vibe(n);
  return {
    id,
    path,
    kind: "page",
    top,
    left,
    size: v.size,
    opacity: v.opacity,
    rotate: v.rotate,
  };
}

function slot(
  n: number,
  id: string,
  path: string,
  slotId: string,
  top = 50,
  left = 50,
): DiamondSpotDef {
  const v = vibe(n);
  return {
    id,
    path,
    kind: "slot",
    slot: slotId,
    top,
    left,
    size: v.size,
    opacity: v.opacity,
    rotate: v.rotate,
  };
}

/**
 * Розкидано нерівномірно: різні top/left, без «сходинок» і рівних рядів.
 */
export const DIAMOND_SPOTS: DiamondSpotDef[] = [
  // ——— Home 16 ———
  page(1, "d001", "/", 6, 7),
  page(2, "d002", "/", 11, 91),
  page(3, "d003", "/", 19, 41),
  page(4, "d004", "/", 23, 73),
  page(5, "d005", "/", 31, 9),
  page(6, "d006", "/", 37, 58),
  page(7, "d007", "/", 44, 33),
  page(8, "d008", "/", 49, 86),
  page(9, "d009", "/", 57, 21),
  page(10, "d010", "/", 63, 67),
  page(11, "d011", "/", 69, 48),
  page(12, "d012", "/", 78, 14),
  slot(13, "d013", "/", "home-online", 18, 82),
  slot(14, "d014", "/", "home-join", 72, 28),
  slot(15, "d015", "/", "home-social", 35, 64),
  slot(16, "d016", "/", "home-support", 61, 12),

  // ——— FAQ 14 ———
  page(17, "d017", "/faq", 7, 19),
  page(18, "d018", "/faq", 14, 87),
  slot(19, "d019", "/faq", "faq-ans-0", 28, 71),
  slot(20, "d020", "/faq", "faq-ans-1", 64, 18),
  slot(21, "d021", "/faq", "faq-ans-2", 41, 88),
  slot(22, "d022", "/faq", "faq-ans-3", 12, 34),
  slot(23, "d023", "/faq", "faq-ans-4", 77, 56),
  slot(24, "d024", "/faq", "faq-ans-5", 53, 9),
  slot(25, "d025", "/faq", "faq-ans-6", 22, 61),
  slot(26, "d026", "/faq", "faq-ans-7", 69, 79),
  slot(27, "d027", "/faq", "faq-ans-8", 36, 42),
  slot(28, "d028", "/faq", "faq-ans-9", 81, 23),
  slot(29, "d029", "/faq", "faq-ans-10", 47, 91),
  slot(30, "d030", "/faq", "faq-ans-11", 15, 48),

  // ——— Support 14 ———
  page(31, "d031", "/support", 5, 11),
  page(32, "d032", "/support", 13, 84),
  page(33, "d033", "/support", 46, 6),
  page(34, "d034", "/support", 58, 92),
  slot(35, "d035", "/support", "support-header", 24, 76),
  slot(36, "d036", "/support", "support-card-0", 68, 14),
  slot(37, "d037", "/support", "support-card-1", 31, 55),
  slot(38, "d038", "/support", "support-card-2", 79, 81),
  slot(39, "d039", "/support", "support-card-3", 17, 29),
  slot(40, "d040", "/support", "support-card-4", 52, 67),
  slot(41, "d041", "/support", "support-card-5", 74, 38),
  slot(42, "d042", "/support", "support-card-6", 9, 58),
  slot(43, "d043", "/support", "support-card-7", 43, 12),
  slot(44, "d044", "/support", "support-supporters", 61, 88),

  // ——— Wiki home 12 ———
  page(45, "d045", "/wiki", 8, 8),
  page(46, "d046", "/wiki", 17, 79),
  slot(47, "d047", "/wiki", "wiki-header", 27, 63),
  slot(48, "d048", "/wiki", "wiki-search", 71, 21),
  slot(49, "d049", "/wiki", "wiki-sec-0", 39, 87),
  slot(50, "d050", "/wiki", "wiki-sec-1", 14, 41),
  slot(51, "d051", "/wiki", "wiki-sec-2", 66, 9),
  slot(52, "d052", "/wiki", "wiki-cat-0", 48, 74),
  slot(53, "d053", "/wiki", "wiki-cat-1", 81, 46),
  slot(54, "d054", "/wiki", "wiki-cat-2", 22, 18),
  slot(55, "d055", "/wiki", "wiki-cat-3", 55, 91),
  slot(56, "d056", "/wiki", "wiki-cat-4", 33, 52),

  // ——— Wiki any subpage 12 ———
  page(57, "d057", "/wiki/*", 9, 23),
  page(58, "d058", "/wiki/*", 21, 81),
  page(59, "d059", "/wiki/*", 59, 14),
  page(60, "d060", "/wiki/*", 74, 68),
  slot(61, "d061", "/wiki/*", "wiki-sub-0", 18, 72),
  slot(62, "d062", "/wiki/*", "wiki-sub-1", 64, 26),
  slot(63, "d063", "/wiki/*", "wiki-sub-2", 37, 9),
  slot(64, "d064", "/wiki/*", "wiki-sub-3", 79, 58),
  slot(65, "d065", "/wiki/*", "wiki-pagecard-0", 28, 84),
  slot(66, "d066", "/wiki/*", "wiki-pagecard-1", 51, 17),
  slot(67, "d067", "/wiki/*", "wiki-pagecard-2", 12, 49),
  slot(68, "d068", "/wiki/*", "wiki-article-header", 43, 71),

  // ——— News 7 ———
  page(69, "d069", "/news", 7, 14),
  page(70, "d070", "/news", 24, 86),
  page(71, "d071", "/news", 61, 31),
  slot(72, "d072", "/news", "news-header", 19, 67),
  slot(73, "d073", "/news", "news-post-0", 73, 22),
  slot(74, "d074", "/news", "news-post-1", 41, 91),
  slot(75, "d075", "/news", "news-post-2", 56, 8),

  // ——— Proposals list 6 ———
  page(76, "d076", "/proposals", 11, 9),
  page(77, "d077", "/proposals", 33, 88),
  slot(78, "d078", "/proposals", "prop-header", 26, 54),
  slot(79, "d079", "/proposals", "prop-card-0", 68, 19),
  slot(80, "d080", "/proposals", "prop-card-1", 44, 77),
  slot(81, "d081", "/proposals", "prop-card-2", 16, 38),

  // ——— Create proposal 4 ———
  slot(82, "d082", "/proposals/new", "prop-new-header", 22, 71),
  slot(83, "d083", "/proposals/new", "prop-new-kind", 64, 14),
  slot(84, "d084", "/proposals/new", "prop-new-form", 39, 82),
  page(85, "d085", "/proposals/new", 72, 47),

  // ——— Proposal detail 5 ———
  slot(86, "d086", "/proposals/*", "prop-detail-header", 17, 63),
  slot(87, "d087", "/proposals/*", "prop-detail-body", 58, 21),
  slot(88, "d088", "/proposals/*", "prop-detail-vote", 34, 89),
  page(89, "d089", "/proposals/*", 42, 11),
  page(90, "d090", "/proposals/*", 71, 76),

  // ——— Map 4 ———
  page(91, "d091", "/map", 12, 17),
  page(92, "d092", "/map", 39, 81),
  slot(93, "d093", "/map", "map-header", 28, 49),
  slot(94, "d094", "/map", "map-cta", 67, 24),

  // ——— Apply 6 ———
  page(95, "d095", "/apply", 10, 26),
  slot(96, "d096", "/apply", "apply-header", 31, 78),
  slot(97, "d097", "/apply", "apply-q-0", 72, 16),
  slot(98, "d098", "/apply", "apply-q-1", 48, 61),
  slot(99, "d099", "/apply", "apply-q-2", 19, 39),
  slot(100, "d100", "/apply", "apply-q-3", 63, 87),
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
