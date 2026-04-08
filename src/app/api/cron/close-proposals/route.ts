import { NextResponse } from "next/server";
import { runExpireProposalsUpdate } from "@/lib/proposals-queries";

export const dynamic = "force-dynamic";

/**
 * Рекомендовано: Vercel Cron → POST /api/cron/close-proposals
 * Header: Authorization: Bearer {CRON_SECRET}
 *
 * Закриває прострочені пропозиції та надсилає сповіщення в Discord/Telegram
 * (те саме відбувається при відкритті списку/сторінки, якщо cron не налаштований).
 */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not set" }, { status: 501 });
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const closed = await runExpireProposalsUpdate();
    return NextResponse.json({ closed });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
