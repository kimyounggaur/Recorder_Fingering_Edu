import type {
  NoteBank,
  NoteMeta,
  SolfegeId,
  UiButtonNumber,
} from "../model/types";

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

export const HIGH_NOTE_ORDER: readonly SolfegeId[] = [
  "highDo",
  "highRe",
  "highMi",
  "highFa",
  "highSol",
];

export const CHROMATIC_NOTE_ORDER: readonly SolfegeId[] = [
  "doSharp",
  "reSharp",
  "faSharp",
  "solSharp",
  "laSharp",
];

export const ALL_NOTE_IDS: readonly SolfegeId[] = [
  ...NOTE_ORDER,
  ...CHROMATIC_NOTE_ORDER,
  "highRe",
  "highMi",
  "highFa",
  "highSol",
];

export interface NoteBankEntry {
  readonly note: SolfegeId;
  readonly digit: UiButtonNumber;
}

export const NOTE_BANKS: Record<NoteBank, readonly NoteBankEntry[]> = {
  low: NOTE_ORDER.map((note, index) => ({
    note,
    digit: (index + 1) as UiButtonNumber,
  })),
  high: HIGH_NOTE_ORDER.map((note, index) => ({
    note,
    digit: (index + 1) as UiButtonNumber,
  })),
  chromatic: CHROMATIC_NOTE_ORDER.map((note, index) => ({
    note,
    digit: (index + 1) as UiButtonNumber,
  })),
};

export const NOTE_BANK_LABELS: Record<NoteBank, string> = {
  low: "낮은 계이름",
  high: "높은 계이름",
  chromatic: "반음",
};

export const NOTE_BANK_MODIFIERS: Record<NoteBank, string> = {
  low: "Ctrl",
  high: "Shift",
  chromatic: "Alt",
};

export const NOTE_META: Record<SolfegeId, NoteMeta> = {
  do: {
    id: "do",
    button: 1,
    solfegeKo: "도",
    noteName: "C4",
    staffStep: 0,
    audioKey: "C",
    shortInstruction: "모든 구멍을 막아요.",
  },
  re: {
    id: "re",
    button: 2,
    solfegeKo: "레",
    noteName: "D4",
    staffStep: 1,
    audioKey: "D",
    shortInstruction: "오른손 새끼손가락만 떼어요.",
  },
  mi: {
    id: "mi",
    button: 3,
    solfegeKo: "미",
    noteName: "E4",
    staffStep: 2,
    audioKey: "E",
    shortInstruction: "오른손 약지와 새끼손가락을 떼어요.",
  },
  fa: {
    id: "fa",
    button: 4,
    solfegeKo: "파",
    noteName: "F4",
    staffStep: 3,
    audioKey: "F",
    shortInstruction: "선택한 운지 체계에 맞게 파를 잡아요.",
  },
  sol: {
    id: "sol",
    button: 5,
    solfegeKo: "솔",
    noteName: "G4",
    staffStep: 4,
    audioKey: "G",
    shortInstruction: "왼손 엄지, 검지, 가운데손가락, 약지만 막아요.",
  },
  la: {
    id: "la",
    button: 6,
    solfegeKo: "라",
    noteName: "A4",
    staffStep: 5,
    audioKey: "A",
    shortInstruction: "왼손 엄지, 검지, 가운데손가락만 막아요.",
  },
  si: {
    id: "si",
    button: 7,
    solfegeKo: "시",
    noteName: "B4",
    staffStep: 6,
    audioKey: "B",
    shortInstruction: "왼손 엄지와 검지만 막아요.",
  },
  highDo: {
    id: "highDo",
    button: 8,
    solfegeKo: "높은 도",
    noteName: "C5",
    staffStep: 7,
    audioKey: "HIGH_C",
    shortInstruction: "왼손 엄지와 가운데손가락만 막아요.",
  },
  doSharp: {
    id: "doSharp",
    button: 1,
    solfegeKo: "도♯/레♭",
    noteName: "C♯4 / D♭4",
    staffStep: 0,
    audioKey: "C#4",
    accidental: "sharp",
    shortInstruction: "7번 이중 구멍은 한쪽만 남기고 부분적으로 막아요.",
  },
  reSharp: {
    id: "reSharp",
    button: 2,
    solfegeKo: "레♯/미♭",
    noteName: "D♯4 / E♭4",
    staffStep: 1,
    audioKey: "D#4",
    accidental: "sharp",
    shortInstruction: "6번 이중 구멍을 한쪽만 막고 7번은 열어요.",
  },
  faSharp: {
    id: "faSharp",
    button: 3,
    solfegeKo: "파♯/솔♭",
    noteName: "F♯4 / G♭4",
    staffStep: 3,
    audioKey: "F#4",
    accidental: "sharp",
    shortInstruction: "선택한 운지 체계에 맞게 4번과 7번을 조절해요.",
  },
  solSharp: {
    id: "solSharp",
    button: 4,
    solfegeKo: "솔♯/라♭",
    noteName: "G♯4 / A♭4",
    staffStep: 4,
    audioKey: "G#4",
    accidental: "sharp",
    shortInstruction: "3번과 7번은 열고 6번 이중 구멍은 한쪽만 막아요.",
  },
  laSharp: {
    id: "laSharp",
    button: 5,
    solfegeKo: "라♯/시♭",
    noteName: "A♯4 / B♭4",
    staffStep: 5,
    audioKey: "A#4",
    accidental: "sharp",
    shortInstruction: "0, 1, 3, 4번 구멍을 막아요.",
  },
  highRe: {
    id: "highRe",
    button: 2,
    solfegeKo: "높은 레",
    noteName: "D5",
    staffStep: 8,
    audioKey: "D5",
    shortInstruction: "엄지구멍은 열고 왼손 가운데손가락만 막아요.",
  },
  highMi: {
    id: "highMi",
    button: 3,
    solfegeKo: "높은 미",
    noteName: "E5",
    staffStep: 9,
    audioKey: "E5",
    shortInstruction: "엄지구멍을 살짝 열고 1번부터 5번까지 막아요.",
  },
  highFa: {
    id: "highFa",
    button: 4,
    solfegeKo: "높은 파",
    noteName: "F5",
    staffStep: 10,
    audioKey: "F5",
    shortInstruction: "엄지는 살짝 열고, 선택한 운지 체계에 맞게 높은 파를 잡아요.",
  },
  highSol: {
    id: "highSol",
    button: 5,
    solfegeKo: "높은 솔",
    noteName: "G5",
    staffStep: 11,
    audioKey: "G5",
    shortInstruction: "엄지구멍을 살짝 열고 왼손 1, 2, 3번을 막아요.",
  },
};
