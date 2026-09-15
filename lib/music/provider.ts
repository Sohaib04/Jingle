import { SongTrack } from "@/lib/game/types";

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isLoading: boolean;
  hasError: boolean;
}

export interface IMusicProvider {
  readonly id: string;
  readonly name: string;

  /**
   * Initializes the provider (e.g. audio context or auth tokens)
   */
  initialize(): Promise<void>;

  /**
   * Retrieves randomized tracks for a new game session.
   */
  getTracksForGame(count: number, difficulty?: string): Promise<SongTrack[]>;

  /**
   * Starts playing a track.
   */
  play(track: SongTrack): Promise<void>;

  /**
   * Pauses current playback.
   */
  pause(): void;

  /**
   * Resumes playback.
   */
  resume(): void;

  /**
   * Stops playback and resets position.
   */
  stop(): void;

  /**
   * Sets volume level [0.0 - 1.0].
   */
  setVolume(volume: number): void;

  /**
   * Mutes or unmutes audio.
   */
  setMuted(muted: boolean): void;

  /**
   * Gets current playback state.
   */
  getPlaybackState(): PlaybackState;

  /**
   * Subscribes to playback state changes.
   */
  onStateChange(listener: (state: PlaybackState) => void): () => void;

  /**
   * Cleans up audio resources.
   */
  dispose(): void;
}
