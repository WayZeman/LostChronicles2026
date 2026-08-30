/**
 * Пінгує Minecraft-сервер (LcAnketa webhook), коли в черзі з'явилась робота LuckPerms.
 * Якщо MINECRAFT_ANKETA_WAKE_URL не задано — плагін покладається лише на fallback poll.
 */
export async function wakeMinecraftAnketaSync(reason = "job_queued"): Promise<void> {
  const url = process.env.MINECRAFT_ANKETA_WAKE_URL?.trim();
  if (!url) return;

  const secret =
    process.env.MINECRAFT_ANKETA_SYNC_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    "";
  if (!secret) {
    console.warn("[minecraft-anketa-wake] secret not configured");
    return;
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
      console.warn(
        "[minecraft-anketa-wake] server responded",
        res.status,
        await res.text().catch(() => ""),
      );
    }
  } catch (e) {
    console.warn("[minecraft-anketa-wake] request failed:", e);
  }
}
