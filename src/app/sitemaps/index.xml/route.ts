import {
  buildLcSitemapIndexXml,
  lcSitemapXmlResponse,
} from "@/lib/lc-sitemap-xml";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export async function GET() {
  return lcSitemapXmlResponse(buildLcSitemapIndexXml());
}
