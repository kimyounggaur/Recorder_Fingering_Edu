import type { RecorderAudioEngine } from "./RecorderAudioEngine";

export const RECORDER_NOTE_FREQUENCIES_HZ = {
  C4: 261.63,
  "C#4": 277.18,
  D4: 293.66,
  "D#4": 311.13,
  E4: 329.63,
  F4: 349.23,
  "F#4": 369.99,
  G4: 392,
  "G#4": 415.3,
  A4: 440,
  "A#4": 466.16,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  F5: 698.46,
  G5: 783.99,
} as const;

export type RecorderPitchKey = keyof typeof RECORDER_NOTE_FREQUENCIES_HZ;

/**
 * The short keys are the values used by NOTE_META. Canonical pitch keys are
 * accepted too, which makes swapping in named sample files straightforward.
 */
export const RECORDER_AUDIO_KEY_TO_PITCH: Readonly<
  Record<string, RecorderPitchKey>
> = {
  C: "C4",
  C4: "C4",
  "C#4": "C#4",
  D: "D4",
  D4: "D4",
  "D#4": "D#4",
  E: "E4",
  E4: "E4",
  F: "F4",
  F4: "F4",
  "F#4": "F#4",
  G: "G4",
  G4: "G4",
  "G#4": "G#4",
  A: "A4",
  A4: "A4",
  "A#4": "A#4",
  B: "B4",
  B4: "B4",
  HIGH_C: "C5",
  "HIGH-C": "C5",
  C5: "C5",
  D5: "D5",
  E5: "E5",
  F5: "F5",
  G5: "G5",
};

export function getRecorderNoteFrequency(noteKey: string): number | null {
  const normalizedKey = noteKey.trim().toUpperCase();
  const pitchKey = RECORDER_AUDIO_KEY_TO_PITCH[normalizedKey];

  return pitchKey === undefined
    ? null
    : RECORDER_NOTE_FREQUENCIES_HZ[pitchKey];
}

export interface WebAudioRecorderEngineOptions {
  /** Dependency seam for deterministic unit tests. */
  contextFactory?: () => AudioContext | null;
  /** Clamped to the product requirement of 600–900 ms. */
  durationMs?: number;
  /** Tail release within the note envelope. */
  fadeOutMs?: number;
  /** Fade used when a newer note supersedes the current one. */
  transitionFadeMs?: number;
}

interface ActiveVoice {
  oscillator: OscillatorNode;
  gainNode: GainNode;
  stopAt: number;
  ended: boolean;
}

const MIN_GAIN = 0.0001;
const PEAK_GAIN = 0.18;
const SUSTAIN_GAIN = 0.125;
const DEFAULT_DURATION_MS = 780;
const DEFAULT_RELEASE_MS = 125;
const DEFAULT_TRANSITION_FADE_MS = 55;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function finiteOr(value: number | undefined, fallback: number): number {
  return value !== undefined && Number.isFinite(value) ? value : fallback;
}

function createBrowserAudioContext(): AudioContext | null {
  if (typeof AudioContext === "undefined") {
    return null;
  }

  try {
    return new AudioContext();
  } catch {
    return null;
  }
}

/**
 * A lightweight synthesized fallback. It never creates an AudioContext until
 * unlock() is called from a user gesture.
 */
export class WebAudioRecorderEngine implements RecorderAudioEngine {
  private readonly contextFactory: () => AudioContext | null;

  private readonly durationMs: number;

  private readonly fadeOutMs: number;

  private readonly transitionFadeMs: number;

  private context: AudioContext | null = null;

  private activeVoice: ActiveVoice | null = null;

  private readonly voices = new Set<ActiveVoice>();

  private requestId = 0;

  private unlocked = false;

  private muted = false;

  private disposed = false;

  public constructor(options: WebAudioRecorderEngineOptions = {}) {
    this.contextFactory = options.contextFactory ?? createBrowserAudioContext;
    this.durationMs = clamp(
      finiteOr(options.durationMs, DEFAULT_DURATION_MS),
      600,
      900,
    );
    this.fadeOutMs = clamp(
      finiteOr(options.fadeOutMs, DEFAULT_RELEASE_MS),
      70,
      Math.min(220, this.durationMs / 2),
    );
    this.transitionFadeMs = clamp(
      finiteOr(options.transitionFadeMs, DEFAULT_TRANSITION_FADE_MS),
      0,
      180,
    );
  }

  public async unlock(): Promise<boolean> {
    if (this.disposed) {
      return false;
    }

    const context = this.getOrCreateContext();
    if (context === null || context.state === "closed") {
      return false;
    }

    try {
      if (context.state !== "running") {
        await context.resume();
      }

      if (!this.disposed) {
        this.unlocked = context.state === "running";
      }
      return this.unlocked;
    } catch {
      // Autoplay policy, missing output devices, and browser audio failures
      // must never break the fingering lesson.
      this.unlocked = false;
      return false;
    }
  }

  public preload(): Promise<void> {
    // The synthesizer has no files to preload. Crucially, this does not create
    // an AudioContext before the first user gesture.
    return Promise.resolve();
  }

  public async play(noteKey: string): Promise<void> {
    const playRequestId = ++this.requestId;
    const frequency = getRecorderNoteFrequency(noteKey);
    const context = this.context;

    if (
      frequency === null ||
      context === null ||
      this.disposed ||
      this.muted ||
      !this.unlocked ||
      context.state === "closed"
    ) {
      return;
    }

    try {
      if (context.state !== "running") {
        await context.resume();
      }
    } catch {
      return;
    }

    if (
      playRequestId !== this.requestId ||
      this.disposed ||
      this.muted ||
      context.state !== "running"
    ) {
      return;
    }

    this.fadeAllVoices(this.transitionFadeMs);
    this.startVoice(context, frequency);
  }

  public stop(fadeMs = this.transitionFadeMs): void {
    this.requestId += 1;
    this.fadeAllVoices(clamp(finiteOr(fadeMs, this.transitionFadeMs), 0, 500));
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted) {
      this.stop(this.transitionFadeMs);
    }
  }

  public dispose(): void {
    if (this.disposed) {
      return;
    }

    this.disposed = true;
    this.unlocked = false;
    this.requestId += 1;
    this.silenceAllVoicesImmediately();

    const context = this.context;
    this.context = null;

    if (context !== null && context.state !== "closed") {
      void context.close().catch(() => undefined);
    }
  }

  private getOrCreateContext(): AudioContext | null {
    if (this.context !== null) {
      return this.context;
    }

    try {
      this.context = this.contextFactory();
    } catch {
      this.context = null;
    }

    return this.context;
  }

  private startVoice(context: AudioContext, frequency: number): void {
    let oscillator: OscillatorNode | null = null;
    let gainNode: GainNode | null = null;

    try {
      const now = context.currentTime;
      const attackSeconds = 0.018;
      const endAt = now + this.durationMs / 1_000;
      const releaseAt = endAt - this.fadeOutMs / 1_000;

      oscillator = context.createOscillator();
      gainNode = context.createGain();

      // A triangle wave is intentionally a neutral temporary timbre, not a
      // claim that this is a sampled acoustic recorder.
      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(frequency, now);

      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.setValueAtTime(MIN_GAIN, now);
      gainNode.gain.linearRampToValueAtTime(PEAK_GAIN, now + attackSeconds);
      gainNode.gain.linearRampToValueAtTime(SUSTAIN_GAIN, releaseAt);
      gainNode.gain.exponentialRampToValueAtTime(MIN_GAIN, endAt);

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      const voice: ActiveVoice = {
        oscillator,
        gainNode,
        stopAt: endAt + 0.02,
        ended: false,
      };

      oscillator.onended = () => this.releaseVoice(voice);
      oscillator.start(now);
      oscillator.stop(voice.stopAt);

      this.voices.add(voice);
      this.activeVoice = voice;
    } catch {
      if (oscillator !== null) {
        try {
          oscillator.stop();
        } catch {
          // It may not have started yet.
        }

        try {
          oscillator.disconnect();
        } catch {
          // Already disconnected.
        }
      }

      if (gainNode !== null) {
        try {
          gainNode.disconnect();
        } catch {
          // Already disconnected.
        }
      }
    }
  }

  private fadeAllVoices(fadeMs: number): void {
    for (const voice of this.voices) {
      this.fadeVoice(voice, fadeMs);
    }

    this.activeVoice = null;
  }

  private fadeVoice(voice: ActiveVoice, fadeMs: number): void {
    if (voice.ended) {
      return;
    }

    const context = this.context;
    if (context === null || context.state === "closed") {
      this.releaseVoice(voice);
      return;
    }

    const now = context.currentTime;
    const requestedStopAt = now + fadeMs / 1_000;
    const stopAt = Math.min(voice.stopAt, requestedStopAt);

    try {
      const currentGain = clamp(
        finiteOr(voice.gainNode.gain.value, SUSTAIN_GAIN),
        MIN_GAIN,
        PEAK_GAIN,
      );
      voice.gainNode.gain.cancelScheduledValues(now);
      voice.gainNode.gain.setValueAtTime(currentGain, now);

      if (stopAt > now) {
        voice.gainNode.gain.exponentialRampToValueAtTime(MIN_GAIN, stopAt);
      } else {
        voice.gainNode.gain.setValueAtTime(MIN_GAIN, now);
      }

      if (stopAt < voice.stopAt) {
        voice.stopAt = stopAt;
        voice.oscillator.stop(stopAt + 0.005);
      }
    } catch {
      this.releaseVoice(voice);
    }
  }

  private silenceAllVoicesImmediately(): void {
    const voices = Array.from(this.voices);
    const now = this.context?.currentTime;

    for (const voice of voices) {
      try {
        if (now !== undefined) {
          voice.gainNode.gain.cancelScheduledValues(now);
          voice.gainNode.gain.setValueAtTime(MIN_GAIN, now);
          voice.oscillator.stop(now);
        } else {
          voice.oscillator.stop();
        }
      } catch {
        // The source may already have ended.
      }

      this.releaseVoice(voice);
    }

    this.activeVoice = null;
  }

  private releaseVoice(voice: ActiveVoice): void {
    if (voice.ended) {
      return;
    }

    voice.ended = true;
    this.voices.delete(voice);
    if (this.activeVoice === voice) {
      this.activeVoice = null;
    }

    try {
      voice.oscillator.disconnect();
    } catch {
      // Already disconnected.
    }

    try {
      voice.gainNode.disconnect();
    } catch {
      // Already disconnected.
    }
  }
}

export function createWebAudioRecorderEngine(
  options?: WebAudioRecorderEngineOptions,
): RecorderAudioEngine {
  return new WebAudioRecorderEngine(options);
}
