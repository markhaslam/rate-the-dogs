import { relations } from "drizzle-orm";
import { breeds } from "./breeds.js";
import { dogs } from "./dogs.js";
import { ratings } from "./ratings.js";
import { skips } from "./skips.js";
import { users } from "./users.js";

/**
 * Breed relations
 * - A breed has many dogs
 */
export const breedsRelations = relations(breeds, ({ many }) => ({
  dogs: many(dogs),
}));

/**
 * Dog relations
 * - A dog belongs to one breed
 * - A dog has many ratings
 * - A dog has many skips
 * - A dog may have an uploader (user)
 */
export const dogsRelations = relations(dogs, ({ one, many }) => ({
  breed: one(breeds, {
    fields: [dogs.breedId],
    references: [breeds.id],
  }),
  ratings: many(ratings),
  skips: many(skips),
  uploader: one(users, {
    fields: [dogs.uploaderUserId],
    references: [users.id],
  }),
}));

/**
 * Rating relations
 * - A rating belongs to one dog
 * - A rating may belong to one user
 */
export const ratingsRelations = relations(ratings, ({ one }) => ({
  dog: one(dogs, {
    fields: [ratings.dogId],
    references: [dogs.id],
  }),
  user: one(users, {
    fields: [ratings.userId],
    references: [users.id],
  }),
}));

/**
 * Skip relations
 * - A skip belongs to one dog
 * - A skip may belong to one user
 */
export const skipsRelations = relations(skips, ({ one }) => ({
  dog: one(dogs, {
    fields: [skips.dogId],
    references: [dogs.id],
  }),
  user: one(users, {
    fields: [skips.userId],
    references: [users.id],
  }),
}));

/**
 * User relations
 * - A user has many ratings
 * - A user has many skips
 * - A user may have uploaded many dogs
 */
export const usersRelations = relations(users, ({ many }) => ({
  ratings: many(ratings),
  skips: many(skips),
  uploadedDogs: many(dogs),
}));
