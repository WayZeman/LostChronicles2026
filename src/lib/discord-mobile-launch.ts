/**
 * Мобільний OAuth: спроба відкрити авторизацію в застосунку Discord (Android intent),
 * щоб не лишатися у вбудованому браузері.
 */

/** Телефони / мобільні браузери — показуємо сторінку запуску застосунку. */
export function isMobileDiscordOAuthUserAgent(ua: string | null): boolean {
  if (!ua) return false;
  return /iphone|ipod|ipad|android|mobile|webos|blackberry|opera mini|iemobile/i.test(
    ua,
  );
}

/**
 * Android: Chrome відкриє застосунок Discord (package com.discord), якщо встановлений;
 * інакше — S.browser_fallback_url (звичайний HTTPS OAuth).
 */
export function buildAndroidDiscordOAuthIntent(authorizeHttpsUrl: string): string {
  const fallback = encodeURIComponent(authorizeHttpsUrl);
  try {
    const u = new URL(authorizeHttpsUrl);
    const hostPathQuery = `${u.host}${u.pathname}${u.search}`;
    return `intent://${hostPathQuery}#Intent;scheme=https;package=com.discord;S.browser_fallback_url=${fallback};end`;
  } catch {
    return authorizeHttpsUrl;
  }
}
