/**
 * Rating system constants
 */
export const RATING = {
  MIN: 0.5,
  MAX: 5.0,
  INCREMENT: 0.5,
  MIN_FOR_LEADERBOARD: 3, // Minimum ratings to appear on leaderboard
} as const;

/**
 * Dog status values
 */
export const DOG_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

// Note: DogStatus type is exported from schemas/dog.ts for consistency with Zod
export type DogStatusValue = (typeof DOG_STATUS)[keyof typeof DOG_STATUS];

/**
 * File upload constraints
 */
export const UPLOAD = {
  MAX_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
  MAX_DIMENSION_PX: 4096,
  COMPRESSION_TARGET_BYTES: 1 * 1024 * 1024, // 1MB
  COMPRESSION_TARGET_DIMENSION: 1920,
  ALLOWED_TYPES: ["image/jpeg", "image/png", "image/webp"] as const,
} as const;

export type AllowedContentType = (typeof UPLOAD.ALLOWED_TYPES)[number];

/**
 * Rate limiting
 */
export const RATE_LIMITS = {
  RATING_PER_MINUTE: 10,
  UPLOAD_PER_HOUR: 5,
  API_PER_MINUTE: 100,
} as const;

/**
 * Pagination defaults
 */
export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

/**
 * Cookie configuration
 */
export const COOKIE = {
  ANON_ID_NAME: "anon_id",
  MAX_AGE_SECONDS: 400 * 24 * 60 * 60, // 400 days (browser max)
} as const;

/**
 * Special breed IDs (set during seed)
 */
export const SPECIAL_BREEDS = {
  MIXED_BREED_SLUG: "mixed-breed",
  UNKNOWN_SLUG: "unknown",
} as const;

// ============================================================================
// Stats Page Constants
// ============================================================================

import type {
  AchievementDefinition,
  PersonalityDefinition,
  MilestoneDefinition,
} from "./types/stats.js";

/**
 * Milestone definitions - celebrated with confetti animation
 */
export const MILESTONES: MilestoneDefinition[] = [
  {
    count: 1,
    icon: "🎉",
    name: "First Rating",
    message: "Your dog rating journey begins!",
  },
  {
    count: 10,
    icon: "🌟",
    name: "Getting Started",
    message: "You're officially a dog rater!",
  },
  {
    count: 50,
    icon: "🔥",
    name: "Dedicated Rater",
    message: "50 dogs rated! You're on fire!",
  },
  {
    count: 100,
    icon: "💯",
    name: "Century Club",
    message: "100 ratings! Legendary status!",
  },
  {
    count: 250,
    icon: "🐕‍🦺",
    name: "Dog Whisperer",
    message: "250 dogs! You speak fluent woof!",
  },
  {
    count: 500,
    icon: "👑",
    name: "Ultimate Rater",
    message: "500 ratings! Bow before the king/queen!",
  },
] as const;

/**
 * Achievement definitions - unlockable badges
 */
export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: "perfect_score",
    name: "Perfect Score",
    icon: "⭐",
    description: "Found the perfect pup!",
    criteria: "Give a 5.0 rating",
  },
  {
    id: "breed_explorer",
    name: "Breed Explorer",
    icon: "🗺️",
    description: "A true connoisseur of canine diversity",
    criteria: "Rate dogs from 10+ different breeds",
  },
  {
    id: "variety_pack",
    name: "Variety Pack",
    icon: "🎨",
    description: "Used every rating from 0.5 to 5.0!",
    criteria:
      "Give at least one rating at each value (0.5, 1.0, 1.5... up to 5.0)",
  },
  {
    id: "early_bird",
    name: "Early Bird",
    icon: "🐦",
    description: "Quick on the draw!",
    criteria: "Rate 5 dogs within a 30-minute session",
  },
  {
    id: "streak_master",
    name: "Streak Master",
    icon: "🔥",
    description: "A week of woofs!",
    criteria: "Rate dogs 7 days in a row",
  },
  {
    id: "all_star_rater",
    name: "All-Star Rater",
    icon: "💖",
    description: "Spreading the puppy love",
    criteria: "Rate 20+ dogs with 4.0 or higher",
  },
  {
    id: "tough_crowd",
    name: "Tough Crowd",
    icon: "😬",
    description: "Honest opinions only",
    criteria: "Give a rating below 2.0",
  },
] as const;

/**
 * Personality definitions - based on rating patterns
 * Evaluated in order, first match wins (except Top Dog which stacks)
 */
export const PERSONALITIES: PersonalityDefinition[] = [
  {
    id: "puppy_trainee",
    name: "Puppy Trainee",
    icon: "🐾",
    tagline: "Still learning the ropes!",
    color: "from-gray-400 to-gray-500",
    minRatings: 0,
    maxAvg: undefined,
    minAvg: undefined,
  },
  {
    id: "treat_dispenser",
    name: "Treat Dispenser",
    icon: "🦴",
    tagline: "Every pup deserves a treat!",
    color: "from-pink-400 to-rose-500",
    minRatings: 10,
    minAvg: 4.2,
  },
  {
    id: "belly_rub_expert",
    name: "Belly Rub Expert",
    icon: "🐕",
    tagline: "Knows exactly where to scratch",
    color: "from-blue-400 to-cyan-500",
    minRatings: 10,
    minAvg: 3.5,
    maxAvg: 4.2,
  },
  {
    id: "bark_inspector",
    name: "Bark Inspector",
    icon: "🔍",
    tagline: "Investigating all the good boys",
    color: "from-purple-400 to-violet-500",
    minRatings: 10,
    minAvg: 2.5,
    maxAvg: 3.5,
  },
  {
    id: "picky_pup_parent",
    name: "Picky Pup Parent",
    icon: "👑",
    tagline: "Only the finest floofs allowed",
    color: "from-amber-400 to-yellow-500",
    minRatings: 10,
    maxAvg: 2.5,
  },
] as const;

/**
 * Top Dog bonus personality (stacks with rating-based personality)
 */
export const TOP_DOG_PERSONALITY: PersonalityDefinition = {
  id: "top_dog",
  name: "Top Dog",
  icon: "🏆",
  tagline: "A true dog rating champion!",
  color: "from-amber-300 via-orange-400 to-red-500",
  minRatings: 100,
} as const;

/**
 * Stats thresholds for feature gating
 */
export const STATS_THRESHOLDS = {
  PERSONALITY_MIN_RATINGS: 10,
  TOP_BREEDS_MIN_RATINGS: 3,
  DISTRIBUTION_MIN_RATINGS: 5,
  GLOBAL_COMPARISON_MIN_RATINGS: 5,
  TOP_DOG_MIN_RATINGS: 100,
} as const;
