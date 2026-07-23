/**
 * Canonical lesson pitches. These stay aligned with NOTE_META's displayed
 * C4–G5 range so changing the synthesizer cannot silently transpose the lesson.
 */
export const RECORDER_NOTE_FREQUENCIES_HZ = {
  C4: 261.63,
  "C#4": 277.18,
  D4: 293.66,
  "D#4": 311.13,
  E4: 329.63,
  F4: 349.23,
  "F#4": 369.99,
  G4: 392,
  "G#4": 415.3,
  A4: 440,
  "A#4": 466.16,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  F5: 698.46,
  G5: 783.99,
} as const;

export type RecorderPitchKey = keyof typeof RECORDER_NOTE_FREQUENCIES_HZ;

/**
 * Short keys are used by NOTE_META. Canonical pitch keys remain accepted so a
 * future sample engine can use the same resolver and filenames.
 */
export const RECORDER_AUDIO_KEY_TO_PITCH: Readonly<
  Record<string, RecorderPitchKey>
> = {
  C: "C4",
  C4: "C4",
  "C#4": "C#4",
  D: "D4",
  D4: "D4",
  "D#4": "D#4",
  E: "E4",
  E4: "E4",
  F: "F4",
  F4: "F4",
  "F#4": "F#4",
  G: "G4",
  G4: "G4",
  "G#4": "G#4",
  A: "A4",
  A4: "A4",
  "A#4": "A#4",
  B: "B4",
  B4: "B4",
  HIGH_C: "C5",
  "HIGH-C": "C5",
  C5: "C5",
  D5: "D5",
  E5: "E5",
  F5: "F5",
  G5: "G5",
};

/** Nine-note ascending check used by the development audio demo. */
export const BASIC_RECORDER_DEMO_AUDIO_KEYS = [
  "C",
  "D",
  "E",
  "F",
  "G",
  "A",
  "B",
  "HIGH_C",
  "D5",
] as const;

export function getRecorderNoteFrequency(noteKey: string): number | null {
  const normalizedKey = noteKey.trim().toUpperCase();
  const pitchKey = RECORDER_AUDIO_KEY_TO_PITCH[normalizedKey];

  return pitchKey === undefined
    ? null
    : RECORDER_NOTE_FREQUENCIES_HZ[pitchKey];
}
