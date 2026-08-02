-- Preserve dates created before the calendar existed by turning each into a schedule entry.
INSERT INTO games (campaign_id, scheduled_for, scheduled_time, title, description)
SELECT campaigns.id, campaigns.next_session_at, NULL, 'Игра', ''
FROM campaigns
WHERE campaigns.next_session_at IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM games
    WHERE games.campaign_id = campaigns.id
      AND games.scheduled_for = campaigns.next_session_at
  );

-- The campaign summary caches the earliest game that has not yet happened.
WITH next_games AS (
  SELECT DISTINCT ON (campaign_id) campaign_id, scheduled_for
  FROM games
  WHERE scheduled_for >= (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date
  ORDER BY campaign_id, scheduled_for ASC, scheduled_time ASC NULLS LAST, created_at ASC
)
UPDATE campaigns
SET next_session_at = next_games.scheduled_for
FROM next_games
WHERE campaigns.id = next_games.campaign_id;

UPDATE campaigns
SET next_session_at = NULL
WHERE NOT EXISTS (
  SELECT 1
  FROM games
  WHERE games.campaign_id = campaigns.id
    AND games.scheduled_for >= (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date
);
