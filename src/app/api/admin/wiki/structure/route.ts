import { NextResponse } from "next/server";
import { getSessionUserIdFromCookies } from "@/lib/auth-session";
import { requireWikiEditorUserId } from "@/lib/wiki-pages";
import {
  createWikiCategory,
  createWikiSection,
  getWikiHomeTree,
  seedWikiStructureIfEmpty,
} from "@/lib/wiki-structure";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const adminId = await requireWikiEditorUserId(
      await getSessionUserIdFromCookies(),
    );
    if (!adminId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await seedWikiStructureIfEmpty();
    const tree = await getWikiHomeTree();
    return NextResponse.json({ tree });
  } catch {
    return NextResponse.json(
      { error: "Database unavailable", tree: { sections: [] } },
      { status: 503 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireWikiEditorUserId(
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
      action?: string;
      title?: string;
      description?: string;
      section_id?: number;
      slug?: string;
    };

    if (b.action === "create_section") {
      if (!String(b.title ?? "").trim()) {
        return NextResponse.json(
          { error: "Потрібна назва розділу." },
          { status: 400 },
        );
      }
      const section = await createWikiSection({
        title: String(b.title),
        description: String(b.description ?? ""),
      });
      const tree = await getWikiHomeTree();
      return NextResponse.json({ ok: true, section, tree });
    }

    if (b.action === "create_category") {
      const sectionId = Number(b.section_id);
      if (!Number.isFinite(sectionId) || sectionId < 1) {
        return NextResponse.json(
          { error: "Некоректний section_id." },
          { status: 400 },
        );
      }
      const result = await createWikiCategory({
        section_id: sectionId,
        title: String(b.title ?? ""),
        description: String(b.description ?? ""),
        slug: b.slug ? String(b.slug) : undefined,
      });
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      const tree = await getWikiHomeTree();
      return NextResponse.json({ ok: true, category: result.category, tree });
    }

    if (b.action === "seed") {
      const result = await seedWikiStructureIfEmpty();
      const tree = await getWikiHomeTree();
      return NextResponse.json({ ok: true, ...result, tree });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}
