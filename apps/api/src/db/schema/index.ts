/**
 * Drizzle ORM Schema - Single Source of Truth
 *
 * All database tables, types, and relations are defined here.
 * Use drizzle-zod to generate Zod schemas from these definitions.
 */

// Table exports
export { breeds, type Breed, type NewBreed } from "./breeds.js";
export {
  dogs,
  dogStatusEnum,
  imageSourceEnum,
  type Dog,
  type NewDog,
  type DogStatus,
  type ImageSource,
} from "./dogs.js";
export { ratings, type Rating, type NewRating } from "./ratings.js";
export { skips, type Skip, type NewSkip } from "./skips.js";
export {
  users,
  providerEnum,
  type User,
  type NewUser,
  type Provider,
} from "./users.js";
export {
  anonymousUsers,
  type AnonymousUser,
  type NewAnonymousUser,
} from "./anonymousUsers.js";

// Relations exports
export {
  breedsRelations,
  dogsRelations,
  ratingsRelations,
  skipsRelations,
  usersRelations,
} from "./relations.js";
