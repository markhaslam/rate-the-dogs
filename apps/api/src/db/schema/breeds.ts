import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

/**
 * Breeds table - catalog of dog breeds
 * Includes special breeds: Mixed Breed, Unknown
 */
export const breeds = sqliteTable(
  "breeds",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull().unique(),
    slug: text("slug").notNull().unique(),
    // Dog CEO integration fields
    dogCeoPath: text("dog_ceo_path"),
    imageCount: integer("image_count").default(0),
    lastSyncedAt: text("last_synced_at"),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => [index("idx_breeds_last_synced").on(table.lastSyncedAt)]
);

export type Breed = typeof breeds.$inferSelect;
export type NewBreed = typeof breeds.$inferInsert;
