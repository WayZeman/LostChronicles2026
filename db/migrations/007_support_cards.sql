-- Картки пропозицій для сторінки підтримки / донату

CREATE TABLE IF NOT EXISTS support_cards (
  id SERIAL PRIMARY KEY,
  sort_order INT NOT NULL DEFAULT 0,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  price_label VARCHAR(64) NOT NULL,
  button_url TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS support_cards_sort_idx
  ON support_cards (sort_order, id);
