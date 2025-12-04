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
 *
 * Performance:
 *   Uses D1 batch execution to seed ~6000 dogs in ~10-20 seconds instead of minutes.
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

// Batch size for SQL file execution (number of statements per file)
// D1 can handle large batches, but we split for progress reporting
const STATEMENTS_PER_BATCH = 500;

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
 * Execute SQL from a file via wrangler d1 execute
 */
async function executeSqlFile(
  filePath: string,
  remote: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const remoteFlag = remote ? "--remote" : "--local";
    // Get the api directory (parent of scripts directory where this file lives)
    const apiDir = new URL("..", import.meta.url).pathname;

    await $`cd ${apiDir} && bunx wrangler d1 execute rate-the-dogs ${remoteFlag} --file=${filePath}`.quiet();
    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMsg };
  }
}

/**
 * Execute SQL statements in batches
 */
async function executeBatched(
  statements: string[],
  remote: boolean,
  description: string
): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];
  const totalBatches = Math.ceil(statements.length / STATEMENTS_PER_BATCH);

  for (let i = 0; i < statements.length; i += STATEMENTS_PER_BATCH) {
    const batch = statements.slice(i, i + STATEMENTS_PER_BATCH);
    const batchNum = Math.floor(i / STATEMENTS_PER_BATCH) + 1;
    const batchSql = batch.join("\n");

    const tempFile = `/tmp/seed-dog-ceo-${Date.now()}-${batchNum}.sql`;
    await Bun.write(tempFile, batchSql);

    process.stdout.write(
      `\r  ${description}: batch ${batchNum}/${totalBatches}...`
    );

    const result = await executeSqlFile(tempFile, remote);

    // Clean up temp file
    await $`rm ${tempFile}`.quiet();

    if (!result.success) {
      errors.push(result.error ?? "Unknown error");
    }
  }

  console.log(`\r  ${description}: done (${statements.length} statements)`);
  return { success: errors.length === 0, errors };
}

/**
 * Escape a string for SQL single quotes
 */
function escapeSql(str: string): string {
  return str.replace(/'/g, "''");
}

/**
 * Seed the database with Dog CEO images
 */
async function seedDatabase(options: SeedOptions): Promise<SeedStats> {
  const stats: SeedStats = {
    totalBreeds: 0,
    totalDogs: 0,
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

    // Calculate what would be inserted
    for (const breed of breeds) {
      const allImages = breedImages[breed];
      const images =
        options.limit > 0 ? allImages.slice(0, options.limit) : allImages;
      stats.totalBreeds++;
      stats.totalDogs += images.length;
    }

    return stats;
  }

  // 2. Clean existing data if requested
  if (options.clean) {
    console.log("Cleaning existing Dog CEO data...");
    const cleanStatements = [
      "DELETE FROM dogs WHERE image_source = 'dog_ceo';",
      "UPDATE breeds SET image_count = 0, last_synced_at = NULL WHERE dog_ceo_path IS NOT NULL;",
    ];

    const tempFile = `/tmp/seed-dog-ceo-clean-${Date.now()}.sql`;
    await Bun.write(tempFile, cleanStatements.join("\n"));
    const cleanResult = await executeSqlFile(tempFile, options.remote);
    await $`rm ${tempFile}`.quiet();

    if (!cleanResult.success) {
      throw new Error(`Clean failed: ${cleanResult.error}`);
    }
    console.log("Existing Dog CEO data cleaned.");
  }

  // 3. Build all SQL statements
  const now = new Date().toISOString();
  const breedStatements: string[] = [];
  const dogStatements: string[] = [];
  const updateStatements: string[] = [];

  console.log("\nPreparing SQL statements...");

  for (const breed of breeds) {
    const name = getReadableBreedName(breed);
    const slug = getBreedSlug(breed);
    const dogCeoPath = getApiPath(breed);

    // Get images, applying limit if specified
    const allImages = breedImages[breed];
    const images =
      options.limit > 0 ? allImages.slice(0, options.limit) : allImages;

    const escapedName = escapeSql(name);

    // Breed upsert statement
    breedStatements.push(
      `INSERT INTO breeds (name, slug, dog_ceo_path, created_at) VALUES ('${escapedName}', '${slug}', '${dogCeoPath}', '${now}') ON CONFLICT(slug) DO UPDATE SET dog_ceo_path = '${dogCeoPath}', name = '${escapedName}';`
    );

    // Dog insert statements
    for (const imageUrl of images) {
      const escapedUrl = escapeSql(imageUrl);
      dogStatements.push(
        `INSERT OR IGNORE INTO dogs (image_url, image_source, breed_id, status, created_at, updated_at) SELECT '${escapedUrl}', 'dog_ceo', id, 'approved', '${now}', '${now}' FROM breeds WHERE slug = '${slug}';`
      );
    }

    // Stats update statement
    updateStatements.push(
      `UPDATE breeds SET image_count = (SELECT COUNT(*) FROM dogs WHERE breed_id = (SELECT id FROM breeds WHERE slug = '${slug}') AND image_source = 'dog_ceo'), last_synced_at = '${now}' WHERE slug = '${slug}';`
    );

    stats.totalBreeds++;
    stats.totalDogs += images.length;
  }

  console.log(
    `  Prepared: ${breedStatements.length} breeds, ${dogStatements.length} dogs\n`
  );

  // 4. Execute breed upserts
  console.log("Inserting breeds...");
  const breedResult = await executeBatched(
    breedStatements,
    options.remote,
    "Breeds"
  );
  if (!breedResult.success) {
    stats.errors.push(...breedResult.errors);
  }

  // 5. Execute dog inserts (this is the big one)
  console.log("Inserting dogs...");
  const dogResult = await executeBatched(dogStatements, options.remote, "Dogs");
  if (!dogResult.success) {
    stats.errors.push(...dogResult.errors);
  }

  // 6. Update breed stats
  console.log("Updating breed statistics...");
  const updateResult = await executeBatched(
    updateStatements,
    options.remote,
    "Stats"
  );
  if (!updateResult.success) {
    stats.errors.push(...updateResult.errors);
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

  const startTime = Date.now();

  try {
    const stats = await seedDatabase(options);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log("\n================================");
    console.log(
      options.dryRun ? "[DRY RUN] Would have seeded:" : "Seeding complete!"
    );
    console.log(`  Breeds: ${stats.totalBreeds}`);
    console.log(`  Dogs: ${stats.totalDogs}`);
    console.log(`  Time: ${elapsed}s`);

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
