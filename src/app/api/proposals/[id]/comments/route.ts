import { NextResponse } from "next/server";
import { getSessionUserIdFromCookies } from "@/lib/auth-session";
import { discordCdnAvatarUrl } from "@/lib/discord-oauth";
import {
  addProposalComment,
  listProposalComments,
} from "@/lib/proposals-queries";

export const dynamic = "force-dynamic";

const MAX_COMMENT_LEN = 2000;

function mapCommentToJson(row: {
  id: number;
  user_id: number;
  body: string;
  created_at: Date;
  author_username: string;
  author_avatar: string | null;
  author_discord_id: string;
}) {
  const avatarUrl = discordCdnAvatarUrl({
    id: row.author_discord_id,
    username: row.author_username,
    avatar: row.author_avatar,
  });
  return {
    id: row.id,
    user_id: row.user_id,
    body: row.body,
    created_at: row.created_at.toISOString(),
    author_username: row.author_username,
    avatarUrl,
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
    const rows = await listProposalComments(id);
    return NextResponse.json({
      comments: rows.map((r) => mapCommentToJson(r)),
    });
  } catch {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
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

  const userId = await getSessionUserIdFromCookies();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let bodyText: string;
  try {
    const json = (await req.json()) as { body?: unknown };
    bodyText = typeof json.body === "string" ? json.body : "";
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const trimmed = bodyText.trim();
  if (trimmed.length === 0) {
    return NextResponse.json(
      { error: "Коментар не може бути порожнім." },
      { status: 400 },
    );
  }
  if (trimmed.length > MAX_COMMENT_LEN) {
    return NextResponse.json(
      { error: `Максимум ${MAX_COMMENT_LEN} символів.` },
      { status: 400 },
    );
  }

  try {
    const row = await addProposalComment({
      proposalId: id,
      userId,
      body: trimmed,
    });
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ comment: mapCommentToJson(row) });
  } catch {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}
