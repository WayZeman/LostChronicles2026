-- Зображення адмінки (товари підтримки тощо) — окремо від каталогу,
-- щоб PUT каталогу не ніс кілька мегабайт base64.
CREATE TABLE IF NOT EXISTS site_media (
  id VARCHAR(40) PRIMARY KEY,
  mime_type VARCHAR(64) NOT NULL,
  data_base64 TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
