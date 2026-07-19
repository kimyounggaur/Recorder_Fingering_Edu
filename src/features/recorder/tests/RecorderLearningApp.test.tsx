import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useRecorderAudio } from "../audio/useRecorderAudio";
import type {
  RecorderAudioRequestId,
  UseRecorderAudioResult,
} from "../audio/useRecorderAudio";
import { RecorderLearningApp } from "../components/RecorderLearningApp";
import { ALL_HOLES } from "../data/fingerings";
import type { HoleId } from "../model/types";

vi.mock("../audio/useRecorderAudio", () => ({
  useRecorderAudio: vi.fn(),
}));

type AudioMock = UseRecorderAudioResult & {
  beginPlaybackRequest: ReturnType<typeof vi.fn<() => RecorderAudioRequestId>>;
  playAtContact: ReturnType<
    typeof vi.fn<
      (noteKey: string, requestId: RecorderAudioRequestId) => Promise<boolean>
    >
  >;
  setMuted: ReturnType<typeof vi.fn<(muted: boolean) => void>>;
};

let audioMock: AudioMock;

function noteButton(button: number): HTMLElement {
  return screen.getByTestId(`note-button-${button}`);
}

function hole(id: HoleId): Element {
  const element = document.querySelector(`[data-hole-id="${id}"]`);
  if (!element) throw new Error(`${id} hole was not rendered`);
  return element;
}

function expectClosedHoles(expected: readonly HoleId[]): void {
  expect(screen.getByTestId("recorder-scene")).toHaveAttribute(
    "data-closed-holes",
    expected.join(" "),
  );

  const closed = new Set(expected);
  for (const id of ALL_HOLES) {
    expect(hole(id)).toHaveAttribute(
      "data-hole-state",
      closed.has(id) ? "closed" : "open",
    );
  }
}

async function renderReadyApp() {
  const rendered = render(<RecorderLearningApp />);
  await act(async () => {
    await Promise.resolve();
  });
  expect(screen.queryByText("리코더 교실을 준비하고 있어요…")).not.toBeInTheDocument();
  return rendered;
}

async function finishAnimations(): Promise<void> {
  await act(async () => {
    await vi.runAllTimersAsync();
  });
}

beforeEach(() => {
  let nextRequestId = 0;
  audioMock = {
    isMuted: false,
    isUnlocked: true,
    beginPlaybackRequest: vi.fn(() => ++nextRequestId),
    playAtContact: vi.fn(async () => true),
    cancelPlaybackRequest: vi.fn(),
    stop: vi.fn(),
    unlock: vi.fn(async () => true),
    preload: vi.fn(async () => undefined),
    setMuted: vi.fn(),
    toggleMuted: vi.fn(),
  };
  vi.mocked(useRecorderAudio).mockReturnValue(audioMock);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("RecorderLearningApp", () => {
  it("renders the low bank and selects 솔 / G4 with aria-pressed", async () => {
    await renderReadyApp();

    const labels = ["도", "레", "미", "파", "솔", "라", "시", "높은 도"];
    const pitches = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"];
    labels.forEach((label, index) => {
      expect(noteButton(index + 1)).toHaveAccessibleName(
        `Ctrl와 ${index + 1}번, ${label}, ${pitches[index]}`,
      );
    });

    fireEvent.click(noteButton(5));

    expect(screen.getByRole("heading", { level: 2, name: "솔" })).toBeInTheDocument();
    expect(screen.getByText("음 이름 G4")).toBeInTheDocument();
    expect(noteButton(5)).toHaveAttribute("aria-pressed", "true");
    expect(noteButton(1)).toHaveAttribute("aria-pressed", "false");
  });

  it("updates the polite live region for the selected note", async () => {
    await renderReadyApp();

    fireEvent.click(noteButton(5));

    expect(screen.getByTestId("live-region")).toHaveTextContent(
      "솔이 선택되었습니다. G4. 0, 1, 2, 3번 구멍을 막습니다.",
    );
    expect(screen.getByTestId("live-region")).toHaveAttribute(
      "aria-live",
      "polite",
    );
  });

  it("settles 높은 도 with only T0 and L2 closed", async () => {
    vi.useFakeTimers();
    await renderReadyApp();

    fireEvent.click(noteButton(8));
    await finishAnimations();

    expectClosedHoles(["T0", "L2"]);
  });

  it("offers a visible high bank and keeps high F system-specific", async () => {
    vi.useFakeTimers();
    await renderReadyApp();

    fireEvent.click(screen.getByTestId("note-bank-high"));
    expect(screen.getByTestId("note-bank-high")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.queryByTestId("note-button-8")).not.toBeInTheDocument();

    const highFa = screen.getByTestId("note-button-high-4");
    expect(highFa).toHaveAccessibleName("Shift와 4번, 높은 파, F5");
    fireEvent.click(highFa);
    await finishAnimations();

    expect(screen.getByRole("heading", { level: 2, name: "높은 파" })).toBeInTheDocument();
    expect(screen.getByText("음 이름 F5")).toBeInTheDocument();
    expect(hole("T0")).toHaveAttribute("data-hole-state", "half");
    expect(hole("R6")).toHaveAttribute("data-hole-state", "closed");
    expect(screen.getByTestId("recorder-scene")).toHaveAttribute(
      "data-contacted-holes",
      "T0 L1 L2 L3 R4 R6",
    );
    expect(document.querySelector(".recorder-pose-stage")).toHaveAttribute(
      "data-pose-source",
      "/fingering/poses/f5-baroque.png",
    );

    fireEvent.click(screen.getByRole("radio", { name: /독일식/ }));
    await finishAnimations();

    expect(hole("T0")).toHaveAttribute("data-hole-state", "half");
    expect(hole("R6")).toHaveAttribute("data-hole-state", "open");
    expect(document.querySelector(".recorder-pose-stage")).toHaveAttribute(
      "data-pose-source",
      "/fingering/poses/f5-german.png",
    );
  });

  it("maps Shift, Alt, and Ctrl chords to their note banks", async () => {
    vi.useFakeTimers();
    await renderReadyApp();

    expect(
      fireEvent.keyDown(window, {
        key: "@",
        code: "Digit2",
        shiftKey: true,
      }),
    ).toBe(false);
    expect(document.getElementById("current-note-heading")).toHaveTextContent(
      "높은 레",
    );
    expect(screen.getByTestId("note-bank-high")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    fireEvent.keyDown(window, { key: "1", code: "Digit1", altKey: true });
    await finishAnimations();
    expect(document.getElementById("current-note-heading")).toHaveTextContent(
      "도♯/레♭",
    );
    expect(screen.getByTestId("note-bank-chromatic")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(hole("R7")).toHaveAttribute("data-hole-state", "partial");
    expect(screen.getByTestId("recorder-scene")).toHaveAttribute(
      "data-contacted-holes",
      "T0 L1 L2 L3 R4 R5 R6 R7",
    );

    fireEvent.keyDown(window, { key: "5", code: "Digit5", ctrlKey: true });
    expect(document.getElementById("current-note-heading")).toHaveTextContent(
      "솔",
    );
    expect(screen.getByTestId("note-bank-low")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("opens R6 and R7 when 파 changes from baroque to german", async () => {
    vi.useFakeTimers();
    await renderReadyApp();

    fireEvent.click(noteButton(4));
    await finishAnimations();
    expect(hole("R4")).toHaveAttribute("data-hole-state", "closed");
    expect(hole("R5")).toHaveAttribute("data-hole-state", "open");
    expect(hole("R6")).toHaveAttribute("data-hole-state", "closed");
    expect(hole("R7")).toHaveAttribute("data-hole-state", "closed");
    expect(document.querySelector(".recorder-pose-stage")).toHaveAttribute(
      "data-pose-source",
      "/fingering/poses/fa-baroque.png",
    );

    fireEvent.click(screen.getByRole("radio", { name: /독일식/ }));
    await finishAnimations();

    expect(screen.getByText(/독일식 파예요/)).toBeInTheDocument();
    expect(hole("R4")).toHaveAttribute("data-hole-state", "closed");
    expect(hole("R5")).toHaveAttribute("data-hole-state", "open");
    expect(hole("R6")).toHaveAttribute("data-hole-state", "open");
    expect(hole("R7")).toHaveAttribute("data-hole-state", "open");
    expect(document.querySelector(".recorder-pose-stage")).toHaveAttribute(
      "data-pose-source",
      "/fingering/poses/fa-german.png",
    );
  });

  it("toggles mute and reflects it in the sound controls", async () => {
    await renderReadyApp();
    const soundToggle = screen.getByTestId("sound-toggle");

    expect(soundToggle).toBeChecked();
    fireEvent.click(soundToggle);

    expect(soundToggle).not.toBeChecked();
    expect(audioMock.setMuted).toHaveBeenLastCalledWith(true);
    expect(
      screen.getByRole("button", { name: /소리를 켜고 들어요/ }),
    ).toBeInTheDocument();

    fireEvent.click(soundToggle);
    expect(soundToggle).toBeChecked();
    expect(audioMock.setMuted).toHaveBeenLastCalledWith(false);
  });

  it("cancels stale timers during 1→8→4→5 and contacts only the final 솔", async () => {
    vi.useFakeTimers();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { unmount } = await renderReadyApp();

    fireEvent.click(noteButton(1));
    fireEvent.click(noteButton(8));
    fireEvent.click(noteButton(4));
    fireEvent.click(noteButton(5));
    await finishAnimations();

    expect(screen.getByRole("heading", { level: 2, name: "솔" })).toBeInTheDocument();
    expect(noteButton(5)).toHaveAttribute("aria-pressed", "true");
    expectClosedHoles(["T0", "L1", "L2", "L3"]);
    expect(audioMock.beginPlaybackRequest).toHaveBeenCalledTimes(4);
    expect(audioMock.playAtContact).toHaveBeenCalledTimes(1);
    expect(audioMock.playAtContact).toHaveBeenCalledWith("G", 4);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });
    expect(audioMock.playAtContact).toHaveBeenCalledTimes(1);

    unmount();
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("replays the last transition from its real starting pose", async () => {
    vi.useFakeTimers();
    await renderReadyApp();

    fireEvent.click(noteButton(5));
    await finishAnimations();
    expectClosedHoles(["T0", "L1", "L2", "L3"]);

    fireEvent.click(screen.getAllByRole("button", { name: /다시 보기/ })[0]);
    expectClosedHoles(ALL_HOLES);
    expect(document.querySelector(".recorder-app")).toHaveAttribute(
      "data-animation-preparing",
      "true",
    );

    await finishAnimations();
    expectClosedHoles(["T0", "L1", "L2", "L3"]);
    expect(audioMock.playAtContact).toHaveBeenCalledTimes(2);
  });

  it("consumes contact audio once even when speed changes afterward", async () => {
    vi.useFakeTimers();
    await renderReadyApp();

    fireEvent.click(noteButton(8));
    await finishAnimations();
    expect(audioMock.playAtContact).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("radio", { name: /느리게/ }));
    await finishAnimations();
    expect(audioMock.playAtContact).toHaveBeenCalledTimes(1);
  });

  it("plays immediately without resetting step progress", async () => {
    await renderReadyApp();

    fireEvent.click(screen.getByTestId("step-mode-toggle"));
    expect(screen.getByText("1/7")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "도 소리 듣기" }));
    expect(audioMock.playAtContact).toHaveBeenCalledTimes(1);
    expect(audioMock.playAtContact).toHaveBeenCalledWith("C", 2);
    expect(screen.getByText("1/7")).toBeInTheDocument();
  });

  it("switches a release-only step pose when its map reaches the target", async () => {
    await renderReadyApp();

    fireEvent.click(screen.getByTestId("step-mode-toggle"));
    fireEvent.click(noteButton(2));
    expect(document.querySelector(".recorder-pose-stage")).toHaveAttribute(
      "data-pose-source",
      "/fingering/poses/do.png",
    );

    fireEvent.click(screen.getByRole("button", { name: "다음 단계" }));
    expect(document.querySelector(".recorder-pose-stage")).toHaveAttribute(
      "data-pose-source",
      "/fingering/poses/do.png",
    );

    fireEvent.click(screen.getByRole("button", { name: "다음 단계" }));
    expect(hole("R7")).toHaveAttribute("data-hole-state", "open");
    expect(screen.getByTestId("recorder-scene")).toHaveAttribute(
      "data-closed-holes",
      "T0 L1 L2 L3 R4 R5 R6",
    );
    expect(document.querySelector(".recorder-pose-stage")).toHaveAttribute(
      "data-pose-source",
      "/fingering/poses/re.png",
    );
  });

  it("traps help focus, blocks global shortcuts, and restores the opener", async () => {
    await renderReadyApp();
    const opener = screen.getByRole("button", { name: "도움말" });
    opener.focus();
    fireEvent.click(opener);

    const close = screen.getByRole("button", { name: "도움말 닫기" });
    expect(close).toHaveFocus();
    fireEvent.keyDown(window, { key: "5", code: "Digit5" });
    fireEvent.keyDown(window, {
      key: "@",
      code: "Digit2",
      shiftKey: true,
    });
    expect(document.getElementById("current-note-heading")).toHaveTextContent("도");

    fireEvent.keyDown(window, { key: "Tab" });
    expect(close).toHaveFocus();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it("starts a fresh sequence at 도 and resumes a paused position", async () => {
    vi.useFakeTimers();
    await renderReadyApp();
    fireEvent.click(noteButton(5));
    await finishAnimations();

    fireEvent.click(screen.getByRole("button", { name: "순서 연습 시작" }));
    expect(screen.getByRole("heading", { level: 2, name: "도" })).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_500);
    });
    expect(screen.getByRole("heading", { level: 2, name: "레" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "일시정지" }));
    fireEvent.click(screen.getByRole("button", { name: "이어서 연습" }));
    expect(screen.getByRole("heading", { level: 2, name: "레" })).toBeInTheDocument();
  });

  it("keeps interrupted-motion text aligned with the real SVG diff", async () => {
    vi.useFakeTimers();
    await renderReadyApp();

    fireEvent.click(noteButton(8));
    fireEvent.click(noteButton(4));

    expect(screen.getByText(/지금 자세에서 파 운지로 바꿔요/)).toBeInTheDocument();
    expect(screen.getByText("5번 · 오른손 가운데손가락")).toBeInTheDocument();
    expect(document.querySelector(".finger-chip-row.close")).not.toBeInTheDocument();
  });
});
