import { NextResponse } from "next/server";
import { getSessionUserIdFromCookies } from "@/lib/auth-session";
import { isAdminRole } from "@/lib/admin-role";
import { userDisplayName } from "@/lib/game-nickname";
import { getUserPublicById } from "@/lib/proposals-queries";
import { promoteSuperAdmins } from "@/lib/site-content";
import { resolveUserAvatarUrl } from "@/lib/user-avatar";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await getSessionUserIdFromCookies();
    if (!userId) {
      return NextResponse.json({ user: null });
    }
    void promoteSuperAdmins().catch(() => {});
    const u = await getUserPublicById(userId);
    if (!u) {
      return NextResponse.json({ user: null });
    }
    const gameNickname = u.game_nickname?.trim() || null;
    const avatarUrl = resolveUserAvatarUrl({
      username: u.username,
      avatar: u.avatar,
      discord_id: u.discord_id,
      custom_avatar: u.custom_avatar,
    });
    return NextResponse.json({
      user: {
        id: u.id,
        username: u.username,
        displayName: userDisplayName(u),
        gameNickname,
        needsNickname: !gameNickname,
        avatarUrl,
        hasCustomAvatar: Boolean(u.custom_avatar?.trim()),
        role: u.role,
        isAdmin: isAdminRole(u.role),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Database unavailable", user: null },
      { status: 503 },
    );
  }
}
