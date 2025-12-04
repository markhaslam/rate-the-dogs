import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { TopBreed } from "@rate-the-dogs/shared";

interface TopBreedsListProps {
  breeds: TopBreed[];
  totalBreedsRated: number;
}

// Medal badges for top 3
const medals: Record<number, { icon: string; color: string }> = {
  0: { icon: "🥇", color: "from-yellow-400 to-amber-500" },
  1: { icon: "🥈", color: "from-gray-300 to-gray-400" },
  2: { icon: "🥉", color: "from-orange-400 to-orange-500" },
};

/**
 * Top breeds list showing user's highest-rated breeds
 */
export function TopBreedsList({
  breeds,
  totalBreedsRated,
}: TopBreedsListProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Your Favorite Breeds</h3>
        {totalBreedsRated > 0 && (
          <span className="text-sm text-muted-foreground">
            {totalBreedsRated} breeds rated
          </span>
        )}
      </div>

      {breeds.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No breeds rated yet</p>
          <p className="text-sm mt-1">
            Start rating dogs to see your favorites!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {breeds.map((breed, index) => (
            <div
              key={breed.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg transition-colors",
                index < 3 && `bg-gradient-to-r ${medals[index]?.color ?? ""}/10`
              )}
            >
              {/* Medal or rank */}
              <div className="w-8 flex-shrink-0 text-center">
                {index < 3 ? (
                  <span className="text-xl">{medals[index]?.icon}</span>
                ) : (
                  <span className="text-sm font-bold text-muted-foreground">
                    #{index + 1}
                  </span>
                )}
              </div>

              {/* Breed image */}
              <img
                src={
                  breed.imageUrl ??
                  `https://placedog.net/100/100?id=${breed.id}`
                }
                alt={breed.name}
                className="w-12 h-12 rounded-lg object-cover shadow-sm flex-shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    `https://placedog.net/100/100?id=${breed.id}`;
                }}
              />

              {/* Breed info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-foreground truncate">
                  {breed.name}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {breed.ratingCount}{" "}
                  {breed.ratingCount === 1 ? "rating" : "ratings"}
                </p>
              </div>

              {/* Average rating */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className="text-lg font-bold text-primary">
                  {breed.avgRating.toFixed(1)}
                </span>
                <svg
                  className="w-4 h-4 text-primary"
                  viewBox="0 0 24 19"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M22.46 9.17c.94-.47 1.54-1.44 1.54-2.49v-.29C24 4.85 22.73 3.6 21.19 3.6c-1.2 0-2.27.77-2.65 1.91c-.29.86-.43 1.69-1.43 1.69H6.89c-1.03 0-1.18-.96-1.43-1.69C5.08 4.37 4 3.6 2.79 3.6 1.25 3.6 0 4.85 0 6.39v.29c0 1.06.6 2.02 1.54 2.49c.35.18.35.68 0 .86C.6 10.5 0 11.46 0 12.52v.29c0 1.54 1.25 2.79 2.79 2.79 1.2 0 2.27-.77 2.65-1.91c.29-.86.43-1.69 1.43-1.69h10.26c1.03 0 1.18.96 1.43 1.69c.38 1.14 1.45 1.91 2.65 1.91 1.54 0 2.79-1.25 2.79-2.79v-.29c0-1.06-.6-2.02-1.54-2.49-.35-.18-.35-.68 0-.86z" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/**
 * Skeleton loader for top breeds list
 */
export function TopBreedsListSkeleton() {
  return (
    <Card className="p-6">
      <div className="h-5 w-40 bg-muted rounded animate-pulse mb-4" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <div className="w-8 h-8 bg-muted rounded animate-pulse" />
            <div className="w-12 h-12 bg-muted rounded-lg animate-pulse" />
            <div className="flex-1">
              <div className="h-4 w-24 bg-muted rounded animate-pulse mb-1" />
              <div className="h-3 w-16 bg-muted rounded animate-pulse" />
            </div>
            <div className="h-6 w-12 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    </Card>
  );
}
