-- Фото на картках сторінок у реєстрах (Держави, Міста, …)
ALTER TABLE wiki_category_pages
  ADD COLUMN IF NOT EXISTS image_url TEXT NOT NULL DEFAULT '';
