import {
  useCallback,
  useEffect,
  useState
} from "react";
import type {
  NoteBank
} from "../model/types";
import {
  DEFAULT_PREFERENCES,
  loadPreferences,
  savePreferences,
  type RecorderPreferences,
} from "../utils/storage";
import { ALL_NOTE_IDS, NOTE_BANKS } from "../data/noteMeta";
import { getNoteBank } from "../data/practiceCourses";
import type { SolfegeId } from "../model/types";

export function getRequestedBank(searchParams: URLSearchParams): NoteBank | null {
  const bank = searchParams.get("bank");
  if (bank === "low" || bank === "high" || bank === "chromatic") return bank;
  return null;
}
export function getRequestedSelection(searchParams: URLSearchParams): { note: SolfegeId; bank: NoteBank } | null {
  const bank = getRequestedBank(searchParams);
  const note = ALL_NOTE_IDS.find(id => id === searchParams.get("note"));
  if (note) return { note, bank: getNoteBank(note, bank ?? undefined) };
  if (bank) return { note: NOTE_BANKS[bank][0].note, bank };
  return null;
}
export function usePreferences() {
  const [preferences, setPreferences] = useState<RecorderPreferences>(() => ({
    ...DEFAULT_PREFERENCES,
  }));

  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  const updatePreferences = useCallback(
    (patch: Partial<RecorderPreferences>) => {
      setPreferences((current) => ({ ...current, ...patch }));
    },
    [],
  );
  useEffect(() => { if (preferencesLoaded) savePreferences(preferences); }, [preferences, preferencesLoaded]);
  const restore = useCallback((onRestore: (stored: RecorderPreferences, search: URLSearchParams) => void) => {
    const stored = loadPreferences();
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setPreferences(stored);
      onRestore(stored, new URLSearchParams(window.location.search));
      setPreferencesLoaded(true);
    });
    return () => { cancelled = true; };
  }, []);
  const reset = useCallback(() => setPreferences(current => ({ ...DEFAULT_PREFERENCES, onboardingCompleted: current.onboardingCompleted })), []);
  return { preferences, loaded: preferencesLoaded, update: updatePreferences, reset, restore };
}
