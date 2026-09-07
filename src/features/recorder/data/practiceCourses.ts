import { CHROMATIC_NOTE_ORDER, HIGH_NOTE_ORDER, NOTE_BANKS, NOTE_ORDER } from "./noteMeta";
import type { NoteBank, SolfegeId } from "../model/types";

export type CourseId = "leftHand" | "rightHand" | "lowScale" | "highScale" | "chromatic" | "fullRange";
export interface PracticeCourse {
  id: CourseId;
  titleKo: string;
  description: string;
  steps: readonly SolfegeId[];
  bank: NoteBank | "auto";
  handHint?: string;
}
export const PRACTICE_COURSES: readonly PracticeCourse[] = [
  { id: "leftHand", titleKo: "왼손 코스", description: "왼손 손가락부터 차근차근", steps: ["sol", "la", "si", "highDo", "highRe"], bank: "high", handHint: "오른손은 그대로 쉬어요" },
  { id: "rightHand", titleKo: "오른손 코스", description: "오른손 구멍을 하나씩", steps: ["do", "re", "mi", "fa"], bank: "low", handHint: "왼손은 그대로!" },
  { id: "lowScale", titleKo: "낮은 계이름", description: "도부터 높은 도까지", steps: NOTE_ORDER, bank: "low" },
  { id: "highScale", titleKo: "높은 계이름", description: "높은 도부터 높은 솔까지", steps: HIGH_NOTE_ORDER, bank: "high" },
  { id: "chromatic", titleKo: "반음", description: "올림음과 내림음", steps: CHROMATIC_NOTE_ORDER, bank: "chromatic" },
  { id: "fullRange", titleKo: "한 옥타브 반", description: "낮은 도부터 높은 솔까지", steps: [...NOTE_ORDER, ...HIGH_NOTE_ORDER.slice(1)], bank: "auto" },
];
export const isCourseId = (value: unknown): value is CourseId => PRACTICE_COURSES.some(course => course.id === value);
export const getCourse = (id: CourseId): PracticeCourse => PRACTICE_COURSES.find(course => course.id === id)!;
export function getNoteBank(note: SolfegeId, preferred?: NoteBank | "auto"): NoteBank {
  if (preferred && preferred !== "auto" && NOTE_BANKS[preferred].some(entry => entry.note === note)) return preferred;
  return (["low", "high", "chromatic"] as const).find(bank => NOTE_BANKS[bank].some(entry => entry.note === note))!;
}
