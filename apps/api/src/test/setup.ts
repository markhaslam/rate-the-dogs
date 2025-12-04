/**
 * Test Setup - Applies database migrations before tests
 *
 * This file runs once before all tests to set up the D1 database schema.
 */

import { env } from "cloudflare:test";

/**
 * Execute a single SQL statement using prepare().run()
 * This avoids the exec() duration bug in miniflare.
 */
async function execSql(sql: string) {
  await env.DB.prepare(sql).run();
}

/**
 * Apply all database migrations to the test D1 database.
 * This creates all required tables and indexes.
 */
export async function applyMigrations() {
  // Migration 001: Initial schema
  // Create tables one at a time
  await execSql(`
    CREATE TABLE IF NOT EXISTS breeds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await execSql(`
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
    )
  `);

  await execSql(`
    CREATE TABLE IF NOT EXISTS ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dog_id INTEGER NOT NULL REFERENCES dogs(id),
      value REAL NOT NULL CHECK(value >= 0.5 AND value <= 5.0),
      user_id INTEGER,
      anon_id TEXT,
      ip_address TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(dog_id, anon_id),
      UNIQUE(dog_id, user_id)
    )
  `);

  await execSql(`
    CREATE TABLE IF NOT EXISTS skips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dog_id INTEGER NOT NULL REFERENCES dogs(id),
      user_id INTEGER,
      anon_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(dog_id, anon_id),
      UNIQUE(dog_id, user_id)
    )
  `);

  await execSql(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      avatar_url TEXT,
      google_id TEXT UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await execSql(`
    CREATE TABLE IF NOT EXISTS anonymous_users (
      anon_id TEXT PRIMARY KEY,
      first_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
      is_banned INTEGER NOT NULL DEFAULT 0
    )
  `);

  // Add additional columns from later migrations
  // Use try-catch since SQLite doesn't have IF NOT EXISTS for ADD COLUMN
  const addColumnSafe = async (sql: string) => {
    try {
      await execSql(sql);
    } catch {
      // Column already exists, ignore
    }
  };

  // Dog CEO fields for breeds
  await addColumnSafe(`ALTER TABLE breeds ADD COLUMN dog_ceo_path TEXT`);
  await addColumnSafe(
    `ALTER TABLE breeds ADD COLUMN image_count INTEGER DEFAULT 0`
  );
  await addColumnSafe(`ALTER TABLE breeds ADD COLUMN last_synced_at TEXT`);

  // Dog CEO fields for dogs
  await addColumnSafe(`ALTER TABLE dogs ADD COLUMN image_url TEXT`);
  await addColumnSafe(
    `ALTER TABLE dogs ADD COLUMN image_source TEXT DEFAULT 'user_upload'`
  );

  // Analytics fields
  await addColumnSafe(`ALTER TABLE ratings ADD COLUMN user_agent TEXT`);
  await addColumnSafe(`ALTER TABLE anonymous_users ADD COLUMN user_agent TEXT`);

  // User system enhancements
  await addColumnSafe(
    `ALTER TABLE users ADD COLUMN updated_at TEXT DEFAULT (datetime('now'))`
  );
  await addColumnSafe(
    `ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0`
  );
  await addColumnSafe(
    `ALTER TABLE users ADD COLUMN provider TEXT DEFAULT 'google'`
  );
  await addColumnSafe(`ALTER TABLE users ADD COLUMN linked_anon_id TEXT`);

  // Create indexes
  await execSql(`CREATE INDEX IF NOT EXISTS idx_dogs_status ON dogs(status)`);
  await execSql(`CREATE INDEX IF NOT EXISTS idx_dogs_breed ON dogs(breed_id)`);
  await execSql(
    `CREATE INDEX IF NOT EXISTS idx_dogs_created ON dogs(created_at DESC)`
  );
  await execSql(
    `CREATE INDEX IF NOT EXISTS idx_ratings_dog ON ratings(dog_id)`
  );
  await execSql(
    `CREATE INDEX IF NOT EXISTS idx_ratings_anon ON ratings(anon_id)`
  );
  await execSql(
    `CREATE INDEX IF NOT EXISTS idx_ratings_value ON ratings(value DESC)`
  );
  await execSql(`CREATE INDEX IF NOT EXISTS idx_skips_anon ON skips(anon_id)`);
  await execSql(`CREATE INDEX IF NOT EXISTS idx_skips_dog ON skips(dog_id)`);
  await execSql(
    `CREATE INDEX IF NOT EXISTS idx_users_google ON users(google_id)`
  );
  await execSql(
    `CREATE INDEX IF NOT EXISTS idx_dogs_image_source ON dogs(image_source)`
  );
  await execSql(
    `CREATE INDEX IF NOT EXISTS idx_breeds_last_synced ON breeds(last_synced_at)`
  );
  await execSql(
    `CREATE INDEX IF NOT EXISTS idx_users_linked_anon ON users(linked_anon_id)`
  );
}

/**
 * Clear all data from tables (for test cleanup)
 */
export async function clearTestData() {
  await execSql(`DELETE FROM ratings`);
  await execSql(`DELETE FROM skips`);
  await execSql(`DELETE FROM dogs`);
  await execSql(`DELETE FROM breeds`);
  await execSql(`DELETE FROM anonymous_users`);
}
