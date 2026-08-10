import { NextRequest, NextResponse } from "next/server";
import { authRequiredPath, buildOAuthNextFromPath } from "@/lib/auth-paths";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth-session";

/** Створення пропозиції / адмінка / редагування вікі — лише для авторизованих. */
function isAuthRequiredPath(pathname: string): boolean {
  if (pathname === "/proposals/new") return true;
  if (pathname === "/apply" || pathname.startsWith("/apply/")) return true;
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return true;
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
    "/((?!_next/static|_next/webpack-hmr|_next/image|favicon.ico).*)",
  ],
};
