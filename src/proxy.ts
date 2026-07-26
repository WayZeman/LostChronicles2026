import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  buildOAuthNextFromPath,
  discordLoginPath,
  verifySessionToken,
} from "@/lib/auth-session";

function isAuthRequiredPath(pathname: string): boolean {
  return (
    pathname === "/proposals" ||
    pathname.startsWith("/proposals/") ||
    pathname === "/wiki" ||
    pathname.startsWith("/wiki/")
  );
}

export default async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (!isAuthRequiredPath(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    const session = await verifySessionToken(token);
    if (session) {
      return NextResponse.next();
    }
  }

  const next = buildOAuthNextFromPath(pathname, search);
  return NextResponse.redirect(new URL(discordLoginPath(next), req.nextUrl));
}

export const config = {
  matcher: ["/proposals", "/proposals/:path*", "/wiki", "/wiki/:path*"],
};
