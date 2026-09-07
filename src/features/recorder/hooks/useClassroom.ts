import { useCallback, useEffect, useRef, useState } from "react";
import type { FingeringSystem, NoteBank, PlaybackSpeed, SolfegeId } from "../model/types";

export interface ClassroomSnapshot { note: SolfegeId; bank: NoteBank; system: FingeringSystem; speed: PlaybackSpeed; stepMode: boolean; }
export function useClassroom(snapshot: ClassroomSnapshot, restore: (snapshot: ClassroomSnapshot) => void, stop: () => void) {
  const [active, setActive] = useState(false);
  const saved = useRef<ClassroomSnapshot | null>(null);
  const focus = useRef<HTMLElement | null>(null);
  const generation = useRef(0);
  const enteredFullscreen = useRef(false);
  const exit = useCallback(async () => {
    const previous = saved.current;
    if (!previous) return;
    saved.current = null; generation.current++; enteredFullscreen.current = false;
    delete document.body.dataset.classroom;
    setActive(false); stop(); restore(previous);
    queueMicrotask(() => { if (focus.current?.isConnected) focus.current.focus(); });
    if (document.fullscreenElement) { try { await document.exitFullscreen(); } catch { /* Layout is already restored. */ } }
  }, [restore, stop]);
  const toggle = useCallback(async () => {
    if (saved.current) { await exit(); return; }
    saved.current = snapshot;
    focus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const request = ++generation.current;
    stop(); setActive(true); document.body.dataset.classroom = "true";
    try {
      await document.documentElement.requestFullscreen?.();
      if (request !== generation.current) { if (document.fullscreenElement) await document.exitFullscreen(); return; }
      enteredFullscreen.current = !!document.fullscreenElement;
    } catch { /* The same classroom layout remains available without fullscreen. */ }
  }, [exit, snapshot, stop]);
  useEffect(() => {
    const changed = () => { if (saved.current && enteredFullscreen.current && !document.fullscreenElement) void exit(); };
    document.addEventListener("fullscreenchange", changed);
    return () => document.removeEventListener("fullscreenchange", changed);
  }, [exit]);
  useEffect(() => () => {
    generation.current++; saved.current = null; delete document.body.dataset.classroom;
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
  }, []);
  return { active, toggle, exit };
}
