import { NextResponse } from "next/server";
import { getSessionUserIdFromCookies } from "@/lib/auth-session";
import {
  getConnectSettings,
  getSupportSettings,
  requireAdminUserId,
  saveConnectSettings,
  saveSupportSettings,
  type CatalogVoteLink,
} from "@/lib/site-content";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await requireAdminUserId(
      await getSessionUserIdFromCookies(),
    );
    if (!userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const [connect, support] = await Promise.all([
      getConnectSettings(),
      getSupportSettings(),
    ]);
    return NextResponse.json({ connect, support });
  } catch {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    const userId = await requireAdminUserId(
      await getSessionUserIdFromCookies(),
    );
    if (!userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const b = body as {
      connect?: Record<string, unknown>;
      support?: Record<string, unknown>;
    };

    let connect = await getConnectSettings();
    let support = await getSupportSettings();

    if (b.connect) {
      const c = b.connect;
      connect = await saveConnectSettings({
        javaIp: typeof c.javaIp === "string" ? c.javaIp : connect.javaIp,
        javaVersion:
          typeof c.javaVersion === "string" ? c.javaVersion : connect.javaVersion,
        bedrockAddress:
          typeof c.bedrockAddress === "string"
            ? c.bedrockAddress
            : connect.bedrockAddress,
        bedrockPort:
          typeof c.bedrockPort === "string" ? c.bedrockPort : connect.bedrockPort,
      });
    }

    if (b.support) {
      const s = b.support;
      let catalogLinks = support.catalogLinks;
        if (Array.isArray(s.catalogLinks)) {
        const parsed: CatalogVoteLink[] = [];
        for (const item of s.catalogLinks) {
          if (!item || typeof item !== "object") continue;
          const o = item as Record<string, unknown>;
          const href = typeof o.href === "string" ? o.href.trim() : "";
          const label = typeof o.label === "string" ? o.label.trim() : "";
          const shortLabel =
            typeof o.shortLabel === "string" ? o.shortLabel.trim() : label;
          if (href && label) parsed.push({ href, label, shortLabel: shortLabel || label });
        }
        catalogLinks = parsed;
      }
      support = await saveSupportSettings({
        monoJarUrl:
          typeof s.monoJarUrl === "string" ? s.monoJarUrl : support.monoJarUrl,
        blurb: typeof s.blurb === "string" ? s.blurb : support.blurb,
        catalogLinks,
      });
    }

    return NextResponse.json({ connect, support });
  } catch {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}
