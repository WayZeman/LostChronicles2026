-- Анонімне vs відкрите голосування; час останньої зміни голосу
ALTER TABLE proposals
ADD COLUMN IF NOT EXISTS anonymous_voting BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE votes
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

UPDATE votes SET updated_at = created_at WHERE updated_at IS NULL;

ALTER TABLE votes ALTER COLUMN updated_at SET DEFAULT NOW();
ALTER TABLE votes ALTER COLUMN updated_at SET NOT NULL;
