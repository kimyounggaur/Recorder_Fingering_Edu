import type { CSSProperties, SVGProps } from "react";
import { FINGER_LABELS } from "../data/fingerings";
import { getFingerPose } from "../data/fingerPoses";
import { HOLE_LAYOUT, type FingerName } from "../data/holeLayout";
import type { AnimationPhase, HoleId, HoleState } from "../model/types";
import {
  isHoleTransitionHighlighted,
  type HoleTransition,
} from "./Hole";

interface FingerGeometry {
  readonly length: number;
  readonly width: number;
  readonly padRx: number;
  readonly padRy: number;
}

const FINGER_GEOMETRY: Record<FingerName, FingerGeometry> = {
  thumb: { length: 142, width: 52, padRx: 34, padRy: 29 },
  index: { length: 252, width: 48, padRx: 34, padRy: 27 },
  middle: { length: 278, width: 50, padRx: 35, padRy: 28 },
  ring: { length: 252, width: 47, padRx: 33, padRy: 27 },
  little: { length: 218, width: 41, padRx: 30, padRy: 25 },
};

export interface FingerProps
  extends Omit<SVGProps<SVGGElement>, "id"> {
  id: HoleId;
  state: HoleState;
  transition?: HoleTransition;
  phase?: AnimationPhase;
  showName?: boolean;
  reducedMotion?: boolean;
}

function Segment({
  className,
  d,
  width,
}: {
  className: string;
  d: string;
  width: number;
}) {
  return (
    <>
      <path
        className={`${className} ${className}--outline`}
        d={d}
        fill="none"
        stroke="#85584c"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={width + 8}
      />
      <path
        className={className}
        d={d}
        fill="none"
        stroke="#efb79e"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={width}
      />
    </>
  );
}

/** A single independently addressable SVG finger rig. */
export function Finger({
  id,
  state,
  transition = "steady",
  phase,
  showName = false,
  reducedMotion = false,
  className,
  ...groupProps
}: FingerProps) {
  const layout = HOLE_LAYOUT[id];
  const pose = getFingerPose(id, state);
  const geometry = FINGER_GEOMETRY[layout.finger];
  const direction = layout.hand === "left" ? -1 : 1;
  const scaleX = pose.scaleX ?? 1;
  const scaleY = pose.scaleY ?? 1;
  const highlighted = isHoleTransitionHighlighted(transition, phase);
  const transform = `translate(${pose.x} ${pose.y}) rotate(${pose.rotate}) scale(${scaleX} ${scaleY})`;
  const poseStyle: CSSProperties = {
    transform: `translate(${pose.x}px, ${pose.y}px) rotate(${pose.rotate}deg) scale(${scaleX}, ${scaleY})`,
    transformOrigin: "0 0",
    transformBox: "view-box",
    opacity: pose.opacity ?? 1,
    transitionProperty: "transform, opacity",
    transitionDuration: reducedMotion
      ? "60ms"
      : "var(--recorder-finger-duration, 320ms)",
    transitionTimingFunction: "var(--recorder-finger-easing, cubic-bezier(.2,.8,.2,1))",
  };

  const proximalPath = `M ${direction * geometry.length} 0 C ${
    direction * (geometry.length - 38)
  } -3 ${direction * 190} 3 ${direction * 145} 1`;
  const middlePath = `M ${direction * 158} 1 C ${
    direction * 132
  } 2 ${direction * 102} -2 ${direction * 68} 0`;
  const distalPath = `M ${direction * 82} 0 C ${direction * 58} -1 ${
    direction * 34
  } 1 ${direction * 7} 0`;

  const labelX = id === "T0" ? 91 : pose.x + direction * 145;
  const labelY = id === "T0" ? pose.y + 76 : pose.y - 42;

  return (
    <g
      {...groupProps}
      id={`finger-${id}`}
      className={[
        "recorder-finger",
        `recorder-finger--${layout.hand}`,
        `recorder-finger--${layout.finger}`,
        `recorder-finger--${state}`,
        `recorder-finger--${transition}`,
        highlighted ? "recorder-finger--highlighted" : "",
        reducedMotion ? "recorder-finger--reduced-motion" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      data-finger={id}
      data-finger-state={state}
      data-finger-transition={transition}
      data-phase={phase ?? "settled"}
      data-pad-x={pose.x}
      data-pad-y={pose.y}
      data-reduced-motion={reducedMotion ? "true" : "false"}
      data-highlighted={highlighted ? "true" : "false"}
      aria-hidden="true"
    >
      <g
        className="recorder-finger__pose"
        transform={transform}
        style={poseStyle}
      >
        <g
          className="recorder-finger__joint recorder-finger__joint--proximal"
          transform={`rotate(${pose.proximalRotate})`}
        >
          <Segment
            className="recorder-finger__proximal"
            d={proximalPath}
            width={geometry.width + 5}
          />
        </g>
        <g
          className="recorder-finger__joint recorder-finger__joint--middle"
          transform={`rotate(${pose.middleRotate})`}
        >
          <Segment
            className="recorder-finger__middle"
            d={middlePath}
            width={geometry.width + 1}
          />
        </g>
        <g
          className="recorder-finger__joint recorder-finger__joint--distal"
          transform={`rotate(${pose.distalRotate})`}
        >
          <Segment
            className="recorder-finger__distal"
            d={distalPath}
            width={geometry.width - 3}
          />
        </g>

        <ellipse
          className="recorder-finger__pad"
          data-pad-center-x={pose.x}
          data-pad-center-y={pose.y}
          cx="0"
          cy="0"
          rx={geometry.padRx}
          ry={geometry.padRy}
          fill="#eaa98f"
          stroke={highlighted ? (transition === "opening" ? "#1f70c1" : "#d99b00") : "#85584c"}
          strokeWidth={highlighted ? 8 : 6}
        />
        <path
          className="recorder-finger__pad-highlight"
          d={`M ${direction * 10} -13 Q ${direction * 22} 0 ${direction * 10} 13`}
          fill="none"
          stroke="#ffd8c5"
          strokeLinecap="round"
          strokeWidth="6"
          opacity="0.8"
        />
        <path
          className="recorder-finger__crease"
          d={`M ${direction * 62} -11 Q ${direction * 56} 0 ${direction * 62} 11`}
          fill="none"
          stroke="#b77362"
          strokeLinecap="round"
          strokeWidth="3"
          opacity="0.65"
        />
      </g>

      {showName ? (
        <g
          className="recorder-finger__name"
          transform={`translate(${labelX} ${labelY})`}
        >
          <rect
            x="-98"
            y="-22"
            width="196"
            height="43"
            rx="21"
            fill="#fffdf7"
            stroke="#85584c"
            strokeWidth="3"
          />
          <text
            x="0"
            y="7"
            textAnchor="middle"
            fill="#5d4038"
            fontSize="20"
            fontWeight="800"
          >
            {FINGER_LABELS[id]}
          </text>
        </g>
      ) : null}
    </g>
  );
}

