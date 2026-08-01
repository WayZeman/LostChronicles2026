import { NextResponse } from "next/server";
import { getSessionUserIdFromCookies } from "@/lib/auth-session";
import {
  listSupportCards,
  replaceSupportCards,
  requireAdminUserId,
  type SupportCardInput,
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
      const price_label =
        typeof it.price_label === "string" ? it.price_label.trim() : "";
      const button_url =
        typeof it.button_url === "string" ? it.button_url.trim() : "";
      const quantity_enabled =
        typeof it.quantity_enabled === "boolean"
          ? it.quantity_enabled
          : it.quantity_enabled !== false && it.quantity_enabled !== "false";

      if (!title || !description || !image_url || !price_label) {
        return NextResponse.json(
          {
            error: `Картка ${i + 1}: заповни заголовок, опис, фото і ціну.`,
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
      if (price_label.length > 64) {
        return NextResponse.json(
          { error: `Картка ${i + 1}: ціна занадто довга.` },
          { status: 400 },
        );
      }
      if (image_url.length > 900_000) {
        return NextResponse.json(
          { error: `Картка ${i + 1}: фото занадто велике.` },
          { status: 400 },
        );
      }

      items.push({
        sort_order: i + 1,
        title,
        description,
        image_url,
        price_label,
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
