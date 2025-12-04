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
    <Card className="p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-foreground">Milestone Progress</h3>
        <span className="text-sm font-medium text-primary">
          {current} ratings
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative">
        {/* Bar background */}
        <div className="h-4 bg-muted rounded-full overflow-hidden">
          {/* Fill */}
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700 ease-out",
              allCompleted
                ? "bg-gradient-to-r from-amber-400 via-orange-400 to-red-500"
                : "bg-gradient-to-r from-primary to-amber-500"
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Milestone markers */}
        <div className="flex justify-between mt-3">
          {MILESTONES.map((milestone, index) => {
            const isCompleted = completedMilestones.includes(milestone.count);
            const isCurrent =
              nextMilestone !== null &&
              milestone.count === nextMilestone &&
              !isCompleted;

            return (
              <div
                key={milestone.count}
                className="flex flex-col items-center"
                style={{
                  // Position based on milestone count relative to max
                  marginLeft:
                    index === 0
                      ? 0
                      : `${((milestone.count - MILESTONES[index - 1].count) / MILESTONES[MILESTONES.length - 1].count) * 100 - 8}%`,
                }}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-lg transition-all duration-300",
                    isCompleted && "bg-primary/20 scale-100",
                    isCurrent && "bg-muted ring-2 ring-primary animate-pulse",
                    !isCompleted && !isCurrent && "bg-muted/50 opacity-50"
                  )}
                  title={`${milestone.name}: ${milestone.count} ratings`}
                >
                  {isCompleted ? (
                    milestone.icon
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {milestone.count}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Next milestone message */}
      <div className="mt-4 text-center">
        {allCompleted ? (
          <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
            <span className="text-lg mr-1">👑</span>
            All milestones completed! You&apos;re a legend!
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            <span className="text-primary font-medium">
              {(nextMilestone ?? 0) - current}
            </span>{" "}
            more to reach{" "}
            <span className="font-medium text-foreground">
              {nextMilestoneName}
            </span>
            !
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
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-2">
        <div className="h-5 w-36 bg-muted rounded animate-pulse" />
        <div className="h-4 w-20 bg-muted rounded animate-pulse" />
      </div>
      <div className="h-4 bg-muted rounded-full animate-pulse" />
      <div className="flex justify-between mt-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="w-8 h-8 rounded-full bg-muted animate-pulse"
          />
        ))}
      </div>
      <div className="h-4 w-48 mx-auto bg-muted rounded animate-pulse mt-4" />
    </Card>
  );
}
