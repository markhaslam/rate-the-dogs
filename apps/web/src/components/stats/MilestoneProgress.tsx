import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MILESTONES } from "@rate-the-dogs/shared";

interface MilestoneProgressProps {
  current: number;
  nextMilestone: number | null;
  nextMilestoneName: string | null;
  progressPercent: number;
  completedMilestones: number[];
}

/**
 * Calculate the position percentage for a milestone on the progress bar
 * Uses a logarithmic-ish scale to better distribute milestones visually
 */
function getMilestonePosition(count: number): number {
  const maxMilestone = MILESTONES[MILESTONES.length - 1].count;
  // Linear position based on count
  return (count / maxMilestone) * 100;
}

/**
 * Progress bar showing progress to next milestone
 */
export function MilestoneProgress({
  current,
  nextMilestone,
  nextMilestoneName,
  progressPercent,
  completedMilestones,
}: MilestoneProgressProps) {
  const allCompleted = nextMilestone === null;

  return (
    <Card className="p-4 sm:p-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 gap-2">
        <h3 className="font-semibold text-foreground text-sm sm:text-base">
          Milestone Progress
        </h3>
        <span className="text-xs sm:text-sm font-medium text-primary whitespace-nowrap px-2 py-1 bg-primary/10 rounded-full">
          {current} ratings
        </span>
      </div>

      {/* Progress bar with milestone markers */}
      <div className="relative pt-6 pb-2">
        {/* Milestone markers - positioned absolutely above the bar */}
        <div className="absolute inset-x-0 top-0 h-6">
          {MILESTONES.map((milestone) => {
            const isCompleted = completedMilestones.includes(milestone.count);
            const isCurrent =
              nextMilestone !== null &&
              milestone.count === nextMilestone &&
              !isCompleted;
            const position = getMilestonePosition(milestone.count);

            return (
              <div
                key={milestone.count}
                className="absolute flex flex-col items-center"
                style={{
                  left: `${position}%`,
                  transform: "translateX(-50%)",
                }}
              >
                {/* Milestone circle */}
                <div
                  className={cn(
                    "w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-sm sm:text-base transition-all duration-300 shadow-sm",
                    isCompleted &&
                      "bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/50 dark:to-orange-900/50 ring-2 ring-amber-400/50",
                    isCurrent &&
                      "bg-primary/20 ring-2 ring-primary shadow-md shadow-primary/20",
                    !isCompleted &&
                      !isCurrent &&
                      "bg-muted/80 text-muted-foreground/60"
                  )}
                  title={`${milestone.name}: ${milestone.count} ratings`}
                >
                  {isCompleted ? (
                    <span className="drop-shadow-sm">{milestone.icon}</span>
                  ) : (
                    <span
                      className={cn(
                        "text-[10px] sm:text-xs font-medium",
                        isCurrent ? "text-primary" : "text-muted-foreground/70"
                      )}
                    >
                      {milestone.count}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress bar track */}
        <div className="h-2.5 sm:h-3 bg-muted/60 rounded-full overflow-hidden shadow-inner">
          {/* Progress fill */}
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700 ease-out relative",
              allCompleted
                ? "bg-gradient-to-r from-amber-400 via-orange-400 to-red-400"
                : "bg-gradient-to-r from-orange-400 to-amber-400"
            )}
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>
        </div>

        {/* Tick marks on the bar for each milestone */}
        <div className="absolute inset-x-0 top-6 h-2.5 sm:h-3 pointer-events-none">
          {MILESTONES.map((milestone) => {
            const position = getMilestonePosition(milestone.count);
            return (
              <div
                key={`tick-${milestone.count}`}
                className="absolute w-0.5 h-full bg-background/50"
                style={{
                  left: `${position}%`,
                  transform: "translateX(-50%)",
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Next milestone message */}
      <div className="mt-4 text-center px-2">
        {allCompleted ? (
          <p className="text-sm text-amber-600 dark:text-amber-400 font-medium flex items-center justify-center gap-1.5 flex-wrap">
            <span className="text-base">👑</span>
            <span>All milestones completed! You&apos;re a legend!</span>
          </p>
        ) : (
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            <span className="text-primary font-semibold">
              {(nextMilestone ?? 0) - current}
            </span>{" "}
            more to reach{" "}
            <span className="font-medium text-foreground">
              {nextMilestoneName}
            </span>
          </p>
        )}
      </div>
    </Card>
  );
}

/**
 * Skeleton loader for milestone progress
 */
export function MilestoneProgressSkeleton() {
  // Approximate positions for skeleton circles
  const positions = [0.2, 2, 10, 20, 50, 100];

  return (
    <Card className="p-4 sm:p-6 overflow-hidden">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="h-5 w-32 sm:w-36 bg-muted rounded animate-pulse" />
        <div className="h-6 w-20 bg-muted rounded-full animate-pulse" />
      </div>

      {/* Progress bar with markers skeleton */}
      <div className="relative pt-6 pb-2">
        {/* Milestone marker skeletons */}
        <div className="absolute inset-x-0 top-0 h-6">
          {positions.map((pos, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                left: `${pos}%`,
                transform: "translateX(-50%)",
              }}
            >
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-muted animate-pulse" />
            </div>
          ))}
        </div>

        {/* Progress bar skeleton */}
        <div className="h-2.5 sm:h-3 bg-muted rounded-full animate-pulse" />
      </div>

      {/* Message skeleton */}
      <div className="mt-4 flex justify-center">
        <div className="h-4 w-40 sm:w-48 bg-muted rounded animate-pulse" />
      </div>
    </Card>
  );
}
