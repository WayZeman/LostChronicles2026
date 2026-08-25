import { NextResponse } from "next/server";

import {
  ackIngameJob,
  listPendingIngameJobs,
  type IngameJobAction,
} from "@/lib/applications";
import { sendAnketaTelegramText } from "@/lib/notify-application";

export const dynamic = "force-dynamic";

function expectedSecret(): string {
  return (
    process.env.MINECRAFT_ANKETA_SYNC_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    ""
  );
}

function isAuthorized(req: Request): boolean {
  const secret = expectedSecret();
  if (!secret) return false;
  const auth = req.headers.get("authorization") || "";
  if (auth === `Bearer ${secret}`) return true;
  const header = req.headers.get("x-anketa-secret") || "";
  return header === secret;
}

/** Плагін забирає чергу: кого promote / demote в LuckPerms. */
export async function GET(req: Request) {
  if (!expectedSecret()) {
    return NextResponse.json(
      { error: "CRON_SECRET / MINECRAFT_ANKETA_SYNC_SECRET not set" },
      { status: 501 },
    );
  }
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const jobs = await listPendingIngameJobs(20);
    return NextResponse.json({ jobs });
  } catch (e) {
    console.error("[anketa-sync] list failed:", e);
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

/** Плагін підтверджує, що команда LuckPerms виконана. */
export async function POST(req: Request) {
  if (!expectedSecret()) {
    return NextResponse.json(
      { error: "CRON_SECRET / MINECRAFT_ANKETA_SYNC_SECRET not set" },
      { status: 501 },
    );
  }
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const raw = body as {
    id?: unknown;
    action?: unknown;
    ok?: unknown;
    error?: unknown;
  };
  const id = Number(raw.id);
  const actionRaw = String(raw.action ?? "").trim().toLowerCase();
  const action: IngameJobAction | null =
    actionRaw === "promote" || actionRaw === "demote" ? actionRaw : null;
  const ok = raw.ok === true;
  const errText = String(raw.error ?? "").trim();
  const detail = String(
    (raw as { detail?: unknown }).detail ?? "",
  ).trim();

  if (!Number.isFinite(id) || id < 1 || !action) {
    return NextResponse.json(
      { error: "Need id and action=promote|demote" },
      { status: 400 },
    );
  }

  try {
    const acked = await ackIngameJob(id, action, ok);
    if (!ok && action === "demote" && !acked) {
      return NextResponse.json({ ok: false, retry: true });
    }
    if (!acked) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const nick = acked.nickname || "—";
    if (ok) {
      await sendAnketaTelegramText(
        action === "promote"
          ? `✅ Сервер підтвердив: ${nick} додано\n` +
              `Анкета #${acked.ordinal}\n` +
              (detail ? `${detail}\n` : "") +
              `Статус: На сервері`
          : `✅ Сервер підтвердив: з ${nick} знято ранг\n` +
              `Анкета #${acked.ordinal}\n` +
              (detail ? `${detail}\n` : "") +
              `Статус: Не прийнято`,
      );
    } else {
      await sendAnketaTelegramText(
        `⚠️ Сервер НЕ підтвердив зміну для ${nick}\n` +
          `Анкета #${acked.ordinal}\n` +
          (action === "promote"
            ? "Статус лишився: не додано на сервер\n"
            : "Ранг на сервері не змінено\n") +
          (errText ? `Помилка: ${errText}` : "Перевір нік у анкеті і LuckPerms."),
      );
    }

    return NextResponse.json({
      ok,
      id,
      action,
      nickname: nick,
      ordinal: acked.ordinal,
    });
  } catch (e) {
    console.error("[anketa-sync] ack failed:", e);
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
