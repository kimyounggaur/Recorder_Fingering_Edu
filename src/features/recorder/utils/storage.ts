import type { FingeringSystem, PlaybackSpeed } from "../model/types";

export interface RecorderPreferences {
  fingeringSystem: FingeringSystem;
  isMuted: boolean;
  speed: PlaybackSpeed;
  showHoleNumbers: boolean;
  onboardingCompleted: boolean;
}

export interface ReadableStorage {
  getItem(key: string): string | null;
}

export interface WritableStorage {
  setItem(key: string, value: string): void;
}

export const STORAGE_KEY = "recorder-learning.preferences.v1";

export const DEFAULT_PREFERENCES: Readonly<RecorderPreferences> = {
  fingeringSystem: "baroque",
  isMuted: false,
  speed: "normal",
  showHoleNumbers: true,
  onboardingCompleted: false,
};

function getBrowserStorage(): Storage | null {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parsePreferences(serialized: string | null): RecorderPreferences {
  if (!serialized) return { ...DEFAULT_PREFERENCES };

  try {
    const candidate: unknown = JSON.parse(serialized);
    if (!isRecord(candidate)) return { ...DEFAULT_PREFERENCES };

    return {
      fingeringSystem:
        candidate.fingeringSystem === "baroque" ||
        candidate.fingeringSystem === "german"
          ? candidate.fingeringSystem
          : DEFAULT_PREFERENCES.fingeringSystem,
      isMuted:
        typeof candidate.isMuted === "boolean"
          ? candidate.isMuted
          : DEFAULT_PREFERENCES.isMuted,
      speed:
        candidate.speed === "normal" || candidate.speed === "slow"
          ? candidate.speed
          : DEFAULT_PREFERENCES.speed,
      showHoleNumbers:
        typeof candidate.showHoleNumbers === "boolean"
          ? candidate.showHoleNumbers
          : DEFAULT_PREFERENCES.showHoleNumbers,
      onboardingCompleted:
        typeof candidate.onboardingCompleted === "boolean"
          ? candidate.onboardingCompleted
          : DEFAULT_PREFERENCES.onboardingCompleted,
    };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export function loadPreferences(
  storage: ReadableStorage | null = getBrowserStorage(),
): RecorderPreferences {
  if (!storage) return { ...DEFAULT_PREFERENCES };

  try {
    return parsePreferences(storage.getItem(STORAGE_KEY));
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export function savePreferences(
  preferences: RecorderPreferences,
  storage: WritableStorage | null = getBrowserStorage(),
): boolean {
  if (!storage) return false;

  const persistedPreferences: RecorderPreferences = {
    fingeringSystem: preferences.fingeringSystem,
    isMuted: preferences.isMuted,
    speed: preferences.speed,
    showHoleNumbers: preferences.showHoleNumbers,
    onboardingCompleted: preferences.onboardingCompleted,
  };

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(persistedPreferences));
    return true;
  } catch {
    return false;
  }
}

export const loadStoredPreferences = loadPreferences;
export const saveStoredPreferences = savePreferences;
