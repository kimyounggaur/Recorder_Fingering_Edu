import { describe, expect, it } from "vitest";

import {
  resolveNoteShortcut,
  type NoteShortcutEvent,
} from "./resolveNoteShortcut";

function shortcutEvent(
  overrides: Partial<NoteShortcutEvent> = {},
): NoteShortcutEvent {
  return {
    code: "Digit1",
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    metaKey: false,
    repeat: false,
    isComposing: false,
    getModifierState: () => false,
    ...overrides,
  };
}

describe("resolveNoteShortcut", () => {
  it.each([
    ["plain", {}, "do"],
    ["plain eighth", { code: "Digit8" }, "highDo"],
    ["control low", { code: "Digit5", ctrlKey: true }, "sol"],
    ["shift high", { code: "Digit1", shiftKey: true }, "highDo"],
    ["shift high fifth", { code: "Digit5", shiftKey: true }, "highSol"],
    ["alt chromatic", { code: "Digit1", altKey: true }, "doSharp"],
    ["alt chromatic fifth", { code: "Digit5", altKey: true }, "laSharp"],
  ] as const)("maps %s chords", (_name, overrides, expected) => {
    expect(resolveNoteShortcut(shortcutEvent(overrides))).toBe(expected);
  });

  it.each([
    { code: "Digit6", shiftKey: true },
    { code: "Digit7", shiftKey: true },
    { code: "Digit8", shiftKey: true },
    { code: "Digit6", altKey: true },
    { code: "Digit7", altKey: true },
    { code: "Digit8", altKey: true },
  ])("returns null for an unassigned bank slot: %o", (overrides) => {
    expect(resolveNoteShortcut(shortcutEvent(overrides))).toBeNull();
  });

  it.each([
    ["Meta", { metaKey: true }],
    ["Ctrl+Shift", { ctrlKey: true, shiftKey: true }],
    ["Ctrl+Alt", { ctrlKey: true, altKey: true }],
    ["Shift+Alt", { shiftKey: true, altKey: true }],
    ["all modifiers", { ctrlKey: true, shiftKey: true, altKey: true }],
    ["repeat", { repeat: true }],
    ["composition", { isComposing: true }],
  ] as const)("rejects %s", (_name, overrides) => {
    expect(resolveNoteShortcut(shortcutEvent(overrides))).toBeNull();
  });

  it("rejects AltGraph even when no modifier flags are exposed", () => {
    expect(
      resolveNoteShortcut(
        shortcutEvent({
          getModifierState: (key) => key === "AltGraph",
        }),
      ),
    ).toBeNull();
  });

  it.each(["Digit0", "Digit9", "Numpad1", "Key1", ""])(
    "rejects non-top-row code %j",
    (code) => {
      expect(resolveNoteShortcut(shortcutEvent({ code }))).toBeNull();
    },
  );
});
