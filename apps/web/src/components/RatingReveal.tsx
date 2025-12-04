import { useEffect, useState, useRef, useCallback } from "react";

interface RatingRevealProps {
  rating: number;
  ratingCount: number;
  userRating: number;
  onComplete?: () => void;
}

/**
 * Animated rating reveal component
 * Shows after user rates a dog with a smooth animation
 */
export function RatingReveal({
  rating,
  ratingCount,
  userRating,
  onComplete,
}: RatingRevealProps) {
  const [phase, setPhase] = useState<"enter" | "counting" | "complete">(
    "enter"
  );
  const [displayRating, setDisplayRating] = useState(0);

  // Use ref to avoid re-triggering animation when onComplete changes
  const onCompleteRef = useRef(onComplete);
  const hasCalledCompleteRef = useRef(false);

  // Keep ref updated
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Handle clicking to skip animation
  const handleClick = useCallback(() => {
    if (!hasCalledCompleteRef.current) {
      hasCalledCompleteRef.current = true;
      onCompleteRef.current?.();
    }
  }, []);

  useEffect(() => {
    // Phase 1: Enter animation
    const enterTimer = setTimeout(() => {
      setPhase("counting");
    }, 100);

    return () => clearTimeout(enterTimer);
  }, []);

  useEffect(() => {
    if (phase !== "counting") return;

    // Phase 2: Count up animation
    const duration = 800;
    const startTime = Date.now();
    const startValue = 0;
    const endValue = rating;
    let animationFrameId: number;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (endValue - startValue) * eased;

      setDisplayRating(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setPhase("complete");
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [phase, rating]);

  // Phase 3: Auto-continue after delay (separate effect to avoid cleanup issues)
  useEffect(() => {
    if (phase !== "complete") return;

    const completionTimerId = setTimeout(() => {
      if (!hasCalledCompleteRef.current) {
        hasCalledCompleteRef.current = true;
        onCompleteRef.current?.();
      }
    }, 1500);

    return () => {
      clearTimeout(completionTimerId);
    };
  }, [phase]);

  const difference = userRating - rating;
  const differenceText =
    Math.abs(difference) < 0.1
      ? "Right on the average!"
      : difference > 0
        ? `${difference.toFixed(1)} above average`
        : `${Math.abs(difference).toFixed(1)} below average`;

  return (
    <div
      className={`
        absolute inset-0 z-20 flex flex-col items-center justify-center
        bg-gradient-to-b from-black/80 via-black/70 to-black/80
        backdrop-blur-sm rounded-lg
        transition-opacity duration-300 cursor-pointer
        ${phase === "enter" ? "opacity-0" : "opacity-100"}
      `}
      data-testid="rating-reveal"
      onClick={handleClick}
      role="button"
      aria-label="Click to continue to next dog"
    >
      {/* Celebration particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 12 }, (_, i) => (
          <div
            key={i}
            className={`
              absolute w-2 h-2 rounded-full
              ${i % 3 === 0 ? "bg-orange-400" : i % 3 === 1 ? "bg-amber-400" : "bg-yellow-400"}
              ${phase !== "enter" ? "animate-confetti" : "opacity-0"}
            `}
            style={{
              left: `${10 + ((i * 7) % 80)}%`,
              top: `${20 + ((i * 11) % 60)}%`,
              animationDelay: `${i * 0.08}s`,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div
        className={`
          text-center transform transition-all duration-500
          ${phase === "enter" ? "scale-50 opacity-0" : "scale-100 opacity-100"}
        `}
      >
        {/* "Average Rating" label */}
        <p className="text-white/80 text-sm font-medium mb-2 tracking-wide uppercase">
          Average Rating
        </p>

        {/* Big animated rating number */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <span
            className={`
              text-6xl font-bold text-transparent bg-clip-text
              bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400
              transition-transform duration-300
              ${phase === "complete" ? "scale-110" : "scale-100"}
            `}
          >
            {displayRating.toFixed(1)}
          </span>
          <svg
            className={`
              w-12 h-12 text-orange-400
              transition-transform duration-500
              ${phase === "complete" ? "scale-110 rotate-12" : "scale-100"}
            `}
            viewBox="0 0 24 19"
            fill="currentColor"
          >
            <path d="M22.46 9.17c.94-.47 1.54-1.44 1.54-2.49v-.29C24 4.85 22.73 3.6 21.19 3.6c-1.2 0-2.27.77-2.65 1.91c-.29.86-.43 1.69-1.43 1.69H6.89c-1.03 0-1.18-.96-1.43-1.69C5.08 4.37 4 3.6 2.79 3.6 1.25 3.6 0 4.85 0 6.39v.29c0 1.06.6 2.02 1.54 2.49c.35.18.35.68 0 .86C.6 10.5 0 11.46 0 12.52v.29c0 1.54 1.25 2.79 2.79 2.79 1.2 0 2.27-.77 2.65-1.91c.29-.86.43-1.69 1.43-1.69h10.26c1.03 0 1.18.96 1.43 1.69c.38 1.14 1.45 1.91 2.65 1.91 1.54 0 2.79-1.25 2.79-2.79v-.29c0-1.06-.6-2.02-1.54-2.49-.35-.18-.35-.68 0-.86z" />
          </svg>
        </div>

        {/* Rating count */}
        <p className="text-white/60 text-sm mb-4">
          Based on {ratingCount} {ratingCount === 1 ? "rating" : "ratings"}
        </p>

        {/* User's rating comparison */}
        <div
          className={`
            bg-white/10 rounded-full px-4 py-2
            transform transition-all duration-500 delay-300
            ${phase === "complete" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
          `}
        >
          <p className="text-white/90 text-sm">
            You rated:{" "}
            <span className="font-bold text-orange-400">
              {userRating.toFixed(1)}
            </span>
            <span className="text-white/60 ml-2">({differenceText})</span>
          </p>
        </div>

        {/* Click to continue hint */}
        <p
          className={`
            mt-6 text-white/40 text-xs
            transform transition-all duration-500 delay-500
            ${phase === "complete" ? "opacity-100" : "opacity-0"}
          `}
        >
          Tap anywhere to continue
        </p>
      </div>
    </div>
  );
}
