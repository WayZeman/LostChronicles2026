import { NextResponse } from "next/server";
import { canEditWiki, isAdminRole } from "@/lib/admin-role";
import { getSessionUserIdFromCookies } from "@/lib/auth-session";
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

const MAX_AVATAR_CHARS = 120_000;

function isAllowedAvatarDataUrl(raw: string): boolean {
  return /^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(
    raw,
  );
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
    const patch: {
      gameNickname?: string;
      customAvatar?: string | null;
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
      patch.gameNickname = normalizeGameNickname(b.gameNickname);
    }

    if ("customAvatar" in b) {
      if (b.customAvatar === null || b.customAvatar === "") {
        patch.customAvatar = null;
      } else if (typeof b.customAvatar === "string") {
        const av = b.customAvatar.trim();
        if (av.length > MAX_AVATAR_CHARS) {
          return NextResponse.json(
            { error: "Аватар занадто великий. Спробуй менше зображення." },
            { status: 400 },
          );
        }
        if (!isAllowedAvatarDataUrl(av) && !/^https:\/\//i.test(av)) {
          return NextResponse.json(
            { error: "Непідтримуваний формат аватара." },
            { status: 400 },
          );
        }
        patch.customAvatar = av;
      } else {
        return NextResponse.json(
          { error: "Некоректний аватар." },
          { status: 400 },
        );
      }
    }

    if (patch.gameNickname === undefined && patch.customAvatar === undefined) {
      return NextResponse.json(
        { error: "Немає змін для збереження." },
        { status: 400 },
      );
    }

    const result = await updateUserProfile({
      userId,
      gameNickname: patch.gameNickname,
      customAvatar: patch.customAvatar,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }

    const u = await getUserPublicById(userId);
    if (!u) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const gameNickname = u.game_nickname?.trim() || null;
    return NextResponse.json({
      user: {
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
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}
