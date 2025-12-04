import { useState, useEffect } from "react";
import { DogCard } from "@/components/DogCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface Dog {
  id: number;
  name: string | null;
  image_url: string;
  breed_name: string;
  avg_rating: number | null;
  rating_count: number;
}

interface DogApiResponse {
  success: boolean;
  data: Dog | null;
}

export function RatePage() {
  const [dog, setDog] = useState<Dog | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRating, setIsRating] = useState(false);
  const [noDogs, setNoDogs] = useState(false);
  const [ratedCount, setRatedCount] = useState(0);

  const fetchNextDog = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dogs/next");
      const json = (await res.json()) as DogApiResponse;
      if (json.success && json.data) {
        setDog(json.data);
        setNoDogs(false);
      } else {
        setDog(null);
        setNoDogs(true);
      }
    } catch (e) {
      console.error("Failed to fetch dog:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchNextDog();
  }, []);

  const handleRate = (value: number) => {
    if (!dog || isRating) return;
    setIsRating(true);
    fetch(`/api/dogs/${dog.id}/rate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    })
      .then(() => {
        setRatedCount((c) => c + 1);
        return fetchNextDog();
      })
      .catch((e) => console.error("Failed to rate:", e))
      .finally(() => setIsRating(false));
  };

  const handleSkip = () => {
    if (!dog || isRating) return;
    setIsRating(true);
    fetch(`/api/dogs/${dog.id}/skip`, { method: "POST" })
      .then(() => fetchNextDog())
      .catch((e) => console.error("Failed to skip:", e))
      .finally(() => setIsRating(false));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative">
          {/* Animated paw prints */}
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full bg-orange-500/60 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
        <p className="text-lg text-slate-400 animate-pulse">
          Finding the goodest dogs...
        </p>
      </div>
    );
  }

  if (noDogs) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        {/* Fun celebration illustration */}
        <div className="mb-6 text-6xl">
          <span role="img" aria-label="celebration">
            🎉🐕🎉
          </span>
        </div>
        <h2 className="text-2xl font-bold mb-2 text-white">
          You&apos;ve rated all the dogs!
        </h2>
        <p className="text-slate-400 mb-6 max-w-sm">
          Wow, you&apos;re a true dog lover! Check back later for more adorable
          pups, or add your own furry friend.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/upload">
            <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-orange-500/25">
              <svg
                className="w-4 h-4 mr-2"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Upload Your Dog
            </Button>
          </Link>
          <Link to="/leaderboard">
            <Button
              variant="outline"
              className="border-slate-600 hover:bg-slate-800 text-slate-200"
            >
              <svg
                className="w-4 h-4 mr-2"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M8 21h8M12 17v4M7 4h10l-1 9H8L7 4zM12 4V2" />
              </svg>
              View Leaderboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-6 px-4 min-h-[calc(100vh-4rem)]">
      {/* Header with stats */}
      <div className="w-full max-w-md mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
          Rate This Pup!
        </h1>
        {ratedCount > 0 && (
          <div className="flex items-center gap-1.5 bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-sm font-medium">
            <svg className="w-4 h-4" viewBox="0 0 24 19" fill="currentColor">
              <path d="M22.46 9.17c.94-.47 1.54-1.44 1.54-2.49v-.29C24 4.85 22.73 3.6 21.19 3.6c-1.2 0-2.27.77-2.65 1.91c-.29.86-.43 1.69-1.43 1.69H6.89c-1.03 0-1.18-.96-1.43-1.69C5.08 4.37 4 3.6 2.79 3.6 1.25 3.6 0 4.85 0 6.39v.29c0 1.06.6 2.02 1.54 2.49c.35.18.35.68 0 .86C.6 10.5 0 11.46 0 12.52v.29c0 1.54 1.25 2.79 2.79 2.79 1.2 0 2.27-.77 2.65-1.91c.29-.86.43-1.69 1.43-1.69h10.26c1.03 0 1.18.96 1.43 1.69c.38 1.14 1.45 1.91 2.65 1.91 1.54 0 2.79-1.25 2.79-2.79v-.29c0-1.06-.6-2.02-1.54-2.49-.35-.18-.35-.68 0-.86z" />
            </svg>
            {ratedCount} rated
          </div>
        )}
      </div>

      {/* Dog card */}
      {dog && (
        <div className="w-full max-w-md">
          <DogCard
            dog={dog}
            onRate={handleRate}
            onSkip={handleSkip}
            isRating={isRating}
          />
        </div>
      )}

      {/* Quick tip */}
      <div className="mt-6 text-center max-w-sm">
        <p className="text-xs text-gray-400">
          Tip: Click the bones to rate, or use keyboard arrows for quick rating!
        </p>
      </div>
    </div>
  );
}
