import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BoneRating } from "@/components/BoneRating";

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
          const json = await res.json();
          if (json.success) setDogs(json.data.items);
        } else {
          const res = await fetch("/api/leaderboard/breeds?limit=20");
          const json = await res.json();
          if (json.success) setBreeds(json.data.items);
        }
      } catch (e) {
        console.error("Failed to fetch leaderboard:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tab]);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Leaderboard</h1>

      <div className="flex gap-2 mb-6 justify-center">
        <button
          onClick={() => setTab("dogs")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            tab === "dogs" ? "bg-amber-500 text-white" : "bg-gray-100 hover:bg-gray-200"
          }`}
        >
          Top Dogs
        </button>
        <button
          onClick={() => setTab("breeds")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            tab === "breeds" ? "bg-amber-500 text-white" : "bg-gray-100 hover:bg-gray-200"
          }`}
        >
          Top Breeds
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 animate-pulse">Loading...</div>
      ) : tab === "dogs" ? (
        <div className="space-y-3">
          {dogs.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No rated dogs yet!</p>
          ) : (
            dogs.map((dog, i) => (
              <Card key={dog.id} className="flex items-center p-3">
                <span className={`text-2xl font-bold w-10 ${i < 3 ? "text-amber-500" : "text-gray-400"}`}>
                  #{i + 1}
                </span>
                <img
                  src={dog.image_url}
                  alt={dog.name || "Dog"}
                  className="w-16 h-16 rounded-lg object-cover mx-3"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://placedog.net/100/100?id=${dog.id}`;
                  }}
                />
                <div className="flex-1">
                  <h3 className="font-semibold">{dog.name || "Unnamed"}</h3>
                  <p className="text-sm text-gray-500">{dog.breed_name}</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-amber-500">{dog.avg_rating.toFixed(1)}</span>
                  <p className="text-xs text-gray-400">{dog.rating_count} ratings</p>
                </div>
              </Card>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {breeds.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No rated breeds yet!</p>
          ) : (
            breeds.map((breed, i) => (
              <Card key={breed.id} className="flex items-center p-4">
                <span className={`text-2xl font-bold w-10 ${i < 3 ? "text-amber-500" : "text-gray-400"}`}>
                  #{i + 1}
                </span>
                <div className="flex-1 ml-3">
                  <h3 className="font-semibold">{breed.name}</h3>
                  <p className="text-sm text-gray-500">{breed.dog_count} dogs</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-amber-500">{breed.avg_rating.toFixed(1)}</span>
                  <p className="text-xs text-gray-400">{breed.rating_count} ratings</p>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
