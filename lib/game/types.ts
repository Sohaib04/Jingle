import { CountryMetadata } from "@/lib/geo/countries";

export type GameStatus =
  | "idle"
  | "loading"
  | "playing"
  | "guessing"
  | "revealing"
  | "roundResult"
  | "gameComplete";

export type Difficulty = "easy" | "medium" | "hard";

export type GlobeViewMode = "satellite" | "dark" | "night";

export interface SongTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  albumArt: string;
  countryCode: string; // ISO 3166-1 alpha-2 (e.g. "BR")
  countryName: string;
  genre: string;
  difficulty: Difficulty;
  provider: "preview" | "spotify" | "licensed";
  providerTrackId: string;
  audioUrl?: string;
  previewStartTime?: number;
  durationSeconds?: number;
  language?: string;
}

export interface RoundResult {
  roundNumber: number;
  song: SongTrack;
  actualCountry: CountryMetadata;
  guessedCountry: CountryMetadata | null;
  distanceKm: number;
  baseScore: number;
  timeBonus: number;
  multiplier: number;
  totalScore: number;
  responseTimeSeconds: number;
  isExact: boolean;
  streak: number;
}

export interface GameSummary {
  gameId: string;
  totalScore: number;
  roundsCount: number;
  exactCount: number;
  closeCount: number; // distance < 1000km
  bestStreak: number;
  totalDistanceKm: number;
  averageResponseTimeSeconds: number;
  roundResults: RoundResult[];
  playedAt: string;
}
