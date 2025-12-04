import { Hono } from "hono";
import { count, countDistinct, eq, avg, min, max, desc } from "drizzle-orm";
import type { Env, Variables } from "../lib/env.js";
import { success } from "../lib/response.js";
import { getImageUrl } from "../lib/r2.js";
import * as schema from "../db/schema/index.js";
import { checkAchievements } from "../services/achievements.js";
import {
  MILESTONES,
  type EnhancedStatsResponse,
  type TopBreedsResponse,
  type RatingDistributionResponse,
  type RecentRatingsResponse,
  type AchievementsResponse,
} from "@rate-the-dogs/shared";

const me = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * GET /api/me/stats - Get current user's enhanced rating statistics
 * Returns comprehensive stats including counts, averages, timestamps, and global comparison
 */
me.get("/stats", async (c) => {
  const db = c.get("db");
  const anonId = c.get("anonId");

  // Fetch user stats and global average in parallel
  const [userStats, skipResult, globalStats] = await Promise.all([
    // User's rating stats with aggregations
    db
      .select({
        count: count(),
        avgRating: avg(schema.ratings.value),
        firstRating: min(schema.ratings.createdAt),
        lastRating: max(schema.ratings.createdAt),
      })
      .from(schema.ratings)
      .where(eq(schema.ratings.anonId, anonId)),

    // User's skip count
    db
      .select({ count: count() })
      .from(schema.skips)
      .where(eq(schema.skips.anonId, anonId)),

    // Global average rating (all users)
    db.select({ avgRating: avg(schema.ratings.value) }).from(schema.ratings),
  ]);

  const ratingsCount = userStats[0]?.count ?? 0;
  const skipsCount = skipResult[0]?.count ?? 0;
  const avgRatingGiven = userStats[0]?.avgRating
    ? parseFloat(String(userStats[0].avgRating))
    : null;
  const globalAvgRating = globalStats[0]?.avgRating
    ? parseFloat(String(globalStats[0].avgRating))
    : null;

  // Calculate difference from global average
  let ratingDiffFromGlobal: number | null = null;
  if (avgRatingGiven !== null && globalAvgRating !== null) {
    ratingDiffFromGlobal =
      Math.round((avgRatingGiven - globalAvgRating) * 100) / 100;
  }

  const data: EnhancedStatsResponse = {
    ratingsCount,
    skipsCount,
    avgRatingGiven,
    firstRatingAt: userStats[0]?.firstRating ?? null,
    lastRatingAt: userStats[0]?.lastRating ?? null,
    globalAvgRating,
    ratingDiffFromGlobal,
  };

  return c.json(success(data));
});

/**
 * GET /api/me/top-breeds - Get user's top rated breeds
 * Returns the user's highest-rated breeds based on their own ratings
 */
me.get("/top-breeds", async (c) => {
  const db = c.get("db");
  const anonId = c.get("anonId");

  // Get user's top breeds by their average rating per breed
  const result = await db
    .select({
      id: schema.breeds.id,
      name: schema.breeds.name,
      slug: schema.breeds.slug,
      avgRating: avg(schema.ratings.value),
      ratingCount: count(schema.ratings.id),
      // Get a representative image from one of the dogs in this breed
      imageUrl: schema.dogs.imageUrl,
      imageKey: schema.dogs.imageKey,
      imageSource: schema.dogs.imageSource,
    })
    .from(schema.ratings)
    .innerJoin(schema.dogs, eq(schema.ratings.dogId, schema.dogs.id))
    .innerJoin(schema.breeds, eq(schema.dogs.breedId, schema.breeds.id))
    .where(eq(schema.ratings.anonId, anonId))
    .groupBy(schema.breeds.id)
    .orderBy(desc(avg(schema.ratings.value)), desc(count(schema.ratings.id)))
    .limit(3);

  // Count total unique breeds rated
  const [totalResult] = await db
    .select({ count: countDistinct(schema.breeds.id) })
    .from(schema.ratings)
    .innerJoin(schema.dogs, eq(schema.ratings.dogId, schema.dogs.id))
    .innerJoin(schema.breeds, eq(schema.dogs.breedId, schema.breeds.id))
    .where(eq(schema.ratings.anonId, anonId));

  const items = result.map((breed) => ({
    id: breed.id,
    name: breed.name,
    slug: breed.slug,
    avgRating: breed.avgRating ? parseFloat(String(breed.avgRating)) : 0,
    ratingCount: breed.ratingCount,
    imageUrl: getImageUrl({
      imageUrl: breed.imageUrl,
      imageKey: breed.imageKey,
      imageSource: breed.imageSource,
    }),
  }));

  const data: TopBreedsResponse = {
    items,
    totalBreedsRated: totalResult?.count ?? 0,
  };

  return c.json(success(data));
});

/**
 * GET /api/me/rating-distribution - Get user's rating distribution
 * Returns a breakdown of how many times the user gave each rating value
 */
me.get("/rating-distribution", async (c) => {
  const db = c.get("db");
  const anonId = c.get("anonId");

  // Get distribution of ratings by value
  const result = await db
    .select({
      value: schema.ratings.value,
      count: count(),
    })
    .from(schema.ratings)
    .where(eq(schema.ratings.anonId, anonId))
    .groupBy(schema.ratings.value)
    .orderBy(schema.ratings.value);

  // Convert to record format and find mode
  const distribution: Record<string, number> = {};
  let modeRating: number | null = null;
  let maxCount = 0;
  let totalRatings = 0;

  for (const row of result) {
    const key = row.value.toString();
    distribution[key] = row.count;
    totalRatings += row.count;

    if (row.count > maxCount) {
      maxCount = row.count;
      modeRating = row.value;
    }
  }

  const data: RatingDistributionResponse = {
    distribution,
    modeRating,
    totalRatings,
  };

  return c.json(success(data));
});

/**
 * GET /api/me/recent - Get user's recent ratings
 * Returns the last N dogs the user has rated
 */
me.get("/recent", async (c) => {
  const db = c.get("db");
  const anonId = c.get("anonId");
  const limit = Math.min(parseInt(c.req.query("limit") ?? "10"), 20);

  const result = await db
    .select({
      dogId: schema.dogs.id,
      dogName: schema.dogs.name,
      breedName: schema.breeds.name,
      breedSlug: schema.breeds.slug,
      imageUrl: schema.dogs.imageUrl,
      imageKey: schema.dogs.imageKey,
      imageSource: schema.dogs.imageSource,
      rating: schema.ratings.value,
      ratedAt: schema.ratings.createdAt,
    })
    .from(schema.ratings)
    .innerJoin(schema.dogs, eq(schema.ratings.dogId, schema.dogs.id))
    .innerJoin(schema.breeds, eq(schema.dogs.breedId, schema.breeds.id))
    .where(eq(schema.ratings.anonId, anonId))
    .orderBy(desc(schema.ratings.createdAt))
    .limit(limit);

  const items = result.map((row) => ({
    dogId: row.dogId,
    dogName: row.dogName,
    breedName: row.breedName,
    breedSlug: row.breedSlug,
    imageUrl: getImageUrl({
      imageUrl: row.imageUrl,
      imageKey: row.imageKey,
      imageSource: row.imageSource,
    }),
    rating: row.rating,
    ratedAt: row.ratedAt,
  }));

  const data: RecentRatingsResponse = { items };

  return c.json(success(data));
});

/**
 * GET /api/me/achievements - Get user's milestone progress and achievements
 * Returns milestone progress bar data and achievement unlock status
 */
me.get("/achievements", async (c) => {
  const db = c.get("db");
  const anonId = c.get("anonId");

  // Get rating count for milestone progress
  const [ratingResult] = await db
    .select({ count: count() })
    .from(schema.ratings)
    .where(eq(schema.ratings.anonId, anonId));

  const currentCount = ratingResult?.count ?? 0;

  // Calculate milestone progress
  const completedMilestones = MILESTONES.filter(
    (m) => currentCount >= m.count
  ).map((m) => m.count);
  const nextMilestone = MILESTONES.find((m) => currentCount < m.count);

  let progressPercent = 100;
  if (nextMilestone) {
    const prevMilestone =
      completedMilestones.length > 0
        ? completedMilestones[completedMilestones.length - 1]
        : 0;
    const range = nextMilestone.count - prevMilestone;
    const progress = currentCount - prevMilestone;
    progressPercent = Math.round((progress / range) * 100);
  }

  // Check all achievements
  const achievements = await checkAchievements(db, anonId);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  const data: AchievementsResponse = {
    milestones: {
      current: currentCount,
      nextMilestone: nextMilestone?.count ?? null,
      nextMilestoneName: nextMilestone?.name ?? null,
      progressPercent,
      completedMilestones,
    },
    achievements,
    unlockedCount,
    totalAchievements: achievements.length,
  };

  return c.json(success(data));
});

export default me;
