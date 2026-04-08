import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { OAUTH_STATE_COOKIE } from "@/lib/auth-session";
import { lcPageMainClass } from "@/components/site/lc-page-shell";
import { buildDiscordAuthorizeUrl, buildDiscordRedirectUri } from "@/lib/discord-oauth";
import { getRequestOriginFromHeaders } from "@/lib/site-base-url";
import { DiscordMobileLaunch } from "./discord-mobile-launch";

export const metadata = {
  title: "Вхід Discord",
  robots: { index: false, follow: false } as const,
};

export default async function DiscordAppAuthPage() {
  const jar = await cookies();
  const state = jar.get(OAUTH_STATE_COOKIE)?.value;
  const h = await headers();
  const origin = getRequestOriginFromHeaders(h);

  if (!state) {
    redirect(`${origin}/proposals?error=oauth`);
  }

  const redirectUri = buildDiscordRedirectUri(origin);
  let authorizeUrl: string;
  try {
    authorizeUrl = buildDiscordAuthorizeUrl(state, redirectUri);
  } catch {
    redirect(`${origin}/proposals?error=discord_config`);
  }

  return (
    <main className={lcPageMainClass}>
      <DiscordMobileLaunch authorizeUrl={authorizeUrl} />
    </main>
  );
}
