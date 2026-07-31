import { NextResponse } from "next/server";
import { getSessionUserIdFromCookies } from "@/lib/auth-session";
import {
  getProposalForUser,
  isProposalVotingOpen,
  listProposalVoters,
  setUserVote,
  userHasGameNickname,
} from "@/lib/proposals-queries";
import { resolveUserAvatarUrl } from "@/lib/user-avatar";

export const dynamic = "force-dynamic";

async function votersPayload(proposalId: number) {
  const rows = await listProposalVoters(proposalId);
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
  return { yes_voters, no_voters };
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id: raw } = await ctx.params;
  const id = Number(raw);
  if (!Number.isFinite(id) || id < 1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const v = (body as Record<string, unknown>).vote;
  if (v !== 0 && v !== 1) {
    return NextResponse.json(
      { error: "vote must be 0 (no) or 1 (yes)" },
      { status: 400 },
    );
  }

  try {
    const userId = await getSessionUserIdFromCookies();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await userHasGameNickname(userId))) {
      return NextResponse.json(
        {
          error: "Спочатку вкажи ігровий нікнейм у профілі.",
          code: "needs_nickname",
        },
        { status: 403 },
      );
    }

    const p = await getProposalForUser(id, userId);
    if (!p) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (!isProposalVotingOpen(p)) {
      return NextResponse.json(
        { error: "Voting is closed for this proposal" },
        { status: 403 },
      );
    }

    await setUserVote({ proposalId: id, userId, vote: v as 0 | 1 });
    const updated = await getProposalForUser(id, userId);
    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const voters = await votersPayload(id);

    return NextResponse.json({
      yes_votes: updated.yes_votes,
      no_votes: updated.no_votes,
      user_vote: updated.user_vote,
      ...voters,
    });
  } catch {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}
