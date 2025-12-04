import {
  sqliteTable,
  text,
  integer,
  real,
  index,
  unique,
} from "drizzle-orm/sqlite-core";
import { dogs } from "./dogs.js";

/**
 * Ratings table - stores user ratings for dogs
 * Has unique constraints to prevent duplicate ratings per user/dog
 */
export const ratings = sqliteTable(
  "ratings",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    dogId: integer("dog_id")
      .notNull()
      .references(() => dogs.id),
    value: real("value").notNull(),
    userId: integer("user_id"),
    anonId: text("anon_id"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    index("idx_ratings_dog").on(table.dogId),
    index("idx_ratings_anon").on(table.anonId),
    index("idx_ratings_value").on(table.value),
    unique("ratings_dog_anon_unique").on(table.dogId, table.anonId),
    unique("ratings_dog_user_unique").on(table.dogId, table.userId),
  ]
);

export type Rating = typeof ratings.$inferSelect;
export type NewRating = typeof ratings.$inferInsert;
