import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  OAUTH_NEXT_COOKIE,
  OAUTH_STATE_COOKIE,
  SESSION_COOKIE,
  sessionCookieOptions,
  signSessionToken,
  sanitizeOAuthNextPath,
} from "@/lib/auth-session";
import {
  discordDisplayName,
  exchangeDiscordCode,
  fetchDiscordMe,
} from "@/lib/discord-oauth";
import { buildDiscordRedirectUri } from "@/lib/discord-oauth";
import { upsertDiscordUser } from "@/lib/proposals-queries";
import { getRequestOrigin } from "@/lib/site-base-url";

export const dynamic = "force-dynamic";

const clearCookie = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 0,
};

function clearOAuthStateCookie(res: NextResponse): void {
  res.cookies.set(OAUTH_STATE_COOKIE, "", clearCookie);
}

function clearOAuthNextCookie(res: NextResponse): void {
  res.cookies.set(OAUTH_NEXT_COOKIE, "", clearCookie);
}

export async function GET(req: Request) {
  const base = getRequestOrigin(req);
  const redirectUri = buildDiscordRedirectUri(base);
  const fail = (path: string) => {
    const res = NextResponse.redirect(`${base}${path}`);
    clearOAuthStateCookie(res);
    clearOAuthNextCookie(res);
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
    const tokenRes = await exchangeDiscordCode(code, redirectUri);
    const me = await fetchDiscordMe(tokenRes.access_token);
    const display = discordDisplayName(me);
    const userId = await upsertDiscordUser({
      discordId: me.id,
      username: display.slice(0, 100),
      avatar: me.avatar,
    });
    const session = await signSessionToken(userId);
    const nextStored = jar.get(OAUTH_NEXT_COOKIE)?.value;
    const nextPath = sanitizeOAuthNextPath(nextStored) ?? "/proposals";
    const res = NextResponse.redirect(`${base}${nextPath}`);
    clearOAuthStateCookie(res);
    clearOAuthNextCookie(res);
    res.cookies.set(SESSION_COOKIE, session, sessionCookieOptions());
    return res;
  } catch {
    return fail("/proposals?error=discord");
  }
}
