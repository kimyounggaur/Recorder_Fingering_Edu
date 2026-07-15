import type { NoteMeta, SolfegeId } from "../model/types";

export type { NoteMeta } from "../model/types";

export const NOTE_ORDER: readonly SolfegeId[] = [
  "do",
  "re",
  "mi",
  "fa",
  "sol",
  "la",
  "si",
  "highDo",
];

export const NOTE_META: Record<SolfegeId, NoteMeta> = {
  do: {
    id: "do",
    button: 1,
    solfegeKo: "도",
    noteName: "C",
    staffStep: 0,
    audioKey: "C",
    shortInstruction: "모든 구멍을 막아요.",
  },
  re: {
    id: "re",
    button: 2,
    solfegeKo: "레",
    noteName: "D",
    staffStep: 1,
    audioKey: "D",
    shortInstruction: "오른손 새끼손가락만 떼어요.",
  },
  mi: {
    id: "mi",
    button: 3,
    solfegeKo: "미",
    noteName: "E",
    staffStep: 2,
    audioKey: "E",
    shortInstruction: "오른손 약지와 새끼손가락을 떼어요.",
  },
  fa: {
    id: "fa",
    button: 4,
    solfegeKo: "파",
    noteName: "F",
    staffStep: 3,
    audioKey: "F",
    shortInstruction: "선택한 운지 체계에 맞게 파를 잡아요.",
  },
  sol: {
    id: "sol",
    button: 5,
    solfegeKo: "솔",
    noteName: "G",
    staffStep: 4,
    audioKey: "G",
    shortInstruction: "왼손 엄지, 검지, 가운데손가락, 약지만 막아요.",
  },
  la: {
    id: "la",
    button: 6,
    solfegeKo: "라",
    noteName: "A",
    staffStep: 5,
    audioKey: "A",
    shortInstruction: "왼손 엄지, 검지, 가운데손가락만 막아요.",
  },
  si: {
    id: "si",
    button: 7,
    solfegeKo: "시",
    noteName: "B",
    staffStep: 6,
    audioKey: "B",
    shortInstruction: "왼손 엄지와 검지만 막아요.",
  },
  highDo: {
    id: "highDo",
    button: 8,
    solfegeKo: "높은 도",
    noteName: "C′",
    staffStep: 7,
    audioKey: "HIGH_C",
    shortInstruction: "왼손 엄지와 가운데손가락만 막아요.",
  },
};
