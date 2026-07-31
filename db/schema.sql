-- Lost Chronicles — proposals & voting (PostgreSQL / Neon)
-- Виконай у Neon: SQL Editor → встав скрипт → Run.
-- Або: Vercel → Storage → Neon → відкрити консоль.
--
-- Якщо база вже була без коментарів: лише db/migrations/001_proposal_comments.sql

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    discord_id VARCHAR(50) UNIQUE,
    google_id VARCHAR(64) UNIQUE,
    username VARCHAR(100) NOT NULL,
    avatar VARCHAR(512) NULL,
    -- Ігровий нік (Minecraft); показується в голосах / профілі
    game_nickname VARCHAR(16),
    -- Кастомний аватар (data URL або https); має пріоритет над OAuth avatar
    custom_avatar TEXT,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS users_game_nickname_uidx
    ON users (game_nickname)
    WHERE game_nickname IS NOT NULL;

CREATE INDEX IF NOT EXISTS users_role_idx ON users (role);

CREATE TABLE IF NOT EXISTS proposals (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    -- active | closed (результат) | cancelled (замало голосів після ends_at)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ends_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS votes (
    id SERIAL PRIMARY KEY,
    proposal_id INT NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vote SMALLINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (proposal_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_proposals_status_ends ON proposals (status, ends_at);
CREATE INDEX IF NOT EXISTS idx_proposals_user ON proposals (user_id);

CREATE TABLE IF NOT EXISTS proposal_comments (
    id SERIAL PRIMARY KEY,
    proposal_id INT NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id INT REFERENCES proposal_comments(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proposal_comments_proposal_created
    ON proposal_comments (proposal_id, created_at);

CREATE INDEX IF NOT EXISTS idx_proposal_comments_parent
    ON proposal_comments (parent_id);

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
