import { deflateSync, inflateSync } from "zlib";

/** Мінімальний PNG codec для валідних Minecraft-скінів 64×64 RGBA. */

const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]!) & 0xff]! ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

/** RGBA 64×64 → PNG Buffer (8-bit, color type 6). */
export function encodeRgba64ToPng(rgba: Uint8Array | Uint8ClampedArray): Buffer {
  if (rgba.length !== 64 * 64 * 4) {
    throw new Error("Очікується RGBA 64×64");
  }
  const raw = Buffer.alloc((64 * 4 + 1) * 64);
  for (let y = 0; y < 64; y++) {
    const rowStart = y * (64 * 4 + 1);
    raw[rowStart] = 0; // filter None
    const src = y * 64 * 4;
    for (let i = 0; i < 64 * 4; i++) {
      raw[rowStart + 1 + i] = rgba[src + i]!;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(64, 0);
  ihdr.writeUInt32BE(64, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    PNG_SIG,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

export function encodeRgba64ToDataUrl(
  rgba: Uint8Array | Uint8ClampedArray,
): string {
  const png = encodeRgba64ToPng(rgba);
  return `data:image/png;base64,${png.toString("base64")}`;
}

export type PngMeta = { width: number; height: number; colorType: number };

/** Читає IHDR; кидає якщо не PNG. */
export function readPngMeta(buf: Buffer): PngMeta {
  if (buf.length < 33 || !buf.subarray(0, 8).equals(PNG_SIG)) {
    throw new Error("Це не PNG");
  }
  const length = buf.readUInt32BE(8);
  const type = buf.subarray(12, 16).toString("ascii");
  if (type !== "IHDR" || length !== 13) {
    throw new Error("Пошкоджений PNG (IHDR)");
  }
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
    colorType: buf[25]!,
  };
}

/** Декодує 64×64 8-bit RGBA PNG у плоский буфер (для seed/валідації). */
export function decodePngToRgba64(buf: Buffer): Uint8ClampedArray {
  const meta = readPngMeta(buf);
  if (meta.width !== 64 || meta.height !== 64) {
    throw new Error(`Потрібен PNG 64×64, зараз ${meta.width}×${meta.height}`);
  }
  if (meta.colorType !== 6 && meta.colorType !== 2) {
    throw new Error("Підтримується лише RGB/RGBA PNG");
  }

  const parts: Buffer[] = [];
  let offset = 8;
  while (offset + 12 <= buf.length) {
    const len = buf.readUInt32BE(offset);
    const type = buf.subarray(offset + 4, offset + 8).toString("ascii");
    const data = buf.subarray(offset + 8, offset + 8 + len);
    if (type === "IDAT") parts.push(data);
    if (type === "IEND") break;
    offset += 12 + len;
  }
  if (!parts.length) throw new Error("PNG без IDAT");

  const inflated = inflateSync(Buffer.concat(parts));
  const bpp = meta.colorType === 6 ? 4 : 3;
  const stride = 64 * bpp + 1;
  if (inflated.length < stride * 64) {
    throw new Error("Пошкоджені пікселі PNG");
  }

  const out = new Uint8ClampedArray(64 * 64 * 4);
  for (let y = 0; y < 64; y++) {
    const row = y * stride;
    if (inflated[row] !== 0) {
      // спрощений декодер: лише filter 0 (None) — наші файли такі
      throw new Error("Непідтримуваний PNG filter");
    }
    for (let x = 0; x < 64; x++) {
      const si = row + 1 + x * bpp;
      const di = (y * 64 + x) * 4;
      out[di] = inflated[si]!;
      out[di + 1] = inflated[si + 1]!;
      out[di + 2] = inflated[si + 2]!;
      out[di + 3] = bpp === 4 ? inflated[si + 3]! : 255;
    }
  }
  return out;
}

const DATA_URL_RE = /^data:image\/png;base64,([A-Za-z0-9+/=\s]+)$/i;

/**
 * Перевіряє data URL скіна: PNG 64×64.
 * Повертає нормалізований data URL (без пробілів у base64).
 */
export function validateMinecraftSkinDataUrl(dataUrl: string): string {
  const m = dataUrl.trim().match(DATA_URL_RE);
  if (!m) throw new Error("Потрібен PNG (data:image/png;base64,...)");
  const b64 = m[1]!.replace(/\s+/g, "");
  if (b64.length > 200_000) throw new Error("Файл скіна занадто великий");
  const buf = Buffer.from(b64, "base64");
  const meta = readPngMeta(buf);
  if (meta.width !== 64 || meta.height !== 64) {
    throw new Error(`Скін має бути 64×64 px (зараз ${meta.width}×${meta.height})`);
  }
  return `data:image/png;base64,${b64}`;
}
