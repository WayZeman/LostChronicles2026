import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-static";

/** Статичний sitemap без Content-Disposition — для Google Search Console. */
export async function GET() {
  const filePath = path.join(process.cwd(), "public", "sitemap-gsc.xml");
  const xml = await readFile(filePath, "utf8");
  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=3600",
    },
  });
}
