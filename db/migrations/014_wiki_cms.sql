-- Власна вікі на Neon (без Fandom як джерела правди).
CREATE TABLE IF NOT EXISTS wiki_pages (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content_html TEXT NOT NULL DEFAULT '',
  created_by INTEGER REFERENCES users (id) ON DELETE SET NULL,
  updated_by INTEGER REFERENCES users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT wiki_pages_slug_uidx UNIQUE (slug)
);

CREATE INDEX IF NOT EXISTS wiki_pages_title_idx ON wiki_pages (lower(title));
CREATE INDEX IF NOT EXISTS wiki_pages_updated_idx ON wiki_pages (updated_at DESC);

CREATE TABLE IF NOT EXISTS wiki_revisions (
  id SERIAL PRIMARY KEY,
  page_id INTEGER NOT NULL REFERENCES wiki_pages (id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content_html TEXT NOT NULL,
  edited_by INTEGER REFERENCES users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS wiki_revisions_page_idx
  ON wiki_revisions (page_id, created_at DESC);

-- Роль wiki_editor: VARCHAR(20) уже є на users; значення: user | wiki_editor | admin
