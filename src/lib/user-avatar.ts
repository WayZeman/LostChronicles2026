import { discordCdnAvatarUrl } from "@/lib/discord-oauth";

/** Єдиний URL аватара для Discord / Google / fallback. */
export function resolveUserAvatarUrl(u: {
  username: string;
  avatar: string | null;
  discord_id: string | null;
}): string {
  const raw = u.avatar?.trim() ?? "";
  if (raw.startsWith("https://") || raw.startsWith("http://")) {
    return raw;
  }
  if (u.discord_id) {
    return discordCdnAvatarUrl({
      id: u.discord_id,
      username: u.username,
      avatar: raw || null,
    });
  }
  const initial = encodeURIComponent((u.username || "?").slice(0, 1).toUpperCase());
  return `https://ui-avatars.com/api/?name=${initial}&background=2a2f28&color=54c530&size=64&bold=true`;
}
