/** PostgreSQL: relation does not exist */
const PG_UNDEFINED_TABLE = "42P01";

export function isMissingRelationError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const o = err as { code?: string; message?: string };
  if (o.code === PG_UNDEFINED_TABLE) return true;
  const m = o.message;
  if (typeof m === "string" && /does not exist|не існує/i.test(m)) {
    return /proposal_comments|relation/i.test(m);
  }
  return false;
}

export function publicDbErrorMessage(err: unknown): string {
  if (isMissingRelationError(err)) {
    return "Коментарі: у базі немає таблиці. У Neon → SQL Editor виконай скрипт db/migrations/001_proposal_comments.sql";
  }
  return "Database unavailable";
}
