import { NextResponse } from "next/server";
import { getSessionUserIdFromCookies } from "@/lib/auth-session";
import {
  notifyProposalAdminCancelledDiscord,
  notifyProposalAdminCancelledTelegram,
} from "@/lib/notify-proposal";
import { cancelProposalByAdmin } from "@/lib/proposals-queries";
import { requireAdminUserId } from "@/lib/site-content";

export const dynamic = "force-dynamic";

const REASON_MAX = 500;

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id: raw } = await ctx.params;
  const id = Number(raw);
  if (!Number.isFinite(id) || id < 1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const userId = await requireAdminUserId(
      await getSessionUserIdFromCookies(),
    );
    if (!userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const reasonRaw = (body as { reason?: unknown }).reason;
    const reason = typeof reasonRaw === "string" ? reasonRaw.trim() : "";
    if (!reason) {
      return NextResponse.json(
        { error: "Вкажи причину скасування." },
        { status: 400 },
      );
    }
    if (reason.length > REASON_MAX) {
      return NextResponse.json(
        { error: `Причина занадто довга (макс. ${REASON_MAX} символів).` },
        { status: 400 },
      );
    }

    const cancelled = await cancelProposalByAdmin(id, reason);
    if (!cancelled) {
      return NextResponse.json(
        {
          error:
            "Не вдалося скасувати: пропозиції не існує або голосування вже не активне.",
        },
        { status: 409 },
      );
    }

    try {
      await Promise.all([
        notifyProposalAdminCancelledDiscord({
          title: cancelled.title,
          proposalId: cancelled.id,
          reason: cancelled.cancel_reason,
        }),
        notifyProposalAdminCancelledTelegram({
          title: cancelled.title,
          proposalId: cancelled.id,
          reason: cancelled.cancel_reason,
        }),
      ]);
    } catch (e) {
      console.error("[admin/proposals] cancel notify failed:", e);
    }

    return NextResponse.json({
      ok: true,
      status: "cancelled",
      cancel_reason: cancelled.cancel_reason,
    });
  } catch {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}
