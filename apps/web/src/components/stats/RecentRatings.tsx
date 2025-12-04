import { Card } from "@/components/ui/card";
import type { RecentRating } from "@rate-the-dogs/shared";

interface RecentRatingsProps {
  ratings: RecentRating[];
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 30) {
    return date.toLocaleDateString();
  } else if (diffDay > 0) {
    return `${diffDay}d ago`;
  } else if (diffHour > 0) {
    return `${diffHour}h ago`;
  } else if (diffMin > 0) {
    return `${diffMin}m ago`;
  } else {
    return "Just now";
  }
}

/**
 * Grid of recently rated dogs
 */
export function RecentRatings({ ratings }: RecentRatingsProps) {
  return (
    <Card className="p-6">
      <h3 className="font-semibold text-foreground mb-4">Recently Rated</h3>

      {ratings.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No recent ratings</p>
          <p className="text-sm mt-1">Your latest ratings will appear here!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {ratings.map((rating) => (
            <div
              key={`${rating.dogId}-${rating.ratedAt}`}
              className="group relative aspect-square rounded-xl overflow-hidden bg-muted"
            >
              {/* Dog image */}
              <img
                src={
                  rating.imageUrl ??
                  `https://placedog.net/200/200?id=${rating.dogId}`
                }
                alt={rating.dogName ?? rating.breedName}
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    `https://placedog.net/200/200?id=${rating.dogId}`;
                }}
              />

              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              {/* Rating badge */}
              <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
                <span className="text-sm font-bold text-white">
                  {rating.rating.toFixed(1)}
                </span>
                <svg
                  className="w-3 h-3 text-primary"
                  viewBox="0 0 24 19"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M22.46 9.17c.94-.47 1.54-1.44 1.54-2.49v-.29C24 4.85 22.73 3.6 21.19 3.6c-1.2 0-2.27.77-2.65 1.91c-.29.86-.43 1.69-1.43 1.69H6.89c-1.03 0-1.18-.96-1.43-1.69C5.08 4.37 4 3.6 2.79 3.6 1.25 3.6 0 4.85 0 6.39v.29c0 1.06.6 2.02 1.54 2.49c.35.18.35.68 0 .86C.6 10.5 0 11.46 0 12.52v.29c0 1.54 1.25 2.79 2.79 2.79 1.2 0 2.27-.77 2.65-1.91c.29-.86.43-1.69 1.43-1.69h10.26c1.03 0 1.18.96 1.43 1.69c.38 1.14 1.45 1.91 2.65 1.91 1.54 0 2.79-1.25 2.79-2.79v-.29c0-1.06-.6-2.02-1.54-2.49-.35-.18-.35-.68 0-.86z" />
                </svg>
              </div>

              {/* Info overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-2">
                <p className="text-white text-xs font-medium truncate">
                  {rating.breedName}
                </p>
                <p className="text-white/70 text-[10px]">
                  {formatRelativeTime(rating.ratedAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/**
 * Skeleton loader for recent ratings grid
 */
export function RecentRatingsSkeleton() {
  return (
    <Card className="p-6">
      <div className="h-5 w-32 bg-muted rounded animate-pulse mb-4" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
          <div
            key={i}
            className="aspect-square rounded-xl bg-muted animate-pulse"
          />
        ))}
      </div>
    </Card>
  );
}
