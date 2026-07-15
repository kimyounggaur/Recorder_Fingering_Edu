// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { RecorderAudioEngine } from "./RecorderAudioEngine";
import {
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

  public connect(): void {}

  public disconnect(): void {}

  public start(time?: number): void {
    this.starts.push(time ?? 0);
  }

  public stop(time?: number): void {
    this.stops.push(time);
  }
}

class FakeGain {
  public readonly gain = new FakeAudioParam();

  public connect(): void {}

  public disconnect(): void {}
}

class FakeAudioContext {
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
    ["C", 261.63],
    ["D4", 293.66],
    ["E", 329.63],
    ["F4", 349.23],
    ["G", 392],
    ["A4", 440],
    ["B", 493.88],
    ["HIGH_C", 523.25],
    ["C5", 523.25],
  ])("maps %s to %s Hz", (key, expected) => {
    expect(getRecorderNoteFrequency(key)).toBe(expected);
  });

  it("ignores an unknown note safely", () => {
    expect(getRecorderNoteFrequency("not-a-note")).toBeNull();
  });
});

describe("WebAudioRecorderEngine", () => {
  it("waits for unlock, shapes a 780ms note, fades replacements, and cleans up", async () => {
    const context = new FakeAudioContext();
    const contextFactory = vi.fn(() => context.asAudioContext());
    const engine = new WebAudioRecorderEngine({ contextFactory });

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
      value: 261.63,
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
