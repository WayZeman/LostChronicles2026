import { NextResponse } from "next/server";

import { LC_APPLY_PATH } from "@/data/lost-chronicles-faq";
import {
  LC_LISTING_TAGS,
  LC_PUBLIC_CATALOG_LINKS,
  lcListingDescriptionShort,
} from "@/data/lc-server-listings";
import {
  LC_DEFAULT_BEDROCK_ADDRESS,
  LC_DEFAULT_JAVA_SERVER_HOST,
} from "@/lib/lc-server-defaults";
import { getLcMarketingSiteUrl } from "@/lib/site-base-url";
import { getConnectSettings } from "@/lib/site-content";

export const dynamic = "force-dynamic";

/** Машиночитний профіль сервера для каталогів, AI і краулерів. */
export async function GET() {
  let ip = LC_DEFAULT_JAVA_SERVER_HOST;
  let version = "1.21.11";
  let bedrockAddress = LC_DEFAULT_BEDROCK_ADDRESS;
  let bedrockPort = "19132";

  try {
    const connect = await getConnectSettings();
    ip = connect.javaIp;
    version = connect.javaVersion;
    bedrockAddress = connect.bedrockAddress;
    bedrockPort = connect.bedrockPort;
  } catch {
    /* defaults */
  }

  const site = getLcMarketingSiteUrl();

  return NextResponse.json(
    {
      name: "Lost Chronicles",
      alternateName: ["Лост Хроніклс", "Lost Chronicles UA", "LC Minecraft"],
      country: "UA",
      language: "uk",
      website: site,
      play: `${site}/play`,
      apply: `${site}${LC_APPLY_PATH}`,
      ip,
      java: { host: ip, version },
      bedrock: { host: bedrockAddress, port: Number(bedrockPort) || 19132 },
      editions: ["java", "bedrock"],
      gamemodes: ["survival", "vanilla", "roleplay"],
      whitelist: true,
      tags: LC_LISTING_TAGS,
      description: lcListingDescriptionShort(ip),
      catalogs: LC_PUBLIC_CATALOG_LINKS.map((c) => ({
        name: c.label,
        url: c.href,
      })),
    },
    {
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=600",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}
