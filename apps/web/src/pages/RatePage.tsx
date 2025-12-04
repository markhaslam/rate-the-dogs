import { useState, useEffect, useRef } from "react";
import { DogCard } from "@/components/DogCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useDogPrefetch } from "@/hooks/useDogPrefetch";

interface RevealedRating {
  avgRating: number;
  ratingCount: number;
  userRating: number;
}

export function RatePage() {
  const { currentDog, queueLength, loading, noDogs, error, popDog } =
    useDogPrefetch({
      prefetchCount: 5, // Reduced from 10 to balance UX vs bandwidth
      refillThreshold: 3,
    });

  const [isRating, setIsRating] = useState(false);
  const [ratedCount, setRatedCount] = useState(0);
  const [revealedRating, setRevealedRating] = useState<RevealedRating | null>(
    null
  );

  // Slide animation state
  const [isEntering, setIsEntering] = useState(false);
  const [previousImageUrl, setPreviousImageUrl] = useState<string | null>(null);
  const prevDogIdRef = useRef<number | null>(null);

  // Trigger slide-in animation when dog changes
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    if (
      currentDog &&
      prevDogIdRef.current !== null &&
      currentDog.id !== prevDogIdRef.current
    ) {
      // Dog has changed, animate entrance with slide-over effect
      setIsEntering(true);
      // Clear entering state after animation completes
      timer = setTimeout(() => {
        setIsEntering(false);
        setPreviousImageUrl(null);
      }, 300); // Match animation duration
    }

    if (currentDog) {
      prevDogIdRef.current = currentDog.id;
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [currentDog]);

  // Fetch user's rating count on mount to persist across page refreshes
  useEffect(() => {
    fetch("/api/me/stats")
      .then((res) => res.json())
      .then((data: { success: boolean; data?: { ratings_count: number } }) => {
        if (data.success && data.data) {
          setRatedCount(data.data.ratings_count);
        }
      })
      .catch((e) => console.error("Failed to fetch stats:", e));
  }, []);

  const handleRate = (value: number) => {
    if (!currentDog || isRating) return;
    setIsRating(true);
    fetch(`/api/dogs/${currentDog.id}/rate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    })
      .then((res) => res.json())
      .then(
        (data: {
          success: boolean;
          data?: { avg_rating: number; rating_count: number };
          error?: { code: string; message: string };
        }) => {
          if (data.success && data.data) {
            // Show the reveal animation with the updated rating
            setRevealedRating({
              avgRating: data.data.avg_rating,
              ratingCount: data.data.rating_count,
              userRating: value,
            });
            setRatedCount((c) => c + 1);
          } else if (data.error?.code === "ALREADY_RATED") {
            // User already rated this dog (stale state), move to next dog
            console.warn("Already rated this dog, moving to next");
            popDog();
          }
        }
      )
      .catch((e) => console.error("Failed to rate:", e))
      .finally(() => setIsRating(false));
  };

  const handleRevealComplete = () => {
    setRevealedRating(null);
    // Capture current image for slide-over animation
    if (currentDog) {
      setPreviousImageUrl(currentDog.image_url);
    }
    popDog();
  };

  const handleSkip = () => {
    if (!currentDog || isRating) return;
    setIsRating(true);
    fetch(`/api/dogs/${currentDog.id}/skip`, { method: "POST" })
      .then(() => {
        // Capture current image for slide-over animation
        if (currentDog) {
          setPreviousImageUrl(currentDog.image_url);
        }
        popDog();
      })
      .catch((e) => console.error("Failed to skip:", e))
      .finally(() => setIsRating(false));
  };

  // Show loading only on initial load when queue is empty
  if (loading && queueLength === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative">
          {/* Animated paw prints */}
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full bg-primary/60 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
        <p className="text-lg text-muted-foreground animate-pulse">
          Finding the goodest dogs...
        </p>
      </div>
    );
  }

  // Show error state
  if (error && !currentDog) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="mb-6 text-6xl">
          <span role="img" aria-label="sad dog">
            🐕💔
          </span>
        </div>
        <h2 className="text-2xl font-bold mb-2 text-foreground">
          Oops! Something went wrong
        </h2>
        <p className="text-muted-foreground mb-6 max-w-sm">
          We couldn&apos;t load any dogs. Please try refreshing the page.
        </p>
        <Button
          onClick={() => window.location.reload()}
          className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
        >
          Refresh Page
        </Button>
      </div>
    );
  }

  if (noDogs && !currentDog) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        {/* Fun celebration illustration */}
        <div className="mb-6 text-6xl">
          <span role="img" aria-label="celebration">
            🎉🐕🎉
          </span>
        </div>
        <h2 className="text-2xl font-bold mb-2 text-foreground">
          You&apos;ve rated all the dogs!
        </h2>
        <p className="text-muted-foreground mb-6 max-w-sm">
          Wow, you&apos;re a true dog lover! Check back later for more adorable
          pups, or add your own furry friend.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/upload">
            <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-primary/25 text-white">
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
              className="border-border hover:bg-muted text-foreground"
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
        <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
          Rate This Pup!
        </h1>
        <div className="flex items-center gap-2">
          {ratedCount > 0 && (
            <div className="flex items-center gap-1.5 bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-medium">
              <svg className="w-4 h-4" viewBox="0 0 24 19" fill="currentColor">
                <path d="M22.46 9.17c.94-.47 1.54-1.44 1.54-2.49v-.29C24 4.85 22.73 3.6 21.19 3.6c-1.2 0-2.27.77-2.65 1.91c-.29.86-.43 1.69-1.43 1.69H6.89c-1.03 0-1.18-.96-1.43-1.69C5.08 4.37 4 3.6 2.79 3.6 1.25 3.6 0 4.85 0 6.39v.29c0 1.06.6 2.02 1.54 2.49c.35.18.35.68 0 .86C.6 10.5 0 11.46 0 12.52v.29c0 1.54 1.25 2.79 2.79 2.79 1.2 0 2.27-.77 2.65-1.91c.29-.86.43-1.69 1.43-1.69h10.26c1.03 0 1.18.96 1.43 1.69c.38 1.14 1.45 1.91 2.65 1.91 1.54 0 2.79-1.25 2.79-2.79v-.29c0-1.06-.6-2.02-1.54-2.49-.35-.18-.35-.68 0-.86z" />
              </svg>
              {ratedCount} rated
            </div>
          )}
        </div>
      </div>

      {/* Dog card with image slide animation */}
      {currentDog && (
        <div className="w-full max-w-md">
          <DogCard
            key={currentDog.id}
            dog={currentDog}
            onRate={handleRate}
            onSkip={handleSkip}
            isRating={isRating}
            revealedRating={revealedRating}
            onRevealComplete={handleRevealComplete}
            imageTransition={isEntering ? "enter" : "idle"}
            previousImageUrl={isEntering ? previousImageUrl : null}
          />
        </div>
      )}

      {/* Quick tip */}
      <div className="mt-6 text-center max-w-sm">
        <p className="text-xs text-muted-foreground">
          Tip: Tap the bones to rate!
        </p>
      </div>
    </div>
  );
}
