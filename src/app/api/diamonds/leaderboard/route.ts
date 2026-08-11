import { NextResponse } from "next/server";
import { getSessionUserIdFromCookies } from "@/lib/auth-session";
import {
  getDiamondEventSettings,
  getDiamondLeaderboard,
  isEventActiveNow,
} from "@/lib/diamond-hunt";
import { resolveUserAvatarUrl } from "@/lib/user-avatar";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await getSessionUserIdFromCookies();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await getDiamondEventSettings();
    if (!isEventActiveNow(settings)) {
      return NextResponse.json({
        active: false,
        title: settings.title,
        entries: [],
      });
    }

    const raw = await getDiamondLeaderboard(15);
    const entries = raw.map((e) => ({
      userId: e.userId,
      displayName: e.displayName,
      score: e.score,
      avatarUrl: resolveUserAvatarUrl({
        username: e.username,
        avatar: e.avatar,
        discord_id: e.discordId,
        custom_avatar: e.customAvatar,
      }),
    }));

    return NextResponse.json({
      active: true,
      title: settings.title,
      entries,
    });
  } catch {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}
