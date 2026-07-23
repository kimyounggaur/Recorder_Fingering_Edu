import type { RecorderAudioEngine } from "./RecorderAudioEngine";
import { getRecorderNoteFrequency } from "./frequencies";

export {
  BASIC_RECORDER_DEMO_AUDIO_KEYS,
  RECORDER_AUDIO_KEY_TO_PITCH,
  RECORDER_NOTE_FREQUENCIES_HZ,
  getRecorderNoteFrequency,
} from "./frequencies";
export type { RecorderPitchKey } from "./frequencies";

export const DEFAULT_RECORDER_NOTE_DURATION_MS = 700;
export const PRACTICE_RECORDER_NOTE_DURATION_MS = 500;
export const DEFAULT_RECORDER_TRANSITION_FADE_MS = 80;

export const RECORDER_SYNTHESIS_PROFILE = {
  partials: [
    { harmonic: 1, gain: 1 },
    { harmonic: 2, gain: 0.18 },
    { harmonic: 3, gain: 0.08 },
  ],
  chiffDurationMs: 30,
  chiffGain: 0.12,
  chiffFilterQ: 8,
  attackMs: 40,
  sustainLevel: 0.8,
  releaseMs: 200,
  vibratoRateHz: 4.5,
  vibratoDepth: 0.02,
} as const;

export interface WebAudioRecorderEngineOptions {
  /** Dependency seam for deterministic unit tests. */
  contextFactory?: () => AudioContext | null;
  /** Defaults to 700 ms. Pass 500 ms for practice and quiz feedback. */
  durationMs?: number;
  /** Tail release within the note envelope. */
  fadeOutMs?: number;
  /** Fade used when a newer note supersedes the current one. */
  transitionFadeMs?: number;
  /** Disable the subtle 4.5 Hz, ±2% expression when a steadier tone is needed. */
  vibratoEnabled?: boolean;
  /** Amplitude depth from 0 to 4%; defaults to 2%. */
  vibratoDepth?: number;
  /** Random source for the short chiff buffer; useful in deterministic tests. */
  randomSource?: () => number;
}

type VoiceSource = OscillatorNode | AudioBufferSourceNode;

interface ActiveVoice {
  primaryOscillator: OscillatorNode;
  continuousSources: OscillatorNode[];
  sources: VoiceSource[];
  nodes: AudioNode[];
  masterEnvelope: GainNode;
  stopAt: number;
  ended: boolean;
}

const MIN_GAIN = 0.0001;
const OUTPUT_GAIN = 0.16;
const MIN_DURATION_MS = 300;
const MAX_DURATION_MS = 2_000;
const SOURCE_TAIL_SECONDS = 0.02;
const TRANSITION_STOP_PADDING_SECONDS = 0.005;

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

function setAudioParam(
  parameter: AudioParam,
  value: number,
  at: number,
): void {
  parameter.setValueAtTime(value, at);
}

function cancelAndHoldAudioParam(
  parameter: AudioParam,
  at: number,
  fallbackValue: number,
): void {
  try {
    parameter.cancelAndHoldAtTime(at);
  } catch {
    parameter.cancelScheduledValues(at);
    parameter.setValueAtTime(
      clamp(finiteOr(parameter.value, fallbackValue), MIN_GAIN, 1),
      at,
    );
  }
}

function stopSource(source: VoiceSource, at?: number): void {
  try {
    if (at === undefined) {
      source.stop();
    } else {
      source.stop(at);
    }
  } catch {
    // A partially-created or already-ended source is safe to ignore.
  }
}

function disconnectNode(node: AudioNode): void {
  try {
    node.disconnect();
  } catch {
    // A node can already be disconnected by a browser after ending.
  }
}

/**
 * Recorder-like synthesized fallback. AudioContext creation remains gated by
 * unlock(), while every note gets its own short-lived synthesis graph.
 */
export class WebAudioRecorderEngine implements RecorderAudioEngine {
  private readonly contextFactory: () => AudioContext | null;

  private readonly durationMs: number;

  private readonly releaseMs: number;

  private readonly transitionFadeMs: number;

  private readonly vibratoEnabled: boolean;

  private readonly vibratoDepth: number;

  private readonly randomSource: () => number;

  private context: AudioContext | null = null;

  private readonly voices = new Set<ActiveVoice>();

  private requestId = 0;

  private unlocked = false;

  private muted = false;

  private disposed = false;

  public constructor(options: WebAudioRecorderEngineOptions = {}) {
    this.contextFactory = options.contextFactory ?? createBrowserAudioContext;
    this.durationMs = clamp(
      finiteOr(options.durationMs, DEFAULT_RECORDER_NOTE_DURATION_MS),
      MIN_DURATION_MS,
      MAX_DURATION_MS,
    );
    this.releaseMs = clamp(
      finiteOr(options.fadeOutMs, RECORDER_SYNTHESIS_PROFILE.releaseMs),
      50,
      Math.max(
        50,
        this.durationMs - RECORDER_SYNTHESIS_PROFILE.attackMs - 20,
      ),
    );
    this.transitionFadeMs = clamp(
      finiteOr(
        options.transitionFadeMs,
        DEFAULT_RECORDER_TRANSITION_FADE_MS,
      ),
      0,
      500,
    );
    this.vibratoEnabled = options.vibratoEnabled ?? true;
    this.vibratoDepth = clamp(
      finiteOr(options.vibratoDepth, RECORDER_SYNTHESIS_PROFILE.vibratoDepth),
      0,
      0.04,
    );
    this.randomSource = options.randomSource ?? Math.random;
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
    const sources: VoiceSource[] = [];
    const continuousSources: OscillatorNode[] = [];
    const nodes: AudioNode[] = [];
    let voice: ActiveVoice | null = null;

    try {
      const now = context.currentTime;
      const endAt = now + this.durationMs / 1_000;
      const attackAt =
        now + RECORDER_SYNTHESIS_PROFILE.attackMs / 1_000;
      const releaseAt = Math.max(
        attackAt + 0.02,
        endAt - this.releaseMs / 1_000,
      );
      const sustainAt = Math.min(releaseAt, attackAt + 0.04);
      const stopAt = endAt + SOURCE_TAIL_SECONDS;

      const masterEnvelope = context.createGain();
      const expressionGain = context.createGain();
      const outputGain = context.createGain();
      nodes.push(masterEnvelope, expressionGain, outputGain);

      masterEnvelope.gain.cancelScheduledValues(now);
      masterEnvelope.gain.setValueAtTime(MIN_GAIN, now);
      masterEnvelope.gain.linearRampToValueAtTime(1, attackAt);
      masterEnvelope.gain.exponentialRampToValueAtTime(
        RECORDER_SYNTHESIS_PROFILE.sustainLevel,
        sustainAt,
      );
      masterEnvelope.gain.setValueAtTime(
        RECORDER_SYNTHESIS_PROFILE.sustainLevel,
        releaseAt,
      );
      masterEnvelope.gain.exponentialRampToValueAtTime(MIN_GAIN, endAt);

      expressionGain.gain.cancelScheduledValues(now);
      setAudioParam(expressionGain.gain, 1, now);
      outputGain.gain.cancelScheduledValues(now);
      setAudioParam(outputGain.gain, OUTPUT_GAIN, now);

      masterEnvelope.connect(expressionGain);
      expressionGain.connect(outputGain);
      outputGain.connect(context.destination);

      const carrierOscillators = RECORDER_SYNTHESIS_PROFILE.partials.map(
        (partial) => {
          const oscillator = context.createOscillator();
          const partialGain = context.createGain();
          nodes.push(oscillator, partialGain);
          sources.push(oscillator);
          continuousSources.push(oscillator);

          oscillator.type = "sine";
          oscillator.frequency.setValueAtTime(
            frequency * partial.harmonic,
            now,
          );
          partialGain.gain.cancelScheduledValues(now);
          setAudioParam(partialGain.gain, partial.gain, now);

          oscillator.connect(partialGain);
          partialGain.connect(masterEnvelope);
          return oscillator;
        },
      );

      if (this.vibratoEnabled && this.vibratoDepth > 0) {
        const lfo = context.createOscillator();
        const lfoDepth = context.createGain();
        nodes.push(lfo, lfoDepth);
        sources.push(lfo);
        continuousSources.push(lfo);

        lfo.type = "sine";
        lfo.frequency.setValueAtTime(
          RECORDER_SYNTHESIS_PROFILE.vibratoRateHz,
          now,
        );
        lfoDepth.gain.cancelScheduledValues(now);
        setAudioParam(lfoDepth.gain, this.vibratoDepth, now);
        lfo.connect(lfoDepth);
        lfoDepth.connect(expressionGain.gain);
      }

      const noiseSource = context.createBufferSource();
      const noiseFilter = context.createBiquadFilter();
      const noiseGain = context.createGain();
      nodes.push(noiseSource, noiseFilter, noiseGain);
      sources.push(noiseSource);

      const sampleRate = finiteOr(context.sampleRate, 48_000);
      const noiseFrameCount = Math.max(
        1,
        Math.round(
          sampleRate * RECORDER_SYNTHESIS_PROFILE.chiffDurationMs / 1_000,
        ),
      );
      const noiseBuffer = context.createBuffer(
        1,
        noiseFrameCount,
        sampleRate,
      );
      const noiseData = noiseBuffer.getChannelData(0);
      for (let index = 0; index < noiseData.length; index += 1) {
        noiseData[index] = this.randomSource() * 2 - 1;
      }
      noiseSource.buffer = noiseBuffer;

      noiseFilter.type = "bandpass";
      noiseFilter.frequency.setValueAtTime(
        Math.min(frequency * 2, sampleRate * 0.45),
        now,
      );
      noiseFilter.Q.setValueAtTime(
        RECORDER_SYNTHESIS_PROFILE.chiffFilterQ,
        now,
      );
      noiseGain.gain.cancelScheduledValues(now);
      noiseGain.gain.setValueAtTime(
        RECORDER_SYNTHESIS_PROFILE.chiffGain,
        now,
      );
      noiseGain.gain.exponentialRampToValueAtTime(
        MIN_GAIN,
        now + RECORDER_SYNTHESIS_PROFILE.chiffDurationMs / 1_000,
      );

      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(masterEnvelope);

      const primaryOscillator = carrierOscillators[0];
      voice = {
        primaryOscillator,
        continuousSources,
        sources,
        nodes,
        masterEnvelope,
        stopAt,
        ended: false,
      };
      primaryOscillator.onended = () => this.releaseVoice(voice!);
      this.voices.add(voice);

      for (const source of continuousSources) {
        source.start(now);
        source.stop(stopAt);
      }
      noiseSource.start(now);
      noiseSource.stop(
        now + RECORDER_SYNTHESIS_PROFILE.chiffDurationMs / 1_000,
      );
    } catch {
      if (voice !== null) {
        for (const source of voice.sources) {
          stopSource(source);
        }
        this.releaseVoice(voice);
        return;
      }

      for (const source of sources) {
        stopSource(source);
      }
      for (const node of new Set(nodes)) {
        disconnectNode(node);
      }
    }
  }

  private fadeAllVoices(fadeMs: number): void {
    for (const voice of this.voices) {
      this.fadeVoice(voice, fadeMs);
    }
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
      cancelAndHoldAudioParam(
        voice.masterEnvelope.gain,
        now,
        RECORDER_SYNTHESIS_PROFILE.sustainLevel,
      );

      if (stopAt > now) {
        voice.masterEnvelope.gain.exponentialRampToValueAtTime(
          MIN_GAIN,
          stopAt,
        );
      } else {
        voice.masterEnvelope.gain.setValueAtTime(MIN_GAIN, now);
      }

      if (stopAt < voice.stopAt) {
        voice.stopAt = stopAt;
        for (const source of voice.continuousSources) {
          stopSource(source, stopAt + TRANSITION_STOP_PADDING_SECONDS);
        }
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
          voice.masterEnvelope.gain.cancelScheduledValues(now);
          voice.masterEnvelope.gain.setValueAtTime(MIN_GAIN, now);
        }
      } catch {
        // Continue with source shutdown and graph cleanup.
      }

      for (const source of voice.sources) {
        stopSource(source, now);
      }
      this.releaseVoice(voice);
    }
  }

  private releaseVoice(voice: ActiveVoice): void {
    if (voice.ended) {
      return;
    }

    voice.ended = true;
    voice.primaryOscillator.onended = null;
    this.voices.delete(voice);

    for (const node of new Set(voice.nodes)) {
      disconnectNode(node);
    }
  }
}

export function createWebAudioRecorderEngine(
  options?: WebAudioRecorderEngineOptions,
): RecorderAudioEngine {
  return new WebAudioRecorderEngine(options);
}
