-- Flexible application answers (JSON) for Google-Forms-like questions
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS answers_json TEXT NOT NULL DEFAULT '{}';
