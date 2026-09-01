import { NextResponse } from "next/server";
import { getSessionUserIdFromCookies } from "@/lib/auth-session";
import { PROPOSAL_KIND_CHOICE } from "@/lib/proposal-kinds";
import {
  getProposalForUser,
  isProposalVotingOpen,
  listProposalVoters,
  syncExpiredProposalsOnRead,
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
    await syncExpiredProposalsOnRead();
    const p = await getProposalForUser(id, userId);
    if (!p) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const rows = await listProposalVoters(id);
    let yes_voters: ReturnType<typeof voterDto>[] = [];
    let no_voters: ReturnType<typeof voterDto>[] = [];
    const option_voters: Record<string, ReturnType<typeof voterDto>[]> = {};

    if (p.kind === PROPOSAL_KIND_CHOICE) {
      for (const r of rows) {
        if (r.option_id == null) continue;
        const key = String(r.option_id);
        if (!option_voters[key]) option_voters[key] = [];
        option_voters[key].push(voterDto(r));
      }
    } else {
      for (const r of rows) {
        if (r.vote === 1) yes_voters.push(voterDto(r));
        else no_voters.push(voterDto(r));
      }
    }

    return NextResponse.json({
      status: p.status,
      kind: p.kind,
      yes_votes: p.yes_votes,
      no_votes: p.no_votes,
      total_votes: p.total_votes,
      user_vote: p.user_vote,
      user_option_id: p.user_option_id,
      options: p.options,
      voting_open: isProposalVotingOpen(p),
      ends_at: p.ends_at.toISOString(),
      yes_voters,
      no_voters,
      option_voters,
    });
  } catch {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}
