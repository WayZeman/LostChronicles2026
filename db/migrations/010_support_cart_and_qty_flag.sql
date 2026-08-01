-- quantity_enabled на картках + позиції кошика в замовленні

ALTER TABLE support_cards
  ADD COLUMN IF NOT EXISTS quantity_enabled BOOLEAN NOT NULL DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS support_order_items (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL REFERENCES support_orders(id) ON DELETE CASCADE,
  card_id INT REFERENCES support_cards(id) ON DELETE SET NULL,
  card_title VARCHAR(200) NOT NULL,
  price_label VARCHAR(64) NOT NULL,
  unit_kopecks INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  line_kopecks INT NOT NULL
);

CREATE INDEX IF NOT EXISTS support_order_items_order_idx
  ON support_order_items (order_id);
