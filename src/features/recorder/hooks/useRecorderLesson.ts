import {
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";
import { useRecorderAudio } from "../audio/useRecorderAudio";
import {
  NOTE_BANKS,
  NOTE_ORDER
} from "../data/noteMeta";
import {
  DEFAULT_PREFERENCES
} from "../utils/storage";
import { useGlobalShortcuts } from "./useGlobalShortcuts";
import { useNoteSelection } from "./useNoteSelection";
import { getRequestedBank, usePreferences } from "./usePreferences";
import { useReducedMotion } from "./useReducedMotion";
import { useSequencePractice } from "./useSequencePractice";
export function useRecorderLesson() {
  const { preferences, loaded: preferencesLoaded, update: updatePreferences, reset, restore } = usePreferences();
  const [statusMessage, setStatusMessage] = useState("");

  const [helpOpen, setHelpOpen] = useState(false);

  const [debug, setDebug] = useState(false);
  const reducedMotion = useReducedMotion();
  const audio = useRecorderAudio({
    initialMuted: DEFAULT_PREFERENCES.isMuted,
    persistMuted: false,
    pitchMode: preferences.pitchMode,
  });
  const stopSequenceRef = useRef(() => { });
  const onStopSequence = useCallback(() => stopSequenceRef.current(), []);
  const selection = useNoteSelection({ preferences, updatePreferences, reducedMotion, audio, onStopSequence });
  const sequence = useSequencePractice({ steps: NOTE_ORDER, intervalMs: preferences.speed === "slow" ? 2000 : 1500, selectedNote: selection.selectedNote, selectNote: selection.selectNote, setStepMode: selection.setStepMode, stopAudio: selection.cancelAudio });
  useEffect(() => { stopSequenceRef.current = sequence.stopSequence; }, [sequence.stopSequence]);
  const { setActiveBank, setSelectedNote } = selection;
  const { setMuted: setAudioMuted } = audio;
  useEffect(() => restore((stored, searchParams) => {
    const requestedBank = getRequestedBank(searchParams);
    if (requestedBank) { setActiveBank(requestedBank); setSelectedNote(NOTE_BANKS[requestedBank][0].note); }
    setAudioMuted(stored.isMuted);
    setDebug(process.env.NODE_ENV !== "production" && searchParams.get("debug") === "1");
  }), [restore, setActiveBank, setSelectedNote, setAudioMuted]);
  useGlobalShortcuts({ ...selection, helpOpen });
  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      // Fullscreen is optional and may be blocked by an embedded browser.
    }
  }, []);

  const closeHelp = useCallback(() => setHelpOpen(false), []);
  const resetPreferences = useCallback(() => { selection.prepareReset(); reset(); setStatusMessage("설정을 처음 상태로 되돌렸어요"); }, [selection, reset]);
  const setShowFingerNames = useCallback((showFingerNames: boolean) => updatePreferences({ showFingerNames }), [updatePreferences]);
  return { ...selection, ...sequence, preferences, preferencesLoaded, updatePreferences, resetPreferences, reducedMotion, audio, statusMessage, helpOpen, setHelpOpen, closeHelp, debug, toggleFullscreen, stepMode: preferences.stepMode, showFingerNames: preferences.showFingerNames, setShowFingerNames };
}
