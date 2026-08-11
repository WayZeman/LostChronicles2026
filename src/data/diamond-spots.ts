/**
 * Рівно 100 діамантів на весь івент.
 * kind "page" — % від [data-diamond-page] (скроляться з контентом).
 * kind "slot" — портал у [data-diamond-slot="id"] (FAQ, картки тощо).
 */
export const DIAMOND_EVENT_TOTAL = 100;
/** 1 тиждень + 3 дні */
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
      /** збігається з data-diamond-slot */
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
  return { id, path, kind: "page", top, left, ...opts };
}

function slot(
  id: string,
  path: string,
  slotId: string,
  opts?: {
    top?: number;
    left?: number;
    size?: "sm" | "md";
    opacity?: number;
  },
): DiamondSpotDef {
  return { id, path, kind: "slot", slot: slotId, ...opts };
}

/**
 * Розподіл: головна, FAQ (відкрий відповіді), магазин (картки),
 * новини, вікі, мапа, голосування, анкета, профіль.
 */
export const DIAMOND_SPOTS: DiamondSpotDef[] = [
  // ——— Home (28) ———
  page("d001", "/", 6, 8, { size: "sm", opacity: 0.55 }),
  page("d002", "/", 9, 72, { size: "sm" }),
  page("d003", "/", 14, 42, { opacity: 0.45 }),
  page("d004", "/", 18, 88, { size: "sm" }),
  page("d005", "/", 22, 14),
  page("d006", "/", 26, 58, { size: "sm", opacity: 0.5 }),
  page("d007", "/", 31, 30),
  page("d008", "/", 35, 78, { size: "sm" }),
  page("d009", "/", 39, 6, { opacity: 0.4 }),
  page("d010", "/", 43, 92),
  page("d011", "/", 48, 48, { size: "sm" }),
  page("d012", "/", 52, 18),
  page("d013", "/", 56, 70, { opacity: 0.55 }),
  page("d014", "/", 60, 36, { size: "sm" }),
  page("d015", "/", 64, 84),
  page("d016", "/", 68, 10, { size: "sm", opacity: 0.45 }),
  page("d017", "/", 72, 54),
  page("d018", "/", 76, 26, { size: "sm" }),
  page("d019", "/", 80, 66, { opacity: 0.5 }),
  page("d020", "/", 84, 40),
  page("d021", "/", 88, 16, { size: "sm" }),
  page("d022", "/", 91, 80),
  page("d023", "/", 12, 22, { size: "sm", opacity: 0.35 }),
  page("d024", "/", 45, 8, { size: "sm" }),
  page("d025", "/", 58, 50, { opacity: 0.4 }),
  page("d026", "/", 70, 90, { size: "sm" }),
  page("d027", "/", 33, 44),
  page("d028", "/", 86, 55, { size: "sm", opacity: 0.5 }),

  // ——— FAQ (20): частина в відповідях ———
  page("d029", "/faq", 8, 12, { size: "sm" }),
  page("d030", "/faq", 12, 80),
  page("d031", "/faq", 18, 40, { opacity: 0.45 }),
  page("d032", "/faq", 88, 20, { size: "sm" }),
  page("d033", "/faq", 92, 70),
  page("d034", "/faq", 10, 55, { size: "sm", opacity: 0.4 }),
  page("d035", "/faq", 94, 45),
  slot("d036", "/faq", "faq-ans-0", { size: "sm", opacity: 0.7 }),
  slot("d037", "/faq", "faq-ans-1", { size: "sm" }),
  slot("d038", "/faq", "faq-ans-2", { opacity: 0.55 }),
  slot("d039", "/faq", "faq-ans-3", { size: "sm" }),
  slot("d040", "/faq", "faq-ans-4"),
  slot("d041", "/faq", "faq-ans-5", { size: "sm", opacity: 0.5 }),
  slot("d042", "/faq", "faq-ans-6"),
  slot("d043", "/faq", "faq-ans-7", { size: "sm" }),
  slot("d044", "/faq", "faq-ans-8", { opacity: 0.6 }),
  slot("d045", "/faq", "faq-ans-9", { size: "sm" }),
  slot("d046", "/faq", "faq-ans-10"),
  slot("d047", "/faq", "faq-ans-11", { size: "sm", opacity: 0.45 }),
  slot("d048", "/faq", "faq-ans-12", { size: "sm" }),

  // ——— Support / магазин (18) ———
  page("d049", "/support", 6, 10, { size: "sm" }),
  page("d050", "/support", 10, 78),
  page("d051", "/support", 14, 40, { opacity: 0.4 }),
  page("d052", "/support", 88, 18, { size: "sm" }),
  page("d053", "/support", 92, 66),
  page("d054", "/support", 96, 40, { size: "sm", opacity: 0.5 }),
  slot("d055", "/support", "support-card-0", { size: "sm" }),
  slot("d056", "/support", "support-card-1", { opacity: 0.55 }),
  slot("d057", "/support", "support-card-2", { size: "sm" }),
  slot("d058", "/support", "support-card-3"),
  slot("d059", "/support", "support-card-4", { size: "sm", opacity: 0.45 }),
  slot("d060", "/support", "support-card-5", { size: "sm" }),
  slot("d061", "/support", "support-card-6"),
  slot("d062", "/support", "support-card-7", { size: "sm", opacity: 0.5 }),
  slot("d063", "/support", "support-supporters", { size: "sm" }),
  slot("d064", "/support", "support-header", { opacity: 0.6 }),
  page("d065", "/support", 50, 8, { size: "sm" }),
  page("d066", "/support", 55, 90, { size: "sm", opacity: 0.4 }),

  // ——— News (8) ———
  page("d067", "/news", 8, 14, { size: "sm" }),
  page("d068", "/news", 18, 82),
  page("d069", "/news", 32, 28, { opacity: 0.45 }),
  page("d070", "/news", 48, 70, { size: "sm" }),
  page("d071", "/news", 62, 16),
  page("d072", "/news", 76, 58, { size: "sm", opacity: 0.5 }),
  page("d073", "/news", 88, 36),
  page("d074", "/news", 42, 48, { size: "sm", opacity: 0.35 }),

  // ——— Wiki (8) ———
  page("d075", "/wiki", 10, 12, { size: "sm" }),
  page("d076", "/wiki", 22, 78),
  page("d077", "/wiki", 38, 30, { opacity: 0.45 }),
  page("d078", "/wiki", 52, 66, { size: "sm" }),
  page("d079", "/wiki", 66, 18),
  page("d080", "/wiki", 78, 84, { size: "sm", opacity: 0.5 }),
  page("d081", "/wiki", 90, 44),
  page("d082", "/wiki", 34, 52, { size: "sm", opacity: 0.4 }),

  // ——— Map (6) ———
  page("d083", "/map", 12, 18, { size: "sm" }),
  page("d084", "/map", 28, 76),
  page("d085", "/map", 48, 22, { opacity: 0.45 }),
  page("d086", "/map", 64, 68, { size: "sm" }),
  page("d087", "/map", 82, 40),
  page("d088", "/map", 40, 50, { size: "sm", opacity: 0.4 }),

  // ——— Proposals (6) ———
  page("d089", "/proposals", 10, 16, { size: "sm" }),
  page("d090", "/proposals", 28, 80),
  page("d091", "/proposals", 48, 24, { opacity: 0.45 }),
  page("d092", "/proposals", 66, 72, { size: "sm" }),
  page("d093", "/proposals", 84, 38),
  page("d094", "/proposals", 40, 48, { size: "sm", opacity: 0.4 }),

  // ——— Apply (4) ———
  page("d095", "/apply", 14, 20, { size: "sm", opacity: 0.5 }),
  page("d096", "/apply", 40, 78),
  page("d097", "/apply", 68, 28, { size: "sm" }),
  page("d098", "/apply", 88, 62, { opacity: 0.45 }),

  // ——— Profile (2) ———
  page("d099", "/profile", 30, 22, { size: "sm", opacity: 0.55 }),
  page("d100", "/profile", 70, 74, { size: "sm" }),
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

export function getSpotsForPath(pathname: string): DiamondSpotDef[] {
  const path = normalizeDiamondPath(pathname);
  return DIAMOND_SPOTS.filter((s) => normalizeDiamondPath(s.path) === path);
}

export function getSpotById(id: string): DiamondSpotDef | undefined {
  return DIAMOND_SPOTS.find((s) => s.id === id);
}
