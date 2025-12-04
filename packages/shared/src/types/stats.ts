/**
 * Stats page types and interfaces
 */

// ============================================================================
// Achievement Types
// ============================================================================

export interface AchievementDefinition {
  id: string;
  name: string;
  icon: string;
  description: string;
  criteria: string;
}

export interface AchievementStatus {
  id: string;
  name: string;
  icon: string;
  description: string;
  criteria: string;
  unlocked: boolean;
  unlockedAt: string | null;
}

// ============================================================================
// Personality Types
// ============================================================================

export interface PersonalityDefinition {
  id: string;
  name: string;
  icon: string;
  tagline: string;
  color: string;
  minAvg?: number;
  maxAvg?: number;
  minRatings?: number;
}

export interface UserPersonality {
  id: string;
  name: string;
  icon: string;
  tagline: string;
  color: string;
  isTopDog: boolean; // Bonus badge for 100+ ratings
}

// ============================================================================
// Milestone Types
// ============================================================================

export interface MilestoneDefinition {
  count: number;
  icon: string;
  name: string;
  message: string;
}

export interface MilestoneProgress {
  current: number;
  nextMilestone: number | null;
  nextMilestoneName: string | null;
  progressPercent: number;
  completedMilestones: number[];
}

// ============================================================================
// API Response Types
// ============================================================================

export interface EnhancedStatsResponse {
  ratingsCount: number;
  skipsCount: number;
  avgRatingGiven: number | null;
  firstRatingAt: string | null;
  lastRatingAt: string | null;
  globalAvgRating: number | null;
  ratingDiffFromGlobal: number | null;
}

export interface TopBreed {
  id: number;
  name: string;
  slug: string;
  avgRating: number;
  ratingCount: number;
  imageUrl: string | null;
}

export interface TopBreedsResponse {
  items: TopBreed[];
  totalBreedsRated: number;
}

export interface RatingDistributionResponse {
  distribution: Record<string, number>;
  modeRating: number | null;
  totalRatings: number;
}

export interface RecentRating {
  dogId: number;
  dogName: string | null;
  breedName: string;
  breedSlug: string;
  imageUrl: string | null;
  rating: number;
  ratedAt: string;
}

export interface RecentRatingsResponse {
  items: RecentRating[];
}

export interface AchievementsResponse {
  milestones: MilestoneProgress;
  achievements: AchievementStatus[];
  unlockedCount: number;
  totalAchievements: number;
}
