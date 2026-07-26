-- Google OAuth: users можуть логінитись Discord або Google.
ALTER TABLE users ALTER COLUMN discord_id DROP NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(64);
ALTER TABLE users ALTER COLUMN avatar TYPE VARCHAR(512);
CREATE UNIQUE INDEX IF NOT EXISTS users_google_id_uidx
  ON users (google_id);
