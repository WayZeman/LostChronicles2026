import { NextResponse } from "next/server";
import { getSessionUserIdFromCookies } from "@/lib/auth-session";
import { PROPOSAL_KIND_CHOICE } from "@/lib/proposal-kinds";
import {
  deleteProposalByAuthor,
  getProposalForUser,
  isProposalVotingOpen,
  listProposalVoters,
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
    const voters = await votersPayload(id, p.kind);
    return NextResponse.json({
      proposal: {
        id: p.id,
        title: p.title,
        description: p.description,
        kind: p.kind,
        status: p.status,
        created_at: p.created_at.toISOString(),
        ends_at: p.ends_at.toISOString(),
        author_username: p.author_username,
        yes_votes: p.yes_votes,
        no_votes: p.no_votes,
        total_votes: p.total_votes,
        user_vote: p.user_vote,
        user_option_id: p.user_option_id,
        options: p.options,
        voting_open: isProposalVotingOpen(p),
        is_author: userId != null && userId === p.user_id,
        ...voters,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}

export async function DELETE(
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

    const removed = await deleteProposalByAuthor(id, userId);
    if (!removed) {
      return NextResponse.json(
        { error: "Не знайдено або ти не автор цієї пропозиції." },
        { status: 403 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}
