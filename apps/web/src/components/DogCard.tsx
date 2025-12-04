import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { BoneRating } from "./BoneRating";

interface Dog {
  id: number;
  name: string | null;
  image_url: string;
  breed_name: string;
  avg_rating: number | null;
  rating_count: number;
}

interface DogCardProps {
  dog: Dog;
  onRate?: (value: number) => void;
  onSkip?: () => void;
  showRating?: boolean;
  isRating?: boolean;
}

export function DogCard({
  dog,
  onRate,
  onSkip,
  showRating = true,
  isRating = false,
}: DogCardProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <Card className="w-full max-w-md overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 shadow-xl shadow-black/30 border-slate-700/50">
      {/* Image container with modern styling */}
      <div className="aspect-square relative bg-gradient-to-br from-slate-700 to-slate-800 overflow-hidden">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <pattern
              id="paws"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="5" cy="5" r="2" fill="currentColor" />
              <circle cx="15" cy="15" r="2" fill="currentColor" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#paws)" />
          </svg>
        </div>

        <img
          src={
            imgError
              ? `https://placedog.net/500/500?id=${dog.id}`
              : dog.image_url
          }
          alt={dog.name ?? "A cute dog"}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          onError={() => setImgError(true)}
          loading="lazy"
        />

        {/* Gradient overlay for better text contrast */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />

        {/* Rating badge overlay */}
        {dog.avg_rating !== null && (
          <div className="absolute bottom-3 right-3 bg-slate-900/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg border border-slate-700/50">
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold text-orange-500">
                {dog.avg_rating.toFixed(1)}
              </span>
              <svg
                className="w-5 h-5 text-orange-500"
                viewBox="0 0 24 19"
                fill="currentColor"
              >
                <path d="M22.46 9.17c.94-.47 1.54-1.44 1.54-2.49v-.29C24 4.85 22.73 3.6 21.19 3.6c-1.2 0-2.27.77-2.65 1.91c-.29.86-.43 1.69-1.43 1.69H6.89c-1.03 0-1.18-.96-1.43-1.69C5.08 4.37 4 3.6 2.79 3.6 1.25 3.6 0 4.85 0 6.39v.29c0 1.06.6 2.02 1.54 2.49c.35.18.35.68 0 .86C.6 10.5 0 11.46 0 12.52v.29c0 1.54 1.25 2.79 2.79 2.79 1.2 0 2.27-.77 2.65-1.91c.29-.86.43-1.69 1.43-1.69h10.26c1.03 0 1.18.96 1.43 1.69c.38 1.14 1.45 1.91 2.65 1.91 1.54 0 2.79-1.25 2.79-2.79v-.29c0-1.06-.6-2.02-1.54-2.49-.35-.18-.35-.68 0-.86z" />
              </svg>
            </div>
          </div>
        )}

        {/* Name tag overlay */}
        <div className="absolute bottom-3 left-3">
          <div className="bg-slate-900/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-slate-700/50">
            <h2 className="text-lg font-bold text-white">
              {dog.name ?? "Unnamed Pup"}
            </h2>
            <p className="text-sm text-slate-300 flex items-center gap-1">
              <svg
                className="w-3 h-3"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {dog.breed_name}
            </p>
          </div>
        </div>
      </div>

      <CardContent className="p-5 space-y-4">
        {/* Stats row */}
        {dog.avg_rating !== null && (
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 bg-slate-700/50 rounded-full px-4 py-2">
              <svg
                className="w-4 h-4 text-slate-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span className="text-sm font-medium text-slate-300">
                {dog.rating_count}{" "}
                {dog.rating_count === 1 ? "rating" : "ratings"}
              </span>
            </div>
          </div>
        )}

        {/* Interactive rating section */}
        {showRating && onRate && (
          <div className="pt-2 pb-1">
            <p className="text-center text-sm font-medium text-slate-400 mb-3">
              How would you rate this good{" "}
              {Math.random() > 0.5 ? "boy" : "girl"}?
            </p>
            <div className="flex justify-center">
              <BoneRating onChange={onRate} size="lg" showLabel />
            </div>
          </div>
        )}

        {/* Skip button */}
        {onSkip && (
          <button
            onClick={onSkip}
            disabled={isRating}
            className="w-full py-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
