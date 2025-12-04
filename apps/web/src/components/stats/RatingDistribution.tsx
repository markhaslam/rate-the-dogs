import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface RatingDistributionProps {
  distribution: Record<string, number>;
  modeRating: number | null;
  totalRatings: number;
}

// All possible rating values
const RATING_VALUES = [
  "5",
  "4.5",
  "4",
  "3.5",
  "3",
  "2.5",
  "2",
  "1.5",
  "1",
  "0.5",
];

/**
 * Horizontal bar chart showing rating value distribution
 */
export function RatingDistribution({
  distribution,
  modeRating,
  totalRatings,
}: RatingDistributionProps) {
  // Find max count for scaling
  const maxCount = Math.max(...Object.values(distribution), 1);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Your Rating Style</h3>
        {totalRatings > 0 && (
          <span className="text-sm text-muted-foreground">
            {totalRatings} total
          </span>
        )}
      </div>

      {totalRatings === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No ratings yet</p>
          <p className="text-sm mt-1">Start rating to see your pattern!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {RATING_VALUES.map((value) => {
            const count = distribution[value] ?? 0;
            const percentage =
              totalRatings > 0 ? (count / totalRatings) * 100 : 0;
            const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;
            const isMode =
              modeRating !== null && parseFloat(value) === modeRating;

            return (
              <div key={value} className="flex items-center gap-3">
                {/* Rating value label */}
                <span
                  className={cn(
                    "w-8 text-sm font-medium text-right",
                    isMode ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {value}
                </span>

                {/* Bar container */}
                <div className="flex-1 h-6 bg-muted/50 rounded-full overflow-hidden relative">
                  {/* Fill bar */}
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      isMode
                        ? "bg-gradient-to-r from-primary to-amber-500"
                        : "bg-primary/60"
                    )}
                    style={{ width: `${barWidth}%` }}
                  />

                  {/* Mode indicator star */}
                  {isMode && count > 0 && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs">
                      Favorite
                    </span>
                  )}
                </div>

                {/* Count & percentage */}
                <span className="w-16 text-sm text-muted-foreground text-right">
                  {count > 0 ? `${percentage.toFixed(0)}%` : "—"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

/**
 * Skeleton loader for distribution chart
 */
export function RatingDistributionSkeleton() {
  return (
    <Card className="p-6">
      <div className="h-5 w-32 bg-muted rounded animate-pulse mb-4" />
      <div className="space-y-2">
        {RATING_VALUES.map((value) => (
          <div key={value} className="flex items-center gap-3">
            <span className="w-8 text-sm text-muted-foreground text-right">
              {value}
            </span>
            <div className="flex-1 h-6 bg-muted rounded-full animate-pulse" />
            <span className="w-16" />
          </div>
        ))}
      </div>
    </Card>
  );
}
