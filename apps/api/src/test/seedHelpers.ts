/**
 * Test Seed Helpers - Drizzle-based data seeding for tests
 *
 * These helpers provide type-safe ways to seed test data using Drizzle ORM.
 * Use these instead of raw SQL in test files for better maintainability.
 */

import { getTestDb, schema } from "./db.js";
import type {
  NewBreed,
  NewDog,
  NewRating,
  NewSkip,
} from "../db/schema/index.js";

// Re-export types for convenience
export type { NewBreed, NewDog, NewRating, NewSkip };

/**
 * Seed a single breed
 */
export async function seedBreed(data: NewBreed) {
  const db = getTestDb();
  const [result] = await db.insert(schema.breeds).values(data).returning();
  return result;
}

/**
 * Seed multiple breeds
 */
export async function seedBreeds(data: NewBreed[]) {
  const db = getTestDb();
  return db.insert(schema.breeds).values(data).returning();
}

/**
 * Seed a single dog
 */
export async function seedDog(data: NewDog) {
  const db = getTestDb();
  const [result] = await db.insert(schema.dogs).values(data).returning();
  return result;
}

/**
 * Seed multiple dogs
 */
export async function seedDogs(data: NewDog[]) {
  const db = getTestDb();
  return db.insert(schema.dogs).values(data).returning();
}

/**
 * Seed a single rating
 */
export async function seedRating(data: NewRating) {
  const db = getTestDb();
  const [result] = await db.insert(schema.ratings).values(data).returning();
  return result;
}

/**
 * Seed multiple ratings
 */
export async function seedRatings(data: NewRating[]) {
  const db = getTestDb();
  return db.insert(schema.ratings).values(data).returning();
}

/**
 * Seed a single skip
 */
export async function seedSkip(data: NewSkip) {
  const db = getTestDb();
  const [result] = await db.insert(schema.skips).values(data).returning();
  return result;
}

/**
 * Seed multiple skips
 */
export async function seedSkips(data: NewSkip[]) {
  const db = getTestDb();
  return db.insert(schema.skips).values(data).returning();
}

// ============================================================================
// Pre-built test fixtures for common scenarios
// ============================================================================

/**
 * Standard test breed data
 */
export const TEST_BREEDS = {
  labrador: {
    name: "Labrador Retriever",
    slug: "labrador-retriever",
  },
  golden: {
    name: "Golden Retriever",
    slug: "golden-retriever",
  },
  germanShepherd: {
    name: "German Shepherd",
    slug: "german-shepherd",
  },
  shihTzu: {
    name: "Shih Tzu",
    slug: "shih-tzu",
  },
} as const satisfies Record<string, NewBreed>;

/**
 * Seed the standard test breeds and return them with IDs
 */
export async function seedStandardBreeds() {
  const db = getTestDb();
  return db
    .insert(schema.breeds)
    .values([
      TEST_BREEDS.labrador,
      TEST_BREEDS.golden,
      TEST_BREEDS.germanShepherd,
      TEST_BREEDS.shihTzu,
    ])
    .returning();
}

/**
 * Create test dog data (requires breedId)
 */
export function createTestDog(
  breedId: number,
  overrides?: Partial<NewDog>
): NewDog {
  return {
    name: "Test Dog",
    imageKey: "dogs/test-dog.jpg",
    breedId,
    status: "approved",
    imageSource: "user_upload",
    ...overrides,
  };
}

/**
 * Create test rating data (requires dogId)
 */
export function createTestRating(
  dogId: number,
  value: number,
  anonId: string,
  overrides?: Partial<NewRating>
): NewRating {
  return {
    dogId,
    value,
    anonId,
    ...overrides,
  };
}

/**
 * Seed a complete test scenario with breeds, dogs, and ratings
 * Returns all created entities for use in assertions
 */
export async function seedCompleteTestScenario() {
  const db = getTestDb();

  // Seed breeds
  const breeds = await db
    .insert(schema.breeds)
    .values([
      { name: "Labrador Retriever", slug: "labrador-retriever" },
      { name: "Golden Retriever", slug: "golden-retriever" },
      { name: "German Shepherd", slug: "german-shepherd" },
    ])
    .returning();

  const [labrador, golden, germanShepherd] = breeds;

  // Seed dogs
  const dogs = await db
    .insert(schema.dogs)
    .values([
      {
        name: "Max",
        imageKey: "dogs/sample-1.jpg",
        breedId: labrador.id,
        status: "approved",
      },
      {
        name: "Bella",
        imageKey: "dogs/sample-2.jpg",
        breedId: golden.id,
        status: "approved",
      },
      {
        name: "Charlie",
        imageKey: "dogs/sample-3.jpg",
        breedId: labrador.id,
        status: "approved",
      },
      {
        name: "Luna",
        imageKey: "dogs/sample-4.jpg",
        breedId: germanShepherd.id,
        status: "pending",
      },
    ])
    .returning();

  const [max, bella, charlie] = dogs;

  // Seed ratings
  // Max: avg 4.5 (5.0 + 4.0)
  // Bella: avg 4.0 (4.0 + 4.0)
  // Charlie: avg 3.5
  const ratings = await db
    .insert(schema.ratings)
    .values([
      { dogId: max.id, value: 5.0, anonId: "anon-user-1" },
      { dogId: max.id, value: 4.0, anonId: "anon-user-2" },
      { dogId: bella.id, value: 4.0, anonId: "anon-user-1" },
      { dogId: bella.id, value: 4.0, anonId: "anon-user-2" },
      { dogId: charlie.id, value: 3.5, anonId: "anon-user-1" },
    ])
    .returning();

  return { breeds, dogs, ratings };
}
