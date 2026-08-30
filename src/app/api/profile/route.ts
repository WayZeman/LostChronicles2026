import { NextResponse } from "next/server";
import { getSessionUserIdFromCookies } from "@/lib/auth-session";
import {
  getUserProfileFields,
  updateUserProfileFields,
} from "@/lib/user-profile-fields";
import { canEditWiki, isAdminRole } from "@/lib/admin-role";
import {
  gameNicknameError,
  normalizeGameNickname,
  userDisplayName,
} from "@/lib/game-nickname";
import {
  getUserPublicById,
  updateUserProfile,
} from "@/lib/proposals-queries";
import { resolveUserAvatarUrl } from "@/lib/user-avatar";

export const dynamic = "force-dynamic";

function serializeUser(
  u: NonNullable<Awaited<ReturnType<typeof getUserPublicById>>>,
  profile: { age: string; birthday: string; bio: string },
) {
  const gameNickname = u.game_nickname?.trim() || null;
  return {
    id: u.id,
    username: u.username,
    displayName: userDisplayName(u),
    gameNickname,
    needsNickname: !gameNickname,
    avatarUrl: resolveUserAvatarUrl({
      username: u.username,
      avatar: u.avatar,
      discord_id: u.discord_id,
      custom_avatar: u.custom_avatar,
    }),
    hasCustomAvatar: Boolean(u.custom_avatar?.trim()),
    role: u.role,
    isAdmin: isAdminRole(u.role),
    canEditWiki: canEditWiki(u.role),
    age: profile.age,
    birthday: profile.birthday,
    bio: profile.bio,
  };
}

export async function GET() {
  try {
    const userId = await getSessionUserIdFromCookies();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const u = await getUserPublicById(userId);
    if (!u) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const profile = await getUserProfileFields(userId);
    return NextResponse.json({ user: serializeUser(u, profile) });
  } catch {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const userId = await getSessionUserIdFromCookies();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const b = body as Record<string, unknown>;
    const nickPatch: {
      gameNickname?: string;
      customAvatar?: string | null;
    } = {};
    const profilePatch: {
      age?: string;
      birthday?: string;
      bio?: string;
    } = {};

    if ("gameNickname" in b) {
      if (typeof b.gameNickname !== "string") {
        return NextResponse.json(
          { error: "Некоректний нікнейм." },
          { status: 400 },
        );
      }
      const err = gameNicknameError(b.gameNickname);
      if (err) {
        return NextResponse.json({ error: err }, { status: 400 });
      }
      nickPatch.gameNickname = normalizeGameNickname(b.gameNickname);
    }

    if (typeof b.age === "string") profilePatch.age = b.age;
    if (typeof b.birthday === "string") profilePatch.birthday = b.birthday;
    if (typeof b.bio === "string") profilePatch.bio = b.bio;

    const hasNick = nickPatch.gameNickname !== undefined;
    const hasProfile =
      profilePatch.age !== undefined ||
      profilePatch.birthday !== undefined ||
      profilePatch.bio !== undefined;

    if (!hasNick && !hasProfile) {
      return NextResponse.json(
        { error: "Немає змін для збереження." },
        { status: 400 },
      );
    }

    if (hasNick) {
      const result = await updateUserProfile({
        userId,
        gameNickname: nickPatch.gameNickname,
      });
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 409 });
      }
    }

    if (hasProfile) {
      await updateUserProfileFields({
        userId,
        age: profilePatch.age,
        birthday: profilePatch.birthday,
        bio: profilePatch.bio,
      });
    }

    const u = await getUserPublicById(userId);
    if (!u) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const profile = await getUserProfileFields(userId);
    return NextResponse.json({ user: serializeUser(u, profile) });
  } catch {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}
