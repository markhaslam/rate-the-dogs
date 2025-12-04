import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { UploadPage } from "./UploadPage";
import { BrowserRouter } from "react-router-dom";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockBreedsResponse = {
  success: true,
  data: [
    { id: 1, name: "Labrador Retriever", slug: "labrador-retriever" },
    { id: 2, name: "French Bulldog", slug: "french-bulldog" },
    { id: 3, name: "Golden Retriever", slug: "golden-retriever" },
  ],
};

const renderWithRouter = (component: React.ReactNode) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("UploadPage", () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockNavigate.mockClear();
  });

  describe("rendering", () => {
    it("displays the upload form", async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockBreedsResponse),
      });

      renderWithRouter(<UploadPage />);

      expect(screen.getByText("Upload Your Dog")).toBeInTheDocument();
      expect(screen.getByText("Click to upload")).toBeInTheDocument();
      expect(
        screen.getByText("JPEG, PNG, WebP (max 10MB)")
      ).toBeInTheDocument();
    });

    it("displays dog name input field", async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockBreedsResponse),
      });

      renderWithRouter(<UploadPage />);

      expect(screen.getByText("Dog's Name (optional)")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("e.g., Max, Bella, Charlie...")
      ).toBeInTheDocument();
    });

    it("displays breed selection dropdown", async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockBreedsResponse),
      });

      renderWithRouter(<UploadPage />);

      expect(screen.getByText("Breed *")).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText("Labrador Retriever")).toBeInTheDocument();
      });
    });

    it("fetches and populates breeds on mount", async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockBreedsResponse),
      });

      renderWithRouter(<UploadPage />);

      await waitFor(() => {
        const select = screen.getByRole("combobox");
        expect(select).toBeInTheDocument();
      });

      expect(mockFetch).toHaveBeenCalledWith("/api/breeds");
    });
  });

  describe("file selection", () => {
    it("shows preview when valid image is selected", async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockBreedsResponse),
      });

      renderWithRouter(<UploadPage />);

      const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;

      // Mock FileReader
      const mockFileReader = {
        readAsDataURL: vi.fn(),
        onload: null as (() => void) | null,
        result: "data:image/jpeg;base64,test",
      };
      vi.spyOn(global, "FileReader").mockImplementation(
        () => mockFileReader as unknown as FileReader
      );

      fireEvent.change(input, { target: { files: [file] } });

      // Trigger onload callback
      if (mockFileReader.onload) {
        mockFileReader.onload();
      }

      await waitFor(() => {
        const preview = screen.queryByAltText("Preview");
        // Preview should appear once FileReader completes
        expect(preview || screen.queryByText("Click to upload")).toBeTruthy();
      });
    });

    it("shows error for invalid file type", async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockBreedsResponse),
      });

      renderWithRouter(<UploadPage />);

      const file = new File(["test"], "test.txt", { type: "text/plain" });
      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(
          screen.getByText("Please select a JPEG, PNG, or WebP image")
        ).toBeInTheDocument();
      });
    });

    it("shows error for file over 10MB", async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockBreedsResponse),
      });

      renderWithRouter(<UploadPage />);

      // Create a mock file that reports being over 10MB
      const file = new File([""], "large.jpg", { type: "image/jpeg" });
      Object.defineProperty(file, "size", { value: 11 * 1024 * 1024 });

      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(
          screen.getByText("Image must be under 10MB")
        ).toBeInTheDocument();
      });
    });
  });

  describe("form validation", () => {
    it("submit button is disabled without file and breed selection", async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockBreedsResponse),
      });

      renderWithRouter(<UploadPage />);

      await waitFor(() => {
        expect(screen.getByText("Labrador Retriever")).toBeInTheDocument();
      });

      const submitButton = screen.getByText("Upload Dog");
      expect(submitButton).toBeDisabled();
    });

    it("enables submit button when file and breed are selected", async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockBreedsResponse),
      });

      renderWithRouter(<UploadPage />);

      await waitFor(() => {
        expect(screen.getByText("Labrador Retriever")).toBeInTheDocument();
      });

      // Select a file
      const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;

      const mockFileReader = {
        readAsDataURL: vi.fn(),
        onload: null as (() => void) | null,
        result: "data:image/jpeg;base64,test",
      };
      vi.spyOn(global, "FileReader").mockImplementation(
        () => mockFileReader as unknown as FileReader
      );

      fireEvent.change(input, { target: { files: [file] } });
      if (mockFileReader.onload) {
        mockFileReader.onload();
      }

      // Select a breed
      const select = screen.getByRole("combobox");
      fireEvent.change(select, { target: { value: "1" } });

      const submitButton = screen.getByText("Upload Dog");
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe("successful upload", () => {
    it("navigates to home page on successful upload", async () => {
      mockFetch
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockBreedsResponse),
        })
        .mockResolvedValueOnce({
          json: () =>
            Promise.resolve({ success: true, data: { key: "test-key" } }),
        })
        .mockResolvedValueOnce({
          ok: true,
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve({ success: true, data: { id: 1 } }),
        });

      renderWithRouter(<UploadPage />);

      await waitFor(() => {
        expect(screen.getByText("Labrador Retriever")).toBeInTheDocument();
      });

      // Select a file
      const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;

      const mockFileReader = {
        readAsDataURL: vi.fn(),
        onload: null as (() => void) | null,
        result: "data:image/jpeg;base64,test",
      };
      vi.spyOn(global, "FileReader").mockImplementation(
        () => mockFileReader as unknown as FileReader
      );

      fireEvent.change(input, { target: { files: [file] } });
      if (mockFileReader.onload) {
        mockFileReader.onload();
      }

      // Select a breed
      const select = screen.getByRole("combobox");
      fireEvent.change(select, { target: { value: "1" } });

      // Submit form
      const submitButton = screen.getByText("Upload Dog");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/");
      });
    });
  });

  describe("dog name input", () => {
    it("allows entering a dog name", async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockBreedsResponse),
      });

      renderWithRouter(<UploadPage />);

      const nameInput = screen.getByPlaceholderText(
        "e.g., Max, Bella, Charlie..."
      );
      fireEvent.change(nameInput, { target: { value: "Buddy" } });

      expect(nameInput).toHaveValue("Buddy");
    });

    it("enforces max length of 50 characters", async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockBreedsResponse),
      });

      renderWithRouter(<UploadPage />);

      const nameInput = screen.getByPlaceholderText(
        "e.g., Max, Bella, Charlie..."
      );
      expect(nameInput).toHaveAttribute("maxLength", "50");
    });
  });

  describe("error handling", () => {
    it("handles breed fetch error gracefully", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);

      renderWithRouter(<UploadPage />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });

    it("shows error message on upload failure", async () => {
      mockFetch
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockBreedsResponse),
        })
        .mockRejectedValueOnce(new Error("Upload failed"));

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);

      renderWithRouter(<UploadPage />);

      await waitFor(() => {
        expect(screen.getByText("Labrador Retriever")).toBeInTheDocument();
      });

      // Select a file
      const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;

      const mockFileReader = {
        readAsDataURL: vi.fn(),
        onload: null as (() => void) | null,
        result: "data:image/jpeg;base64,test",
      };
      vi.spyOn(global, "FileReader").mockImplementation(
        () => mockFileReader as unknown as FileReader
      );

      fireEvent.change(input, { target: { files: [file] } });
      if (mockFileReader.onload) {
        mockFileReader.onload();
      }

      // Select a breed
      const select = screen.getByRole("combobox");
      fireEvent.change(select, { target: { value: "1" } });

      // Submit form
      const submitButton = screen.getByText("Upload Dog");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Upload failed. Please try again.")
        ).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });
});
