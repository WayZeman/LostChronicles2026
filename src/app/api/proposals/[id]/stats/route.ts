import { NextResponse } from "next/server";
import { getSessionUserIdFromCookies } from "@/lib/auth-session";
import {
  getProposalForUser,
  isProposalVotingOpen,
  listProposalVoters,
} from "@/lib/proposals-queries";
import { resolveUserAvatarUrl } from "@/lib/user-avatar";

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

    const rows = await listProposalVoters(id);
    const yes_voters: {
      id: number;
      displayName: string;
      avatarUrl: string;
    }[] = [];
    const no_voters: {
      id: number;
      displayName: string;
      avatarUrl: string;
    }[] = [];
    for (const r of rows) {
      const voter = {
        id: r.user_id,
        displayName: r.display_name,
        avatarUrl: resolveUserAvatarUrl({
          username: r.display_name,
          avatar: r.avatar,
          discord_id: r.discord_id,
          custom_avatar: r.custom_avatar,
        }),
      };
      if (r.vote === 1) yes_voters.push(voter);
      else no_voters.push(voter);
    }

    return NextResponse.json({
      status: p.status,
      yes_votes: p.yes_votes,
      no_votes: p.no_votes,
      user_vote: p.user_vote,
      voting_open: isProposalVotingOpen(p),
      ends_at: p.ends_at.toISOString(),
      yes_voters,
      no_voters,
    });
  } catch {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}
