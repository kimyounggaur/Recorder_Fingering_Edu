/** The two soprano-recorder fingering systems supported by the lesson. */
export type FingeringSystem = "baroque" | "german";

/**
 * Stable semantic identifiers for the recorder holes.
 *
 * `T0` is the rear thumb hole. `L1`-`L3` and `R4`-`R7` are the
 * front holes operated by the left and right hands respectively.
 */
export type HoleId =
  | "T0"
  | "L1"
  | "L2"
  | "L3"
  | "R4"
  | "R5"
  | "R6"
  | "R7";

export type HoleState = "open" | "closed" | "half" | "partial";

export type UiButtonNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type NoteBank = "low" | "high" | "chromatic";

export type SolfegeId =
  | "do"
  | "re"
  | "mi"
  | "fa"
  | "sol"
  | "la"
  | "si"
  | "highDo"
  | "doSharp"
  | "reSharp"
  | "faSharp"
  | "solSharp"
  | "laSharp"
  | "highRe"
  | "highMi"
  | "highFa"
  | "highSol";

export type FingeringStateMap = Readonly<Record<HoleId, HoleState>>;

export interface NoteMeta {
  id: SolfegeId;
  button: UiButtonNumber;
  solfegeKo: string;
  noteName: string;
  staffStep: number;
  audioKey: string;
  shortInstruction: string;
  accidental?: "sharp";
}

export type AnimationPhase =
  | "idle"
  | "highlight-release"
  | "releasing"
  | "highlight-press"
  | "pressing"
  | "contact"
  | "settled";

export type PlaybackSpeed = "normal" | "slow";
