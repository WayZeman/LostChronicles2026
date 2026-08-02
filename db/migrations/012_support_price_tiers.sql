-- Варіанти цін для товарів магазину (JSON: [{label, price_label}, ...])
ALTER TABLE support_cards
  ADD COLUMN IF NOT EXISTS price_tiers TEXT NOT NULL DEFAULT '[]';
