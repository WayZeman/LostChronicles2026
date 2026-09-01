import { NextResponse } from "next/server";
import { runExpireProposalsUpdate } from "@/lib/proposals-queries";
import { authorizeCronRequest } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";

/**
 * Vercel Cron → GET/POST /api/cron/close-proposals
 * Header: Authorization: Bearer {CRON_SECRET}
 */
export async function GET(req: Request) {
  const denied = authorizeCronRequest(req);
  if (denied) return denied;
  try {
    const result = await runExpireProposalsUpdate();
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const denied = authorizeCronRequest(req);
  if (denied) return denied;
  try {
    const result = await runExpireProposalsUpdate();
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
