import type { Metadata } from "next";
import Image from "next/image";
import { ExternalLink, Map as MapIcon } from "lucide-react";

import { lcPageContainerClass, lcPageMainMapClass } from "@/components/site/lc-page-shell";
import { DiamondPageRoot, DiamondSlot } from "@/components/site/DiamondSlot";
import { WikiContentFrame } from "@/components/wiki/WikiContentFrame";

import { LC_DEFAULT_JAVA_SERVER_HOST } from "@/lib/lc-server-defaults";
import { buildLcPageMetadata } from "@/lib/seo";

/** BlueMap. Перевизначення: NEXT_PUBLIC_MAP_URL у .env / Vercel (у лапках, якщо є # у hash). */
const DEFAULT_MAP_URL =
  "http://142.132.211.240:25553/#world:0:0:0:1500:0:0:0:1:flat";

export const metadata: Metadata = buildLcPageMetadata({
  title: "Карта світу Lost Chronicles — BlueMap Minecraft",
  description: `Інтерактивна карта світу сервера Lost Chronicles (BlueMap). Оглянь території перед грою. IP: ${LC_DEFAULT_JAVA_SERVER_HOST}.`,
  path: "/map",
});

export default function MapPage() {
  const mapUrl = process.env.NEXT_PUBLIC_MAP_URL?.trim() || DEFAULT_MAP_URL;

  return (
    <main className={lcPageMainMapClass}>
      <DiamondPageRoot className={lcPageContainerClass}>
        <WikiContentFrame>
          <div className="relative flex flex-col items-center text-center">
            <DiamondSlot
              id="map-header"
              className="!absolute !right-2 !top-0"
            />
            <h2 className="lc-section-title text-xl uppercase md:text-2xl">
              Перейти до карти
            </h2>

            <div className="relative mt-5 w-full max-w-2xl overflow-hidden md:mt-6">
              <Image
                src="/map-hero.png?v=1"
                alt=""
                width={1024}
                height={576}
                className="h-auto w-full select-none"
                priority
                unoptimized
              />
            </div>

            <div className="relative mt-6 md:mt-8">
              <DiamondSlot
                id="map-cta"
                className="!absolute !-right-2 !-top-3 sm:!-right-6"
              />
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="lc-focus-ring lc-btn-accent inline-flex items-center gap-2 px-6 py-2.5 text-sm md:px-7 md:py-3"
              >
                <MapIcon className="size-4 shrink-0 opacity-90" strokeWidth={2} aria-hidden />
                Мапа серверу
                <ExternalLink className="size-3 opacity-60" aria-hidden />
              </a>
            </div>
          </div>
        </WikiContentFrame>
      </DiamondPageRoot>
    </main>
  );
}
