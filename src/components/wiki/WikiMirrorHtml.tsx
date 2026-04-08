"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import {
  isWikiCdnImageUrl,
  normalizeImageUrlForProxy,
  WIKI_IMAGE_PROXY_PATH,
} from "@/lib/wiki-image-proxy";

type Props = {
  html: string;
  rewriteWikiLinksToLocal?: boolean;
  fandomBase?: string | null;
};

function toProxySrc(absoluteHttps: string): string {
  return `${WIKI_IMAGE_PROXY_PATH}?url=${encodeURIComponent(absoluteHttps)}`;
}

function applyProxyToSrc(img: HTMLImageElement, fandomBase: string): void {
  const srcAttr = img.getAttribute("src")?.trim();
  if (srcAttr?.startsWith(WIKI_IMAGE_PROXY_PATH)) return;

  const dataSrc = img.getAttribute("data-src")?.trim();
  const raw = dataSrc || srcAttr || "";
  if (!raw) return;

  const abs = normalizeImageUrlForProxy(raw, fandomBase);
  if (!abs) return;

  img.removeAttribute("data-src");
  img.classList.remove("lazyload");

  if (isWikiCdnImageUrl(abs)) {
    img.referrerPolicy = "no-referrer";
    img.src = toProxySrc(abs);
    return;
  }

  if (dataSrc && (!srcAttr || srcAttr.startsWith("data:"))) {
    img.src = abs;
  }
}

function applyProxyToSrcset(
  el: HTMLImageElement | HTMLSourceElement,
  fandomBase: string,
) {
  const raw = el.getAttribute("srcset");
  if (!raw?.trim()) return;
  const parts = raw.split(",").map((s) => s.trim());
  const out: string[] = [];
  for (const part of parts) {
    const bits = part.split(/\s+/);
    const urlPart = bits[0];
    const rest = bits.slice(1).join(" ");
    const abs = normalizeImageUrlForProxy(
      urlPart.startsWith("//") ? `https:${urlPart}` : urlPart,
      fandomBase,
    );
    if (abs && isWikiCdnImageUrl(abs)) {
      out.push(`${toProxySrc(abs)}${rest ? ` ${rest}` : ""}`);
    } else {
      out.push(part);
    }
  }
  el.setAttribute("srcset", out.join(", "));
}

export function WikiMirrorHtml({
  html,
  rewriteWikiLinksToLocal = true,
  fandomBase,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  /** Звичайні <a href="/wiki/..."> роблять full reload → перемонтовується layout і фонове відео. */
  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const anchor = (e.target as HTMLElement | null)?.closest("a[href]");
      if (!anchor) return;

      if (anchor.getAttribute("target") === "_blank") return;
      if (anchor.hasAttribute("download")) return;

      const hrefAttr = anchor.getAttribute("href");
      if (!hrefAttr?.trim() || hrefAttr.startsWith("#")) return;

      let url: URL;
      try {
        url = new URL(hrefAttr, window.location.origin);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (!url.pathname.startsWith("/wiki")) return;

      e.preventDefault();
      router.push(`${url.pathname}${url.search}${url.hash}`);
    };

    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  }, [router]);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const base =
      fandomBase?.replace(/\/+$/, "") || "https://lost-chronicles.fandom.com";

    root.querySelectorAll("img").forEach((node) => {
      applyProxyToSrc(node as HTMLImageElement, base);
    });

    root.querySelectorAll("picture source[srcset]").forEach((node) => {
      applyProxyToSrcset(node as HTMLSourceElement, base);
    });

    if (rewriteWikiLinksToLocal) {
      let fandomOrigin: string;
      try {
        fandomOrigin = new URL(base).origin;
      } catch {
        return;
      }
      const skipNs =
        /^(special|file|category|user|user talk|template|mediawiki|help|talk|module|project)$/i;

      root.querySelectorAll("a[href]").forEach((node) => {
        const el = node as HTMLAnchorElement;
        const hrefAttr = el.getAttribute("href");
        if (!hrefAttr || hrefAttr.startsWith("#")) return;

        if (hrefAttr.startsWith("/wiki/")) {
          el.removeAttribute("target");
          return;
        }

        try {
          const raw =
            hrefAttr.startsWith("//") ? `https:${hrefAttr}` : hrefAttr;
          const u = new URL(raw, `${base}/`);
          if (u.origin !== fandomOrigin) return;
          const m = u.pathname.match(/\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?wiki\/(.+)$/i);
          if (!m) return;
          const page = m[1];
          let decoded: string;
          try {
            decoded = decodeURIComponent(page).replace(/_/g, " ");
          } catch {
            decoded = page.replace(/_/g, " ");
          }
          const ns = decoded.split(":")[0]?.trim() ?? "";
          if (skipNs.test(ns)) return;
          el.setAttribute("href", `/wiki/${page}${u.hash || ""}`);
          el.removeAttribute("target");
        } catch {
          /* skip */
        }
      });
    }
  }, [html, rewriteWikiLinksToLocal, fandomBase]);

  return (
    <div
      ref={ref}
      className="wiki-mirror"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
