import { getSql } from "@/lib/db";
import { LOST_CHRONICLES_FAQ } from "@/data/lost-chronicles-faq";
import { LC_DEFAULT_JAVA_SERVER_HOST } from "@/lib/lc-server-defaults";
import {
  isSuperAdminNick,
  normalizeRole,
  type UserRole,
} from "@/lib/admin-role";
import {
  normalizePriceTiers,
  parsePriceTiersJson,
  summarizePriceLabel,
  type SupportPriceTier,
} from "@/lib/support-price-tiers";

function rowsOf(r: unknown): Record<string, unknown>[] {
  return r as Record<string, unknown>[];
}

function num(v: unknown): number {
  if (v === null || v === undefined) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

let cmsEnsured = false;

const DEFAULT_CATALOG_LINKS = [
  {
    href: "https://minecraft.org.ua/minecraft-servers/Lost-Chronicles/3210",
    label: "Minecraft.org.ua",
    shortLabel: "ОУМ",
  },
  {
    href: "https://monicore.com.ua/server/281/lostchronicles",
    label: "MoniCore",
    shortLabel: "MoniCore",
  },
  {
    href: "https://allmc.in.ua/play-lost-chronicles-site",
    label: "AllMC.in.ua",
    shortLabel: "AllMC",
  },
];

export type CatalogVoteLink = {
  href: string;
  label: string;
  shortLabel: string;
};

export type SiteConnectSettings = {
  javaIp: string;
  javaVersion: string;
  bedrockAddress: string;
  bedrockPort: string;
};

export type SiteSupportSettings = {
  monoJarUrl: string;
  blurb: string;
  catalogLinks: CatalogVoteLink[];
};

export type FaqItemRecord = {
  id: number;
  sort_order: number;
  question: string;
  answer_html: string;
};

async function ensureCmsTables(): Promise<void> {
  if (cmsEnsured) return;
  const sql = getSql();
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20)`;
  await sql`UPDATE users SET role = 'user' WHERE role IS NULL OR trim(role) = ''`;
  await sql`
    CREATE INDEX IF NOT EXISTS users_role_idx ON users (role)
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS faq_items (
      id SERIAL PRIMARY KEY,
      sort_order INT NOT NULL DEFAULT 0,
      question VARCHAR(500) NOT NULL,
      answer_html TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS faq_items_sort_idx ON faq_items (sort_order, id)
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS site_settings (
      key VARCHAR(64) PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS support_cards (
      id SERIAL PRIMARY KEY,
      sort_order INT NOT NULL DEFAULT 0,
      title VARCHAR(200) NOT NULL,
      description TEXT NOT NULL,
      image_url TEXT NOT NULL,
      price_label VARCHAR(64) NOT NULL,
      button_url TEXT NOT NULL DEFAULT '',
      quantity_enabled BOOLEAN NOT NULL DEFAULT TRUE,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    ALTER TABLE support_cards
    ADD COLUMN IF NOT EXISTS quantity_enabled BOOLEAN NOT NULL DEFAULT TRUE
  `;
  await sql`
    ALTER TABLE support_cards
    ADD COLUMN IF NOT EXISTS price_tiers TEXT NOT NULL DEFAULT '[]'
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS support_cards_sort_idx
    ON support_cards (sort_order, id)
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS support_orders (
      id SERIAL PRIMARY KEY,
      card_id INT REFERENCES support_cards(id) ON DELETE SET NULL,
      card_title VARCHAR(200) NOT NULL,
      price_label VARCHAR(64) NOT NULL,
      amount_kopecks INT NOT NULL,
      quantity INT NOT NULL DEFAULT 1,
      nickname VARCHAR(64) NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      paid_at TIMESTAMPTZ,
      notified_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    ALTER TABLE support_orders
    ADD COLUMN IF NOT EXISTS quantity INT NOT NULL DEFAULT 1
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS support_orders_pending_amount_idx
    ON support_orders (status, amount_kopecks, created_at)
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS support_order_items (
      id SERIAL PRIMARY KEY,
      order_id INT NOT NULL REFERENCES support_orders(id) ON DELETE CASCADE,
      card_id INT REFERENCES support_cards(id) ON DELETE SET NULL,
      card_title VARCHAR(200) NOT NULL,
      price_label VARCHAR(64) NOT NULL,
      unit_kopecks INT NOT NULL,
      quantity INT NOT NULL DEFAULT 1,
      line_kopecks INT NOT NULL
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS support_order_items_order_idx
    ON support_order_items (order_id)
  `;

  // Seed FAQ з коду, якщо таблиця порожня
  const faqCount = rowsOf(await sql`SELECT COUNT(*)::int AS c FROM faq_items`);
  if (num(faqCount[0]?.c) === 0) {
    for (const item of LOST_CHRONICLES_FAQ) {
      await sql`
        INSERT INTO faq_items (sort_order, question, answer_html)
        VALUES (${item.order}, ${item.question}, ${item.answer})
      `;
    }
  } else {
    // Кнопка «Підтримати» → сторінка /support
    const donationFaq = LOST_CHRONICLES_FAQ.find(
      (i) => i.question === "Пожертви",
    );
    if (donationFaq) {
      await sql`
        UPDATE faq_items
        SET answer_html = ${donationFaq.answer}, updated_at = NOW()
        WHERE lower(trim(question)) = 'пожертви'
          AND (
            answer_html NOT LIKE '%href="/support"%'
            OR answer_html LIKE '%Від 20 грн%'
          )
      `;
    }
  }

  // Каталог підтримки: seed лише якщо таблиця порожня (не затираємо адмін-контент)
  const cardCount = rowsOf(
    await sql`SELECT COUNT(*)::int AS c FROM support_cards`,
  );
  if (num(cardCount[0]?.c) === 0) {
    const seeds = [
      {
        order: 1,
        title: "Музична платівка",
        description:
          "На платівку буде накладено будь-яку пісню, яку ви забажаєте, якщо вона не порушує правил серверу.",
        image: "/support-vinyl.jpg",
        price: "25 ₴",
        qty: true,
      },
      {
        order: 2,
        title: "Команда /pay",
        description: "Плати на відстані діамантами.",
        image: "/support-pay.jpg",
        price: "20 ₴",
        qty: false,
      },
      {
        order: 3,
        title: "Власна моделька",
        description:
          "Ви можете завантажити на сервер свою модельку. Рідкісні модельки коштують - 20грн, епічні - 40. Легендарні\\унікальні - 50грн.",
        image: "/support-model.jpg",
        price: "від 20 ₴",
        qty: true,
        tiers: [
          { label: "Рідкісна", price_label: "20 ₴" },
          { label: "Епічна", price_label: "40 ₴" },
          { label: "Легендарна", price_label: "50 ₴" },
        ],
      },
      {
        order: 4,
        title: "Зміна стилю нікнейму",
        description:
          "Зроби себе унікальним та виділись серед інших, градієнт або зміна нікнейму.",
        image: "/support-nick-style.jpg",
        price: "10 ₴",
        qty: true,
      },
      {
        order: 5,
        title: "Нагодуй гравця",
        description:
          "Команда /feed — нагодуй будь-кого раз на годину. Ціна за 1 команду.",
        image: "/support-cmd-feed.jpg",
        price: "25 ₴",
        qty: true,
      },
      {
        order: 6,
        title: "Наковальня будь-де",
        description:
          "Команда /anvil — відкрий наковальню де завгодно. Ціна за 1 команду.",
        image: "/support-cmd-anvil.jpg",
        price: "25 ₴",
        qty: true,
      },
      {
        order: 7,
        title: "Ендерчест будь-де",
        description:
          "Команда /enderchest — відкрий свій ендерчест будь-де раз на годину. Ціна за 1 команду.",
        image: "/support-cmd-enderchest.jpg",
        price: "25 ₴",
        qty: true,
      },
      {
        order: 8,
        title: "Телепорт на спавн",
        description:
          "Команда /spawn — миттєво перенесись на спавн раз на 2 години. Ціна за 1 команду.",
        image: "/support-cmd-spawn.jpg",
        price: "25 ₴",
        qty: true,
      },
    ] as const;
    for (const s of seeds) {
      const tiersJson = JSON.stringify(
        "tiers" in s && Array.isArray(s.tiers)
          ? s.tiers
          : [{ label: "", price_label: s.price }],
      );
      await sql`
        INSERT INTO support_cards (
          sort_order, title, description, image_url, price_label, price_tiers,
          button_url, quantity_enabled
        )
        VALUES (
          ${s.order},
          ${s.title},
          ${s.description},
          ${s.image},
          ${s.price},
          ${tiersJson},
          ${""},
          ${s.qty}
        )
      `;
    }
  }

  // Seed settings defaults
  const defaults: Record<string, string> = {
    java_ip:
      process.env.NEXT_PUBLIC_SERVER_IP?.trim() || LC_DEFAULT_JAVA_SERVER_HOST,
    java_version: process.env.NEXT_PUBLIC_SERVER_VERSION?.trim() || "1.21.11",
    bedrock_address:
      process.env.NEXT_PUBLIC_BEDROCK_ADDRESS?.trim() ||
      "play.lost-chronicles.site",
    bedrock_port: process.env.NEXT_PUBLIC_BEDROCK_PORT?.trim() || "19132",
    mono_jar_url:
      process.env.NEXT_PUBLIC_MONO_JAR_URL?.trim() ||
      "https://send.monobank.ua/jar/8f7nV8DopG",
    support_blurb: "",
    catalog_vote_links: JSON.stringify(DEFAULT_CATALOG_LINKS),
  };
  for (const [key, value] of Object.entries(defaults)) {
    await sql`
      INSERT INTO site_settings (key, value)
      VALUES (${key}, ${value})
      ON CONFLICT (key) DO NOTHING
    `;
  }

  // Прибрати старий дефолтний blurb підтримки
  await sql`
    UPDATE site_settings
    SET value = '', updated_at = NOW()
    WHERE key = 'support_blurb'
      AND value = ${"Голос у каталогах або донат — обидва варіанти допомагають."}
  `;

  // Власник
  await sql`
    UPDATE users
    SET role = 'admin'
    WHERE role IS DISTINCT FROM 'admin'
      AND (
        lower(trim(coalesce(game_nickname, ''))) = 'way_zeman'
        OR lower(trim(coalesce(username, ''))) = 'way_zeman'
        OR lower(replace(trim(coalesce(username, '')), ' ', '_')) LIKE 'way_zeman%'
      )
  `;

  cmsEnsured = true;
}

export async function promoteSuperAdmins(): Promise<void> {
  await ensureCmsTables();
  const sql = getSql();
  await sql`
    UPDATE users
    SET role = 'admin'
    WHERE role IS DISTINCT FROM 'admin'
      AND (
        lower(trim(coalesce(game_nickname, ''))) = 'way_zeman'
        OR lower(trim(coalesce(username, ''))) = 'way_zeman'
      )
  `;
}

export async function getUserRole(userId: number): Promise<UserRole> {
  await ensureCmsTables();
  const sql = getSql();
  const rows = rowsOf(await sql`
    SELECT role, game_nickname, username
    FROM users
    WHERE id = ${userId}
    LIMIT 1
  `);
  const r = rows[0];
  if (!r) return "user";
  if (
    isSuperAdminNick(
      r.game_nickname == null ? null : String(r.game_nickname),
    ) ||
    isSuperAdminNick(r.username == null ? null : String(r.username))
  ) {
    if (normalizeRole(r.role) !== "admin") {
      await sql`UPDATE users SET role = 'admin' WHERE id = ${userId}`;
    }
    return "admin";
  }
  return normalizeRole(r.role);
}

export async function requireAdminUserId(
  userId: number | null,
): Promise<number | null> {
  if (!userId) return null;
  const role = await getUserRole(userId);
  return role === "admin" ? userId : null;
}

export async function listFaqItems(): Promise<FaqItemRecord[]> {
  await ensureCmsTables();
  const sql = getSql();
  const rows = rowsOf(await sql`
    SELECT id, sort_order, question, answer_html
    FROM faq_items
    ORDER BY sort_order ASC, id ASC
  `);
  return rows.map((r) => ({
    id: num(r.id),
    sort_order: num(r.sort_order),
    question: String(r.question ?? ""),
    answer_html: String(r.answer_html ?? ""),
  }));
}

export async function replaceFaqItems(
  items: { sort_order: number; question: string; answer_html: string }[],
): Promise<FaqItemRecord[]> {
  await ensureCmsTables();
  const sql = getSql();
  await sql`DELETE FROM faq_items`;
  for (const item of items) {
    await sql`
      INSERT INTO faq_items (sort_order, question, answer_html)
      VALUES (${item.sort_order}, ${item.question}, ${item.answer_html})
    `;
  }
  return listFaqItems();
}

async function getSetting(key: string): Promise<string | null> {
  await ensureCmsTables();
  const sql = getSql();
  const rows = rowsOf(await sql`
    SELECT value FROM site_settings WHERE key = ${key} LIMIT 1
  `);
  const v = rows[0]?.value;
  return v == null ? null : String(v);
}

async function setSetting(key: string, value: string): Promise<void> {
  await ensureCmsTables();
  const sql = getSql();
  await sql`
    INSERT INTO site_settings (key, value, updated_at)
    VALUES (${key}, ${value}, NOW())
    ON CONFLICT (key) DO UPDATE SET
      value = EXCLUDED.value,
      updated_at = NOW()
  `;
}

function parseCatalogLinks(raw: string | null): CatalogVoteLink[] {
  if (!raw) return DEFAULT_CATALOG_LINKS;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return DEFAULT_CATALOG_LINKS;
    const out: CatalogVoteLink[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const o = item as Record<string, unknown>;
      const href = typeof o.href === "string" ? o.href.trim() : "";
      const label = typeof o.label === "string" ? o.label.trim() : "";
      const shortLabel =
        typeof o.shortLabel === "string" ? o.shortLabel.trim() : label;
      if (!href || !label) continue;
      out.push({ href, label, shortLabel: shortLabel || label });
    }
    return out.length > 0 ? out : DEFAULT_CATALOG_LINKS;
  } catch {
    return DEFAULT_CATALOG_LINKS;
  }
}

export async function getConnectSettings(): Promise<SiteConnectSettings> {
  return {
    javaIp:
      (await getSetting("java_ip")) ||
      process.env.NEXT_PUBLIC_SERVER_IP?.trim() ||
      LC_DEFAULT_JAVA_SERVER_HOST,
    javaVersion:
      (await getSetting("java_version")) ||
      process.env.NEXT_PUBLIC_SERVER_VERSION?.trim() ||
      "1.21.11",
    bedrockAddress:
      (await getSetting("bedrock_address")) ||
      process.env.NEXT_PUBLIC_BEDROCK_ADDRESS?.trim() ||
      "play.lost-chronicles.site",
    bedrockPort:
      (await getSetting("bedrock_port")) ||
      process.env.NEXT_PUBLIC_BEDROCK_PORT?.trim() ||
      "19132",
  };
}

export async function getSupportSettings(): Promise<SiteSupportSettings> {
  return {
    monoJarUrl:
      (await getSetting("mono_jar_url")) ||
      process.env.NEXT_PUBLIC_MONO_JAR_URL?.trim() ||
      "https://send.monobank.ua/jar/8f7nV8DopG",
    blurb: (await getSetting("support_blurb")) || "",
    catalogLinks: parseCatalogLinks(await getSetting("catalog_vote_links")),
  };
}

export async function saveConnectSettings(
  s: SiteConnectSettings,
): Promise<SiteConnectSettings> {
  await setSetting("java_ip", s.javaIp.trim());
  await setSetting("java_version", s.javaVersion.trim());
  await setSetting("bedrock_address", s.bedrockAddress.trim());
  await setSetting("bedrock_port", s.bedrockPort.trim());
  return getConnectSettings();
}

export async function saveSupportSettings(
  s: SiteSupportSettings,
): Promise<SiteSupportSettings> {
  await setSetting("mono_jar_url", s.monoJarUrl.trim());
  await setSetting("support_blurb", s.blurb.trim());
  await setSetting("catalog_vote_links", JSON.stringify(s.catalogLinks));
  return getSupportSettings();
}

export type SupportCardRecord = {
  id: number;
  sort_order: number;
  title: string;
  description: string;
  image_url: string;
  price_label: string;
  price_tiers: SupportPriceTier[];
  button_url: string;
  quantity_enabled: boolean;
};

export type SupportCardInput = {
  sort_order: number;
  title: string;
  description: string;
  image_url: string;
  price_label: string;
  price_tiers?: SupportPriceTier[];
  button_url: string;
  quantity_enabled: boolean;
};

export async function listSupportCards(): Promise<SupportCardRecord[]> {
  await ensureCmsTables();
  const sql = getSql();
  const rows = rowsOf(await sql`
    SELECT
      id, sort_order, title, description, image_url, price_label, price_tiers,
      button_url, quantity_enabled
    FROM support_cards
    ORDER BY sort_order ASC, id ASC
  `);
  return rows.map((r) => ({
    id: num(r.id),
    sort_order: num(r.sort_order),
    title: String(r.title ?? ""),
    description: String(r.description ?? ""),
    image_url: String(r.image_url ?? ""),
    price_label: String(r.price_label ?? ""),
    price_tiers: normalizePriceTiers(parsePriceTiersJson(r.price_tiers)),
    button_url: String(r.button_url ?? ""),
    quantity_enabled: r.quantity_enabled !== false && r.quantity_enabled !== "f",
  }));
}

export async function replaceSupportCards(
  items: SupportCardInput[],
): Promise<SupportCardRecord[]> {
  await ensureCmsTables();
  const sql = getSql();
  await sql`DELETE FROM support_cards`;
  for (const item of items) {
    const tiers = normalizePriceTiers(item.price_tiers ?? []);
    const price_label =
      tiers.length > 0
        ? summarizePriceLabel(tiers)
        : item.price_label.trim();
    const tiersJson = JSON.stringify(tiers);
    await sql`
      INSERT INTO support_cards (
        sort_order, title, description, image_url, price_label, price_tiers,
        button_url, quantity_enabled
      )
      VALUES (
        ${item.sort_order},
        ${item.title},
        ${item.description},
        ${item.image_url},
        ${price_label},
        ${tiersJson},
        ${item.button_url},
        ${item.quantity_enabled}
      )
    `;
  }
  return listSupportCards();
}

export type AdminUserRow = {
  id: number;
  username: string;
  game_nickname: string | null;
  role: UserRole;
};

export async function listUsersForAdmin(): Promise<AdminUserRow[]> {
  await ensureCmsTables();
  await promoteSuperAdmins();
  const sql = getSql();
  const rows = rowsOf(await sql`
    SELECT id, username, game_nickname, role
    FROM users
    ORDER BY
      CASE WHEN role = 'admin' THEN 0 ELSE 1 END,
      lower(coalesce(nullif(trim(game_nickname), ''), username)) ASC
    LIMIT 200
  `);
  return rows.map((r) => ({
    id: num(r.id),
    username: String(r.username ?? ""),
    game_nickname:
      r.game_nickname === null || r.game_nickname === undefined
        ? null
        : String(r.game_nickname),
    role: normalizeRole(r.role),
  }));
}

export async function setUserRole(
  targetUserId: number,
  role: UserRole,
  actorUserId: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await ensureCmsTables();
  if (targetUserId === actorUserId && role !== "admin") {
    return { ok: false, error: "Не можна зняти адміна з себе." };
  }
  const sql = getSql();
  const targets = rowsOf(await sql`
    SELECT id, game_nickname, username, role
    FROM users WHERE id = ${targetUserId} LIMIT 1
  `);
  const t = targets[0];
  if (!t) return { ok: false, error: "Користувача не знайдено." };
  if (
    isSuperAdminNick(
      t.game_nickname == null ? null : String(t.game_nickname),
    ) ||
    isSuperAdminNick(t.username == null ? null : String(t.username))
  ) {
    if (role !== "admin") {
      return { ok: false, error: "Не можна зняти роль з власника Way_Zeman." };
    }
  }
  await sql`UPDATE users SET role = ${role} WHERE id = ${targetUserId}`;
  return { ok: true };
}
