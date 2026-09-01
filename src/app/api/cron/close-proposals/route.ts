import { NextResponse } from "next/server";
import { runExpireProposalsUpdate } from "@/lib/proposals-queries";

export const dynamic = "force-dynamic";

/**
 * Рекомендовано: Vercel Cron → GET /api/cron/close-proposals
 * Header: Authorization: Bearer {CRON_SECRET}
 *
 * Закриває прострочені пропозиції, надсилає нагадування «за годину до кінця»
 * та фінальні результати в Discord/Telegram
 * (те саме відбувається при відкритті списку/сторінки, якщо cron не налаштований).
 */
function authorizeCron(req: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not set" }, { status: 501 });
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

async function handleCron() {
  try {
    const result = await runExpireProposalsUpdate();
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const denied = authorizeCron(req);
  if (denied) return denied;
  return handleCron();
}

export async function POST(req: Request) {
  const denied = authorizeCron(req);
  if (denied) return denied;
  return handleCron();
}
