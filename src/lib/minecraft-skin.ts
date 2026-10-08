/** Розмір класичного Java-скіна (1.8+). */
export const SKIN_SIZE = 64;

export type SkinModelType = "classic" | "slim";

/** Регіони базового шару (непрозорі частини макета). */
const BASE_OPAQUE_RECTS: ReadonlyArray<readonly [number, number, number, number]> = [
  // Head
  [0, 0, 32, 16],
  // Right leg + body + right arm
  [0, 16, 56, 32],
  // Left leg + left arm (1.8+)
  [16, 48, 32, 64],
  [32, 48, 48, 64],
];

const OVERLAY_RECTS: ReadonlyArray<readonly [number, number, number, number]> = [
  // Hat
  [32, 0, 64, 16],
  // Jacket / sleeves / pants overlay
  [0, 32, 56, 48],
  [0, 48, 16, 64],
  [48, 48, 64, 64],
];

export type SkinFaceId =
  | "head_front"
  | "head_back"
  | "head_left"
  | "head_right"
  | "head_top"
  | "head_bottom"
  | "body_front"
  | "body_back"
  | "arm_r_front"
  | "arm_l_front"
  | "leg_r_front"
  | "leg_l_front";

/** UV-вирізки для 2D-панелі редактора (x, y, w, h) на базовому шарі. */
export const SKIN_FACES: Record<
  SkinFaceId,
  { label: string; x: number; y: number; w: number; h: number; overlay?: { x: number; y: number } }
> = {
  head_front: { label: "Голова · перед", x: 8, y: 8, w: 8, h: 8, overlay: { x: 40, y: 8 } },
  head_back: { label: "Голова · зад", x: 24, y: 8, w: 8, h: 8, overlay: { x: 56, y: 8 } },
  head_left: { label: "Голова · ліво", x: 16, y: 8, w: 8, h: 8, overlay: { x: 48, y: 8 } },
  head_right: { label: "Голова · право", x: 0, y: 8, w: 8, h: 8, overlay: { x: 32, y: 8 } },
  head_top: { label: "Голова · верх", x: 8, y: 0, w: 8, h: 8, overlay: { x: 40, y: 0 } },
  head_bottom: { label: "Голова · низ", x: 16, y: 0, w: 8, h: 8, overlay: { x: 48, y: 0 } },
  body_front: { label: "Тіло · перед", x: 20, y: 20, w: 8, h: 12, overlay: { x: 20, y: 36 } },
  body_back: { label: "Тіло · зад", x: 32, y: 20, w: 8, h: 12, overlay: { x: 32, y: 36 } },
  arm_r_front: { label: "Права рука", x: 44, y: 20, w: 4, h: 12, overlay: { x: 44, y: 36 } },
  arm_l_front: { label: "Ліва рука", x: 36, y: 52, w: 4, h: 12, overlay: { x: 52, y: 52 } },
  leg_r_front: { label: "Права нога", x: 4, y: 20, w: 4, h: 12, overlay: { x: 4, y: 36 } },
  leg_l_front: { label: "Ліва нога", x: 20, y: 52, w: 4, h: 12, overlay: { x: 4, y: 52 } },
};

function fillRect(
  data: Uint8ClampedArray,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  r: number,
  g: number,
  b: number,
  a: number,
) {
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * SKIN_SIZE + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = a;
    }
  }
}

/** Порожній білий макет Steve (base білий, overlay прозорий). */
export function createBlankSkinImageData(): ImageData {
  const data = new Uint8ClampedArray(SKIN_SIZE * SKIN_SIZE * 4);
  for (const [x0, y0, x1, y1] of BASE_OPAQUE_RECTS) {
    fillRect(data, x0, y0, x1, y1, 245, 245, 245, 255);
  }
  // Overlay лишаємо прозорим (0)
  void OVERLAY_RECTS;
  if (typeof ImageData !== "undefined") {
    return new ImageData(data, SKIN_SIZE, SKIN_SIZE);
  }
  // SSR / Node fallback
  return { data, width: SKIN_SIZE, height: SKIN_SIZE, colorSpace: "srgb" } as ImageData;
}

export function imageDataToPngDataUrl(imageData: ImageData): string {
  const canvas = document.createElement("canvas");
  canvas.width = SKIN_SIZE;
  canvas.height = SKIN_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D недоступний");
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}

export function cloneImageData(src: ImageData): ImageData {
  return new ImageData(new Uint8ClampedArray(src.data), src.width, src.height);
}

export function setPixel(
  imageData: ImageData,
  x: number,
  y: number,
  r: number,
  g: number,
  b: number,
  a: number,
) {
  if (x < 0 || y < 0 || x >= SKIN_SIZE || y >= SKIN_SIZE) return;
  const i = (y * SKIN_SIZE + x) * 4;
  imageData.data[i] = r;
  imageData.data[i + 1] = g;
  imageData.data[i + 2] = b;
  imageData.data[i + 3] = a;
}

export function getPixel(
  imageData: ImageData,
  x: number,
  y: number,
): { r: number; g: number; b: number; a: number } {
  if (x < 0 || y < 0 || x >= SKIN_SIZE || y >= SKIN_SIZE) {
    return { r: 0, g: 0, b: 0, a: 0 };
  }
  const i = (y * SKIN_SIZE + x) * 4;
  return {
    r: imageData.data[i]!,
    g: imageData.data[i + 1]!,
    b: imageData.data[i + 2]!,
    a: imageData.data[i + 3]!,
  };
}

/** Flood fill у межах одного UV-прямокутника. */
export function floodFill(
  imageData: ImageData,
  startX: number,
  startY: number,
  r: number,
  g: number,
  b: number,
  a: number,
  clip?: { x: number; y: number; w: number; h: number },
) {
  const target = getPixel(imageData, startX, startY);
  if (target.r === r && target.g === g && target.b === b && target.a === a) return;

  const xMin = clip?.x ?? 0;
  const yMin = clip?.y ?? 0;
  const xMax = clip ? clip.x + clip.w : SKIN_SIZE;
  const yMax = clip ? clip.y + clip.h : SKIN_SIZE;

  const stack: [number, number][] = [[startX, startY]];
  const seen = new Uint8Array(SKIN_SIZE * SKIN_SIZE);

  while (stack.length) {
    const [x, y] = stack.pop()!;
    if (x < xMin || y < yMin || x >= xMax || y >= yMax) continue;
    const key = y * SKIN_SIZE + x;
    if (seen[key]) continue;
    const p = getPixel(imageData, x, y);
    if (p.r !== target.r || p.g !== target.g || p.b !== target.b || p.a !== target.a) {
      continue;
    }
    seen[key] = 1;
    setPixel(imageData, x, y, r, g, b, a);
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
}

const PNG_DATA_URL_RE =
  /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/i;

export function isValidSkinPngDataUrl(dataUrl: string): boolean {
  const m = dataUrl.trim().match(PNG_DATA_URL_RE);
  if (!m) return false;
  // ~64×64 PNG ≈ кілька KB; лишаємо запас
  return m[1]!.length <= 120_000;
}

export function hexToRgba(hex: string): { r: number; g: number; b: number; a: number } {
  const h = hex.replace("#", "").trim();
  if (h.length === 3) {
    const r = parseInt(h[0]! + h[0]!, 16);
    const g = parseInt(h[1]! + h[1]!, 16);
    const b = parseInt(h[2]! + h[2]!, 16);
    return { r, g, b, a: 255 };
  }
  if (h.length === 6 || h.length === 8) {
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) : 255;
    return { r, g, b, a };
  }
  return { r: 0, g: 0, b: 0, a: 255 };
}

export function rgbaToHex(r: number, g: number, b: number): string {
  const c = (n: number) => n.toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}
