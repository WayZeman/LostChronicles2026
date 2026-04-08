import { NextResponse } from "next/server";
import {
  listProposalsDueForClosing,
  runExpireProposalsUpdate,
} from "@/lib/proposals-queries";
import {
  notifyProposalClosedDiscord,
  notifyProposalClosedTelegram,
} from "@/lib/notify-proposal";

export const dynamic = "force-dynamic";

/**
 * Optional: call from hosting cron (e.g. Vercel Cron) with header:
 *   Authorization: Bearer YOUR_CRON_SECRET
 * Sends Discord/Telegram summary when proposals expire.
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
    const due = await listProposalsDueForClosing();
    await runExpireProposalsUpdate();
    for (const row of due) {
      await Promise.all([
        notifyProposalClosedDiscord({
          title: row.title,
          proposalId: row.id,
          yes: row.yes_votes,
          no: row.no_votes,
        }),
        notifyProposalClosedTelegram({
          title: row.title,
          proposalId: row.id,
          yes: row.yes_votes,
          no: row.no_votes,
        }),
      ]);
    }
    return NextResponse.json({ closed: due.length });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
