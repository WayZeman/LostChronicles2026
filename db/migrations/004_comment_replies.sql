-- Відповіді на коментарі пропозицій.
ALTER TABLE proposal_comments
  ADD COLUMN IF NOT EXISTS parent_id INT
  REFERENCES proposal_comments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_proposal_comments_parent
  ON proposal_comments (parent_id);
