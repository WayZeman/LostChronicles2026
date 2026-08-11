import { getSql } from "@/lib/db";
import {
  DIAMOND_EVENT_DURATION_DAYS,
  DIAMOND_EVENT_TOTAL,
  DIAMOND_SPOTS,
  getSpotById,
  getSpotsForPath,
  isDiamondPathAllowed,
  normalizeDiamondPath,
  type DiamondSpotDef,
} from "@/data/diamond-spots";

let schemaReady: Promise<void> | null = null;

function rowsOf(r: unknown): Record<string, unknown>[] {
  if (Array.isArray(r)) return r as Record<string, unknown>[];
  if (r && typeof r === "object" && "rows" in r) {
    const rows = (r as { rows?: unknown }).rows;
    if (Array.isArray(rows)) return rows as Record<string, unknown>[];
  }
  return [];
}

function num(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "bigint") return Number(v);
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function str(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v);
}

function bool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (v === 1 || v === "1" || v === "t" || v === "true") return true;
  return false;
}

const DEFAULT_BLURB =
  "Якось випадковим чином по сайту Lost Chronicles розсипались діаманти. Шукай їх на головній, у FAQ, магазині, вікі (держави, довідник цін), новинах, пропозиціях і анкеті — гортай і відкривай розділи.";

export async function ensureDiamondHuntSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      const sql = getSql();
      await sql`
        ALTER TABLE users
          ADD COLUMN IF NOT EXISTS profile_age TEXT NOT NULL DEFAULT ''
      `;
      await sql`
        ALTER TABLE users
          ADD COLUMN IF NOT EXISTS profile_birthday TEXT NOT NULL DEFAULT ''
      `;
      await sql`
        ALTER TABLE users
          ADD COLUMN IF NOT EXISTS profile_bio TEXT NOT NULL DEFAULT ''
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS diamond_event (
          id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
          enabled BOOLEAN NOT NULL DEFAULT FALSE,
          title TEXT NOT NULL DEFAULT 'Пошук діамантів',
          blurb TEXT NOT NULL DEFAULT 'Якось випадковим чином по сайту розсипались діаманти.',
          start_at TIMESTAMPTZ,
          end_at TIMESTAMPTZ,
          diamonds_per_day INT NOT NULL DEFAULT 100,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        INSERT INTO diamond_event (id, enabled, title, blurb, diamonds_per_day)
        VALUES (1, FALSE, 'Пошук діамантів', ${DEFAULT_BLURB}, 100)
        ON CONFLICT (id) DO NOTHING
      `;
      // Оновити старий дефолтний опис, якщо адмін його не міняв під себе
      await sql`
        UPDATE diamond_event
        SET blurb = ${DEFAULT_BLURB}, updated_at = NOW()
        WHERE id = 1
          AND (
            blurb ILIKE '%100 діамант%'
            OR blurb ILIKE '%Кожен день%'
            OR TRIM(blurb) = ''
          )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS diamond_collections (
          id BIGSERIAL PRIMARY KEY,
          user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          spot_id VARCHAR(64) NOT NULL,
          day_key DATE NOT NULL DEFAULT CURRENT_DATE,
          collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE UNIQUE INDEX IF NOT EXISTS diamond_collections_user_spot_uidx
          ON diamond_collections (user_id, spot_id)
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS diamond_collections_user_idx
          ON diamond_collections (user_id)
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS diamond_finishers (
          user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          place INT NOT NULL,
          finished_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE UNIQUE INDEX IF NOT EXISTS diamond_finishers_place_uidx
          ON diamond_finishers (place)
      `;
    })().catch((err) => {
      schemaReady = null;
      throw err;
    });
  }
  await schemaReady;
}

export type DiamondEventSettings = {
  enabled: boolean;
  title: string;
  blurb: string;
  startAt: string | null;
  endAt: string | null;
  /** Завжди DIAMOND_EVENT_TOTAL для UI */
  totalDiamonds: number;
  durationDays: number;
  updatedAt: string | null;
};

function mapEvent(r: Record<string, unknown> | undefined): DiamondEventSettings {
  if (!r) {
    return {
      enabled: false,
      title: "Пошук діамантів",
      blurb: DEFAULT_BLURB,
      startAt: null,
      endAt: null,
      totalDiamonds: DIAMOND_EVENT_TOTAL,
      durationDays: DIAMOND_EVENT_DURATION_DAYS,
      updatedAt: null,
    };
  }
  const startRaw = r.start_at;
  const endRaw = r.end_at;
  const updatedRaw = r.updated_at;
  return {
    enabled: bool(r.enabled),
    title: str(r.title) || "Пошук діамантів",
    blurb: str(r.blurb) || DEFAULT_BLURB,
    startAt:
      startRaw instanceof Date
        ? startRaw.toISOString()
        : startRaw
          ? String(startRaw)
          : null,
    endAt:
      endRaw instanceof Date
        ? endRaw.toISOString()
        : endRaw
          ? String(endRaw)
          : null,
    totalDiamonds: DIAMOND_EVENT_TOTAL,
    durationDays: DIAMOND_EVENT_DURATION_DAYS,
    updatedAt:
      updatedRaw instanceof Date
        ? updatedRaw.toISOString()
        : updatedRaw
          ? String(updatedRaw)
          : null,
  };
}

export async function getDiamondEventSettings(): Promise<DiamondEventSettings> {
  await ensureDiamondHuntSchema();
  const sql = getSql();
  const rows = rowsOf(await sql`
    SELECT enabled, title, blurb, start_at, end_at, updated_at
    FROM diamond_event
    WHERE id = 1
    LIMIT 1
  `);
  return mapEvent(rows[0]);
}

export function isEventActiveNow(
  settings: DiamondEventSettings,
  now = new Date(),
): boolean {
  if (!settings.enabled) return false;
  if (settings.startAt) {
    const start = new Date(settings.startAt);
    if (Number.isFinite(start.getTime()) && now < start) return false;
  }
  if (settings.endAt) {
    const end = new Date(settings.endAt);
    if (Number.isFinite(end.getTime()) && now > end) return false;
  }
  return true;
}

export async function updateDiamondEventSettings(input: {
  enabled?: boolean;
  title?: string;
  blurb?: string;
  startAt?: string | null;
  endAt?: string | null;
}): Promise<DiamondEventSettings> {
  await ensureDiamondHuntSchema();
  const current = await getDiamondEventSettings();
  const enabled = input.enabled ?? current.enabled;
  const title = (input.title ?? current.title).trim() || "Пошук діамантів";
  const blurb = (input.blurb ?? current.blurb).trim() || DEFAULT_BLURB;

  let startAt: string | null =
    input.startAt === undefined ? current.startAt : input.startAt;
  let endAt: string | null =
    input.endAt === undefined ? current.endAt : input.endAt;

  if (startAt === "") startAt = null;
  if (endAt === "") endAt = null;

  const sql = getSql();
  await sql`
    INSERT INTO diamond_event (id, enabled, title, blurb, start_at, end_at, diamonds_per_day, updated_at)
    VALUES (
      1,
      ${enabled},
      ${title},
      ${blurb},
      ${startAt},
      ${endAt},
      ${DIAMOND_EVENT_TOTAL},
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      enabled = EXCLUDED.enabled,
      title = EXCLUDED.title,
      blurb = EXCLUDED.blurb,
      start_at = EXCLUDED.start_at,
      end_at = EXCLUDED.end_at,
      diamonds_per_day = ${DIAMOND_EVENT_TOTAL},
      updated_at = NOW()
  `;
  return getDiamondEventSettings();
}

/** Старт: увімкнути, now → +10 днів, очистити збори й фініши. */
export async function startDiamondEvent(): Promise<DiamondEventSettings> {
  await ensureDiamondHuntSchema();
  const sql = getSql();
  const start = new Date();
  const end = new Date(
    start.getTime() + DIAMOND_EVENT_DURATION_DAYS * 24 * 60 * 60 * 1000,
  );
  await sql`DELETE FROM diamond_collections`;
  await sql`DELETE FROM diamond_finishers`;
  await sql`
    UPDATE diamond_event
    SET
      enabled = TRUE,
      start_at = ${start.toISOString()},
      end_at = ${end.toISOString()},
      diamonds_per_day = ${DIAMOND_EVENT_TOTAL},
      updated_at = NOW()
    WHERE id = 1
  `;
  return getDiamondEventSettings();
}

/** Кінець: вимкнути зараз. */
export async function endDiamondEvent(): Promise<DiamondEventSettings> {
  await ensureDiamondHuntSchema();
  const sql = getSql();
  const now = new Date().toISOString();
  await sql`
    UPDATE diamond_event
    SET
      enabled = FALSE,
      end_at = ${now},
      updated_at = NOW()
    WHERE id = 1
  `;
  return getDiamondEventSettings();
}

/** Скинути збори й фініші, не змінюючи дати / увімкнення івенту. */
export async function resetDiamondProgress(): Promise<{
  event: DiamondEventSettings;
  clearedCollections: number;
  clearedFinishers: number;
}> {
  await ensureDiamondHuntSchema();
  const sql = getSql();
  const colRows = rowsOf(await sql`
    WITH deleted AS (
      DELETE FROM diamond_collections RETURNING 1
    )
    SELECT COUNT(*)::int AS c FROM deleted
  `);
  const finRows = rowsOf(await sql`
    WITH deleted AS (
      DELETE FROM diamond_finishers RETURNING 1
    )
    SELECT COUNT(*)::int AS c FROM deleted
  `);
  await sql`
    UPDATE diamond_event
    SET updated_at = NOW()
    WHERE id = 1
  `;
  return {
    event: await getDiamondEventSettings(),
    clearedCollections: num(colRows[0]?.c),
    clearedFinishers: num(finRows[0]?.c),
  };
}

export type UserProfileFields = {
  age: string;
  birthday: string;
  bio: string;
};

export async function getUserProfileFields(
  userId: number,
): Promise<UserProfileFields> {
  await ensureDiamondHuntSchema();
  const sql = getSql();
  const rows = rowsOf(await sql`
    SELECT profile_age, profile_birthday, profile_bio
    FROM users
    WHERE id = ${userId}
    LIMIT 1
  `);
  const r = rows[0];
  if (!r) return { age: "", birthday: "", bio: "" };
  return {
    age: str(r.profile_age),
    birthday: str(r.profile_birthday),
    bio: str(r.profile_bio),
  };
}

export async function updateUserProfileFields(params: {
  userId: number;
  age?: string;
  birthday?: string;
  bio?: string;
}): Promise<void> {
  await ensureDiamondHuntSchema();
  const sql = getSql();
  const current = await getUserProfileFields(params.userId);
  const age = (params.age ?? current.age).trim().slice(0, 8);
  const birthday = (params.birthday ?? current.birthday).trim().slice(0, 32);
  const bio = (params.bio ?? current.bio).trim().slice(0, 2000);
  await sql`
    UPDATE users
    SET
      profile_age = ${age},
      profile_birthday = ${birthday},
      profile_bio = ${bio}
    WHERE id = ${params.userId}
  `;
}

export async function getUserDiamondTotal(userId: number): Promise<number> {
  await ensureDiamondHuntSchema();
  const sql = getSql();
  const rows = rowsOf(await sql`
    SELECT COUNT(*)::int AS c
    FROM diamond_collections
    WHERE user_id = ${userId}
  `);
  return num(rows[0]?.c);
}

export async function getCollectedSpotIds(
  userId: number,
): Promise<Set<string>> {
  await ensureDiamondHuntSchema();
  const sql = getSql();
  const rows = rowsOf(await sql`
    SELECT spot_id
    FROM diamond_collections
    WHERE user_id = ${userId}
  `);
  return new Set(rows.map((r) => str(r.spot_id)).filter(Boolean));
}

export async function getFinisherPlace(
  userId: number,
): Promise<number | null> {
  await ensureDiamondHuntSchema();
  const sql = getSql();
  const rows = rowsOf(await sql`
    SELECT place
    FROM diamond_finishers
    WHERE user_id = ${userId}
    LIMIT 1
  `);
  if (!rows[0]) return null;
  const p = num(rows[0].place);
  return p > 0 ? p : null;
}

async function recordFinisherIfNeeded(userId: number): Promise<number | null> {
  const balance = await getUserDiamondTotal(userId);
  if (balance < DIAMOND_EVENT_TOTAL) return null;

  const existing = await getFinisherPlace(userId);
  if (existing) return existing;

  await ensureDiamondHuntSchema();
  const sql = getSql();
  try {
    const rows = rowsOf(await sql`
      INSERT INTO diamond_finishers (user_id, place)
      VALUES (
        ${userId},
        (SELECT COALESCE(MAX(place), 0) + 1 FROM diamond_finishers)
      )
      ON CONFLICT (user_id) DO NOTHING
      RETURNING place
    `);
    if (rows[0]) return num(rows[0].place);
  } catch {
    /* race — read again */
  }
  return getFinisherPlace(userId);
}

export type DiamondPublicSpot = {
  id: string;
  kind: "page" | "slot";
  slot?: string;
  top: number;
  left: number;
  size: "sm" | "md";
  opacity: number;
};

function toPublicSpot(s: DiamondSpotDef): DiamondPublicSpot {
  if (s.kind === "slot") {
    return {
      id: s.id,
      kind: "slot",
      slot: s.slot,
      top: s.top ?? 50,
      left: s.left ?? 50,
      size: s.size ?? "md",
      opacity: s.opacity ?? 0.85,
    };
  }
  return {
    id: s.id,
    kind: "page",
    top: s.top,
    left: s.left,
    size: s.size ?? "md",
    opacity: s.opacity ?? 0.85,
  };
}

export type DiamondPlayerState = {
  active: boolean;
  title: string;
  blurb: string;
  endAt: string | null;
  startAt: string | null;
  total: number;
  balance: number;
  finishPlace: number | null;
  spotsOnPage: DiamondPublicSpot[];
};

export async function getDiamondPlayerState(params: {
  userId: number | null;
  pathname: string;
}): Promise<DiamondPlayerState> {
  const settings = await getDiamondEventSettings();
  const active = isEventActiveNow(settings);
  const empty: DiamondPlayerState = {
    active: false,
    title: settings.title,
    blurb: settings.blurb,
    endAt: settings.endAt,
    startAt: settings.startAt,
    total: DIAMOND_EVENT_TOTAL,
    balance: 0,
    finishPlace: null,
    spotsOnPage: [],
  };

  if (!active) {
    return {
      ...empty,
      endAt: settings.endAt,
      startAt: settings.startAt,
      title: settings.title,
      blurb: settings.blurb,
    };
  }

  if (!params.userId) {
    return {
      ...empty,
      active: true,
      title: settings.title,
      blurb: settings.blurb,
      endAt: settings.endAt,
      startAt: settings.startAt,
    };
  }

  const balance = await getUserDiamondTotal(params.userId);
  const finishPlace = await getFinisherPlace(params.userId);
  const path = normalizeDiamondPath(params.pathname);

  if (!isDiamondPathAllowed(path)) {
    return {
      active: true,
      title: settings.title,
      blurb: settings.blurb,
      endAt: settings.endAt,
      startAt: settings.startAt,
      total: DIAMOND_EVENT_TOTAL,
      balance,
      finishPlace,
      spotsOnPage: [],
    };
  }

  const collected = await getCollectedSpotIds(params.userId);
  const spotsOnPage = getSpotsForPath(path)
    .filter((s) => !collected.has(s.id))
    .map(toPublicSpot);

  return {
    active: true,
    title: settings.title,
    blurb: settings.blurb,
    endAt: settings.endAt,
    startAt: settings.startAt,
    total: DIAMOND_EVENT_TOTAL,
    balance,
    finishPlace,
    spotsOnPage,
  };
}

/** Публічний стан івенту (для вікна події без логіну). */
export async function getDiamondPublicEventInfo(): Promise<{
  active: boolean;
  title: string;
  blurb: string;
  endAt: string | null;
  startAt: string | null;
  total: number;
}> {
  const settings = await getDiamondEventSettings();
  const active = isEventActiveNow(settings);
  return {
    active,
    title: settings.title,
    blurb: settings.blurb,
    endAt: settings.endAt,
    startAt: settings.startAt,
    total: DIAMOND_EVENT_TOTAL,
  };
}

export type CollectResult =
  | {
      ok: true;
      balance: number;
      total: number;
      finishPlace: number | null;
      justFinished: boolean;
    }
  | { ok: false; error: string; code?: string };

export async function collectDiamond(params: {
  userId: number;
  spotId: string;
}): Promise<CollectResult> {
  const settings = await getDiamondEventSettings();
  if (!isEventActiveNow(settings)) {
    return { ok: false, error: "Івент зараз неактивний.", code: "inactive" };
  }

  const spot = getSpotById(params.spotId);
  if (!spot || !DIAMOND_SPOTS.some((s) => s.id === params.spotId)) {
    return { ok: false, error: "Невідомий діамант.", code: "invalid" };
  }

  await ensureDiamondHuntSchema();
  const sql = getSql();
  const beforePlace = await getFinisherPlace(params.userId);

  try {
    await sql`
      INSERT INTO diamond_collections (user_id, spot_id, day_key)
      VALUES (${params.userId}, ${params.spotId}, CURRENT_DATE)
    `;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/unique|duplicate/i.test(msg)) {
      const balance = await getUserDiamondTotal(params.userId);
      const finishPlace = await recordFinisherIfNeeded(params.userId);
      return {
        ok: true,
        balance,
        total: DIAMOND_EVENT_TOTAL,
        finishPlace,
        justFinished: false,
      };
    }
    throw err;
  }

  const balance = await getUserDiamondTotal(params.userId);
  const finishPlace = await recordFinisherIfNeeded(params.userId);
  const justFinished = Boolean(finishPlace) && !beforePlace;

  return {
    ok: true,
    balance,
    total: DIAMOND_EVENT_TOTAL,
    finishPlace,
    justFinished,
  };
}

export type DiamondLeaderboardEntry = {
  userId: number;
  displayName: string;
  username: string;
  avatar: string | null;
  customAvatar: string | null;
  discordId: string | null;
  score: number;
};

export async function getDiamondLeaderboard(
  limit = 15,
): Promise<DiamondLeaderboardEntry[]> {
  await ensureDiamondHuntSchema();
  const sql = getSql();
  const lim = Math.max(1, Math.min(50, limit));
  const rows = rowsOf(await sql`
    SELECT
      u.id AS user_id,
      u.username,
      COALESCE(NULLIF(TRIM(u.game_nickname), ''), u.username) AS display_name,
      u.avatar,
      u.custom_avatar,
      u.discord_id,
      COUNT(c.id)::int AS score
    FROM diamond_collections c
    INNER JOIN users u ON u.id = c.user_id
    GROUP BY u.id, u.username, u.game_nickname, u.avatar, u.custom_avatar, u.discord_id
    ORDER BY score DESC, MIN(c.collected_at) ASC
    LIMIT ${lim}
  `);
  return rows.map((r) => ({
    userId: num(r.user_id),
    displayName: str(r.display_name) || "Гравець",
    avatar: r.avatar == null ? null : str(r.avatar),
    customAvatar: r.custom_avatar == null ? null : str(r.custom_avatar),
    discordId: r.discord_id == null ? null : str(r.discord_id),
    username: str(r.username),
    score: num(r.score),
  }));
}

export type DiamondFinisherEntry = {
  userId: number;
  displayName: string;
  place: number;
  finishedAt: string;
};

export async function getDiamondFinishers(
  limit = 25,
): Promise<DiamondFinisherEntry[]> {
  await ensureDiamondHuntSchema();
  const sql = getSql();
  const lim = Math.max(1, Math.min(100, limit));
  const rows = rowsOf(await sql`
    SELECT
      f.user_id,
      f.place,
      f.finished_at,
      COALESCE(NULLIF(TRIM(u.game_nickname), ''), u.username) AS display_name
    FROM diamond_finishers f
    INNER JOIN users u ON u.id = f.user_id
    ORDER BY f.place ASC
    LIMIT ${lim}
  `);
  return rows.map((r) => ({
    userId: num(r.user_id),
    displayName: str(r.display_name) || "Гравець",
    place: num(r.place),
    finishedAt:
      r.finished_at instanceof Date
        ? r.finished_at.toISOString()
        : String(r.finished_at ?? ""),
  }));
}
