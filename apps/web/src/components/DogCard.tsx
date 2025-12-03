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

export function DogCard({ dog, onRate, onSkip, showRating = true, isRating = false }: DogCardProps) {
  return (
    <Card className="w-full max-w-md overflow-hidden">
      <div className="aspect-square relative bg-gray-100">
        <img
          src={dog.image_url}
          alt={dog.name || "A cute dog"}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://placedog.net/500/500?id=${dog.id}`;
          }}
        />
      </div>
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold">{dog.name || "Unnamed Pup"}</h2>
            <p className="text-gray-500">{dog.breed_name}</p>
          </div>
          {dog.avg_rating !== null && (
            <div className="text-right">
              <span className="text-2xl font-bold text-amber-500">{dog.avg_rating.toFixed(1)}</span>
              <p className="text-xs text-gray-400">{dog.rating_count} ratings</p>
            </div>
          )}
        </div>

        {showRating && onRate && (
          <div className="pt-2">
            <p className="text-sm text-gray-600 mb-2">Rate this good boy/girl:</p>
            <BoneRating onChange={onRate} size="lg" />
          </div>
        )}

        {onSkip && (
          <button
            onClick={onSkip}
            disabled={isRating}
            className="w-full mt-2 py-2 text-gray-500 hover:text-gray-700 text-sm"
          >
            Skip this dog
          </button>
        )}
      </CardContent>
    </Card>
  );
}
