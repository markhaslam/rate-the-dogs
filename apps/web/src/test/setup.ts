import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";
import { expect, afterEach, vi } from "vitest";

// Extend vitest's expect with jest-dom matchers
expect.extend(matchers);

// Mock pointer capture APIs for Radix UI components
// JSDOM doesn't implement these browser APIs
Element.prototype.hasPointerCapture = vi.fn().mockReturnValue(false);
Element.prototype.setPointerCapture = vi.fn();
Element.prototype.releasePointerCapture = vi.fn();

// Mock scrollIntoView for Radix UI select scroll behavior
Element.prototype.scrollIntoView = vi.fn();

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});
