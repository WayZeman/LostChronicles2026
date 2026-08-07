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

    const p = await getProposalForUser(id, userId, { skipLifecycleSync: true });
    if (p) {
      const summary =
        p.kind === "choice"
          ? (() => {
              const max = p.options.length
                ? Math.max(0, ...p.options.map((o) => o.votes))
                : 0;
              const leaders = p.options.filter((o) => o.votes === max && max > 0);
              if (leaders.length === 0) return "Без голосів";
              if (leaders.length > 1)
                return `Нічия: ${leaders.map((o) => o.label).join(", ")}`;
              return `Переміг варіант «${leaders[0]!.label}» (${leaders[0]!.votes})`;
            })()
          : undefined;
      // Await: інакше Vercel може обірвати вебхуки після відповіді.
      try {
        await Promise.all([
          notifyProposalClosedDiscord({
            title: p.title,
            proposalId: p.id,
            yes: p.yes_votes,
            no: p.no_votes,
            status: p.status,
            summary,
            totalVotes: p.total_votes,
          }),
          notifyProposalClosedTelegram({
            title: p.title,
            proposalId: p.id,
            yes: p.yes_votes,
            no: p.no_votes,
            status: p.status,
            summary,
            totalVotes: p.total_votes,
          }),
        ]);
      } catch (e) {
        console.error("[proposals] close notify failed:", e);
      }
    }

    return NextResponse.json({ ok: true, status: "closed", voting_open: false });
  } catch {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}
