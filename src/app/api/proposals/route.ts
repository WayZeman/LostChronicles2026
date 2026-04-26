import { NextResponse } from "next/server";
import { getSessionUserIdFromCookies } from "@/lib/auth-session";
import {
  createProposalRecord,
  getUserPublicById,
  listProposalsForUser,
} from "@/lib/proposals-queries";
import {
  notifyProposalVotingOpenedDiscord,
  notifyProposalVotingOpenedTelegram,
} from "@/lib/notify-proposal";

export const dynamic = "force-dynamic";

const DURATIONS = new Set([1, 3, 7]);

export async function GET() {
  try {
    const userId = await getSessionUserIdFromCookies();
    const list = await listProposalsForUser(userId);
    return NextResponse.json({
      proposals: list.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        status: p.status,
        created_at: p.created_at.toISOString(),
        ends_at: p.ends_at.toISOString(),
        author_username: p.author_username,
        anonymous_voting: p.anonymous_voting,
        yes_votes: p.yes_votes,
        no_votes: p.no_votes,
        user_vote: p.user_vote,
      })),
    });
  } catch {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const title = typeof b.title === "string" ? b.title.trim() : "";
  const description =
    typeof b.description === "string" ? b.description.trim() : "";
  const durationDays = Number(b.durationDays);
  const anonymousVoting = b.anonymousVoting === true;

  if (!title || title.length > 255) {
    return NextResponse.json({ error: "Invalid title" }, { status: 400 });
  }
  if (!description || description.length > 20_000) {
    return NextResponse.json({ error: "Invalid description" }, { status: 400 });
  }
  if (!DURATIONS.has(durationDays)) {
    return NextResponse.json(
      { error: "durationDays must be 1, 3, or 7" },
      { status: 400 },
    );
  }

  try {
    const userId = await getSessionUserIdFromCookies();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const endsAt = new Date();
    endsAt.setUTCDate(endsAt.getUTCDate() + durationDays);

    const proposalId = await createProposalRecord({
      userId,
      title,
      description,
      endsAt,
      anonymousVoting,
    });

    const author = await getUserPublicById(userId);
    const authorUsername = author?.username ?? "Unknown";

    await Promise.all([
      notifyProposalVotingOpenedDiscord({
        authorUsername,
        title,
        proposalId,
      }),
      notifyProposalVotingOpenedTelegram({
        title,
        proposalId,
        authorUsername,
      }),
    ]);

    return NextResponse.json({ id: proposalId }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create proposal" },
      { status: 503 },
    );
  }
}
