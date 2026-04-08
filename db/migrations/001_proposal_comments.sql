-- Одноразово у Neon: SQL Editor → встав → Run.
-- Потрібно для коментарів під пропозиціями (якщо база була створена раніше без цієї таблиці).

CREATE TABLE IF NOT EXISTS proposal_comments (
    id SERIAL PRIMARY KEY,
    proposal_id INT NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proposal_comments_proposal_created
    ON proposal_comments (proposal_id, created_at);
