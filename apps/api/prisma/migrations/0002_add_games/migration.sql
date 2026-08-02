CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns (id) ON DELETE CASCADE ON UPDATE CASCADE,
  scheduled_for DATE NOT NULL,
  scheduled_time CHAR(5),
  title VARCHAR(80) NOT NULL,
  description VARCHAR(500) NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT games_scheduled_time_check CHECK (
    scheduled_time IS NULL OR scheduled_time ~ '^(?:[01][0-9]|2[0-3]):[0-5][0-9]$'
  )
);

CREATE INDEX games_campaign_scheduled_idx
  ON games (campaign_id, scheduled_for, scheduled_time);
