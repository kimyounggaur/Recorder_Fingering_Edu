import type { FingeringSystem, SolfegeId } from "../model/types";

const COMMON_POSES: Record<
  Exclude<SolfegeId, "fa" | "faSharp" | "highFa">,
  string
> = {
  do: "/fingering/poses-focused/do.png",
  re: "/fingering/poses-focused/re.png",
  mi: "/fingering/poses-focused/mi.png",
  sol: "/fingering/poses-focused/sol.png",
  la: "/fingering/poses-focused/la.png",
  si: "/fingering/poses-focused/si.png",
  highDo: "/fingering/poses-focused/high-do.png",
  doSharp: "/fingering/poses-focused/cs4.png",
  reSharp: "/fingering/poses-focused/ds4.png",
  solSharp: "/fingering/poses-focused/gs4.png",
  laSharp: "/fingering/poses-focused/as4.png",
  highRe: "/fingering/poses-focused/d5.png",
  highMi: "/fingering/poses-focused/e5.png",
  highSol: "/fingering/poses-focused/g5.png",
};

const SYSTEM_POSES: Record<
  "fa" | "faSharp" | "highFa",
  Record<FingeringSystem, string>
> = {
  fa: {
    baroque: "/fingering/poses-focused/fa-baroque.png",
    german: "/fingering/poses-focused/fa-german.png",
  },
  faSharp: {
    baroque: "/fingering/poses-focused/fs4-baroque.png",
    german: "/fingering/poses-focused/fs4-german.png",
  },
  highFa: {
    baroque: "/fingering/poses-focused/f5-baroque.png",
    german: "/fingering/poses-focused/f5-german.png",
  },
};

/**
 * Focused 723x1084 derivatives of the aligned 976x1360 source exports. The
 * originals remain untouched; Baroque and German F/F-sharp poses differ.
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

export const RECORDER_POSE_FRAME = { width: 723, height: 1084 } as const;
