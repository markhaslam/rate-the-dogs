import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  value: string | number;
  label: string;
  icon?: string;
  subValue?: string;
  positive?: boolean;
  negative?: boolean;
  className?: string;
}

/**
 * Reusable stat card for displaying a single statistic
 */
export function StatCard({
  value,
  label,
  icon,
  subValue,
  positive,
  negative,
  className,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "p-4 flex flex-col items-center justify-center text-center bg-card/50 border-border/50",
        className
      )}
    >
      {icon && <span className="text-2xl mb-1">{icon}</span>}
      <span className="text-2xl font-bold text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground mt-1">{label}</span>
      {subValue && (
        <span
          className={cn(
            "text-xs mt-1 font-medium",
            positive && "text-green-500",
            negative && "text-red-500",
            !positive && !negative && "text-muted-foreground"
          )}
        >
          {subValue}
        </span>
      )}
    </Card>
  );
}

/**
 * Skeleton loader for stat card
 */
export function StatCardSkeleton() {
  return (
    <Card className="p-4 flex flex-col items-center justify-center bg-card/50 border-border/50">
      <div className="h-8 w-8 bg-muted rounded animate-pulse mb-1" />
      <div className="h-8 w-16 bg-muted rounded animate-pulse" />
      <div className="h-3 w-12 bg-muted rounded animate-pulse mt-2" />
    </Card>
  );
}
