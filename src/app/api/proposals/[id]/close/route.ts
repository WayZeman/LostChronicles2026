import { NextResponse } from "next/server";
import { getSessionUserIdFromCookies } from "@/lib/auth-session";
import { closeProposalByAuthor } from "@/lib/proposals-queries";

export const dynamic = "force-dynamic";

export async function POST(
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

    const closed = await closeProposalByAuthor(id, userId);
    if (!closed) {
      return NextResponse.json(
        {
          error:
            "Не вдалося закрити: ти не автор, голосування вже закрите або пропозиції не існує.",
        },
        { status: 403 },
      );
    }

    return NextResponse.json({ ok: true, status: "closed", voting_open: false });
  } catch {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}
