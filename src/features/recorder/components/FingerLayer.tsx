import type { SVGProps } from "react";
import { HOLE_IDS } from "../data/holeLayout";
import type { AnimationPhase, HoleId, HoleState } from "../model/types";
import { Finger } from "./Finger";
import type { HoleTransition } from "./Hole";

export interface FingerLayerProps
  extends Omit<SVGProps<SVGGElement>, "id"> {
  holeStates?: Partial<Record<HoleId, HoleState>>;
  currentClosedHoles?: readonly HoleId[];
  toOpen?: readonly HoleId[];
  toClose?: readonly HoleId[];
  phase?: AnimationPhase;
  showFingerNames?: boolean;
  reducedMotion?: boolean;
}

function transitionFor(
  id: HoleId,
  toOpen: readonly HoleId[],
  toClose: readonly HoleId[],
): HoleTransition {
  if (toOpen.includes(id)) return "opening";
  if (toClose.includes(id)) return "closing";
  return "steady";
}

/** Palms and all eight independently addressable fingers. */
export function FingerLayer({
  holeStates = {},
  currentClosedHoles = [],
  toOpen = [],
  toClose = [],
  phase = "settled",
  showFingerNames = false,
  reducedMotion = false,
  className,
  ...groupProps
}: FingerLayerProps) {
  const stateFor = (id: HoleId): HoleState =>
    holeStates[id] ?? (currentClosedHoles.includes(id) ? "closed" : "open");

  return (
    <g
      {...groupProps}
      id="fingers"
      className={[
        "recorder-finger-layer",
        reducedMotion ? "recorder-finger-layer--reduced-motion" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      data-phase={phase}
      data-reduced-motion={reducedMotion ? "true" : "false"}
      aria-hidden="true"
    >
      <g className="recorder-hand recorder-hand--left">
        <path
          className="recorder-hand__wrist"
          d="M34 548 C92 532 132 516 177 500 L216 703 C158 722 98 730 35 716 Z"
          fill="#efb79e"
          stroke="#85584c"
          strokeWidth="8"
        />
        <ellipse
          className="recorder-hand__palm"
          cx="230"
          cy="592"
          rx="108"
          ry="176"
          transform="rotate(-5 230 592)"
          fill="#efb79e"
          stroke="#85584c"
          strokeWidth="8"
        />
        <path
          className="recorder-hand__palm-highlight"
          d="M180 500 C151 571 157 647 190 701"
          fill="none"
          stroke="#ffd8c5"
          strokeLinecap="round"
          strokeWidth="10"
          opacity="0.75"
        />
      </g>

      <g className="recorder-hand recorder-hand--right">
        <path
          className="recorder-hand__wrist"
          d="M818 920 C864 900 916 887 970 881 L970 1280 C912 1267 861 1250 816 1224 Z"
          fill="#efb79e"
          stroke="#85584c"
          strokeWidth="8"
        />
        <ellipse
          className="recorder-hand__palm"
          cx="777"
          cy="1070"
          rx="112"
          ry="242"
          transform="rotate(4 777 1070)"
          fill="#efb79e"
          stroke="#85584c"
          strokeWidth="8"
        />
        <path
          className="recorder-hand__palm-highlight"
          d="M820 901 C850 994 846 1147 814 1236"
          fill="none"
          stroke="#ffd8c5"
          strokeLinecap="round"
          strokeWidth="10"
          opacity="0.75"
        />
      </g>

      <g className="recorder-hand recorder-hand--thumb-inset">
        <path
          d="M48 287 C82 257 119 252 151 270 L145 441 C104 452 71 435 48 401 Z"
          fill="#efb79e"
          stroke="#85584c"
          strokeWidth="7"
        />
      </g>

      {HOLE_IDS.map((id) => (
        <Finger
          key={id}
          id={id}
          state={stateFor(id)}
          transition={transitionFor(id, toOpen, toClose)}
          phase={phase}
          showName={showFingerNames}
          reducedMotion={reducedMotion}
        />
      ))}
    </g>
  );
}

