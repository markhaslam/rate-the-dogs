import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  PERSONALITIES,
  TOP_DOG_PERSONALITY,
  STATS_THRESHOLDS,
  type PersonalityDefinition,
} from "@rate-the-dogs/shared";

// Static gradient classes for Tailwind JIT (dynamic classes don't work)
const PERSONALITY_GRADIENTS: Record<string, string> = {
  puppy_trainee: "from-gray-400 to-gray-500",
  treat_dispenser: "from-pink-400 to-rose-500",
  belly_rub_expert: "from-blue-400 to-cyan-500",
  bark_inspector: "from-purple-400 to-violet-500",
  picky_pup_parent: "from-amber-400 to-yellow-500",
};

interface RaterPersonalityProps {
  ratingsCount: number;
  avgRating: number | null;
}

/**
 * Determines the user's personality based on rating patterns
 */
function getPersonality(
  ratingsCount: number,
  avgRating: number | null
): PersonalityDefinition {
  // Default to puppy trainee if not enough ratings
  if (ratingsCount < STATS_THRESHOLDS.PERSONALITY_MIN_RATINGS) {
    return PERSONALITIES.find((p) => p.id === "puppy_trainee")!;
  }

  // Find matching personality based on average rating
  for (const personality of PERSONALITIES) {
    if (personality.id === "puppy_trainee") continue; // Skip default

    const minAvg = personality.minAvg ?? 0;
    // Use <= for upper bound when maxAvg is not defined (e.g., Treat Dispenser at 5.0)
    const hasMaxBound = personality.maxAvg !== undefined;
    const maxAvg = personality.maxAvg ?? 5.0;
    const meetsMinRatings =
      personality.minRatings === undefined ||
      ratingsCount >= personality.minRatings;

    const meetsAvgRange =
      avgRating !== null &&
      avgRating >= minAvg &&
      (hasMaxBound ? avgRating < maxAvg : avgRating <= maxAvg);

    if (meetsAvgRange && meetsMinRatings) {
      return personality;
    }
  }

  // Fallback to puppy trainee
  return PERSONALITIES.find((p) => p.id === "puppy_trainee")!;
}

/**
 * Check if user qualifies for Top Dog bonus
 */
function isTopDog(ratingsCount: number): boolean {
  return ratingsCount >= STATS_THRESHOLDS.TOP_DOG_MIN_RATINGS;
}

/**
 * Rater personality badge component
 * Shows user's "rater type" based on their rating patterns
 */
export function RaterPersonality({
  ratingsCount,
  avgRating,
}: RaterPersonalityProps) {
  const personality = getPersonality(ratingsCount, avgRating);
  const topDog = isTopDog(ratingsCount);
  const isLocked = ratingsCount < STATS_THRESHOLDS.PERSONALITY_MIN_RATINGS;

  return (
    <Card
      className={cn(
        "p-6 text-center relative overflow-hidden",
        isLocked && "opacity-75"
      )}
    >
      {/* Background gradient */}
      <div
        className={cn(
          "absolute inset-0 opacity-10 bg-gradient-to-br",
          PERSONALITY_GRADIENTS[personality.id] || "from-gray-400 to-gray-500"
        )}
      />

      {/* Content */}
      <div className="relative">
        {/* Top Dog crown (if earned) */}
        {topDog && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-2xl">
            {TOP_DOG_PERSONALITY.icon}
          </div>
        )}

        {/* Main icon */}
        <div
          className={cn(
            "text-5xl mb-3",
            topDog && "mt-4",
            isLocked && "grayscale"
          )}
        >
          {personality.icon}
        </div>

        {/* Personality name */}
        <h3 className="text-xl font-bold text-foreground mb-1">
          {personality.name}
        </h3>

        {/* Tagline */}
        <p className="text-sm text-muted-foreground italic">
          &quot;{personality.tagline}&quot;
        </p>

        {/* Locked message */}
        {isLocked && (
          <p className="text-xs text-muted-foreground mt-3">
            Rate {STATS_THRESHOLDS.PERSONALITY_MIN_RATINGS - ratingsCount} more
            dogs to unlock your personality!
          </p>
        )}

        {/* Top Dog badge */}
        {topDog && (
          <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400/20 to-orange-400/20 text-sm font-medium text-amber-600 dark:text-amber-400">
            <span>{TOP_DOG_PERSONALITY.icon}</span>
            <span>{TOP_DOG_PERSONALITY.name}</span>
          </div>
        )}
      </div>
    </Card>
  );
}

/**
 * Skeleton loader for personality card
 */
export function RaterPersonalitySkeleton() {
  return (
    <Card className="p-6 text-center">
      <div className="h-12 w-12 bg-muted rounded-full mx-auto mb-3 animate-pulse" />
      <div className="h-6 w-32 bg-muted rounded mx-auto mb-2 animate-pulse" />
      <div className="h-4 w-48 bg-muted rounded mx-auto animate-pulse" />
    </Card>
  );
}
