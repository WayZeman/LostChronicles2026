/**
 * Статус Java-сервера через HTTPS (працює на Vercel тощо).
 * API: https://api.mcsrvstat.us — кеш ~1 хв, ми revalidate 45 с.
 */

export type JavaServerStatusSource = "api" | "api-offline" | "env-fallback";

export type JavaServerStatus = {
  host: string;
  /** null — невідомо (немає API і немає NEXT_PUBLIC_SERVER_ONLINE) */
  playersOnline: number | null;
  playersMax: number;
  playerNames: string[];
  source: JavaServerStatusSource;
};

function parseEnvOnline(raw: string | undefined): number | null {
  if (raw === undefined || raw === "") return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

function parseEnvMax(raw: string | undefined): number {
  if (raw === undefined || raw === "") return 80;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 80;
}

type McSrvPayload = {
  online?: boolean;
  players?: { online?: number; max?: number; list?: unknown };
};

function parsePlayerNames(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (typeof entry === "string") return entry.trim();
      if (
        entry &&
        typeof entry === "object" &&
        "name" in entry &&
        typeof (entry as { name?: unknown }).name === "string"
      ) {
        return (entry as { name: string }).name.trim();
      }
      return "";
    })
    .filter((name) => name.length > 0);
}

/**
 * Дозволяє лише типовий Minecraft host / IPv4 / host:port без шляхів і спецсимволів,
 * щоб значення з env не ламало URL до mcsrvstat.
 */
export function sanitizeMinecraftServerHost(raw: string): string {
  const host = raw.trim();
  if (!host || host.length > 253) return "";
  if (/[\s\0\u0001-\u001F/\\@#?&<>"`|]/.test(host)) return "";
  if (host.includes("..")) return "";
  return host;
}

export async function getJavaServerStatus(hostname: string): Promise<JavaServerStatus> {
  const envMax = parseEnvMax(process.env.NEXT_PUBLIC_SERVER_SLOTS_MAX?.trim());
  const envOnline = parseEnvOnline(process.env.NEXT_PUBLIC_SERVER_ONLINE?.trim());
  const host = sanitizeMinecraftServerHost(hostname);

  if (!host) {
    return {
      host,
      playersOnline: envOnline,
      playersMax: envMax,
      playerNames: [],
      source: "env-fallback",
    };
  }

  try {
    const url = `https://api.mcsrvstat.us/3/${encodeURIComponent(host)}`;
    const res = await fetch(url, {
      next: { revalidate: 45 },
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      return {
        host,
        playersOnline: envOnline,
        playersMax: envMax,
        playerNames: [],
        source: "env-fallback",
      };
    }

    const data = (await res.json()) as McSrvPayload;

    if (data.online === true && data.players && typeof data.players === "object") {
      const rawMax = data.players.max;
      const max =
        typeof rawMax === "number" && rawMax > 0 ? rawMax : envMax;
      const online =
        typeof data.players.online === "number" ? data.players.online : 0;
      return {
        host,
        playersOnline: online,
        playersMax: Math.max(max, online, 1),
        playerNames: parsePlayerNames(data.players.list),
        source: "api",
      };
    }

    return {
      host,
      playersOnline: 0,
      playersMax: envMax,
      playerNames: [],
      source: "api-offline",
    };
  } catch {
    return {
      host,
      playersOnline: envOnline,
      playersMax: envMax,
      playerNames: [],
      source: "env-fallback",
    };
  }
}
