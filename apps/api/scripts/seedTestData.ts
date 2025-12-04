#!/usr/bin/env bun
/**
 * Quick test data seeding for CI/E2E tests
 * Creates minimal data needed for tests to pass (~5 dogs)
 */

import { $ } from "bun";

const TEST_DOGS = [
  {
    breed: "Golden Retriever",
    slug: "golden-retriever",
    image: "https://images.dog.ceo/breeds/retriever-golden/n02099601_1.jpg",
  },
  {
    breed: "Labrador",
    slug: "labrador",
    image: "https://images.dog.ceo/breeds/labrador/n02099712_1.jpg",
  },
  {
    breed: "Beagle",
    slug: "beagle",
    image: "https://images.dog.ceo/breeds/beagle/n02088364_1.jpg",
  },
  {
    breed: "Poodle",
    slug: "poodle",
    image: "https://images.dog.ceo/breeds/poodle-standard/n02113799_1.jpg",
  },
  {
    breed: "Bulldog",
    slug: "bulldog",
    image: "https://images.dog.ceo/breeds/bulldog-english/jager-1.jpg",
  },
];

async function seed() {
  console.log("Seeding test data for CI...");

  // Build SQL statements
  const statements: string[] = [];

  // Insert breeds
  for (const dog of TEST_DOGS) {
    statements.push(
      `INSERT OR IGNORE INTO breeds (name, slug) VALUES ('${dog.breed}', '${dog.slug}');`
    );
  }

  // Insert dogs (approved status so they show up)
  for (const dog of TEST_DOGS) {
    statements.push(
      `INSERT INTO dogs (image_url, image_source, breed_id, status) VALUES ('${dog.image}', 'dog_ceo', (SELECT id FROM breeds WHERE slug = '${dog.slug}'), 'approved');`
    );
  }

  // Write to temp file and execute
  const sqlFile = "/tmp/seed-test-data.sql";
  await Bun.write(sqlFile, statements.join("\n"));

  const isRemote = process.argv.includes("--remote");
  const dbFlag = isRemote ? "--remote" : "--local";

  console.log(`Executing ${statements.length} statements (${dbFlag})...`);

  const result =
    await $`wrangler d1 execute rate-the-dogs ${dbFlag} --file=${sqlFile} --json`.quiet();

  if (result.exitCode !== 0) {
    console.error("Seed failed:", result.stderr.toString());
    process.exit(1);
  }

  console.log(`Seeded ${TEST_DOGS.length} breeds and ${TEST_DOGS.length} dogs`);
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
