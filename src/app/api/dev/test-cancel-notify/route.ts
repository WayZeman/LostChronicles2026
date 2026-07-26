import { NextResponse } from "next/server";
import {
  notifyProposalClosedDiscord,
  notifyProposalClosedTelegram,
} from "@/lib/notify-proposal";

export const dynamic = "force-dynamic";

/** Тимчасовий тест сповіщення про скасування. Видалити після перевірки. */
const TEST_KEY = "lc-test-cancel-20260726";

export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("k");
  if (key !== TEST_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const title = "[ТЕСТ] Скасування через низьку явку";
  const proposalId = 0;
  const yes = 2;
  const no = 1;
  const status = "cancelled";

  try {
    await Promise.all([
      notifyProposalClosedDiscord({
        title,
        proposalId,
        yes,
        no,
        status,
      }),
      notifyProposalClosedTelegram({
        title,
        proposalId,
        yes,
        no,
        status,
      }),
    ]);
    return NextResponse.json({ ok: true, sent: ["discord", "telegram"] });
  } catch {
    return NextResponse.json({ error: "Send failed" }, { status: 500 });
  }
}
