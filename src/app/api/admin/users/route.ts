import { NextResponse } from "next/server";
import { getSessionUserIdFromCookies } from "@/lib/auth-session";
import { normalizeRole } from "@/lib/admin-role";
import {
  listUsersForAdmin,
  requireAdminUserId,
  setUserRole,
} from "@/lib/site-content";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await requireAdminUserId(
      await getSessionUserIdFromCookies(),
    );
    if (!userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const users = await listUsersForAdmin();
    return NextResponse.json({ users });
  } catch {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const actorId = await requireAdminUserId(
      await getSessionUserIdFromCookies(),
    );
    if (!actorId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const b = body as { userId?: unknown; role?: unknown };
    const targetId = Number(b.userId);
    if (!Number.isFinite(targetId) || targetId < 1) {
      return NextResponse.json({ error: "Некоректний userId." }, { status: 400 });
    }
    const role = normalizeRole(b.role);
    if (b.role !== "admin" && b.role !== "user") {
      return NextResponse.json(
        { error: "role має бути admin або user." },
        { status: 400 },
      );
    }

    const result = await setUserRole(targetId, role, actorId);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    const users = await listUsersForAdmin();
    return NextResponse.json({ ok: true, users });
  } catch {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}
