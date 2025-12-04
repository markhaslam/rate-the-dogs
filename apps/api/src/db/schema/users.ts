import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

/**
 * OAuth provider enum values
 */
export const providerEnum = ["google", "github", "discord"] as const;
export type Provider = (typeof providerEnum)[number];

/**
 * Users table - registered users with OAuth
 */
export const users = sqliteTable(
  "users",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    email: text("email").notNull().unique(),
    name: text("name"),
    avatarUrl: text("avatar_url"),
    googleId: text("google_id").unique(),
    provider: text("provider", { enum: providerEnum }).default("google"),
    emailVerified: integer("email_verified", { mode: "boolean" }).default(
      false
    ),
    linkedAnonId: text("linked_anon_id"),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at").$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    index("idx_users_google").on(table.googleId),
    index("idx_users_linked_anon").on(table.linkedAnonId),
  ]
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
