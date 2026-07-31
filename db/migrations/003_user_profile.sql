-- Профіль гравця: ігровий нік + кастомний аватар.
ALTER TABLE users ADD COLUMN IF NOT EXISTS game_nickname VARCHAR(16);
ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_avatar TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS users_game_nickname_uidx
  ON users (game_nickname)
  WHERE game_nickname IS NOT NULL;
