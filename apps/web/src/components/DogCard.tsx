import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { BoneRating } from "./BoneRating";
import { RatingReveal } from "./RatingReveal";

interface Dog {
  id: number;
  name: string | null;
  image_url: string;
  breed_name: string;
  avg_rating: number | null;
  rating_count: number;
}

interface RevealedRating {
  avgRating: number;
  ratingCount: number;
  userRating: number;
}

interface DogCardProps {
  dog: Dog;
  onRate?: (value: number) => void;
  onSkip?: () => void;
  showRating?: boolean;
  isRating?: boolean;
  /** Rating reveal data - when set, shows the reveal animation overlay */
  revealedRating?: RevealedRating | null;
  /** Called when the reveal animation completes */
  onRevealComplete?: () => void;
  /** Image transition state for slide animations */
  imageTransition?: "idle" | "enter" | "exit";
  /** Previous dog's image URL for slide-over transition */
  previousImageUrl?: string | null;
}

export function DogCard({
  dog,
  onRate,
  onSkip,
  showRating = true,
  isRating = false,
  revealedRating,
  onRevealComplete,
  imageTransition = "idle",
  previousImageUrl,
}: DogCardProps) {
  const [imgError, setImgError] = useState(false);

  // During "enter" transition, new image slides in from the right to cover the old
  const isSliding = imageTransition === "enter" && previousImageUrl;

  return (
    <Card className="w-full max-w-md overflow-hidden bg-card shadow-xl shadow-black/10 dark:shadow-black/30 border-border">
      {/* Image container with modern styling */}
      <div className="aspect-square relative bg-muted overflow-hidden">
        {/* Previous image (shown underneath during slide transition) */}
        {isSliding && (
          <img
            src={previousImageUrl}
            alt="Previous dog"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Current image (slides in from right during transition) */}
        <img
          src={
            imgError
              ? `https://placedog.net/500/500?id=${dog.id}`
              : dog.image_url
          }
          alt={dog.name ?? "A cute dog"}
          className={`
            w-full h-full object-cover
            ${isSliding ? "absolute inset-0 transition-transform duration-300 ease-out animate-slide-in-right" : ""}
          `}
          onError={() => setImgError(true)}
          loading="lazy"
        />

        {/* Gradient overlay for better text contrast */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />

        {/* Breed tag overlay */}
        <div className="absolute bottom-3 left-3">
          <div className="bg-card/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-border">
            <p className="text-base font-semibold text-foreground">
              {dog.breed_name}
            </p>
          </div>
        </div>

        {/* Rating reveal animation overlay */}
        {revealedRating && (
          <RatingReveal
            rating={revealedRating.avgRating}
            ratingCount={revealedRating.ratingCount}
            userRating={revealedRating.userRating}
            onComplete={onRevealComplete}
          />
        )}
      </div>

      <CardContent className="p-5 space-y-4">
        {/* Interactive rating section */}
        {showRating && onRate && (
          <div className="pt-2 pb-1">
            <p className="text-center text-sm font-medium text-muted-foreground mb-3">
              How would you rate this good {dog.id % 2 === 0 ? "boy" : "girl"}?
            </p>
            <div className="flex justify-center">
              <BoneRating
                value={revealedRating?.userRating}
                onChange={revealedRating ? undefined : onRate}
                readonly={!!revealedRating}
                size="lg"
                showLabel
              />
            </div>
          </div>
        )}

        {/* Skip button */}
        {onSkip && (
          <button
            onClick={onSkip}
            disabled={isRating}
            className="w-full py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted text-sm font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="m5 12 7-7 7 7" />
              <path d="M12 19V5" />
            </svg>
            Skip this dog
          </button>
        )}
      </CardContent>
    </Card>
  );
}
