import {
  useEffect
} from "react";
import type {
  NoteBank
} from "../model/types";
import { resolveNoteShortcut } from "../utils/resolveNoteShortcut";
import type { useNoteSelection } from "./useNoteSelection";
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  );
}
export function useGlobalShortcuts({ activeBank, goNext, goPrevious, helpOpen, playCurrentNote, selectNote }: Pick<ReturnType<typeof useNoteSelection>, "activeBank" | "goNext" | "goPrevious" | "playCurrentNote" | "selectNote"> & { helpOpen: boolean }) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (helpOpen || event.defaultPrevented) return;
      if (isTypingTarget(event.target) || event.isComposing) return;

      const shortcutNote = resolveNoteShortcut(event, activeBank);
      if (shortcutNote) {
        const bank: NoteBank = event.shiftKey
          ? "high"
          : event.altKey
            ? "chromatic"
            : event.ctrlKey ? "low" : activeBank;
        event.preventDefault();
        selectNote(shortcutNote, { bank });
        return;
      }

      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrevious();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      } else if (event.key === " " && !(event.target instanceof HTMLButtonElement)) {
        event.preventDefault();
        playCurrentNote();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeBank, goNext, goPrevious, helpOpen, playCurrentNote, selectNote]);
}
