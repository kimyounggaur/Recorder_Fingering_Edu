import { act, renderHook } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { useClassroom, type ClassroomSnapshot } from "./useClassroom";

it("restores after a browser fullscreenchange exit and removes fallback attributes", async () => {
  const previousRequest = document.documentElement.requestFullscreen;
  const previousExit = document.exitFullscreen;
  let fullscreen: Element | null = null;
  const descriptor = Object.getOwnPropertyDescriptor(document, "fullscreenElement");
  Object.defineProperty(document, "fullscreenElement", { configurable: true, get: () => fullscreen });
  document.documentElement.requestFullscreen = vi.fn(async () => { fullscreen = document.documentElement; });
  document.exitFullscreen = vi.fn(async () => { fullscreen = null; });
  const restore = vi.fn();
  const snapshot: ClassroomSnapshot = { note: "fa", bank: "low", system: "german", speed: "slow", stepMode: false };
  const { result, unmount } = renderHook(() => useClassroom(snapshot, restore, vi.fn()));
  try {
    await act(async () => { await result.current.toggle(); });
    expect(result.current.active).toBe(true);
    fullscreen = null;
    await act(async () => { document.dispatchEvent(new Event("fullscreenchange")); });
    expect(restore).toHaveBeenCalledWith(snapshot);
    expect(result.current.active).toBe(false);
    expect(document.body.dataset.classroom).toBeUndefined();
  } finally {
    unmount();
    document.documentElement.requestFullscreen = previousRequest;
    document.exitFullscreen = previousExit;
    if (descriptor) Object.defineProperty(document, "fullscreenElement", descriptor);
    else Reflect.deleteProperty(document, "fullscreenElement");
  }
});
