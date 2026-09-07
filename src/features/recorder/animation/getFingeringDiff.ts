import { ALL_HOLES } from "../data/fingerings";
import type { HoleId } from "../model/types";

export { ALL_HOLES } from "../data/fingerings";

export interface FingeringDiff {
  toOpen: HoleId[];
  toClose: HoleId[];
  stayClosed: HoleId[];
  stayOpen: HoleId[];
}

/**
 * Compares two fingerings in physical hole order, independent of the order in
 * which either input array was created.
 */
export function getFingeringDiff(
  previous: readonly HoleId[],
  next: readonly HoleId[],
): FingeringDiff {
  const previousSet = new Set(previous);
  const nextSet = new Set(next);

  return {
    toOpen: ALL_HOLES.filter(
      (id) => previousSet.has(id) && !nextSet.has(id),
    ),
    toClose: ALL_HOLES.filter(
      (id) => !previousSet.has(id) && nextSet.has(id),
    ),
    stayClosed: ALL_HOLES.filter(
      (id) => previousSet.has(id) && nextSet.has(id),
    ),
    stayOpen: ALL_HOLES.filter(
      (id) => !previousSet.has(id) && !nextSet.has(id),
    ),
  };
}
