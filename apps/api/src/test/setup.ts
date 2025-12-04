/**
 * Test Setup - Applies database migrations and provides test utilities
 *
 * This file uses raw SQL to apply migrations because:
 * 1. Miniflare's D1 needs direct SQL execution for schema setup
 * 2. We want tests to match production schema exactly
 * 3. Drizzle's push/migrate features don't work in the test environment
 *
 * The schema here MUST match the Drizzle schema definitions in src/db/schema/
 * If you modify the schema, update both places.
 */

import { env } from "cloudflare:test";
import { getTestDb, schema } from "./db.js";

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
 *
 * IMPORTANT: This must stay in sync with the Drizzle schema in src/db/schema/
 * When you add columns or tables to the Drizzle schema, update this file too.
 */
export async function applyMigrations() {
  // =========================================================================
  // BREEDS TABLE
  // Sync with: src/db/schema/breeds.ts
  // =========================================================================
  await execSql(`
    CREATE TABLE IF NOT EXISTS breeds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      dog_ceo_path TEXT,
      image_count INTEGER DEFAULT 0,
      last_synced_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // =========================================================================
  // DOGS TABLE
  // Sync with: src/db/schema/dogs.ts
  // =========================================================================
  await execSql(`
    CREATE TABLE IF NOT EXISTS dogs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      image_key TEXT,
      image_url TEXT,
      image_source TEXT DEFAULT 'user_upload',
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

  // =========================================================================
  // RATINGS TABLE
  // Sync with: src/db/schema/ratings.ts
  // =========================================================================
  await execSql(`
    CREATE TABLE IF NOT EXISTS ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dog_id INTEGER NOT NULL REFERENCES dogs(id),
      value REAL NOT NULL CHECK(value >= 0.5 AND value <= 5.0),
      user_id INTEGER,
      anon_id TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(dog_id, anon_id),
      UNIQUE(dog_id, user_id)
    )
  `);

  // =========================================================================
  // SKIPS TABLE
  // Sync with: src/db/schema/skips.ts
  // =========================================================================
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

  // =========================================================================
  // USERS TABLE
  // Sync with: src/db/schema/users.ts
  // =========================================================================
  await execSql(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      avatar_url TEXT,
      google_id TEXT UNIQUE,
      email_verified INTEGER DEFAULT 0,
      provider TEXT DEFAULT 'google',
      linked_anon_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // =========================================================================
  // ANONYMOUS_USERS TABLE
  // Sync with: src/db/schema/anonymousUsers.ts
  // =========================================================================
  await execSql(`
    CREATE TABLE IF NOT EXISTS anonymous_users (
      anon_id TEXT PRIMARY KEY,
      first_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
      is_banned INTEGER NOT NULL DEFAULT 0,
      user_agent TEXT
    )
  `);

  // =========================================================================
  // INDEXES
  // =========================================================================
  await execSql(`CREATE INDEX IF NOT EXISTS idx_dogs_status ON dogs(status)`);
  await execSql(`CREATE INDEX IF NOT EXISTS idx_dogs_breed ON dogs(breed_id)`);
  await execSql(
    `CREATE INDEX IF NOT EXISTS idx_dogs_created ON dogs(created_at DESC)`
  );
  await execSql(
    `CREATE INDEX IF NOT EXISTS idx_dogs_image_source ON dogs(image_source)`
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
    `CREATE INDEX IF NOT EXISTS idx_users_linked_anon ON users(linked_anon_id)`
  );
  await execSql(
    `CREATE INDEX IF NOT EXISTS idx_breeds_last_synced ON breeds(last_synced_at)`
  );
}

/**
 * Clear all data from tables using Drizzle (for test cleanup)
 * Deletes in order to respect foreign key constraints.
 */
export async function clearTestData() {
  const db = getTestDb();

  // Delete in order: ratings/skips depend on dogs, dogs depends on breeds
  await db.delete(schema.ratings);
  await db.delete(schema.skips);
  await db.delete(schema.dogs);
  await db.delete(schema.breeds);
  await db.delete(schema.anonymousUsers);
}

// Re-export for tests that need direct DB access
export { getTestDb, schema };
