import { LC_MARKETING_HOST, LC_MARKETING_SITE_ORIGIN } from "@/lib/lc-domains";

/** Публічний ключ IndexNow (файл `{key}.txt` у `public/`). */
export const LC_INDEXNOW_KEY = "59db5735f20ac7cc229a82c548820bf8";

export function lcIndexNowKeyPath(): string {
  return `/${LC_INDEXNOW_KEY}.txt`;
}

export function lcIndexNowKeyLocation(): string {
  return `${LC_MARKETING_SITE_ORIGIN}${lcIndexNowKeyPath()}`;
}

const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
/** Ліміт IndexNow на один POST (офіційно до 10 000). */
export const LC_INDEXNOW_BATCH_SIZE = 1000;

/** Повідомляє Bing / Yandex / IndexNow-партнерів про оновлені URL. */
export async function pingLcIndexNow(
  urls: string[],
): Promise<{ ok: boolean; status: number }> {
  const unique = [...new Set(urls.filter((u) => u.startsWith("https://")))].slice(
    0,
    10_000,
  );
  if (unique.length === 0) {
    return { ok: false, status: 0 };
  }

  const res = await fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: LC_MARKETING_HOST,
      key: LC_INDEXNOW_KEY,
      keyLocation: lcIndexNowKeyLocation(),
      urlList: unique,
    }),
  });

  return { ok: res.ok || res.status === 202, status: res.status };
}

/** Великі sitemap — кілька POST підряд. */
export async function pingLcIndexNowBatched(
  urls: string[],
): Promise<{ ok: boolean; batches: number; statuses: number[] }> {
  const unique = [...new Set(urls.filter((u) => u.startsWith("https://")))];
  if (unique.length === 0) {
    return { ok: false, batches: 0, statuses: [] };
  }

  const statuses: number[] = [];
  for (let i = 0; i < unique.length; i += LC_INDEXNOW_BATCH_SIZE) {
    const chunk = unique.slice(i, i + LC_INDEXNOW_BATCH_SIZE);
    const result = await pingLcIndexNow(chunk);
    statuses.push(result.status);
    if (!result.ok && result.status !== 202) {
      return { ok: false, batches: statuses.length, statuses };
    }
  }

  return { ok: true, batches: statuses.length, statuses };
}
