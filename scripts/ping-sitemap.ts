/**
 * Перевіряє sitemap на продакшені та повідомляє Bing про оновлення.
 * Google Search Console: подай URL вручну (Ping API за deprecated).
 *
 *   npx tsx scripts/ping-sitemap.ts
 *   SITEMAP_BASE=https://lost-chronicles.co.ua npx tsx scripts/ping-sitemap.ts
 */

import { resolveLcMarketingSiteUrl } from "../src/lib/lc-domains";

const base = resolveLcMarketingSiteUrl(
  process.env.SITEMAP_BASE ?? process.env.NEXT_PUBLIC_SITE_URL,
);

const sitemapUrl = `${base}/sitemap.xml`;
const robotsUrl = `${base}/robots.txt`;

async function main() {
  console.log(`Sitemap: ${sitemapUrl}`);

  const res = await fetch(sitemapUrl, {
    headers: { Accept: "application/xml,text/xml,*/*" },
  });

  if (!res.ok) {
    console.error(`FAIL: HTTP ${res.status} ${res.statusText}`);
    process.exit(1);
  }

  const xml = await res.text();
  if (!xml.includes("<urlset") || !xml.includes("<loc>")) {
    console.error("FAIL: відповідь не схожа на sitemap XML");
    process.exit(1);
  }

  const count = (xml.match(/<loc>/g) ?? []).length;
  console.log(`OK: ${count} URL у sitemap`);

  const robots = await fetch(robotsUrl);
  const robotsText = await robots.text();
  if (robotsText.includes(sitemapUrl)) {
    console.log("OK: robots.txt посилається на sitemap");
  } else {
    console.warn("WARN: robots.txt не містить sitemap URL");
  }

  try {
    const bing = await fetch(
      `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
    );
    console.log(`Bing ping: HTTP ${bing.status}`);
  } catch (e) {
    console.warn("Bing ping failed:", e);
  }

  console.log("\nGoogle Search Console:");
  console.log("  1. https://search.google.com/search-console");
  console.log(`  2. Файли Sitemap → подати: ${sitemapUrl}`);
  console.log("  3. Перевірка URL → Запросити індексування головної");
  console.log("\nСтарий домен lost-chronicles.site:");
  console.log("  DNS A → 76.76.21.21 або CNAME → cname.vercel-dns.com");
  console.log("  Vercel → Domains → додати lost-chronicles.site + www");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
