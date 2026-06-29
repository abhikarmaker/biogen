-- ══════════════════════════════════════════
-- BioGen — Supabase Schema
-- Run this in your Supabase SQL editor
-- ══════════════════════════════════════════

-- Users table (extends Supabase auth or standalone)
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  plan          TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  bio_count     INTEGER NOT NULL DEFAULT 0,
  free_limit    INTEGER NOT NULL DEFAULT 3,
  stripe_customer_id TEXT,
  last_active_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bios table
CREATE TABLE IF NOT EXISTS bios (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform    TEXT NOT NULL,
  content     TEXT NOT NULL,
  tone        TEXT,
  length      TEXT,
  role        TEXT,
  interests   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  stripe_sub_id TEXT UNIQUE NOT NULL,
  status        TEXT NOT NULL,
  expires_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Error logs
CREATE TABLE IF NOT EXISTS error_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  type       TEXT,
  message    TEXT,
  endpoint   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Settings table (key-value store for admin config)
CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Default settings
INSERT INTO settings (key, value) VALUES
  ('free_bio_limit', '3'),
  ('gemini_model', 'gemini-1.5-flash'),
  ('maintenance_mode', 'false')
ON CONFLICT (key) DO NOTHING;

-- RPC: atomically increment bio count
CREATE OR REPLACE FUNCTION increment_bio_count(user_id UUID)
RETURNS void AS $$
  UPDATE users SET bio_count = bio_count + 1 WHERE id = user_id;
$$ LANGUAGE sql;

-- Indexes
CREATE INDEX IF NOT EXISTS bios_user_id_idx ON bios(user_id);
CREATE INDEX IF NOT EXISTS bios_created_at_idx ON bios(created_at DESC);
CREATE INDEX IF NOT EXISTS subs_user_id_idx ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS error_logs_created_idx ON error_logs(created_at DESC);
