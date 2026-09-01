import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  OAUTH_NEXT_COOKIE,
  OAUTH_STATE_COOKIE,
  SESSION_COOKIE,
  authRequiredPath,
  sessionCookieOptions,
  signSessionToken,
  sanitizeOAuthNextPath,
} from "@/lib/auth-session";
import {
  buildGoogleRedirectUri,
  exchangeGoogleCode,
  fetchGoogleMe,
  googleDisplayName,
} from "@/lib/google-oauth";
import { upsertGoogleUser, userHasGameNickname } from "@/lib/proposals-queries";
import { profileSetupPath } from "@/lib/profile-setup-path";
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
  const redirectUri = buildGoogleRedirectUri(base);
  const jar = await cookies();
  const fail = (error: string) => {
    const nextStored = jar.get(OAUTH_NEXT_COOKIE)?.value;
    const nextPath = sanitizeOAuthNextPath(nextStored) ?? "/proposals";
    const res = NextResponse.redirect(
      `${base}${authRequiredPath(nextPath, error)}`,
    );
    clearOAuthStateCookie(res);
    clearOAuthNextCookie(res);
    return res;
  };

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const stored = jar.get(OAUTH_STATE_COOKIE)?.value;

  if (!code || !state || !stored || state !== stored) {
    return fail("oauth");
  }

  try {
    const tokenRes = await exchangeGoogleCode(code, redirectUri);
    const me = await fetchGoogleMe(tokenRes.access_token);
    if (!me.sub) {
      return fail("google");
    }
    const display = googleDisplayName(me);
    const userId = await upsertGoogleUser({
      googleId: me.sub,
      username: display.slice(0, 100),
      avatarUrl: me.picture?.trim() || null,
    });
    const session = await signSessionToken(userId);
    const nextStored = jar.get(OAUTH_NEXT_COOKIE)?.value;
    const nextPath = sanitizeOAuthNextPath(nextStored) ?? "/proposals";
    const needsNick = !(await userHasGameNickname(userId));
    const dest = needsNick ? profileSetupPath(nextPath) : nextPath;
    const res = NextResponse.redirect(`${base}${dest}`);
    clearOAuthStateCookie(res);
    clearOAuthNextCookie(res);
    res.cookies.set(SESSION_COOKIE, session, sessionCookieOptions());
    return res;
  } catch {
    return fail("google");
  }
}
