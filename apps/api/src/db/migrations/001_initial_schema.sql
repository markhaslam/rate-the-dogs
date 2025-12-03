-- RateTheDogs Initial Schema
-- Migration 001

-- Breeds catalog (includes Mixed Breed, Unknown)
CREATE TABLE IF NOT EXISTS breeds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Dogs with name field
CREATE TABLE IF NOT EXISTS dogs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  image_key TEXT NOT NULL,
  breed_id INTEGER NOT NULL REFERENCES breeds(id),
  uploader_user_id INTEGER,
  uploader_anon_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
  moderated_by TEXT,
  moderated_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Ratings with unique constraints and IP hash
CREATE TABLE IF NOT EXISTS ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dog_id INTEGER NOT NULL REFERENCES dogs(id),
  value REAL NOT NULL CHECK(value >= 0.5 AND value <= 5.0),
  user_id INTEGER,
  anon_id TEXT,
  ip_hash TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(dog_id, anon_id),
  UNIQUE(dog_id, user_id)
);

-- Skips (dogs user chose not to rate)
CREATE TABLE IF NOT EXISTS skips (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dog_id INTEGER NOT NULL REFERENCES dogs(id),
  user_id INTEGER,
  anon_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(dog_id, anon_id),
  UNIQUE(dog_id, user_id)
);

-- Users with OAuth fields (Phase 2 ready)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  google_id TEXT UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Anonymous users tracking
CREATE TABLE IF NOT EXISTS anonymous_users (
  anon_id TEXT PRIMARY KEY,
  first_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
  is_banned INTEGER NOT NULL DEFAULT 0
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_dogs_status ON dogs(status);
CREATE INDEX IF NOT EXISTS idx_dogs_breed ON dogs(breed_id);
CREATE INDEX IF NOT EXISTS idx_dogs_created ON dogs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ratings_dog ON ratings(dog_id);
CREATE INDEX IF NOT EXISTS idx_ratings_anon ON ratings(anon_id);
CREATE INDEX IF NOT EXISTS idx_ratings_value ON ratings(value DESC);
CREATE INDEX IF NOT EXISTS idx_skips_anon ON skips(anon_id);
CREATE INDEX IF NOT EXISTS idx_skips_dog ON skips(dog_id);
CREATE INDEX IF NOT EXISTS idx_users_google ON users(google_id);
