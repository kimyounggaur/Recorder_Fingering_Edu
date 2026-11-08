import { useCallback, useEffect, useRef, useState } from "react";

export function useStageFullscreen() {
  const stageRef = useRef<HTMLElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [active, setActive] = useState(false);
  const [fallback, setFallback] = useState(false);
  const activeRef = useRef(false);
  const close = useCallback(async () => {
    activeRef.current = false;
    setActive(false);
    setFallback(false);
    if (document.fullscreenElement === stageRef.current) {
      try { await document.exitFullscreen(); } catch { /* The layout has already been restored. */ }
    }
    buttonRef.current?.focus();
  }, []);
  const toggle = useCallback(async () => {
    if (activeRef.current) { await close(); return; }
    const stage = stageRef.current;
    if (!stage) return;
    activeRef.current = true;
    setActive(true);
    try {
      if (!stage.requestFullscreen) throw new Error("Fullscreen unavailable");
      await stage.requestFullscreen();
      if (!activeRef.current && document.fullscreenElement === stage) await document.exitFullscreen();
    } catch {
      if (activeRef.current) setFallback(true);
    }
  }, [close]);
  useEffect(() => {
    const changed = () => {
      if (activeRef.current && !document.fullscreenElement && !fallback) void close();
    };
    const keydown = (event: KeyboardEvent) => {
      if (activeRef.current && event.key === "Escape" && fallback) { event.preventDefault(); void close(); }
    };
    document.addEventListener("fullscreenchange", changed);
    window.addEventListener("keydown", keydown);
    return () => {
      document.removeEventListener("fullscreenchange", changed);
      window.removeEventListener("keydown", keydown);
    };
  }, [close, fallback]);
  return { stageRef, buttonRef, active, fallback, toggle };
}
