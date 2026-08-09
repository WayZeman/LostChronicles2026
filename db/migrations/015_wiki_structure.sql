-- Ієрархія вікі: розділи → блоки (категорії) → сторінки
CREATE TABLE IF NOT EXISTS wiki_sections (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wiki_categories (
  id SERIAL PRIMARY KEY,
  section_id INT NOT NULL REFERENCES wiki_sections (id) ON DELETE CASCADE,
  slug VARCHAR(255) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT wiki_categories_slug_uidx UNIQUE (slug)
);

CREATE INDEX IF NOT EXISTS wiki_categories_section_idx
  ON wiki_categories (section_id, sort_order ASC, id ASC);

CREATE TABLE IF NOT EXISTS wiki_category_pages (
  id SERIAL PRIMARY KEY,
  category_id INT NOT NULL REFERENCES wiki_categories (id) ON DELETE CASCADE,
  page_id INT NOT NULL REFERENCES wiki_pages (id) ON DELETE CASCADE,
  short_code VARCHAR(32) NOT NULL DEFAULT '',
  card_blurb TEXT NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  CONSTRAINT wiki_category_pages_uidx UNIQUE (category_id, page_id)
);

CREATE INDEX IF NOT EXISTS wiki_category_pages_cat_idx
  ON wiki_category_pages (category_id, sort_order ASC, id ASC);

-- Соц. кнопки на сторінці статті (JSON-масив)
ALTER TABLE wiki_pages
  ADD COLUMN IF NOT EXISTS social_links TEXT NOT NULL DEFAULT '[]';

ALTER TABLE wiki_pages
  ADD COLUMN IF NOT EXISTS summary TEXT NOT NULL DEFAULT '';
