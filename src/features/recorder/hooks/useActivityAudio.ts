import { useEffect } from "react";
import { useRecorderAudio } from "../audio/useRecorderAudio";
import { DEFAULT_PREFERENCES } from "../utils/storage";
import { usePreferences } from "./usePreferences";
import { useReducedMotion } from "./useReducedMotion";

export function useActivityAudio() {
  const settings = usePreferences();
  const reducedMotion = useReducedMotion();
  const audio = useRecorderAudio({ initialMuted: DEFAULT_PREFERENCES.isMuted, persistMuted: false, pitchMode: settings.preferences.pitchMode });
  const { restore } = settings;
  const { setMuted } = audio;
  useEffect(() => restore(stored => setMuted(stored.isMuted)), [restore, setMuted]);
  return { ...settings, audio, reducedMotion };
}
