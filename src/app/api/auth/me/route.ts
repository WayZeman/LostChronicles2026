import { NextResponse } from "next/server";
import { getSessionUserIdFromCookies } from "@/lib/auth-session";
import { getUserPublicById } from "@/lib/proposals-queries";
import { resolveUserAvatarUrl } from "@/lib/user-avatar";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await getSessionUserIdFromCookies();
    if (!userId) {
      return NextResponse.json({ user: null });
    }
    const u = await getUserPublicById(userId);
    if (!u) {
      return NextResponse.json({ user: null });
    }
    const avatarUrl = resolveUserAvatarUrl({
      username: u.username,
      avatar: u.avatar,
      discord_id: u.discord_id,
    });
    return NextResponse.json({
      user: {
        id: u.id,
        username: u.username,
        avatarUrl,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Database unavailable", user: null },
      { status: 503 },
    );
  }
}
