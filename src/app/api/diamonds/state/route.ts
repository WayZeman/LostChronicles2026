import { NextResponse } from "next/server";
import { getSessionUserIdFromCookies } from "@/lib/auth-session";
import { getDiamondPlayerState } from "@/lib/diamond-hunt";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const userId = await getSessionUserIdFromCookies();
    if (!userId) {
      return NextResponse.json({ user: null, active: false });
    }

    const url = new URL(req.url);
    const path = url.searchParams.get("path") || "/";
    const state = await getDiamondPlayerState({ userId, pathname: path });
    return NextResponse.json({
      user: userId,
      ...state,
    });
  } catch {
    return NextResponse.json(
      { error: "Database unavailable", user: null, active: false },
      { status: 503 },
    );
  }
}
