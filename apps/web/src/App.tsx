import { useState } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { RatePage } from "@/pages/RatePage";
import { UploadPage } from "@/pages/UploadPage";
import { LeaderboardPage } from "@/pages/LeaderboardPage";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

// Bone icon for branding - modern wide style
function BoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 19" fill="currentColor">
      <path d="M22.46 9.17c.94-.47 1.54-1.44 1.54-2.49v-.29C24 4.85 22.73 3.6 21.19 3.6c-1.2 0-2.27.77-2.65 1.91c-.29.86-.43 1.69-1.43 1.69H6.89c-1.03 0-1.18-.96-1.43-1.69C5.08 4.37 4 3.6 2.79 3.6 1.25 3.6 0 4.85 0 6.39v.29c0 1.06.6 2.02 1.54 2.49c.35.18.35.68 0 .86C.6 10.5 0 11.46 0 12.52v.29c0 1.54 1.25 2.79 2.79 2.79 1.2 0 2.27-.77 2.65-1.91c.29-.86.43-1.69 1.43-1.69h10.26c1.03 0 1.18.96 1.43 1.69c.38 1.14 1.45 1.91 2.65 1.91 1.54 0 2.79-1.25 2.79-2.79v-.29c0-1.06-.6-2.02-1.54-2.49-.35-.18-.35-.68 0-.86z" />
    </svg>
  );
}

function Nav() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { resolvedTheme } = useTheme();

  const navLinks = [
    { to: "/", label: "Rate", icon: "rate" },
    { to: "/leaderboard", label: "Leaderboard", icon: "trophy" },
    { to: "/upload", label: "Upload", icon: "upload" },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-lg border-b border-border">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <img
              src="/logo.svg"
              alt="RateTheDogs"
              className={cn(
                "w-9 h-9 transition-transform duration-200 group-hover:scale-110",
                resolvedTheme === "dark" && "invert"
              )}
            />
            <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent hidden sm:inline">
              RateTheDogs
            </span>
          </Link>

          {/* Desktop navigation */}
          <div className="hidden sm:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200",
                  isActive(link.to)
                    ? "bg-primary/20 text-primary shadow-lg shadow-primary/10"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
            <ThemeToggle className="ml-2" />
          </div>

          {/* Mobile: theme toggle and menu button */}
          <div className="flex items-center gap-1 sm:hidden">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6 text-muted-foreground"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                {mobileMenuOpen ? (
                  <path d="M18 6L6 18M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile navigation */}
        {mobileMenuOpen && (
          <div className="sm:hidden pt-3 pb-2 space-y-1 border-t mt-3 border-border">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-all duration-200",
                  isActive(link.to)
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {link.icon === "rate" && <BoneIcon className="w-5 h-5" />}
                {link.icon === "trophy" && (
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M8 21h8M12 17v4M7 4h10l-1 9H8L7 4zM12 4V2" />
                  </svg>
                )}
                {link.icon === "upload" && (
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                )}
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}

function AppContent() {
  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <Nav />
      <main className="pb-8">
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

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="text-center">
        <div className="text-6xl mb-4">
          <span role="img" aria-label="lost dog">
            🐕‍🦺
          </span>
        </div>
        <h1 className="text-4xl font-bold text-foreground">404</h1>
        <p className="mt-2 text-muted-foreground">
          Oops! This page ran away like a loose dog.
        </p>
        <Link
          to="/"
          className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2 rounded-lg font-medium hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg shadow-primary/25"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Go Home
        </Link>
      </div>
    </div>
  );
}

export default App;
