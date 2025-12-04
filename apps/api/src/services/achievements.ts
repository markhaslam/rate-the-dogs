/**
 * Achievement checking service
 * Determines which achievements a user has unlocked based on their rating history
 */

import { eq, count, countDistinct, sql } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "../db/schema/index.js";
import { ACHIEVEMENTS, type AchievementStatus } from "@rate-the-dogs/shared";

type DB = DrizzleD1Database<typeof schema>;

interface RatingWithTimestamp {
  value: number;
  createdAt: string;
}

/**
 * Check all achievements for a user and return their status
 */
export async function checkAchievements(
  db: DB,
  anonId: string
): Promise<AchievementStatus[]> {
  // Fetch all necessary data in parallel for efficiency
  const [
    ratingsData,
    breedsCount,
    distribution,
    highRatingsCount,
    hasLowRating,
    hasPerfectScore,
  ] = await Promise.all([
    getRatingsWithTimestamps(db, anonId),
    getUniqueBreedsRated(db, anonId),
    getRatingDistribution(db, anonId),
    getHighRatingsCount(db, anonId),
    checkHasLowRating(db, anonId),
    checkHasPerfectScore(db, anonId),
  ]);

  // Check each achievement
  const achievementChecks: Record<string, boolean> = {
    perfect_score: hasPerfectScore,
    breed_explorer: breedsCount >= 10,
    variety_pack: checkVarietyPack(distribution),
    early_bird: checkEarlyBird(ratingsData),
    streak_master: getMaxStreak(ratingsData) >= 7,
    all_star_rater: highRatingsCount >= 20,
    tough_crowd: hasLowRating,
  };

  // Map achievement definitions to status with unlock info
  return ACHIEVEMENTS.map((achievement) => ({
    id: achievement.id,
    name: achievement.name,
    icon: achievement.icon,
    description: achievement.description,
    criteria: achievement.criteria,
    unlocked: achievementChecks[achievement.id] ?? false,
    unlockedAt: null, // We don't track unlock timestamps currently
  }));
}

/**
 * Get all ratings with timestamps for streak and timing calculations
 */
async function getRatingsWithTimestamps(
  db: DB,
  anonId: string
): Promise<RatingWithTimestamp[]> {
  const result = await db
    .select({
      value: schema.ratings.value,
      createdAt: schema.ratings.createdAt,
    })
    .from(schema.ratings)
    .where(eq(schema.ratings.anonId, anonId))
    .orderBy(schema.ratings.createdAt);

  return result;
}

/**
 * Get count of unique breeds the user has rated
 */
async function getUniqueBreedsRated(db: DB, anonId: string): Promise<number> {
  const [result] = await db
    .select({ count: countDistinct(schema.breeds.id) })
    .from(schema.ratings)
    .innerJoin(schema.dogs, eq(schema.ratings.dogId, schema.dogs.id))
    .innerJoin(schema.breeds, eq(schema.dogs.breedId, schema.breeds.id))
    .where(eq(schema.ratings.anonId, anonId));

  return result?.count ?? 0;
}

/**
 * Get distribution of rating values for variety pack check
 */
async function getRatingDistribution(
  db: DB,
  anonId: string
): Promise<Set<number>> {
  const result = await db
    .select({ value: schema.ratings.value })
    .from(schema.ratings)
    .where(eq(schema.ratings.anonId, anonId))
    .groupBy(schema.ratings.value);

  return new Set(result.map((r) => r.value));
}

/**
 * Get count of ratings with value >= 4.0 (for all-star rater)
 */
async function getHighRatingsCount(db: DB, anonId: string): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(schema.ratings)
    .where(
      sql`${schema.ratings.anonId} = ${anonId} AND ${schema.ratings.value} >= 4.0`
    );

  return result?.count ?? 0;
}

/**
 * Check if user has given a rating below 2.0 (tough crowd)
 */
async function checkHasLowRating(db: DB, anonId: string): Promise<boolean> {
  const [result] = await db
    .select({ count: count() })
    .from(schema.ratings)
    .where(
      sql`${schema.ratings.anonId} = ${anonId} AND ${schema.ratings.value} < 2.0`
    );

  return (result?.count ?? 0) > 0;
}

/**
 * Check if user has given a perfect 5.0 rating
 */
async function checkHasPerfectScore(db: DB, anonId: string): Promise<boolean> {
  const [result] = await db
    .select({ count: count() })
    .from(schema.ratings)
    .where(
      sql`${schema.ratings.anonId} = ${anonId} AND ${schema.ratings.value} = 5.0`
    );

  return (result?.count ?? 0) > 0;
}

/**
 * Check if user has used all rating values (0.5 to 5.0 in 0.5 increments = 10 values)
 */
function checkVarietyPack(distribution: Set<number>): boolean {
  // All possible rating values: 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0
  return distribution.size >= 10;
}

/**
 * Check if user rated 5 dogs within 30 minutes (early bird)
 */
function checkEarlyBird(ratings: RatingWithTimestamp[]): boolean {
  if (ratings.length < 5) return false;

  const thirtyMinutesMs = 30 * 60 * 1000;

  // Sliding window check
  for (let i = 0; i <= ratings.length - 5; i++) {
    const windowStart = new Date(ratings[i].createdAt).getTime();
    const windowEnd = new Date(ratings[i + 4].createdAt).getTime();

    if (windowEnd - windowStart <= thirtyMinutesMs) {
      return true;
    }
  }

  return false;
}

/**
 * Calculate the maximum consecutive day streak of ratings
 */
function getMaxStreak(ratings: RatingWithTimestamp[]): number {
  if (ratings.length === 0) return 0;

  // Extract unique dates (YYYY-MM-DD format)
  const uniqueDates = new Set<string>();
  for (const rating of ratings) {
    const date = rating.createdAt.split("T")[0];
    uniqueDates.add(date);
  }

  // Sort dates
  const sortedDates = Array.from(uniqueDates).sort();

  if (sortedDates.length === 0) return 0;
  if (sortedDates.length === 1) return 1;

  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i - 1]);
    const currDate = new Date(sortedDates[i]);

    // Check if dates are consecutive (1 day apart)
    const diffDays = Math.round(
      (currDate.getTime() - prevDate.getTime()) / (24 * 60 * 60 * 1000)
    );

    if (diffDays === 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return maxStreak;
}
