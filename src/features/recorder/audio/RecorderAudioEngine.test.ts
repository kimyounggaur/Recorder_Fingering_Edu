// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { RecorderAudioEngine } from "./RecorderAudioEngine";
import {
  RECORDER_NOTE_FREQUENCIES_HZ,
  getRecorderNoteFrequency,
} from "./frequencies";
import { WebAudioRecorderEngine } from "./WebAudioRecorderEngine";
import { useRecorderAudio } from "./useRecorderAudio";
import { ALL_NOTE_IDS, NOTE_META } from "../data/noteMeta";

interface AutomationEvent {
  kind: "cancel" | "set" | "linear" | "exponential";
  value?: number;
  time: number;
}

class FakeAudioParam {
  public constructor(public value: number) {}

  public readonly events: AutomationEvent[] = [];

  public cancelScheduledValues(time: number): void {
    this.events.push({ kind: "cancel", time });
  }

  public setValueAtTime(value: number, time: number): void {
    this.value = value;
    this.events.push({ kind: "set", value, time });
  }

  public linearRampToValueAtTime(value: number, time: number): void {
    this.value = value;
    this.events.push({ kind: "linear", value, time });
  }

  public exponentialRampToValueAtTime(value: number, time: number): void {
    this.value = value;
    this.events.push({ kind: "exponential", value, time });
  }
}

class FakeConnectable {
  public readonly connections: unknown[] = [];

  public disconnectCalls = 0;

  public connect(destination: unknown): unknown {
    this.connections.push(destination);
    return destination;
  }

  public disconnect(): void {
    this.disconnectCalls += 1;
    this.connections.length = 0;
  }

  public get isDisconnected(): boolean {
    return this.disconnectCalls > 0;
  }
}

abstract class FakeScheduledSource extends FakeConnectable {
  public onended: (() => void) | null = null;

  public readonly starts: number[] = [];

  public readonly stops: Array<number | undefined> = [];

  public scheduledEndTime: number | null = null;

  public ended = false;

  public constructor(protected readonly context: FakeAudioContext) {
    super();
    context.registerSource(this);
  }

  public stop(time?: number): void {
    this.stops.push(time);
    this.scheduledEndTime = time ?? this.context.currentTime;
  }

  public finish(): void {
    if (this.ended) {
      return;
    }

    this.ended = true;
    this.onended?.();
  }
}

class FakeOscillator extends FakeScheduledSource {
  public type: OscillatorType = "sine";

  public readonly frequency = new FakeAudioParam(440);

  public start(time?: number): void {
    this.starts.push(time ?? this.context.currentTime);
  }
}

class FakeGain extends FakeConnectable {
  public readonly gain = new FakeAudioParam(1);
}

class FakeBiquadFilter extends FakeConnectable {
  public type: BiquadFilterType = "lowpass";

  public readonly frequency = new FakeAudioParam(350);

  public readonly Q = new FakeAudioParam(1);
}

class FakeAudioBuffer {
  public readonly duration: number;

  private readonly channels: Float32Array[];

  public constructor(
    public readonly numberOfChannels: number,
    public readonly length: number,
    public readonly sampleRate: number,
  ) {
    this.duration = length / sampleRate;
    this.channels = Array.from(
      { length: numberOfChannels },
      () => new Float32Array(length),
    );
  }

  public getChannelData(channel: number): Float32Array {
    const data = this.channels[channel];
    if (data === undefined) {
      throw new RangeError(`Missing fake audio channel ${channel}`);
    }
    return data;
  }
}

interface BufferSourceStart {
  when: number;
  offset: number;
  duration?: number;
}

class FakeAudioBufferSource extends FakeScheduledSource {
  public buffer: AudioBuffer | null = null;

  public readonly startDetails: BufferSourceStart[] = [];

  public start(when = this.context.currentTime, offset = 0, duration?: number): void {
    this.starts.push(when);
    this.startDetails.push({ when, offset, duration });

    const bufferDuration =
      duration ?? Math.max(0, (this.buffer?.duration ?? 0) - offset);
    this.scheduledEndTime = when + bufferDuration;
  }
}

class FakeAudioContext {
  public currentTime = 10;

  public readonly sampleRate = 48_000;

  public state: AudioContextState = "suspended";

  public readonly destination = new FakeConnectable();

  public readonly oscillators: FakeOscillator[] = [];

  public readonly gains: FakeGain[] = [];

  public readonly buffers: FakeAudioBuffer[] = [];

  public readonly bufferSources: FakeAudioBufferSource[] = [];

  public readonly filters: FakeBiquadFilter[] = [];

  public readonly nodes: FakeConnectable[] = [];

  private readonly scheduledSources = new Set<FakeScheduledSource>();

  public closeCalls = 0;

  public async resume(): Promise<void> {
    this.state = "running";
  }

  public async close(): Promise<void> {
    this.closeCalls += 1;
    this.state = "closed";
  }

  public createOscillator(): FakeOscillator {
    const oscillator = new FakeOscillator(this);
    this.oscillators.push(oscillator);
    this.nodes.push(oscillator);
    return oscillator;
  }

  public createGain(): FakeGain {
    const gain = new FakeGain();
    this.gains.push(gain);
    this.nodes.push(gain);
    return gain;
  }

  public createBuffer(
    numberOfChannels: number,
    length: number,
    sampleRate: number,
  ): FakeAudioBuffer {
    const buffer = new FakeAudioBuffer(numberOfChannels, length, sampleRate);
    this.buffers.push(buffer);
    return buffer;
  }

  public createBufferSource(): FakeAudioBufferSource {
    const source = new FakeAudioBufferSource(this);
    this.bufferSources.push(source);
    this.nodes.push(source);
    return source;
  }

  public createBiquadFilter(): FakeBiquadFilter {
    const filter = new FakeBiquadFilter();
    this.filters.push(filter);
    this.nodes.push(filter);
    return filter;
  }

  public registerSource(source: FakeScheduledSource): void {
    this.scheduledSources.add(source);
  }

  public advanceTo(time: number): void {
    if (time < this.currentTime) {
      throw new RangeError("The fake audio clock cannot move backwards");
    }

    while (true) {
      const nextSource = [...this.scheduledSources]
        .filter(
          (source) =>
            !source.ended &&
            source.scheduledEndTime !== null &&
            source.scheduledEndTime <= time,
        )
        .sort(
          (left, right) =>
            (left.scheduledEndTime ?? Infinity) -
            (right.scheduledEndTime ?? Infinity),
        )[0];

      if (nextSource === undefined) {
        break;
      }

      this.currentTime = nextSource.scheduledEndTime ?? time;
      nextSource.finish();
    }

    this.currentTime = time;
  }

  public advanceBy(seconds: number): void {
    this.advanceTo(this.currentTime + seconds);
  }

  public asAudioContext(): AudioContext {
    return this as unknown as AudioContext;
  }
}

function hasParamValue(
  parameter: FakeAudioParam,
  expected: number,
  kind?: AutomationEvent["kind"],
): boolean {
  return (
    (kind === undefined && Math.abs(parameter.value - expected) < 0.000_001) ||
    parameter.events.some(
      (event) =>
        (kind === undefined || event.kind === kind) &&
        event.value !== undefined &&
        Math.abs(event.value - expected) < 0.000_001,
    )
  );
}

function findOscillatorAt(
  context: FakeAudioContext,
  frequency: number,
): FakeOscillator {
  const oscillator = context.oscillators.find((candidate) =>
    hasParamValue(candidate.frequency, frequency),
  );

  if (oscillator === undefined) {
    throw new Error(`Missing oscillator at ${frequency} Hz`);
  }
  return oscillator;
}

function findGainAt(context: FakeAudioContext, gain: number): FakeGain {
  const gainNode = context.gains.find((candidate) =>
    hasParamValue(candidate.gain, gain),
  );

  if (gainNode === undefined) {
    throw new Error(`Missing gain node at ${gain}`);
  }
  return gainNode;
}

class DeferredAudioEngine implements RecorderAudioEngine {
  public readonly playedKeys: string[] = [];

  public readonly stopFades: Array<number | undefined> = [];

  public muted = false;

  public disposed = false;

  private finishUnlock: ((unlocked: boolean) => void) | null = null;

  public unlock(): Promise<boolean> {
    return new Promise((resolve) => {
      this.finishUnlock = resolve;
    });
  }

  public resolveUnlock(): void {
    this.finishUnlock?.(true);
  }

  public preload(): Promise<void> {
    return Promise.resolve();
  }

  public play(noteKey: string): Promise<void> {
    this.playedKeys.push(noteKey);
    return Promise.resolve();
  }

  public stop(fadeMs?: number): void {
    this.stopFades.push(fadeMs);
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
  }

  public dispose(): void {
    this.disposed = true;
  }
}

describe("recorder audio pitch mapping", () => {
  it.each([
    ["C4", 261.63],
    ["C#4", 277.18],
    ["D4", 293.66],
    ["D#4", 311.13],
    ["E4", 329.63],
    ["F4", 349.23],
    ["F#4", 369.99],
    ["G4", 392],
    ["G#4", 415.3],
    ["A4", 440],
    ["A#4", 466.16],
    ["B4", 493.88],
    ["C5", 523.25],
    ["D5", 587.33],
    ["E5", 659.25],
    ["F5", 698.46],
    ["G5", 783.99],
  ])("maps %s to %s Hz", (key, expected) => {
    expect(getRecorderNoteFrequency(key)).toBe(expected);
  });

  it("contains all 17 canonical lesson frequencies", () => {
    expect(Object.keys(RECORDER_NOTE_FREQUENCIES_HZ)).toHaveLength(17);
  });

  it("resolves every lesson note's audio key", () => {
    for (const noteId of ALL_NOTE_IDS) {
      expect(
        getRecorderNoteFrequency(NOTE_META[noteId].audioKey),
        noteId,
      ).not.toBeNull();
    }
  });

  it.each([
    ["C", 261.63],
    ["D", 293.66],
    ["E", 329.63],
    ["F", 349.23],
    ["G", 392],
    ["A", 440],
    ["B", 493.88],
    ["HIGH_C", 523.25],
    ["high-c", 523.25],
  ])("keeps the legacy %s alias at %s Hz", (key, expected) => {
    expect(getRecorderNoteFrequency(key)).toBe(expected);
  });

  it("ignores an unknown note safely", () => {
    expect(getRecorderNoteFrequency("not-a-note")).toBeNull();
  });
});

describe("WebAudioRecorderEngine", () => {
  it("builds the recorder partial, chiff, envelope, and vibrato graph", async () => {
    const context = new FakeAudioContext();
    const contextFactory = vi.fn(() => context.asAudioContext());
    const engine = new WebAudioRecorderEngine({
      contextFactory,
      randomSource: () => 0.75,
    });

    await engine.preload();
    await engine.play("C");
    expect(contextFactory).not.toHaveBeenCalled();
    expect(context.oscillators).toHaveLength(0);

    await engine.unlock();
    await engine.play("C");

    expect(contextFactory).toHaveBeenCalledOnce();
    expect(context.oscillators).toHaveLength(4);

    const fundamental = findOscillatorAt(context, 261.63);
    const secondPartial = findOscillatorAt(context, 523.26);
    const thirdPartial = findOscillatorAt(context, 784.89);
    const vibrato = findOscillatorAt(context, 4.5);
    const partials = [fundamental, secondPartial, thirdPartial];

    expect(partials.map((oscillator) => oscillator.type)).toEqual([
      "sine",
      "sine",
      "sine",
    ]);
    expect(
      partials.map((oscillator) => {
        const partialGain = oscillator.connections[0];
        expect(partialGain).toBeInstanceOf(FakeGain);
        return (partialGain as FakeGain).gain.events.find(
          (event) => event.kind === "set",
        )?.value;
      }),
    ).toEqual([1, 0.18, 0.08]);

    const masterEnvelope = context.gains.find((gainNode) =>
      gainNode.gain.events.some(
        (event) =>
          event.kind === "linear" &&
          event.value === 1 &&
          Math.abs(event.time - 10.04) < 0.000_001,
      ),
    );
    expect(masterEnvelope).toBeDefined();
    const expressionGain = masterEnvelope?.connections[0];
    expect(expressionGain).toBeInstanceOf(FakeGain);
    const outputGain = (expressionGain as FakeGain).connections[0];
    expect(outputGain).toBeInstanceOf(FakeGain);
    expect((outputGain as FakeGain).connections).toEqual([
      context.destination,
    ]);
    for (const partial of partials) {
      expect((partial.connections[0] as FakeGain).connections).toEqual([
        masterEnvelope,
      ]);
    }
    expect(masterEnvelope?.gain.events).toContainEqual({
      kind: "set",
      value: 0.8,
      time: 10.5,
    });
    expect(masterEnvelope?.gain.events).toContainEqual({
      kind: "exponential",
      value: 0.0001,
      time: 10.7,
    });

    expect(context.bufferSources).toHaveLength(1);
    expect(context.buffers).toHaveLength(1);
    expect(context.buffers[0].numberOfChannels).toBe(1);
    expect(context.buffers[0].length).toBe(1_440);
    expect(context.buffers[0].duration).toBeCloseTo(0.03);
    expect(context.buffers[0].getChannelData(0)[0]).toBe(0.5);
    expect(context.bufferSources[0].stops[0]).toBeCloseTo(10.03);

    expect(context.filters).toHaveLength(1);
    expect(context.filters[0].type).toBe("bandpass");
    expect(hasParamValue(context.filters[0].frequency, 523.26)).toBe(true);
    expect(hasParamValue(context.filters[0].Q, 8)).toBe(true);

    const noiseGain = findGainAt(context, 0.12);
    expect(context.bufferSources[0].connections).toEqual([
      context.filters[0],
    ]);
    expect(context.filters[0].connections).toEqual([noiseGain]);
    expect(noiseGain.connections).toEqual([masterEnvelope]);
    expect(noiseGain.gain.events).toContainEqual({
      kind: "exponential",
      value: 0.0001,
      time: 10.03,
    });

    const vibratoDepth = findGainAt(context, 0.02);
    expect(vibrato.type).toBe("sine");
    expect(vibrato.connections).toEqual([vibratoDepth]);
    expect(vibratoDepth.connections).toEqual([
      (expressionGain as FakeGain).gain,
    ]);

    for (const source of [fundamental, secondPartial, thirdPartial, vibrato]) {
      expect(source.starts).toEqual([10]);
      expect(source.stops[0]).toBeCloseTo(10.72);
    }
  });

  it("supports the 500ms practice duration", async () => {
    const context = new FakeAudioContext();
    const engine = new WebAudioRecorderEngine({
      contextFactory: () => context.asAudioContext(),
      durationMs: 500,
    });

    await engine.unlock();
    await engine.play("D");

    const masterEnvelope = context.gains.find((gainNode) =>
      gainNode.gain.events.some(
        (event) =>
          event.kind === "exponential" &&
          event.value === 0.0001 &&
          Math.abs(event.time - 10.5) < 0.000_001,
      ),
    );
    expect(masterEnvelope).toBeDefined();
    expect(masterEnvelope?.gain.events).toContainEqual({
      kind: "set",
      value: 0.8,
      time: 10.3,
    });
    expect(findOscillatorAt(context, 293.66).stops[0]).toBeCloseTo(10.52);
  });

  it("can disable vibrato without changing the three carrier partials", async () => {
    const context = new FakeAudioContext();
    const engine = new WebAudioRecorderEngine({
      contextFactory: () => context.asAudioContext(),
      vibratoEnabled: false,
    });

    await engine.unlock();
    await engine.play("A");

    expect(context.oscillators).toHaveLength(3);
    expect(
      context.oscillators.map((oscillator) =>
        oscillator.frequency.events.find(
          (event) => event.kind === "set",
        )?.value,
      ),
    ).toEqual([440, 880, 1_320]);
    expect(context.gains.some((gain) => hasParamValue(gain.gain, 0.02))).toBe(
      false,
    );
  });

  it("fades a replaced voice for 80ms and disconnects its complete graph", async () => {
    const context = new FakeAudioContext();
    const engine = new WebAudioRecorderEngine({
      contextFactory: () => context.asAudioContext(),
    });

    await engine.unlock();
    await engine.play("C");
    const firstVoiceNodes = [...context.nodes];
    const firstMasterEnvelope = context.gains[0];

    context.advanceTo(10.1);
    await engine.play("HIGH_C");

    expect(firstMasterEnvelope.gain.events).toContainEqual({
      kind: "exponential",
      value: 0.0001,
      time: 10.18,
    });
    expect(findOscillatorAt(context, 261.63).stops.at(-1)).toBeCloseTo(
      10.185,
    );

    context.advanceTo(10.184);
    expect(firstVoiceNodes.some((node) => !node.isDisconnected)).toBe(true);

    context.advanceTo(10.185);
    expect(firstVoiceNodes.every((node) => node.isDisconnected)).toBe(true);
    expect(
      context.nodes
        .slice(firstVoiceNodes.length)
        .some((node) => !node.isDisconnected),
    ).toBe(true);
  });

  it("survives 30 rapid notes, reuses one context, and releases every graph", async () => {
    const context = new FakeAudioContext();
    const contextFactory = vi.fn(() => context.asAudioContext());
    const engine = new WebAudioRecorderEngine({ contextFactory });
    const noteKeys = ["C", "D", "E", "F", "G", "A", "B", "HIGH_C", "D5"];
    const voiceNodes: FakeConnectable[][] = [];

    await engine.unlock();
    for (let index = 0; index < 30; index += 1) {
      const firstNodeIndex = context.nodes.length;
      await engine.play(noteKeys[index % noteKeys.length]);
      voiceNodes.push(context.nodes.slice(firstNodeIndex));
    }

    expect(contextFactory).toHaveBeenCalledOnce();
    expect(voiceNodes).toHaveLength(30);
    expect(context.oscillators).toHaveLength(120);
    expect(context.bufferSources).toHaveLength(30);

    context.advanceBy(0.09);
    for (const replacedVoice of voiceNodes.slice(0, -1)) {
      expect(replacedVoice.every((node) => node.isDisconnected)).toBe(true);
    }
    expect(voiceNodes.at(-1)?.some((node) => !node.isDisconnected)).toBe(true);

    context.advanceTo(10.73);
    expect(context.nodes.every((node) => node.isDisconnected)).toBe(true);
  });

  it("disconnects immediately and closes the context once on dispose", async () => {
    const context = new FakeAudioContext();
    const contextFactory = vi.fn(() => context.asAudioContext());
    const engine = new WebAudioRecorderEngine({ contextFactory });

    await engine.unlock();
    await engine.play("G");
    const nodeCount = context.nodes.length;

    engine.dispose();
    engine.dispose();
    await Promise.resolve();

    expect(context.nodes.every((node) => node.isDisconnected)).toBe(true);
    expect(
      [...context.oscillators, ...context.bufferSources].every((source) =>
        source.stops.some((time) => time === 10),
      ),
    ).toBe(true);
    expect(context.closeCalls).toBe(1);
    await expect(engine.unlock()).resolves.toBe(false);
    await engine.play("A");
    expect(context.nodes).toHaveLength(nodeCount);
  });

  it("falls back safely when Web Audio is unavailable", async () => {
    const engine = new WebAudioRecorderEngine({ contextFactory: () => null });

    await expect(engine.unlock()).resolves.toBe(false);
    await expect(engine.play("C")).resolves.toBeUndefined();
    expect(() => engine.stop()).not.toThrow();
    expect(() => engine.dispose()).not.toThrow();
  });
});

describe("useRecorderAudio", () => {
  it("delegates default fades and only cancels the current request", () => {
    const engine = new DeferredAudioEngine();
    const { result, unmount } = renderHook(() =>
      useRecorderAudio({
        engineFactory: () => engine,
        persistMuted: false,
      }),
    );

    let firstRequest = 0;
    let latestRequest = 0;
    act(() => {
      firstRequest = result.current.beginPlaybackRequest();
      latestRequest = result.current.beginPlaybackRequest();
    });
    expect(engine.stopFades).toEqual([undefined, undefined]);

    act(() => result.current.cancelPlaybackRequest(firstRequest));
    expect(engine.stopFades).toEqual([undefined, undefined]);

    act(() => result.current.cancelPlaybackRequest(latestRequest));
    expect(engine.stopFades).toEqual([undefined, undefined, undefined]);

    act(() => result.current.stop(35));
    expect(engine.stopFades).toEqual([undefined, undefined, undefined, 35]);

    unmount();
  });

  it("drops stale contact callbacks and only plays the latest request", async () => {
    const engine = new DeferredAudioEngine();
    const { result, unmount } = renderHook(() =>
      useRecorderAudio({
        engineFactory: () => engine,
        persistMuted: false,
      }),
    );

    let firstRequest = 0;
    let latestRequest = 0;
    act(() => {
      firstRequest = result.current.beginPlaybackRequest();
      latestRequest = result.current.beginPlaybackRequest();
    });

    const staleContact = result.current.playAtContact("C", firstRequest);
    const latestContact = result.current.playAtContact("G", latestRequest);

    let stalePlayed = true;
    let latestPlayed = false;
    await act(async () => {
      engine.resolveUnlock();
      [stalePlayed, latestPlayed] = await Promise.all([
        staleContact,
        latestContact,
      ]);
    });

    expect(stalePlayed).toBe(false);
    expect(latestPlayed).toBe(true);
    expect(engine.playedKeys).toEqual(["G"]);

    act(() => result.current.setMuted(true));
    expect(engine.muted).toBe(true);

    unmount();
    expect(engine.disposed).toBe(true);
  });

  it("retries unlock after a transient failure", async () => {
    const unlock = vi
      .fn<() => Promise<boolean>>()
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);
    const engine: RecorderAudioEngine = {
      unlock,
      preload: vi.fn(async () => undefined),
      play: vi.fn(async () => undefined),
      stop: vi.fn(),
      setMuted: vi.fn(),
      dispose: vi.fn(),
    };
    const { result } = renderHook(() =>
      useRecorderAudio({
        engineFactory: () => engine,
        persistMuted: false,
      }),
    );

    act(() => {
      result.current.beginPlaybackRequest();
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(result.current.isUnlocked).toBe(false);

    act(() => {
      result.current.beginPlaybackRequest();
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(unlock).toHaveBeenCalledTimes(2);
    expect(result.current.isUnlocked).toBe(true);
  });
});
