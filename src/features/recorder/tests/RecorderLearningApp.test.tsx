import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useRecorderAudio } from "../audio/useRecorderAudio";
import type { RecorderAudioRequestId, UseRecorderAudioResult } from "../audio/useRecorderAudio";
import { RecorderLearningApp } from "../components/RecorderLearningApp";
import { ALL_HOLES } from "../data/fingerings";
import type { HoleId } from "../model/types";

vi.mock("../audio/useRecorderAudio", () => ({ useRecorderAudio: vi.fn() }));

type AudioMock = UseRecorderAudioResult & {
  beginPlaybackRequest: ReturnType<typeof vi.fn<() => RecorderAudioRequestId>>;
  playAtContact: ReturnType<typeof vi.fn<(noteKey: string, requestId: RecorderAudioRequestId) => Promise<boolean>>>;
  setMuted: ReturnType<typeof vi.fn<(muted: boolean) => void>>;
};
let audioMock: AudioMock;

function openPanel(menu: string, item: string) {
  fireEvent.click(screen.getByRole("button", { name: menu }));
  fireEvent.click(screen.getByRole("button", { name: item }));
}
function closePanel(title: string) {
  fireEvent.click(screen.getByRole("button", { name: `${title} 닫기` }));
}
function selectLow(digit: number) {
  fireEvent.keyDown(window, { key: String(digit), code: `Digit${digit}`, ctrlKey: true });
}
function currentNote() { return document.getElementById("current-note-heading")!; }
function hole(id: HoleId): Element {
  const element = document.querySelector(`[data-hole-id="${id}"]`);
  if (!element) throw new Error(`${id} hole was not rendered`);
  return element;
}
function expectClosedHoles(expected: readonly HoleId[]) {
  expect(screen.getByTestId("recorder-scene")).toHaveAttribute("data-closed-holes", expected.join(" "));
  const closed = new Set(expected);
  ALL_HOLES.forEach(id => expect(hole(id)).toHaveAttribute("data-hole-state", closed.has(id) ? "closed" : "open"));
}
async function renderReadyApp() {
  const rendered = render(<RecorderLearningApp />);
  await act(async () => { await Promise.resolve(); });
  expect(screen.queryByText("리코더 교실을 준비하고 있어요…")).not.toBeInTheDocument();
  return rendered;
}
async function finishAnimations() {
  await act(async () => { await vi.runAllTimersAsync(); });
}
function enableSteps() {
  openPanel("환경 설정", "화면·소리 설정");
  fireEvent.click(screen.getByTestId("step-mode-toggle"));
  closePanel("화면·소리 설정");
}

beforeEach(() => {
  let nextRequestId = 0;
  audioMock = {
    isMuted: false, isUnlocked: true,
    beginPlaybackRequest: vi.fn(() => ++nextRequestId),
    playAtContact: vi.fn(async () => true),
    cancelPlaybackRequest: vi.fn(), stop: vi.fn(), unlock: vi.fn(async () => true),
    preload: vi.fn(async () => undefined), setMuted: vi.fn(), toggleMuted: vi.fn(),
  };
  vi.mocked(useRecorderAudio).mockReturnValue(audioMock);
});
afterEach(() => { vi.useRealTimers(); });

describe("RecorderLearningApp", () => {
  it("shows only the three teaching areas until a submenu is opened", async () => {
    await renderReadyApp();
    expect(screen.getByRole("heading", { name: "손가락 학습 무대" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "학습 설정" })).toBeInTheDocument();
    expect(currentNote()).toHaveTextContent("도");
    expect(screen.queryByTestId("note-button-1")).not.toBeInTheDocument();
    expect(screen.queryByTestId("course-panel")).not.toBeInTheDocument();
    expect(screen.queryByTestId("step-mode-toggle")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "이렇게 잡아 보세요" })).not.toBeInTheDocument();
    expect(screen.queryByText("내 리코더의 운지 체계는 무엇인가요?")).not.toBeInTheDocument();
  });

  it("blocks note shortcuts in navigation and restores focus after closing a panel", async () => {
    await renderReadyApp();
    const trigger = screen.getByRole("button", { name: "음 선택" });
    trigger.focus();
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    fireEvent.keyDown(window, { key: "5", code: "Digit5" });
    expect(currentNote()).toHaveTextContent("도");
    fireEvent.click(screen.getByRole("button", { name: "낮은 계이름" }));
    expect(screen.getByRole("dialog", { name: "음 선택" })).toBeInTheDocument();
    const close = screen.getByRole("button", { name: "음 선택 닫기" });
    expect(close).toHaveFocus();
    fireEvent.keyDown(window, { key: "5", code: "Digit5" });
    expect(currentNote()).toHaveTextContent("도");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    selectLow(5);
    expect(currentNote()).toHaveTextContent("솔");
  });

  it("enters classroom with T and restores note, bank, speed and focus with Escape", async () => {
    vi.useFakeTimers();
    await renderReadyApp();
    enableSteps();
    selectLow(2);
    const soundButton = screen.getByRole("button", { name: "레 소리 듣기" });
    soundButton.focus();
    await act(async () => { fireEvent.keyDown(window, { key: "t" }); await Promise.resolve(); });
    expect(document.body).toHaveAttribute("data-classroom", "true");
    expect(document.querySelector(".settings-area")).toHaveAttribute("hidden");
    fireEvent.keyDown(window, { key: "5", code: "Digit5" });
    fireEvent.keyDown(window, { key: "s" });
    expect(document.querySelector(".classroom-solfege")).toHaveTextContent("솔");
    await act(async () => { fireEvent.keyDown(window, { key: "Escape" }); await Promise.resolve(); });
    expect(document.body).not.toHaveAttribute("data-classroom");
    expect(currentNote()).toHaveTextContent("레");
    expect(soundButton).toHaveFocus();
    expect(screen.getByRole("radio", { name: "보통" })).toBeChecked();
    openPanel("환경 설정", "화면·소리 설정");
    expect(screen.getByTestId("step-mode-toggle")).toBeChecked();
  });

  it("persists the high contrast theme from the settings submenu", async () => {
    await renderReadyApp();
    openPanel("환경 설정", "화면·소리 설정");
    fireEvent.click(screen.getByRole("switch", { name: /고대비/ }));
    expect(document.documentElement).toHaveAttribute("data-theme", "high-contrast");
    expect(JSON.parse(localStorage.getItem("recorder-learning.preferences.v1")!)).toMatchObject({ theme: "high-contrast" });
  });

  it("restores step mode and finger names, then resets without showing onboarding", async () => {
    localStorage.setItem("recorder-learning.preferences.v1", JSON.stringify({ stepMode: true, showFingerNames: true, onboardingCompleted: true }));
    await renderReadyApp();
    openPanel("환경 설정", "화면·소리 설정");
    expect(screen.getByTestId("step-mode-toggle")).toBeChecked();
    expect(screen.getByRole("switch", { name: /손가락 이름/ })).toBeChecked();
    expect(screen.getByTestId("recorder-scene")).toHaveAttribute("data-phase", "idle");
    fireEvent.click(screen.getByRole("button", { name: "설정 초기화" }));
    expect(screen.getByTestId("step-mode-toggle")).not.toBeChecked();
    closePanel("화면·소리 설정");
    expect(screen.getByRole("status")).toHaveTextContent("설정을 처음 상태로 되돌렸어요");
    expect(screen.queryByText("내 리코더의 운지 체계는 무엇인가요?")).not.toBeInTheDocument();
  });

  it("selects an unmodified digit from the bank last chosen in the submenu", async () => {
    await renderReadyApp();
    openPanel("음 선택", "높은 계이름");
    closePanel("음 선택");
    fireEvent.keyDown(window, { key: "2", code: "Digit2" });
    expect(currentNote()).toHaveTextContent("높은 레");
    openPanel("음 선택", "반음");
    closePanel("음 선택");
    fireEvent.keyDown(window, { key: "1", code: "Digit1" });
    expect(currentNote()).toHaveTextContent("도♯/레♭");
  });

  it("persists pitch mode and passes it to the audio hook", async () => {
    await renderReadyApp();
    fireEvent.click(screen.getByRole("radio", { name: "한 옥타브 낮게" }));
    expect(vi.mocked(useRecorderAudio)).toHaveBeenLastCalledWith(expect.objectContaining({ pitchMode: "written" }));
    expect(JSON.parse(localStorage.getItem("recorder-learning.preferences.v1")!)).toHaveProperty("pitchMode", "written");
    expect(screen.getByText("실제 소리 C5")).toBeInTheDocument();
  });

  it("opens the low bank from a submenu and keeps the selected button synchronized", async () => {
    await renderReadyApp();
    openPanel("음 선택", "낮은 계이름");
    const labels = ["도", "레", "미", "파", "솔", "라", "시", "높은 도"];
    const pitches = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"];
    labels.forEach((label, index) => expect(screen.getByTestId(`note-button-${index + 1}`)).toHaveAccessibleName(`Ctrl와 ${index + 1}번, ${label}, ${pitches[index]}`));
    fireEvent.click(screen.getByTestId("note-button-5"));
    expect(screen.getByTestId("note-button-5")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("note-button-1")).toHaveAttribute("aria-pressed", "false");
    closePanel("음 선택");
    expect(currentNote()).toHaveTextContent("솔");
    expect(screen.getByText("음 이름 G4")).toBeInTheDocument();
  });

  it("blocks context menus and dragging for the app image stage", async () => {
    await renderReadyApp();
    const app = document.querySelector(".recorder-app");
    const poseImage = document.querySelector(".recorder-pose-stage__fallback");
    expect(fireEvent.contextMenu(app!)).toBe(false);
    expect(poseImage).toHaveAttribute("src", "/fingering/poses-focused/do.png");
    expect(poseImage).toHaveAttribute("width", "723");
    expect(poseImage).toHaveAttribute("height", "1084");
    expect(poseImage).toHaveAttribute("draggable", "false");
    expect(fireEvent.dragStart(poseImage!)).toBe(false);
  });

  it("opens manifest shortcuts on their requested note bank", async () => {
    window.history.pushState(null, "", "/?bank=high");
    await renderReadyApp();
    expect(currentNote()).toHaveTextContent("높은 도");
    openPanel("음 선택", "높은 계이름");
    expect(screen.getByTestId("note-bank-high")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("note-button-high-1")).toHaveAttribute("aria-pressed", "true");
  });

  it("updates the polite live region for the selected note", async () => {
    await renderReadyApp();
    selectLow(5);
    expect(screen.getByTestId("live-region")).toHaveTextContent("솔이 선택되었습니다. G4. 0, 1, 2, 3번 구멍을 막습니다.");
    expect(screen.getByTestId("live-region")).toHaveAttribute("aria-live", "polite");
  });

  it("settles 높은 도 with only T0 and L2 closed", async () => {
    vi.useFakeTimers();
    await renderReadyApp();
    selectLow(8);
    await finishAnimations();
    expectClosedHoles(["T0", "L2"]);
  });

  it("selects high F from a submenu and keeps its fingering system-specific", async () => {
    vi.useFakeTimers();
    await renderReadyApp();
    openPanel("음 선택", "높은 계이름");
    const highFa = screen.getByTestId("note-button-high-4");
    expect(highFa).toHaveAccessibleName("Shift와 4번, 높은 파, F5");
    fireEvent.click(highFa);
    closePanel("음 선택");
    await finishAnimations();
    expect(currentNote()).toHaveTextContent("높은 파");
    expect(hole("T0")).toHaveAttribute("data-hole-state", "half");
    expect(hole("R6")).toHaveAttribute("data-hole-state", "closed");
    expect(screen.getByTestId("recorder-scene")).toHaveAttribute("data-contacted-holes", "T0 L1 L2 L3 R4 R6");
    expect(document.querySelector(".recorder-pose-stage")).toHaveAttribute("data-pose-source", "/fingering/poses-focused/f5-baroque.png");
    fireEvent.click(screen.getByRole("radio", { name: /독일식/ }));
    await finishAnimations();
    expect(hole("T0")).toHaveAttribute("data-hole-state", "half");
    expect(hole("R6")).toHaveAttribute("data-hole-state", "open");
    expect(document.querySelector(".recorder-pose-stage")).toHaveAttribute("data-pose-source", "/fingering/poses-focused/f5-german.png");
  });

  it("maps Shift, Alt, and Ctrl chords to their note banks", async () => {
    vi.useFakeTimers();
    await renderReadyApp();
    expect(fireEvent.keyDown(window, { key: "@", code: "Digit2", shiftKey: true })).toBe(false);
    expect(currentNote()).toHaveTextContent("높은 레");
    fireEvent.keyDown(window, { key: "1", code: "Digit1", altKey: true });
    await finishAnimations();
    expect(currentNote()).toHaveTextContent("도♯/레♭");
    expect(hole("R7")).toHaveAttribute("data-hole-state", "partial");
    expect(screen.getByTestId("recorder-scene")).toHaveAttribute("data-contacted-holes", "T0 L1 L2 L3 R4 R5 R6 R7");
    selectLow(5);
    expect(currentNote()).toHaveTextContent("솔");
  });

  it("opens R6 and R7 when 파 changes from baroque to german", async () => {
    vi.useFakeTimers();
    await renderReadyApp();
    selectLow(4);
    await finishAnimations();
    expect(hole("R4")).toHaveAttribute("data-hole-state", "closed");
    expect(hole("R5")).toHaveAttribute("data-hole-state", "open");
    expect(hole("R6")).toHaveAttribute("data-hole-state", "closed");
    expect(hole("R7")).toHaveAttribute("data-hole-state", "closed");
    expect(document.querySelector(".recorder-pose-stage")).toHaveAttribute("data-pose-source", "/fingering/poses-focused/fa-baroque.png");
    fireEvent.click(screen.getByRole("radio", { name: /독일식/ }));
    await finishAnimations();
    expect(hole("R4")).toHaveAttribute("data-hole-state", "closed");
    expect(hole("R5")).toHaveAttribute("data-hole-state", "open");
    expect(hole("R6")).toHaveAttribute("data-hole-state", "open");
    expect(hole("R7")).toHaveAttribute("data-hole-state", "open");
    expect(document.querySelector(".recorder-pose-stage")).toHaveAttribute("data-pose-source", "/fingering/poses-focused/fa-german.png");
    openPanel("수업 도구", "손가락 안내");
    expect(screen.getByText(/독일식 파예요/)).toBeInTheDocument();
  });

  it("toggles mute in the settings submenu and updates the main sound button", async () => {
    await renderReadyApp();
    openPanel("환경 설정", "화면·소리 설정");
    const soundToggle = screen.getByTestId("sound-toggle");
    expect(soundToggle).toBeChecked();
    fireEvent.click(soundToggle);
    expect(soundToggle).not.toBeChecked();
    expect(audioMock.setMuted).toHaveBeenLastCalledWith(true);
    closePanel("화면·소리 설정");
    expect(screen.getByRole("button", { name: /소리를 켜고 들어요/ })).toBeInTheDocument();
    openPanel("환경 설정", "화면·소리 설정");
    fireEvent.click(screen.getByTestId("sound-toggle"));
    expect(screen.getByTestId("sound-toggle")).toBeChecked();
    expect(audioMock.setMuted).toHaveBeenLastCalledWith(false);
  });

  it("cancels stale timers during 1→8→4→5 and contacts only the final 솔", async () => {
    vi.useFakeTimers();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { unmount } = await renderReadyApp();
    [1, 8, 4, 5].forEach(selectLow);
    await finishAnimations();
    expect(currentNote()).toHaveTextContent("솔");
    expectClosedHoles(["T0", "L1", "L2", "L3"]);
    expect(audioMock.beginPlaybackRequest).toHaveBeenCalledTimes(4);
    expect(audioMock.playAtContact).toHaveBeenCalledTimes(1);
    expect(audioMock.playAtContact).toHaveBeenCalledWith("G", 4);
    await act(async () => { await vi.advanceTimersByTimeAsync(10_000); });
    expect(audioMock.playAtContact).toHaveBeenCalledTimes(1);
    unmount();
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("replays the last transition from its real starting pose", async () => {
    vi.useFakeTimers();
    await renderReadyApp();
    selectLow(5);
    await finishAnimations();
    expectClosedHoles(["T0", "L1", "L2", "L3"]);
    fireEvent.click(screen.getByRole("button", { name: "다시 보기" }));
    expectClosedHoles(ALL_HOLES);
    expect(document.querySelector(".recorder-app")).toHaveAttribute("data-animation-preparing", "true");
    await finishAnimations();
    expectClosedHoles(["T0", "L1", "L2", "L3"]);
    expect(audioMock.playAtContact).toHaveBeenCalledTimes(2);
  });

  it("consumes contact audio once even when speed changes afterward", async () => {
    vi.useFakeTimers();
    await renderReadyApp();
    selectLow(8);
    await finishAnimations();
    expect(audioMock.playAtContact).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("radio", { name: /느리게/ }));
    await finishAnimations();
    expect(audioMock.playAtContact).toHaveBeenCalledTimes(1);
  });

  it("plays immediately without resetting step progress", async () => {
    await renderReadyApp();
    enableSteps();
    openPanel("수업 도구", "손가락 안내");
    expect(screen.getByText("1/7")).toBeInTheDocument();
    closePanel("손가락 안내");
    fireEvent.click(screen.getByRole("button", { name: "도 소리 듣기" }));
    expect(audioMock.playAtContact).toHaveBeenCalledTimes(1);
    expect(audioMock.playAtContact).toHaveBeenCalledWith("C", 2);
    openPanel("수업 도구", "손가락 안내");
    expect(screen.getByText("1/7")).toBeInTheDocument();
  });

  it("switches a release-only step pose when its map reaches the target", async () => {
    await renderReadyApp();
    enableSteps();
    selectLow(2);
    openPanel("수업 도구", "손가락 안내");
    expect(document.querySelector(".recorder-pose-stage")).toHaveAttribute("data-pose-source", "/fingering/poses-focused/do.png");
    fireEvent.click(screen.getByRole("button", { name: "다음 단계" }));
    expect(document.querySelector(".recorder-pose-stage")).toHaveAttribute("data-pose-source", "/fingering/poses-focused/do.png");
    fireEvent.click(screen.getByRole("button", { name: "다음 단계" }));
    expect(hole("R7")).toHaveAttribute("data-hole-state", "open");
    expect(screen.getByTestId("recorder-scene")).toHaveAttribute("data-closed-holes", "T0 L1 L2 L3 R4 R5 R6");
    expect(document.querySelector(".recorder-pose-stage")).toHaveAttribute("data-pose-source", "/fingering/poses-focused/re.png");
  });

  it("traps help focus, blocks global shortcuts, and restores the settings trigger", async () => {
    await renderReadyApp();
    const opener = screen.getByRole("button", { name: "환경 설정" });
    openPanel("환경 설정", "도움말");
    const close = screen.getByRole("button", { name: "도움말 닫기" });
    expect(close).toHaveFocus();
    fireEvent.keyDown(window, { key: "5", code: "Digit5" });
    fireEvent.keyDown(window, { key: "@", code: "Digit2", shiftKey: true });
    expect(currentNote()).toHaveTextContent("도");
    for (const href of ["/compare", "/quiz", "/basics"]) {
      fireEvent.keyDown(window, { key: "Tab" });
      expect(screen.getByRole("dialog").querySelector(`a[href="${href}"]`)).toHaveFocus();
    }
    fireEvent.keyDown(window, { key: "Tab" });
    expect(close).toHaveFocus();
    fireEvent.keyDown(window, { key: "Tab", shiftKey: true });
    expect(within(screen.getByRole("dialog")).getByRole("link", { name: "기초 배우기" })).toHaveFocus();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it("starts a fresh sequence at 도 and resumes a paused position from the course panel", async () => {
    vi.useFakeTimers();
    await renderReadyApp();
    selectLow(5);
    await finishAnimations();
    openPanel("수업 도구", "연습 코스");
    fireEvent.click(screen.getByRole("button", { name: "순서 연습 시작" }));
    expect(currentNote()).toHaveTextContent("도");
    await act(async () => { await vi.advanceTimersByTimeAsync(1_500); });
    expect(currentNote()).toHaveTextContent("레");
    fireEvent.click(screen.getByRole("button", { name: "일시정지" }));
    fireEvent.click(screen.getByRole("button", { name: "이어서 연습" }));
    expect(currentNote()).toHaveTextContent("레");
  });

  it("keeps interrupted-motion instructions aligned with the real SVG diff", async () => {
    vi.useFakeTimers();
    await renderReadyApp();
    selectLow(8);
    selectLow(4);
    openPanel("수업 도구", "손가락 안내");
    expect(screen.getByText(/지금 자세에서 파 운지로 바꿔요/)).toBeInTheDocument();
    expect(screen.getByText("5번 · 오른손 가운데손가락")).toBeInTheDocument();
    expect(document.querySelector(".finger-chip-row.close")).not.toBeInTheDocument();
  });
});
