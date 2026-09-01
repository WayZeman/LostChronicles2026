import { isSuperAdminNick } from "@/lib/admin-role";

/** Minecraft-подібний нік: 3–16 символів, латиниця/цифри/_ */
const NICK_RE = /^[A-Za-z0-9_]{3,16}$/;

export function normalizeGameNickname(raw: string): string {
  return raw.trim();
}

export function isValidGameNickname(raw: string): boolean {
  return NICK_RE.test(normalizeGameNickname(raw));
}

export function isReservedGameNickname(raw: string): boolean {
  return isSuperAdminNick(normalizeGameNickname(raw));
}

export function gameNicknameError(raw: string): string | null {
  const n = normalizeGameNickname(raw);
  if (!n) return "Вкажи ігровий нікнейм.";
  if (n.length < 3) return "Мінімум 3 символи.";
  if (n.length > 16) return "Максимум 16 символів.";
  if (!NICK_RE.test(n)) {
    return "Лише латинські літери, цифри та _.";
  }
  if (isReservedGameNickname(n)) {
    return "Цей нікнейм зарезервований.";
  }
  return null;
}

export function userDisplayName(u: {
  game_nickname?: string | null;
  username: string;
}): string {
  const nick = u.game_nickname?.trim();
  if (nick) return nick;
  return u.username;
}
