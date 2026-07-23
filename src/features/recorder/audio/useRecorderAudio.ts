"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  createSilentRecorderAudioEngine,
  type RecorderAudioEngine,
} from "./RecorderAudioEngine";
import { createWebAudioRecorderEngine } from "./WebAudioRecorderEngine";

export const RECORDER_AUDIO_MUTED_STORAGE_KEY =
  "recorder-learning:audio-muted";

export type RecorderAudioRequestId = number;

export interface UseRecorderAudioOptions {
  initialMuted?: boolean;
  persistMuted?: boolean;
  storageKey?: string;
  engineFactory?: () => RecorderAudioEngine;
}

export interface UseRecorderAudioResult {
  isMuted: boolean;
  /** True after unlock has completed without throwing. */
  isUnlocked: boolean;
  /**
   * Call synchronously inside the note-button user gesture. It unlocks Web
   * Audio, fades the previous note, and returns a stale-request guard.
   */
  beginPlaybackRequest: () => RecorderAudioRequestId;
  /** Call from the matching animation contact callback. */
  playAtContact: (
    noteKey: string,
    requestId: RecorderAudioRequestId,
  ) => Promise<boolean>;
  cancelPlaybackRequest: (
    requestId?: RecorderAudioRequestId,
    fadeMs?: number,
  ) => void;
  stop: (fadeMs?: number) => void;
  unlock: () => Promise<boolean>;
  preload: () => Promise<void>;
  setMuted: (muted: boolean) => void;
  toggleMuted: () => void;
}

function readStoredMuted(storageKey: string): boolean | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(storageKey);
    if (stored === "true") {
      return true;
    }
    if (stored === "false") {
      return false;
    }
  } catch {
    // Storage can be unavailable in private/embedded browser contexts.
  }

  return null;
}

function writeStoredMuted(storageKey: string, muted: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(storageKey, String(muted));
  } catch {
    // Muting still works for this session when persistence fails.
  }
}

export function useRecorderAudio(
  options: UseRecorderAudioOptions = {},
): UseRecorderAudioResult {
  const {
    initialMuted = false,
    persistMuted = true,
    storageKey = RECORDER_AUDIO_MUTED_STORAGE_KEY,
    engineFactory = createWebAudioRecorderEngine,
  } = options;

  const factoryRef = useRef(engineFactory);
  const engineRef = useRef<RecorderAudioEngine | null>(null);
  const disposedRef = useRef(false);
  const mutedRef = useRef(initialMuted);
  const unlockedRef = useRef(false);
  const unlockPromiseRef = useRef<Promise<boolean> | null>(null);
  const latestRequestIdRef = useRef(0);
  const [isMuted, setIsMuted] = useState(initialMuted);
  const [isUnlocked, setIsUnlocked] = useState(false);

  const getEngine = useCallback((): RecorderAudioEngine => {
    if (engineRef.current !== null) {
      return engineRef.current;
    }

    try {
      engineRef.current = factoryRef.current();
    } catch {
      engineRef.current = createSilentRecorderAudioEngine();
    }

    engineRef.current.setMuted(mutedRef.current);
    return engineRef.current;
  }, []);

  const unlock = useCallback(async (): Promise<boolean> => {
    if (disposedRef.current) {
      return false;
    }
    if (unlockedRef.current) {
      return true;
    }
    if (unlockPromiseRef.current !== null) {
      return unlockPromiseRef.current;
    }

    const pendingUnlock = getEngine()
      .unlock()
      .then((unlocked) => {
        if (disposedRef.current || !unlocked) {
          return false;
        }

        unlockedRef.current = true;
        setIsUnlocked(true);
        return true;
      })
      .catch(() => false)
      .finally(() => {
        if (unlockPromiseRef.current === pendingUnlock) {
          unlockPromiseRef.current = null;
        }
      });

    unlockPromiseRef.current = pendingUnlock;
    return pendingUnlock;
  }, [getEngine]);

  const preload = useCallback(async (): Promise<void> => {
    try {
      await getEngine().preload();
    } catch {
      // Sample/synth preparation is optional; the lesson must keep working.
    }
  }, [getEngine]);

  const beginPlaybackRequest = useCallback((): RecorderAudioRequestId => {
    latestRequestIdRef.current += 1;
    const requestId = latestRequestIdRef.current;

    if (!disposedRef.current) {
      getEngine().stop();
      // unlock() starts synchronously here, while the user gesture is active.
      void unlock();
    }

    return requestId;
  }, [getEngine, unlock]);

  const playAtContact = useCallback(
    async (
      noteKey: string,
      requestId: RecorderAudioRequestId,
    ): Promise<boolean> => {
      if (
        disposedRef.current ||
        mutedRef.current ||
        requestId !== latestRequestIdRef.current
      ) {
        return false;
      }

      // Never create/unlock audio from a delayed contact callback. A matching
      // beginPlaybackRequest() must already have run in the user gesture.
      const pendingUnlock = unlockPromiseRef.current;
      if (!unlockedRef.current && pendingUnlock === null) {
        return false;
      }

      const ready = unlockedRef.current || (await pendingUnlock);
      if (
        !ready ||
        disposedRef.current ||
        mutedRef.current ||
        requestId !== latestRequestIdRef.current
      ) {
        return false;
      }

      try {
        await getEngine().play(noteKey);
      } catch {
        return false;
      }

      return (
        !disposedRef.current &&
        !mutedRef.current &&
        requestId === latestRequestIdRef.current
      );
    },
    [getEngine],
  );

  const cancelPlaybackRequest = useCallback(
    (requestId?: RecorderAudioRequestId, fadeMs?: number): void => {
      if (
        requestId !== undefined &&
        requestId !== latestRequestIdRef.current
      ) {
        return;
      }

      latestRequestIdRef.current += 1;
      if (!disposedRef.current) {
        getEngine().stop(fadeMs);
      }
    },
    [getEngine],
  );

  const stop = useCallback(
    (fadeMs?: number): void => {
      cancelPlaybackRequest(undefined, fadeMs);
    },
    [cancelPlaybackRequest],
  );

  const setMuted = useCallback(
    (muted: boolean): void => {
      mutedRef.current = muted;
      setIsMuted(muted);

      if (muted) {
        latestRequestIdRef.current += 1;
      }
      if (!disposedRef.current) {
        getEngine().setMuted(muted);
      }
      if (persistMuted) {
        writeStoredMuted(storageKey, muted);
      }
    },
    [getEngine, persistMuted, storageKey],
  );

  const toggleMuted = useCallback((): void => {
    setMuted(!mutedRef.current);
  }, [setMuted]);

  useEffect(() => {
    disposedRef.current = false;
    getEngine().setMuted(mutedRef.current);

    return () => {
      disposedRef.current = true;
      latestRequestIdRef.current += 1;
      unlockedRef.current = false;
      unlockPromiseRef.current = null;
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, [getEngine]);

  useEffect(() => {
    const storedMuted = persistMuted ? readStoredMuted(storageKey) : null;
    const restoredMuted = storedMuted ?? initialMuted;
    let cancelled = false;

    // Apply browser-only storage after hydration without a synchronous state
    // cascade inside the effect body.
    queueMicrotask(() => {
      if (!cancelled) {
        setMuted(restoredMuted);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [initialMuted, persistMuted, setMuted, storageKey]);

  return {
    isMuted,
    isUnlocked,
    beginPlaybackRequest,
    playAtContact,
    cancelPlaybackRequest,
    stop,
    unlock,
    preload,
    setMuted,
    toggleMuted,
  };
}
