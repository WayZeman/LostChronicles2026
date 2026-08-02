/** Стиснення зображення перед завантаженням (data URL → /api/admin/media). */

export async function compressImageFile(
  file: File,
  opts?: { maxEdge?: number; quality?: number; maxBytes?: number },
): Promise<string> {
  const maxEdge = opts?.maxEdge ?? 960;
  const quality = opts?.quality ?? 0.78;
  /** Окреме завантаження в /api/admin/media — тримаємо розумний розмір на фото. */
  const maxBytes = opts?.maxBytes ?? 220_000;

  if (!file.type.startsWith("image/")) {
    throw new Error("Обери файл зображення.");
  }
  if (file.size > 12 * 1024 * 1024) {
    throw new Error("Файл занадто великий (макс. 12 МБ).");
  }

  const bitmap = await createImageBitmap(file);
  try {
    let edge = maxEdge;
    let q = quality;

    for (let attempt = 0; attempt < 4; attempt++) {
      const scale = Math.min(1, edge / Math.max(bitmap.width, bitmap.height));
      const w = Math.max(1, Math.round(bitmap.width * scale));
      const h = Math.max(1, Math.round(bitmap.height * scale));

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Не вдалося обробити зображення.");
      }
      ctx.drawImage(bitmap, 0, 0, w, h);

      let dataUrl = canvas.toDataURL("image/jpeg", q);
      while (dataUrl.length > maxBytes && q > 0.4) {
        q -= 0.08;
        dataUrl = canvas.toDataURL("image/jpeg", q);
      }
      if (dataUrl.length <= maxBytes) {
        return dataUrl;
      }
      edge = Math.round(edge * 0.72);
      q = Math.max(0.4, quality - 0.1 * (attempt + 1));
    }

    throw new Error("Зображення все ще занадто велике після стиснення.");
  } finally {
    bitmap.close();
  }
}
