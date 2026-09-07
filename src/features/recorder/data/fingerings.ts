import type {
  FingeringStateMap,
  FingeringSystem,
  HoleId,
  HoleState,
  SolfegeId,
} from "../model/types";
import { ALL_NOTE_IDS } from "./noteMeta";

export const ALL_HOLES: readonly HoleId[] = [
  "T0",
  "L1",
  "L2",
  "L3",
  "R4",
  "R5",
  "R6",
  "R7",
];

export const FINGER_LABELS: Record<HoleId, string> = {
  T0: "왼손 엄지",
  L1: "왼손 검지",
  L2: "왼손 가운데손가락",
  L3: "왼손 약지",
  R4: "오른손 검지",
  R5: "오른손 가운데손가락",
  R6: "오른손 약지",
  R7: "오른손 새끼손가락",
};

export const HOLE_NUMBER_LABELS: Record<HoleId, string> = {
  T0: "0",
  L1: "1",
  L2: "2",
  L3: "3",
  R4: "4",
  R5: "5",
  R6: "6",
  R7: "7",
};

function makeFingering(
  contacted: readonly HoleId[],
  overrides: Partial<Record<HoleId, HoleState>> = {},
): FingeringStateMap {
  const contactedSet = new Set(contacted);
  return Object.fromEntries(
    ALL_HOLES.map((hole) => [
      hole,
      overrides[hole] ?? (contactedSet.has(hole) ? "closed" : "open"),
    ]),
  ) as Record<HoleId, HoleState>;
}

const COMMON_FINGERING_STATES: Record<
  Exclude<SolfegeId, "fa" | "faSharp" | "highFa">,
  FingeringStateMap
> = {
  do: makeFingering(ALL_HOLES),
  re: makeFingering(["T0", "L1", "L2", "L3", "R4", "R5", "R6"]),
  mi: makeFingering(["T0", "L1", "L2", "L3", "R4", "R5"]),
  sol: makeFingering(["T0", "L1", "L2", "L3"]),
  la: makeFingering(["T0", "L1", "L2"]),
  si: makeFingering(["T0", "L1"]),
  highDo: makeFingering(["T0", "L2"]),
  doSharp: makeFingering(
    ["T0", "L1", "L2", "L3", "R4", "R5", "R6", "R7"],
    { R7: "partial" },
  ),
  reSharp: makeFingering(
    ["T0", "L1", "L2", "L3", "R4", "R5", "R6"],
    { R6: "partial" },
  ),
  solSharp: makeFingering(
    ["T0", "L1", "L2", "R4", "R5", "R6"],
    { R6: "partial" },
  ),
  laSharp: makeFingering(["T0", "L1", "L3", "R4"]),
  highRe: makeFingering(["L2"]),
  highMi: makeFingering(
    ["T0", "L1", "L2", "L3", "R4", "R5"],
    { T0: "half" },
  ),
  highSol: makeFingering(["T0", "L1", "L2", "L3"], { T0: "half" }),
};

export const FINGERING_STATES: Record<
  FingeringSystem,
  Record<SolfegeId, FingeringStateMap>
> = {
  baroque: {
    ...COMMON_FINGERING_STATES,
    fa: makeFingering(["T0", "L1", "L2", "L3", "R4", "R6", "R7"]),
    faSharp: makeFingering(["T0", "L1", "L2", "L3", "R5", "R6"]),
    highFa: makeFingering(
      ["T0", "L1", "L2", "L3", "R4", "R6"],
      { T0: "half" },
    ),
  },
  german: {
    ...COMMON_FINGERING_STATES,
    fa: makeFingering(["T0", "L1", "L2", "L3", "R4"]),
    faSharp: makeFingering([
      "T0",
      "L1",
      "L2",
      "L3",
      "R5",
      "R6",
      "R7",
    ]),
    highFa: makeFingering(["T0", "L1", "L2", "L3", "R4"], {
      T0: "half",
    }),
  },
};

export function getContactedHoles(
  fingering: FingeringStateMap,
): readonly HoleId[] {
  return ALL_HOLES.filter((hole) => fingering[hole] !== "open");
}

export function getFullyClosedHoles(
  fingering: FingeringStateMap,
): readonly HoleId[] {
  return ALL_HOLES.filter((hole) => fingering[hole] === "closed");
}

/**
 * Compatibility view used by the existing contact/release animation. Entries
 * include fully, half and partially covered holes because a finger still
 * contacts the recorder in all three states.
 */
export const FINGERINGS: Record<
  FingeringSystem,
  Record<SolfegeId, readonly HoleId[]>
> = Object.fromEntries(
  (["baroque", "german"] as const).map((system) => [
    system,
    Object.fromEntries(
      ALL_NOTE_IDS.map((note) => [
        note,
        getContactedHoles(FINGERING_STATES[system][note]),
      ]),
    ),
  ]),
) as Record<FingeringSystem, Record<SolfegeId, readonly HoleId[]>>;
