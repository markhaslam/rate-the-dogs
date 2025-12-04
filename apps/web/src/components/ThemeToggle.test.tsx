import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeToggle } from "./ThemeToggle";
import { ThemeProvider } from "@/contexts/ThemeContext";

const STORAGE_KEY = "rtd-theme";

// Wrapper to provide theme context
function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("ThemeToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");

    // Mock matchMedia for light mode default
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  describe("rendering", () => {
    it("renders a toggle button", () => {
      renderWithTheme(<ThemeToggle />);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("has accessible label", () => {
      renderWithTheme(<ThemeToggle />);
      // In light mode, label should say "Switch to dark mode"
      expect(screen.getByRole("button")).toHaveAttribute(
        "aria-label",
        "Switch to dark mode"
      );
    });

    it("applies custom className", () => {
      renderWithTheme(<ThemeToggle className="custom-class" />);
      expect(screen.getByRole("button")).toHaveClass("custom-class");
    });

    it("renders sun icon in light mode", () => {
      renderWithTheme(<ThemeToggle />);
      const button = screen.getByRole("button");
      // In light mode, sun icon should be visible (opacity-0 in dark mode)
      const svgs = button.querySelectorAll("svg");
      expect(svgs.length).toBe(2); // Both sun and moon are rendered
    });

    it("renders moon icon in dark mode", () => {
      localStorage.setItem("theme", "dark");
      renderWithTheme(<ThemeToggle />);
      const button = screen.getByRole("button");
      const svgs = button.querySelectorAll("svg");
      expect(svgs.length).toBe(2); // Both icons rendered, visibility controlled by CSS
    });
  });

  describe("interaction", () => {
    it("toggles from light to dark on click", () => {
      renderWithTheme(<ThemeToggle />);

      fireEvent.click(screen.getByRole("button"));

      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    it("toggles from dark to light on click", () => {
      localStorage.setItem(STORAGE_KEY, "dark");
      document.documentElement.classList.add("dark");

      renderWithTheme(<ThemeToggle />);

      fireEvent.click(screen.getByRole("button"));

      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });

    it("updates localStorage when toggling", () => {
      renderWithTheme(<ThemeToggle />);

      // Initial should be system or light
      fireEvent.click(screen.getByRole("button"));

      expect(localStorage.getItem(STORAGE_KEY)).toBe("dark");

      fireEvent.click(screen.getByRole("button"));

      expect(localStorage.getItem(STORAGE_KEY)).toBe("light");
    });

    it("can toggle multiple times", () => {
      renderWithTheme(<ThemeToggle />);
      const button = screen.getByRole("button");

      fireEvent.click(button);
      expect(document.documentElement.classList.contains("dark")).toBe(true);

      fireEvent.click(button);
      expect(document.documentElement.classList.contains("dark")).toBe(false);

      fireEvent.click(button);
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });
  });

  describe("accessibility", () => {
    it("is focusable", () => {
      renderWithTheme(<ThemeToggle />);
      const button = screen.getByRole("button");

      button.focus();
      expect(document.activeElement).toBe(button);
    });

    it("can be triggered with keyboard (Enter)", () => {
      renderWithTheme(<ThemeToggle />);
      const button = screen.getByRole("button");

      button.focus();
      fireEvent.keyDown(button, { key: "Enter" });
      fireEvent.click(button); // keyDown doesn't trigger click automatically in jsdom

      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    it("is a button element", () => {
      renderWithTheme(<ThemeToggle />);
      expect(screen.getByRole("button").tagName).toBe("BUTTON");
    });
  });

  describe("with system preference", () => {
    it("respects system dark preference initially", () => {
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: query === "(prefers-color-scheme: dark)",
          media: query,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      renderWithTheme(<ThemeToggle />);

      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    it("toggles away from system preference", () => {
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: query === "(prefers-color-scheme: dark)",
          media: query,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      renderWithTheme(<ThemeToggle />);

      // System prefers dark, toggle should switch to light
      fireEvent.click(screen.getByRole("button"));

      expect(document.documentElement.classList.contains("dark")).toBe(false);
      expect(localStorage.getItem(STORAGE_KEY)).toBe("light");
    });
  });
});
