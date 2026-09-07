import { useCallback, useEffect, useRef, useState } from "react";
import { getCourse, getNoteBank, type CourseId } from "../data/practiceCourses";
import type { RecorderPreferences } from "../utils/storage";
import type { useNoteSelection } from "./useNoteSelection";

export function useSequencePractice({ preferences, update, selectNote, setStepMode, stopAudio }: {
  preferences: RecorderPreferences;
  update: (patch: Partial<RecorderPreferences>) => void;
  selectNote: ReturnType<typeof useNoteSelection>["selectNote"];
  setStepMode: (enabled: boolean) => void;
  stopAudio: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [sequencePlaying, setPlaying] = useState(false);
  const [sequencePaused, setPaused] = useState(false);
  const [completed, setCompleted] = useState(false);
  const generation = useRef(0);
  const course = getCourse(preferences.lastCourseId);
  const { courseMode: mode, courseIntervalMs: intervalMs } = preferences;
  const stopSequence = useCallback(() => {
    generation.current++;
    setPlaying(false); setPaused(false); setCompleted(false);
  }, []);
  const playStep = useCallback((position: number, play = true) => {
    const note = course.steps[position];
    selectNote(note, { stopSequence: false, play, bank: getNoteBank(note, course.bank) });
  }, [course, selectNote]);
  const selectCourse = useCallback((id: CourseId) => {
    stopSequence(); stopAudio(); setIndex(0);
    update({ lastCourseId: id });
    const next = getCourse(id);
    selectNote(next.steps[0], { stopSequence: false, play: false, bank: getNoteBank(next.steps[0], next.bank) });
  }, [stopSequence, stopAudio, update, selectNote]);
  const toggleSequence = useCallback(() => {
    generation.current++;
    if (sequencePlaying) { setPlaying(false); setPaused(true); stopAudio(); return; }
    setStepMode(false); setCompleted(false);
    const position = sequencePaused ? index : 0;
    setIndex(position); playStep(position); setPaused(false); setPlaying(true);
  }, [sequencePlaying, sequencePaused, index, playStep, setStepMode, stopAudio]);
  const resetSequence = useCallback(() => {
    stopSequence(); setIndex(0); playStep(0, false);
  }, [stopSequence, playStep]);
  const advance = useCallback(() => {
    if (!sequencePlaying) return;
    generation.current++;
    if (index >= course.steps.length - 1) {
      setPlaying(false); setPaused(false); setCompleted(true); stopAudio(); return;
    }
    setIndex(index + 1); playStep(index + 1);
  }, [sequencePlaying, index, course.steps.length, playStep, stopAudio]);
  useEffect(() => {
    if (!sequencePlaying || mode !== "auto") return;
    const request = generation.current;
    const timer = window.setTimeout(() => { if (request === generation.current) advance(); }, intervalMs);
    return () => window.clearTimeout(timer);
  }, [sequencePlaying, mode, intervalMs, advance]);
  useEffect(() => () => { generation.current++; }, []);
  return { course, index, mode, intervalMs, completed, sequencePlaying, sequencePaused, toggleSequence, resetSequence, stopSequence, selectCourse, advance };
}
