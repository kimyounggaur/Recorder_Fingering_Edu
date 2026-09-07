import { readFileSync } from "node:fs";
import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { UseRecorderAudioResult } from "../recorder/audio/useRecorderAudio";
import { BASICS_COPY, BASICS_TITLES } from "./content";
import { BasicsApp } from "./BasicsApp";
import { useTonguing } from "./useTonguing";

afterEach(() => vi.useRealTimers());
it("keeps every educational sentence identical to the supplied v3 design", () => {
  const design = readFileSync("리코더_웹앱_개선보완_바이브코딩_프롬프트_v3(Fable51).md", "utf8");
  expect(BASICS_TITLES).toEqual(["바른 자세", "리코더 잡는 법", "입 모양", "텅잉", "구멍을 막는 손가락 위치"]);
  expect(Object.values(BASICS_COPY).map(lines => lines.length)).toEqual([4, 4, 3, 2, 3, 3]);
  for (const lines of Object.values(BASICS_COPY)) for (const line of lines) expect(design).toContain(line);
});
it("renders and cycles all five cards, including standing posture", async () => {
  render(<BasicsApp />);
  await act(async () => { await Promise.resolve(); });
  fireEvent.click(screen.getByRole("radio", { name: "서서" }));
  expect(screen.getByText(BASICS_COPY.standing[0])).toBeInTheDocument();
  for (const title of BASICS_TITLES) {
    expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "다음 카드" }));
  }
  expect(screen.getByRole("heading", { name: "바른 자세" })).toBeInTheDocument();
});
function makeAudio(): UseRecorderAudioResult {
  let id = 0;
  return { isMuted: false, isUnlocked: true, beginPlaybackRequest: vi.fn(() => ++id), playAtContact: vi.fn(async () => true), cancelPlaybackRequest: vi.fn(), stop: vi.fn(), unlock: vi.fn(async () => true), preload: vi.fn(async () => {}), setMuted: vi.fn(), toggleMuted: vi.fn() };
}
it("plays 120ms pulses at 750ms intervals and cleans up on stop and unmount", () => {
  vi.useFakeTimers();
  const audio = makeAudio();
  const { result, unmount } = renderHook(() => useTonguing(audio, false));
  act(() => result.current.toggle());
  expect(audio.playAtContact).toHaveBeenCalledWith("G", 1);
  act(() => vi.advanceTimersByTime(120));
  expect(audio.cancelPlaybackRequest).toHaveBeenCalledWith(1, 25);
  act(() => vi.advanceTimersByTime(629));
  expect(result.current.beat).toBe(0);
  act(() => vi.advanceTimersByTime(1));
  expect(result.current.beat).toBe(1);
  expect(audio.playAtContact).toHaveBeenCalledTimes(2);
  act(() => result.current.toggle());
  expect(vi.getTimerCount()).toBe(0);
  act(() => result.current.toggle());
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});
it("continues visual beats while muted without creating an audio request", () => {
  vi.useFakeTimers();
  const audio = makeAudio();
  const { result, unmount } = renderHook(() => useTonguing(audio, true));
  act(() => result.current.toggle());
  act(() => vi.advanceTimersByTime(1500));
  expect(result.current.beat).toBe(2);
  expect(audio.beginPlaybackRequest).not.toHaveBeenCalled();
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});
