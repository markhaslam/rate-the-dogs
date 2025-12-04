import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

/**
 * Anonymous users table - tracks anonymous visitors
 * Used for rate limiting and abuse prevention
 */
export const anonymousUsers = sqliteTable("anonymous_users", {
  anonId: text("anon_id").primaryKey(),
  firstSeenAt: text("first_seen_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  lastSeenAt: text("last_seen_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  isBanned: integer("is_banned", { mode: "boolean" }).notNull().default(false),
  userAgent: text("user_agent"),
});

export type AnonymousUser = typeof anonymousUsers.$inferSelect;
export type NewAnonymousUser = typeof anonymousUsers.$inferInsert;
