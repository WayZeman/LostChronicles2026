-- Diamond hunt v2: finishers + unique spot per user (no daily rotation)
CREATE TABLE IF NOT EXISTS diamond_finishers (
  user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  place INT NOT NULL,
  finished_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS diamond_finishers_place_uidx
  ON diamond_finishers (place);

CREATE UNIQUE INDEX IF NOT EXISTS diamond_collections_user_spot_uidx
  ON diamond_collections (user_id, spot_id);

UPDATE diamond_event
SET
  title = COALESCE(NULLIF(TRIM(title), ''), 'Пошук діамантів'),
  blurb = 'Якось випадковим чином по сайту Lost Chronicles розсипались діаманти. Вони ховаються в куточках сторінок, у відповідях FAQ і серед товарів магазину — шукай і збирай, поки триває подія.',
  diamonds_per_day = 100,
  updated_at = NOW()
WHERE id = 1;
