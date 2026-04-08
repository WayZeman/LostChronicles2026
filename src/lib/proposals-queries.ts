import { getSql } from "@/lib/db";

/** Результат `sql` у режимі рядків-об’єктів; тип драйвера занадто широкий для union. */
function rowsOf(r: unknown): Record<string, unknown>[] {
  return r as Record<string, unknown>[];
}

export type ProposalRow = {
  id: number;
  user_id: number;
  title: string;
  description: string;
  status: string;
  created_at: Date;
  ends_at: Date;
  author_username: string;
  yes_votes: number;
  no_votes: number;
  user_vote: number | null;
};

function num(v: unknown): number {
  if (v === null || v === undefined) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function asDate(v: unknown): Date {
  if (v instanceof Date) return v;
  return new Date(String(v));
}

function mapProposalRow(r: Record<string, unknown>): ProposalRow {
  const uv = r.user_vote;
  let userVote: number | null = null;
  if (uv !== null && uv !== undefined) {
    const n = num(uv);
    if (n === 0 || n === 1) userVote = n;
  }
  return {
    id: num(r.id),
    user_id: num(r.user_id),
    title: String(r.title ?? ""),
    description: String(r.description ?? ""),
    status: String(r.status ?? ""),
    created_at: asDate(r.created_at),
    ends_at: asDate(r.ends_at),
    author_username: String(r.author_username ?? ""),
    yes_votes: num(r.yes_votes),
    no_votes: num(r.no_votes),
    user_vote: userVote,
  };
}

async function expireActiveProposals(): Promise<void> {
  const sql = getSql();
  await sql`
    UPDATE proposals
    SET status = 'closed'
    WHERE status = 'active' AND ends_at < NOW()
  `;
}

export async function listProposalsForUser(
  currentUserId: number | null,
): Promise<ProposalRow[]> {
  await expireActiveProposals();
  const sql = getSql();
  const uid = currentUserId ?? 0;
  const rows = rowsOf(await sql`
    SELECT
      p.id,
      p.user_id,
      p.title,
      p.description,
      p.status,
      p.created_at,
      p.ends_at,
      u.username AS author_username,
      COALESCE(SUM(CASE WHEN v.vote = 1 THEN 1 ELSE 0 END), 0)::int AS yes_votes,
      COALESCE(SUM(CASE WHEN v.vote = 0 THEN 1 ELSE 0 END), 0)::int AS no_votes,
      (SELECT v2.vote FROM votes v2
       WHERE v2.proposal_id = p.id AND v2.user_id = ${uid}
       LIMIT 1) AS user_vote
    FROM proposals p
    INNER JOIN users u ON u.id = p.user_id
    LEFT JOIN votes v ON v.proposal_id = p.id
    GROUP BY p.id, p.user_id, p.title, p.description, p.status, p.created_at, p.ends_at, u.username
    ORDER BY p.created_at DESC
  `);
  return rows.map((r) => mapProposalRow(r));
}

export async function getProposalForUser(
  id: number,
  currentUserId: number | null,
): Promise<ProposalRow | null> {
  await expireActiveProposals();
  const sql = getSql();
  const uid = currentUserId ?? 0;
  const rows = rowsOf(await sql`
    SELECT
      p.id,
      p.user_id,
      p.title,
      p.description,
      p.status,
      p.created_at,
      p.ends_at,
      u.username AS author_username,
      COALESCE(SUM(CASE WHEN v.vote = 1 THEN 1 ELSE 0 END), 0)::int AS yes_votes,
      COALESCE(SUM(CASE WHEN v.vote = 0 THEN 1 ELSE 0 END), 0)::int AS no_votes,
      (SELECT v2.vote FROM votes v2
       WHERE v2.proposal_id = p.id AND v2.user_id = ${uid}
       LIMIT 1) AS user_vote
    FROM proposals p
    INNER JOIN users u ON u.id = p.user_id
    LEFT JOIN votes v ON v.proposal_id = p.id
    WHERE p.id = ${id}
    GROUP BY p.id, p.user_id, p.title, p.description, p.status, p.created_at, p.ends_at, u.username
    LIMIT 1
  `);
  if (!rows.length) return null;
  return mapProposalRow(rows[0]!);
}

export function isProposalVotingOpen(row: {
  status: string;
  ends_at: Date;
}): boolean {
  if (row.status !== "active") return false;
  return new Date(row.ends_at).getTime() > Date.now();
}

export async function upsertDiscordUser(params: {
  discordId: string;
  username: string;
  avatar: string | null;
}): Promise<number> {
  const sql = getSql();
  const rows = rowsOf(await sql`
    INSERT INTO users (discord_id, username, avatar)
    VALUES (${params.discordId}, ${params.username}, ${params.avatar})
    ON CONFLICT (discord_id) DO UPDATE SET
      username = EXCLUDED.username,
      avatar = EXCLUDED.avatar
    RETURNING id
  `);
  const id = rows[0]?.id;
  return num(id);
}

export async function getUserPublicById(id: number): Promise<{
  id: number;
  username: string;
  avatar: string | null;
  discord_id: string;
} | null> {
  const sql = getSql();
  const rows = rowsOf(await sql`
    SELECT id, username, avatar, discord_id
    FROM users
    WHERE id = ${id}
    LIMIT 1
  `);
  const r = rows[0];
  if (!r) return null;
  return {
    id: num(r.id),
    username: String(r.username ?? ""),
    avatar: r.avatar === null || r.avatar === undefined ? null : String(r.avatar),
    discord_id: String(r.discord_id ?? ""),
  };
}

export async function createProposalRecord(params: {
  userId: number;
  title: string;
  description: string;
  endsAt: Date;
}): Promise<number> {
  const sql = getSql();
  const rows = rowsOf(await sql`
    INSERT INTO proposals (user_id, title, description, status, ends_at)
    VALUES (${params.userId}, ${params.title}, ${params.description}, 'active', ${params.endsAt})
    RETURNING id
  `);
  return num(rows[0]?.id);
}

export async function setUserVote(params: {
  proposalId: number;
  userId: number;
  vote: 0 | 1;
}): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO votes (proposal_id, user_id, vote)
    VALUES (${params.proposalId}, ${params.userId}, ${params.vote})
    ON CONFLICT (proposal_id, user_id) DO UPDATE SET
      vote = EXCLUDED.vote
  `;
}

export type ProposalToCloseRow = {
  id: number;
  title: string;
  yes_votes: number;
  no_votes: number;
};

export async function listProposalsDueForClosing(): Promise<
  ProposalToCloseRow[]
> {
  const sql = getSql();
  const rows = rowsOf(await sql`
    SELECT
      p.id,
      p.title,
      COALESCE(SUM(CASE WHEN v.vote = 1 THEN 1 ELSE 0 END), 0)::int AS yes_votes,
      COALESCE(SUM(CASE WHEN v.vote = 0 THEN 1 ELSE 0 END), 0)::int AS no_votes
    FROM proposals p
    LEFT JOIN votes v ON v.proposal_id = p.id
    WHERE p.status = 'active' AND p.ends_at < NOW()
    GROUP BY p.id, p.title
  `);
  return rows.map((r) => {
    const row = r;
    return {
      id: num(row.id),
      title: String(row.title ?? ""),
      yes_votes: num(row.yes_votes),
      no_votes: num(row.no_votes),
    };
  });
}

export async function runExpireProposalsUpdate(): Promise<void> {
  await expireActiveProposals();
}
