-- HiperXP catalog schema (separate database from Umami).
-- Apply against database `hiperxp` on the shared Postgres instance.
--
-- Example:
--   CREATE DATABASE hiperxp;
--   \c hiperxp
--   \i infra/postgres/001_schema.sql

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS meta (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS items (
  id bigint PRIMARY KEY,
  list_id integer NOT NULL,
  name_pt_br text NOT NULL,
  search_norm text NOT NULL,
  has_description boolean NOT NULL DEFAULT false,
  has_quest_links boolean NOT NULL DEFAULT false,
  has_recipes boolean NOT NULL DEFAULT false,
  attrs jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS quests (
  id bigint PRIMARY KEY,
  name_pt_br text NOT NULL,
  search_norm text NOT NULL,
  has_description boolean NOT NULL DEFAULT false,
  has_rewards boolean NOT NULL DEFAULT false,
  has_premises boolean NOT NULL DEFAULT false,
  has_series boolean NOT NULL DEFAULT false,
  attrs jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS descriptions (
  item_id bigint PRIMARY KEY REFERENCES items (id) ON DELETE CASCADE,
  body text NOT NULL
);

CREATE TABLE IF NOT EXISTS quest_details (
  quest_id bigint PRIMARY KEY REFERENCES quests (id) ON DELETE CASCADE,
  payload jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS recipes (
  id bigint PRIMARY KEY,
  name_pt_br text NOT NULL,
  search_norm text NOT NULL,
  level integer,
  major_name_pt_br text,
  sub_name_pt_br text,
  payload jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS item_links (
  item_id bigint PRIMARY KEY REFERENCES items (id) ON DELETE CASCADE,
  payload jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS npcs (
  id bigint PRIMARY KEY,
  name_pt_br text NOT NULL,
  search_norm text NOT NULL,
  recipe_count integer NOT NULL DEFAULT 0,
  payload jsonb NOT NULL
);

-- Popularity counters (public write surface is rate-limited increment only).
CREATE TABLE IF NOT EXISTS entity_views (
  kind text NOT NULL CHECK (kind IN ('item', 'quest', 'npc', 'recipe')),
  entity_id bigint NOT NULL,
  views bigint NOT NULL DEFAULT 0 CHECK (views >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (kind, entity_id)
);

CREATE INDEX IF NOT EXISTS items_search_trgm_idx ON items USING gin (search_norm gin_trgm_ops);
CREATE INDEX IF NOT EXISTS items_list_id_idx ON items (list_id);
CREATE INDEX IF NOT EXISTS items_name_trgm_idx ON items USING gin (name_pt_br gin_trgm_ops);

CREATE INDEX IF NOT EXISTS quests_search_trgm_idx ON quests USING gin (search_norm gin_trgm_ops);
CREATE INDEX IF NOT EXISTS quests_name_trgm_idx ON quests USING gin (name_pt_br gin_trgm_ops);

CREATE INDEX IF NOT EXISTS recipes_search_trgm_idx ON recipes USING gin (search_norm gin_trgm_ops);
CREATE INDEX IF NOT EXISTS recipes_major_sub_idx ON recipes (major_name_pt_br, sub_name_pt_br);

CREATE INDEX IF NOT EXISTS npcs_search_trgm_idx ON npcs USING gin (search_norm gin_trgm_ops);
CREATE INDEX IF NOT EXISTS npcs_name_trgm_idx ON npcs USING gin (name_pt_br gin_trgm_ops);

CREATE INDEX IF NOT EXISTS entity_views_kind_views_idx ON entity_views (kind, views DESC);

COMMENT ON TABLE meta IS 'Catalog manifest and list labels; key catalog = full manifest JSON.';
COMMENT ON TABLE entity_views IS 'Anonymous view counters for Database most-viewed lists.';
