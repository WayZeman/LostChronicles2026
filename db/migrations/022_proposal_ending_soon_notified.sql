-- Нагадування в Discord/Telegram за ~1 год до ends_at (один раз на голосування).
ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS ending_soon_notified_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_proposals_ending_soon
  ON proposals (ends_at)
  WHERE status = 'active' AND ending_soon_notified_at IS NULL;
