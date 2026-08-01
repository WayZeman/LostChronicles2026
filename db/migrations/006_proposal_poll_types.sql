-- Типи голосувань: yes_no (за/проти) | choice (вибір з варіантів)

ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS kind VARCHAR(20) NOT NULL DEFAULT 'yes_no';

CREATE TABLE IF NOT EXISTS proposal_options (
  id SERIAL PRIMARY KEY,
  proposal_id INT NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  label VARCHAR(200) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_proposal_options_proposal
  ON proposal_options (proposal_id, sort_order, id);

ALTER TABLE votes
  ADD COLUMN IF NOT EXISTS option_id INT REFERENCES proposal_options(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_votes_option ON votes (option_id);
