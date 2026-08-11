/**
 * Рівно 100 діамантів. path: точний шлях або префікс `/wiki/*`, `/proposals/*`.
 * kind "page" — % від [data-diamond-page]; "slot" — [data-diamond-slot].
 * На мобілці top ≤ 82%, щоб не ховатись під нижню навігацію.
 * Розміри / прозорість / поворот — хаотично; частина майже «прихована», але все ще клікабельна.
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

/**
 * Детермінований «хаос» від індексу.
 * ~1/3 напівпрозорі (важче помітити), решта яскравіші.
 * Мін. opacity ~0.34 — ще видно при уважному пошуку.
 */
function vibe(n: number): {
  size: DiamondSize;
  opacity: number;
  rotate: number;
} {
  const sizes: DiamondSize[] = [
    "xs",
    "lg",
    "sm",
    "md",
    "xs",
    "md",
    "lg",
    "sm",
    "md",
    "xs",
    "sm",
    "lg",
  ];
  const size = sizes[n % sizes.length]!;

  // Три «шари» видимості: ghost / mid / bright
  const tier = (n * 13 + 5) % 10;
  let opacity: number;
  if (tier <= 2) {
    // ghost — помітно лише якщо придивитись
    opacity = 0.34 + ((n * 7) % 9) / 100; // 0.34–0.42
  } else if (tier <= 5) {
    opacity = 0.48 + ((n * 11) % 14) / 100; // 0.48–0.61
  } else {
    opacity = 0.72 + ((n * 17) % 22) / 100; // 0.72–0.93
  }

  const rotate = ((n * 53 + 19) % 71) - 35; // −35…+35°
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
 * Повністю новий розкид (seed v3): нерівні кути, краї, середини — без рядів.
 */
export const DIAMOND_SPOTS: DiamondSpotDef[] = [
  // ——— Home 16 ———
  page(1, "d001", "/", 4, 88),
  page(2, "d002", "/", 15, 6),
  page(3, "d003", "/", 27, 51),
  page(4, "d004", "/", 9, 34),
  page(5, "d005", "/", 41, 93),
  page(6, "d006", "/", 53, 18),
  page(7, "d007", "/", 62, 71),
  page(8, "d008", "/", 36, 39),
  page(9, "d009", "/", 74, 8),
  page(10, "d010", "/", 48, 62),
  page(11, "d011", "/", 81, 44),
  page(12, "d012", "/", 21, 77),
  slot(13, "d013", "/", "home-online", 81, 14),
  slot(14, "d014", "/", "home-join", 19, 68),
  slot(15, "d015", "/", "home-social", 56, 91),
  slot(16, "d016", "/", "home-support", 33, 27),

  // ——— FAQ 14 ———
  page(17, "d017", "/faq", 5, 71),
  page(18, "d018", "/faq", 18, 9),
  slot(19, "d019", "/faq", "faq-ans-0", 74, 42),
  slot(20, "d020", "/faq", "faq-ans-1", 11, 83),
  slot(21, "d021", "/faq", "faq-ans-2", 58, 16),
  slot(22, "d022", "/faq", "faq-ans-3", 29, 61),
  slot(23, "d023", "/faq", "faq-ans-4", 83, 74),
  slot(24, "d024", "/faq", "faq-ans-5", 46, 8),
  slot(25, "d025", "/faq", "faq-ans-6", 17, 49),
  slot(26, "d026", "/faq", "faq-ans-7", 67, 91),
  slot(27, "d027", "/faq", "faq-ans-8", 38, 33),
  slot(28, "d028", "/faq", "faq-ans-9", 8, 22),
  slot(29, "d029", "/faq", "faq-ans-10", 71, 57),
  slot(30, "d030", "/faq", "faq-ans-11", 52, 79),

  // ——— Support 14 ———
  page(31, "d031", "/support", 6, 44),
  page(32, "d032", "/support", 22, 91),
  page(33, "d033", "/support", 51, 7),
  page(34, "d034", "/support", 69, 63),
  slot(35, "d035", "/support", "support-header", 14, 28),
  slot(36, "d036", "/support", "support-card-0", 77, 81),
  slot(37, "d037", "/support", "support-card-1", 41, 11),
  slot(38, "d038", "/support", "support-card-2", 9, 66),
  slot(39, "d039", "/support", "support-card-3", 63, 47),
  slot(40, "d040", "/support", "support-card-4", 28, 88),
  slot(41, "d041", "/support", "support-card-5", 84, 19),
  slot(42, "d042", "/support", "support-card-6", 47, 54),
  slot(43, "d043", "/support", "support-card-7", 19, 37),
  slot(44, "d044", "/support", "support-supporters", 56, 73),

  // ——— Wiki home 12 ———
  page(45, "d045", "/wiki", 7, 61),
  page(46, "d046", "/wiki", 28, 12),
  slot(47, "d047", "/wiki", "wiki-header", 81, 44),
  slot(48, "d048", "/wiki", "wiki-search", 16, 79),
  slot(49, "d049", "/wiki", "wiki-sec-0", 54, 6),
  slot(50, "d050", "/wiki", "wiki-sec-1", 39, 91),
  slot(51, "d051", "/wiki", "wiki-sec-2", 72, 31),
  slot(52, "d052", "/wiki", "wiki-cat-0", 11, 48),
  slot(53, "d053", "/wiki", "wiki-cat-1", 63, 68),
  slot(54, "d054", "/wiki", "wiki-cat-2", 33, 23),
  slot(55, "d055", "/wiki", "wiki-cat-3", 48, 84),
  slot(56, "d056", "/wiki", "wiki-cat-4", 21, 55),

  // ——— Wiki any subpage (без RP новин) 8 ———
  page(57, "d057", "/wiki/*", 6, 28),
  page(58, "d058", "/wiki/*", 31, 86),
  page(59, "d059", "/wiki/*", 66, 9),
  page(60, "d060", "/wiki/*", 79, 57),
  slot(61, "d061", "/wiki/*", "wiki-sub-0", 44, 19),
  slot(62, "d062", "/wiki/*", "wiki-sub-1", 13, 71),
  slot(63, "d063", "/wiki/*", "wiki-pagecard-0", 71, 14),
  slot(64, "d064", "/wiki/*", "wiki-article-header", 17, 88),

  // ——— RP новини (/wiki/RP_новини) 6 ———
  page(65, "d065", "/wiki/RP_новини", 8, 18),
  page(66, "d066", "/wiki/RP_новини", 24, 82),
  page(67, "d067", "/wiki/RP_новини", 58, 11),
  slot(68, "d068", "/wiki/RP_новини", "rp-news-0", 19, 64),
  slot(69, "d069", "/wiki/RP_новини", "rp-news-1", 72, 28),
  slot(70, "d070", "/wiki/RP_новини", "rp-news-2", 41, 88),

  // ——— News 7 ———
  page(71, "d071", "/news", 8, 52),
  page(72, "d072", "/news", 34, 11),
  page(73, "d073", "/news", 67, 83),
  slot(74, "d074", "/news", "news-header", 49, 27),
  slot(75, "d075", "/news", "news-post-0", 16, 74),
  slot(76, "d076", "/news", "news-post-1", 78, 46),
  slot(77, "d077", "/news", "news-post-2", 41, 91),

  // ——— Proposals list 6 ———
  page(78, "d078", "/proposals", 9, 81),
  page(79, "d079", "/proposals", 44, 14),
  slot(80, "d080", "/proposals", "prop-header", 71, 58),
  slot(81, "d081", "/proposals", "prop-card-0", 22, 37),
  slot(82, "d082", "/proposals", "prop-card-1", 57, 89),
  slot(83, "d083", "/proposals", "prop-card-2", 33, 6),

  // ——— Create proposal 4 ———
  slot(84, "d084", "/proposals/new", "prop-new-header", 18, 44),
  slot(85, "d085", "/proposals/new", "prop-new-kind", 76, 81),
  slot(86, "d086", "/proposals/new", "prop-new-form", 47, 13),
  page(87, "d087", "/proposals/new", 61, 66),

  // ——— Proposal detail 5 ———
  slot(88, "d088", "/proposals/*", "prop-detail-header", 12, 77),
  slot(89, "d089", "/proposals/*", "prop-detail-body", 69, 28),
  slot(90, "d090", "/proposals/*", "prop-detail-vote", 38, 91),
  page(91, "d091", "/proposals/*", 54, 8),
  page(92, "d092", "/proposals/*", 23, 49),

  // ——— Map 4 ———
  page(93, "d093", "/map", 17, 73),
  page(94, "d094", "/map", 58, 21),
  slot(95, "d095", "/map", "map-header", 8, 41),
  slot(96, "d096", "/map", "map-cta", 74, 86),

  // ——— Apply 4 ———
  page(97, "d097", "/apply", 14, 8),
  slot(98, "d098", "/apply", "apply-header", 61, 79),
  slot(99, "d099", "/apply", "apply-q-0", 29, 52),
  slot(100, "d100", "/apply", "apply-q-1", 81, 17),
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

/** Чи це сторінка RP новин у вікі (для виключення з `/wiki/*`). */
function isRpNewsDiamondPath(rest: string): boolean {
  const normalized = rest
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
  return (
    normalized === "rp новини" ||
    normalized === "рп новини" ||
    normalized === "rp news"
  );
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
    // /wiki/* — без окремої сторінки RP новин (у неї свої слоти)
    if (base === "/wiki" && isRpNewsDiamondPath(rest)) return false;
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
