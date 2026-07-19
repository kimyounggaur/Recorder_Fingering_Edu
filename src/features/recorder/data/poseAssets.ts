import type { FingeringSystem, SolfegeId } from "../model/types";

const COMMON_POSES: Record<
  Exclude<SolfegeId, "fa" | "faSharp" | "highFa">,
  string
> = {
  do: "/fingering/poses/do.png",
  re: "/fingering/poses/re.png",
  mi: "/fingering/poses/mi.png",
  sol: "/fingering/poses/sol.png",
  la: "/fingering/poses/la.png",
  si: "/fingering/poses/si.png",
  highDo: "/fingering/poses/high-do.png",
  doSharp: "/fingering/poses/cs4.png",
  reSharp: "/fingering/poses/ds4.png",
  solSharp: "/fingering/poses/gs4.png",
  laSharp: "/fingering/poses/as4.png",
  highRe: "/fingering/poses/d5.png",
  highMi: "/fingering/poses/e5.png",
  highSol: "/fingering/poses/g5.png",
};

const SYSTEM_POSES: Record<
  "fa" | "faSharp" | "highFa",
  Record<FingeringSystem, string>
> = {
  fa: {
    baroque: "/fingering/poses/fa-baroque.png",
    german: "/fingering/poses/fa-german.png",
  },
  faSharp: {
    baroque: "/fingering/poses/fs4-baroque.png",
    german: "/fingering/poses/fs4-german.png",
  },
  highFa: {
    baroque: "/fingering/poses/f5-baroque.png",
    german: "/fingering/poses/f5-german.png",
  },
};

/**
 * High-resolution pose exports derived from the user-provided `02 Fingering`
 * Illustrator source. Baroque and German F/F-sharp poses deliberately differ.
 */
export function getRecorderPoseSource(
  note: SolfegeId,
  system: FingeringSystem,
): string {
  return note === "fa" || note === "faSharp" || note === "highFa"
    ? SYSTEM_POSES[note][system]
    : COMMON_POSES[note];
}

export const RECORDER_POSE_SOURCES = [
  ...Object.values(COMMON_POSES),
  ...Object.values(SYSTEM_POSES.fa),
  ...Object.values(SYSTEM_POSES.faSharp),
  ...Object.values(SYSTEM_POSES.highFa),
] as const;
