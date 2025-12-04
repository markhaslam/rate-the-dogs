import { useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

interface BoneRatingProps {
  value?: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const sizeConfig = {
  sm: { bone: "w-5 h-5", gap: "gap-0.5", text: "text-xs" },
  md: { bone: "w-8 h-8", gap: "gap-1", text: "text-sm" },
  lg: { bone: "w-12 h-12", gap: "gap-1.5", text: "text-base" },
};

// Labels for accessibility and UX (supports half values)
const ratingLabels: Record<number, string> = {
  0.5: "Poor",
  1: "Bad",
  1.5: "Meh",
  2: "Okay",
  2.5: "Decent",
  3: "Good",
  3.5: "Nice!",
  4: "Great",
  4.5: "Awesome!",
  5: "Pawfect!",
};

export function BoneRating({
  value = 0,
  onChange,
  readonly = false,
  size = "md",
  showLabel = true,
}: BoneRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const displayValue = hoverValue ?? value;
  const config = sizeConfig[size];

  // Calculate rating based on mouse position within the bone
  const getRatingFromPosition = useCallback(
    (boneIndex: number, clientX: number, element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      const relativeX = clientX - rect.left;
      const isLeftHalf = relativeX < rect.width / 2;
      return isLeftHalf ? boneIndex - 0.5 : boneIndex;
    },
    []
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>, boneIndex: number) => {
      if (!readonly && onChange) {
        const rating = getRatingFromPosition(
          boneIndex,
          e.clientX,
          e.currentTarget
        );
        onChange(rating);
      }
    },
    [readonly, onChange, getRatingFromPosition]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>, boneIndex: number) => {
      if (!readonly) {
        const rating = getRatingFromPosition(
          boneIndex,
          e.clientX,
          e.currentTarget
        );
        setHoverValue(rating);
        setIsInteracting(true);
      }
    },
    [readonly, getRatingFromPosition]
  );

  const handleMouseLeave = useCallback(() => {
    setHoverValue(null);
    setIsInteracting(false);
  }, []);

  // Touch support for mobile
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLButtonElement>, boneIndex: number) => {
      if (!readonly && e.touches[0]) {
        const rating = getRatingFromPosition(
          boneIndex,
          e.touches[0].clientX,
          e.currentTarget
        );
        setHoverValue(rating);
        setIsInteracting(true);
      }
    },
    [readonly, getRatingFromPosition]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLButtonElement>, boneIndex: number) => {
      if (!readonly && onChange && e.changedTouches[0]) {
        const rating = getRatingFromPosition(
          boneIndex,
          e.changedTouches[0].clientX,
          e.currentTarget
        );
        onChange(rating);
      }
      setHoverValue(null);
      setIsInteracting(false);
    },
    [readonly, onChange, getRatingFromPosition]
  );

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        ref={containerRef}
        className={cn("flex items-center", config.gap)}
        role="group"
        aria-label="Rating"
        onMouseLeave={handleMouseLeave}
      >
        {[1, 2, 3, 4, 5].map((boneIndex) => {
          const isFilled = displayValue >= boneIndex;
          const isHalf =
            displayValue >= boneIndex - 0.5 && displayValue < boneIndex;
          const isHovered =
            hoverValue !== null && boneIndex <= Math.ceil(hoverValue);
          const isHoveredHalf =
            hoverValue !== null &&
            boneIndex === Math.ceil(hoverValue) &&
            hoverValue % 1 !== 0;

          return (
            <button
              key={boneIndex}
              type="button"
              disabled={readonly}
              aria-label={`Rate ${boneIndex} out of 5`}
              aria-pressed={value >= boneIndex}
              className={cn(
                "relative transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm",
                !readonly && "cursor-pointer active:scale-90",
                readonly && "cursor-default",
                isInteracting && !readonly && "transform"
              )}
              style={{
                transform: isHovered && !readonly ? "scale(1.15)" : "scale(1)",
                filter:
                  (isFilled || isHalf) && !readonly
                    ? "drop-shadow(0 0 8px var(--glow-color))"
                    : "none",
                // @ts-expect-error CSS custom property
                "--glow-color": "rgba(249, 115, 22, 0.4)",
              }}
              onMouseMove={(e) => handleMouseMove(e, boneIndex)}
              onClick={(e) => handleClick(e, boneIndex)}
              onTouchStart={(e) => handleTouchStart(e, boneIndex)}
              onTouchEnd={(e) => handleTouchEnd(e, boneIndex)}
            >
              <svg
                className={cn(config.bone, "transition-all duration-200")}
                viewBox="0 0 24 19"
                aria-hidden="true"
              >
                <defs>
                  {/* Gradient for filled bone - orange */}
                  <linearGradient
                    id={`bone-filled-${boneIndex}`}
                    x1="0%"
                    y1="0%"
                    x2="0%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#ea580c" />
                  </linearGradient>
                  {/* Gradient for empty bone - theme aware */}
                  <linearGradient
                    id={`bone-empty-${boneIndex}`}
                    x1="0%"
                    y1="0%"
                    x2="0%"
                    y2="100%"
                  >
                    <stop
                      offset="0%"
                      className="[stop-color:var(--color-muted)]"
                      stopColor="var(--color-muted, #e5e7eb)"
                    />
                    <stop
                      offset="100%"
                      className="[stop-color:var(--color-border)]"
                      stopColor="var(--color-border, #d1d5db)"
                    />
                  </linearGradient>
                  {/* Gradient for hover bone */}
                  <linearGradient
                    id={`bone-hover-${boneIndex}`}
                    x1="0%"
                    y1="0%"
                    x2="0%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#fed7aa" />
                    <stop offset="100%" stopColor="#fdba74" />
                  </linearGradient>
                  {/* Half-fill gradient (left half filled) */}
                  <linearGradient
                    id={`bone-half-${boneIndex}`}
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop offset="50%" stopColor="#f97316" />
                    <stop
                      offset="50%"
                      stopColor="var(--color-muted, #e5e7eb)"
                    />
                  </linearGradient>
                  {/* Half-fill gradient for hover */}
                  <linearGradient
                    id={`bone-half-hover-${boneIndex}`}
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop offset="50%" stopColor="#fdba74" />
                    <stop
                      offset="50%"
                      stopColor="var(--color-muted, #e5e7eb)"
                    />
                  </linearGradient>
                </defs>
                {/* FontAwesome bone - wide modern style */}
                <path
                  d="M22.46 9.17c.94-.47 1.54-1.44 1.54-2.49v-.29C24 4.85 22.73 3.6 21.19 3.6c-1.2 0-2.27.77-2.65 1.91c-.29.86-.43 1.69-1.43 1.69H6.89c-1.03 0-1.18-.96-1.43-1.69C5.08 4.37 4 3.6 2.79 3.6 1.25 3.6 0 4.85 0 6.39v.29c0 1.06.6 2.02 1.54 2.49c.35.18.35.68 0 .86C.6 10.5 0 11.46 0 12.52v.29c0 1.54 1.25 2.79 2.79 2.79 1.2 0 2.27-.77 2.65-1.91c.29-.86.43-1.69 1.43-1.69h10.26c1.03 0 1.18.96 1.43 1.69c.38 1.14 1.45 1.91 2.65 1.91 1.54 0 2.79-1.25 2.79-2.79v-.29c0-1.06-.6-2.02-1.54-2.49-.35-.18-.35-.68 0-.86z"
                  fill={
                    isFilled
                      ? `url(#bone-filled-${boneIndex})`
                      : isHalf
                        ? `url(#bone-half-${boneIndex})`
                        : isHoveredHalf && !readonly
                          ? `url(#bone-half-hover-${boneIndex})`
                          : isHovered && !readonly
                            ? `url(#bone-hover-${boneIndex})`
                            : `url(#bone-empty-${boneIndex})`
                  }
                  stroke={
                    isFilled || isHalf
                      ? "#c2410c"
                      : isHovered && !readonly
                        ? "#fb923c"
                        : "var(--color-muted-foreground, #9ca3af)"
                  }
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              {/* Sparkle effect for filled bones */}
              {(isFilled || isHalf) && !readonly && (
                <span
                  className="absolute top-0 right-0 w-2 h-2 animate-ping"
                  style={{
                    background: "rgba(255, 255, 255, 0.6)",
                    borderRadius: "50%",
                    animationDuration: "2s",
                    animationIterationCount: "1",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Rating value and label display */}
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "font-bold tabular-nums transition-all duration-200",
            config.text,
            displayValue > 0 ? "text-primary" : "text-muted-foreground"
          )}
          style={{
            transform: isInteracting ? "scale(1.1)" : "scale(1)",
          }}
        >
          {displayValue.toFixed(1)}
        </span>
        {showLabel && displayValue > 0 && (
          <span
            className={cn(
              "font-medium text-muted-foreground transition-opacity duration-200",
              config.text,
              isInteracting ? "opacity-100" : "opacity-70"
            )}
          >
            {ratingLabels[displayValue] ?? ""}
          </span>
        )}
      </div>
    </div>
  );
}
