import { NextResponse } from "next/server";

import {
  getApplyFormConfig,
  saveApplyFormConfig,
} from "@/lib/application-form-config";
import {
  countApplications,
  deleteApplication,
  getApplicationById,
  listApplications,
} from "@/lib/applications";
import { notifyApplicationTelegram } from "@/lib/notify-application";
import { getSessionUserIdFromCookies } from "@/lib/auth-session";
import { requireAdminUserId } from "@/lib/site-content";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  return requireAdminUserId(await getSessionUserIdFromCookies());
}

export async function GET() {
  try {
    const userId = await requireAdmin();
    if (!userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const [config, applications, total] = await Promise.all([
      getApplyFormConfig(),
      listApplications(100),
      countApplications(),
    ]);
    return NextResponse.json({ config, applications, total });
  } catch {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    const userId = await requireAdmin();
    if (!userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const configRaw =
      body && typeof body === "object"
        ? (body as { config?: unknown }).config ?? body
        : body;

    const config = await saveApplyFormConfig(configRaw);
    return NextResponse.json({ config });
  } catch {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const userId = await requireAdmin();
    if (!userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(req.url);
    const id = Number(url.searchParams.get("id"));
    if (!Number.isInteger(id) || id < 1) {
      return NextResponse.json({ error: "Невірний id" }, { status: 400 });
    }

    const ok = await deleteApplication(id);
    if (!ok) {
      return NextResponse.json({ error: "Не знайдено" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}

/** Повторно надіслати анкету в Telegram: POST { action: "resend", id } */
export async function POST(req: Request) {
  try {
    const userId = await requireAdmin();
    if (!userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const b = (body || {}) as Record<string, unknown>;
    if (b.action !== "resend") {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
    const id = Number(b.id);
    if (!Number.isInteger(id) || id < 1) {
      return NextResponse.json({ error: "Невірний id" }, { status: 400 });
    }

    const row = await getApplicationById(id);
    if (!row) {
      return NextResponse.json({ error: "Не знайдено" }, { status: 404 });
    }

    const telegram = await notifyApplicationTelegram(row);
    return NextResponse.json({ ok: telegram, telegram });
  } catch {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}
