import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { authorizeCronRequest } from "@/lib/cron-auth";
import { pingLcIndexNowBatched } from "@/lib/lc-indexnow";
import {
  buildLcSitemapEntries,
  lcSitemapPagesUrl,
  lcSitemapPublicUrl,
  lcSitemapUrl,
} from "@/lib/lc-sitemap-entries";

export const dynamic = "force-dynamic";

/**
 * Vercel Cron → GET/POST /api/cron/indexnow
 * Header: Authorization: Bearer {CRON_SECRET}
 */
async function run() {
  revalidatePath("/sitemap.xml");
  revalidatePath("/sitemaps/pages.xml");
  revalidatePath("/sitemaps/index.xml");

  const entries = await buildLcSitemapEntries();
  const pageUrls = entries
    .map((e) => e.url)
    .filter((u): u is string => typeof u === "string");
  const urls = [
    lcSitemapPublicUrl(),
    lcSitemapPagesUrl(),
    lcSitemapUrl("/sitemap.xml"),
    ...pageUrls,
  ];
  const result = await pingLcIndexNowBatched(urls);
  return { pinged: urls.length, ...result };
}

export async function GET(req: Request) {
  const denied = authorizeCronRequest(req);
  if (denied) return denied;
  try {
    return NextResponse.json(await run());
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const denied = authorizeCronRequest(req);
  if (denied) return denied;
  try {
    return NextResponse.json(await run());
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
