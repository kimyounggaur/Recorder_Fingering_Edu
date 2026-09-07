// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { RecorderAudioEngine } from "./RecorderAudioEngine";
import {
  RECORDER_NOTE_FREQUENCIES_HZ,
  WebAudioRecorderEngine,
  getRecorderNoteFrequency,
} from "./WebAudioRecorderEngine";
import { useRecorderAudio } from "./useRecorderAudio";

interface AutomationEvent {
  kind: "cancel" | "set" | "linear" | "exponential";
  value?: number;
  time: number;
}

class FakeAudioParam {
  public value = 0.125;

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

class FakeOscillator {
  public type: OscillatorType = "sine";

  public readonly frequency = new FakeAudioParam();

  public onended: (() => void) | null = null;

  public readonly starts: number[] = [];

  public readonly stops: Array<number | undefined> = [];

  public connect<T>(node: T): T { return node; }

  public readonly disconnect = vi.fn();

  public start(time?: number): void {
    this.starts.push(time ?? 0);
  }

  public stop(time?: number): void {
    this.stops.push(time);
  }
}

class FakeGain {
  public readonly gain = new FakeAudioParam();

  public connect<T>(node: T): T { return node; }

  public readonly disconnect = vi.fn();
}

class FakeBufferSource extends FakeOscillator { public buffer: AudioBuffer | null = null; }
class FakeFilter extends FakeGain {
  public type: BiquadFilterType = "lowpass";
  public readonly frequency = new FakeAudioParam();
  public readonly Q = new FakeAudioParam();
}

class FakeAudioContext {
  public readonly sampleRate = 48000;
  public readonly buffers: FakeBufferSource[] = [];
  public readonly filters: FakeFilter[] = [];
  public bufferCreations = 0;
  public createBuffer(_channels: number, length: number, sampleRate: number): AudioBuffer {
    this.bufferCreations += 1;
    return { getChannelData: () => new Float32Array(length), length, sampleRate } as unknown as AudioBuffer;
  }
  public createBufferSource(): FakeBufferSource {
    const source = new FakeBufferSource();
    this.buffers.push(source);
    return source;
  }
  public createBiquadFilter(): FakeFilter {
    const filter = new FakeFilter();
    this.filters.push(filter);
    return filter;
  }
  public currentTime = 10;

  public state: AudioContextState = "suspended";

  public readonly destination = {};

  public readonly oscillators: FakeOscillator[] = [];

  public readonly gains: FakeGain[] = [];

  public closeCalls = 0;

  public async resume(): Promise<void> {
    this.state = "running";
  }

  public async close(): Promise<void> {
    this.closeCalls += 1;
    this.state = "closed";
  }

  public createOscillator(): FakeOscillator {
    const oscillator = new FakeOscillator();
    this.oscillators.push(oscillator);
    return oscillator;
  }

  public createGain(): FakeGain {
    const gain = new FakeGain();
    this.gains.push(gain);
    return gain;
  }

  public asAudioContext(): AudioContext {
    return this as unknown as AudioContext;
  }
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
    expect(getRecorderNoteFrequency(key, "written")).toBeCloseTo(expected, 1);
    expect(getRecorderNoteFrequency(key)).toBeCloseTo(expected * 2, 1);
  });

  it("contains all 17 canonical lesson frequencies", () => {
    expect(Object.keys(RECORDER_NOTE_FREQUENCIES_HZ)).toHaveLength(17);
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
    expect(getRecorderNoteFrequency(key, "written")).toBeCloseTo(expected, 1);
    expect(getRecorderNoteFrequency(key)).toBeCloseTo(expected * 2, 1);
  });

  it("ignores an unknown note safely", () => {
    expect(getRecorderNoteFrequency("not-a-note")).toBeNull();
  });
});

describe("WebAudioRecorderEngine", () => {
  it("mixes three sine harmonics, a chiff, and optional vibrato and releases 30 rapid voices", async () => {
    const context = new FakeAudioContext();
    const engine = new WebAudioRecorderEngine({ contextFactory: () => context.asAudioContext(), vibrato: false });
    await engine.unlock();
    await engine.play("C");
    expect(context.oscillators).toHaveLength(3);
    expect(context.oscillators.map(osc => osc.frequency.value)).toEqual([523.25, 1046.5, 1569.75]);
    expect(context.buffers).toHaveLength(1);
    expect(context.filters).toHaveLength(1);
    expect(context.filters[0].type).toBe("bandpass");
    expect(context.filters[0].Q.value).toBe(6);
    expect(context.gains[0].gain.events).toContainEqual({ kind: "linear", value: 0.18, time: 10.035 });
    for (let index = 1; index < 30; index += 1) await engine.play("G5");
    expect(context.bufferCreations).toBe(1);
    engine.stop();
    for (const source of [...context.oscillators, ...context.buffers]) source.onended?.();
    expect(engine.activeVoiceCount).toBe(0);
    for (const node of [...context.oscillators, ...context.buffers, ...context.gains, ...context.filters]) expect(node.disconnect).toHaveBeenCalled();
    engine.dispose();
  });

  it("enables 4.5Hz modulation by default and attenuates high sounding notes", async () => {
    const context = new FakeAudioContext();
    const engine = new WebAudioRecorderEngine({ contextFactory: () => context.asAudioContext() });
    await engine.unlock();
    await engine.play("G5");
    expect(context.oscillators).toHaveLength(4);
    expect(context.oscillators.at(-1)!.frequency.value).toBe(4.5);
    expect(context.gains[0].gain.events).toContainEqual({ kind: "linear", value: 0.135, time: 10.035 });
    engine.dispose();
    expect(engine.activeVoiceCount).toBe(0);
  });
  it("waits for unlock, shapes a 780ms note, fades replacements, and cleans up", async () => {
    const context = new FakeAudioContext();
    const contextFactory = vi.fn(() => context.asAudioContext());
    const engine = new WebAudioRecorderEngine({ contextFactory, timbre: "triangle" });

    await engine.preload();
    await engine.play("C");
    expect(contextFactory).not.toHaveBeenCalled();
    expect(context.oscillators).toHaveLength(0);

    await engine.unlock();
    await engine.play("C");

    expect(contextFactory).toHaveBeenCalledOnce();
    expect(context.oscillators).toHaveLength(1);
    expect(context.oscillators[0].type).toBe("triangle");
    expect(context.oscillators[0].frequency.events).toContainEqual({
      kind: "set",
      value: 523.25,
      time: 10,
    });
    expect(context.oscillators[0].stops[0]).toBeCloseTo(10.8);
    expect(context.gains[0].gain.events).toContainEqual({
      kind: "exponential",
      value: 0.0001,
      time: 10.78,
    });

    context.currentTime = 10.1;
    await engine.play("HIGH_C");
    expect(context.oscillators).toHaveLength(2);
    expect(context.oscillators[0].stops.at(-1)).toBeCloseTo(10.16);

    engine.setMuted(true);
    await engine.play("D");
    expect(context.oscillators).toHaveLength(2);

    engine.dispose();
    await Promise.resolve();
    expect(context.closeCalls).toBe(1);
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
  it("recreates pitch-mode engines and rejects an old pending unlock", async () => {
    const first = new DeferredAudioEngine();
    const second = new DeferredAudioEngine();
    const factory = vi.fn().mockReturnValueOnce(first).mockReturnValue(second);
    const { result, rerender, unmount } = renderHook(
      ({ pitchMode }: { pitchMode: "written" | "sounding" }) => useRecorderAudio({ engineFactory: factory, pitchMode, persistMuted: false }),
      { initialProps: { pitchMode: "sounding" } },
    );
    let stale = 0;
    act(() => { stale = result.current.beginPlaybackRequest(); });
    rerender({ pitchMode: "written" });
    expect(first.disposed).toBe(true);
    await act(async () => { first.resolveUnlock(); await Promise.resolve(); });
    expect(result.current.isUnlocked).toBe(false);
    await expect(result.current.playAtContact("C", stale)).resolves.toBe(false);
    let latest = 0;
    act(() => { latest = result.current.beginPlaybackRequest(); });
    await act(async () => { second.resolveUnlock(); await Promise.resolve(); });
    await expect(result.current.playAtContact("C", latest)).resolves.toBe(true);
    expect(factory).toHaveBeenLastCalledWith({ pitchMode: "written" });
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
