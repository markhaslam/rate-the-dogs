# Database & Migrations Guide

This guide covers database management for RateTheDogs using **Drizzle ORM** with **Cloudflare D1**.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Development Flow                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Schema Definition    2. Migration Gen    3. Apply        │
│  ┌──────────────────┐   ┌──────────────┐   ┌────────────┐   │
│  │ src/db/schema/   │──▶│ drizzle-kit  │──▶│  wrangler  │   │
│  │ *.ts files       │   │ generate     │   │  d1 apply  │   │
│  └──────────────────┘   └──────────────┘   └────────────┘   │
│                               │                    │         │
│                               ▼                    ▼         │
│                    ┌──────────────────┐   ┌────────────┐    │
│                    │ migrations/*.sql │   │ D1 Database│    │
│                    └──────────────────┘   └────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Key Principle:** Drizzle defines the schema and generates migrations; Wrangler applies them to D1.

## Quick Reference

All commands run from `apps/api/`:

| Command                    | Description                                |
| -------------------------- | ------------------------------------------ |
| `bun run db:generate`      | Generate SQL migration from schema changes |
| `bun run db:migrate:local` | Apply migrations to local D1               |
| `bun run db:migrate`       | Apply migrations to production D1          |
| `bun run db:studio`        | Open Drizzle Studio GUI                    |
| `bun run db:push`          | Push schema directly (dev only)            |
| `bun run db:seed`          | Seed database with initial data            |

## File Structure

```
apps/api/
├── drizzle.config.ts           # Drizzle Kit configuration
└── src/db/
    ├── schema/                  # Drizzle table definitions (source of truth)
    │   ├── index.ts             # Re-exports all tables
    │   ├── breeds.ts
    │   ├── dogs.ts
    │   ├── ratings.ts
    │   ├── skips.ts
    │   ├── users.ts
    │   ├── anonymousUsers.ts
    │   └── relations.ts         # Table relationships
    ├── drizzle.ts               # Database client factory
    ├── zodSchemas.ts            # Zod schemas (drizzle-zod + custom)
    └── migrations/              # SQL migration files
        ├── 001_initial_schema.sql
        ├── 002_ip_address.sql
        └── 003_dog_ceo_integration.sql
```

## Migration Workflow

### Standard Workflow (Recommended)

#### 1. Update Schema

Edit the appropriate file in `src/db/schema/`:

```typescript
// src/db/schema/dogs.ts
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const dogs = sqliteTable("dogs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name"),
  // Add new column here
  description: text("description"), // NEW
});
```

#### 2. Generate Migration

```bash
cd apps/api
bun run db:generate
```

This creates a new SQL file in `src/db/migrations/` with the changes.

#### 3. Review the Generated SQL

**Always review the generated migration before applying!**

```bash
cat src/db/migrations/004_*.sql
```

Check for:

- Correct column types
- No unexpected `DROP TABLE` statements
- Proper indexes and constraints

#### 4. Apply to Local Database

```bash
bun run db:migrate:local
```

#### 5. Test Your Changes

Run the dev server and test the new functionality:

```bash
bun run dev
bun run test
```

#### 6. Apply to Production

Once tested and ready to deploy:

```bash
bun run db:migrate
```

### Writing Manual Migrations

Sometimes you need more control than `db:generate` provides. Write SQL directly:

```sql
-- src/db/migrations/005_add_featured_dogs.sql

-- Add featured flag to dogs
ALTER TABLE dogs ADD COLUMN is_featured INTEGER NOT NULL DEFAULT 0;

-- Create index for featured queries
CREATE INDEX idx_dogs_featured ON dogs(is_featured) WHERE is_featured = 1;
```

Then apply with wrangler:

```bash
bun run db:migrate:local
bun run db:migrate
```

## Drizzle Kit Commands Explained

### `db:generate` - Generate Migrations

Compares your schema files against the migration history and generates SQL.

```bash
bun run db:generate
```

**When to use:** After modifying any `src/db/schema/*.ts` file.

**Output:** New SQL file in `src/db/migrations/`

### `db:push` - Direct Schema Push

Pushes schema changes directly to the database WITHOUT creating a migration file.

```bash
bun run db:push
```

**When to use:** Local development/prototyping only.

**Warning:** Never use in production! No migration history, can cause data loss.

### `db:studio` - Visual Database GUI

Opens Drizzle Studio, a visual interface for browsing and editing data.

```bash
bun run db:studio
```

**Requires:** Cloudflare API credentials in environment.

### `db:migrate` / `db:migrate:local` - Apply Migrations

These use Wrangler (not Drizzle Kit) to apply SQL migrations to D1.

```bash
# Local D1 (in .wrangler/state/)
bun run db:migrate:local

# Remote D1 (production)
bun run db:migrate
```

**How it works:** Wrangler tracks applied migrations in a `_cf_KV` table and only runs new ones.

## Environment Setup

### Local Development

No additional setup needed. Local D1 database is created automatically in `.wrangler/state/`.

### Remote D1 (for `db:generate`, `db:studio`, `db:push`)

Create `.env` in `apps/api/`:

```env
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_D1_DATABASE_ID=your_database_id
CLOUDFLARE_API_TOKEN=your_api_token
```

Get these values from:

- Account ID: Cloudflare Dashboard → Workers & Pages → Overview (right sidebar)
- Database ID: Cloudflare Dashboard → D1 → your database → Settings
- API Token: Cloudflare Dashboard → My Profile → API Tokens → Create Token
  - Use "Edit Cloudflare Workers" template or custom with D1 permissions

## Common Tasks

### Adding a New Table

1. Create `src/db/schema/newTable.ts`:

```typescript
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const newTable = sqliteTable("new_table", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  createdAt: text("created_at").notNull().default("(datetime('now'))"),
});
```

2. Export from `src/db/schema/index.ts`:

```typescript
export * from "./newTable.js";
```

3. Add relations if needed in `src/db/schema/relations.ts`

4. Update Zod schemas in `src/db/zodSchemas.ts` if needed

5. Generate and apply migration:

```bash
bun run db:generate
bun run db:migrate:local
bun run db:migrate
```

### Adding a Column

1. Edit the schema file:

```typescript
// Before
export const dogs = sqliteTable("dogs", {
  id: integer("id").primaryKey(),
  name: text("name"),
});

// After
export const dogs = sqliteTable("dogs", {
  id: integer("id").primaryKey(),
  name: text("name"),
  description: text("description"), // New column
});
```

2. Generate migration: `bun run db:generate`

3. Apply: `bun run db:migrate:local && bun run db:migrate`

### Adding an Index

```typescript
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

export const dogs = sqliteTable(
  "dogs",
  {
    id: integer("id").primaryKey(),
    status: text("status").notNull(),
  },
  (table) => [index("idx_dogs_status").on(table.status)]
);
```

### Renaming a Column

SQLite doesn't support `ALTER TABLE RENAME COLUMN` in all versions. Use this pattern:

```sql
-- Manual migration
ALTER TABLE dogs RENAME TO dogs_old;

CREATE TABLE dogs (
  id INTEGER PRIMARY KEY,
  new_column_name TEXT  -- renamed from old_column_name
);

INSERT INTO dogs (id, new_column_name)
SELECT id, old_column_name FROM dogs_old;

DROP TABLE dogs_old;
```

## D1 Gotchas

### No Transactions

D1 does NOT support `BEGIN TRANSACTION`. Use `db.batch()` instead:

```typescript
// WRONG - Will fail on D1
await db.transaction(async (tx) => {
  await tx.insert(users).values(...);
  await tx.update(accounts).set(...);
});

// CORRECT - Use batch
const results = await db.batch([
  db.insert(users).values(...),
  db.update(accounts).set(...).where(...),
]);
```

### SQLite Type System

D1 uses SQLite, which has a flexible type system:

- `INTEGER` - Signed integers (use for booleans as 0/1)
- `TEXT` - Strings and dates (stored as ISO strings)
- `REAL` - Floating point numbers
- `BLOB` - Binary data

### Date Handling

SQLite stores dates as TEXT. Use ISO format:

```typescript
createdAt: text("created_at").notNull().default("(datetime('now'))"),
```

In queries:

```typescript
.where(gt(table.createdAt, new Date().toISOString()))
```

## Troubleshooting

### "Migration already applied"

Wrangler tracks migrations. If you need to re-run:

```bash
# Check migration status
wrangler d1 migrations list rate-the-dogs --local

# For local dev, you can reset:
rm -rf .wrangler/state/
bun run db:migrate:local
```

### "Table already exists"

Your migration may have partially applied. Check the database state and either:

- Fix the migration to be idempotent (`CREATE TABLE IF NOT EXISTS`)
- Manually correct the database state

### Schema Out of Sync

If Drizzle Kit generates unexpected migrations:

```bash
# See what Drizzle thinks the diff is
bunx drizzle-kit diff
```

This shows the difference between your schema files and the database.

### "Cannot find module" Errors

Ensure you're running from `apps/api/`:

```bash
cd apps/api
bun run db:generate
```

## Best Practices

1. **Always review generated migrations** before applying
2. **Test locally first** with `db:migrate:local`
3. **Keep migrations small** - one logical change per migration
4. **Never edit applied migrations** - create new ones instead
5. **Use `IF NOT EXISTS`** for tables/indexes when writing manual migrations
6. **Backup before production migrations** (D1 supports point-in-time recovery)
7. **Never use `db:push` in production** - it doesn't track history

## Testing with Drizzle

The test suite uses **vitest-pool-workers** with miniflare to provide a real D1 database in tests. We've created type-safe Drizzle helpers for seeding test data.

### Test File Structure

```
apps/api/src/test/
├── db.ts            # Drizzle test client (getTestDb, schema export)
├── setup.ts         # Migration application + clearTestData()
└── seedHelpers.ts   # Type-safe seeding functions + fixtures
```

### Why Tests Use Some Raw SQL

While production code uses Drizzle exclusively, test setup has two necessary exceptions:

1. **Schema Creation (`setup.ts`)**: Miniflare's D1 doesn't support Drizzle's migration/push features. We use raw SQL `CREATE TABLE` statements that mirror the Drizzle schema definitions.

2. **CLI Seed Scripts**: Scripts like `seedDogCeoImages.ts` run outside the Workers runtime, so D1 bindings aren't available. They use wrangler's `d1 execute --file` command.

**Important:** Keep `test/setup.ts` in sync with `src/db/schema/*.ts` when schema changes!

### Using Test Helpers

#### Basic Setup Pattern

```typescript
import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import { env } from "cloudflare:test";
import app from "../index.js";
import {
  applyMigrations,
  clearTestData,
  getTestDb,
  schema,
} from "../test/setup.js";
import {
  seedBreed,
  seedDog,
  seedRating,
  TEST_BREEDS,
} from "../test/seedHelpers.js";

beforeAll(async () => {
  await applyMigrations(); // Run once per test file
});

describe("My Feature", () => {
  beforeEach(async () => {
    await clearTestData(); // Clean slate for each test
  });

  it("does something", async () => {
    // Seed data using helpers
    const breed = await seedBreed(TEST_BREEDS.labrador);
    const dog = await seedDog({
      name: "Max",
      imageKey: "dogs/max.jpg",
      breedId: breed.id,
      status: "approved",
    });

    // Make API request
    const res = await app.request(`/api/dogs/${dog.id}`, {}, env);
    expect(res.status).toBe(200);
  });
});
```

#### Available Seed Functions

```typescript
// Single entity seeding (returns the created entity with ID)
const breed = await seedBreed({ name: "Labrador", slug: "labrador" });
const dog = await seedDog({ name: "Max", breedId: breed.id, ... });
const rating = await seedRating({ dogId: dog.id, value: 5.0, anonId: "user-1" });
const skip = await seedSkip({ dogId: dog.id, anonId: "user-1" });

// Batch seeding (returns array of created entities)
const breeds = await seedBreeds([...]);
const dogs = await seedDogs([...]);
const ratings = await seedRatings([...]);
const skips = await seedSkips([...]);

// Pre-built fixtures
const breeds = await seedStandardBreeds(); // 4 common breeds
const { breeds, dogs, ratings } = await seedCompleteTestScenario(); // Full scenario
```

#### Pre-built Fixtures

```typescript
import {
  TEST_BREEDS,
  createTestDog,
  createTestRating,
} from "../test/seedHelpers.js";

// TEST_BREEDS - Standard breed data
TEST_BREEDS.labrador; // { name: "Labrador Retriever", slug: "labrador-retriever" }
TEST_BREEDS.golden; // { name: "Golden Retriever", slug: "golden-retriever" }
TEST_BREEDS.germanShepherd;
TEST_BREEDS.shihTzu;

// Factory functions for flexible test data
const dogData = createTestDog(breedId, { name: "Custom Name" });
const ratingData = createTestRating(dogId, 4.5, "anon-123");
```

#### Direct Database Access

For complex test scenarios, access the database directly:

```typescript
import { getTestDb, schema } from "../test/setup.js";
import { eq } from "drizzle-orm";

it("verifies database state", async () => {
  const db = getTestDb();

  // Query data
  const dogs = await db.select().from(schema.dogs);
  const [dog] = await db
    .select()
    .from(schema.dogs)
    .where(eq(schema.dogs.id, 1));

  // Delete specific data
  await db.delete(schema.ratings).where(eq(schema.ratings.dogId, 1));

  // Update data
  await db
    .update(schema.dogs)
    .set({ status: "rejected" })
    .where(eq(schema.dogs.id, 1));
});
```

### Test Data Guidelines

1. **Always use helpers** - Never use raw `env.DB.prepare()` in tests
2. **Clear before each test** - Use `clearTestData()` in `beforeEach`
3. **Use fixtures** - Prefer `TEST_BREEDS` and `seedCompleteTestScenario()` for consistency
4. **Type safety** - All helpers are fully typed via Drizzle schema inference
5. **Return values** - Seed functions return created entities with IDs for assertions

### Complete Test Scenario

The `seedCompleteTestScenario()` function creates a realistic dataset:

- **3 breeds**: Labrador, Golden Retriever, German Shepherd
- **4 dogs**: Max (approved), Bella (approved), Charlie (approved), Luna (pending)
- **5 ratings**: Various ratings creating predictable averages

This is ideal for testing leaderboards, filtering, and aggregation logic.

## Related Documentation

- [Drizzle ORM Docs](https://orm.drizzle.team/docs/overview)
- [Drizzle D1 Guide](https://orm.drizzle.team/docs/connect-cloudflare-d1)
- [Cloudflare D1 Docs](https://developers.cloudflare.com/d1/)
- [Wrangler D1 Commands](https://developers.cloudflare.com/workers/wrangler/commands/#d1)
