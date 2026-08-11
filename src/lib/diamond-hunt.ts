import { getSql } from "@/lib/db";
import {
  DIAMOND_SPOT_POOL,
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
          blurb TEXT NOT NULL DEFAULT 'Знайди діаманти, сховані на сайті. Кожен день — нові місця.',
          start_at TIMESTAMPTZ,
          end_at TIMESTAMPTZ,
          diamonds_per_day INT NOT NULL DEFAULT 20,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        INSERT INTO diamond_event (id, enabled, title)
        VALUES (1, FALSE, 'Пошук діамантів')
        ON CONFLICT (id) DO NOTHING
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS diamond_collections (
          id BIGSERIAL PRIMARY KEY,
          user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          spot_id VARCHAR(64) NOT NULL,
          day_key DATE NOT NULL,
          collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CONSTRAINT diamond_collections_user_day_spot UNIQUE (user_id, day_key, spot_id)
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS diamond_collections_user_idx
          ON diamond_collections (user_id)
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS diamond_collections_day_idx
          ON diamond_collections (day_key)
      `;
    })().catch((err) => {
      schemaReady = null;
      throw err;
    });
  }
  await schemaReady;
}

/** День івенту в Europe/Kyiv як YYYY-MM-DD. */
export function kyivDayKey(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Kyiv",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickDailySpots(
  dayKey: string,
  count: number,
  pool: DiamondSpotDef[] = DIAMOND_SPOT_POOL,
): DiamondSpotDef[] {
  const n = Math.max(0, Math.min(count, pool.length));
  if (n === 0) return [];
  const rnd = mulberry32(hashString(`lc-diamond:${dayKey}`));
  const copy = [...pool];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const tmp = copy[i]!;
    copy[i] = copy[j]!;
    copy[j] = tmp;
  }
  return copy.slice(0, n);
}

export type DiamondEventSettings = {
  enabled: boolean;
  title: string;
  blurb: string;
  startAt: string | null;
  endAt: string | null;
  diamondsPerDay: number;
  updatedAt: string | null;
};

export async function getDiamondEventSettings(): Promise<DiamondEventSettings> {
  await ensureDiamondHuntSchema();
  const sql = getSql();
  const rows = rowsOf(await sql`
    SELECT enabled, title, blurb, start_at, end_at, diamonds_per_day, updated_at
    FROM diamond_event
    WHERE id = 1
    LIMIT 1
  `);
  const r = rows[0];
  if (!r) {
    return {
      enabled: false,
      title: "Пошук діамантів",
      blurb: "Знайди діаманти, сховані на сайті. Кожен день — нові місця.",
      startAt: null,
      endAt: null,
      diamondsPerDay: 20,
      updatedAt: null,
    };
  }
  const startRaw = r.start_at;
  const endRaw = r.end_at;
  const updatedRaw = r.updated_at;
  return {
    enabled: bool(r.enabled),
    title: str(r.title) || "Пошук діамантів",
    blurb:
      str(r.blurb) ||
      "Знайди діаманти, сховані на сайті. Кожен день — нові місця.",
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
    diamondsPerDay: Math.max(1, Math.min(40, num(r.diamonds_per_day) || 20)),
    updatedAt:
      updatedRaw instanceof Date
        ? updatedRaw.toISOString()
        : updatedRaw
          ? String(updatedRaw)
          : null,
  };
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
  diamondsPerDay?: number;
}): Promise<DiamondEventSettings> {
  await ensureDiamondHuntSchema();
  const current = await getDiamondEventSettings();
  const enabled = input.enabled ?? current.enabled;
  const title = (input.title ?? current.title).trim() || "Пошук діамантів";
  const blurb =
    (input.blurb ?? current.blurb).trim() ||
    "Знайди діаманти, сховані на сайті. Кожен день — нові місця.";
  const diamondsPerDay = Math.max(
    1,
    Math.min(40, input.diamondsPerDay ?? current.diamondsPerDay),
  );

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
      ${diamondsPerDay},
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      enabled = EXCLUDED.enabled,
      title = EXCLUDED.title,
      blurb = EXCLUDED.blurb,
      start_at = EXCLUDED.start_at,
      end_at = EXCLUDED.end_at,
      diamonds_per_day = EXCLUDED.diamonds_per_day,
      updated_at = NOW()
  `;
  return getDiamondEventSettings();
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

export async function getCollectedSpotIdsForDay(
  userId: number,
  dayKey: string,
): Promise<Set<string>> {
  await ensureDiamondHuntSchema();
  const sql = getSql();
  const rows = rowsOf(await sql`
    SELECT spot_id
    FROM diamond_collections
    WHERE user_id = ${userId} AND day_key = ${dayKey}::date
  `);
  return new Set(rows.map((r) => str(r.spot_id)).filter(Boolean));
}

export type DiamondPublicSpot = {
  id: string;
  top: number;
  left: number;
};

export type DiamondPlayerState = {
  active: boolean;
  title: string;
  blurb: string;
  dayKey: string;
  todayTotal: number;
  todayCollected: number;
  balance: number;
  spotsOnPage: DiamondPublicSpot[];
};

export async function getDiamondPlayerState(params: {
  userId: number;
  pathname: string;
}): Promise<DiamondPlayerState> {
  const settings = await getDiamondEventSettings();
  const dayKey = kyivDayKey();
  const balance = await getUserDiamondTotal(params.userId);
  const active = isEventActiveNow(settings);
  const empty: DiamondPlayerState = {
    active: false,
    title: settings.title,
    blurb: settings.blurb,
    dayKey,
    todayTotal: settings.diamondsPerDay,
    todayCollected: 0,
    balance,
    spotsOnPage: [],
  };
  if (!active) return empty;

  const path = normalizeDiamondPath(params.pathname);
  if (!isDiamondPathAllowed(path)) {
    return { ...empty, active: true };
  }

  const daily = pickDailySpots(dayKey, settings.diamondsPerDay);
  const collected = await getCollectedSpotIdsForDay(params.userId, dayKey);
  const todayCollected = daily.filter((s) => collected.has(s.id)).length;
  const spotsOnPage = daily
    .filter((s) => normalizeDiamondPath(s.path) === path && !collected.has(s.id))
    .map((s) => ({ id: s.id, top: s.top, left: s.left }));

  return {
    active: true,
    title: settings.title,
    blurb: settings.blurb,
    dayKey,
    todayTotal: daily.length,
    todayCollected,
    balance,
    spotsOnPage,
  };
}

export type CollectResult =
  | { ok: true; balance: number; todayCollected: number; todayTotal: number }
  | { ok: false; error: string; code?: string };

export async function collectDiamond(params: {
  userId: number;
  spotId: string;
}): Promise<CollectResult> {
  const settings = await getDiamondEventSettings();
  if (!isEventActiveNow(settings)) {
    return { ok: false, error: "Івент зараз неактивний.", code: "inactive" };
  }

  const dayKey = kyivDayKey();
  const daily = pickDailySpots(dayKey, settings.diamondsPerDay);
  const spot = daily.find((s) => s.id === params.spotId);
  if (!spot) {
    return { ok: false, error: "Цей діамант сьогодні недоступний.", code: "invalid" };
  }

  await ensureDiamondHuntSchema();
  const sql = getSql();
  try {
    await sql`
      INSERT INTO diamond_collections (user_id, spot_id, day_key)
      VALUES (${params.userId}, ${params.spotId}, ${dayKey}::date)
    `;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/unique|duplicate/i.test(msg)) {
      const balance = await getUserDiamondTotal(params.userId);
      const collected = await getCollectedSpotIdsForDay(params.userId, dayKey);
      return {
        ok: true,
        balance,
        todayCollected: daily.filter((s) => collected.has(s.id)).length,
        todayTotal: daily.length,
      };
    }
    throw err;
  }

  const balance = await getUserDiamondTotal(params.userId);
  const collected = await getCollectedSpotIdsForDay(params.userId, dayKey);
  return {
    ok: true,
    balance,
    todayCollected: daily.filter((s) => collected.has(s.id)).length,
    todayTotal: daily.length,
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
