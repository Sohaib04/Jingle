import { create } from "zustand";
import { GameStatus, Difficulty, SongTrack, RoundResult, GameSummary } from "./types";
import { CountryMetadata, getCountry } from "@/lib/geo/countries";
import { calculateRoundScore, DEFAULT_SCORING_CONFIG } from "./scoring";
import { calculateNextStreak, getStreakMultiplier } from "./streak";
import { defaultMusicProvider, PreviewMusicProvider } from "@/lib/music/preview-provider";
import { PlaybackState } from "@/lib/music/provider";

export interface GameState {
  gameStatus: GameStatus;
  rounds: SongTrack[];
  currentRoundIndex: number;
  totalScore: number;
  currentStreak: number;
  bestStreak: number;
  selectedCountry: CountryMetadata | null;
  hoveredCountry: CountryMetadata | null;
  timeRemaining: number;
  roundResults: RoundResult[];
  latestResult: RoundResult | null;
  playbackState: PlaybackState;
  difficulty: Difficulty;

  // Actions
  startGame: (difficulty?: Difficulty) => Promise<void>;
  hoverCountry: (country: CountryMetadata | null) => void;
  selectCountry: (country: CountryMetadata) => void;
  submitGuess: () => void;
  nextRound: () => void;
  resetGame: () => void;
  tickTimer: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  togglePlayPause: () => void;
  getGameSummary: () => GameSummary;
}

const ROUND_DURATION = DEFAULT_SCORING_CONFIG.roundDurationSeconds;

export const useGameStore = create<GameState>((set, get) => {
  // Sync playback state from music provider
  defaultMusicProvider.onStateChange((state) => {
    set({ playbackState: state });
  });

  return {
    gameStatus: "idle",
    rounds: [],
    currentRoundIndex: 0,
    totalScore: 0,
    currentStreak: 0,
    bestStreak: 0,
    selectedCountry: null,
    hoveredCountry: null,
    timeRemaining: ROUND_DURATION,
    roundResults: [],
    latestResult: null,
    playbackState: defaultMusicProvider.getPlaybackState(),
    difficulty: "easy",

    startGame: async (difficulty: Difficulty = "easy") => {
      set({
        gameStatus: "loading",
        difficulty,
        totalScore: 0,
        currentStreak: 0,
        bestStreak: 0,
        roundResults: [],
        latestResult: null,
        selectedCountry: null,
        hoveredCountry: null,
        currentRoundIndex: 0,
        timeRemaining: ROUND_DURATION,
      });

      try {
        const tracks = await defaultMusicProvider.getTracksForGame(10, difficulty);
        set({
          rounds: tracks,
          gameStatus: "playing",
        });

        if (tracks.length > 0) {
          await defaultMusicProvider.play(tracks[0]);
        }
      } catch (err) {
        console.error("Failed to start game:", err);
        set({ gameStatus: "idle" });
      }
    },

    hoverCountry: (country) => {
      if (get().gameStatus === "playing" || get().gameStatus === "guessing") {
        set({ hoveredCountry: country });
      }
    },

    selectCountry: (country) => {
      const { gameStatus } = get();
      if (gameStatus === "playing" || gameStatus === "guessing") {
        set({
          selectedCountry: country,
          gameStatus: "guessing",
        });
      }
    },

    submitGuess: () => {
      const {
        gameStatus,
        rounds,
        currentRoundIndex,
        selectedCountry,
        timeRemaining,
        currentStreak,
        bestStreak,
        totalScore,
        roundResults,
      } = get();

      if (gameStatus !== "playing" && gameStatus !== "guessing") {
        return;
      }

      const song = rounds[currentRoundIndex];
      if (!song) return;

      const actualCountry = getCountry(song.countryCode);
      if (!actualCountry) {
        console.error("Unknown country code for song:", song.countryCode);
        return;
      }

      const responseTime = Math.max(0.5, ROUND_DURATION - timeRemaining);
      const multiplier = getStreakMultiplier(currentStreak);

      const scoreResult = calculateRoundScore(
        actualCountry,
        selectedCountry,
        responseTime,
        multiplier
      );

      const nextStreak = calculateNextStreak(
        currentStreak,
        scoreResult.isExact,
        scoreResult.distanceKm
      );
      const newBestStreak = Math.max(bestStreak, nextStreak);

      const result: RoundResult = {
        roundNumber: currentRoundIndex + 1,
        song,
        actualCountry,
        guessedCountry: selectedCountry,
        distanceKm: scoreResult.distanceKm,
        baseScore: scoreResult.baseScore,
        timeBonus: scoreResult.timeBonus,
        multiplier: scoreResult.multiplier,
        totalScore: scoreResult.totalScore,
        responseTimeSeconds: Number(responseTime.toFixed(1)),
        isExact: scoreResult.isExact,
        streak: nextStreak,
      };

      // Sound cue
      if (defaultMusicProvider instanceof PreviewMusicProvider) {
        if (scoreResult.isExact || scoreResult.distanceKm < 1000) {
          defaultMusicProvider.playSuccessChime();
        } else {
          defaultMusicProvider.playMissThud();
        }
      }

      set({
        gameStatus: "revealing",
        latestResult: result,
        roundResults: [...roundResults, result],
        totalScore: totalScore + scoreResult.totalScore,
        currentStreak: nextStreak,
        bestStreak: newBestStreak,
      });

      // After brief fly-to animation (1.6s), advance to roundResult modal/card
      setTimeout(() => {
        if (get().gameStatus === "revealing") {
          set({ gameStatus: "roundResult" });
        }
      }, 1600);
    },

    nextRound: () => {
      const { rounds, currentRoundIndex } = get();
      const nextIndex = currentRoundIndex + 1;

      if (nextIndex < rounds.length) {
        set({
          currentRoundIndex: nextIndex,
          selectedCountry: null,
          hoveredCountry: null,
          latestResult: null,
          timeRemaining: ROUND_DURATION,
          gameStatus: "playing",
        });

        defaultMusicProvider.play(rounds[nextIndex]);
      } else {
        defaultMusicProvider.stop();
        const summary = get().getGameSummary();
        set({
          gameStatus: "gameComplete",
          selectedCountry: null,
          hoveredCountry: null,
        });

        // Persist game result asynchronously
        fetch("/api/game/finish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(summary),
        }).catch((err) => console.warn("Failed to persist game:", err));
      }
    },

    resetGame: () => {
      defaultMusicProvider.stop();
      set({
        gameStatus: "idle",
        rounds: [],
        currentRoundIndex: 0,
        selectedCountry: null,
        hoveredCountry: null,
        latestResult: null,
        totalScore: 0,
        currentStreak: 0,
      });
    },

    tickTimer: () => {
      const { gameStatus, timeRemaining } = get();
      if (gameStatus === "playing" || gameStatus === "guessing") {
        if (timeRemaining > 0) {
          set({ timeRemaining: timeRemaining - 1 });
        } else {
          // Time expired! Auto submit guess
          get().submitGuess();
        }
      }
    },

    setVolume: (v) => defaultMusicProvider.setVolume(v),
    toggleMute: () => defaultMusicProvider.setMuted(!get().playbackState.isMuted),
    togglePlayPause: () => {
      const state = defaultMusicProvider.getPlaybackState();
      if (state.isPlaying) {
        defaultMusicProvider.pause();
      } else {
        defaultMusicProvider.resume();
      }
    },

    getGameSummary: (): GameSummary => {
      const { totalScore, roundResults, bestStreak } = get();
      const totalDist = roundResults.reduce((acc, r) => acc + r.distanceKm, 0);
      const exacts = roundResults.filter((r) => r.isExact).length;
      const close = roundResults.filter((r) => !r.isExact && r.distanceKm < 1000).length;
      const avgTime =
        roundResults.length > 0
          ? roundResults.reduce((acc, r) => acc + r.responseTimeSeconds, 0) / roundResults.length
          : 0;

      return {
        gameId: `gt-${Date.now()}`,
        totalScore,
        roundsCount: roundResults.length,
        exactCount: exacts,
        closeCount: close,
        bestStreak,
        totalDistanceKm: totalDist,
        averageResponseTimeSeconds: Number(avgTime.toFixed(1)),
        roundResults,
        playedAt: new Date().toISOString(),
      };
    },
  };
});
