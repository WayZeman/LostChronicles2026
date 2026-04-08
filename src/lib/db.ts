import { neon } from "@neondatabase/serverless";

type NeonSql = ReturnType<typeof neon>;

let sql: NeonSql | undefined;

/**
 * Neon Postgres over HTTP — підходить для Vercel Serverless / Fluid compute.
 * У консолі Neon скопіюй `DATABASE_URL` (роль + connection string) і додай у Vercel → Environment Variables.
 */
export function getSql(): NeonSql {
  if (!sql) {
    const url = process.env.DATABASE_URL?.trim();
    if (!url) {
      throw new Error(
        "DATABASE_URL is not set. Add your Neon Postgres URL from console.neon.tech (Vercel integration sets this automatically).",
      );
    }
    sql = neon(url);
  }
  return sql;
}
