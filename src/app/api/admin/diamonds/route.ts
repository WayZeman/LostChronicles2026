import { NextResponse } from "next/server";
import { getSessionUserIdFromCookies } from "@/lib/auth-session";
import {
  endDiamondEvent,
  getDiamondEventSettings,
  getDiamondFinishers,
  getDiamondLeaderboard,
  startDiamondEvent,
  updateDiamondEventSettings,
} from "@/lib/diamond-hunt";
import { requireAdminUserId } from "@/lib/site-content";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await requireAdminUserId(
      await getSessionUserIdFromCookies(),
    );
    if (!userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const [event, leaderboard, finishers] = await Promise.all([
      getDiamondEventSettings(),
      getDiamondLeaderboard(25),
      getDiamondFinishers(25),
    ]);
    return NextResponse.json({ event, leaderboard, finishers });
  } catch {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}

export async function PUT(req: Request) {
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

    const b = (body ?? {}) as Record<string, unknown>;
    const action = typeof b.action === "string" ? b.action : "save";

    if (action === "start") {
      const event = await startDiamondEvent();
      return NextResponse.json({ event });
    }
    if (action === "end") {
      const event = await endDiamondEvent();
      return NextResponse.json({ event });
    }

    const patch: {
      enabled?: boolean;
      title?: string;
      blurb?: string;
      startAt?: string | null;
      endAt?: string | null;
    } = {};

    if ("enabled" in b) patch.enabled = Boolean(b.enabled);
    if (typeof b.title === "string") patch.title = b.title;
    if (typeof b.blurb === "string") patch.blurb = b.blurb;
    if ("startAt" in b) {
      patch.startAt =
        b.startAt === null || b.startAt === ""
          ? null
          : typeof b.startAt === "string"
            ? b.startAt
            : null;
    }
    if ("endAt" in b) {
      patch.endAt =
        b.endAt === null || b.endAt === ""
          ? null
          : typeof b.endAt === "string"
            ? b.endAt
            : null;
    }

    const event = await updateDiamondEventSettings(patch);
    return NextResponse.json({ event });
  } catch {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}
