import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FINGERINGS } from "../data/fingerings";
import type { HoleId } from "../model/types";
import { MOTION_TIMINGS } from "./motionTimings";
import { useFingeringAnimation } from "./useFingeringAnimation";

interface HarnessProps {
  animationKey: number;
  targetClosedHoles: readonly HoleId[];
  reducedMotion?: boolean;
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useFingeringAnimation", () => {
  it("matches the specified normal and slow total durations", () => {
    const normal = MOTION_TIMINGS.normal;
    const slow = MOTION_TIMINGS.slow;
    const beforeContact = (timings: typeof normal) =>
      timings.highlightRelease +
      timings.release +
      timings.highlightPress +
      timings.press;
    const total = (timings: typeof normal) =>
      beforeContact(timings) + timings.contact + timings.settle;

    expect(beforeContact(normal)).toBe(420);
    expect(total(normal)).toBe(520);
    expect(total(slow)).toBeGreaterThanOrEqual(1_100);
    expect(total(slow)).toBeLessThanOrEqual(1_500);
  });

  it("cancels superseded schedules and contacts only the latest target", async () => {
    const onContact = vi.fn();
    const { result, rerender } = renderHook(
      ({ animationKey, targetClosedHoles, reducedMotion = false }: HarnessProps) =>
        useFingeringAnimation({
          animationKey,
          targetClosedHoles,
          restartFrom: null,
          speed: "normal",
          stepMode: false,
          reducedMotion,
          playOnContact: true,
          onContact,
        }),
      {
        initialProps: {
          animationKey: 0,
          targetClosedHoles: FINGERINGS.baroque.do,
        },
      },
    );

    rerender({
      animationKey: 1,
      targetClosedHoles: FINGERINGS.baroque.highDo,
    });
    rerender({
      animationKey: 2,
      targetClosedHoles: FINGERINGS.baroque.fa,
    });
    rerender({
      animationKey: 3,
      targetClosedHoles: FINGERINGS.baroque.sol,
    });

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(result.current.visualClosedHoles).toEqual(
      FINGERINGS.baroque.sol,
    );
    expect(result.current.phase).toBe("settled");
    expect(onContact).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });
    expect(onContact).toHaveBeenCalledTimes(1);
  });

  it("settles reduced motion after the short contact announcement only", async () => {
    const onContact = vi.fn();
    const { result, rerender } = renderHook(
      ({ animationKey, targetClosedHoles, reducedMotion = false }: HarnessProps) =>
        useFingeringAnimation({
          animationKey,
          targetClosedHoles,
          restartFrom: null,
          speed: "slow",
          stepMode: false,
          reducedMotion,
          playOnContact: true,
          onContact,
        }),
      {
        initialProps: {
          animationKey: 0,
          targetClosedHoles: FINGERINGS.baroque.do,
          reducedMotion: false,
        },
      },
    );

    rerender({
      animationKey: 1,
      targetClosedHoles: FINGERINGS.baroque.highDo,
      reducedMotion: true,
    });

    expect(result.current.visualClosedHoles).toEqual(
      FINGERINGS.baroque.highDo,
    );
    expect(result.current.phase).toBe("contact");
    expect(onContact).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(79);
    });
    expect(result.current.phase).toBe("contact");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(result.current.phase).toBe("settled");
  });

  it("does not run a pending contact callback after unmount", async () => {
    const onContact = vi.fn();
    const { rerender, unmount } = renderHook(
      ({ animationKey, targetClosedHoles }: HarnessProps) =>
        useFingeringAnimation({
          animationKey,
          targetClosedHoles,
          restartFrom: null,
          speed: "normal",
          stepMode: false,
          reducedMotion: false,
          playOnContact: true,
          onContact,
        }),
      {
        initialProps: {
          animationKey: 0,
          targetClosedHoles: FINGERINGS.baroque.do,
        },
      },
    );

    rerender({
      animationKey: 1,
      targetClosedHoles: FINGERINGS.baroque.highDo,
    });
    unmount();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });
    expect(onContact).not.toHaveBeenCalled();
  });
});
