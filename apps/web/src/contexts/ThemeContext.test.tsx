import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { ThemeProvider, useTheme } from "./ThemeContext";

const STORAGE_KEY = "rtd-theme";

// Test component to access theme context
function TestComponent() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved-theme">{resolvedTheme}</span>
      <button onClick={() => setTheme("light")}>Set Light</button>
      <button onClick={() => setTheme("dark")}>Set Dark</button>
      <button onClick={() => setTheme("system")}>Set System</button>
    </div>
  );
}

describe("ThemeContext", () => {
  let matchMediaMock: ReturnType<typeof vi.fn>;
  let mediaQueryListeners: ((e: { matches: boolean }) => void)[];

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();

    // Remove any existing dark class
    document.documentElement.classList.remove("dark");

    // Track media query listeners
    mediaQueryListeners = [];

    // Mock matchMedia
    matchMediaMock = vi.fn().mockImplementation((query: string) => ({
      matches: query === "(prefers-color-scheme: dark)" ? false : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: (
        _event: string,
        callback: (e: { matches: boolean }) => void
      ) => {
        mediaQueryListeners.push(callback);
      },
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: matchMediaMock,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  describe("ThemeProvider", () => {
    it("provides default theme as system", () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId("theme")).toHaveTextContent("system");
    });

    it("uses light as default resolved theme when system prefers light", () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId("resolved-theme")).toHaveTextContent("light");
    });

    it("uses dark as resolved theme when system prefers dark", () => {
      matchMediaMock.mockImplementation((query: string) => ({
        matches: query === "(prefers-color-scheme: dark)",
        media: query,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId("resolved-theme")).toHaveTextContent("dark");
    });

    it("allows setting theme to light", async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await act(async () => {
        screen.getByText("Set Light").click();
      });

      expect(screen.getByTestId("theme")).toHaveTextContent("light");
      expect(screen.getByTestId("resolved-theme")).toHaveTextContent("light");
    });

    it("allows setting theme to dark", async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await act(async () => {
        screen.getByText("Set Dark").click();
      });

      expect(screen.getByTestId("theme")).toHaveTextContent("dark");
      expect(screen.getByTestId("resolved-theme")).toHaveTextContent("dark");
    });

    it("allows setting theme back to system", async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await act(async () => {
        screen.getByText("Set Dark").click();
      });

      await act(async () => {
        screen.getByText("Set System").click();
      });

      expect(screen.getByTestId("theme")).toHaveTextContent("system");
    });

    it("accepts a default theme prop", () => {
      render(
        <ThemeProvider defaultTheme="dark">
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId("theme")).toHaveTextContent("dark");
      expect(screen.getByTestId("resolved-theme")).toHaveTextContent("dark");
    });

    it("persists theme choice to localStorage", async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await act(async () => {
        screen.getByText("Set Dark").click();
      });

      expect(localStorage.getItem(STORAGE_KEY)).toBe("dark");
    });

    it("loads theme from localStorage on mount", () => {
      localStorage.setItem(STORAGE_KEY, "dark");

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId("theme")).toHaveTextContent("dark");
      expect(screen.getByTestId("resolved-theme")).toHaveTextContent("dark");
    });

    it("applies dark class to document when theme is dark", async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await act(async () => {
        screen.getByText("Set Dark").click();
      });

      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    it("removes dark class from document when theme is light", async () => {
      document.documentElement.classList.add("dark");

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await act(async () => {
        screen.getByText("Set Light").click();
      });

      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });

    it("responds to system theme changes when set to system", async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId("resolved-theme")).toHaveTextContent("light");

      // Simulate system theme change
      await act(async () => {
        mediaQueryListeners.forEach((listener) => {
          listener({ matches: true });
        });
      });

      expect(screen.getByTestId("resolved-theme")).toHaveTextContent("dark");
    });
  });

  describe("useTheme", () => {
    it("throws error when used outside ThemeProvider", () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(vi.fn());

      expect(() => render(<TestComponent />)).toThrow(
        "useTheme must be used within a ThemeProvider"
      );

      consoleSpy.mockRestore();
    });
  });
});
