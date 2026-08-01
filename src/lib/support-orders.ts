import { getSql } from "@/lib/db";

function rowsOf(r: unknown): Record<string, unknown>[] {
  return Array.isArray(r) ? (r as Record<string, unknown>[]) : [];
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

let ensured = false;

export async function ensureSupportOrdersTable(): Promise<void> {
  if (ensured) return;
  const sql = getSql();
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
    CREATE INDEX IF NOT EXISTS support_orders_pending_amount_idx
    ON support_orders (status, amount_kopecks, created_at)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS support_order_items_order_idx
    ON support_order_items (order_id)
  `;
  ensured = true;
}

/** «20 ₴» / «50 грн» → копійки. */
export function parsePriceLabelToKopecks(label: string): number | null {
  const m = label.replace(",", ".").match(/(\d+(?:\.\d+)?)/);
  if (!m) return null;
  const uah = Number(m[1]);
  if (!Number.isFinite(uah) || uah <= 0) return null;
  return Math.round(uah * 100);
}

export function clampOrderQuantity(raw: unknown): number {
  const n = Math.floor(Number(raw));
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(20, n);
}

export function buildMonoJarPayUrl(jarUrl: string, amountKopecks: number): string {
  const base = jarUrl.trim();
  if (!base) return base;
  const uah = Math.round(amountKopecks) / 100;
  if (!(uah > 0)) return base;
  try {
    const u = new URL(base);
    u.searchParams.set("a", String(uah));
    return u.toString();
  } catch {
    const sep = base.includes("?") ? "&" : "?";
    return `${base}${sep}a=${uah}`;
  }
}

export type SupportOrderItemRecord = {
  card_id: number | null;
  card_title: string;
  price_label: string;
  unit_kopecks: number;
  quantity: number;
  line_kopecks: number;
};

export type SupportOrderRecord = {
  id: number;
  card_id: number | null;
  card_title: string;
  price_label: string;
  amount_kopecks: number;
  quantity: number;
  nickname: string;
  note: string;
  status: string;
  created_at: string;
  items: SupportOrderItemRecord[];
};

function mapOrderRow(
  row: Record<string, unknown>,
  items: SupportOrderItemRecord[] = [],
): SupportOrderRecord {
  return {
    id: num(row.id),
    card_id: row.card_id == null ? null : num(row.card_id),
    card_title: String(row.card_title ?? ""),
    price_label: String(row.price_label ?? ""),
    amount_kopecks: num(row.amount_kopecks),
    quantity: Math.max(1, num(row.quantity) || 1),
    nickname: String(row.nickname ?? ""),
    note: String(row.note ?? ""),
    status: String(row.status ?? "pending"),
    created_at: String(row.created_at ?? ""),
    items,
  };
}

async function loadOrderItems(
  orderId: number,
): Promise<SupportOrderItemRecord[]> {
  const sql = getSql();
  const rows = rowsOf(
    await sql`
      SELECT
        card_id, card_title, price_label, unit_kopecks, quantity, line_kopecks
      FROM support_order_items
      WHERE order_id = ${orderId}
      ORDER BY id ASC
    `,
  );
  return rows.map((r) => ({
    card_id: r.card_id == null ? null : num(r.card_id),
    card_title: String(r.card_title ?? ""),
    price_label: String(r.price_label ?? ""),
    unit_kopecks: num(r.unit_kopecks),
    quantity: Math.max(1, num(r.quantity) || 1),
    line_kopecks: num(r.line_kopecks),
  }));
}

export async function getSupportOrderById(
  id: number,
): Promise<SupportOrderRecord | null> {
  await ensureSupportOrdersTable();
  const sql = getSql();
  const rows = rowsOf(
    await sql`
      SELECT
        id, card_id, card_title, price_label, amount_kopecks, quantity,
        nickname, note, status, created_at
      FROM support_orders
      WHERE id = ${id}
      LIMIT 1
    `,
  );
  const row = rows[0];
  if (!row) return null;
  const items = await loadOrderItems(id);
  return mapOrderRow(row, items);
}

export type CheckoutItemInput = {
  cardId: number;
  quantity?: number;
};

/**
 * Створити замовлення з однієї або кількох позицій (кошик).
 */
export async function createSupportCheckout(input: {
  nickname: string;
  note?: string;
  items: CheckoutItemInput[];
}): Promise<SupportOrderRecord> {
  await ensureSupportOrdersTable();
  const sql = getSql();
  const nick = input.nickname.trim().slice(0, 64);
  if (nick.length < 2) {
    throw new Error("Вкажи нікнейм (мінімум 2 символи).");
  }
  const note = (input.note ?? "").trim().slice(0, 500);
  if (!Array.isArray(input.items) || input.items.length === 0) {
    throw new Error("Кошик порожній.");
  }
  if (input.items.length > 30) {
    throw new Error("Занадто багато позицій у кошику.");
  }

  const merged = new Map<number, number>();
  for (const raw of input.items) {
    const cardId = Number(raw.cardId);
    if (!Number.isInteger(cardId) || cardId < 1) {
      throw new Error("Некоректна картка в кошику.");
    }
    merged.set(cardId, (merged.get(cardId) ?? 0) + clampOrderQuantity(raw.quantity));
  }

  type Line = {
    cardId: number;
    title: string;
    priceLabel: string;
    unitKopecks: number;
    quantity: number;
    lineKopecks: number;
    quantityEnabled: boolean;
  };
  const lines: Line[] = [];

  for (const [cardId, qtyRaw] of merged) {
    const cards = rowsOf(
      await sql`
        SELECT id, title, price_label, quantity_enabled
        FROM support_cards
        WHERE id = ${cardId}
        LIMIT 1
      `,
    );
    const card = cards[0];
    if (!card) throw new Error(`Картку #${cardId} не знайдено.`);

    const quantityEnabled =
      card.quantity_enabled !== false && card.quantity_enabled !== "f";
    const quantity = quantityEnabled ? clampOrderQuantity(qtyRaw) : 1;
    const title = String(card.title ?? "");
    const priceLabel = String(card.price_label ?? "");
    const unitKopecks = parsePriceLabelToKopecks(priceLabel);
    if (unitKopecks == null) {
      throw new Error(`Не вдалося розпізнати ціну: ${title}`);
    }
    lines.push({
      cardId: num(card.id),
      title,
      priceLabel,
      unitKopecks,
      quantity,
      lineKopecks: unitKopecks * quantity,
      quantityEnabled,
    });
  }

  const totalKopecks = lines.reduce((s, l) => s + l.lineKopecks, 0);
  const totalQty = lines.reduce((s, l) => s + l.quantity, 0);
  const summaryTitle =
    lines.length === 1 ? lines[0].title : `Кошик (${lines.length} поз.)`;
  const summaryPrice =
    lines.length === 1
      ? lines[0].priceLabel
      : `${(totalKopecks / 100).toLocaleString("uk-UA")} ₴`;

  const inserted = rowsOf(
    await sql`
      INSERT INTO support_orders (
        card_id, card_title, price_label, amount_kopecks, quantity,
        nickname, note, status
      )
      VALUES (
        ${lines.length === 1 ? lines[0].cardId : null},
        ${summaryTitle},
        ${summaryPrice},
        ${totalKopecks},
        ${totalQty},
        ${nick},
        ${note},
        ${"pending"}
      )
      RETURNING
        id, card_id, card_title, price_label, amount_kopecks, quantity,
        nickname, note, status, created_at
    `,
  );
  const row = inserted[0];
  if (!row) throw new Error("Не вдалося створити замовлення.");
  const orderId = num(row.id);

  const items: SupportOrderItemRecord[] = [];
  for (const line of lines) {
    await sql`
      INSERT INTO support_order_items (
        order_id, card_id, card_title, price_label,
        unit_kopecks, quantity, line_kopecks
      )
      VALUES (
        ${orderId},
        ${line.cardId},
        ${line.title},
        ${line.priceLabel},
        ${line.unitKopecks},
        ${line.quantity},
        ${line.lineKopecks}
      )
    `;
    items.push({
      card_id: line.cardId,
      card_title: line.title,
      price_label: line.priceLabel,
      unit_kopecks: line.unitKopecks,
      quantity: line.quantity,
      line_kopecks: line.lineKopecks,
    });
  }

  return mapOrderRow(row, items);
}

/** @deprecated use createSupportCheckout */
export async function createSupportOrder(input: {
  cardId: number;
  nickname: string;
  note?: string;
  quantity?: number;
}): Promise<SupportOrderRecord> {
  return createSupportCheckout({
    nickname: input.nickname,
    note: input.note,
    items: [{ cardId: input.cardId, quantity: input.quantity }],
  });
}

export async function expireStaleSupportOrders(): Promise<number> {
  await ensureSupportOrdersTable();
  const sql = getSql();
  const rows = rowsOf(
    await sql`
      UPDATE support_orders
      SET status = 'expired'
      WHERE status = 'pending'
        AND created_at < NOW() - INTERVAL '36 hours'
      RETURNING id
    `,
  );
  return rows.length;
}

function pickOrdersForAmount(
  pending: SupportOrderRecord[],
  differenceKopecks: number,
): SupportOrderRecord[] {
  if (!(differenceKopecks > 0) || pending.length === 0) return [];

  const exact = pending.find((o) => o.amount_kopecks === differenceKopecks);
  if (exact) return [exact];

  const amounts = [...new Set(pending.map((o) => o.amount_kopecks))].filter(
    (a) => a > 0 && differenceKopecks % a === 0,
  );
  for (const amount of amounts) {
    const need = differenceKopecks / amount;
    const pool = pending.filter((o) => o.amount_kopecks === amount);
    if (pool.length >= need) return pool.slice(0, need);
  }

  const pool = pending.slice(0, 12);
  const n = pool.length;
  const limit = 1 << n;
  for (let mask = 1; mask < limit; mask++) {
    let sum = 0;
    const picked: SupportOrderRecord[] = [];
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) {
        sum += pool[i].amount_kopecks;
        picked.push(pool[i]);
        if (sum > differenceKopecks) break;
      }
    }
    if (sum === differenceKopecks) return picked;
  }

  return [];
}

export async function matchPendingOrdersByPayment(
  differenceKopecks: number,
): Promise<SupportOrderRecord[]> {
  if (!(differenceKopecks > 0)) return [];
  await ensureSupportOrdersTable();
  await expireStaleSupportOrders();
  const sql = getSql();

  const pending = rowsOf(
    await sql`
      SELECT
        id, card_id, card_title, price_label, amount_kopecks, quantity,
        nickname, note, status, created_at
      FROM support_orders
      WHERE status = 'pending'
      ORDER BY created_at ASC, id ASC
      LIMIT 100
    `,
  ).map((row) => mapOrderRow(row));

  const matched = pickOrdersForAmount(pending, differenceKopecks);
  if (matched.length === 0) return [];

  for (const order of matched) {
    await sql`
      UPDATE support_orders
      SET status = 'paid', paid_at = NOW()
      WHERE id = ${order.id} AND status = 'pending'
    `;
    order.status = "paid";
    order.items = await loadOrderItems(order.id);
  }

  return matched;
}

export async function markOrdersNotified(ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  await ensureSupportOrdersTable();
  const sql = getSql();
  for (const id of ids) {
    await sql`
      UPDATE support_orders
      SET notified_at = NOW()
      WHERE id = ${id}
    `;
  }
}

const BALANCE_KEY = "mono_jar_last_balance_kopecks";

export async function getStoredMonoBalanceKopecks(): Promise<number | null> {
  const sql = getSql();
  const rows = rowsOf(
    await sql`
      SELECT value FROM site_settings WHERE key = ${BALANCE_KEY} LIMIT 1
    `,
  );
  if (!rows[0]) return null;
  const n = Number(String(rows[0].value ?? "").trim());
  return Number.isFinite(n) ? Math.round(n) : null;
}

export async function setStoredMonoBalanceKopecks(
  kopecks: number,
): Promise<void> {
  const sql = getSql();
  const value = String(Math.round(kopecks));
  await sql`
    INSERT INTO site_settings (key, value, updated_at)
    VALUES (${BALANCE_KEY}, ${value}, NOW())
    ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value, updated_at = NOW()
  `;
}
