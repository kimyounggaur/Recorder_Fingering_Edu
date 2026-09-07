import { getFingeringDiff } from "../animation/getFingeringDiff";
import {
  ALL_HOLES,
  FINGERINGS,
  FINGERING_STATES,
  FINGER_LABELS,
  getFullyClosedHoles,
  HOLE_NUMBER_LABELS,
} from "../data/fingerings";
import { NOTE_META } from "../data/noteMeta";
import type { FingeringSystem, HoleId, SolfegeId } from "../model/types";

export interface BuildInstructionOptions {
  note: SolfegeId;
  system: FingeringSystem;
  previousNote?: SolfegeId | null;
  /** Use this when a transition also changes the fingering system. */
  previousSystem?: FingeringSystem;
  /** The animation's real starting pose, including interrupted transitions. */
  actualStartClosedHoles?: readonly HoleId[];
}

export interface FingeringInstructionParts {
  summary: string;
  fingerGuide: string;
  systemHint: string | null;
  transition: string | null;
  text: string;
}

function joinKorean(items: readonly string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  const beforeLast = items.at(-2)!;
  const conjunction = finalConsonantIndex(beforeLast) === 0 ? "와" : "과";

  if (items.length === 2) {
    return `${beforeLast}${conjunction} ${items.at(-1)}`;
  }

  return `${items.slice(0, -2).join(", ")}, ${beforeLast}${conjunction} ${items.at(-1)}`;
}

function finalConsonantIndex(value: string): number {
  const lastCharacter = value.trim().at(-1);
  if (!lastCharacter) return 0;

  const codePoint = lastCharacter.charCodeAt(0);
  if (codePoint < 0xac00 || codePoint > 0xd7a3) return 0;
  return (codePoint - 0xac00) % 28;
}

function topicParticle(value: string): "은" | "는" {
  return finalConsonantIndex(value) === 0 ? "는" : "은";
}

function objectParticle(value: string): "을" | "를" {
  return finalConsonantIndex(value) === 0 ? "를" : "을";
}

function directionParticle(value: string): "으로" | "로" {
  const finalIndex = finalConsonantIndex(value);
  // Words ending in rieul (ㄹ) also take "로".
  return finalIndex === 0 || finalIndex === 8 ? "로" : "으로";
}

function formatFingerNames(holeIds: readonly HoleId[]): string {
  const handGroups = [
    { prefix: "왼손", holes: ALL_HOLES.slice(0, 4) },
    { prefix: "오른손", holes: ALL_HOLES.slice(4) },
  ] as const;

  const groups = handGroups.flatMap(({ prefix, holes }) => {
    const names = holes
      .filter((holeId) => holeIds.includes(holeId))
      .map((holeId) => FINGER_LABELS[holeId].replace(`${prefix} `, ""));

    return names.length > 0 ? [`${prefix} ${joinKorean(names)}`] : [];
  });

  return joinKorean(groups);
}

function buildFingerGuide(closedHoles: readonly HoleId[]): string {
  const fingerNames = formatFingerNames(closedHoles);
  const lastFingerName = FINGER_LABELS[closedHoles.at(-1) ?? "T0"];
  const only = closedHoles.length <= 3 ? "만" : objectParticle(lastFingerName);
  const rightHandIsOpen = !closedHoles.some((holeId) => holeId.startsWith("R"));
  const rightHandGuide = rightHandIsOpen
    ? " 오른손은 구멍에서 편안히 떼어요."
    : "";

  return `${fingerNames}${only} 리코더에 가볍게 붙여요.${rightHandGuide}`;
}

function buildSystemHint(
  note: SolfegeId,
  system: FingeringSystem,
): string | null {
  if (note === "highFa") {
    return system === "baroque"
      ? "바로크식 높은 파예요. 엄지를 살짝 열고 1, 2, 3, 4, 6번을 막아요."
      : "독일식 높은 파예요. 엄지를 살짝 열고 1, 2, 3, 4번을 막아요.";
  }

  if (note === "faSharp") {
    return system === "baroque"
      ? "바로크식 파♯/솔♭이에요. 4번과 7번은 열고 5번과 6번을 막아요."
      : "독일식 파♯/솔♭이에요. 4번은 열고 5번, 6번, 7번을 막아요.";
  }

  if (note !== "fa") return null;

  if (system === "baroque") {
    return "바로크식 파예요. 5번 구멍은 열고 6번과 7번 구멍은 막아요.";
  }

  return "독일식 파예요. 4번까지 막고 5번, 6번, 7번 구멍은 열어요.";
}

function buildMovementGuide(
  previousNote: SolfegeId,
  previousSystem: FingeringSystem,
  note: SolfegeId,
  system: FingeringSystem,
  actualStartClosedHoles?: readonly HoleId[],
): string {
  const expectedPreviousFingering = FINGERINGS[previousSystem][previousNote];
  const previousFingering = actualStartClosedHoles ?? expectedPreviousFingering;
  const nextFingering = FINGERINGS[system][note];
  const expectedPreviousStates = FINGERING_STATES[previousSystem][previousNote];
  const nextStates = FINGERING_STATES[system][note];
  const { toOpen, toClose } = getFingeringDiff(previousFingering, nextFingering);
  const coverageChanges = ALL_HOLES.filter(
    (hole) =>
      expectedPreviousStates[hole] !== nextStates[hole] &&
      expectedPreviousStates[hole] !== "open" &&
      nextStates[hole] !== "open",
  );
  const previousName = NOTE_META[previousNote].solfegeKo;
  const nextName = NOTE_META[note].solfegeKo;
  const startsFromExpectedPose =
    previousFingering.length === expectedPreviousFingering.length &&
    previousFingering.every((hole) => expectedPreviousFingering.includes(hole));
  const systemNames: Record<FingeringSystem, string> = {
    baroque: "바로크식",
    german: "독일식",
  };
  const transitionLead = !startsFromExpectedPose
    ? `지금 자세에서 ${nextName} 운지로 바꿔요.`
    : previousNote === note && previousSystem !== system
      ? `${systemNames[previousSystem]}에서 ${systemNames[system]} ${nextName} 운지로 바꿔요.`
      : `${previousName}에서 ${nextName}${directionParticle(nextName)} 바뀌어요.`;
  const sentences = [transitionLead];

  if (toOpen.length > 0) {
    const fingerNames = formatFingerNames(toOpen);
    const particle = toOpen.length === 1 ? "만" : objectParticle(FINGER_LABELS[toOpen.at(-1)!]);
    sentences.push(`${fingerNames}${particle} 천천히 들어 올리세요.`);
  }

  if (toClose.length > 0) {
    const fingerNames = formatFingerNames(toClose);
    const holeNumbers = toClose.map((id) => HOLE_NUMBER_LABELS[id]).join(", ");
    sentences.push(
      `${fingerNames}${directionParticle(fingerNames)} ${holeNumbers}번 구멍을 가볍게 막으세요.`,
    );
  }

  for (const hole of coverageChanges) {
    const number = HOLE_NUMBER_LABELS[hole];
    const targetState = nextStates[hole];
    if (targetState === "half") {
      sentences.push(`${number}번 엄지구멍은 반만 열어 주세요.`);
    } else if (targetState === "partial") {
      sentences.push(`${number}번 이중 구멍은 한쪽만 막아 주세요.`);
    } else if (targetState === "closed") {
      sentences.push(`${number}번 구멍을 완전히 막아 주세요.`);
    }
  }

  if (
    toOpen.length === 0 &&
    toClose.length === 0 &&
    coverageChanges.length === 0
  ) {
    sentences.push("손가락은 그대로 두면 돼요.");
  }

  return sentences.join(" ");
}

export function buildInstructionParts(
  options: BuildInstructionOptions,
): FingeringInstructionParts {
  const { note, system, previousNote = null } = options;
  const fingering = FINGERING_STATES[system][note];
  const contactedHoles = FINGERINGS[system][note];
  const closedHoles = getFullyClosedHoles(fingering);
  const halfHoles = ALL_HOLES.filter((hole) => fingering[hole] === "half");
  const partialHoles = ALL_HOLES.filter(
    (hole) => fingering[hole] === "partial",
  );
  const noteName = NOTE_META[note].solfegeKo;
  const holeNumbers = closedHoles.map((id) => HOLE_NUMBER_LABELS[id]).join(", ");
  const coverageDetails = [
    halfHoles.length
      ? `${halfHoles.map((id) => HOLE_NUMBER_LABELS[id]).join(", ")}번은 반만 열어요.`
      : null,
    partialHoles.length
      ? `${partialHoles.map((id) => HOLE_NUMBER_LABELS[id]).join(", ")}번 이중 구멍은 한쪽만 막아요.`
      : null,
  ].filter((detail): detail is string => detail !== null);
  const summary = `${noteName}${topicParticle(noteName)} ${holeNumbers}번 구멍을 막아요.${
    coverageDetails.length ? ` ${coverageDetails.join(" ")}` : ""
  }`;
  const fingerGuide = buildFingerGuide(contactedHoles);
  const systemHint = buildSystemHint(note, system);
  const transition = previousNote
    ? buildMovementGuide(
        previousNote,
        options.previousSystem ?? system,
         note,
         system,
         options.actualStartClosedHoles,
       )
    : null;
  const text = [summary, fingerGuide, systemHint, transition]
    .filter((sentence): sentence is string => Boolean(sentence))
    .join("\n");

  return { summary, fingerGuide, systemHint, transition, text };
}

export function buildInstruction(options: BuildInstructionOptions): string;
export function buildInstruction(
  note: SolfegeId,
  system: FingeringSystem,
  previousNote?: SolfegeId | null,
  previousSystem?: FingeringSystem,
): string;
export function buildInstruction(
  optionsOrNote: BuildInstructionOptions | SolfegeId,
  system?: FingeringSystem,
  previousNote: SolfegeId | null = null,
  previousSystem?: FingeringSystem,
): string {
  const options: BuildInstructionOptions =
    typeof optionsOrNote === "string"
      ? {
          note: optionsOrNote,
          system: system ?? "baroque",
          previousNote,
          previousSystem,
        }
      : optionsOrNote;

  return buildInstructionParts(options).text;
}
