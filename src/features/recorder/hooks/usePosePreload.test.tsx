import { act, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { getBankPoseSources, usePosePreload } from "./usePosePreload";
import { loadPose } from "../utils/poseLoader";

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

it("mount creates only the active bank images, idle fills the rest and cleanup cancels", async () => {
  const sources: string[] = [];
  vi.stubGlobal("Image", class { set src(source: string) { sources.push(source); } });
  let callback: IdleRequestCallback = () => undefined;
  const cancel = vi.fn();
  vi.stubGlobal("requestIdleCallback", vi.fn((fn) => { callback = fn; return 7; }));
  vi.stubGlobal("cancelIdleCallback", cancel);
  const { unmount } = renderHook(() => usePosePreload("low", "baroque"));
  expect(sources).toEqual(getBankPoseSources("low", "baroque"));
  expect(sources).toHaveLength(8);
  void loadPose(sources[0]);
  expect(sources).toHaveLength(8);
  unmount();
  act(() => callback({ didTimeout: false, timeRemaining: () => 20 }));
  expect(sources).toHaveLength(8);
  expect(cancel).toHaveBeenCalledWith(7);
  const high = renderHook(() => usePosePreload("high", "baroque"));
  expect(sources).toHaveLength(12);
  act(() => callback({ didTimeout: false, timeRemaining: () => 20 }));
  expect(new Set(sources).size).toBe(20);
  high.unmount();
});

it("keeps five priority poses per upper bank and clears the one-second fallback", () => {
  expect(getBankPoseSources("high", "german")).toHaveLength(5);
  expect(getBankPoseSources("chromatic", "german")).toHaveLength(5);
  vi.useFakeTimers();
  vi.stubGlobal("requestIdleCallback", undefined);
  const { unmount } = renderHook(() => usePosePreload("chromatic", "german"));
  expect(vi.getTimerCount()).toBe(1);
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});
