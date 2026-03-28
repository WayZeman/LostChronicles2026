import {
  decodeWikiImgSrcUrl,
  isWikiCdnImageUrl,
} from "@/lib/wiki-image-proxy";

export const dynamic = "force-dynamic";

const UPSTREAM_HEADERS = {
  "User-Agent":
    "LostChroniclesSite/1.0 (wiki image mirror; +https://lost-chronicles.site)",
  Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
  Referer: "https://lost-chronicles.fandom.com/",
} as const;

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("url");
  if (!raw) {
    return new Response("Missing url", { status: 400 });
  }

  const cleaned = decodeWikiImgSrcUrl(raw);

  let target: URL;
  try {
    target = new URL(cleaned);
  } catch {
    return new Response("Invalid url", { status: 400 });
  }

  if (target.protocol !== "https:") {
    return new Response("HTTPS only", { status: 403 });
  }

  if (!isWikiCdnImageUrl(cleaned)) {
    return new Response("Forbidden host", { status: 403 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(target.href, {
      headers: UPSTREAM_HEADERS,
      next: { revalidate: 86_400 },
    });
  } catch {
    return new Response("Upstream error", { status: 502 });
  }

  if (!upstream.ok) {
    return new Response(null, { status: upstream.status });
  }

  const ct = upstream.headers.get("content-type") || "application/octet-stream";
  const safeType =
    ct.startsWith("image/") || ct === "application/octet-stream" ? ct : "image/png";

  return new Response(upstream.body, {
    headers: {
      "Content-Type": safeType,
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
