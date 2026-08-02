import { NextResponse } from "next/server";
import { getSessionUserIdFromCookies } from "@/lib/auth-session";
import {
  listSupportCards,
  replaceSupportCards,
  requireAdminUserId,
  type SupportCardInput,
} from "@/lib/site-content";
import {
  normalizePriceTiers,
  parsePriceTiersJson,
  summarizePriceLabel,
  type SupportPriceTier,
} from "@/lib/support-price-tiers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await requireAdminUserId(
      await getSessionUserIdFromCookies(),
    );
    if (!userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const items = await listSupportCards();
    return NextResponse.json({ items });
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

    const rawItems = (body as { items?: unknown }).items;
    if (!Array.isArray(rawItems)) {
      return NextResponse.json(
        { error: "Потрібен список карток (можна порожній)." },
        { status: 400 },
      );
    }

    const items: SupportCardInput[] = [];
    for (let i = 0; i < rawItems.length; i++) {
      const it = rawItems[i] as Record<string, unknown>;
      const title = typeof it.title === "string" ? it.title.trim() : "";
      const description =
        typeof it.description === "string" ? it.description.trim() : "";
      const image_url =
        typeof it.image_url === "string" ? it.image_url.trim() : "";
      const button_url =
        typeof it.button_url === "string" ? it.button_url.trim() : "";
      const quantity_enabled =
        typeof it.quantity_enabled === "boolean"
          ? it.quantity_enabled
          : it.quantity_enabled !== false && it.quantity_enabled !== "false";

      let tiers: SupportPriceTier[] = [];
      if (Array.isArray(it.price_tiers) || typeof it.price_tiers === "string") {
        tiers = normalizePriceTiers(parsePriceTiersJson(it.price_tiers));
      }
      if (tiers.length === 0) {
        const price_label =
          typeof it.price_label === "string" ? it.price_label.trim() : "";
        if (price_label) {
          tiers = [{ label: "", price_label }];
        }
      }

      const price_label = summarizePriceLabel(tiers);

      if (!title || !description || !image_url || tiers.length === 0) {
        return NextResponse.json(
          {
            error: `Картка ${i + 1}: заповни заголовок, опис, фото і хоча б одну ціну.`,
          },
          { status: 400 },
        );
      }
      if (title.length > 200) {
        return NextResponse.json(
          { error: `Картка ${i + 1}: заголовок занадто довгий.` },
          { status: 400 },
        );
      }
      for (const t of tiers) {
        if (t.price_label.length > 64 || t.label.length > 64) {
          return NextResponse.json(
            { error: `Картка ${i + 1}: варіант ціни занадто довгий.` },
            { status: 400 },
          );
        }
      }
      if (image_url.startsWith("data:")) {
        return NextResponse.json(
          {
            error: `Картка ${i + 1}: спочатку завантаж фото (кнопка «Завантажити фото»), не вставляй data URL.`,
          },
          { status: 400 },
        );
      }
      if (image_url.length > 2000) {
        return NextResponse.json(
          { error: `Картка ${i + 1}: URL фото занадто довгий.` },
          { status: 400 },
        );
      }

      items.push({
        sort_order: i + 1,
        title,
        description,
        image_url,
        price_label,
        price_tiers: tiers,
        button_url,
        quantity_enabled: Boolean(quantity_enabled),
      });
    }

    const saved = await replaceSupportCards(items);
    return NextResponse.json({ items: saved });
  } catch {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}
