/**
 * Spotify Music Provider (Stub / Policy-Compliant Prototyping Module)
 *
 * NOTE ON SPOTIFY DEVELOPER POLICY:
 * Current Spotify developer policy places explicit restrictions on streaming integrations
 * and prohibits building commercial games/trivia quizzes using the Spotify Platform.
 * GeoTune uses a provider-agnostic architecture where this module is completely isolated.
 * Do NOT extract audio, circumvent DRM, or expose client secrets in browser code.
 */

import { IMusicProvider, PlaybackState } from "./provider";
import { SongTrack } from "@/lib/game/types";

export class SpotifyMusicProvider implements IMusicProvider {
  readonly id = "spotify";
  readonly name = "Spotify Web API (Preview/SDK)";

  private isConfigured: boolean = false;
  private listeners: Set<(state: PlaybackState) => void> = new Set();

  private state: PlaybackState = {
    isPlaying: false,
    currentTime: 0,
    duration: 30,
    volume: 0.8,
    isMuted: false,
    isLoading: false,
    hasError: false,
  };

  constructor() {
    this.isConfigured = Boolean(
      process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID
    );
  }

  async initialize(): Promise<void> {
    if (!this.isConfigured) {
      console.info(
        "SpotifyProvider is in mock/stub mode. Set NEXT_PUBLIC_SPOTIFY_CLIENT_ID to enable official OAuth."
      );
    }
  }

  async getTracksForGame(): Promise<SongTrack[]> {
    throw new Error(
      "SpotifyProvider requires active OAuth authentication and Spotify Premium for playback. Use PreviewMusicProvider for default gameplay."
    );
  }

  async play(): Promise<void> {
    throw new Error("Spotify playback requires Spotify Web Playback SDK integration.");
  }

  pause(): void {
    this.state.isPlaying = false;
  }

  resume(): void {
    this.state.isPlaying = true;
  }

  stop(): void {
    this.state.isPlaying = false;
  }

  setVolume(volume: number): void {
    this.state.volume = volume;
  }

  setMuted(muted: boolean): void {
    this.state.isMuted = muted;
  }

  getPlaybackState(): PlaybackState {
    return { ...this.state };
  }

  onStateChange(listener: (state: PlaybackState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  dispose(): void {
    this.listeners.clear();
  }
}
