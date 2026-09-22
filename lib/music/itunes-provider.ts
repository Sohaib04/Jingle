import { IMusicProvider, PlaybackState } from "./provider";
import { SongTrack } from "@/lib/game/types";
import itunesCatalogRaw from "./itunes-catalog.json";

export class ITunesMusicProvider implements IMusicProvider {
  readonly id = "itunes";
  readonly name = "Apple Music / iTunes Audio Previews";

  private audio: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private synthInterval: number | null = null;
  private currentTrack: SongTrack | null = null;
  private listeners: Set<(state: PlaybackState) => void> = new Set();
  private catalog: SongTrack[] = itunesCatalogRaw as SongTrack[];

  private state: PlaybackState = {
    isPlaying: false,
    currentTime: 0,
    duration: 30,
    volume: 0.7,
    isMuted: false,
    isLoading: false,
    hasError: false,
  };

  async initialize(): Promise<void> {
    if (typeof window === "undefined") return;

    if (!this.audio) {
      this.audio = new Audio();
      this.audio.preload = "auto";
      this.audio.volume = this.state.isMuted ? 0 : this.state.volume * 0.85;

      this.audio.addEventListener("playing", () => {
        this.updateState({ isPlaying: true, isLoading: false, hasError: false });
      });

      this.audio.addEventListener("pause", () => {
        this.updateState({ isPlaying: false });
      });

      this.audio.addEventListener("ended", () => {
        this.updateState({ isPlaying: false, currentTime: 0 });
      });

      this.audio.addEventListener("error", (e) => {
        console.warn("iTunes audio stream error, falling back to local audio.", e);
        this.updateState({ hasError: true, isLoading: false });
        this.fallbackToLocalOrSynth();
      });
    }
  }

  /**
   * Retrieves randomized tracks from the catalog.
   */
  async getTracksForGame(count: number = 10, difficulty?: string): Promise<SongTrack[]> {
    let pool = [...this.catalog];

    if (difficulty) {
      const filtered = pool.filter((t) => t.difficulty === difficulty);
      if (filtered.length >= count) {
        pool = filtered;
      }
    }

    // Fisher-Yates shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    // Prioritize distinct countries for maximum diversity across rounds
    const selected: SongTrack[] = [];
    const usedCountries = new Set<string>();
    const remaining: SongTrack[] = [];

    for (const track of pool) {
      if (!usedCountries.has(track.countryCode) && selected.length < count) {
        selected.push(track);
        usedCountries.add(track.countryCode);
      } else {
        remaining.push(track);
      }
    }

    while (selected.length < count && remaining.length > 0) {
      selected.push(remaining.shift()!);
    }

    return selected;
  }

  /**
   * Plays a live track audio preview.
   */
  async play(track: SongTrack): Promise<void> {
    await this.initialize();
    this.currentTrack = track;
    this.stopSynthFallback();

    this.updateState({
      isLoading: true,
      hasError: false,
      currentTime: 0,
    });

    if (this.audio && track.audioUrl) {
      try {
        this.audio.src = track.audioUrl;
        this.audio.currentTime = track.previewStartTime || 0;
        await this.audio.play();
      } catch {
        console.warn("Audio play blocked or unavailable. Falling back to synth.");
        this.fallbackToLocalOrSynth();
      }
    } else {
      this.fallbackToLocalOrSynth();
    }
  }

  pause(): void {
    if (this.audio && !this.audio.paused) {
      this.audio.pause();
    }
    this.stopSynthFallback();
    this.updateState({ isPlaying: false });
  }

  resume(): void {
    if (this.audio && this.audio.src) {
      this.audio.play().catch(() => this.fallbackToLocalOrSynth());
    } else if (this.currentTrack) {
      this.fallbackToLocalOrSynth();
    }
  }

  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    this.stopSynthFallback();
    this.updateState({ isPlaying: false, currentTime: 0 });
  }

  setVolume(volume: number): void {
    const clamped = Math.max(0, Math.min(1, volume));
    this.state.volume = clamped;
    if (clamped > 0 && this.state.isMuted) {
      this.state.isMuted = false;
    }
    if (this.audio) {
      this.audio.volume = this.state.isMuted ? 0 : clamped * 0.85;
    }
    this.updateState({ volume: clamped, isMuted: this.state.isMuted });
  }

  setMuted(muted: boolean): void {
    this.state.isMuted = muted;
    if (this.audio) {
      this.audio.volume = muted ? 0 : this.state.volume * 0.85;
    }
    this.updateState({ isMuted: muted });
  }

  getPlaybackState(): PlaybackState {
    return { ...this.state };
  }

  onStateChange(listener: (state: PlaybackState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  dispose(): void {
    this.stop();
    if (this.audio) {
      this.audio.src = "";
      this.audio = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.listeners.clear();
  }

  private fallbackToLocalOrSynth(): void {
    this.startSynthFallback();
  }

  // --- Procedural Web Audio Synthesizer Fallback ---
  private initAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.audioContext) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
      }
    }
    if (this.audioContext && this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  private startSynthFallback(): void {
    const ctx = this.initAudioContext();
    if (!ctx) return;

    this.updateState({ isPlaying: true, isLoading: false });

    const notes = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];
    let noteIdx = 0;

    this.stopSynthFallback();
    this.synthInterval = window.setInterval(() => {
      if (!this.state.isPlaying || this.state.isMuted) return;

      const freq = notes[noteIdx % notes.length];
      noteIdx++;

      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        const vol = this.state.volume * 0.15;
        gain.gain.setValueAtTime(vol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.4);

        this.updateState({
          currentTime: Math.min(30, this.state.currentTime + 1),
        });
      } catch (err) {
        console.warn("Synth tone error:", err);
      }
    }, 450);
  }

  private stopSynthFallback(): void {
    if (this.synthInterval !== null) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
  }

  /**
   * Sound effect: Success chime
   */
  playSuccessChime(): void {
    const ctx = this.initAudioContext();
    if (!ctx || this.state.isMuted) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      setTimeout(() => {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          gain.gain.setValueAtTime(this.state.volume * 0.2, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.3);
        } catch {
          // ignore
        }
      }, i * 70);
    });
  }

  /**
   * Sound effect: Miss / Distance thud
   */
  playMissThud(): void {
    const ctx = this.initAudioContext();
    if (!ctx || this.state.isMuted) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(this.state.volume * 0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // ignore
    }
  }

  private updateState(partial: Partial<PlaybackState>): void {
    let hasChanged = false;
    for (const key of Object.keys(partial) as (keyof PlaybackState)[]) {
      if (this.state[key] !== partial[key]) {
        hasChanged = true;
        break;
      }
    }
    if (!hasChanged) return;

    this.state = { ...this.state, ...partial };
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}

export const defaultMusicProvider = new ITunesMusicProvider();
