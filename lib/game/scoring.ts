import { haversineDistanceKm } from "@/lib/geo/distance";
import { CountryMetadata } from "@/lib/geo/countries";

export interface ScoringConfig {
  maxBaseScore: number;
  maxTimeBonus: number;
  distanceDecayFactor: number;
  roundDurationSeconds: number;
}

export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  maxBaseScore: 1000,
  maxTimeBonus: 250,
  distanceDecayFactor: 2400, // Distance in km where score drops to ~37% of max
  roundDurationSeconds: 20,
};

export interface ScoreCalculationResult {
  distanceKm: number;
  baseScore: number;
  timeBonus: number;
  multiplier: number;
  totalScore: number;
  isExact: boolean;
}

/**
 * Calculates the base score earned from distance alone.
 */
export function calculateBaseScore(
  distanceKm: number,
  isExact: boolean,
  config: ScoringConfig = DEFAULT_SCORING_CONFIG
): number {
  if (isExact || distanceKm === 0) {
    return config.maxBaseScore;
  }

  // Smooth exponential decay curve
  const rawScore = config.maxBaseScore * Math.exp(-distanceKm / config.distanceDecayFactor);
  return Math.max(0, Math.round(rawScore));
}

/**
 * Calculates the time bonus earned.
 * Scaled by accuracy so guessing blindly in 1 second doesn't reward wrong answers.
 */
export function calculateTimeBonus(
  responseTimeSeconds: number,
  baseScore: number,
  config: ScoringConfig = DEFAULT_SCORING_CONFIG
): number {
  if (responseTimeSeconds >= config.roundDurationSeconds || baseScore <= 100) {
    return 0;
  }

  const remainingRatio = Math.max(
    0,
    (config.roundDurationSeconds - responseTimeSeconds) / config.roundDurationSeconds
  );

  const rawTimeBonus = config.maxTimeBonus * remainingRatio;
  const accuracyFactor = baseScore / config.maxBaseScore;

  return Math.round(rawTimeBonus * accuracyFactor);
}

/**
 * Computes complete round score given actual country, guessed country, response time, and streak multiplier.
 */
export function calculateRoundScore(
  actualCountry: CountryMetadata,
  guessedCountry: CountryMetadata | null,
  responseTimeSeconds: number,
  streakMultiplier: number = 1.0,
  config: ScoringConfig = DEFAULT_SCORING_CONFIG
): ScoreCalculationResult {
  if (!guessedCountry) {
    return {
      distanceKm: 20000,
      baseScore: 0,
      timeBonus: 0,
      multiplier: 1.0,
      totalScore: 0,
      isExact: false,
    };
  }

  const isExact = actualCountry.code === guessedCountry.code;
  const distanceKm = isExact
    ? 0
    : haversineDistanceKm(
        actualCountry.lat,
        actualCountry.lng,
        guessedCountry.lat,
        guessedCountry.lng
      );

  const baseScore = calculateBaseScore(distanceKm, isExact, config);
  const timeBonus = calculateTimeBonus(responseTimeSeconds, baseScore, config);
  const totalScore = Math.round((baseScore + timeBonus) * streakMultiplier);

  return {
    distanceKm,
    baseScore,
    timeBonus,
    multiplier: streakMultiplier,
    totalScore,
    isExact,
  };
}
