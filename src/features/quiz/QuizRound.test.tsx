import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { UseRecorderAudioResult } from "../recorder/audio/useRecorderAudio";
import { QuizRound } from "./QuizRound";

function makeAudio(): UseRecorderAudioResult {
  let request = 0;
  return { isMuted: false, isUnlocked: true, beginPlaybackRequest: vi.fn(() => ++request), playAtContact: vi.fn(async () => true), cancelPlaybackRequest: vi.fn(), stop: vi.fn(), unlock: vi.fn(async () => true), preload: vi.fn(async () => {}), setMuted: vi.fn(), toggleMuted: vi.fn() };
}
afterEach(() => vi.useRealTimers());
it("locks identify input against double scoring and clears pending work on unmount", async () => {
  vi.useFakeTimers();
  vi.spyOn(Math, "random").mockReturnValue(0);
  const audio = makeAudio();
  const { unmount } = render(<QuizRound kind="identify" pool={["do", "re"]} system="baroque" muted={false} reducedMotion audio={audio} onRetry={vi.fn()} onSetup={vi.fn()} />);
  const option = screen.getByTestId("quiz-option-1");
  fireEvent.click(option); fireEvent.click(option);
  expect(audio.playAtContact).toHaveBeenCalledTimes(1);
  expect(option).toBeDisabled();
  await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
  expect(screen.getByRole("heading", { name: "문제 2/10" })).toBeInTheDocument();
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});
it("awards full credit for German fa in a Baroque build quiz", async () => {
  vi.useFakeTimers();
  vi.spyOn(Math, "random").mockReturnValue(0);
  const { unmount } = render(<QuizRound kind="build" pool={["fa", "sol"]} system="baroque" muted reducedMotion audio={makeAudio()} onRetry={vi.fn()} onSetup={vi.fn()} />);
  for (const hole of [0, 1, 2, 3, 4]) fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${hole}번 구멍`) }));
  fireEvent.click(screen.getByRole("button", { name: "확인" }));
  expect(screen.getByText("그건 독일식 파예요! 둘 다 맞아요")).toBeInTheDocument();
  expect(screen.getByText("10점 · 바로크식")).toBeInTheDocument();
  await act(async () => { await vi.advanceTimersByTimeAsync(0); });
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});
