import { NextResponse } from "next/server";
import { getSessionUserIdFromCookies } from "@/lib/auth-session";
import {
  listFaqItems,
  replaceFaqItems,
  requireAdminUserId,
} from "@/lib/site-content";
import { revalidateFaqPublic } from "@/lib/public-content-cache";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await requireAdminUserId(
      await getSessionUserIdFromCookies(),
    );
    if (!userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const items = await listFaqItems();
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
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return NextResponse.json(
        { error: "Потрібен непорожній список FAQ." },
        { status: 400 },
      );
    }

    const items: { sort_order: number; question: string; answer_html: string }[] =
      [];
    for (let i = 0; i < rawItems.length; i++) {
      const it = rawItems[i] as Record<string, unknown>;
      const question = typeof it.question === "string" ? it.question.trim() : "";
      const answer_html =
        typeof it.answer_html === "string"
          ? it.answer_html.trim()
          : typeof it.answer === "string"
            ? it.answer.trim()
            : "";
      if (!question || !answer_html) {
        return NextResponse.json(
          { error: `Пункт ${i + 1}: заповни питання і відповідь.` },
          { status: 400 },
        );
      }
      if (question.length > 500) {
        return NextResponse.json(
          { error: `Пункт ${i + 1}: питання занадто довге.` },
          { status: 400 },
        );
      }
      items.push({
        sort_order: i + 1,
        question,
        answer_html,
      });
    }

    const saved = await replaceFaqItems(items);
    revalidateFaqPublic();
    return NextResponse.json({ items: saved });
  } catch {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}
