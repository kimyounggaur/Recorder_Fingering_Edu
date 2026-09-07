/**
 * Audio is deliberately kept behind this small interface so that recorder
 * practice remains usable when Web Audio is unavailable or blocked.
 */
export interface RecorderAudioEngine {
  unlock(): Promise<boolean>;
  preload(): Promise<void>;
  play(noteKey: string): Promise<void>;
  stop(fadeMs?: number): void;
  setMuted(muted: boolean): void;
  dispose(): void;
}

/** A fresh, stateless fallback for SSR, tests, and audio-disabled browsers. */
export function createSilentRecorderAudioEngine(): RecorderAudioEngine {
  return {
    unlock: () => Promise.resolve(false),
    preload: () => Promise.resolve(),
    play: () => Promise.resolve(),
    stop: () => undefined,
    setMuted: () => undefined,
    dispose: () => undefined,
  };
}
