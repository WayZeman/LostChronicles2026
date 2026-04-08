export function isProposalVotingOpenClient(
  status: string,
  endsAtIso: string,
): boolean {
  if (status !== "active") return false;
  return new Date(endsAtIso).getTime() > Date.now();
}

/** Локалізований зворотний відлік до кінця голосування. */
export function formatTimeRemainingUk(endsAtIso: string): string {
  const end = new Date(endsAtIso).getTime();
  const now = Date.now();
  const sec = Math.max(0, Math.floor((end - now) / 1000));
  if (sec === 0) return "завершено";
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (d > 0) return `залишилось: ${d} д. ${h} год.`;
  if (h > 0) return `залишилось: ${h} год. ${m} хв.`;
  return `залишилось: ${m} хв.`;
}
