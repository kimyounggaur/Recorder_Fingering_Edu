import type { HoleId } from "../model/types";

export const RECORDER_SCENE_VIEW_BOX = "0 0 1000 1600" as const;

export type RecorderHand = "left" | "right";
export type RecorderSide = "front" | "back";
export type FingerName = "thumb" | "index" | "middle" | "ring" | "little";

export interface HoleLayoutItem {
  readonly id: HoleId;
  readonly label: string;
  readonly hand: RecorderHand;
  readonly finger: FingerName;
  readonly side: RecorderSide;
  /** Center in the 1000 x 1600 scene coordinate system. */
  readonly x: number;
  /** Center in the 1000 x 1600 scene coordinate system. */
  readonly y: number;
  /** Radius of the logical touch target. */
  readonly radius: number;
  /** R6 and R7 are drawn as paired sub-holes but remain one logical state. */
  readonly double?: boolean;
  readonly subHoleRadius?: number;
  readonly subHoleGap?: number;
}

/**
 * The only source of recorder-hole coordinates.
 *
 * T0 intentionally lives in the rear-view inset. The remaining holes sit on
 * the center line of the front-view recorder. Finger poses are tuned against
 * these exact centers, so coordinate changes should happen here (and in
 * `fingerPoses.ts`) rather than inside JSX.
 */
export const HOLE_LAYOUT = {
  T0: {
    id: "T0",
    label: "0",
    hand: "left",
    finger: "thumb",
    side: "back",
    x: 180,
    y: 330,
    radius: 24,
  },
  L1: {
    id: "L1",
    label: "1",
    hand: "left",
    finger: "index",
    side: "front",
    x: 500,
    y: 430,
    radius: 22,
  },
  L2: {
    id: "L2",
    label: "2",
    hand: "left",
    finger: "middle",
    side: "front",
    x: 500,
    y: 560,
    radius: 22,
  },
  L3: {
    id: "L3",
    label: "3",
    hand: "left",
    finger: "ring",
    side: "front",
    x: 500,
    y: 690,
    radius: 22,
  },
  R4: {
    id: "R4",
    label: "4",
    hand: "right",
    finger: "index",
    side: "front",
    x: 500,
    y: 870,
    radius: 22,
  },
  R5: {
    id: "R5",
    label: "5",
    hand: "right",
    finger: "middle",
    side: "front",
    x: 500,
    y: 1000,
    radius: 22,
  },
  R6: {
    id: "R6",
    label: "6",
    hand: "right",
    finger: "ring",
    side: "front",
    x: 500,
    y: 1130,
    radius: 20,
    double: true,
    subHoleRadius: 13,
    subHoleGap: 15,
  },
  R7: {
    id: "R7",
    label: "7",
    hand: "right",
    finger: "little",
    side: "front",
    x: 500,
    y: 1260,
    radius: 20,
    double: true,
    subHoleRadius: 13,
    subHoleGap: 15,
  },
} as const satisfies Record<HoleId, HoleLayoutItem>;

export const HOLE_IDS = [
  "T0",
  "L1",
  "L2",
  "L3",
  "R4",
  "R5",
  "R6",
  "R7",
] as const satisfies readonly HoleId[];

export const FRONT_HOLE_IDS = [
  "L1",
  "L2",
  "L3",
  "R4",
  "R5",
  "R6",
  "R7",
] as const satisfies readonly HoleId[];

export const REAR_HOLE_IDS = ["T0"] as const satisfies readonly HoleId[];

