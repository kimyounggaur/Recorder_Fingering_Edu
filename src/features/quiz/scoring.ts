import { ALL_HOLES, FINGERINGS, FINGERING_STATES } from "../recorder/data/fingerings";
import { ALL_NOTE_IDS } from "../recorder/data/noteMeta";
import { getFingeringDiff } from "../recorder/animation/getFingeringDiff";
import type { FingeringStateMap, FingeringSystem, HoleId, SolfegeId } from "../recorder/model/types";

export function pickDistractors(answer: SolfegeId, pool: readonly SolfegeId[], count = 3, system: FingeringSystem = "baroque"): SolfegeId[] {
  const distance = (note: SolfegeId) => {
    const diff = getFingeringDiff(FINGERINGS[system][answer], FINGERINGS[system][note]);
    const contactChanges = diff.toOpen.length + diff.toClose.length;
    return contactChanges + ALL_HOLES.filter(hole => FINGERING_STATES[system][answer][hole] !== FINGERING_STATES[system][note][hole]).length;
  };
  const candidates = [...new Set(pool)].filter(note => note !== answer).sort((a, b) => distance(a) - distance(b));
  const extras = shuffle(ALL_NOTE_IDS.filter(note => note !== answer && !candidates.includes(note)));
  return [...candidates, ...extras].slice(0, Math.max(0, count));
}
export function scoreFingering(answer: FingeringStateMap, note: SolfegeId, system: FingeringSystem) {
  const target = FINGERING_STATES[system][note];
  const perHole = Object.fromEntries(ALL_HOLES.map(hole => [hole, answer[hole] === target[hole] ? "correct" : "wrong"])) as Record<HoleId, "correct" | "wrong">;
  const correctCount = ALL_HOLES.filter(hole => perHole[hole] === "correct").length;
  const other: FingeringSystem = system === "baroque" ? "german" : "baroque";
  const crossSystemMatch = correctCount !== 8 && ALL_HOLES.every(hole => answer[hole] === FINGERING_STATES[other][note][hole]) ? other : null;
  return { perHole, correctCount, total: 8 as const, exact: correctCount === 8, crossSystemMatch };
}
export function shuffle<T>(values: readonly T[], random = Math.random): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function createQuestions(pool: readonly SolfegeId[], count = 10, random = Math.random): SolfegeId[] {
  if (new Set(pool).size < 2) throw new Error("Quiz requires at least two notes");
  const questions: SolfegeId[] = [];
  for (let i = 0; i < count; i++) {
    const candidates = pool.filter(note => note !== questions.at(-1));
    questions.push(candidates[Math.floor(random() * candidates.length)]);
  }
  return questions;
}
