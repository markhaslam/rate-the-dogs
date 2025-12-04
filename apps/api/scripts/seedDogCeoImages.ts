#!/usr/bin/env bun
/**
 * Dog CEO Database Seeding Script
 *
 * Reads breed-images.json and populates the D1 database with breeds and dogs.
 * This is the second step in the two-step data pipeline:
 *   1. fetchDogCeoImages.ts -> breed-images.json
 *   2. seedDogCeoImages.ts -> D1 Database (this script)
 *
 * Usage:
 *   bun run apps/api/scripts/seedDogCeoImages.ts
 *
 * Options:
 *   --dry-run       Show what would be inserted without writing
 *   --limit=N       Limit images per breed (default: 50, 0 for unlimited)
 *   --local         Use local D1 database (default)
 *   --remote        Use remote D1 database (production)
 *   --clean         Delete existing Dog CEO data before seeding
 *
 * Prerequisites:
 *   - breed-images.json must exist (run fetchDogCeoImages.ts first)
 *   - Database migrations must be applied
 *   - wrangler must be installed and configured
 */

import { $ } from "bun";
import {
  getReadableBreedName,
  getBreedSlug,
  getApiPath,
} from "../src/lib/dogCeoBreeds";

// Configuration
const DEFAULT_LIMIT = 50;
const JSON_PATH = new URL("../src/db/breed-images.json", import.meta.url);

interface BreedImages {
  [breed: string]: string[];
}

interface SeedOptions {
  dryRun: boolean;
  limit: number;
  remote: boolean;
  clean: boolean;
}

interface SeedStats {
  totalBreeds: number;
  totalDogs: number;
  skippedDuplicates: number;
  errors: string[];
}

/**
 * Parse command line arguments
 */
function parseArgs(): SeedOptions {
  const args = process.argv.slice(2);

  let dryRun = false;
  let limit = DEFAULT_LIMIT;
  let remote = false;
  let clean = false;

  for (const arg of args) {
    if (arg === "--dry-run") {
      dryRun = true;
    } else if (arg === "--remote") {
      remote = true;
    } else if (arg === "--local") {
      remote = false;
    } else if (arg === "--clean") {
      clean = true;
    } else if (arg.startsWith("--limit=")) {
      const value = parseInt(arg.split("=")[1], 10);
      if (!isNaN(value) && value >= 0) {
        limit = value;
      }
    } else if (arg === "--help" || arg === "-h") {
      console.log(`
Dog CEO Database Seeding Script

Usage:
  bun run apps/api/scripts/seedDogCeoImages.ts [options]

Options:
  --dry-run       Show what would be inserted without writing
  --limit=N       Limit images per breed (default: ${DEFAULT_LIMIT}, 0 for unlimited)
  --local         Use local D1 database (default)
  --remote        Use remote D1 database (production)
  --clean         Delete existing Dog CEO data before seeding
  --help, -h      Show this help message
`);
      process.exit(0);
    }
  }

  return { dryRun, limit, remote, clean };
}

/**
 * Execute a SQL statement via wrangler d1 execute
 */
async function executeSql(
  sql: string,
  remote: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const remoteFlag = remote ? "--remote" : "--local";

    // Use wrangler d1 execute to run the SQL
    const result =
      await $`cd apps/api && bunx wrangler d1 execute rate-the-dogs-db ${remoteFlag} --command=${sql}`.quiet();

    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMsg };
  }
}

/**
 * Execute batch SQL statements
 */
async function executeBatchSql(
  statements: string[],
  remote: boolean
): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];

  // Join statements with newlines and execute as a batch
  const batchSql = statements.join("\n");

  try {
    const remoteFlag = remote ? "--remote" : "--local";

    // Write SQL to a temp file for batch execution
    const tempFile = `/tmp/seed-dog-ceo-${Date.now()}.sql`;
    await Bun.write(tempFile, batchSql);

    await $`cd apps/api && bunx wrangler d1 execute rate-the-dogs-db ${remoteFlag} --file=${tempFile}`.quiet();

    // Clean up temp file
    await $`rm ${tempFile}`.quiet();

    return { success: true, errors: [] };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    errors.push(errorMsg);
    return { success: false, errors };
  }
}

/**
 * Clean existing Dog CEO data
 */
async function cleanExistingData(remote: boolean): Promise<void> {
  console.log("Cleaning existing Dog CEO data...");

  const sql = `
    DELETE FROM dogs WHERE image_source = 'dog_ceo';
    UPDATE breeds SET image_count = 0, last_synced_at = NULL WHERE dog_ceo_path IS NOT NULL;
  `;

  const result = await executeSql(sql, remote);
  if (!result.success) {
    console.error("Failed to clean existing data:", result.error);
    throw new Error("Clean failed");
  }

  console.log("Existing Dog CEO data cleaned.");
}

/**
 * Seed the database with Dog CEO images
 */
async function seedDatabase(options: SeedOptions): Promise<SeedStats> {
  const stats: SeedStats = {
    totalBreeds: 0,
    totalDogs: 0,
    skippedDuplicates: 0,
    errors: [],
  };

  // 1. Load breed-images.json
  console.log(`Loading ${JSON_PATH.pathname}...`);
  const file = Bun.file(JSON_PATH.pathname);

  if (!(await file.exists())) {
    throw new Error(
      "breed-images.json not found. Run fetchDogCeoImages.ts first."
    );
  }

  const breedImages = (await file.json()) as BreedImages;
  const breeds = Object.keys(breedImages);

  console.log(`Loaded ${breeds.length} breeds from breed-images.json`);

  if (options.dryRun) {
    console.log("\n[DRY RUN] No database changes will be made\n");
  }

  // 2. Clean existing data if requested
  if (options.clean && !options.dryRun) {
    await cleanExistingData(options.remote);
  }

  // 3. Process each breed
  const now = new Date().toISOString();

  for (const breed of breeds) {
    const name = getReadableBreedName(breed);
    const slug = getBreedSlug(breed);
    const dogCeoPath = getApiPath(breed);

    // Get images, applying limit if specified
    const allImages = breedImages[breed];
    const images =
      options.limit > 0 ? allImages.slice(0, options.limit) : allImages;

    console.log(`Processing ${name} (${slug}): ${images.length} images`);

    if (options.dryRun) {
      stats.totalBreeds++;
      stats.totalDogs += images.length;
      continue;
    }

    // Escape single quotes in strings for SQL
    const escapedName = name.replace(/'/g, "''");

    // 3a. Upsert breed
    const breedSql = `
      INSERT INTO breeds (name, slug, dog_ceo_path, created_at)
      VALUES ('${escapedName}', '${slug}', '${dogCeoPath}', '${now}')
      ON CONFLICT(slug) DO UPDATE SET
        dog_ceo_path = '${dogCeoPath}',
        name = '${escapedName}';
    `;

    const breedResult = await executeSql(breedSql, options.remote);
    if (!breedResult.success) {
      console.error(`  Failed to upsert breed ${slug}:`, breedResult.error);
      stats.errors.push(`Breed ${slug}: ${breedResult.error}`);
      continue;
    }

    // 3b. Get breed ID
    const getIdSql = `SELECT id FROM breeds WHERE slug = '${slug}';`;
    // Note: We can't easily get the ID back from wrangler d1 execute
    // So we'll use a subquery in the INSERT statement

    // 3c. Insert dogs in batches
    const batchSize = 100;
    let insertedCount = 0;

    for (let i = 0; i < images.length; i += batchSize) {
      const batch = images.slice(i, i + batchSize);
      const statements: string[] = [];

      for (const imageUrl of batch) {
        const escapedUrl = imageUrl.replace(/'/g, "''");
        statements.push(`
          INSERT OR IGNORE INTO dogs (
            image_url,
            image_source,
            breed_id,
            status,
            created_at,
            updated_at
          )
          SELECT
            '${escapedUrl}',
            'dog_ceo',
            id,
            'approved',
            '${now}',
            '${now}'
          FROM breeds WHERE slug = '${slug}';
        `);
      }

      const batchResult = await executeBatchSql(statements, options.remote);
      if (batchResult.success) {
        insertedCount += batch.length;
      } else {
        console.error(
          `  Failed to insert batch for ${slug}:`,
          batchResult.errors
        );
        stats.errors.push(...batchResult.errors);
      }
    }

    // 3d. Update breed stats
    const updateStatsSql = `
      UPDATE breeds
      SET
        image_count = (SELECT COUNT(*) FROM dogs WHERE breed_id = (SELECT id FROM breeds WHERE slug = '${slug}') AND image_source = 'dog_ceo'),
        last_synced_at = '${now}'
      WHERE slug = '${slug}';
    `;

    await executeSql(updateStatsSql, options.remote);

    stats.totalBreeds++;
    stats.totalDogs += insertedCount;
    console.log(`  Inserted ${insertedCount} dogs`);
  }

  return stats;
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  console.log("Dog CEO Database Seeding Script");
  console.log("================================\n");

  const options = parseArgs();

  console.log("Options:");
  console.log(`  Dry run: ${options.dryRun}`);
  console.log(
    `  Limit per breed: ${options.limit === 0 ? "unlimited" : options.limit}`
  );
  console.log(
    `  Database: ${options.remote ? "remote (production)" : "local"}`
  );
  console.log(`  Clean existing: ${options.clean}`);
  console.log("");

  try {
    const stats = await seedDatabase(options);

    console.log("\n================================");
    console.log(
      options.dryRun ? "[DRY RUN] Would have seeded:" : "Seeding complete!"
    );
    console.log(`  Breeds: ${stats.totalBreeds}`);
    console.log(`  Dogs: ${stats.totalDogs}`);

    if (stats.errors.length > 0) {
      console.log(`\nErrors (${stats.errors.length}):`);
      for (const error of stats.errors.slice(0, 10)) {
        console.log(`  - ${error}`);
      }
      if (stats.errors.length > 10) {
        console.log(`  ... and ${stats.errors.length - 10} more`);
      }
    }
  } catch (error) {
    console.error("\nSeeding failed:", error);
    process.exit(1);
  }
}

// Run if executed directly
main();
