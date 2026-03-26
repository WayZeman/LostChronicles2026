"use client";

import { useEffect, useRef } from "react";

type Props = {
  html: string;
  rewriteWikiLinksToLocal?: boolean;
  fandomBase?: string | null;
};

function safeSetImgFromDataSrc(el: HTMLImageElement) {
  const ds = el.getAttribute("data-src");
  if (!ds) return;
  if (!ds.startsWith("https://") && !ds.startsWith("http://")) return;
  if (!el.src || el.src.startsWith("data:")) {
    el.src = ds;
  }
  el.removeAttribute("data-src");
  el.classList.remove("lazyload");
}

export function WikiMirrorHtml({
  html,
  rewriteWikiLinksToLocal = true,
  fandomBase,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    root.querySelectorAll("img").forEach((img) => {
      safeSetImgFromDataSrc(img as HTMLImageElement);
    });

    const base = fandomBase?.replace(/\/+$/, "");
    if (rewriteWikiLinksToLocal && base) {
      let origin: string;
      try {
        origin = new URL(base).origin;
      } catch {
        return;
      }
      root.querySelectorAll("a[href]").forEach((node) => {
        const el = node as HTMLAnchorElement;
        const hrefAttr = el.getAttribute("href");
        if (!hrefAttr || hrefAttr.startsWith("/wiki/")) return;
        try {
          const u = new URL(el.href);
          if (u.origin !== origin) return;
          const m = u.pathname.match(/\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?wiki\/(.+)$/i);
          if (!m) return;
          const page = m[1];
          const decoded = decodeURIComponent(page).replace(/_/g, " ");
          const ns = decoded.split(":")[0]?.trim() ?? "";
          if (
            /^(special|file|category|user|user talk|template|mediawiki|help|talk|module|project)$/i.test(
              ns
            )
          ) {
            return;
          }
          el.setAttribute("href", `/wiki/${page}`);
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
      // eslint-disable-next-line react/no-danger -- HTML з MediaWiki API / БД
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
