const GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO = "https://www.googleapis.com/oauth2/v3/userinfo";

export function getGoogleClientId(): string {
  return (
    process.env.GOOGLE_CLIENT_ID?.trim() ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ||
    ""
  );
}

export function googleCallbackPath(): string {
  return "/api/auth/google/callback";
}

export function buildGoogleRedirectUri(origin: string): string {
  const base = origin.replace(/\/$/, "");
  return `${base}${googleCallbackPath()}`;
}

export function buildGoogleAuthorizeUrl(state: string, redirectUri: string): string {
  const clientId = getGoogleClientId();
  if (!clientId) throw new Error("GOOGLE_CLIENT_ID is not set");

  // Без prompt=consent — якщо Google уже залогінений у браузері/застосунку,
  // зазвичай достатньо одного підтвердження акаунта.
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    include_granted_scopes: "true",
  });

  return `${GOOGLE_AUTH}?${params.toString()}`;
}

export async function exchangeGoogleCode(
  code: string,
  redirectUri: string,
): Promise<{ access_token: string; token_type: string; expires_in: number }> {
  const clientId = getGoogleClientId();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET missing");
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });

  const res = await fetch(GOOGLE_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Google token exchange failed: ${res.status} ${t}`);
  }

  return res.json() as Promise<{
    access_token: string;
    token_type: string;
    expires_in: number;
  }>;
}

export type GoogleUser = {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
};

export async function fetchGoogleMe(accessToken: string): Promise<GoogleUser> {
  const res = await fetch(GOOGLE_USERINFO, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Google userinfo failed: ${res.status} ${t}`);
  }
  return res.json() as Promise<GoogleUser>;
}

export function googleDisplayName(u: GoogleUser): string {
  const name = u.name?.trim();
  if (name) return name;
  const email = u.email?.trim();
  if (email) return email.split("@")[0] || email;
  return "Google user";
}
