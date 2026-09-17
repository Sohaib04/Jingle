import { CountryMetadata } from "@/lib/geo/countries";
import { Difficulty, SongTrack } from "@/lib/game/types";

export type MultiplayerStatus =
  | "idle"
  | "queueing"
  | "matched"
  | "countdown"
  | "roundActive"
  | "roundRevealing"
  | "roundReview"
  | "matchComplete"
  | "opponentDisconnected";

export type RoomState =
  | "waiting"
  | "countdown"
  | "roundActive"
  | "roundRevealing"
  | "roundReview"
  | "complete"
  | "abandoned";

export interface MultiplayerPlayer {
  id: string;
  name: string;
  avatar: string;
  score: number;
  roundsWon: number;
  streak: number;
  isConnected: boolean;
  lastHeartbeat: number;
  hasLockedIn: boolean;
}

export interface PlayerGuess {
  countryCode: string;
  countryName: string;
  lat: number;
  lng: number;
  flag: string;
  distanceKm: number;
  baseScore: number;
  timeBonus: number;
  multiplier: number;
  totalScore: number;
  responseTimeSeconds: number;
  isExact: boolean;
}

export interface RoundDuelResult {
  roundNumber: number;
  song: SongTrack;
  actualCountry: CountryMetadata;
  player1Guess: PlayerGuess | null;
  player2Guess: PlayerGuess | null;
  winnerId: string | "tie";
  scoreDelta: number; // Positive if player 1 gained more, negative if player 2 gained more
}

export interface MultiplayerRoom {
  id: string;
  difficulty: Difficulty;
  state: RoomState;
  createdAt: number;
  roundIndex: number;
  totalRounds: number;
  rounds: SongTrack[];
  roundStartTime: number;
  roundDurationSeconds: number;
  player1: MultiplayerPlayer;
  player2: MultiplayerPlayer | null;
  roundGuesses: {
    player1: PlayerGuess | null;
    player2: PlayerGuess | null;
  };
  roundHistory: RoundDuelResult[];
  countdownRemaining: number;
  winnerId?: string | "draw";
}

// Events streamed via Server-Sent Events (SSE)
export type MultiplayerServerEvent =
  | { type: "MATCH_FOUND"; roomId: string; player1: MultiplayerPlayer; player2: MultiplayerPlayer; difficulty: Difficulty }
  | { type: "COUNTDOWN_TICK"; count: number }
  | { type: "ROUND_START"; roundIndex: number; totalRounds: number; song: SongTrack; durationSeconds: number; serverTime: number }
  | { type: "OPPONENT_LOCKED"; playerId: string; responseTimeSeconds: number }
  | { type: "ROUND_RESOLVED"; duelResult: RoundDuelResult; player1TotalScore: number; player2TotalScore: number; nextRoundCountdownSeconds: number }
  | { type: "MATCH_OVER"; winnerId: string | "draw"; finalScoreP1: number; finalScoreP2: number; roundHistory: RoundDuelResult[] }
  | { type: "PLAYER_HEARTBEAT_ACK"; timestamp: number }
  | { type: "OPPONENT_CONNECTION_CHANGED"; playerId: string; isConnected: boolean; graceSecondsRemaining?: number }
  | { type: "MATCH_ABANDONED"; reason: string; winnerId?: string };

// Client-to-server action payloads
export type MultiplayerClientAction =
  | { type: "HEARTBEAT"; playerId: string }
  | { type: "SUBMIT_GUESS"; playerId: string; countryCode: string; responseTimeSeconds: number }
  | { type: "NEXT_ROUND_READY"; playerId: string }
  | { type: "FORFEIT"; playerId: string };
