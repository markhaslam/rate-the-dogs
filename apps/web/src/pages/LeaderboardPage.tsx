import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface LeaderboardDog {
  id: number;
  name: string | null;
  image_url: string;
  breed_name: string;
  avg_rating: number;
  rating_count: number;
}

interface LeaderboardBreed {
  id: number;
  name: string;
  slug: string;
  avg_rating: number;
  dog_count: number;
  rating_count: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: { items: T[] };
}

// Medal/rank badges
const rankBadges: Record<number, { icon: string; color: string }> = {
  1: { icon: "🥇", color: "from-yellow-400 to-amber-500" },
  2: { icon: "🥈", color: "from-gray-300 to-gray-400" },
  3: { icon: "🥉", color: "from-orange-400 to-orange-500" },
};

export function LeaderboardPage() {
  const [tab, setTab] = useState<"dogs" | "breeds">("dogs");
  const [dogs, setDogs] = useState<LeaderboardDog[]>([]);
  const [breeds, setBreeds] = useState<LeaderboardBreed[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (tab === "dogs") {
          const res = await fetch("/api/leaderboard/dogs?limit=20");
          const json = (await res.json()) as ApiResponse<LeaderboardDog>;
          if (json.success) setDogs(json.data.items);
        } else {
          const res = await fetch("/api/leaderboard/breeds?limit=20");
          const json = (await res.json()) as ApiResponse<LeaderboardBreed>;
          if (json.success) setBreeds(json.data.items);
        }
      } catch (e) {
        console.error("Failed to fetch leaderboard:", e);
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, [tab]);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
          Leaderboard
        </h1>
        <p className="text-muted-foreground mt-2">
          The most beloved dogs on the internet
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex bg-muted rounded-xl p-1">
          <button
            onClick={() => setTab("dogs")}
            className={cn(
              "px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-200",
              tab === "dogs"
                ? "bg-card text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 19" fill="currentColor">
                <path d="M22.46 9.17c.94-.47 1.54-1.44 1.54-2.49v-.29C24 4.85 22.73 3.6 21.19 3.6c-1.2 0-2.27.77-2.65 1.91c-.29.86-.43 1.69-1.43 1.69H6.89c-1.03 0-1.18-.96-1.43-1.69C5.08 4.37 4 3.6 2.79 3.6 1.25 3.6 0 4.85 0 6.39v.29c0 1.06.6 2.02 1.54 2.49c.35.18.35.68 0 .86C.6 10.5 0 11.46 0 12.52v.29c0 1.54 1.25 2.79 2.79 2.79 1.2 0 2.27-.77 2.65-1.91c.29-.86.43-1.69 1.43-1.69h10.26c1.03 0 1.18.96 1.43 1.69c.38 1.14 1.45 1.91 2.65 1.91 1.54 0 2.79-1.25 2.79-2.79v-.29c0-1.06-.6-2.02-1.54-2.49-.35-.18-.35-.68 0-.86z" />
              </svg>
              Top Dogs
            </span>
          </button>
          <button
            onClick={() => setTab("breeds")}
            className={cn(
              "px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-200",
              tab === "breeds"
                ? "bg-card text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="flex items-center gap-2">
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 19"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M8 21h8M12 17v4M7 4h10l-1 9H8L7 4zM12 4V2" />
              </svg>
              Top Breeds
            </span>
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Dogs leaderboard */}
      {!loading && tab === "dogs" && (
        <div className="space-y-3">
          {dogs.length === 0 ? (
            <EmptyState message="No rated dogs yet. Be the first to rate!" />
          ) : (
            dogs.map((dog, i) => (
              <Card
                key={dog.id}
                className={cn(
                  "flex items-center p-4 transition-all duration-200 hover:shadow-md bg-card/50 border-border/50",
                  i < 3 &&
                    `bg-gradient-to-r ${rankBadges[i + 1]?.color ?? ""}/10`
                )}
              >
                {/* Rank */}
                <div className="w-12 flex-shrink-0 text-center">
                  {i < 3 ? (
                    <span className="text-2xl">{rankBadges[i + 1]?.icon}</span>
                  ) : (
                    <span className="text-lg font-bold text-muted-foreground">
                      #{i + 1}
                    </span>
                  )}
                </div>

                {/* Dog image */}
                <img
                  src={dog.image_url}
                  alt={dog.name ?? "Dog"}
                  className="w-14 h-14 rounded-xl object-cover shadow-sm"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      `https://placedog.net/100/100?id=${dog.id}`;
                  }}
                />

                {/* Dog info */}
                <div className="flex-1 ml-4 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">
                    {dog.name ?? "Unnamed Pup"}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {dog.breed_name}
                  </p>
                </div>

                {/* Rating */}
                <div className="text-right flex-shrink-0 ml-4">
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="text-xl font-bold text-primary">
                      {dog.avg_rating.toFixed(1)}
                    </span>
                    <svg
                      className="w-5 h-5 text-primary"
                      viewBox="0 0 24 19"
                      fill="currentColor"
                    >
                      <path d="M22.46 9.17c.94-.47 1.54-1.44 1.54-2.49v-.29C24 4.85 22.73 3.6 21.19 3.6c-1.2 0-2.27.77-2.65 1.91c-.29.86-.43 1.69-1.43 1.69H6.89c-1.03 0-1.18-.96-1.43-1.69C5.08 4.37 4 3.6 2.79 3.6 1.25 3.6 0 4.85 0 6.39v.29c0 1.06.6 2.02 1.54 2.49c.35.18.35.68 0 .86C.6 10.5 0 11.46 0 12.52v.29c0 1.54 1.25 2.79 2.79 2.79 1.2 0 2.27-.77 2.65-1.91c.29-.86.43-1.69 1.43-1.69h10.26c1.03 0 1.18.96 1.43 1.69c.38 1.14 1.45 1.91 2.65 1.91 1.54 0 2.79-1.25 2.79-2.79v-.29c0-1.06-.6-2.02-1.54-2.49-.35-.18-.35-.68 0-.86z" />
                    </svg>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {dog.rating_count}{" "}
                    {dog.rating_count === 1 ? "rating" : "ratings"}
                  </p>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Breeds leaderboard */}
      {!loading && tab === "breeds" && (
        <div className="space-y-3">
          {breeds.length === 0 ? (
            <EmptyState message="No rated breeds yet. Start rating some dogs!" />
          ) : (
            breeds.map((breed, i) => (
              <Card
                key={breed.id}
                className={cn(
                  "flex items-center p-4 transition-all duration-200 hover:shadow-md bg-card/50 border-border/50",
                  i < 3 &&
                    `bg-gradient-to-r ${rankBadges[i + 1]?.color ?? ""}/10`
                )}
              >
                {/* Rank */}
                <div className="w-12 flex-shrink-0 text-center">
                  {i < 3 ? (
                    <span className="text-2xl">{rankBadges[i + 1]?.icon}</span>
                  ) : (
                    <span className="text-lg font-bold text-muted-foreground">
                      #{i + 1}
                    </span>
                  )}
                </div>

                {/* Breed icon */}
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-7 h-7 text-primary"
                    viewBox="0 0 24 19"
                    fill="currentColor"
                  >
                    <path d="M22.46 9.17c.94-.47 1.54-1.44 1.54-2.49v-.29C24 4.85 22.73 3.6 21.19 3.6c-1.2 0-2.27.77-2.65 1.91c-.29.86-.43 1.69-1.43 1.69H6.89c-1.03 0-1.18-.96-1.43-1.69C5.08 4.37 4 3.6 2.79 3.6 1.25 3.6 0 4.85 0 6.39v.29c0 1.06.6 2.02 1.54 2.49c.35.18.35.68 0 .86C.6 10.5 0 11.46 0 12.52v.29c0 1.54 1.25 2.79 2.79 2.79 1.2 0 2.27-.77 2.65-1.91c.29-.86.43-1.69 1.43-1.69h10.26c1.03 0 1.18.96 1.43 1.69c.38 1.14 1.45 1.91 2.65 1.91 1.54 0 2.79-1.25 2.79-2.79v-.29c0-1.06-.6-2.02-1.54-2.49-.35-.18-.35-.68 0-.86z" />
                  </svg>
                </div>

                {/* Breed info */}
                <div className="flex-1 ml-4 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">
                    {breed.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {breed.dog_count} {breed.dog_count === 1 ? "dog" : "dogs"}
                  </p>
                </div>

                {/* Rating */}
                <div className="text-right flex-shrink-0 ml-4">
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="text-xl font-bold text-primary">
                      {breed.avg_rating.toFixed(1)}
                    </span>
                    <svg
                      className="w-5 h-5 text-primary"
                      viewBox="0 0 24 19"
                      fill="currentColor"
                    >
                      <path d="M22.46 9.17c.94-.47 1.54-1.44 1.54-2.49v-.29C24 4.85 22.73 3.6 21.19 3.6c-1.2 0-2.27.77-2.65 1.91c-.29.86-.43 1.69-1.43 1.69H6.89c-1.03 0-1.18-.96-1.43-1.69C5.08 4.37 4 3.6 2.79 3.6 1.25 3.6 0 4.85 0 6.39v.29c0 1.06.6 2.02 1.54 2.49c.35.18.35.68 0 .86C.6 10.5 0 11.46 0 12.52v.29c0 1.54 1.25 2.79 2.79 2.79 1.2 0 2.27-.77 2.65-1.91c.29-.86.43-1.69 1.43-1.69h10.26c1.03 0 1.18.96 1.43 1.69c.38 1.14 1.45 1.91 2.65 1.91 1.54 0 2.79-1.25 2.79-2.79v-.29c0-1.06-.6-2.02-1.54-2.49-.35-.18-.35-.68 0-.86z" />
                    </svg>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {breed.rating_count}{" "}
                    {breed.rating_count === 1 ? "rating" : "ratings"}
                  </p>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12">
      <div className="text-5xl mb-4">
        <span role="img" aria-label="empty">
          🐾
        </span>
      </div>
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}
