import { NextResponse } from "next/server";
import { getSessionUserIdFromCookies } from "@/lib/auth-session";
import { collectDiamond } from "@/lib/diamond-hunt";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const userId = await getSessionUserIdFromCookies();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const spotId =
      body && typeof body === "object" && "spotId" in body
        ? String((body as { spotId?: unknown }).spotId ?? "").trim()
        : "";
    if (!spotId || spotId.length > 64) {
      return NextResponse.json({ error: "Некоректний діамант." }, { status: 400 });
    }

    const result = await collectDiamond({ userId, spotId });
    if (!result.ok) {
      const status = result.code === "inactive" ? 403 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({
      ok: true,
      balance: result.balance,
      total: result.total,
      finishPlace: result.finishPlace,
      justFinished: result.justFinished,
    });
  } catch {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}
