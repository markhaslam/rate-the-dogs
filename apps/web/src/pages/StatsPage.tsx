import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  StatCard,
  StatCardSkeleton,
  RaterPersonality,
  RaterPersonalitySkeleton,
  RatingDistribution,
  RatingDistributionSkeleton,
  TopBreedsList,
  TopBreedsListSkeleton,
  RecentRatings,
  RecentRatingsSkeleton,
  AchievementsBadges,
  AchievementsBadgesSkeleton,
  MilestoneProgress,
  MilestoneProgressSkeleton,
} from "@/components/stats";
import type {
  EnhancedStatsResponse,
  TopBreedsResponse,
  RatingDistributionResponse,
  RecentRatingsResponse,
  AchievementsResponse,
} from "@rate-the-dogs/shared";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
}

interface StatsData {
  stats: EnhancedStatsResponse | null;
  topBreeds: TopBreedsResponse | null;
  distribution: RatingDistributionResponse | null;
  recent: RecentRatingsResponse | null;
  achievements: AchievementsResponse | null;
}

export function StatsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<StatsData>({
    stats: null,
    topBreeds: null,
    distribution: null,
    recent: null,
    achievements: null,
  });

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch all endpoints in parallel
        const [
          statsRes,
          topBreedsRes,
          distributionRes,
          recentRes,
          achievementsRes,
        ] = await Promise.all([
          fetch("/api/me/stats"),
          fetch("/api/me/top-breeds"),
          fetch("/api/me/rating-distribution"),
          fetch("/api/me/recent"),
          fetch("/api/me/achievements"),
        ]);

        const [stats, topBreeds, distribution, recent, achievements] =
          await Promise.all([
            statsRes.json() as Promise<ApiResponse<EnhancedStatsResponse>>,
            topBreedsRes.json() as Promise<ApiResponse<TopBreedsResponse>>,
            distributionRes.json() as Promise<
              ApiResponse<RatingDistributionResponse>
            >,
            recentRes.json() as Promise<ApiResponse<RecentRatingsResponse>>,
            achievementsRes.json() as Promise<
              ApiResponse<AchievementsResponse>
            >,
          ]);

        setData({
          stats: stats.success ? (stats.data ?? null) : null,
          topBreeds: topBreeds.success ? (topBreeds.data ?? null) : null,
          distribution: distribution.success
            ? (distribution.data ?? null)
            : null,
          recent: recent.success ? (recent.data ?? null) : null,
          achievements: achievements.success
            ? (achievements.data ?? null)
            : null,
        });
      } catch (e) {
        console.error("Failed to fetch stats:", e);
        setError("Couldn't load your stats. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    void fetchAllData();
  }, []);

  // Empty state for users with no ratings
  if (!loading && data.stats?.ratingsCount === 0) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="text-6xl mb-6">🐾</div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            No Stats Yet!
          </h1>
          <p className="text-muted-foreground mb-8 max-w-sm">
            Start rating dogs to unlock your personal stats, achievements, and
            discover your rater personality!
          </p>
          <Link to="/">
            <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-primary/25 text-white">
              <svg
                className="w-4 h-4 mr-2"
                viewBox="0 0 24 19"
                fill="currentColor"
              >
                <path d="M22.46 9.17c.94-.47 1.54-1.44 1.54-2.49v-.29C24 4.85 22.73 3.6 21.19 3.6c-1.2 0-2.27.77-2.65 1.91c-.29.86-.43 1.69-1.43 1.69H6.89c-1.03 0-1.18-.96-1.43-1.69C5.08 4.37 4 3.6 2.79 3.6 1.25 3.6 0 4.85 0 6.39v.29c0 1.06.6 2.02 1.54 2.49c.35.18.35.68 0 .86C.6 10.5 0 11.46 0 12.52v.29c0 1.54 1.25 2.79 2.79 2.79 1.2 0 2.27-.77 2.65-1.91c.29-.86.43-1.69 1.43-1.69h10.26c1.03 0 1.18.96 1.43 1.69c.38 1.14 1.45 1.91 2.65 1.91 1.54 0 2.79-1.25 2.79-2.79v-.29c0-1.06-.6-2.02-1.54-2.49-.35-.18-.35-.68 0-.86z" />
              </svg>
              Start Rating Dogs
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="text-6xl mb-6">🐕💔</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Oops! Something went wrong
          </h2>
          <p className="text-muted-foreground mb-6 max-w-sm">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-2xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
          My Stats
        </h1>
        <p className="text-muted-foreground mt-2">
          Your personal dog rating journey
        </p>
      </div>

      <div className="space-y-6">
        {/* Milestone Progress */}
        <section aria-labelledby="milestones-heading">
          <h2 id="milestones-heading" className="sr-only">
            Milestone Progress
          </h2>
          {loading || !data.achievements ? (
            <MilestoneProgressSkeleton />
          ) : (
            <MilestoneProgress
              current={data.achievements.milestones.current}
              nextMilestone={data.achievements.milestones.nextMilestone}
              nextMilestoneName={data.achievements.milestones.nextMilestoneName}
              progressPercent={data.achievements.milestones.progressPercent}
              completedMilestones={
                data.achievements.milestones.completedMilestones
              }
            />
          )}
        </section>

        {/* Stat Cards Grid */}
        <section aria-labelledby="stats-heading">
          <h2 id="stats-heading" className="sr-only">
            Rating Statistics
          </h2>
          {loading || !data.stats ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <StatCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard
                icon="🦴"
                value={data.stats.ratingsCount}
                label="Dogs Rated"
              />
              <StatCard
                icon="⭐"
                value={
                  data.stats.avgRatingGiven !== null
                    ? data.stats.avgRatingGiven.toFixed(1)
                    : "—"
                }
                label="Avg Rating"
              />
              <StatCard
                icon="📊"
                value={
                  data.stats.ratingDiffFromGlobal !== null
                    ? (data.stats.ratingDiffFromGlobal > 0 ? "+" : "") +
                      data.stats.ratingDiffFromGlobal.toFixed(1)
                    : "—"
                }
                label="vs Global"
                positive={
                  data.stats.ratingDiffFromGlobal !== null &&
                  data.stats.ratingDiffFromGlobal > 0
                }
                negative={
                  data.stats.ratingDiffFromGlobal !== null &&
                  data.stats.ratingDiffFromGlobal < 0
                }
                subValue={
                  data.stats.ratingDiffFromGlobal !== null
                    ? data.stats.ratingDiffFromGlobal > 0
                      ? "More generous"
                      : data.stats.ratingDiffFromGlobal < 0
                        ? "Tougher critic"
                        : "Right on average"
                    : undefined
                }
              />
              <StatCard
                icon="⏭️"
                value={data.stats.skipsCount}
                label="Dogs Skipped"
              />
            </div>
          )}
        </section>

        {/* Rater Personality */}
        <section aria-labelledby="personality-heading">
          <h2 id="personality-heading" className="sr-only">
            Your Rater Personality
          </h2>
          {loading || !data.stats ? (
            <RaterPersonalitySkeleton />
          ) : (
            <RaterPersonality
              ratingsCount={data.stats.ratingsCount}
              avgRating={data.stats.avgRatingGiven}
            />
          )}
        </section>

        {/* Achievements */}
        <section aria-labelledby="achievements-heading">
          <h2 id="achievements-heading" className="sr-only">
            Achievements
          </h2>
          {loading || !data.achievements ? (
            <AchievementsBadgesSkeleton />
          ) : (
            <AchievementsBadges
              achievements={data.achievements.achievements}
              unlockedCount={data.achievements.unlockedCount}
              totalAchievements={data.achievements.totalAchievements}
            />
          )}
        </section>

        {/* Rating Distribution */}
        <section aria-labelledby="distribution-heading">
          <h2 id="distribution-heading" className="sr-only">
            Rating Distribution
          </h2>
          {loading || !data.distribution ? (
            <RatingDistributionSkeleton />
          ) : (
            <RatingDistribution
              distribution={data.distribution.distribution}
              modeRating={data.distribution.modeRating}
              totalRatings={data.distribution.totalRatings}
            />
          )}
        </section>

        {/* Top Breeds */}
        <section aria-labelledby="top-breeds-heading">
          <h2 id="top-breeds-heading" className="sr-only">
            Your Favorite Breeds
          </h2>
          {loading || !data.topBreeds ? (
            <TopBreedsListSkeleton />
          ) : (
            <TopBreedsList
              breeds={data.topBreeds.items}
              totalBreedsRated={data.topBreeds.totalBreedsRated}
            />
          )}
        </section>

        {/* Recent Ratings */}
        <section aria-labelledby="recent-heading">
          <h2 id="recent-heading" className="sr-only">
            Recently Rated
          </h2>
          {loading || !data.recent ? (
            <RecentRatingsSkeleton />
          ) : (
            <RecentRatings ratings={data.recent.items} />
          )}
        </section>
      </div>
    </main>
  );
}
