import { NextResponse } from "next/server";

import { LC_MARKETING_HOST } from "@/lib/lc-domains";
import { getLcMarketingSiteUrl } from "@/lib/site-base-url";

export const dynamic = "force-dynamic";

const DB_PROBE_MS = 4000;

export async function GET() {
  const checks: Record<string, string> = {
    canonicalHost: LC_MARKETING_HOST,
    siteUrl: getLcMarketingSiteUrl(),
    database: "unknown",
  };

  if (!process.env.DATABASE_URL?.trim()) {
    checks.database = "not_configured";
    return NextResponse.json(
      { ok: false, checks },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const { getSql } = await import("@/lib/db");
    const probe = getSql()`SELECT 1 AS ok`;
    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("timeout")), DB_PROBE_MS);
    });
    const rows = (await Promise.race([probe, timeout])) as { ok: number }[];
    checks.database = rows[0]?.ok === 1 ? "ok" : "error";
  } catch {
    checks.database = "error";
  }

  const ok = checks.database === "ok";
  return NextResponse.json(
    { ok, checks },
    {
      status: ok ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
