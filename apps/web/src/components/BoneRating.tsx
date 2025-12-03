import { useState } from "react";
import { cn } from "@/lib/utils";

interface BoneRatingProps {
  value?: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "w-6 h-6",
  md: "w-8 h-8",
  lg: "w-10 h-10",
};

export function BoneRating({ value = 0, onChange, readonly = false, size = "md" }: BoneRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const displayValue = hoverValue ?? value;

  const handleClick = (rating: number) => {
    if (!readonly && onChange) {
      onChange(rating);
    }
  };

  return (
    <div className="flex gap-1 items-center">
      {[1, 2, 3, 4, 5].map((bone) => {
        const filled = displayValue >= bone;
        const half = displayValue >= bone - 0.5 && displayValue < bone;

        return (
          <button
            key={bone}
            type="button"
            disabled={readonly}
            className={cn(
              "relative transition-transform",
              !readonly && "hover:scale-110 cursor-pointer",
              readonly && "cursor-default"
            )}
            onMouseEnter={() => !readonly && setHoverValue(bone)}
            onMouseLeave={() => setHoverValue(null)}
            onClick={() => handleClick(bone)}
          >
            <svg
              className={cn(sizes[size], "transition-colors")}
              viewBox="0 0 24 24"
              fill={filled ? "#f59e0b" : half ? "url(#half)" : "#e5e7eb"}
              stroke={filled || half ? "#d97706" : "#9ca3af"}
              strokeWidth="1"
            >
              <defs>
                <linearGradient id="half">
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="50%" stopColor="#e5e7eb" />
                </linearGradient>
              </defs>
              {/* Bone shape */}
              <path d="M4 8a2 2 0 1 1 0-4 2 2 0 0 1 4 0v1h8V4a2 2 0 1 1 4 0 2 2 0 0 1-4 4h-1v8h1a2 2 0 1 1 0 4 2 2 0 0 1-4-4v-1H8v1a2 2 0 1 1-4 0 2 2 0 0 1 4-4h1V8H8z" />
            </svg>
          </button>
        );
      })}
      <span className="ml-2 text-lg font-semibold text-amber-600">
        {displayValue.toFixed(1)}
      </span>
    </div>
  );
}
