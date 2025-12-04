import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AchievementStatus } from "@rate-the-dogs/shared";

interface AchievementsBadgesProps {
  achievements: AchievementStatus[];
  unlockedCount: number;
  totalAchievements: number;
}

/**
 * Grid of achievement badges
 */
export function AchievementsBadges({
  achievements,
  unlockedCount,
  totalAchievements,
}: AchievementsBadgesProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Achievements</h3>
        <span className="text-sm text-muted-foreground">
          {unlockedCount}/{totalAchievements} unlocked
        </span>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className="group relative"
            title={
              achievement.unlocked
                ? `${achievement.name}: ${achievement.description}`
                : `Locked: ${achievement.criteria}`
            }
          >
            {/* Badge */}
            <div
              className={cn(
                "aspect-square rounded-xl flex items-center justify-center text-2xl sm:text-3xl transition-all duration-200",
                achievement.unlocked
                  ? "bg-gradient-to-br from-primary/20 to-amber-500/20 hover:scale-110 cursor-help"
                  : "bg-muted/50 grayscale opacity-50 cursor-help"
              )}
            >
              {achievement.unlocked ? (
                achievement.icon
              ) : (
                <span className="text-lg">🔒</span>
              )}
            </div>

            {/* Tooltip on hover (desktop) */}
            <div className="hidden sm:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 w-48">
              <p className="font-medium text-sm">{achievement.name}</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                {achievement.unlocked
                  ? achievement.description
                  : achievement.criteria}
              </p>
              {/* Arrow */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-white dark:border-t-zinc-800" />
            </div>
          </div>
        ))}
      </div>

      {/* Achievement descriptions (mobile-friendly) */}
      <div className="mt-4 sm:hidden space-y-2">
        {achievements
          .filter((a) => a.unlocked)
          .map((achievement) => (
            <div
              key={achievement.id}
              className="flex items-center gap-2 text-sm"
            >
              <span>{achievement.icon}</span>
              <span className="font-medium">{achievement.name}</span>
            </div>
          ))}
        {unlockedCount === 0 && (
          <p className="text-sm text-muted-foreground text-center">
            Keep rating to unlock achievements!
          </p>
        )}
      </div>
    </Card>
  );
}

/**
 * Skeleton loader for achievements
 */
export function AchievementsBadgesSkeleton() {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="h-5 w-28 bg-muted rounded animate-pulse" />
        <div className="h-4 w-20 bg-muted rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div
            key={i}
            className="aspect-square rounded-xl bg-muted animate-pulse"
          />
        ))}
      </div>
    </Card>
  );
}
