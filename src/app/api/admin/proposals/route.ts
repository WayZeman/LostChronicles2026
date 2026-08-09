import { NextResponse } from "next/server";
import { getSessionUserIdFromCookies } from "@/lib/auth-session";
import { requireAdminUserId } from "@/lib/site-content";
import { listProposalsForAdmin, isProposalVotingOpen } from "@/lib/proposals-queries";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await requireAdminUserId(
      await getSessionUserIdFromCookies(),
    );
    if (!userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rows = await listProposalsForAdmin();
    return NextResponse.json({
      proposals: rows.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        kind: p.kind,
        status: p.status,
        cancel_reason: p.cancel_reason,
        created_at: p.created_at.toISOString(),
        ends_at: p.ends_at.toISOString(),
        author_username: p.author_username,
        yes_votes: p.yes_votes,
        no_votes: p.no_votes,
        total_votes: p.total_votes,
        options: p.options,
        voting_open: isProposalVotingOpen(p),
      })),
    });
  } catch {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}
