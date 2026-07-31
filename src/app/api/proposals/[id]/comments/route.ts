import { NextResponse } from "next/server";
import { getSessionUserIdFromCookies } from "@/lib/auth-session";
import { publicDbErrorMessage } from "@/lib/db-errors";
import {
  addProposalComment,
  listProposalComments,
} from "@/lib/proposals-queries";
import { resolveUserAvatarUrl } from "@/lib/user-avatar";

export const dynamic = "force-dynamic";

const MAX_COMMENT_LEN = 2000;

function mapCommentToJson(row: {
  id: number;
  user_id: number;
  parent_id: number | null;
  body: string;
  created_at: Date;
  author_username: string;
  author_avatar: string | null;
  author_custom_avatar: string | null;
  author_discord_id: string | null;
}) {
  const avatarUrl = resolveUserAvatarUrl({
    username: row.author_username,
    avatar: row.author_avatar,
    discord_id: row.author_discord_id,
    custom_avatar: row.author_custom_avatar,
  });
  return {
    id: row.id,
    user_id: row.user_id,
    parent_id: row.parent_id,
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
  } catch (err) {
    return NextResponse.json(
      { error: publicDbErrorMessage(err) },
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
  let parentId: number | null = null;
  try {
    const json = (await req.json()) as {
      body?: unknown;
      parentId?: unknown;
    };
    bodyText = typeof json.body === "string" ? json.body : "";
    if (typeof json.parentId === "number" && Number.isFinite(json.parentId)) {
      parentId = Math.trunc(json.parentId);
    } else if (
      typeof json.parentId === "string" &&
      /^\d+$/.test(json.parentId.trim())
    ) {
      parentId = Number(json.parentId.trim());
    }
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
      parentId,
    });
    if (!row) {
      return NextResponse.json(
        { error: "Не знайдено пропозицію або коментар для відповіді." },
        { status: 404 },
      );
    }
    return NextResponse.json({ comment: mapCommentToJson(row) });
  } catch (err) {
    return NextResponse.json(
      { error: publicDbErrorMessage(err) },
      { status: 503 },
    );
  }
}
