import type { AnimationPhase } from "../model/types";

export type HoleTransition = "steady" | "opening" | "closing";

export function isHoleTransitionHighlighted(
  transition: HoleTransition,
  phase: AnimationPhase | undefined,
): boolean {
  if (transition === "steady") return false;
  if (!phase) return true;
  if (transition === "opening") {
    return phase === "highlight-release" || phase === "releasing";
  }
  return phase === "highlight-press" || phase === "pressing" || phase === "contact";
}
