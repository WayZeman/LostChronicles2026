import { NextResponse } from "next/server";
import {
  OAUTH_STATE_COOKIE,
  oauthStateCookieOptions,
  randomOAuthState,
} from "@/lib/auth-session";
import { buildDiscordAuthorizeUrl } from "@/lib/discord-oauth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const state = randomOAuthState();
    const url = buildDiscordAuthorizeUrl(state);
    const res = NextResponse.redirect(url);
    res.cookies.set(OAUTH_STATE_COOKIE, state, oauthStateCookieOptions());
    return res;
  } catch {
    return NextResponse.json(
      { error: "Discord OAuth is not configured (DISCORD_CLIENT_ID, etc.)" },
      { status: 500 },
    );
  }
}
