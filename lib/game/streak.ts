export interface StreakThreshold {
  minStreak: number;
  multiplier: number;
  label: string;
  badgeColor: string;
}

export const STREAK_THRESHOLDS: StreakThreshold[] = [
  { minStreak: 10, multiplier: 2.0, label: "GODLIKE", badgeColor: "text-rose-400 border-rose-500/50 bg-rose-500/10 shadow-rose-500/20" },
  { minStreak: 5, multiplier: 1.5, label: "ON FIRE", badgeColor: "text-amber-400 border-amber-500/50 bg-amber-500/10 shadow-amber-500/20" },
  { minStreak: 4, multiplier: 1.3, label: "HOT", badgeColor: "text-orange-400 border-orange-500/40 bg-orange-500/10" },
  { minStreak: 3, multiplier: 1.2, label: "WARMING UP", badgeColor: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10" },
  { minStreak: 2, multiplier: 1.1, label: "STREAK", badgeColor: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10" },
  { minStreak: 1, multiplier: 1.0, label: "", badgeColor: "text-slate-300 border-slate-700 bg-slate-800/40" },
  { minStreak: 0, multiplier: 1.0, label: "", badgeColor: "text-slate-500 border-slate-800 bg-slate-900/40" },
];

/**
 * Returns the multiplier based on the current streak count.
 */
export function getStreakMultiplier(streak: number): number {
  for (const tier of STREAK_THRESHOLDS) {
    if (streak >= tier.minStreak) {
      return tier.multiplier;
    }
  }
  return 1.0;
}

/**
 * Returns streak visual information and status tier.
 */
export function getStreakTier(streak: number): StreakThreshold {
  for (const tier of STREAK_THRESHOLDS) {
    if (streak >= tier.minStreak) {
      return tier;
    }
  }
  return STREAK_THRESHOLDS[STREAK_THRESHOLDS.length - 1];
}

/**
 * Updates streak based on whether the answer was correct (exact match or very close e.g. < 500km).
 * Default rule: exact country match advances streak, or within 400km buffer.
 */
export function calculateNextStreak(
  currentStreak: number,
  isExact: boolean,
  distanceKm: number = 0
): number {
  // Exact match or adjacent proximity (< 350km) maintains/increments streak
  if (isExact || distanceKm < 350) {
    return currentStreak + 1;
  }
  return 0;
}
