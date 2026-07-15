import { describe, expect, it } from "vitest";

import { getFingeringDiff } from "../animation/getFingeringDiff";
import {
  ALL_HOLES,
  FINGERINGS,
  FINGER_LABELS,
  HOLE_NUMBER_LABELS,
} from "../data/fingerings";
import { NOTE_META, NOTE_ORDER } from "../data/noteMeta";
import type { HoleId } from "../model/types";
import { buildInstruction } from "../utils/buildInstruction";
import {
  DEFAULT_PREFERENCES,
  STORAGE_KEY,
  loadPreferences,
  parsePreferences,
  savePreferences,
} from "../utils/storage";

describe("recorder domain data", () => {
  it("keeps the specified baroque and german fingerings", () => {
    expect(FINGERINGS.baroque.do).toEqual([
      "T0",
      "L1",
      "L2",
      "L3",
      "R4",
      "R5",
      "R6",
      "R7",
    ]);
    expect(FINGERINGS.baroque.fa).toEqual([
      "T0",
      "L1",
      "L2",
      "L3",
      "R4",
      "R6",
      "R7",
    ]);
    expect(FINGERINGS.german.fa).toEqual([
      "T0",
      "L1",
      "L2",
      "L3",
      "R4",
    ]);
    expect(FINGERINGS.baroque.highDo).toEqual(["T0", "L2"]);
    expect(FINGERINGS.german.highDo).toEqual(["T0", "L2"]);
  });

  it("contains eight notes, valid holes, and no duplicate holes", () => {
    const validHoles = new Set<HoleId>(ALL_HOLES);

    for (const system of ["baroque", "german"] as const) {
      expect(Object.keys(FINGERINGS[system])).toHaveLength(8);

      for (const note of NOTE_ORDER) {
        const fingering = FINGERINGS[system][note];
        expect(fingering.every((hole) => validHoles.has(hole))).toBe(true);
        expect(new Set(fingering).size).toBe(fingering.length);
      }
    }
  });

  it("maps every hole to one finger and one physical number", () => {
    expect(Object.keys(FINGER_LABELS)).toEqual(ALL_HOLES);
    expect(Object.keys(HOLE_NUMBER_LABELS)).toEqual(ALL_HOLES);
    expect(Object.values(HOLE_NUMBER_LABELS)).toEqual([
      "0",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
    ]);
  });

  it("assigns the UI buttons 1 through 8 exactly once", () => {
    expect(NOTE_ORDER.map((note) => NOTE_META[note].button)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8,
    ]);
  });

  it("differs between systems only for fa", () => {
    for (const note of NOTE_ORDER) {
      if (note === "fa") continue;
      expect(FINGERINGS.baroque[note]).toEqual(FINGERINGS.german[note]);
    }
  });

  it("rejects an invalid HoleId at compile time", () => {
    // @ts-expect-error R8 is not a recorder-domain hole identifier.
    const invalidHole: HoleId = "R8";
    expect(invalidHole).toBe("R8");
  });
});

describe("getFingeringDiff", () => {
  it("opens only R7 from do to re", () => {
    expect(
      getFingeringDiff(FINGERINGS.baroque.do, FINGERINGS.baroque.re),
    ).toMatchObject({ toOpen: ["R7"], toClose: [] });
  });

  it("closes R4, R6, and R7 from sol to baroque fa", () => {
    expect(
      getFingeringDiff(FINGERINGS.baroque.sol, FINGERINGS.baroque.fa)
        .toClose,
    ).toEqual(["R4", "R6", "R7"]);
  });

  it("opens R6 and R7 when baroque fa changes to german fa", () => {
    expect(
      getFingeringDiff(FINGERINGS.baroque.fa, FINGERINGS.german.fa),
    ).toMatchObject({ toOpen: ["R6", "R7"], toClose: [] });
  });

  it("reports stable open and closed holes in canonical order", () => {
    expect(
      getFingeringDiff(FINGERINGS.baroque.si, FINGERINGS.baroque.highDo),
    ).toEqual({
      toOpen: ["L1"],
      toClose: ["L2"],
      stayClosed: ["T0"],
      stayOpen: ["L3", "R4", "R5", "R6", "R7"],
    });
  });
});

describe("buildInstruction", () => {
  it("describes the closed holes and fingers for sol", () => {
    const instruction = buildInstruction("sol", "baroque");

    expect(instruction).toContain("솔은 0, 1, 2, 3번 구멍을 막아요.");
    expect(instruction).toContain("왼손 엄지, 검지, 가운데손가락과 약지");
    expect(instruction).toContain("오른손은 구멍에서 편안히 떼어요.");
  });

  it("gives the exact baroque/german fa distinction", () => {
    expect(buildInstruction("fa", "baroque")).toContain(
      "바로크식 파예요. 5번 구멍은 열고 6번과 7번 구멍은 막아요.",
    );
    expect(buildInstruction("fa", "german")).toContain(
      "독일식 파예요. 4번까지 막고 5번, 6번, 7번 구멍은 열어요.",
    );
  });

  it("describes the movement from the previous fingering", () => {
    expect(buildInstruction("re", "baroque", "do")).toContain(
      "도에서 레로 바뀌어요. 오른손 새끼손가락만 천천히 들어 올리세요.",
    );
  });

  it("describes a simultaneous open and close movement to high do", () => {
    const instruction = buildInstruction({
      note: "highDo",
      system: "baroque",
      previousNote: "si",
    });

    expect(instruction).toContain("높은 도는 0, 2번 구멍을 막아요.");
    expect(instruction).toContain("왼손 검지만 천천히 들어 올리세요.");
    expect(instruction).toContain("왼손 가운데손가락으로 2번 구멍을 가볍게 막으세요.");
  });

  it("can compare fa while the fingering system changes", () => {
    const instruction = buildInstruction({
      note: "fa",
      system: "german",
      previousNote: "fa",
      previousSystem: "baroque",
    });

    expect(instruction).toContain("오른손 약지와 새끼손가락을 천천히 들어 올리세요.");
    expect(instruction).toContain("바로크식에서 독일식 파 운지로 바꿔요.");
  });

  it("uses an interrupted animation's actual starting pose", () => {
    const instruction = buildInstruction({
      note: "fa",
      system: "baroque",
      previousNote: "highDo",
      previousSystem: "baroque",
      actualStartClosedHoles: FINGERINGS.baroque.do,
    });

    expect(instruction).toContain("지금 자세에서 파 운지로 바꿔요.");
    expect(instruction).toContain("오른손 가운데손가락만 천천히 들어 올리세요.");
    expect(instruction).not.toContain("1, 3, 4, 6, 7번 구멍");
  });
});

describe("preference storage", () => {
  it("recovers safe defaults from malformed storage", () => {
    expect(parsePreferences("not-json")).toEqual(DEFAULT_PREFERENCES);
    expect(
      parsePreferences(
        JSON.stringify({
          fingeringSystem: "unknown",
          isMuted: true,
          speed: "fast",
          showHoleNumbers: "yes",
          onboardingCompleted: true,
        }),
      ),
    ).toEqual({
      ...DEFAULT_PREFERENCES,
      isMuted: true,
      onboardingCompleted: true,
    });
  });

  it("persists only the five allowed preferences", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    };
    const preferences = {
      fingeringSystem: "german" as const,
      isMuted: true,
      speed: "slow" as const,
      showHoleNumbers: false,
      onboardingCompleted: true,
    };

    expect(savePreferences(preferences, storage)).toBe(true);
    expect(values.has(STORAGE_KEY)).toBe(true);
    expect(loadPreferences(storage)).toEqual(preferences);
  });

  it("does not throw when storage access fails", () => {
    const brokenStorage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("quota");
      },
    };

    expect(loadPreferences(brokenStorage)).toEqual(DEFAULT_PREFERENCES);
    expect(savePreferences({ ...DEFAULT_PREFERENCES }, brokenStorage)).toBe(false);
  });
});
