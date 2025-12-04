import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { breeds } from "./breeds.js";

/**
 * Dog status enum values
 */
export const dogStatusEnum = ["pending", "approved", "rejected"] as const;
export type DogStatus = (typeof dogStatusEnum)[number];

/**
 * Image source enum values
 */
export const imageSourceEnum = ["dog_ceo", "user_upload"] as const;
export type ImageSource = (typeof imageSourceEnum)[number];

/**
 * Dogs table - main content table
 */
export const dogs = sqliteTable(
  "dogs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name"),
    imageKey: text("image_key"), // Nullable for Dog CEO images (they use imageUrl instead)
    // Dog CEO integration
    imageUrl: text("image_url"),
    imageSource: text("image_source", { enum: imageSourceEnum }).default(
      "user_upload"
    ),
    breedId: integer("breed_id")
      .notNull()
      .references(() => breeds.id),
    uploaderUserId: integer("uploader_user_id"),
    uploaderAnonId: text("uploader_anon_id"),
    status: text("status", { enum: dogStatusEnum })
      .notNull()
      .default("pending"),
    moderatedBy: text("moderated_by"),
    moderatedAt: text("moderated_at"),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    index("idx_dogs_status").on(table.status),
    index("idx_dogs_breed").on(table.breedId),
    index("idx_dogs_created").on(table.createdAt),
    index("idx_dogs_image_source").on(table.imageSource),
  ]
);

export type Dog = typeof dogs.$inferSelect;
export type NewDog = typeof dogs.$inferInsert;
