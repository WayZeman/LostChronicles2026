import { NextResponse } from "next/server";
import { getSessionUserIdFromCookies } from "@/lib/auth-session";
import { deleteSkin } from "@/lib/skins";
import { requireAdminUserId } from "@/lib/site-content";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, ctx: Ctx) {
  const userId = await getSessionUserIdFromCookies();
  if (!userId) {
    return NextResponse.json({ error: "Потрібен вхід" }, { status: 401 });
  }

  const { id: raw } = await ctx.params;
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "Невірний id" }, { status: 400 });
  }

  try {
    const adminId = await requireAdminUserId(userId);
    const result = await deleteSkin({
      skinId: id,
      actorUserId: userId,
      actorIsAdmin: Boolean(adminId),
    });
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status },
      );
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "База даних недоступна" },
      { status: 503 },
    );
  }
}
