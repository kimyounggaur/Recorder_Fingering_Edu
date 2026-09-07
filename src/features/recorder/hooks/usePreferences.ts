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
export function getRequestedBank(searchParams: URLSearchParams): NoteBank | null {
  const bank = searchParams.get("bank");
  if (bank === "low" || bank === "high" || bank === "chromatic") return bank;
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
