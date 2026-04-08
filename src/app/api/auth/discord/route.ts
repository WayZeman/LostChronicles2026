import { NextResponse } from "next/server";
import {
  OAUTH_STATE_COOKIE,
  oauthStateCookieOptions,
  randomOAuthState,
} from "@/lib/auth-session";
import { buildDiscordAuthorizeUrl } from "@/lib/discord-oauth";
import { getSiteBaseUrl } from "@/lib/site-base-url";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const state = randomOAuthState();
    const url = buildDiscordAuthorizeUrl(state);
    const res = NextResponse.redirect(url);
    res.cookies.set(OAUTH_STATE_COOKIE, state, oauthStateCookieOptions());
    return res;
  } catch {
    const base = getSiteBaseUrl();
    return NextResponse.redirect(
      `${base}/proposals?error=discord_config`,
    );
  }
}
