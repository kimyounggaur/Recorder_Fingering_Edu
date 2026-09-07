import {
  ALL_HOLES,
  HOLE_NUMBER_LABELS
} from "../data/fingerings";
import type {
  FingeringStateMap
} from "../model/types";
export function withKoreanSubjectParticle(value: string): string {
  const lastCharacter = value.trim().at(-1);
  if (!lastCharacter) return value;
  const codePoint = lastCharacter.charCodeAt(0);
  const hasFinalConsonant =
    codePoint >= 0xac00 && codePoint <= 0xd7a3 && (codePoint - 0xac00) % 28 !== 0;
  return `${value}${hasFinalConsonant ? "이" : "가"}`;
}
export function describeFingeringForLive(fingering: FingeringStateMap): string {
  const closed = ALL_HOLES.filter((hole) => fingering[hole] === "closed");
  const half = ALL_HOLES.filter((hole) => fingering[hole] === "half");
  const partial = ALL_HOLES.filter((hole) => fingering[hole] === "partial");
  const clauses = [
    closed.length
      ? `${closed.map((hole) => HOLE_NUMBER_LABELS[hole]).join(", ")}번 구멍을 막습니다.`
      : null,
    half.length
      ? `${half.map((hole) => HOLE_NUMBER_LABELS[hole]).join(", ")}번 엄지구멍은 반만 엽니다.`
      : null,
    partial.length
      ? `${partial.map((hole) => HOLE_NUMBER_LABELS[hole]).join(", ")}번 이중 구멍은 한쪽만 막습니다.`
      : null,
  ].filter((clause): clause is string => clause !== null);

  return clauses.join(" ");
}
