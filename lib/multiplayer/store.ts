import { create } from "zustand";
import {
  Difficulty,
  SongTrack,
} from "@/lib/game/types";
import {
  MultiplayerPlayer,
  MultiplayerServerEvent,
  MultiplayerStatus,
  RoundDuelResult,
} from "./types";
import { CountryMetadata, getCountry } from "@/lib/geo/countries";
import { defaultMusicProvider } from "@/lib/music/itunes-provider";

export interface MultiplayerState {
  status: MultiplayerStatus;
  playerId: string;
  playerName: string;
  playerAvatar: string;
  difficulty: Difficulty;
  roomId: string | null;
  countdown: number;
  self: MultiplayerPlayer | null;
  opponent: MultiplayerPlayer | null;
  currentRoundIndex: number;
  totalRounds: number;
  currentSong: SongTrack | null;
  timeRemaining: number;
  hasLockedIn: boolean;
  opponentHasLockedIn: boolean;
  selectedCountry: CountryMetadata | null;
  hoveredCountry: CountryMetadata | null;
  latestDuelResult: RoundDuelResult | null;
  roundHistory: RoundDuelResult[];
  winnerId: string | "draw" | null;
  reviewCountdown: number;
  matchAbandonReason: string | null;
  showMatchmakingModal: boolean;

  // Actions
  setPlayerName: (name: string) => void;
  setPlayerAvatar: (avatar: string) => void;
  openMatchmakingModal: () => void;
  closeMatchmakingModal: () => void;
  findMatch: (difficulty?: Difficulty) => Promise<void>;
  cancelMatchmaking: () => void;
  hoverCountry: (country: CountryMetadata | null) => void;
  selectCountry: (country: CountryMetadata) => void;
  lockGuess: () => void;
  leaveMatch: () => void;
  tickTimer: () => void;
}

const DEFAULT_ROUND_DURATION = 20;

// Random callsign generator
const CALLSIGN_PREFIXES = ["Sonic", "Echo", "Astro", "Beat", "Frequency", "Orbit", "Pulse", "Nova", "Vibe", "Solar"];
const CALLSIGN_SUFFIXES = ["Pilot", "Nomad", "Racer", "Captain", "Surfer", "DJ", "Master", "Explorer", "Seeker", "Rider"];

export function generateRandomCallsign(): string {
  const p = CALLSIGN_PREFIXES[Math.floor(Math.random() * CALLSIGN_PREFIXES.length)];
  const s = CALLSIGN_SUFFIXES[Math.floor(Math.random() * CALLSIGN_SUFFIXES.length)];
  const num = Math.floor(10 + Math.random() * 90);
  return `${p}${s}_${num}`;
}

const AVATARS = ["🎧", "📻", "⚡", "🛰️", "🛸", "🔥", "🎵", "🌍"];

let queueEventSource: EventSource | null = null;
let roomEventSource: EventSource | null = null;
let heartbeatInterval: NodeJS.Timeout | null = null;

// Lightweight Web Audio SFX synthesizer for battle cues
function playTone(freq: number, type: OscillatorType, duration: number, gainVal = 0.15) {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(gainVal, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {}
}

function playOpponentLockedTone() {
  playTone(520, "sine", 0.12, 0.18);
  setTimeout(() => playTone(680, "triangle", 0.18, 0.16), 90);
}

function playMatchFoundFanfare() {
  const notes = [440, 554, 659, 880];
  notes.forEach((freq, idx) => {
    setTimeout(() => playTone(freq, "triangle", 0.22, 0.2), idx * 110);
  });
}

function playRoundWinFanfare() {
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, idx) => {
    setTimeout(() => playTone(freq, "sine", 0.25, 0.2), idx * 90);
  });
}

export const useMultiplayerStore = create<MultiplayerState>((set, get) => {
  // Initialize player identity from storage or generate fresh
  const initialPlayerId =
    (typeof window !== "undefined" && sessionStorage.getItem("jingle_mp_player_id")) ||
    `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const initialName =
    (typeof window !== "undefined" && localStorage.getItem("jingle_mp_name")) ||
    generateRandomCallsign();

  const initialAvatar =
    (typeof window !== "undefined" && localStorage.getItem("jingle_mp_avatar")) ||
    AVATARS[Math.floor(Math.random() * AVATARS.length)];

  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem("jingle_mp_player_id", initialPlayerId);
    } catch {}
  }

  const connectToRoom = (roomId: string, initialP1?: MultiplayerPlayer, initialP2?: MultiplayerPlayer) => {
    // Cleanup any prior connection
    if (roomEventSource) {
      roomEventSource.close();
      roomEventSource = null;
    }
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }

    const { playerId } = get();

    // Determine self vs opponent
    let self = get().self;
    let opponent = get().opponent;
    if (initialP1 && initialP2) {
      self = initialP1.id === playerId ? initialP1 : initialP2;
      opponent = initialP1.id === playerId ? initialP2 : initialP1;
    }

    set({
      roomId,
      self,
      opponent,
      status: "countdown",
      countdown: 3,
      showMatchmakingModal: false,
    });

    // Connect SSE
    const es = new EventSource(`/api/multiplayer/room/${roomId}/events?playerId=${playerId}`);
    roomEventSource = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleServerEvent(data);
      } catch (err) {
        console.warn("Failed to parse room SSE event:", err);
      }
    };

    es.onerror = () => {
      // Browser EventSource automatically attempts reconnection
      const curr = get().status;
      set({ status: curr === "matchComplete" ? "matchComplete" : curr });
    };

    // Periodic Heartbeat
    heartbeatInterval = setInterval(() => {
      fetch(`/api/multiplayer/room/${roomId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "HEARTBEAT", playerId }),
      }).catch(() => {});
    }, 3000);
  };

  const handleServerEvent = (event: MultiplayerServerEvent & { type: string; [key: string]: unknown }) => {
    const { playerId } = get();

    switch (event.type) {
      case "ROOM_CONNECTED": {
        const p1 = event.player1 as MultiplayerPlayer | null;
        const p2 = event.player2 as MultiplayerPlayer | null;
        if (p1 && p2) {
          const self = p1.id === playerId ? p1 : p2;
          const opponent = p1.id === playerId ? p2 : p1;
          set({
            self,
            opponent,
          });
        }
        break;
      }

      case "MATCH_FOUND": {
        const p1 = event.player1 as MultiplayerPlayer;
        const p2 = event.player2 as MultiplayerPlayer;
        const self = p1.id === playerId ? p1 : p2;
        const opponent = p1.id === playerId ? p2 : p1;
        set({
          status: "matched",
          self,
          opponent,
        });
        playMatchFoundFanfare();
        break;
      }

      case "COUNTDOWN_TICK": {
        const count = event.count as number;
        set({ countdown: count, status: "countdown" });
        playTone(count === 1 ? 880 : 440, "sine", 0.08, 0.15);
        break;
      }

      case "ROUND_START": {
        const song = event.song as SongTrack;
        const roundIndex = event.roundIndex as number;
        const totalRounds = event.totalRounds as number;
        const durationSeconds = event.durationSeconds as number;

        set((state) => ({
          status: "roundActive",
          currentRoundIndex: roundIndex,
          totalRounds,
          currentSong: song,
          timeRemaining: durationSeconds,
          hasLockedIn: false,
          opponentHasLockedIn: false,
          selectedCountry: null,
          hoveredCountry: null,
          latestDuelResult: null,
          self: state.self ? { ...state.self, hasLockedIn: false } : null,
          opponent: state.opponent ? { ...state.opponent, hasLockedIn: false } : null,
        }));

        // Trigger globe recenter
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("globe:recenter"));
        }

        // Play mystery track
        defaultMusicProvider.play(song);
        break;
      }

      case "OPPONENT_LOCKED": {
        set((state) => ({
          opponentHasLockedIn: true,
          opponent: state.opponent ? { ...state.opponent, hasLockedIn: true } : null,
          // If the player hasn't locked in yet and there's ample time, speed up countdown to 10s (GeoGuessr battle mechanic)
          timeRemaining: state.hasLockedIn ? state.timeRemaining : Math.min(state.timeRemaining, 10),
        }));
        playOpponentLockedTone();
        break;
      }

      case "ROUND_RESOLVED": {
        const duelResult = event.duelResult as RoundDuelResult;
        const p1Score = event.player1TotalScore as number;
        const p2Score = event.player2TotalScore as number;
        const nextCountdown = (event.nextRoundCountdownSeconds as number) || 5;

        const amIPlayer1 = duelResult.player1Id
          ? duelResult.player1Id === playerId
          : get().self?.id === duelResult.player1Id;
        const updatedSelfScore = amIPlayer1 ? p1Score : p2Score;
        const updatedOpponentScore = amIPlayer1 ? p2Score : p1Score;

        const isWin =
          duelResult.winnerId === playerId ||
          (Boolean(get().self?.id) && duelResult.winnerId === get().self?.id);

        if (isWin) {
          playRoundWinFanfare();
        } else if (duelResult.winnerId !== "tie") {
          playTone(280, "sawtooth", 0.3, 0.15);
        }

        set((state) => ({
          status: "roundReview",
          latestDuelResult: duelResult,
          roundHistory: [...state.roundHistory, duelResult],
          reviewCountdown: nextCountdown,
          self: state.self ? { ...state.self, score: updatedSelfScore } : null,
          opponent: state.opponent ? { ...state.opponent, score: updatedOpponentScore } : null,
        }));

        // Fly camera to the actual country
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("globe:fly-to", {
              detail: {
                lat: duelResult.actualCountry.lat,
                lng: duelResult.actualCountry.lng,
                altitude: 1.6,
              },
            })
          );
        }
        break;
      }

      case "MATCH_OVER": {
        const winnerId = event.winnerId as string | "draw";
        set({
          status: "matchComplete",
          winnerId,
        });
        defaultMusicProvider.stop();
        break;
      }

      case "MATCH_ABANDONED": {
        set({
          status: "opponentDisconnected",
          matchAbandonReason: (event.reason as string) || "Opponent disconnected",
        });
        defaultMusicProvider.stop();
        break;
      }
    }
  };

  return {
    status: "idle",
    playerId: initialPlayerId,
    playerName: initialName,
    playerAvatar: initialAvatar,
    difficulty: "easy",
    roomId: null,
    countdown: 3,
    self: null,
    opponent: null,
    currentRoundIndex: 0,
    totalRounds: 10,
    currentSong: null,
    timeRemaining: DEFAULT_ROUND_DURATION,
    hasLockedIn: false,
    opponentHasLockedIn: false,
    selectedCountry: null,
    hoveredCountry: null,
    latestDuelResult: null,
    roundHistory: [],
    winnerId: null,
    reviewCountdown: 5,
    matchAbandonReason: null,
    showMatchmakingModal: false,

    setPlayerName: (name: string) => {
      const trimmed = name.trim().slice(0, 20) || "SonicPilot";
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("jingle_mp_name", trimmed);
        } catch {}
      }
      set({ playerName: trimmed });
    },

    setPlayerAvatar: (avatar: string) => {
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("jingle_mp_avatar", avatar);
        } catch {}
      }
      set({ playerAvatar: avatar });
    },

    openMatchmakingModal: () => set({ showMatchmakingModal: true }),
    closeMatchmakingModal: () => {
      get().cancelMatchmaking();
      set({ showMatchmakingModal: false });
    },

    findMatch: async (difficulty: Difficulty = "easy") => {
      const { playerId, playerName, playerAvatar } = get();

      // Clean up previous state
      if (queueEventSource) {
        queueEventSource.close();
        queueEventSource = null;
      }

      set({
        status: "queueing",
        difficulty,
        latestDuelResult: null,
        roundHistory: [],
        winnerId: null,
      });

      try {
        // Enqueue via REST
        const res = await fetch("/api/multiplayer/queue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playerId,
            name: playerName,
            avatar: playerAvatar,
            difficulty,
          }),
        });

        const data = await res.json();

        if (data.status === "matched" && data.roomId) {
          // Instant match! Connect immediately to room
          connectToRoom(data.roomId, data.player1, data.player2);
        } else {
          // Listen on queue SSE until opponent joins
          const qes = new EventSource(`/api/multiplayer/queue/events?playerId=${playerId}`);
          queueEventSource = qes;

          qes.onmessage = (e) => {
            try {
              const msg = JSON.parse(e.data);
              if (msg.type === "MATCH_FOUND") {
                qes.close();
                queueEventSource = null;
                connectToRoom(msg.roomId, msg.player1, msg.player2);
              }
            } catch {}
          };

          qes.onerror = () => {
            console.warn("Matchmaking queue SSE connection issue");
          };
        }
      } catch (err) {
        console.error("Matchmaking error:", err);
        set({ status: "idle" });
      }
    },

    cancelMatchmaking: () => {
      const { playerId } = get();
      if (queueEventSource) {
        queueEventSource.close();
        queueEventSource = null;
      }
      fetch(`/api/multiplayer/queue?playerId=${playerId}`, { method: "DELETE" }).catch(() => {});
      set({ status: "idle" });
    },

    hoverCountry: (country) => {
      const { status, hoveredCountry } = get();
      if (status === "roundActive") {
        if (hoveredCountry?.code === country?.code) return;
        set({ hoveredCountry: country });
      }
    },

    selectCountry: (country) => {
      const { status, hasLockedIn } = get();
      if (status === "roundActive" && !hasLockedIn) {
        set({ selectedCountry: country });
      }
    },

    lockGuess: () => {
      const { status, hasLockedIn, selectedCountry, roomId, playerId, timeRemaining } = get();
      if (status !== "roundActive" || hasLockedIn || !roomId) return;

      const country = selectedCountry || get().hoveredCountry;
      const responseTime = DEFAULT_ROUND_DURATION - timeRemaining;

      set({
        hasLockedIn: true,
        self: get().self ? { ...get().self!, hasLockedIn: true } : null,
      });

      playTone(720, "triangle", 0.12, 0.2);

      fetch(`/api/multiplayer/room/${roomId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "SUBMIT_GUESS",
          playerId,
          countryCode: country?.code || "",
          responseTimeSeconds: Math.max(0.5, responseTime),
        }),
      }).catch((err) => {
        console.error("Error locking guess:", err);
      });
    },

    leaveMatch: () => {
      const { roomId, playerId } = get();
      if (roomEventSource) {
        roomEventSource.close();
        roomEventSource = null;
      }
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
      }
      if (roomId && playerId) {
        fetch(`/api/multiplayer/room/${roomId}/action`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "FORFEIT", playerId }),
        }).catch(() => {});
      }
      defaultMusicProvider.stop();
      set({
        status: "idle",
        roomId: null,
        self: null,
        opponent: null,
        currentSong: null,
        selectedCountry: null,
        hoveredCountry: null,
        latestDuelResult: null,
        roundHistory: [],
        winnerId: null,
      });
    },

    tickTimer: () => {
      const { status, timeRemaining, hasLockedIn } = get();
      if (status === "roundActive") {
        if (timeRemaining > 0) {
          set({ timeRemaining: timeRemaining - 1 });
        } else if (!hasLockedIn) {
          // Auto lock-in when round timer expires
          get().lockGuess();
        }
      }
    },
  };
});
