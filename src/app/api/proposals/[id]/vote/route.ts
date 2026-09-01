import { NextResponse } from "next/server";
import { getSessionUserIdFromCookies } from "@/lib/auth-session";
import { PROPOSAL_KIND_CHOICE } from "@/lib/proposal-kinds";
import {
  getProposalForUser,
  isProposalVotingOpen,
  listProposalVoters,
  setUserChoiceVote,
  setUserVote,
  syncExpiredProposalsOnRead,
  userHasGameNickname,
} from "@/lib/proposals-queries";
import { resolveUserAvatarUrl } from "@/lib/user-avatar";

export const dynamic = "force-dynamic";

function voterDto(r: Awaited<ReturnType<typeof listProposalVoters>>[number]) {
  return {
    id: r.user_id,
    displayName: r.display_name,
    avatarUrl: resolveUserAvatarUrl({
      username: r.display_name,
      avatar: r.avatar,
      discord_id: r.discord_id,
      custom_avatar: r.custom_avatar,
    }),
  };
}

async function votersPayload(proposalId: number, kind: string) {
  const rows = await listProposalVoters(proposalId);
  if (kind === PROPOSAL_KIND_CHOICE) {
    const byOption: Record<
      string,
      { id: number; displayName: string; avatarUrl: string }[]
    > = {};
    for (const r of rows) {
      if (r.option_id == null) continue;
      const key = String(r.option_id);
      if (!byOption[key]) byOption[key] = [];
      byOption[key].push(voterDto(r));
    }
    return { option_voters: byOption, yes_voters: [], no_voters: [] };
  }
  const yes_voters: ReturnType<typeof voterDto>[] = [];
  const no_voters: ReturnType<typeof voterDto>[] = [];
  for (const r of rows) {
    if (r.vote === 1) yes_voters.push(voterDto(r));
    else no_voters.push(voterDto(r));
  }
  return { yes_voters, no_voters, option_voters: {} };
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
  const b = body as Record<string, unknown>;

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

    await syncExpiredProposalsOnRead();
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

    if (p.kind === PROPOSAL_KIND_CHOICE) {
      const optionId = Number(b.optionId);
      if (!Number.isFinite(optionId) || optionId < 1) {
        return NextResponse.json(
          { error: "optionId is required" },
          { status: 400 },
        );
      }
      const ok = await setUserChoiceVote({
        proposalId: id,
        userId,
        optionId,
      });
      if (!ok) {
        return NextResponse.json(
          { error: "Unknown option" },
          { status: 400 },
        );
      }
    } else {
      const v = b.vote;
      if (v !== 0 && v !== 1) {
        return NextResponse.json(
          { error: "vote must be 0 (no) or 1 (yes)" },
          { status: 400 },
        );
      }
      await setUserVote({ proposalId: id, userId, vote: v as 0 | 1 });
    }

    const updated = await getProposalForUser(id, userId);
    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const voters = await votersPayload(id, updated.kind);

    return NextResponse.json({
      kind: updated.kind,
      yes_votes: updated.yes_votes,
      no_votes: updated.no_votes,
      total_votes: updated.total_votes,
      user_vote: updated.user_vote,
      user_option_id: updated.user_option_id,
      options: updated.options,
      ...voters,
    });
  } catch {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}
