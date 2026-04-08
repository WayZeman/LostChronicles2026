import { NextResponse } from "next/server";
import {
  OAUTH_NEXT_COOKIE,
  OAUTH_STATE_COOKIE,
  oauthStateCookieOptions,
  randomOAuthState,
  sanitizeOAuthNextPath,
} from "@/lib/auth-session";
import { buildDiscordAuthorizeUrl, buildDiscordRedirectUri } from "@/lib/discord-oauth";
import { getRequestOrigin } from "@/lib/site-base-url";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const origin = getRequestOrigin(req);
    const redirectUri = buildDiscordRedirectUri(origin);
    const state = randomOAuthState();
    const url = buildDiscordAuthorizeUrl(state, redirectUri);
    const res = NextResponse.redirect(url);
    res.cookies.set(OAUTH_STATE_COOKIE, state, oauthStateCookieOptions());
    const next = sanitizeOAuthNextPath(
      new URL(req.url).searchParams.get("next"),
    );
    if (next) {
      res.cookies.set(OAUTH_NEXT_COOKIE, next, oauthStateCookieOptions());
    }
    return res;
  } catch {
    const base = getRequestOrigin(req);
    return NextResponse.redirect(
      `${base}/proposals?error=discord_config`,
    );
  }
}
