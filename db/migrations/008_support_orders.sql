-- Замовлення з /support → після оплати Mono → Telegram (@serveranketbot)

CREATE TABLE IF NOT EXISTS support_orders (
  id SERIAL PRIMARY KEY,
  card_id INT REFERENCES support_cards(id) ON DELETE SET NULL,
  card_title VARCHAR(200) NOT NULL,
  price_label VARCHAR(64) NOT NULL,
  amount_kopecks INT NOT NULL,
  nickname VARCHAR(64) NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  -- pending | paid | expired | cancelled
  paid_at TIMESTAMPTZ,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS support_orders_pending_amount_idx
  ON support_orders (status, amount_kopecks, created_at);

CREATE INDEX IF NOT EXISTS support_orders_created_idx
  ON support_orders (created_at DESC);
