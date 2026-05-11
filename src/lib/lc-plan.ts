const DEFAULT_PLAN_BASE = "http://dragonseven.top:25551";
const DEFAULT_SERVER_QUERY = "Lost Chronicles Vanila";

const REVALIDATE_SEC = 120;

export function getLcPlanBaseUrl(): string {
  return process.env.LC_PLAN_BASE_URL?.trim() || DEFAULT_PLAN_BASE;
}

/** Значення параметра `server=` у Plan API (назва сервера в Plan). */
export function getLcPlanServerQuery(): string {
  return process.env.LC_PLAN_SERVER_NAME?.trim() || DEFAULT_SERVER_QUERY;
}

export function getLcPlanPanelServerUrl(): string {
  const base = getLcPlanBaseUrl().replace(/\/$/, "");
  const name = getLcPlanServerQuery();
  return `${base}/server/${encodeURIComponent(name)}`;
}

function formatPlanUrl(path: string): string {
  const base = getLcPlanBaseUrl().replace(/\/$/, "");
  const u = new URL(path, base);
  u.searchParams.set("server", getLcPlanServerQuery());
  return u.toString();
}

async function planGetJson<T>(path: string): Promise<T | null> {
  const url = formatPlanUrl(path);
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: REVALIDATE_SEC },
    });
    if (!res.ok) {
      console.warn("[lc-plan]", path, "HTTP", res.status, getLcPlanBaseUrl());
      return null;
    }
    return (await res.json()) as T;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn("[lc-plan]", path, "fetch error:", msg, getLcPlanBaseUrl());
    return null;
  }
}

/** GET JSON з Plan (`server=` додається до шляху на кшталт `/v1/serverOverview`). */
export async function planFetchJson<T>(path: string): Promise<T | null> {
  return planGetJson<T>(path);
}
