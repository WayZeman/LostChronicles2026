import { getSql } from "@/lib/db";
import { normalizeRole, type UserRole } from "@/lib/admin-role";
import {
  notifyProposalResultsBatch,
  notifyProposalTieExtendedBatch,
  type ProposalExpiredNotifyRow,
} from "@/lib/notify-proposal";
import {
  PROPOSAL_KIND_CHOICE,
  PROPOSAL_KIND_YES_NO,
  type ProposalKind,
  type ProposalOptionPublic,
  isProposalKind,
} from "@/lib/proposal-kinds";
import {
  PROPOSAL_MIN_VOTES_FOR_RESULT,
  PROPOSAL_TIE_EXTENSION_DAYS,
} from "@/lib/proposal-ui";

/** Результат `sql` у режимі рядків-об’єктів; тип драйвера занадто широкий для union. */
function rowsOf(r: unknown): Record<string, unknown>[] {
  return r as Record<string, unknown>[];
}

let authProviderColumnsEnsured = false;
let pollSchemaEnsured = false;

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

/** kind + proposal_options + votes.option_id */
async function ensurePollSchema(): Promise<void> {
  if (pollSchemaEnsured) return;
  const sql = getSql();
  await sql`
    ALTER TABLE proposals
    ADD COLUMN IF NOT EXISTS kind VARCHAR(20) NOT NULL DEFAULT 'yes_no'
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS proposal_options (
      id SERIAL PRIMARY KEY,
      proposal_id INT NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
      label VARCHAR(200) NOT NULL,
      sort_order INT NOT NULL DEFAULT 0
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_proposal_options_proposal
    ON proposal_options (proposal_id, sort_order, id)
  `;
  await sql`
    ALTER TABLE votes
    ADD COLUMN IF NOT EXISTS option_id INT REFERENCES proposal_options(id) ON DELETE CASCADE
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_votes_option ON votes (option_id)
  `;
  await sql`
    ALTER TABLE proposals
    ADD COLUMN IF NOT EXISTS cancel_reason TEXT
  `;
  pollSchemaEnsured = true;
}

export type ProposalRow = {
  id: number;
  user_id: number;
  title: string;
  description: string;
  kind: ProposalKind;
  status: string;
  /** Причина скасування адміном; null якщо авто / не скасовано. */
  cancel_reason: string | null;
  created_at: Date;
  ends_at: Date;
  author_username: string;
  yes_votes: number;
  no_votes: number;
  /** yes_no: 0|1; choice: не використовується (див. user_option_id) */
  user_vote: number | null;
  user_option_id: number | null;
  options: ProposalOptionPublic[];
  /** Сума голосів (для choice і кворуму). */
  total_votes: number;
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

function mapKind(v: unknown): ProposalKind {
  const s = String(v ?? "");
  return isProposalKind(s) ? s : PROPOSAL_KIND_YES_NO;
}

function mapProposalRow(
  r: Record<string, unknown>,
  options: ProposalOptionPublic[] = [],
): ProposalRow {
  const kind = mapKind(r.kind);
  const uv = r.user_vote;
  let userVote: number | null = null;
  if (uv !== null && uv !== undefined) {
    const n = num(uv);
    if (n === 0 || n === 1) userVote = n;
  }
  const uo = r.user_option_id;
  let userOptionId: number | null = null;
  if (uo !== null && uo !== undefined) {
    const n = num(uo);
    if (n > 0) userOptionId = n;
  }
  const yes = num(r.yes_votes);
  const no = num(r.no_votes);
  const optVotes = options.reduce((s, o) => s + o.votes, 0);
  const total =
    kind === PROPOSAL_KIND_CHOICE ? optVotes : yes + no;
  const rawReason = r.cancel_reason;
  const cancelReason =
    rawReason != null && String(rawReason).trim()
      ? String(rawReason).trim()
      : null;
  return {
    id: num(r.id),
    user_id: num(r.user_id),
    title: String(r.title ?? ""),
    description: String(r.description ?? ""),
    kind,
    status: String(r.status ?? ""),
    cancel_reason: cancelReason,
    created_at: asDate(r.created_at),
    ends_at: asDate(r.ends_at),
    author_username: String(r.author_username ?? ""),
    yes_votes: yes,
    no_votes: no,
    user_vote: kind === PROPOSAL_KIND_YES_NO ? userVote : null,
    user_option_id: kind === PROPOSAL_KIND_CHOICE ? userOptionId : null,
    options,
    total_votes: total,
  };
}

async function loadOptionsByProposalIds(
  proposalIds: number[],
): Promise<Map<number, ProposalOptionPublic[]>> {
  const map = new Map<number, ProposalOptionPublic[]>();
  if (proposalIds.length === 0) return map;
  const sql = getSql();
  const rows = rowsOf(await sql`
    SELECT
      o.id,
      o.proposal_id,
      o.label,
      o.sort_order,
      COALESCE(COUNT(v.id), 0)::int AS votes
    FROM proposal_options o
    LEFT JOIN votes v ON v.option_id = o.id
    WHERE o.proposal_id = ANY(${proposalIds})
    GROUP BY o.id, o.proposal_id, o.label, o.sort_order
    ORDER BY o.sort_order ASC, o.id ASC
  `);
  for (const r of rows) {
    const pid = num(r.proposal_id);
    const list = map.get(pid) ?? [];
    list.push({
      id: num(r.id),
      label: String(r.label ?? ""),
      sort_order: num(r.sort_order),
      votes: num(r.votes),
    });
    map.set(pid, list);
  }
  return map;
}

/** Чи є нічия з достатнім кворумом (тоді голосування не фіналізуємо). */
async function isQuorumTie(params: {
  id: number;
  kind: ReturnType<typeof mapKind>;
  yes: number;
  no: number;
  total: number;
}): Promise<boolean> {
  if (params.total < PROPOSAL_MIN_VOTES_FOR_RESULT) return false;
  if (params.kind === PROPOSAL_KIND_CHOICE) {
    const opts = (await loadOptionsByProposalIds([params.id])).get(params.id) ?? [];
    const max = opts.length ? Math.max(0, ...opts.map((o) => o.votes)) : 0;
    const leaders = opts.filter((o) => o.votes === max && max > 0);
    return leaders.length > 1;
  }
  return params.yes === params.no;
}

/**
 * Закриті пропозиції з нічиєю (до правила продовження) повертаємо в active
 * і даємо +1 добу від зараз.
 */
async function reopenTiedClosedProposals(): Promise<number> {
  const sql = getSql();
  const rows = rowsOf(await sql`
    SELECT
      p.id,
      p.title,
      COALESCE(p.kind, 'yes_no') AS kind,
      COALESCE(COUNT(v.id), 0)::int AS total_votes,
      COALESCE(SUM(CASE WHEN v.vote = 1 AND v.option_id IS NULL THEN 1 ELSE 0 END), 0)::int AS yes_votes,
      COALESCE(SUM(CASE WHEN v.vote = 0 AND v.option_id IS NULL THEN 1 ELSE 0 END), 0)::int AS no_votes
    FROM proposals p
    LEFT JOIN votes v ON v.proposal_id = p.id
    WHERE p.status = 'closed'
      AND p.ends_at < NOW()
    GROUP BY p.id, p.title, p.kind
  `);
  if (rows.length === 0) return 0;

  const toReopen: { id: number; title: string }[] = [];
  for (const r of rows) {
    const id = num(r.id);
    const tied = await isQuorumTie({
      id,
      kind: mapKind(r.kind),
      yes: num(r.yes_votes),
      no: num(r.no_votes),
      total: num(r.total_votes),
    });
    if (tied) {
      toReopen.push({ id, title: String(r.title ?? "") });
    }
  }
  if (toReopen.length === 0) return 0;

  const reopenIds = toReopen.map((x) => x.id);
  await sql`
    UPDATE proposals
    SET
      status = 'active',
      ends_at = NOW() + make_interval(days => ${PROPOSAL_TIE_EXTENSION_DAYS})
    WHERE id = ANY(${reopenIds})
      AND status = 'closed'
  `;

  try {
    await notifyProposalTieExtendedBatch(toReopen);
  } catch (e) {
    console.error("[proposals] tie-extend notify (reopen) failed:", e);
  }

  return toReopen.length;
}

/** Закриває прострочені active-пропозиції; надсилає Discord/Telegram про результати (не блокує відповідь при помилках вебхуків).
 *  Якщо голосів менше PROPOSAL_MIN_VOTES_FOR_RESULT — статус cancelled (скасовано через низьку явку).
 *  Якщо кворум є, але нічия (рівна кількість) — ends_at += 1 доба, голосування триває. */
async function expireActiveProposals(): Promise<ProposalExpiredNotifyRow[]> {
  const sql = getSql();
  const minVotes = PROPOSAL_MIN_VOTES_FOR_RESULT;
  const expired = rowsOf(await sql`
    SELECT
      p.id,
      p.title,
      COALESCE(p.kind, 'yes_no') AS kind,
      COALESCE(COUNT(v.id), 0)::int AS total_votes,
      COALESCE(SUM(CASE WHEN v.vote = 1 AND v.option_id IS NULL THEN 1 ELSE 0 END), 0)::int AS yes_votes,
      COALESCE(SUM(CASE WHEN v.vote = 0 AND v.option_id IS NULL THEN 1 ELSE 0 END), 0)::int AS no_votes
    FROM proposals p
    LEFT JOIN votes v ON v.proposal_id = p.id
    WHERE p.status = 'active' AND p.ends_at < NOW()
    GROUP BY p.id, p.title, p.kind
  `);
  if (expired.length === 0) return [];

  const toCancel: number[] = [];
  const toClose: {
    id: number;
    title: string;
    kind: ReturnType<typeof mapKind>;
    yes: number;
    no: number;
    total: number;
  }[] = [];
  const toExtend: { id: number; title: string }[] = [];

  for (const r of expired) {
    const id = num(r.id);
    const kind = mapKind(r.kind);
    const total = num(r.total_votes);
    const yes = num(r.yes_votes);
    const no = num(r.no_votes);
    const title = String(r.title ?? "");

    if (total < minVotes) {
      toCancel.push(id);
      continue;
    }

    const tied = await isQuorumTie({ id, kind, yes, no, total });
    if (tied) {
      toExtend.push({ id, title });
    } else {
      toClose.push({
        id,
        title,
        kind,
        yes,
        no,
        total,
      });
    }
  }

  if (toExtend.length > 0) {
    const extendIds = toExtend.map((x) => x.id);
    await sql`
      UPDATE proposals
      SET ends_at = GREATEST(ends_at, NOW()) + make_interval(days => ${PROPOSAL_TIE_EXTENSION_DAYS})
      WHERE id = ANY(${extendIds})
        AND status = 'active'
    `;
  }

  if (toCancel.length > 0) {
    await sql`
      UPDATE proposals
      SET status = 'cancelled'
      WHERE id = ANY(${toCancel})
        AND status = 'active'
    `;
  }

  if (toClose.length > 0) {
    const closeIds = toClose.map((c) => c.id);
    await sql`
      UPDATE proposals
      SET status = 'closed'
      WHERE id = ANY(${closeIds})
        AND status = 'active'
    `;
  }

  const closed: ProposalExpiredNotifyRow[] = [];

  for (const id of toCancel) {
    const row = expired.find((e) => num(e.id) === id);
    if (!row) continue;
    closed.push({
      id,
      title: String(row.title ?? ""),
      yes_votes: num(row.yes_votes),
      no_votes: num(row.no_votes),
      status: "cancelled",
      kind: mapKind(row.kind),
      total_votes: num(row.total_votes),
    });
  }

  for (const c of toClose) {
    let summary: string | undefined;
    if (c.kind === PROPOSAL_KIND_CHOICE) {
      const opts = (await loadOptionsByProposalIds([c.id])).get(c.id) ?? [];
      const max = opts.length ? Math.max(0, ...opts.map((o) => o.votes)) : 0;
      const leaders = opts.filter((o) => o.votes === max && max > 0);
      if (leaders.length === 0) summary = "Без голосів";
      else if (leaders.length > 1)
        summary = `Нічия: ${leaders.map((o) => o.label).join(", ")}`;
      else
        summary = `Переміг варіант «${leaders[0]!.label}» (${leaders[0]!.votes})`;
    }
    closed.push({
      id: c.id,
      title: c.title,
      yes_votes: c.yes,
      no_votes: c.no,
      status: "closed",
      kind: c.kind,
      total_votes: c.total,
      summary,
    });
  }

  // Обовʼязково await: інакше на Vercel serverless вебхуки обриваються після відповіді.
  try {
    if (toExtend.length > 0) {
      await notifyProposalTieExtendedBatch(toExtend);
    }
    if (closed.length > 0) {
      await notifyProposalResultsBatch(closed);
    }
  } catch (e) {
    console.error("[proposals] expire notify failed:", e);
  }
  return closed;
}

async function syncProposalLifecycle(): Promise<void> {
  await reopenTiedClosedProposals();
  await expireActiveProposals();
}

export async function listProposalsForUser(
  currentUserId: number | null,
): Promise<ProposalRow[]> {
  await ensureAuthProviderColumns();
  await ensurePollSchema();
  await syncProposalLifecycle();
  const sql = getSql();
  const uid = currentUserId ?? 0;
  const rows = rowsOf(await sql`
    SELECT
      p.id,
      p.user_id,
      p.title,
      p.description,
      COALESCE(p.kind, 'yes_no') AS kind,
      p.status,
      p.cancel_reason,
      p.created_at,
      p.ends_at,
      COALESCE(NULLIF(TRIM(u.game_nickname), ''), u.username) AS author_username,
      COALESCE(SUM(CASE WHEN v.vote = 1 AND v.option_id IS NULL THEN 1 ELSE 0 END), 0)::int AS yes_votes,
      COALESCE(SUM(CASE WHEN v.vote = 0 AND v.option_id IS NULL THEN 1 ELSE 0 END), 0)::int AS no_votes,
      (SELECT v2.vote FROM votes v2
       WHERE v2.proposal_id = p.id AND v2.user_id = ${uid}
       LIMIT 1) AS user_vote,
      (SELECT v2.option_id FROM votes v2
       WHERE v2.proposal_id = p.id AND v2.user_id = ${uid}
       LIMIT 1) AS user_option_id
    FROM proposals p
    INNER JOIN users u ON u.id = p.user_id
    LEFT JOIN votes v ON v.proposal_id = p.id
    GROUP BY p.id, p.user_id, p.title, p.description, p.kind, p.status, p.cancel_reason, p.created_at, p.ends_at, u.username, u.game_nickname
    ORDER BY p.created_at DESC
  `);
  const ids = rows.map((r) => num(r.id));
  const optionsMap = await loadOptionsByProposalIds(ids);
  return rows.map((r) =>
    mapProposalRow(r, optionsMap.get(num(r.id)) ?? []),
  );
}

export async function getProposalForUser(
  id: number,
  currentUserId: number | null,
  opts?: { skipLifecycleSync?: boolean },
): Promise<ProposalRow | null> {
  await ensureAuthProviderColumns();
  await ensurePollSchema();
  if (!opts?.skipLifecycleSync) {
    await syncProposalLifecycle();
  }
  const sql = getSql();
  const uid = currentUserId ?? 0;
  const rows = rowsOf(await sql`
    SELECT
      p.id,
      p.user_id,
      p.title,
      p.description,
      COALESCE(p.kind, 'yes_no') AS kind,
      p.status,
      p.cancel_reason,
      p.created_at,
      p.ends_at,
      COALESCE(NULLIF(TRIM(u.game_nickname), ''), u.username) AS author_username,
      COALESCE(SUM(CASE WHEN v.vote = 1 AND v.option_id IS NULL THEN 1 ELSE 0 END), 0)::int AS yes_votes,
      COALESCE(SUM(CASE WHEN v.vote = 0 AND v.option_id IS NULL THEN 1 ELSE 0 END), 0)::int AS no_votes,
      (SELECT v2.vote FROM votes v2
       WHERE v2.proposal_id = p.id AND v2.user_id = ${uid}
       LIMIT 1) AS user_vote,
      (SELECT v2.option_id FROM votes v2
       WHERE v2.proposal_id = p.id AND v2.user_id = ${uid}
       LIMIT 1) AS user_option_id
    FROM proposals p
    INNER JOIN users u ON u.id = p.user_id
    LEFT JOIN votes v ON v.proposal_id = p.id
    WHERE p.id = ${id}
    GROUP BY p.id, p.user_id, p.title, p.description, p.kind, p.status, p.cancel_reason, p.created_at, p.ends_at, u.username, u.game_nickname
    LIMIT 1
  `);
  if (!rows.length) return null;
  const optionsMap = await loadOptionsByProposalIds([id]);
  return mapProposalRow(rows[0]!, optionsMap.get(id) ?? []);
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

export type AdminProposalListItem = {
  id: number;
  title: string;
  description: string;
  kind: ProposalKind;
  status: string;
  cancel_reason: string | null;
  created_at: Date;
  ends_at: Date;
  author_username: string;
  yes_votes: number;
  no_votes: number;
  total_votes: number;
  options: ProposalOptionPublic[];
};

/** Список пропозицій для адмін-панелі (активні першими). */
export async function listProposalsForAdmin(): Promise<AdminProposalListItem[]> {
  await ensureAuthProviderColumns();
  await ensurePollSchema();
  await syncProposalLifecycle();
  const sql = getSql();
  const rows = rowsOf(await sql`
    SELECT
      p.id,
      p.user_id,
      p.title,
      p.description,
      COALESCE(p.kind, 'yes_no') AS kind,
      p.status,
      p.cancel_reason,
      p.created_at,
      p.ends_at,
      COALESCE(NULLIF(TRIM(u.game_nickname), ''), u.username) AS author_username,
      COALESCE(SUM(CASE WHEN v.vote = 1 AND v.option_id IS NULL THEN 1 ELSE 0 END), 0)::int AS yes_votes,
      COALESCE(SUM(CASE WHEN v.vote = 0 AND v.option_id IS NULL THEN 1 ELSE 0 END), 0)::int AS no_votes
    FROM proposals p
    INNER JOIN users u ON u.id = p.user_id
    LEFT JOIN votes v ON v.proposal_id = p.id
    GROUP BY p.id, p.user_id, p.title, p.description, p.kind, p.status, p.cancel_reason, p.created_at, p.ends_at, u.username, u.game_nickname
    ORDER BY
      CASE WHEN p.status = 'active' THEN 0 ELSE 1 END,
      p.created_at DESC
  `);
  const ids = rows.map((r) => num(r.id));
  const optionsMap = await loadOptionsByProposalIds(ids);
  return rows.map((r) => {
    const mapped = mapProposalRow(r, optionsMap.get(num(r.id)) ?? []);
    return {
      id: mapped.id,
      title: mapped.title,
      description: mapped.description,
      kind: mapped.kind,
      status: mapped.status,
      cancel_reason: mapped.cancel_reason,
      created_at: mapped.created_at,
      ends_at: mapped.ends_at,
      author_username: mapped.author_username,
      yes_votes: mapped.yes_votes,
      no_votes: mapped.no_votes,
      total_votes: mapped.total_votes,
      options: mapped.options,
    };
  });
}

/** Скасування активної пропозиції адміністрацією з причиною. */
export async function cancelProposalByAdmin(
  proposalId: number,
  reason: string,
): Promise<{ id: number; title: string; cancel_reason: string } | null> {
  await ensurePollSchema();
  const trimmed = reason.trim();
  if (!trimmed) return null;
  const sql = getSql();
  const rows = rowsOf(await sql`
    UPDATE proposals
    SET status = 'cancelled',
        cancel_reason = ${trimmed}
    WHERE id = ${proposalId}
      AND status = 'active'
    RETURNING id, title, cancel_reason
  `);
  if (!rows.length) return null;
  return {
    id: num(rows[0]!.id),
    title: String(rows[0]!.title ?? ""),
    cancel_reason: String(rows[0]!.cancel_reason ?? trimmed).trim(),
  };
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
  role: UserRole;
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
  let role = normalizeRole(r.role);
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
  option_id: number | null;
};

export async function listProposalVoters(
  proposalId: number,
): Promise<ProposalVoterRow[]> {
  await ensureAuthProviderColumns();
  await ensurePollSchema();
  const sql = getSql();
  const rows = rowsOf(await sql`
    SELECT
      v.user_id,
      v.vote,
      v.option_id,
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
    const optRaw = r.option_id;
    let optionId: number | null = null;
    if (optRaw !== null && optRaw !== undefined) {
      const n = num(optRaw);
      if (n > 0) optionId = n;
    }
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
      option_id: optionId,
    };
  });
}

export async function createProposalRecord(params: {
  userId: number;
  title: string;
  description: string;
  endsAt: Date;
  kind?: ProposalKind;
  options?: string[];
}): Promise<number> {
  await ensurePollSchema();
  const sql = getSql();
  const kind = params.kind ?? PROPOSAL_KIND_YES_NO;
  const rows = rowsOf(await sql`
    INSERT INTO proposals (user_id, title, description, kind, status, ends_at)
    VALUES (
      ${params.userId},
      ${params.title},
      ${params.description},
      ${kind},
      'active',
      ${params.endsAt}
    )
    RETURNING id
  `);
  const id = num(rows[0]?.id);
  if (kind === PROPOSAL_KIND_CHOICE && params.options?.length) {
    let order = 0;
    for (const label of params.options) {
      await sql`
        INSERT INTO proposal_options (proposal_id, label, sort_order)
        VALUES (${id}, ${label}, ${order})
      `;
      order += 1;
    }
  }
  return id;
}

export async function setUserVote(params: {
  proposalId: number;
  userId: number;
  vote: 0 | 1;
}): Promise<void> {
  await ensurePollSchema();
  const sql = getSql();
  await sql`
    INSERT INTO votes (proposal_id, user_id, vote, option_id)
    VALUES (${params.proposalId}, ${params.userId}, ${params.vote}, NULL)
    ON CONFLICT (proposal_id, user_id) DO UPDATE SET
      vote = EXCLUDED.vote,
      option_id = NULL
  `;
}

/** Голос за варіант у choice-голосуванні. */
export async function setUserChoiceVote(params: {
  proposalId: number;
  userId: number;
  optionId: number;
}): Promise<boolean> {
  await ensurePollSchema();
  const sql = getSql();
  const ok = rowsOf(await sql`
    SELECT id FROM proposal_options
    WHERE id = ${params.optionId} AND proposal_id = ${params.proposalId}
    LIMIT 1
  `);
  if (!ok.length) return false;
  await sql`
    INSERT INTO votes (proposal_id, user_id, vote, option_id)
    VALUES (${params.proposalId}, ${params.userId}, 1, ${params.optionId})
    ON CONFLICT (proposal_id, user_id) DO UPDATE SET
      vote = 1,
      option_id = EXCLUDED.option_id
  `;
  return true;
}

/** Для cron: reopen ties + expire (те саме, що й при завантаженні списку). */
export async function runExpireProposalsUpdate(): Promise<number> {
  await reopenTiedClosedProposals();
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
