/** Рішення по анкеті vs факт у LuckPerms. */
export type ApplicationServerStatus = "pending" | "accepted" | "rejected";

/** Підтвердження з Minecraft-плагіна. */
export type ApplicationIngameRank = "promoted" | "demoted" | "failed" | null;

export function normalizeIngameRank(raw: unknown): ApplicationIngameRank {
  const s = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (s === "promoted" || s === "demoted" || s === "failed") return s;
  return null;
}

/** «На сервері» лише після підтвердження плагіна. */
export function applicationServerStatusLabelUk(
  status: ApplicationServerStatus,
  ingameRank: ApplicationIngameRank = null,
): string {
  if (status === "accepted") {
    if (ingameRank === "promoted") return "На сервері";
    if (ingameRank === "failed") return "Не вдалося додати на сервер";
    return "Прийнято, очікує сервер";
  }
  if (status === "rejected") {
    if (ingameRank === "promoted") return "Знімаю з сервера";
    if (ingameRank === "demoted") return "Не прийнято (знято ранг)";
    return "Не прийнято";
  }
  return "Очікує рішення";
}

export function applicationServerStatusEmoji(
  status: ApplicationServerStatus,
  ingameRank: ApplicationIngameRank = null,
): string {
  if (status === "accepted") {
    if (ingameRank === "promoted") return "✅";
    if (ingameRank === "failed") return "⚠️";
    return "⏳";
  }
  if (status === "rejected") {
    if (ingameRank === "promoted") return "⏳";
    return "❌";
  }
  return "⏳";
}
