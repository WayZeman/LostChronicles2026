import { NextResponse } from "next/server";
import { getSessionUserIdFromCookies } from "@/lib/auth-session";
import {
  closeProposalByAuthor,
  getProposalForUser,
} from "@/lib/proposals-queries";
import {
  notifyProposalClosedDiscord,
  notifyProposalClosedTelegram,
} from "@/lib/notify-proposal";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id: raw } = await ctx.params;
  const id = Number(raw);
  if (!Number.isFinite(id) || id < 1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const userId = await getSessionUserIdFromCookies();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const closed = await closeProposalByAuthor(id, userId);
    if (!closed) {
      return NextResponse.json(
        {
          error:
            "Не вдалося закрити: ти не автор, голосування вже закрите або пропозиції не існує.",
        },
        { status: 403 },
      );
    }

    const p = await getProposalForUser(id, userId);
    if (p) {
      void Promise.all([
        notifyProposalClosedDiscord({
          title: p.title,
          proposalId: p.id,
          yes: p.yes_votes,
          no: p.no_votes,
        }),
        notifyProposalClosedTelegram({
          title: p.title,
          proposalId: p.id,
          yes: p.yes_votes,
          no: p.no_votes,
        }),
      ]).catch(() => {});
    }

    return NextResponse.json({ ok: true, status: "closed", voting_open: false });
  } catch {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}
