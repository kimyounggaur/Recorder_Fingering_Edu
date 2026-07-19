import { NOTE_BANKS } from "../data/noteMeta";
import type {
  NoteBank,
  SolfegeId,
  UiButtonNumber,
} from "../model/types";

export interface NoteShortcutEvent {
  readonly code: string;
  readonly ctrlKey: boolean;
  readonly shiftKey: boolean;
  readonly altKey: boolean;
  readonly metaKey: boolean;
  readonly repeat: boolean;
  readonly isComposing: boolean;
  readonly getModifierState?: (key: string) => boolean;
}

function getDigit(code: string): UiButtonNumber | null {
  const match = /^Digit([1-8])$/.exec(code);
  return match ? (Number(match[1]) as UiButtonNumber) : null;
}

function getBank(event: NoteShortcutEvent): NoteBank | null {
  const modifierCount =
    Number(event.ctrlKey) + Number(event.shiftKey) + Number(event.altKey);

  if (modifierCount > 1) return null;
  if (event.ctrlKey) return "low";
  if (event.shiftKey) return "high";
  if (event.altKey) return "chromatic";
  return "low";
}

/** Resolve a top-row number chord to the note assigned by the active bank. */
export function resolveNoteShortcut(
  event: NoteShortcutEvent,
): SolfegeId | null {
  if (
    event.metaKey ||
    event.repeat ||
    event.isComposing ||
    event.getModifierState?.("AltGraph")
  ) {
    return null;
  }

  const digit = getDigit(event.code);
  const bank = getBank(event);
  if (digit === null || bank === null) return null;

  return NOTE_BANKS[bank].find((entry) => entry.digit === digit)?.note ?? null;
}
