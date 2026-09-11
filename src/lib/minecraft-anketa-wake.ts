export type MinecraftWakeResult = {
  ok: boolean;
  skipped?: "no_url" | "no_secret";
  status?: number;
  error?: string;
};

/**
 * Пінгує Minecraft-сервер (LcAnketa webhook), коли в черзі з'явилась робота LuckPerms
 * або коли в Telegram дали /restart yes.
 * Якщо MINECRAFT_ANKETA_WAKE_URL не задано — плагін покладається лише на fallback poll.
 */
export async function wakeMinecraftAnketaSync(
  reason = "job_queued",
): Promise<MinecraftWakeResult> {
  const url = process.env.MINECRAFT_ANKETA_WAKE_URL?.trim();
  if (!url) return { ok: false, skipped: "no_url" };

  const secret =
    process.env.MINECRAFT_ANKETA_SYNC_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    "";
  if (!secret) {
    console.warn("[minecraft-anketa-wake] secret not configured");
    return { ok: false, skipped: "no_secret" };
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reason }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn("[minecraft-anketa-wake] server responded", res.status, text);
      return { ok: false, status: res.status, error: text.slice(0, 200) };
    }
    return { ok: true, status: res.status };
  } catch (e) {
    console.warn("[minecraft-anketa-wake] request failed:", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
