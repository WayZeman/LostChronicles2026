/** Стиснення зображення для збереження в БД (data URL). */

export async function compressImageFile(
  file: File,
  opts?: { maxEdge?: number; quality?: number; maxBytes?: number },
): Promise<string> {
  const maxEdge = opts?.maxEdge ?? 960;
  const quality = opts?.quality ?? 0.78;
  const maxBytes = opts?.maxBytes ?? 450_000;

  if (!file.type.startsWith("image/")) {
    throw new Error("Обери файл зображення.");
  }
  if (file.size > 12 * 1024 * 1024) {
    throw new Error("Файл занадто великий (макс. 12 МБ).");
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Не вдалося обробити зображення.");
  }
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  let q = quality;
  let dataUrl = canvas.toDataURL("image/jpeg", q);
  while (dataUrl.length > maxBytes && q > 0.45) {
    q -= 0.08;
    dataUrl = canvas.toDataURL("image/jpeg", q);
  }
  if (dataUrl.length > maxBytes) {
    throw new Error("Зображення все ще занадто велике після стиснення.");
  }
  return dataUrl;
}
