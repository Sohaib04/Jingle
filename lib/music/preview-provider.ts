import { IMusicProvider, PlaybackState } from "./provider";
import { SongTrack } from "@/lib/game/types";
import { MOCK_GLOBAL_SONGS } from "./mock-data";

export class PreviewMusicProvider implements IMusicProvider {
  readonly id = "preview";
  readonly name = "Jingle Audio Previews";

  private audio: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private synthInterval: number | null = null;
  private currentTrack: SongTrack | null = null;
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

  async initialize(): Promise<void> {
    if (typeof window === "undefined") return;

    if (!this.audio) {
      this.audio = new Audio();
      this.audio.preload = "auto";
      this.audio.volume = this.state.volume;

      this.audio.addEventListener("playing", () => {
        this.updateState({ isPlaying: true, isLoading: false });
      });

      this.audio.addEventListener("pause", () => {
        this.updateState({ isPlaying: false });
      });

      this.audio.addEventListener("timeupdate", () => {
        if (this.audio) {
          this.updateState({
            currentTime: Math.floor(this.audio.currentTime),
            duration: Math.floor(this.audio.duration || 30),
          });
        }
      });

      this.audio.addEventListener("ended", () => {
        this.updateState({ isPlaying: false, currentTime: 0 });
      });

      this.audio.addEventListener("error", () => {
        console.warn("Audio source error, switching to procedural audio synth fallback.");
        this.updateState({ hasError: true, isLoading: false });
        this.startSynthFallback();
      });
    }
  }

  async getTracksForGame(count: number = 10, difficulty?: string): Promise<SongTrack[]> {
    let pool = [...MOCK_GLOBAL_SONGS];
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

    return pool.slice(0, count);
  }

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
        this.startSynthFallback();
      }
    } else {
      this.startSynthFallback();
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
      this.audio.play().catch(() => this.startSynthFallback());
    } else if (this.currentTrack) {
      this.startSynthFallback();
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
    if (this.audio) {
      this.audio.volume = this.state.isMuted ? 0 : clamped;
    }
    this.updateState({ volume: clamped });
  }

  setMuted(muted: boolean): void {
    this.state.isMuted = muted;
    if (this.audio) {
      this.audio.volume = muted ? 0 : this.state.volume;
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

  // --- Procedural Web Audio Synthesizer Fallback ---
  private initAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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

    // Play a repeating rhythmic melodic chord progression
    const pentatonicNotes = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];
    let noteIdx = 0;

    this.stopSynthFallback();
    this.synthInterval = window.setInterval(() => {
      if (!this.state.isPlaying || this.state.isMuted) return;

      const freq = pentatonicNotes[noteIdx % pentatonicNotes.length];
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
    this.state = { ...this.state, ...partial };
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}

export const defaultMusicProvider = new PreviewMusicProvider();
