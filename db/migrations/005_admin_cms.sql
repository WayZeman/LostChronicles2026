-- Ролі сайту + CMS (FAQ / підключення / підтримка).
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user';
CREATE INDEX IF NOT EXISTS users_role_idx ON users (role);

-- Власник сайту
UPDATE users
SET role = 'admin'
WHERE role <> 'admin'
  AND (
    lower(trim(coalesce(game_nickname, ''))) = 'way_zeman'
    OR lower(trim(coalesce(username, ''))) = 'way_zeman'
    OR lower(trim(coalesce(username, ''))) LIKE 'way_zeman%'
  );

CREATE TABLE IF NOT EXISTS faq_items (
    id SERIAL PRIMARY KEY,
    sort_order INT NOT NULL DEFAULT 0,
    question VARCHAR(500) NOT NULL,
    answer_html TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS faq_items_sort_idx ON faq_items (sort_order, id);

CREATE TABLE IF NOT EXISTS site_settings (
    key VARCHAR(64) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
