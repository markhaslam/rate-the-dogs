import {
  sqliteTable,
  text,
  integer,
  index,
  unique,
} from "drizzle-orm/sqlite-core";
import { dogs } from "./dogs.js";

/**
 * Skips table - tracks dogs that users chose not to rate
 * Has unique constraints to prevent duplicate skips per user/dog
 */
export const skips = sqliteTable(
  "skips",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    dogId: integer("dog_id")
      .notNull()
      .references(() => dogs.id),
    userId: integer("user_id"),
    anonId: text("anon_id"),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    index("idx_skips_anon").on(table.anonId),
    index("idx_skips_dog").on(table.dogId),
    unique("skips_dog_anon_unique").on(table.dogId, table.anonId),
    unique("skips_dog_user_unique").on(table.dogId, table.userId),
  ]
);

export type Skip = typeof skips.$inferSelect;
export type NewSkip = typeof skips.$inferInsert;
