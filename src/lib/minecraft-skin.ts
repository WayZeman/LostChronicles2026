import { validateMinecraftSkinDataUrl } from "@/lib/minecraft-skin-png";

/** Розмір класичного Java-скіна (1.8+). */
export const SKIN_SIZE = 64;

export type SkinModelType = "classic" | "slim";

export type BodyPartId =
  | "head"
  | "body"
  | "arm_r"
  | "arm_l"
  | "leg_r"
  | "leg_l";

export type FaceSide =
  | "front"
  | "back"
  | "left"
  | "right"
  | "top"
  | "bottom";

export type SkinFaceRect = {
  x: number;
  y: number;
  w: number;
  h: number;
  overlay?: { x: number; y: number };
};

export type BodyPartDef = {
  id: BodyPartId;
  label: string;
  faces: Partial<Record<FaceSide, SkinFaceRect>>;
};

/** Регіони базового шару (непрозорі частини макета) — мають бути opaque у грі. */
export const BASE_OPAQUE_RECTS: ReadonlyArray<
  readonly [number, number, number, number]
> = [
  [0, 0, 32, 16],
  [0, 16, 56, 32],
  [16, 48, 32, 64],
  [32, 48, 48, 64],
];

export const FACE_SIDE_LABELS: Record<FaceSide, string> = {
  front: "Перед",
  back: "Зад",
  left: "Ліво",
  right: "Право",
  top: "Верх",
  bottom: "Низ",
};

/** Частини тіла + усі сторони UV (база + offset overlay). */
export const BODY_PARTS: BodyPartDef[] = [
  {
    id: "head",
    label: "Голова",
    faces: {
      front: { x: 8, y: 8, w: 8, h: 8, overlay: { x: 40, y: 8 } },
      back: { x: 24, y: 8, w: 8, h: 8, overlay: { x: 56, y: 8 } },
      left: { x: 16, y: 8, w: 8, h: 8, overlay: { x: 48, y: 8 } },
      right: { x: 0, y: 8, w: 8, h: 8, overlay: { x: 32, y: 8 } },
      top: { x: 8, y: 0, w: 8, h: 8, overlay: { x: 40, y: 0 } },
      bottom: { x: 16, y: 0, w: 8, h: 8, overlay: { x: 48, y: 0 } },
    },
  },
  {
    id: "body",
    label: "Тіло",
    faces: {
      front: { x: 20, y: 20, w: 8, h: 12, overlay: { x: 20, y: 36 } },
      back: { x: 32, y: 20, w: 8, h: 12, overlay: { x: 32, y: 36 } },
      left: { x: 28, y: 20, w: 4, h: 12, overlay: { x: 28, y: 36 } },
      right: { x: 16, y: 20, w: 4, h: 12, overlay: { x: 16, y: 36 } },
      top: { x: 20, y: 16, w: 8, h: 4, overlay: { x: 20, y: 32 } },
      bottom: { x: 28, y: 16, w: 8, h: 4, overlay: { x: 28, y: 32 } },
    },
  },
  {
    id: "arm_r",
    label: "Права рука",
    faces: {
      front: { x: 44, y: 20, w: 4, h: 12, overlay: { x: 44, y: 36 } },
      back: { x: 52, y: 20, w: 4, h: 12, overlay: { x: 52, y: 36 } },
      left: { x: 48, y: 20, w: 4, h: 12, overlay: { x: 48, y: 36 } },
      right: { x: 40, y: 20, w: 4, h: 12, overlay: { x: 40, y: 36 } },
      top: { x: 44, y: 16, w: 4, h: 4, overlay: { x: 44, y: 32 } },
      bottom: { x: 48, y: 16, w: 4, h: 4, overlay: { x: 48, y: 32 } },
    },
  },
  {
    id: "arm_l",
    label: "Ліва рука",
    faces: {
      front: { x: 36, y: 52, w: 4, h: 12, overlay: { x: 52, y: 52 } },
      back: { x: 44, y: 52, w: 4, h: 12, overlay: { x: 60, y: 52 } },
      left: { x: 40, y: 52, w: 4, h: 12, overlay: { x: 56, y: 52 } },
      right: { x: 32, y: 52, w: 4, h: 12, overlay: { x: 48, y: 52 } },
      top: { x: 36, y: 48, w: 4, h: 4, overlay: { x: 52, y: 48 } },
      bottom: { x: 40, y: 48, w: 4, h: 4, overlay: { x: 56, y: 48 } },
    },
  },
  {
    id: "leg_r",
    label: "Права нога",
    faces: {
      front: { x: 4, y: 20, w: 4, h: 12, overlay: { x: 4, y: 36 } },
      back: { x: 12, y: 20, w: 4, h: 12, overlay: { x: 12, y: 36 } },
      left: { x: 8, y: 20, w: 4, h: 12, overlay: { x: 8, y: 36 } },
      right: { x: 0, y: 20, w: 4, h: 12, overlay: { x: 0, y: 36 } },
      top: { x: 4, y: 16, w: 4, h: 4, overlay: { x: 4, y: 32 } },
      bottom: { x: 8, y: 16, w: 4, h: 4, overlay: { x: 8, y: 32 } },
    },
  },
  {
    id: "leg_l",
    label: "Ліва нога",
    faces: {
      front: { x: 20, y: 52, w: 4, h: 12, overlay: { x: 4, y: 52 } },
      back: { x: 28, y: 52, w: 4, h: 12, overlay: { x: 12, y: 52 } },
      left: { x: 24, y: 52, w: 4, h: 12, overlay: { x: 8, y: 52 } },
      right: { x: 16, y: 52, w: 4, h: 12, overlay: { x: 0, y: 52 } },
      top: { x: 20, y: 48, w: 4, h: 4, overlay: { x: 4, y: 48 } },
      bottom: { x: 24, y: 48, w: 4, h: 4, overlay: { x: 8, y: 48 } },
    },
  },
];

/** Slim (Alex) — руки шириною 3 px. */
const SLIM_ARM_R: BodyPartDef = {
  id: "arm_r",
  label: "Права рука",
  faces: {
    front: { x: 44, y: 20, w: 3, h: 12, overlay: { x: 44, y: 36 } },
    back: { x: 51, y: 20, w: 3, h: 12, overlay: { x: 51, y: 36 } },
    left: { x: 47, y: 20, w: 4, h: 12, overlay: { x: 47, y: 36 } },
    right: { x: 40, y: 20, w: 4, h: 12, overlay: { x: 40, y: 36 } },
    top: { x: 44, y: 16, w: 3, h: 4, overlay: { x: 44, y: 32 } },
    bottom: { x: 47, y: 16, w: 3, h: 4, overlay: { x: 47, y: 32 } },
  },
};

const SLIM_ARM_L: BodyPartDef = {
  id: "arm_l",
  label: "Ліва рука",
  faces: {
    front: { x: 36, y: 52, w: 3, h: 12, overlay: { x: 52, y: 52 } },
    back: { x: 43, y: 52, w: 3, h: 12, overlay: { x: 59, y: 52 } },
    left: { x: 39, y: 52, w: 4, h: 12, overlay: { x: 55, y: 52 } },
    right: { x: 32, y: 52, w: 4, h: 12, overlay: { x: 48, y: 52 } },
    top: { x: 36, y: 48, w: 3, h: 4, overlay: { x: 52, y: 48 } },
    bottom: { x: 39, y: 48, w: 3, h: 4, overlay: { x: 55, y: 48 } },
  },
};

export function getBodyPart(
  id: BodyPartId,
  model: SkinModelType = "classic",
): BodyPartDef {
  if (model === "slim") {
    if (id === "arm_r") return SLIM_ARM_R;
    if (id === "arm_l") return SLIM_ARM_L;
  }
  return BODY_PARTS.find((p) => p.id === id) ?? BODY_PARTS[0]!;
}

export function resolveFaceRect(
  rect: SkinFaceRect,
  useOverlay: boolean,
): { x: number; y: number; w: number; h: number } {
  if (useOverlay && rect.overlay) {
    return { x: rect.overlay.x, y: rect.overlay.y, w: rect.w, h: rect.h };
  }
  return { x: rect.x, y: rect.y, w: rect.w, h: rect.h };
}

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
  if (typeof ImageData !== "undefined") {
    return new ImageData(data, SKIN_SIZE, SKIN_SIZE);
  }
  return { data, width: SKIN_SIZE, height: SKIN_SIZE, colorSpace: "srgb" } as ImageData;
}

/**
 * Експорт PNG як є (з alpha). Прозорі пікселі = невидимі області в грі;
 * overlay (3D-шар) теж зберігає прозорість.
 */
export function imageDataToPngDataUrl(imageData: ImageData): string {
  const canvas = document.createElement("canvas");
  canvas.width = SKIN_SIZE;
  canvas.height = SKIN_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D недоступний");
  ctx.imageSmoothingEnabled = false;
  // clear → справжня прозорість у PNG
  ctx.clearRect(0, 0, SKIN_SIZE, SKIN_SIZE);
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}

/** Експорт для превʼю без повторної нормалізації (швидкий live-update). */
export function imageDataToPreviewDataUrl(imageData: ImageData): string {
  const canvas = document.createElement("canvas");
  canvas.width = SKIN_SIZE;
  canvas.height = SKIN_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D недоступний");
  ctx.imageSmoothingEnabled = false;
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

/** Пензель (квадрат) навколо точки. */
export function stampBrush(
  imageData: ImageData,
  cx: number,
  cy: number,
  size: number,
  r: number,
  g: number,
  b: number,
  a: number,
  clip?: { x: number; y: number; w: number; h: number },
) {
  const half = Math.floor(size / 2);
  for (let dy = -half; dy <= half; dy++) {
    for (let dx = -half; dx <= half; dx++) {
      const x = cx + dx;
      const y = cy + dy;
      if (clip) {
        if (
          x < clip.x ||
          y < clip.y ||
          x >= clip.x + clip.w ||
          y >= clip.y + clip.h
        ) {
          continue;
        }
      }
      setPixel(imageData, x, y, r, g, b, a);
    }
  }
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

export function isValidSkinPngDataUrl(dataUrl: string): boolean {
  try {
    validateMinecraftSkinDataUrl(dataUrl);
    return true;
  } catch {
    return false;
  }
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

/** UV з raycast skinview3d → піксель Minecraft PNG. */
export function uvToSkinPixel(u: number, v: number): { x: number; y: number } {
  const x = Math.min(SKIN_SIZE - 1, Math.max(0, Math.floor(u * SKIN_SIZE)));
  // skinview3d уже кладе UV з flipY (1 - y/64), тому повертаємо назад
  const y = Math.min(SKIN_SIZE - 1, Math.max(0, Math.floor((1 - v) * SKIN_SIZE)));
  return { x, y };
}
