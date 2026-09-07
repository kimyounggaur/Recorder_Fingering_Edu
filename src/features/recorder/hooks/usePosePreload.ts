import { useEffect } from "react";
import { NOTE_BANKS } from "../data/noteMeta";
import { getRecorderPoseSource, RECORDER_POSE_SOURCES } from "../data/poseAssets";
import type { FingeringSystem, NoteBank } from "../model/types";
import { loadPose } from "../utils/poseLoader";

export function getBankPoseSources(bank: NoteBank, system: FingeringSystem) {
  return NOTE_BANKS[bank].map(({ note }) => getRecorderPoseSource(note, system));
}

export function usePosePreload(bank: NoteBank, system: FingeringSystem) {
  useEffect(() => {
    const priority = new Set(getBankPoseSources(bank, system));
    for (const source of priority) void loadPose(source).catch(() => undefined);
    let disposed = false;
    const loadRest = () => {
      if (disposed) return;
      for (const source of RECORDER_POSE_SOURCES) {
        if (!priority.has(source)) void loadPose(source).catch(() => undefined);
      }
    };
    const idle = typeof window.requestIdleCallback === "function";
    const handle = idle
      ? window.requestIdleCallback(loadRest, { timeout: 2000 })
      : window.setTimeout(loadRest, 1000);
    return () => {
      disposed = true;
      if (idle) window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
    };
  }, [bank, system]);
}
