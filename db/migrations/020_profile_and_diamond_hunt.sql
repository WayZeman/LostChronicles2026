-- Profile fields + diamond hunt event
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS profile_age TEXT NOT NULL DEFAULT '';

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS profile_birthday TEXT NOT NULL DEFAULT '';

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS profile_bio TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS diamond_event (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  title TEXT NOT NULL DEFAULT 'Пошук діамантів',
  blurb TEXT NOT NULL DEFAULT 'Знайди діаманти, сховані на сайті. Кожен день — нові місця.',
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  diamonds_per_day INT NOT NULL DEFAULT 20,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO diamond_event (id, enabled, title)
VALUES (1, FALSE, 'Пошук діамантів')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS diamond_collections (
  id BIGSERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  spot_id VARCHAR(64) NOT NULL,
  day_key DATE NOT NULL,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT diamond_collections_user_day_spot UNIQUE (user_id, day_key, spot_id)
);

CREATE INDEX IF NOT EXISTS diamond_collections_user_idx
  ON diamond_collections (user_id);

CREATE INDEX IF NOT EXISTS diamond_collections_day_idx
  ON diamond_collections (day_key);
