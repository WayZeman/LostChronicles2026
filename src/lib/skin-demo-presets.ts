import { BASE_OPAQUE_RECTS, SKIN_SIZE } from "@/lib/minecraft-skin";
import { encodeRgba64ToDataUrl } from "@/lib/minecraft-skin-png";

type Rgba = { r: number; g: number; b: number; a?: number };

function fillRect(
  data: Uint8ClampedArray,
  x0: number,
  y0: number,
  w: number,
  h: number,
  c: Rgba,
) {
  const a = c.a ?? 255;
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      if (x < 0 || y < 0 || x >= SKIN_SIZE || y >= SKIN_SIZE) continue;
      const i = (y * SKIN_SIZE + x) * 4;
      data[i] = c.r;
      data[i + 1] = c.g;
      data[i + 2] = c.b;
      data[i + 3] = a;
    }
  }
}

function blankBase(): Uint8ClampedArray {
  const data = new Uint8ClampedArray(SKIN_SIZE * SKIN_SIZE * 4);
  for (const [x0, y0, x1, y1] of BASE_OPAQUE_RECTS) {
    fillRect(data, x0, y0, x1 - x0, y1 - y0, { r: 245, g: 245, b: 245 });
  }
  return data;
}

/** Заливає основні грані класичної моделі. */
function paintCharacter(
  data: Uint8ClampedArray,
  colors: {
    head: Rgba;
    body: Rgba;
    arms: Rgba;
    legs: Rgba;
    accent?: Rgba;
  },
) {
  // Head box
  fillRect(data, 0, 0, 32, 16, colors.head);
  // Body + right arm + right leg row
  fillRect(data, 16, 16, 24, 16, colors.body); // body area incl top
  fillRect(data, 20, 20, 8, 12, colors.body);
  fillRect(data, 32, 20, 8, 12, colors.body);
  fillRect(data, 40, 16, 16, 16, colors.arms);
  fillRect(data, 0, 16, 16, 16, colors.legs);
  // Left arm / left leg (1.8+)
  fillRect(data, 32, 48, 16, 16, colors.arms);
  fillRect(data, 16, 48, 16, 16, colors.legs);
  // Face accent (eyes)
  if (colors.accent) {
    fillRect(data, 10, 12, 2, 2, colors.accent);
    fillRect(data, 14, 12, 2, 2, colors.accent);
  }
}

export type DemoSkinPreset = {
  title: string;
  model_type: "classic" | "slim";
  png_data: string;
};

function make(
  title: string,
  model_type: "classic" | "slim",
  paint: (data: Uint8ClampedArray) => void,
): DemoSkinPreset {
  const data = blankBase();
  paint(data);
  return { title, model_type, png_data: encodeRgba64ToDataUrl(data) };
}

/** 10 демо-скінів для галереї (валідні 64×64 PNG). */
export function buildDemoSkinPresets(): DemoSkinPreset[] {
  return [
    make("LC Білий макет", "classic", () => {
      /* blank */
    }),
    make("Смарагдовий вартовий", "classic", (d) =>
      paintCharacter(d, {
        head: { r: 40, g: 120, b: 70 },
        body: { r: 30, g: 90, b: 55 },
        arms: { r: 50, g: 140, b: 80 },
        legs: { r: 25, g: 70, b: 45 },
        accent: { r: 220, g: 240, b: 180 },
      }),
    ),
    make("Лавовий мандрівник", "classic", (d) =>
      paintCharacter(d, {
        head: { r: 40, g: 20, b: 20 },
        body: { r: 180, g: 60, b: 20 },
        arms: { r: 220, g: 90, b: 30 },
        legs: { r: 60, g: 30, b: 20 },
        accent: { r: 255, g: 200, b: 80 },
      }),
    ),
    make("Крижаний лицар", "classic", (d) =>
      paintCharacter(d, {
        head: { r: 180, g: 220, b: 240 },
        body: { r: 120, g: 170, b: 210 },
        arms: { r: 200, g: 230, b: 245 },
        legs: { r: 90, g: 130, b: 170 },
        accent: { r: 30, g: 60, b: 100 },
      }),
    ),
    make("Тіньовий лучник", "slim", (d) =>
      paintCharacter(d, {
        head: { r: 30, g: 30, b: 40 },
        body: { r: 50, g: 45, b: 70 },
        arms: { r: 70, g: 60, b: 90 },
        legs: { r: 25, g: 25, b: 35 },
        accent: { r: 160, g: 80, b: 220 },
      }),
    ),
    make("Сонячний фермер", "classic", (d) =>
      paintCharacter(d, {
        head: { r: 220, g: 180, b: 130 },
        body: { r: 70, g: 140, b: 60 },
        arms: { r: 220, g: 180, b: 130 },
        legs: { r: 60, g: 80, b: 140 },
        accent: { r: 40, g: 40, b: 40 },
      }),
    ),
    make("Пурпуровий маг", "slim", (d) =>
      paintCharacter(d, {
        head: { r: 90, g: 40, b: 130 },
        body: { r: 60, g: 20, b: 100 },
        arms: { r: 120, g: 60, b: 160 },
        legs: { r: 40, g: 15, b: 70 },
        accent: { r: 255, g: 210, b: 80 },
      }),
    ),
    make("Пустельний рейнджер", "classic", (d) =>
      paintCharacter(d, {
        head: { r: 210, g: 170, b: 110 },
        body: { r: 170, g: 130, b: 70 },
        arms: { r: 200, g: 160, b: 100 },
        legs: { r: 100, g: 80, b: 50 },
        accent: { r: 80, g: 50, b: 20 },
      }),
    ),
    make("Аква-дайвер", "classic", (d) =>
      paintCharacter(d, {
        head: { r: 30, g: 140, b: 180 },
        body: { r: 20, g: 100, b: 140 },
        arms: { r: 40, g: 170, b: 200 },
        legs: { r: 15, g: 70, b: 100 },
        accent: { r: 255, g: 255, b: 255 },
      }),
    ),
    make("Хронікер LC", "classic", (d) => {
      paintCharacter(d, {
        head: { r: 35, g: 45, b: 55 },
        body: { r: 180, g: 140, b: 50 },
        arms: { r: 50, g: 60, b: 70 },
        legs: { r: 30, g: 35, b: 45 },
        accent: { r: 255, g: 210, b: 80 },
      });
      // «LC» на грудях грубо
      fillRect(d, 22, 22, 2, 6, { r: 255, g: 230, b: 120 });
      fillRect(d, 24, 26, 2, 2, { r: 255, g: 230, b: 120 });
      fillRect(d, 26, 22, 2, 6, { r: 255, g: 230, b: 120 });
    }),
  ];
}
