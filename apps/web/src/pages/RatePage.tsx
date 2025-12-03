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

export function RatePage() {
  const [dog, setDog] = useState<Dog | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRating, setIsRating] = useState(false);
  const [noDogs, setNoDogs] = useState(false);

  const fetchNextDog = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dogs/next");
      const json = await res.json();
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
    fetchNextDog();
  }, []);

  const handleRate = async (value: number) => {
    if (!dog || isRating) return;
    setIsRating(true);
    try {
      await fetch(`/api/dogs/${dog.id}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      fetchNextDog();
    } catch (e) {
      console.error("Failed to rate:", e);
    } finally {
      setIsRating(false);
    }
  };

  const handleSkip = async () => {
    if (!dog || isRating) return;
    setIsRating(true);
    try {
      await fetch(`/api/dogs/${dog.id}/skip`, { method: "POST" });
      fetchNextDog();
    } catch (e) {
      console.error("Failed to skip:", e);
    } finally {
      setIsRating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-xl">Loading good dogs...</div>
      </div>
    );
  }

  if (noDogs) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h2 className="text-2xl font-bold mb-4">You've rated all the dogs!</h2>
        <p className="text-gray-600 mb-6">Check back later for more pups, or add your own!</p>
        <div className="flex gap-4">
          <Link to="/upload">
            <Button>Upload a Dog</Button>
          </Link>
          <Link to="/leaderboard">
            <Button variant="outline">View Leaderboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Rate This Dog!</h1>
      {dog && (
        <DogCard
          dog={dog}
          onRate={handleRate}
          onSkip={handleSkip}
          isRating={isRating}
        />
      )}
    </div>
  );
}
