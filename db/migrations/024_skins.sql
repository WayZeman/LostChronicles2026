-- Гравецькі Minecraft-скіни: галерея, лайки, завантаження.
CREATE TABLE IF NOT EXISTS skins (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  title VARCHAR(80) NOT NULL DEFAULT 'Без назви',
  model_type VARCHAR(10) NOT NULL DEFAULT 'classic'
    CHECK (model_type IN ('classic', 'slim')),
  png_data TEXT NOT NULL,
  likes_count INTEGER NOT NULL DEFAULT 0,
  downloads_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS skins_created_at_idx ON skins (created_at DESC);
CREATE INDEX IF NOT EXISTS skins_user_id_idx ON skins (user_id);
CREATE INDEX IF NOT EXISTS skins_likes_count_idx ON skins (likes_count DESC);

CREATE TABLE IF NOT EXISTS skin_likes (
  skin_id INTEGER NOT NULL REFERENCES skins (id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (skin_id, user_id)
);
