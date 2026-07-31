import { getSql } from "@/lib/db";
import {
  notifyProposalResultsBatch,
  type ProposalExpiredNotifyRow,
} from "@/lib/notify-proposal";
import { PROPOSAL_MIN_VOTES_FOR_RESULT } from "@/lib/proposal-ui";

/** Результат `sql` у режимі рядків-об’єктів; тип драйвера занадто широкий для union. */
function rowsOf(r: unknown): Record<string, unknown>[] {
  return r as Record<string, unknown>[];
}

let authProviderColumnsEnsured = false;

/** Discord + Google: discord_id nullable, google_id unique. */
async function ensureAuthProviderColumns(): Promise<void> {
  if (authProviderColumnsEnsured) return;
  const sql = getSql();
  await sql`ALTER TABLE users ALTER COLUMN discord_id DROP NOT NULL`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(64)`;
  await sql`ALTER TABLE users ALTER COLUMN avatar TYPE VARCHAR(512)`;
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS users_google_id_uidx
    ON users (google_id)
  `;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS game_nickname VARCHAR(16)`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_avatar TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20)`;
  await sql`UPDATE users SET role = 'user' WHERE role IS NULL OR trim(role) = ''`;
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS users_game_nickname_uidx
    ON users (game_nickname)
    WHERE game_nickname IS NOT NULL
  `;
  authProviderColumnsEnsured = true;
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

/** Закриває прострочені active-пропозиції; надсилає Discord/Telegram про результати (не блокує відповідь при помилках вебхуків).
 *  Якщо голосів менше PROPOSAL_MIN_VOTES_FOR_RESULT — статус cancelled (скасовано через низьку явку). */
async function expireActiveProposals(): Promise<ProposalExpiredNotifyRow[]> {
  const sql = getSql();
  const minVotes = PROPOSAL_MIN_VOTES_FOR_RESULT;
  const rows = rowsOf(await sql`
    WITH expired AS (
      SELECT
        p.id,
        p.title,
        COALESCE(SUM(CASE WHEN v.vote = 1 THEN 1 ELSE 0 END), 0)::int AS yes_votes,
        COALESCE(SUM(CASE WHEN v.vote = 0 THEN 1 ELSE 0 END), 0)::int AS no_votes
      FROM proposals p
      LEFT JOIN votes v ON v.proposal_id = p.id
      WHERE p.status = 'active' AND p.ends_at < NOW()
      GROUP BY p.id, p.title
    ),
    upd AS (
      UPDATE proposals p
      SET status = CASE
        WHEN e.yes_votes + e.no_votes < ${minVotes} THEN 'cancelled'
        ELSE 'closed'
      END
      FROM expired e
      WHERE p.id = e.id
      RETURNING p.id, p.title, p.status
    )
    SELECT
      upd.id,
      upd.title,
      upd.status,
      e.yes_votes,
      e.no_votes
    FROM upd
    INNER JOIN expired e ON e.id = upd.id
  `);
  const closed: ProposalExpiredNotifyRow[] = rows.map((r) => ({
    id: num(r.id),
    title: String(r.title ?? ""),
    yes_votes: num(r.yes_votes),
    no_votes: num(r.no_votes),
    status: String(r.status ?? "closed"),
  }));
  if (closed.length > 0) {
    void notifyProposalResultsBatch(closed).catch(() => {});
  }
  return closed;
}

export async function listProposalsForUser(
  currentUserId: number | null,
): Promise<ProposalRow[]> {
  await ensureAuthProviderColumns();
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
      COALESCE(NULLIF(TRIM(u.game_nickname), ''), u.username) AS author_username,
      COALESCE(SUM(CASE WHEN v.vote = 1 THEN 1 ELSE 0 END), 0)::int AS yes_votes,
      COALESCE(SUM(CASE WHEN v.vote = 0 THEN 1 ELSE 0 END), 0)::int AS no_votes,
      (SELECT v2.vote FROM votes v2
       WHERE v2.proposal_id = p.id AND v2.user_id = ${uid}
       LIMIT 1) AS user_vote
    FROM proposals p
    INNER JOIN users u ON u.id = p.user_id
    LEFT JOIN votes v ON v.proposal_id = p.id
    GROUP BY p.id, p.user_id, p.title, p.description, p.status, p.created_at, p.ends_at, u.username, u.game_nickname
    ORDER BY p.created_at DESC
  `);
  return rows.map((r) => mapProposalRow(r));
}

export async function getProposalForUser(
  id: number,
  currentUserId: number | null,
): Promise<ProposalRow | null> {
  await ensureAuthProviderColumns();
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
      COALESCE(NULLIF(TRIM(u.game_nickname), ''), u.username) AS author_username,
      COALESCE(SUM(CASE WHEN v.vote = 1 THEN 1 ELSE 0 END), 0)::int AS yes_votes,
      COALESCE(SUM(CASE WHEN v.vote = 0 THEN 1 ELSE 0 END), 0)::int AS no_votes,
      (SELECT v2.vote FROM votes v2
       WHERE v2.proposal_id = p.id AND v2.user_id = ${uid}
       LIMIT 1) AS user_vote
    FROM proposals p
    INNER JOIN users u ON u.id = p.user_id
    LEFT JOIN votes v ON v.proposal_id = p.id
    WHERE p.id = ${id}
    GROUP BY p.id, p.user_id, p.title, p.description, p.status, p.created_at, p.ends_at, u.username, u.game_nickname
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

/** Дострокове закриття лише автором, поки статус active (незалежно від ends_at). */
export async function closeProposalByAuthor(
  proposalId: number,
  userId: number,
): Promise<boolean> {
  const sql = getSql();
  const rows = rowsOf(await sql`
    UPDATE proposals
    SET status = 'closed'
    WHERE id = ${proposalId}
      AND user_id = ${userId}
      AND status = 'active'
    RETURNING id
  `);
  return rows.length > 0;
}

/** Видалення пропозиції лише автором (голоси зникають через ON DELETE CASCADE). */
export async function deleteProposalByAuthor(
  proposalId: number,
  userId: number,
): Promise<boolean> {
  const sql = getSql();
  const rows = rowsOf(await sql`
    DELETE FROM proposals
    WHERE id = ${proposalId} AND user_id = ${userId}
    RETURNING id
  `);
  return rows.length > 0;
}

export async function upsertDiscordUser(params: {
  discordId: string;
  username: string;
  avatar: string | null;
}): Promise<number> {
  await ensureAuthProviderColumns();
  const sql = getSql();
  const rows = rowsOf(await sql`
    INSERT INTO users (discord_id, username, avatar)
    VALUES (${params.discordId}, ${params.username}, ${params.avatar})
    ON CONFLICT (discord_id) DO UPDATE SET
      username = EXCLUDED.username,
      avatar = CASE
        WHEN users.custom_avatar IS NULL OR TRIM(users.custom_avatar) = ''
        THEN EXCLUDED.avatar
        ELSE users.avatar
      END
    RETURNING id
  `);
  const id = rows[0]?.id;
  return num(id);
}

export async function upsertGoogleUser(params: {
  googleId: string;
  username: string;
  avatarUrl: string | null;
}): Promise<number> {
  await ensureAuthProviderColumns();
  const sql = getSql();
  const rows = rowsOf(await sql`
    INSERT INTO users (google_id, username, avatar)
    VALUES (${params.googleId}, ${params.username}, ${params.avatarUrl})
    ON CONFLICT (google_id) DO UPDATE SET
      username = EXCLUDED.username,
      avatar = CASE
        WHEN users.custom_avatar IS NULL OR TRIM(users.custom_avatar) = ''
        THEN EXCLUDED.avatar
        ELSE users.avatar
      END
    RETURNING id
  `);
  const id = rows[0]?.id;
  return num(id);
}

export async function getUserPublicById(id: number): Promise<{
  id: number;
  username: string;
  avatar: string | null;
  discord_id: string | null;
  google_id: string | null;
  game_nickname: string | null;
  custom_avatar: string | null;
  role: "user" | "admin";
} | null> {
  await ensureAuthProviderColumns();
  const sql = getSql();
  const rows = rowsOf(await sql`
    SELECT id, username, avatar, discord_id, google_id, game_nickname, custom_avatar, role
    FROM users
    WHERE id = ${id}
    LIMIT 1
  `);
  const r = rows[0];
  if (!r) return null;
  const gameNickname =
    r.game_nickname === null || r.game_nickname === undefined
      ? null
      : String(r.game_nickname);
  const username = String(r.username ?? "");
  let role: "user" | "admin" =
    String(r.role ?? "").toLowerCase() === "admin" ? "admin" : "user";
  const nickLower = (gameNickname ?? username).trim().toLowerCase();
  if (nickLower === "way_zeman" && role !== "admin") {
    await sql`UPDATE users SET role = 'admin' WHERE id = ${id}`;
    role = "admin";
  }
  return {
    id: num(r.id),
    username,
    avatar: r.avatar === null || r.avatar === undefined ? null : String(r.avatar),
    discord_id:
      r.discord_id === null || r.discord_id === undefined
        ? null
        : String(r.discord_id),
    google_id:
      r.google_id === null || r.google_id === undefined
        ? null
        : String(r.google_id),
    game_nickname: gameNickname,
    custom_avatar:
      r.custom_avatar === null || r.custom_avatar === undefined
        ? null
        : String(r.custom_avatar),
    role,
  };
}

export async function userHasGameNickname(userId: number): Promise<boolean> {
  const u = await getUserPublicById(userId);
  return Boolean(u?.game_nickname?.trim());
}

/** Оновлює нік і/або кастомний аватар. null для customAvatar = не чіпати; "" = скинути. */
export async function updateUserProfile(params: {
  userId: number;
  gameNickname?: string;
  customAvatar?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await ensureAuthProviderColumns();
  const sql = getSql();

  if (params.gameNickname !== undefined) {
    const nick = params.gameNickname.trim();
    try {
      await sql`
        UPDATE users
        SET game_nickname = ${nick}
        WHERE id = ${params.userId}
      `;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/unique|duplicate/i.test(msg)) {
        return { ok: false, error: "Цей нікнейм уже зайнятий." };
      }
      throw err;
    }
  }

  if (params.customAvatar !== undefined) {
    const av =
      params.customAvatar === null || params.customAvatar === ""
        ? null
        : params.customAvatar;
    await sql`
      UPDATE users
      SET custom_avatar = ${av}
      WHERE id = ${params.userId}
    `;
  }

  return { ok: true };
}

export type ProposalVoterRow = {
  user_id: number;
  display_name: string;
  avatar: string | null;
  custom_avatar: string | null;
  discord_id: string | null;
  vote: 0 | 1;
};

export async function listProposalVoters(
  proposalId: number,
): Promise<ProposalVoterRow[]> {
  await ensureAuthProviderColumns();
  const sql = getSql();
  const rows = rowsOf(await sql`
    SELECT
      v.user_id,
      v.vote,
      COALESCE(NULLIF(TRIM(u.game_nickname), ''), u.username) AS display_name,
      u.avatar,
      u.custom_avatar,
      u.discord_id
    FROM votes v
    INNER JOIN users u ON u.id = v.user_id
    WHERE v.proposal_id = ${proposalId}
    ORDER BY v.created_at ASC
  `);
  return rows.map((r) => {
    const voteNum = num(r.vote);
    return {
      user_id: num(r.user_id),
      display_name: String(r.display_name ?? ""),
      avatar:
        r.avatar === null || r.avatar === undefined ? null : String(r.avatar),
      custom_avatar:
        r.custom_avatar === null || r.custom_avatar === undefined
          ? null
          : String(r.custom_avatar),
      discord_id:
        r.discord_id === null || r.discord_id === undefined
          ? null
          : String(r.discord_id),
      vote: (voteNum === 1 ? 1 : 0) as 0 | 1,
    };
  });
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

/** Для cron: закрити прострочені та надіслати сповіщення (те саме, що й при завантаженні списку). */
export async function runExpireProposalsUpdate(): Promise<number> {
  const closed = await expireActiveProposals();
  return closed.length;
}

export type ProposalCommentRow = {
  id: number;
  user_id: number;
  parent_id: number | null;
  body: string;
  created_at: Date;
  author_username: string;
  author_avatar: string | null;
  author_custom_avatar: string | null;
  author_discord_id: string | null;
};

function mapCommentRow(r: Record<string, unknown>): ProposalCommentRow {
  const parentRaw = r.parent_id;
  let parentId: number | null = null;
  if (parentRaw !== null && parentRaw !== undefined) {
    const n = num(parentRaw);
    if (n > 0) parentId = n;
  }
  return {
    id: num(r.id),
    user_id: num(r.user_id),
    parent_id: parentId,
    body: String(r.body ?? ""),
    created_at: asDate(r.created_at),
    author_username: String(r.author_username ?? ""),
    author_avatar:
      r.author_avatar === null || r.author_avatar === undefined
        ? null
        : String(r.author_avatar),
    author_custom_avatar:
      r.author_custom_avatar === null || r.author_custom_avatar === undefined
        ? null
        : String(r.author_custom_avatar),
    author_discord_id:
      r.author_discord_id === null || r.author_discord_id === undefined
        ? null
        : String(r.author_discord_id),
  };
}

let commentParentColumnEnsured = false;

async function ensureCommentParentColumn(): Promise<void> {
  if (commentParentColumnEnsured) return;
  const sql = getSql();
  await sql`
    ALTER TABLE proposal_comments
    ADD COLUMN IF NOT EXISTS parent_id INT
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_proposal_comments_parent
    ON proposal_comments (parent_id)
  `;
  commentParentColumnEnsured = true;
}

export async function listProposalComments(
  proposalId: number,
): Promise<ProposalCommentRow[]> {
  await ensureAuthProviderColumns();
  await ensureCommentParentColumn();
  const sql = getSql();
  const rows = rowsOf(await sql`
    SELECT
      c.id,
      c.user_id,
      c.parent_id,
      c.body,
      c.created_at,
      COALESCE(NULLIF(TRIM(u.game_nickname), ''), u.username) AS author_username,
      u.avatar AS author_avatar,
      u.custom_avatar AS author_custom_avatar,
      u.discord_id AS author_discord_id
    FROM proposal_comments c
    INNER JOIN users u ON u.id = c.user_id
    WHERE c.proposal_id = ${proposalId}
    ORDER BY c.created_at ASC
  `);
  return rows.map((r) => mapCommentRow(r));
}

/** Повертає null, якщо пропозиції немає або parent некоректний. */
export async function addProposalComment(params: {
  proposalId: number;
  userId: number;
  body: string;
  parentId?: number | null;
}): Promise<ProposalCommentRow | null> {
  await ensureAuthProviderColumns();
  await ensureCommentParentColumn();
  const sql = getSql();

  let parentId: number | null =
    params.parentId != null && Number.isFinite(params.parentId)
      ? Number(params.parentId)
      : null;

  if (parentId != null) {
    const parents = rowsOf(await sql`
      SELECT id, parent_id
      FROM proposal_comments
      WHERE id = ${parentId} AND proposal_id = ${params.proposalId}
      LIMIT 1
    `);
    const parent = parents[0];
    if (!parent) return null;
    // Одна глибина гілки: відповідь на відповідь чіпляємо до кореня
    const grand = parent.parent_id;
    if (grand !== null && grand !== undefined) {
      const g = num(grand);
      if (g > 0) parentId = g;
    }
  }

  const inserted = rowsOf(await sql`
    INSERT INTO proposal_comments (proposal_id, user_id, parent_id, body)
    SELECT ${params.proposalId}, ${params.userId}, ${parentId}, ${params.body}
    WHERE EXISTS (SELECT 1 FROM proposals WHERE id = ${params.proposalId})
    RETURNING id, user_id, parent_id, body, created_at
  `);
  const ins = inserted[0];
  if (!ins) return null;
  const uid = num(ins.user_id);
  const urows = rowsOf(await sql`
    SELECT
      COALESCE(NULLIF(TRIM(game_nickname), ''), username) AS author_username,
      avatar,
      custom_avatar,
      discord_id
    FROM users
    WHERE id = ${uid}
    LIMIT 1
  `);
  const u = urows[0];
  if (!u) return null;
  return mapCommentRow({
    ...ins,
    author_username: u.author_username,
    author_avatar: u.avatar,
    author_custom_avatar: u.custom_avatar,
    author_discord_id: u.discord_id,
  });
}
