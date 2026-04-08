import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "lc_session";
export const OAUTH_STATE_COOKIE = "lc_oauth_state";

const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 30;

function getAuthSecret(): Uint8Array {
  const raw = process.env.AUTH_SECRET?.trim();
  if (!raw || raw.length < 16) {
    throw new Error("AUTH_SECRET must be set (at least 16 characters)");
  }
  return new TextEncoder().encode(raw);
}

export type SessionPayload = {
  sub: string;
};

export function sessionCookieOptions(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
} {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  };
}

export function oauthStateCookieOptions(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
} {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  };
}

export async function signSessionToken(userId: number): Promise<string> {
  return new SignJWT({ sub: String(userId) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SEC}s`)
    .sign(getAuthSecret());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getAuthSecret(), {
      algorithms: ["HS256"],
    });
    const sub = payload.sub;
    if (typeof sub !== "string" || !/^\d+$/.test(sub)) return null;
    return { sub };
  } catch {
    return null;
  }
}

export async function getSessionUserIdFromCookies(): Promise<number | null> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const v = await verifySessionToken(raw);
  if (!v) return null;
  return Number(v.sub);
}

export function randomOAuthState(): string {
  const a = new Uint8Array(24);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}
