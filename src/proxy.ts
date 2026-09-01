import { NextRequest, NextResponse } from "next/server";
import { authRequiredPath, buildOAuthNextFromPath } from "@/lib/auth-paths";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth-session";
import {
  LC_LEGACY_MARKETING_HOSTS,
  LC_MARKETING_HOST,
} from "@/lib/lc-domains";

function redirectToCanonicalHost(req: NextRequest): NextResponse | null {
  const host =
    req.headers.get("x-forwarded-host")?.split(",")[0]?.trim().toLowerCase() ||
    req.headers.get("host")?.split(":")[0]?.trim().toLowerCase() ||
    "";

  const isLegacy = (LC_LEGACY_MARKETING_HOSTS as readonly string[]).includes(
    host,
  );
  const isWwwCanonical = host === `www.${LC_MARKETING_HOST}`;

  if (!isLegacy && !isWwwCanonical) return null;

  const url = req.nextUrl.clone();
  url.protocol = "https:";
  url.host = LC_MARKETING_HOST;
  const response = NextResponse.redirect(url, 301);
  response.headers.set(
    "Link",
    `<https://${LC_MARKETING_HOST}${req.nextUrl.pathname}${req.nextUrl.search}>; rel="canonical"`,
  );
  return response;
}

/** Створення пропозиції / адмінка / редагування вікі — лише для авторизованих. */
function isAuthRequiredPath(pathname: string): boolean {
  if (pathname === "/proposals/new") return true;
  if (pathname === "/apply" || pathname.startsWith("/apply/")) return true;
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return true;
  if (pathname === "/profile" || pathname.startsWith("/profile/")) return true;
  if (pathname === "/wiki/new") return true;
  if (/^\/wiki\/.+\/edit\/?$/.test(pathname)) return true;
  return false;
}

/** У local — без кешу, щоб UI-правки видно одразу після refresh. */
function withDevNoStore(response: NextResponse): NextResponse {
  if (process.env.NODE_ENV !== "production") {
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, max-age=0",
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }
  return response;
}

export default async function proxy(req: NextRequest) {
  const canonicalRedirect = redirectToCanonicalHost(req);
  if (canonicalRedirect) return canonicalRedirect;

  const { pathname, search } = req.nextUrl;

  if (!isAuthRequiredPath(pathname)) {
    return withDevNoStore(NextResponse.next());
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    const session = await verifySessionToken(token);
    if (session) {
      return withDevNoStore(NextResponse.next());
    }
  }

  const next = buildOAuthNextFromPath(pathname, search);
  return NextResponse.redirect(new URL(authRequiredPath(next), req.nextUrl));
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/webpack-hmr|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
