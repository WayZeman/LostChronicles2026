-- Заявки на вайтлист (анкета на сайті)
CREATE TABLE IF NOT EXISTS applications (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  nickname TEXT NOT NULL,
  birthday TEXT,
  age TEXT NOT NULL,
  contacts TEXT NOT NULL,
  experience TEXT NOT NULL,
  previous_projects TEXT NOT NULL,
  why_server TEXT NOT NULL,
  how_found TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS applications_created_at_idx
  ON applications (created_at DESC);
