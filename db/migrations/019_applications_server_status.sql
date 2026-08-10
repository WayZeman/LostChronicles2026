-- Decision status for whitelist applications (Telegram /add server N)
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS server_status TEXT NOT NULL DEFAULT 'pending';

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS server_status_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS applications_server_status_idx
  ON applications (server_status);
