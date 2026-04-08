import { NextResponse } from "next/server";
import { getSessionUserIdFromCookies } from "@/lib/auth-session";
import { getProposalForUser, isProposalVotingOpen } from "@/lib/proposals-queries";

export const dynamic = "force-dynamic";

export async function GET(
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
    const p = await getProposalForUser(id, userId);
    if (!p) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({
      proposal: {
        id: p.id,
        title: p.title,
        description: p.description,
        status: p.status,
        created_at: p.created_at.toISOString(),
        ends_at: p.ends_at.toISOString(),
        author_username: p.author_username,
        yes_votes: p.yes_votes,
        no_votes: p.no_votes,
        user_vote: p.user_vote,
        voting_open: isProposalVotingOpen(p),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}
