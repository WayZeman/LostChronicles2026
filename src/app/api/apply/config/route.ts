import { NextResponse } from "next/server";

import { getApplyFormConfig } from "@/lib/application-form-config";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = await getApplyFormConfig();
    return NextResponse.json({ config });
  } catch {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}
