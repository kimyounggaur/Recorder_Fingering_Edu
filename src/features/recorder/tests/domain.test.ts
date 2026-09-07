import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { getFingeringDiff } from "../animation/getFingeringDiff";
import {
  ALL_HOLES,
  FINGERINGS,
  FINGERING_STATES,
  FINGER_LABELS,
  HOLE_NUMBER_LABELS,
} from "../data/fingerings";
import {
  ALL_NOTE_IDS,
  NOTE_BANKS,
  NOTE_META,
  NOTE_ORDER,
} from "../data/noteMeta";
import { getRecorderPoseSource, RECORDER_POSE_SOURCES } from "../data/poseAssets";
import type { HoleId, HoleState, SolfegeId } from "../model/types";
import { buildInstruction } from "../utils/buildInstruction";
import {
  DEFAULT_PREFERENCES,
  STORAGE_KEY,
  loadPreferences,
  parsePreferences,
  savePreferences,
} from "../utils/storage";

describe("recorder domain data", () => {
  it("contains 17 notes and exposes 8/5/5 banks with C5 shared", () => {
    expect(ALL_NOTE_IDS).toHaveLength(17);
    expect(new Set(ALL_NOTE_IDS).size).toBe(17);
    expect(Object.keys(NOTE_META).sort()).toEqual([...ALL_NOTE_IDS].sort());

    expect(NOTE_BANKS.low).toHaveLength(8);
    expect(NOTE_BANKS.high).toHaveLength(5);
    expect(NOTE_BANKS.chromatic).toHaveLength(5);
    expect(NOTE_BANKS.low.map(({ digit }) => digit)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8,
    ]);
    expect(NOTE_BANKS.high.map(({ digit }) => digit)).toEqual([1, 2, 3, 4, 5]);
    expect(NOTE_BANKS.chromatic.map(({ digit }) => digit)).toEqual([
      1, 2, 3, 4, 5,
    ]);
    expect(NOTE_BANKS.low[7]).toEqual({ note: "highDo", digit: 8 });
    expect(NOTE_BANKS.high[0]).toEqual({ note: "highDo", digit: 1 });
    expect(
      new Set(Object.values(NOTE_BANKS).flatMap((bank) => bank.map(({ note }) => note))),
    ).toEqual(new Set(ALL_NOTE_IDS));
  });

  it("provides a valid complete FingeringStateMap for every note and system", () => {
    const validStates = new Set<HoleState>([
      "open",
      "closed",
      "half",
      "partial",
    ]);

    for (const system of ["baroque", "german"] as const) {
      expect(Object.keys(FINGERING_STATES[system]).sort()).toEqual(
        [...ALL_NOTE_IDS].sort(),
      );

      for (const note of ALL_NOTE_IDS) {
        const states = FINGERING_STATES[system][note];
        expect(Object.keys(states)).toEqual(ALL_HOLES);
        expect(Object.values(states).every((state) => validStates.has(state))).toBe(
          true,
        );
        expect(FINGERINGS[system][note]).toEqual(
          ALL_HOLES.filter((hole) => states[hole] !== "open"),
        );
      }
    }
  });

  it("marks C-sharp, D-sharp, and G-sharp double holes as partial", () => {
    const partialHoleByNote = {
      doSharp: "R7",
      reSharp: "R6",
      solSharp: "R6",
    } as const satisfies Partial<Record<SolfegeId, HoleId>>;

    for (const system of ["baroque", "german"] as const) {
      for (const [note, partialHole] of Object.entries(partialHoleByNote) as Array<
        [keyof typeof partialHoleByNote, HoleId]
      >) {
        const states = FINGERING_STATES[system][note];
        expect(states[partialHole]).toBe("partial");
        expect(
          ALL_HOLES.filter((hole) => states[hole] === "partial"),
        ).toEqual([partialHole]);
      }
    }
  });

  it("uses a half-open thumb for E5, F5, and G5", () => {
    for (const system of ["baroque", "german"] as const) {
      for (const note of ["highMi", "highFa", "highSol"] as const) {
        const states = FINGERING_STATES[system][note];
        expect(states.T0).toBe("half");
        expect(ALL_HOLES.filter((hole) => states[hole] === "half")).toEqual([
          "T0",
        ]);
      }
    }
  });

  it("differs by system only for fa, fa-sharp, and high fa", () => {
    const systemSpecificNotes = new Set<SolfegeId>([
      "fa",
      "faSharp",
      "highFa",
    ]);

    for (const note of ALL_NOTE_IDS) {
      if (systemSpecificNotes.has(note)) {
        expect(FINGERING_STATES.baroque[note]).not.toEqual(
          FINGERING_STATES.german[note],
        );
      } else {
        expect(FINGERING_STATES.baroque[note]).toEqual(
          FINGERING_STATES.german[note],
        );
      }
    }

    expect(FINGERING_STATES.baroque.fa.R6).toBe("closed");
    expect(FINGERING_STATES.german.fa.R6).toBe("open");
    expect(FINGERING_STATES.baroque.faSharp.R7).toBe("open");
    expect(FINGERING_STATES.german.faSharp.R7).toBe("closed");
    expect(FINGERING_STATES.baroque.highFa.R6).toBe("closed");
    expect(FINGERING_STATES.german.highFa.R6).toBe("open");
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

  it("maps every note to a pose and changes system-specific notes", () => {
    const systemSpecificNotes = new Set<SolfegeId>([
      "fa",
      "faSharp",
      "highFa",
    ]);

    for (const note of ALL_NOTE_IDS) {
      const baroqueSource = getRecorderPoseSource(note, "baroque");
      const germanSource = getRecorderPoseSource(note, "german");

      expect(RECORDER_POSE_SOURCES).toContain(baroqueSource);
      expect(RECORDER_POSE_SOURCES).toContain(germanSource);
      expect(baroqueSource.endsWith(".png")).toBe(true);

      if (systemSpecificNotes.has(note)) {
        expect(germanSource).not.toBe(baroqueSource);
      } else {
        expect(germanSource).toBe(baroqueSource);
      }
    }
  });

  it("ships all 20 pose files in one aligned 976×1360 frame", () => {
    expect(RECORDER_POSE_SOURCES).toHaveLength(20);
    expect(new Set(RECORDER_POSE_SOURCES).size).toBe(20);

    for (const source of RECORDER_POSE_SOURCES) {
      const png = readFileSync(
        join(process.cwd(), "public", source.replace(/^\//, "")),
      );
      expect(png.subarray(1, 4).toString("ascii")).toBe("PNG");
      expect(png.readUInt32BE(16)).toBe(976);
      expect(png.readUInt32BE(20)).toBe(1360);
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

  it("describes partial double holes and half-open thumbs", () => {
    expect(buildInstruction("doSharp", "baroque")).toContain(
      "7번 이중 구멍은 한쪽만 막아요.",
    );
    expect(buildInstruction("highMi", "baroque")).toContain(
      "0번은 반만 열어요.",
    );
    expect(buildInstruction("highFa", "baroque")).toContain(
      "바로크식 높은 파예요.",
    );
    expect(buildInstruction("highFa", "german")).toContain(
      "독일식 높은 파예요.",
    );
  });

  it("explains a coverage-only change instead of calling it unchanged", () => {
    const instruction = buildInstruction({
      note: "doSharp",
      system: "baroque",
      previousNote: "do",
    });

    expect(instruction).toContain("7번 이중 구멍은 한쪽만 막아 주세요.");
    expect(instruction).not.toContain("손가락은 그대로 두면 돼요.");
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
