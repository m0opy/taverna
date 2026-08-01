CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE npc_attitude AS ENUM ('ally', 'neutral', 'enemy', 'unknown');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(40) NOT NULL,
  email VARCHAR(254) NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW()
);

CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(60) NOT NULL,
  synopsis VARCHAR(500) NOT NULL DEFAULT '',
  cover_key VARCHAR(16) NOT NULL,
  invite_token CHAR(12) NOT NULL,
  next_session_at DATE NULL,
  owner_id UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  created_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
  CONSTRAINT campaigns_cover_key_check CHECK (
    cover_key IN ('forest', 'dungeon', 'tavern', 'sea', 'mountains', 'city')
  ),
  CONSTRAINT campaigns_invite_token_len_check CHECK (char_length(invite_token) = 12)
);

CREATE TABLE memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns (id) ON DELETE CASCADE ON UPDATE CASCADE,
  character_name VARCHAR(40) NULL,
  character_class VARCHAR(60) NULL,
  character_info VARCHAR(300) NULL,
  joined_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
  left_at TIMESTAMPTZ(3) NULL
);

CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns (id) ON DELETE CASCADE ON UPDATE CASCADE,
  author_id UUID NOT NULL REFERENCES memberships (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  body TEXT NOT NULL,
  session_date DATE NULL,
  created_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW()
);

CREATE TABLE npcs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns (id) ON DELETE CASCADE ON UPDATE CASCADE,
  created_by_id UUID NOT NULL REFERENCES memberships (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  name VARCHAR(60) NOT NULL,
  title VARCHAR(60) NOT NULL DEFAULT '',
  attitude npc_attitude NOT NULL DEFAULT 'unknown',
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  notes VARCHAR(1000) NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT NOW()
);

CREATE TABLE npc_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_npc_id UUID NOT NULL REFERENCES npcs (id) ON DELETE CASCADE ON UPDATE CASCADE,
  to_npc_id UUID NOT NULL REFERENCES npcs (id) ON DELETE CASCADE ON UPDATE CASCADE,
  label VARCHAR(60) NOT NULL,
  CONSTRAINT npc_relations_self_check CHECK (from_npc_id <> to_npc_id)
);

CREATE UNIQUE INDEX users_email_uk
  ON users (email);

CREATE UNIQUE INDEX campaigns_invite_token_uk
  ON campaigns (invite_token);

CREATE INDEX campaigns_owner_idx
  ON campaigns (owner_id);

CREATE INDEX memberships_campaign_active_idx
  ON memberships (campaign_id)
  WHERE left_at IS NULL;

CREATE INDEX memberships_user_active_idx
  ON memberships (user_id)
  WHERE left_at IS NULL;

CREATE UNIQUE INDEX memberships_user_campaign_active_uk
  ON memberships (user_id, campaign_id)
  WHERE left_at IS NULL;

CREATE INDEX notes_campaign_session_created_idx
  ON notes (campaign_id, session_date DESC, created_at DESC);

CREATE INDEX npcs_campaign_updated_idx
  ON npcs (campaign_id, updated_at DESC);

CREATE INDEX npc_relations_from_idx
  ON npc_relations (from_npc_id);

CREATE INDEX npc_relations_to_idx
  ON npc_relations (to_npc_id);
