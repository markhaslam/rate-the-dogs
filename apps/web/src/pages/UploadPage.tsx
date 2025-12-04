import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface Breed {
  id: number;
  name: string;
  slug: string;
}

interface BreedsResponse {
  success: boolean;
  data: Breed[];
}

interface UploadUrlResponse {
  success: boolean;
  data: { key: string };
}

interface CreateDogResponse {
  success: boolean;
  data: { id: number };
}

export function UploadPage() {
  const [breeds, setBreeds] = useState<Breed[]>([]);
  const [selectedBreed, setSelectedBreed] = useState<number | null>(null);
  const [dogName, setDogName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/breeds")
      .then((res) => res.json() as Promise<BreedsResponse>)
      .then((json) => {
        if (json.success) setBreeds(json.data);
      })
      .catch((e) => console.error("Failed to fetch breeds:", e));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
        setError("Please select a JPEG, PNG, or WebP image");
        return;
      }
      if (f.size > 10 * 1024 * 1024) {
        setError("Image must be under 10MB");
        return;
      }
      setFile(f);
      setError(null);
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(f);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !selectedBreed) {
      setError("Please select an image and breed");
      return;
    }

    setUploading(true);
    setError(null);

    const doUpload = async () => {
      // Get upload URL
      const urlRes = await fetch("/api/dogs/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: file.type }),
      });
      const urlJson = (await urlRes.json()) as UploadUrlResponse;
      if (!urlJson.success) throw new Error("Failed to get upload URL");

      const { key } = urlJson.data;

      // Upload image
      await fetch(`/api/dogs/upload/${key}`, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      // Create dog record
      const dogRes = await fetch("/api/dogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: dogName ?? null,
          imageKey: key,
          breedId: selectedBreed,
        }),
      });
      const dogJson = (await dogRes.json()) as CreateDogResponse;

      if (dogJson.success) {
        void navigate("/");
      } else {
        throw new Error("Failed to create dog");
      }
    };

    doUpload()
      .catch((err) => {
        setError("Upload failed. Please try again.");
        console.error(err);
      })
      .finally(() => setUploading(false));
  };

  return (
    <div className="max-w-md mx-auto py-8 px-4">
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-center text-white">
            Upload Your Dog
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Image Upload */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-orange-500 transition-colors bg-slate-900/50"
            >
              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="max-h-64 mx-auto rounded-lg"
                />
              ) : (
                <div className="text-slate-400">
                  <p className="text-lg">Click to upload</p>
                  <p className="text-sm">JPEG, PNG, WebP (max 10MB)</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Dog Name */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Dog&apos;s Name (optional)
              </label>
              <input
                type="text"
                value={dogName}
                onChange={(e) => setDogName(e.target.value)}
                maxLength={50}
                placeholder="e.g., Max, Bella, Charlie..."
                className="w-full px-3 py-2 border border-slate-600 rounded-lg bg-slate-900/50 text-white placeholder-slate-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* Breed Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Breed *
              </label>
              <select
                value={selectedBreed ?? ""}
                onChange={(e) => setSelectedBreed(parseInt(e.target.value))}
                required
                className="w-full px-3 py-2 border border-slate-600 rounded-lg bg-slate-900/50 text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="" className="text-slate-500">
                  Select a breed...
                </option>
                {breeds.map((breed) => (
                  <option
                    key={breed.id}
                    value={breed.id}
                    className="bg-slate-800 text-white"
                  >
                    {breed.name}
                  </option>
                ))}
              </select>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <Button
              type="submit"
              className="w-full"
              disabled={uploading || !file || !selectedBreed}
            >
              {uploading ? "Uploading..." : "Upload Dog"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
