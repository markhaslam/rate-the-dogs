import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";

// Pages (to be implemented)
// import RatePage from "@/pages/RatePage";
// import UploadPage from "@/pages/UploadPage";
// import LeaderboardPage from "@/pages/LeaderboardPage";
// import BreedsPage from "@/pages/BreedsPage";
// import BreedDetailPage from "@/pages/BreedDetailPage";
// import DogDetailPage from "@/pages/DogDetailPage";
// import MyRatingsPage from "@/pages/MyRatingsPage";
// import AdminPage from "@/pages/AdminPage";

function App() {
  return (
    <div className="min-h-screen bg-background">
      <main>
        <Routes>
          <Route path="/" element={<PlaceholderPage title="Rate Dogs" />} />
          <Route
            path="/upload"
            element={<PlaceholderPage title="Upload Dog" />}
          />
          <Route
            path="/leaderboard"
            element={<PlaceholderPage title="Leaderboard" />}
          />
          <Route
            path="/breeds"
            element={<PlaceholderPage title="Browse Breeds" />}
          />
          <Route
            path="/breeds/:slug"
            element={<PlaceholderPage title="Breed Details" />}
          />
          <Route
            path="/dogs/:id"
            element={<PlaceholderPage title="Dog Details" />}
          />
          <Route
            path="/my/ratings"
            element={<PlaceholderPage title="My Ratings" />}
          />
          <Route path="/admin" element={<PlaceholderPage title="Admin" />} />
          <Route path="*" element={<PlaceholderPage title="Not Found" />} />
        </Routes>
      </main>
      <Toaster />
    </div>
  );
}

// Temporary placeholder component
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground">{title}</h1>
        <p className="mt-4 text-muted-foreground">
          This page is under construction
        </p>
      </div>
    </div>
  );
}

export default App;
