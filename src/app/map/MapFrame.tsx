"use client";

import { useMemo } from "react";

type Props = {
  src: string;
};

/**
 * BlueMap у iframe. HTTP-мапа на HTTPS (Vercel) інакше дає порожній екран (mixed content).
 * Тому http://… підміняємо на same-origin /map-embed/… (rewrite у next.config → MAP_PROXY_TARGET).
 */
function iframeSrcFromMapUrl(mapUrl: string): string {
  if (!mapUrl.startsWith("http:")) {
    return mapUrl;
  }
  const hash = mapUrl.includes("#") ? mapUrl.slice(mapUrl.indexOf("#")) : "";
  return `/map-embed/${hash}`;
}

export function MapFrame({ src }: Props) {
  const iframeSrc = useMemo(() => iframeSrcFromMapUrl(src), [src]);

  return (
    <main className="flex min-h-0 w-full flex-1 flex-col bg-[#0f0f0f]">
      <iframe
        title="Мапа сервера Lost Chronicles (BlueMap)"
        src={iframeSrc}
        className="h-0 min-h-[40dvh] w-full flex-1 border-0"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
      />
    </main>
  );
}
