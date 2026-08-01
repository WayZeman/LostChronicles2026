import { NextResponse } from "next/server";
import { getSessionUserIdFromCookies } from "@/lib/auth-session";
import {
  CHOICE_OPTION_LABEL_MAX,
  CHOICE_OPTIONS_MAX,
  CHOICE_OPTIONS_MIN,
  PROPOSAL_KIND_CHOICE,
  PROPOSAL_KIND_YES_NO,
  isProposalKind,
} from "@/lib/proposal-kinds";
import { userDisplayName } from "@/lib/game-nickname";
import {
  notifyProposalVotingOpenedDiscord,
  notifyProposalVotingOpenedTelegram,
} from "@/lib/notify-proposal";
import {
  createProposalRecord,
  getUserPublicById,
  listProposalsForUser,
  userHasGameNickname,
} from "@/lib/proposals-queries";

export const dynamic = "force-dynamic";

const DURATIONS = new Set([1, 3, 7]);

function serializeProposal(p: Awaited<ReturnType<typeof listProposalsForUser>>[number]) {
  return {
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
  };
}

export async function GET() {
  try {
    const userId = await getSessionUserIdFromCookies();
    const list = await listProposalsForUser(userId);
    return NextResponse.json({
      proposals: list.map(serializeProposal),
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
  const kindRaw = b.kind;
  const kind = isProposalKind(kindRaw) ? kindRaw : PROPOSAL_KIND_YES_NO;

  if (!title || title.length > 255) {
    return NextResponse.json({ error: "Invalid title" }, { status: 400 });
  }
  if (description.length > 20_000) {
    return NextResponse.json({ error: "Invalid description" }, { status: 400 });
  }
  if (kind === PROPOSAL_KIND_YES_NO && !description) {
    return NextResponse.json(
      { error: "Опис обовʼязковий для пропозиції За/Проти" },
      { status: 400 },
    );
  }
  if (!DURATIONS.has(durationDays)) {
    return NextResponse.json(
      { error: "durationDays must be 1, 3, or 7" },
      { status: 400 },
    );
  }

  let options: string[] | undefined;
  if (kind === PROPOSAL_KIND_CHOICE) {
    const raw = Array.isArray(b.options) ? b.options : [];
    options = raw
      .map((o) => (typeof o === "string" ? o.trim() : ""))
      .filter(Boolean);
    if (
      options.length < CHOICE_OPTIONS_MIN ||
      options.length > CHOICE_OPTIONS_MAX
    ) {
      return NextResponse.json(
        {
          error: `Потрібно від ${CHOICE_OPTIONS_MIN} до ${CHOICE_OPTIONS_MAX} варіантів`,
        },
        { status: 400 },
      );
    }
    if (options.some((o) => o.length > CHOICE_OPTION_LABEL_MAX)) {
      return NextResponse.json(
        { error: `Варіант максимум ${CHOICE_OPTION_LABEL_MAX} символів` },
        { status: 400 },
      );
    }
    const unique = new Set(options.map((o) => o.toLocaleLowerCase("uk-UA")));
    if (unique.size !== options.length) {
      return NextResponse.json(
        { error: "Варіанти не повинні повторюватись" },
        { status: 400 },
      );
    }
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

    const endsAt = new Date();
    endsAt.setUTCDate(endsAt.getUTCDate() + durationDays);

    const proposalId = await createProposalRecord({
      userId,
      title,
      description: description,
      endsAt,
      kind,
      options,
    });

    const author = await getUserPublicById(userId);
    const authorUsername = author ? userDisplayName(author) : "Unknown";

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
