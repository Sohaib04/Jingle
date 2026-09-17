import {
  Difficulty,
  SongTrack,
} from "@/lib/game/types";
import {
  MultiplayerPlayer,
  MultiplayerRoom,
  MultiplayerServerEvent,
  PlayerGuess,
  RoundDuelResult,
} from "./types";
import { defaultMusicProvider } from "@/lib/music/itunes-provider";
import { getCountry } from "@/lib/geo/countries";
import { calculateRoundScore, DEFAULT_SCORING_CONFIG } from "@/lib/game/scoring";
import { calculateNextStreak, getStreakMultiplier } from "@/lib/game/streak";

type EventListener = (event: MultiplayerServerEvent) => void;

interface QueuedPlayer {
  player: MultiplayerPlayer;
  difficulty: Difficulty;
  joinedAt: number;
  listener?: EventListener;
}

const ROUND_DURATION_SECONDS = DEFAULT_SCORING_CONFIG.roundDurationSeconds || 20;
const REVIEW_DURATION_SECONDS = 5;

export class RoomManager {
  private queue: Map<string, QueuedPlayer> = new Map();
  private rooms: Map<string, MultiplayerRoom> = new Map();
  private roomListeners: Map<string, Map<string, EventListener>> = new Map();
  private roundTimers: Map<string, NodeJS.Timeout> = new Map();

  // Matchmaking
  public joinQueue(
    player: MultiplayerPlayer,
    difficulty: Difficulty,
    listener?: EventListener
  ): { status: "queued" | "matched"; room?: MultiplayerRoom } {
    // If player is already in queue, update
    this.queue.set(player.id, {
      player,
      difficulty,
      joinedAt: Date.now(),
      listener,
    });

    // Check if another player is waiting in queue
    const potentialOpponents = Array.from(this.queue.entries()).filter(
      ([id, qp]) => id !== player.id && qp.player.isConnected
    );

    if (potentialOpponents.length > 0) {
      // Find matching difficulty first, or any if waiting > 4s
      const now = Date.now();
      let match = potentialOpponents.find(
        ([, qp]) => qp.difficulty === difficulty
      );

      if (!match) {
        match = potentialOpponents.find(
          ([, qp]) => now - qp.joinedAt > 4000
        );
      }

      if (match) {
        const [opponentId, opponentData] = match;
        // Remove both from queue
        this.queue.delete(player.id);
        this.queue.delete(opponentId);

        // Create new match room
        const room = this.createRoom(
          opponentData.player,
          player,
          difficulty,
          opponentData.listener,
          listener
        );

        return { status: "matched", room };
      }
    }

    return { status: "queued" };
  }

  public subscribeQueue(playerId: string, listener: EventListener) {
    const qp = this.queue.get(playerId);
    if (qp) {
      qp.listener = listener;
    }
  }

  public leaveQueue(playerId: string) {
    this.queue.delete(playerId);
  }

  // Room creation & lifecycle
  private createRoom(
    player1: MultiplayerPlayer,
    player2: MultiplayerPlayer,
    difficulty: Difficulty,
    p1Listener?: EventListener,
    p2Listener?: EventListener
  ): MultiplayerRoom {
    const roomId = `room-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const room: MultiplayerRoom = {
      id: roomId,
      difficulty,
      state: "countdown",
      createdAt: Date.now(),
      roundIndex: 0,
      totalRounds: 10,
      rounds: [],
      roundStartTime: 0,
      roundDurationSeconds: ROUND_DURATION_SECONDS,
      player1: { ...player1, score: 0, roundsWon: 0, streak: 0, hasLockedIn: false },
      player2: { ...player2, score: 0, roundsWon: 0, streak: 0, hasLockedIn: false },
      roundGuesses: { player1: null, player2: null },
      roundHistory: [],
      countdownRemaining: 3,
    };

    this.rooms.set(roomId, room);

    // Register room listeners
    const listeners = new Map<string, EventListener>();
    if (p1Listener) listeners.set(player1.id, p1Listener);
    if (p2Listener) listeners.set(player2.id, p2Listener);
    this.roomListeners.set(roomId, listeners);

    // Seed 10 identical tracks for the duel
    defaultMusicProvider.getTracksForGame(10, difficulty).then((tracks) => {
      room.rounds = tracks;

      // Broadcast MATCH_FOUND
      this.broadcast(roomId, {
        type: "MATCH_FOUND",
        roomId,
        player1: room.player1,
        player2: room.player2 || player2,
        difficulty,
      });

      // Start match 3-2-1 countdown
      this.runMatchCountdown(roomId, 3);
    });

    return room;
  }

  private runMatchCountdown(roomId: string, count: number) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    if (count > 0) {
      room.countdownRemaining = count;
      this.broadcast(roomId, { type: "COUNTDOWN_TICK", count });
      setTimeout(() => this.runMatchCountdown(roomId, count - 1), 1000);
    } else {
      // Start Round 1
      this.startRound(roomId, 0);
    }
  }

  private startRound(roomId: string, roundIndex: number) {
    const room = this.rooms.get(roomId);
    if (!room || room.state === "abandoned") return;

    const currentSong = room.rounds[roundIndex];
    if (!currentSong) {
      this.finishMatch(roomId);
      return;
    }

    room.state = "roundActive";
    room.roundIndex = roundIndex;
    room.roundStartTime = Date.now();
    room.player1.hasLockedIn = false;
    if (room.player2) room.player2.hasLockedIn = false;
    room.roundGuesses = { player1: null, player2: null };

    // Clear any existing timer
    this.clearTimer(roomId);

    // Broadcast ROUND_START
    this.broadcast(roomId, {
      type: "ROUND_START",
      roundIndex,
      totalRounds: room.totalRounds,
      song: currentSong,
      durationSeconds: room.roundDurationSeconds,
      serverTime: Date.now(),
    });

    // Authoritative timeout: if time runs out, force resolve
    const timer = setTimeout(() => {
      this.resolveRound(roomId);
    }, (room.roundDurationSeconds + 1) * 1000);

    this.roundTimers.set(roomId, timer);
  }

  public submitGuess(
    roomId: string,
    playerId: string,
    countryCode: string,
    clientResponseTime: number
  ): boolean {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== "roundActive") return false;

    const currentSong = room.rounds[room.roundIndex];
    if (!currentSong) return false;

    const actualCountry = getCountry(currentSong.countryCode);
    if (!actualCountry) return false;

    const guessedCountry = countryCode ? getCountry(countryCode) || null : null;
    const responseTime = Math.max(0.4, Math.min(room.roundDurationSeconds, clientResponseTime));

    const isP1 = room.player1.id === playerId;
    const player = isP1 ? room.player1 : room.player2;
    if (!player || player.hasLockedIn) return false;

    const multiplier = getStreakMultiplier(player.streak);
    const scoreResult = calculateRoundScore(
      actualCountry,
      guessedCountry,
      responseTime,
      multiplier
    );

    const nextStreak = calculateNextStreak(
      player.streak,
      scoreResult.isExact,
      scoreResult.distanceKm
    );
    player.streak = nextStreak;

    const guess: PlayerGuess = {
      countryCode: guessedCountry?.code || "",
      countryName: guessedCountry?.name || "No Guess",
      lat: guessedCountry?.lat ?? 0,
      lng: guessedCountry?.lng ?? 0,
      flag: guessedCountry?.flag || "❓",
      distanceKm: scoreResult.distanceKm,
      baseScore: scoreResult.baseScore,
      timeBonus: scoreResult.timeBonus,
      multiplier: scoreResult.multiplier,
      totalScore: scoreResult.totalScore,
      responseTimeSeconds: Number(responseTime.toFixed(1)),
      isExact: scoreResult.isExact,
    };

    player.hasLockedIn = true;

    if (isP1) {
      room.roundGuesses.player1 = guess;
    } else {
      room.roundGuesses.player2 = guess;
    }

    // Inform opponent that player has locked in (WITHOUT revealing country/coordinates)
    this.broadcast(roomId, {
      type: "OPPONENT_LOCKED",
      playerId,
      responseTimeSeconds: guess.responseTimeSeconds,
    });

    // Check if both players have submitted
    const bothSubmitted =
      room.player1.hasLockedIn && (!room.player2 || room.player2.hasLockedIn);

    if (bothSubmitted) {
      this.clearTimer(roomId);
      // Small 300ms pause for suspense then resolve
      setTimeout(() => this.resolveRound(roomId), 300);
    }

    return true;
  }

  private resolveRound(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.state === "complete" || room.state === "abandoned") return;

    this.clearTimer(roomId);
    room.state = "roundReview";

    const currentSong = room.rounds[room.roundIndex];
    const actualCountry = getCountry(currentSong?.countryCode || "");
    if (!actualCountry) return;

    const p1Guess = room.roundGuesses.player1;
    const p2Guess = room.roundGuesses.player2;

    const p1Score = p1Guess?.totalScore || 0;
    const p2Score = p2Guess?.totalScore || 0;

    room.player1.score += p1Score;
    if (room.player2) {
      room.player2.score += p2Score;
    }

    let winnerId: string | "tie" = "tie";
    if (p1Score > p2Score) {
      winnerId = room.player1.id;
      room.player1.roundsWon += 1;
    } else if (p2Score > p1Score && room.player2) {
      winnerId = room.player2.id;
      room.player2.roundsWon += 1;
    }

    const duelResult: RoundDuelResult = {
      roundNumber: room.roundIndex + 1,
      song: currentSong,
      actualCountry,
      player1Guess: p1Guess,
      player2Guess: p2Guess,
      winnerId,
      scoreDelta: p1Score - p2Score,
    };

    room.roundHistory.push(duelResult);

    // Broadcast ROUND_RESOLVED
    this.broadcast(roomId, {
      type: "ROUND_RESOLVED",
      duelResult,
      player1TotalScore: room.player1.score,
      player2TotalScore: room.player2 ? room.player2.score : 0,
      nextRoundCountdownSeconds: REVIEW_DURATION_SECONDS,
    });

    // Schedule next round or match completion
    const nextIndex = room.roundIndex + 1;
    const isLastRound = nextIndex >= room.totalRounds;

    setTimeout(() => {
      if (isLastRound) {
        this.finishMatch(roomId);
      } else {
        this.startRound(roomId, nextIndex);
      }
    }, REVIEW_DURATION_SECONDS * 1000);
  }

  private finishMatch(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.state = "complete";
    let winnerId: string | "draw" = "draw";

    if (room.player1.score > (room.player2?.score || 0)) {
      winnerId = room.player1.id;
    } else if ((room.player2?.score || 0) > room.player1.score && room.player2) {
      winnerId = room.player2.id;
    }

    room.winnerId = winnerId;

    this.broadcast(roomId, {
      type: "MATCH_OVER",
      winnerId,
      finalScoreP1: room.player1.score,
      finalScoreP2: room.player2?.score || 0,
      roundHistory: room.roundHistory,
    });
  }

  // Connection & Heartbeat
  public subscribeRoom(roomId: string, playerId: string, listener: EventListener): () => void {
    let listeners = this.roomListeners.get(roomId);
    if (!listeners) {
      listeners = new Map();
      this.roomListeners.set(roomId, listeners);
    }
    listeners.set(playerId, listener);

    const room = this.rooms.get(roomId);
    if (room) {
      if (room.player1.id === playerId) room.player1.isConnected = true;
      if (room.player2?.id === playerId) room.player2.isConnected = true;
    }

    return () => {
      listeners?.delete(playerId);
      const r = this.rooms.get(roomId);
      if (r) {
        if (r.player1.id === playerId) r.player1.isConnected = false;
        if (r.player2?.id === playerId) r.player2.isConnected = false;
      }
    };
  }

  public heartbeat(roomId: string, playerId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const player = room.player1.id === playerId ? room.player1 : room.player2;
    if (player) {
      player.lastHeartbeat = Date.now();
      player.isConnected = true;
      return true;
    }
    return false;
  }

  public forfeit(roomId: string, playerId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.state === "complete" || room.state === "abandoned") return;

    this.clearTimer(roomId);
    room.state = "abandoned";

    const winnerId =
      room.player1.id === playerId ? room.player2?.id : room.player1.id;

    this.broadcast(roomId, {
      type: "MATCH_ABANDONED",
      reason: "Opponent left the match",
      winnerId,
    });
  }

  public getRoom(roomId: string): MultiplayerRoom | undefined {
    return this.rooms.get(roomId);
  }

  private broadcast(roomId: string, event: MultiplayerServerEvent) {
    const listeners = this.roomListeners.get(roomId);
    if (!listeners) return;

    listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.warn(`Error dispatching room event to listener:`, err);
      }
    });
  }

  private clearTimer(roomId: string) {
    const existing = this.roundTimers.get(roomId);
    if (existing) {
      clearTimeout(existing);
      this.roundTimers.delete(roomId);
    }
  }
}

// Global singleton to persist across route invocations in Next.js runtime
const globalForMultiplayer = globalThis as unknown as {
  roomManager?: RoomManager;
};

export const roomManager =
  globalForMultiplayer.roomManager || new RoomManager();

if (process.env.NODE_ENV !== "production") {
  globalForMultiplayer.roomManager = roomManager;
}
