import {
  useCallback,
  useEffect,
  useState
} from "react";
import type {
  SolfegeId
} from "../model/types";
import type { useNoteSelection } from "./useNoteSelection";
export function useSequencePractice({ steps, intervalMs, selectedNote, selectNote, setStepMode, stopAudio }: {
  steps: readonly SolfegeId[]; intervalMs: number; selectedNote: SolfegeId;
  selectNote: ReturnType<typeof useNoteSelection>["selectNote"]; setStepMode: (enabled: boolean) => void; stopAudio: () => void;
}) {
  const [sequencePlaying, setSequencePlaying] = useState(false);

  const [sequencePaused, setSequencePaused] = useState(false);

  const toggleSequence = useCallback(() => {
    if (sequencePlaying) {
      setSequencePlaying(false);
      setSequencePaused(true);
      stopAudio();
      return;
    }

    setStepMode(false);
    if (sequencePaused) {
      selectNote(selectedNote, {
        stopSequence: false,
        play: true,
        bank: "low",
      });
      setSequencePaused(false);
      setSequencePlaying(true);
      return;
    }

    selectNote(steps[0], { stopSequence: false, play: true, bank: "low" });
    setSequencePaused(false);
    setSequencePlaying(true);
  }, [selectNote, selectedNote, sequencePaused, sequencePlaying, setStepMode, stopAudio, steps]);

  const resetSequence = useCallback(() => {
    setSequencePlaying(false);
    setSequencePaused(false);
    selectNote(steps[0], { stopSequence: false, play: false, bank: "low" });
  }, [selectNote, steps]);
  useEffect(() => {
    if (!sequencePlaying) return;

    const timer = window.setTimeout(() => {
      const index = steps.indexOf(selectedNote);
      if (index >= steps.length - 1) {
        setSequencePlaying(false);
        setSequencePaused(false);
        return;
      }
      selectNote(steps[index + 1], {
        stopSequence: false,
        play: true,
        bank: "low",
      });
    }, intervalMs);
    return () => window.clearTimeout(timer);
  }, [intervalMs, steps, selectNote, selectedNote, sequencePlaying]);
  const stopSequence = useCallback(() => { setSequencePlaying(false); setSequencePaused(false); }, []);
  return { sequencePlaying, sequencePaused, toggleSequence, resetSequence, stopSequence };
}
