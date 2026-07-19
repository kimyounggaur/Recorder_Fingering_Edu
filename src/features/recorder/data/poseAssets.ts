import type { FingeringSystem, SolfegeId } from "../model/types";

const COMMON_POSES: Record<Exclude<SolfegeId, "fa">, string> = {
  do: "/fingering/poses/do.png",
  re: "/fingering/poses/re.png",
  mi: "/fingering/poses/mi.png",
  sol: "/fingering/poses/sol.png",
  la: "/fingering/poses/la.png",
  si: "/fingering/poses/si.png",
  highDo: "/fingering/poses/high-do.png",
};

const FA_POSES: Record<FingeringSystem, string> = {
  baroque: "/fingering/poses/fa-baroque.png",
  german: "/fingering/poses/fa-german.png",
};

/**
 * High-resolution pose exports derived from the user-provided `02 Fingering`
 * Illustrator source. Baroque and German F deliberately use different poses.
 */
export function getRecorderPoseSource(
  note: SolfegeId,
  system: FingeringSystem,
): string {
  return note === "fa" ? FA_POSES[system] : COMMON_POSES[note];
}

export const RECORDER_POSE_SOURCES = [
  ...Object.values(COMMON_POSES),
  ...Object.values(FA_POSES),
] as const;
