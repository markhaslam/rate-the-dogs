import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BoneRating } from "./BoneRating";

describe("BoneRating", () => {
  describe("rendering", () => {
    it("renders 5 bone buttons", () => {
      render(<BoneRating />);
      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(5);
    });

    it("displays the current value", () => {
      render(<BoneRating value={3.5} />);
      expect(screen.getByText("3.5")).toBeInTheDocument();
    });

    it("displays 0.0 when no value provided", () => {
      render(<BoneRating />);
      expect(screen.getByText("0.0")).toBeInTheDocument();
    });

    it("displays value with one decimal place", () => {
      render(<BoneRating value={4} />);
      expect(screen.getByText("4.0")).toBeInTheDocument();
    });

    it("shows rating label for whole values", () => {
      render(<BoneRating value={5} showLabel />);
      expect(screen.getByText("Pawfect!")).toBeInTheDocument();
    });

    it("shows rating label for half values", () => {
      render(<BoneRating value={2.5} showLabel />);
      expect(screen.getByText("Decent")).toBeInTheDocument();
    });
  });

  describe("interaction", () => {
    it("calls onChange with full rating when right side of bone is clicked", () => {
      const onChange = vi.fn();
      render(<BoneRating onChange={onChange} />);

      const buttons = screen.getAllByRole("button");
      const button = buttons[2]; // Third bone (rating 3)

      // Mock getBoundingClientRect for the button
      vi.spyOn(button, "getBoundingClientRect").mockReturnValue({
        left: 0,
        right: 48,
        width: 48,
        top: 0,
        bottom: 48,
        height: 48,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      // Click on right side of bone (full rating)
      fireEvent.click(button, { clientX: 36 });

      expect(onChange).toHaveBeenCalledWith(3);
    });

    it("calls onChange with half rating when left side of bone is clicked", () => {
      const onChange = vi.fn();
      render(<BoneRating onChange={onChange} />);

      const buttons = screen.getAllByRole("button");
      const button = buttons[2]; // Third bone

      vi.spyOn(button, "getBoundingClientRect").mockReturnValue({
        left: 0,
        right: 48,
        width: 48,
        top: 0,
        bottom: 48,
        height: 48,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      // Click on left side of bone (half rating)
      fireEvent.click(button, { clientX: 12 });

      expect(onChange).toHaveBeenCalledWith(2.5);
    });

    it("does not call onChange in readonly mode", () => {
      const onChange = vi.fn();
      render(<BoneRating onChange={onChange} readonly />);

      const buttons = screen.getAllByRole("button");
      fireEvent.click(buttons[2], { clientX: 36 });

      expect(onChange).not.toHaveBeenCalled();
    });

    it("disables buttons in readonly mode", () => {
      render(<BoneRating readonly />);

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });

    it("updates display on mouse move", () => {
      render(<BoneRating value={2} />);

      const buttons = screen.getAllByRole("button");
      const button = buttons[4]; // 5th bone

      vi.spyOn(button, "getBoundingClientRect").mockReturnValue({
        left: 0,
        right: 48,
        width: 48,
        top: 0,
        bottom: 48,
        height: 48,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      // Move mouse to right side of 5th bone
      fireEvent.mouseMove(button, { clientX: 36 });

      expect(screen.getByText("5.0")).toBeInTheDocument();
    });

    it("shows half-value on mouse move to left side", () => {
      render(<BoneRating value={2} />);

      const buttons = screen.getAllByRole("button");
      const button = buttons[4]; // 5th bone

      vi.spyOn(button, "getBoundingClientRect").mockReturnValue({
        left: 0,
        right: 48,
        width: 48,
        top: 0,
        bottom: 48,
        height: 48,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      // Move mouse to left side of 5th bone
      fireEvent.mouseMove(button, { clientX: 12 });

      expect(screen.getByText("4.5")).toBeInTheDocument();
    });

    it("resets display on mouse leave from container", () => {
      render(<BoneRating value={2} />);

      const container = screen.getByRole("group");
      const buttons = screen.getAllByRole("button");

      vi.spyOn(buttons[4], "getBoundingClientRect").mockReturnValue({
        left: 0,
        right: 48,
        width: 48,
        top: 0,
        bottom: 48,
        height: 48,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      fireEvent.mouseMove(buttons[4], { clientX: 36 });
      fireEvent.mouseLeave(container);

      expect(screen.getByText("2.0")).toBeInTheDocument();
    });

    it("does not show hover effect in readonly mode", () => {
      render(<BoneRating value={2} readonly />);

      const buttons = screen.getAllByRole("button");
      fireEvent.mouseMove(buttons[4], { clientX: 36 });

      // Should still show original value
      expect(screen.getByText("2.0")).toBeInTheDocument();
    });
  });

  describe("sizes", () => {
    it("renders with small size", () => {
      render(<BoneRating size="sm" />);
      expect(screen.getAllByRole("button")).toHaveLength(5);
    });

    it("renders with medium size (default)", () => {
      render(<BoneRating size="md" />);
      expect(screen.getAllByRole("button")).toHaveLength(5);
    });

    it("renders with large size", () => {
      render(<BoneRating size="lg" />);
      expect(screen.getAllByRole("button")).toHaveLength(5);
    });
  });

  describe("half-rating support", () => {
    it("handles value at 0.5", () => {
      render(<BoneRating value={0.5} />);
      expect(screen.getByText("0.5")).toBeInTheDocument();
      expect(screen.getByText("Poor")).toBeInTheDocument();
    });

    it("handles value at 1.5", () => {
      render(<BoneRating value={1.5} />);
      expect(screen.getByText("1.5")).toBeInTheDocument();
      expect(screen.getByText("Meh")).toBeInTheDocument();
    });

    it("handles value at 2.5", () => {
      render(<BoneRating value={2.5} />);
      expect(screen.getByText("2.5")).toBeInTheDocument();
      expect(screen.getByText("Decent")).toBeInTheDocument();
    });

    it("handles value at 3.5", () => {
      render(<BoneRating value={3.5} />);
      expect(screen.getByText("3.5")).toBeInTheDocument();
      expect(screen.getByText("Nice!")).toBeInTheDocument();
    });

    it("handles value at 4.5", () => {
      render(<BoneRating value={4.5} />);
      expect(screen.getByText("4.5")).toBeInTheDocument();
      expect(screen.getByText("Awesome!")).toBeInTheDocument();
    });

    it("handles value at maximum (5.0)", () => {
      render(<BoneRating value={5} />);
      expect(screen.getByText("5.0")).toBeInTheDocument();
      expect(screen.getByText("Pawfect!")).toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("handles missing onChange gracefully", () => {
      render(<BoneRating />);

      const buttons = screen.getAllByRole("button");
      // Should not throw when clicked without onChange
      expect(() => fireEvent.click(buttons[0])).not.toThrow();
    });

    it("handles touch events for mobile", () => {
      const onChange = vi.fn();
      render(<BoneRating onChange={onChange} />);

      const buttons = screen.getAllByRole("button");
      const button = buttons[2]; // Third bone

      vi.spyOn(button, "getBoundingClientRect").mockReturnValue({
        left: 0,
        right: 48,
        width: 48,
        top: 0,
        bottom: 48,
        height: 48,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      // Simulate touch end on right side
      fireEvent.touchEnd(button, {
        changedTouches: [{ clientX: 36 }],
      });

      expect(onChange).toHaveBeenCalledWith(3);
    });

    it("handles touch events for half rating", () => {
      const onChange = vi.fn();
      render(<BoneRating onChange={onChange} />);

      const buttons = screen.getAllByRole("button");
      const button = buttons[2]; // Third bone

      vi.spyOn(button, "getBoundingClientRect").mockReturnValue({
        left: 0,
        right: 48,
        width: 48,
        top: 0,
        bottom: 48,
        height: 48,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      // Simulate touch end on left side
      fireEvent.touchEnd(button, {
        changedTouches: [{ clientX: 12 }],
      });

      expect(onChange).toHaveBeenCalledWith(2.5);
    });
  });
});
