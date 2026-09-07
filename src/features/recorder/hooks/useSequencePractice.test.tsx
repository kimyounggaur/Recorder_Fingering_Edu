import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getNoteBank, PRACTICE_COURSES } from "../data/practiceCourses";
import { NOTE_META } from "../data/noteMeta";
import { DEFAULT_PREFERENCES, parsePreferences } from "../utils/storage";
import { useSequencePractice } from "./useSequencePractice";

afterEach(() => vi.useRealTimers());
function setup(mode: "auto" | "manual" = "manual", interval = 1800) {
  const selectNote = vi.fn();
  const hook = renderHook(() => useSequencePractice({ preferences: { ...DEFAULT_PREFERENCES, courseMode: mode, courseIntervalMs: interval, lastCourseId: "rightHand" }, update: vi.fn(), selectNote, setStepMode: vi.fn(), stopAudio: vi.fn() }));
  return { ...hook, selectNote };
}
describe("practice courses", () => {
  it("has six unique courses containing valid notes in the designed order", () => {
    expect(new Set(PRACTICE_COURSES.map(course => course.id)).size).toBe(6);
    expect(PRACTICE_COURSES.map(course => course.steps.join(","))).toEqual([
      "sol,la,si,highDo,highRe", "do,re,mi,fa", "do,re,mi,fa,sol,la,si,highDo", "highDo,highRe,highMi,highFa,highSol", "doSharp,reSharp,faSharp,solSharp,laSharp", "do,re,mi,fa,sol,la,si,highDo,highRe,highMi,highFa,highSol",
    ]);
    for (const course of PRACTICE_COURSES) for (const note of course.steps) expect(NOTE_META[note]).toBeDefined();
    expect(getNoteBank("highDo", "high")).toBe("high");
    expect(getNoteBank("sol", "high")).toBe("low");
  });
  it("does not schedule a timer in manual mode and completes after the final step", () => {
    vi.useFakeTimers();
    const { result, selectNote } = setup();
    act(() => result.current.toggleSequence());
    expect(vi.getTimerCount()).toBe(0);
    for (let i = 0; i < 4; i++) act(() => result.current.advance());
    expect(result.current.completed).toBe(true);
    expect(result.current.sequencePlaying).toBe(false);
    expect(selectNote).toHaveBeenCalledTimes(4);
  });
  it("honors the interval, pauses, resumes, and cancels on direct selection", () => {
    vi.useFakeTimers();
    const { result } = setup("auto", 2400);
    act(() => result.current.toggleSequence());
    act(() => vi.advanceTimersByTime(2399));
    expect(result.current.index).toBe(0);
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.index).toBe(1);
    act(() => result.current.toggleSequence());
    expect(vi.getTimerCount()).toBe(0);
    act(() => result.current.toggleSequence());
    expect(result.current.index).toBe(1);
    act(() => result.current.stopSequence());
    expect(vi.getTimerCount()).toBe(0);
  });
  it("validates saved course settings and clamps the interval", () => {
    expect(parsePreferences('{"lastCourseId":"unknown","courseMode":"invalid","courseIntervalMs":9}')).toMatchObject({ lastCourseId: "lowScale", courseMode: "auto", courseIntervalMs: 1200 });
    expect(parsePreferences('{"speed":"slow"}').courseIntervalMs).toBe(2000);
  });
  it.each(PRACTICE_COURSES.flatMap(course => (["auto", "manual"] as const).map(mode => ({ course, mode }))))("completes $course.id in $mode mode", ({ course, mode }) => {
    vi.useFakeTimers();
    const selectNote = vi.fn();
    const update = vi.fn();
    const setStepMode = vi.fn();
    const stopAudio = vi.fn();
    const { result, unmount } = renderHook(() => useSequencePractice({ preferences: { ...DEFAULT_PREFERENCES, lastCourseId: course.id, courseMode: mode }, update, selectNote, setStepMode, stopAudio }));
    act(() => result.current.toggleSequence());
    for (let i = 0; i < course.steps.length; i++) {
      act(() => { if (mode === "manual") result.current.advance(); else vi.advanceTimersByTime(1500); });
    }
    expect(result.current.completed).toBe(true);
    expect(selectNote.mock.calls.map(call => call[0])).toEqual(course.steps);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
