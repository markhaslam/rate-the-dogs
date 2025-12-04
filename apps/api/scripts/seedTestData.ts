#!/usr/bin/env bun
/**
 * Quick test data seeding for CI/E2E tests
 * Creates minimal data needed for tests to pass (~5 dogs)
 */

import { $ } from "bun";

// Use exact slugs that match Dog CEO format (breed/sub-breed → breed-subbreed)
const TEST_DOGS = [
  {
    breed: "Golden Retriever",
    slug: "retriever-golden",
    image: "https://images.dog.ceo/breeds/retriever-golden/n02099601_1.jpg",
  },
  {
    breed: "Labrador Retriever",
    slug: "labrador",
    image: "https://images.dog.ceo/breeds/labrador/n02099712_1.jpg",
  },
  {
    breed: "Beagle",
    slug: "beagle",
    image: "https://images.dog.ceo/breeds/beagle/n02088364_1.jpg",
  },
  {
    breed: "Standard Poodle",
    slug: "poodle-standard",
    image: "https://images.dog.ceo/breeds/poodle-standard/n02113799_1.jpg",
  },
  {
    breed: "English Bulldog",
    slug: "bulldog-english",
    image: "https://images.dog.ceo/breeds/bulldog-english/jager-1.jpg",
  },
];

async function seed() {
  console.log("Seeding test data for CI...");

  const isRemote = process.argv.includes("--remote");
  const dbFlag = isRemote ? "--remote" : "--local";

  // Get the api directory (parent of scripts directory where this file lives)
  const apiDir = new URL("..", import.meta.url).pathname;

  // Step 1: Insert breeds first
  const breedStatements: string[] = [];
  for (const dog of TEST_DOGS) {
    breedStatements.push(
      `INSERT OR IGNORE INTO breeds (name, slug) VALUES ('${dog.breed}', '${dog.slug}');`
    );
  }

  const breedFile = "/tmp/seed-test-breeds.sql";
  await Bun.write(breedFile, breedStatements.join("\n"));

  console.log(`Inserting ${breedStatements.length} breeds (${dbFlag})...`);

  const breedResult =
    await $`cd ${apiDir} && bunx wrangler d1 execute rate-the-dogs ${dbFlag} --file=${breedFile} --json`.quiet();

  if (breedResult.exitCode !== 0) {
    console.error(
      "Breed seed failed:",
      breedResult.stdout.toString(),
      breedResult.stderr.toString()
    );
    process.exit(1);
  }

  // Step 2: Insert dogs (now breeds exist)
  const dogStatements: string[] = [];
  for (const dog of TEST_DOGS) {
    dogStatements.push(
      `INSERT INTO dogs (image_url, image_source, breed_id, status) VALUES ('${dog.image}', 'dog_ceo', (SELECT id FROM breeds WHERE slug = '${dog.slug}'), 'approved');`
    );
  }

  const dogFile = "/tmp/seed-test-dogs.sql";
  await Bun.write(dogFile, dogStatements.join("\n"));

  console.log(`Inserting ${dogStatements.length} dogs (${dbFlag})...`);

  const dogResult =
    await $`cd ${apiDir} && bunx wrangler d1 execute rate-the-dogs ${dbFlag} --file=${dogFile} --json`.quiet();

  if (dogResult.exitCode !== 0) {
    console.error(
      "Dog seed failed:",
      dogResult.stdout.toString(),
      dogResult.stderr.toString()
    );
    process.exit(1);
  }

  console.log(`Seeded ${TEST_DOGS.length} breeds and ${TEST_DOGS.length} dogs`);
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
