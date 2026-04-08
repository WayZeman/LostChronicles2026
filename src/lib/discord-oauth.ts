import { getSiteBaseUrl } from "@/lib/site-base-url";

const DISCORD_API = "https://discord.com/api";

/** Client ID не є секретом (він у URL авторизації); можна задати також як NEXT_PUBLIC_* на Vercel. */
export function getDiscordClientId(): string {
  return (
    process.env.DISCORD_CLIENT_ID?.trim() ||
    process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID?.trim() ||
    ""
  );
}

export function getDiscordRedirectUri(): string {
  return `${getSiteBaseUrl()}/api/auth/discord/callback`;
}

export function buildDiscordAuthorizeUrl(state: string): string {
  const clientId = getDiscordClientId();
  if (!clientId) throw new Error("DISCORD_CLIENT_ID is not set");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getDiscordRedirectUri(),
    response_type: "code",
    scope: "identify email",
    state,
    prompt: "consent",
  });

  return `${DISCORD_API}/oauth2/authorize?${params.toString()}`;
}

export async function exchangeDiscordCode(code: string): Promise<{
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}> {
  const clientId = getDiscordClientId();
  const clientSecret = process.env.DISCORD_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new Error("DISCORD_CLIENT_ID or DISCORD_CLIENT_SECRET missing");
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    code,
    redirect_uri: getDiscordRedirectUri(),
  });

  const res = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Discord token exchange failed: ${res.status} ${t}`);
  }

  return res.json() as Promise<{
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    scope: string;
  }>;
}

export type DiscordUser = {
  id: string;
  username: string;
  global_name?: string | null;
  avatar: string | null;
  discriminator?: string;
};

export async function fetchDiscordMe(accessToken: string): Promise<DiscordUser> {
  const res = await fetch(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Discord @me failed: ${res.status} ${t}`);
  }
  return res.json() as Promise<DiscordUser>;
}

export function discordDisplayName(u: DiscordUser): string {
  return u.global_name?.trim() || u.username;
}

export function discordCdnAvatarUrl(u: DiscordUser): string {
  if (u.avatar) {
    const ext = u.avatar.startsWith("a_") ? "gif" : "png";
    return `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.${ext}?size=64`;
  }
  const idx = Number(
    (BigInt(u.id) >> BigInt(22)) % BigInt(6),
  );
  return `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
}
