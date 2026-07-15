import type { FingeringSystem, HoleId, SolfegeId } from "../model/types";

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

export const FINGERINGS: Record<
  FingeringSystem,
  Record<SolfegeId, readonly HoleId[]>
> = {
  baroque: {
    do: ["T0", "L1", "L2", "L3", "R4", "R5", "R6", "R7"],
    re: ["T0", "L1", "L2", "L3", "R4", "R5", "R6"],
    mi: ["T0", "L1", "L2", "L3", "R4", "R5"],
    fa: ["T0", "L1", "L2", "L3", "R4", "R6", "R7"],
    sol: ["T0", "L1", "L2", "L3"],
    la: ["T0", "L1", "L2"],
    si: ["T0", "L1"],
    highDo: ["T0", "L2"],
  },
  german: {
    do: ["T0", "L1", "L2", "L3", "R4", "R5", "R6", "R7"],
    re: ["T0", "L1", "L2", "L3", "R4", "R5", "R6"],
    mi: ["T0", "L1", "L2", "L3", "R4", "R5"],
    fa: ["T0", "L1", "L2", "L3", "R4"],
    sol: ["T0", "L1", "L2", "L3"],
    la: ["T0", "L1", "L2"],
    si: ["T0", "L1"],
    highDo: ["T0", "L2"],
  },
};
