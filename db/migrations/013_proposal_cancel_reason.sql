-- Причина скасування пропозиції адміністрацією (NULL = авто-скасування через низьку явку)

ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS cancel_reason TEXT;
