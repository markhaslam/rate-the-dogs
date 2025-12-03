import { Routes, Route, Link } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { RatePage } from "@/pages/RatePage";
import { UploadPage } from "@/pages/UploadPage";
import { LeaderboardPage } from "@/pages/LeaderboardPage";

function Nav() {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-amber-600">
          RateTheDogs
        </Link>
        <div className="flex gap-4">
          <Link to="/" className="hover:text-amber-600">Rate</Link>
          <Link to="/leaderboard" className="hover:text-amber-600">Leaderboard</Link>
          <Link to="/upload" className="hover:text-amber-600">Upload</Link>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <main>
        <Routes>
          <Route path="/" element={<RatePage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Toaster />
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="mt-2 text-gray-600">Page not found</p>
        <Link to="/" className="mt-4 inline-block text-amber-600 hover:underline">
          Go home
        </Link>
      </div>
    </div>
  );
}

export default App;
