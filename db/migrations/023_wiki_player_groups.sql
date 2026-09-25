-- Категорії держав у розділі «Гравці» (показуються навіть без гравців).
CREATE TABLE IF NOT EXISTS wiki_player_groups (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT wiki_player_groups_title_uidx UNIQUE (title)
);
