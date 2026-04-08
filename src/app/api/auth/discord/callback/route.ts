import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  OAUTH_STATE_COOKIE,
  SESSION_COOKIE,
  sessionCookieOptions,
  signSessionToken,
} from "@/lib/auth-session";
import {
  discordDisplayName,
  exchangeDiscordCode,
  fetchDiscordMe,
} from "@/lib/discord-oauth";
import { upsertDiscordUser } from "@/lib/proposals-queries";
import { getSiteBaseUrl } from "@/lib/site-base-url";

export const dynamic = "force-dynamic";

function clearOAuthStateCookie(res: NextResponse): void {
  res.cookies.set(OAUTH_STATE_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function GET(req: Request) {
  const base = getSiteBaseUrl();
  const fail = (path: string) => {
    const res = NextResponse.redirect(`${base}${path}`);
    clearOAuthStateCookie(res);
    return res;
  };

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const jar = await cookies();
  const stored = jar.get(OAUTH_STATE_COOKIE)?.value;

  if (!code || !state || !stored || state !== stored) {
    return fail("/proposals?error=oauth");
  }

  try {
    const tokenRes = await exchangeDiscordCode(code);
    const me = await fetchDiscordMe(tokenRes.access_token);
    const display = discordDisplayName(me);
    const userId = await upsertDiscordUser({
      discordId: me.id,
      username: display.slice(0, 100),
      avatar: me.avatar,
    });
    const session = await signSessionToken(userId);
    const res = NextResponse.redirect(`${base}/proposals`);
    clearOAuthStateCookie(res);
    res.cookies.set(SESSION_COOKIE, session, sessionCookieOptions());
    return res;
  } catch {
    return fail("/proposals?error=discord");
  }
}
