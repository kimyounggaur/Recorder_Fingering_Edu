import { useId, type ReactNode, type SVGProps } from "react";
import {
  FINGER_LABELS,
  HOLE_NUMBER_LABELS,
} from "../data/fingerings";
import { HOLE_IDS } from "../data/holeLayout";
import type { AnimationPhase, HoleId, HoleState } from "../model/types";
import {
  isHoleTransitionHighlighted,
  type HoleTransition,
} from "./Hole";

interface MapHoleLayout {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly double?: boolean;
  readonly gap?: number;
  readonly labelSide: "left" | "right" | "below";
}

const MAP_HOLE_LAYOUT: Record<HoleId, MapHoleLayout> = {
  T0: { x: 82, y: 210, radius: 13, labelSide: "below" },
  L1: { x: 235, y: 180, radius: 13, labelSide: "right" },
  L2: { x: 235, y: 236, radius: 13, labelSide: "right" },
  L3: { x: 235, y: 292, radius: 13, labelSide: "right" },
  R4: { x: 235, y: 365, radius: 13, labelSide: "left" },
  R5: { x: 235, y: 421, radius: 13, labelSide: "left" },
  R6: {
    x: 235,
    y: 477,
    radius: 9,
    double: true,
    gap: 10,
    labelSide: "left",
  },
  R7: {
    x: 235,
    y: 525,
    radius: 9,
    double: true,
    gap: 10,
    labelSide: "left",
  },
};

const SHORT_FINGER_LABELS: Record<HoleId, string> = {
  T0: "왼 엄지",
  L1: "왼 검지",
  L2: "왼 중지",
  L3: "왼 약지",
  R4: "오른 검지",
  R5: "오른 중지",
  R6: "오른 약지",
  R7: "오른 새끼",
};

const STATE_LABELS: Record<HoleState, string> = {
  open: "열림",
  closed: "막힘",
  half: "반만 막힘",
  partial: "부분적으로 막힘",
};

export interface RecorderFingeringMapProps
  extends Omit<SVGProps<SVGSVGElement>, "children" | "title"> {
  holeStates?: Partial<Record<HoleId, HoleState>>;
  currentClosedHoles?: readonly HoleId[];
  toOpen?: readonly HoleId[];
  toClose?: readonly HoleId[];
  phase?: AnimationPhase;
  showHoleNumbers?: boolean;
  showFingerNames?: boolean;
  title?: string;
  description?: string;
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

function HoleDisc({
  x,
  y,
  radius,
  state,
}: {
  x: number;
  y: number;
  radius: number;
  state: HoleState;
}) {
  const closed = state === "closed";

  return (
    <g className="fingering-map__disc">
      <circle
        className="fingering-map__disc-fill"
        cx={x}
        cy={y}
        r={radius}
        fill={closed ? "#24343c" : "#fffdf7"}
      />
      {state === "half" ? (
        <path
          className="fingering-map__disc-fraction fingering-map__disc-fraction--half"
          d={`M ${x - radius} ${y} A ${radius} ${radius} 0 0 0 ${
            x + radius
          } ${y} L ${x - radius} ${y} Z`}
          fill="#24343c"
        />
      ) : null}
      {state === "partial" ? (
        <circle
          className="fingering-map__disc-fraction fingering-map__disc-fraction--partial"
          cx={x}
          cy={y}
          r={radius * 0.55}
          fill="#24343c"
        />
      ) : null}
      <circle
        className="fingering-map__disc-outline"
        cx={x}
        cy={y}
        r={radius}
        fill="none"
        stroke="#24343c"
        strokeWidth="3"
        vectorEffect="non-scaling-stroke"
      />
    </g>
  );
}

function HoleDiscs({
  id,
  state,
}: {
  id: HoleId;
  state: HoleState;
}): ReactNode {
  const layout = MAP_HOLE_LAYOUT[id];

  if (!layout.double) {
    return (
      <HoleDisc
        x={layout.x}
        y={layout.y}
        radius={layout.radius}
        state={state}
      />
    );
  }

  const gap = layout.gap ?? 0;

  if (state === "partial") {
    return (
      <>
        <HoleDisc
          x={layout.x - gap}
          y={layout.y}
          radius={layout.radius}
          state="closed"
        />
        <HoleDisc
          x={layout.x + gap}
          y={layout.y}
          radius={layout.radius}
          state="open"
        />
      </>
    );
  }

  return (
    <>
      <HoleDisc
        x={layout.x - gap}
        y={layout.y}
        radius={layout.radius}
        state={state}
      />
      <HoleDisc
        x={layout.x + gap}
        y={layout.y}
        radius={layout.radius}
        state={state}
      />
    </>
  );
}

function ChangeRing({
  id,
  transition,
  phase,
  highlighted,
}: {
  id: HoleId;
  transition: Exclude<HoleTransition, "steady">;
  phase: AnimationPhase;
  highlighted: boolean;
}) {
  const layout = MAP_HOLE_LAYOUT[id];
  const action = transition === "closing" ? "press" : "release";
  const ringRadius = layout.radius + (layout.double ? 14 : 8);

  return (
    <circle
      className={[
        "fingering-map__change-ring",
        `fingering-map__change-ring--${action}`,
        `fingering-map__change-ring--${transition}`,
        `fingering-map__change-ring--phase-${phase}`,
        highlighted ? "fingering-map__change-ring--active" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      cx={layout.x}
      cy={layout.y}
      r={ringRadius}
      fill="none"
      stroke={action === "press" ? "#d98514" : "#2478bd"}
      strokeWidth="4"
      strokeDasharray={action === "release" ? "5 4" : undefined}
      opacity={highlighted ? 1 : 0}
      vectorEffect="non-scaling-stroke"
      aria-hidden="true"
    />
  );
}

function HoleLabel({
  id,
  showHoleNumbers,
  showFingerNames,
}: {
  id: HoleId;
  showHoleNumbers: boolean;
  showFingerNames: boolean;
}) {
  if (!showHoleNumbers && !showFingerNames) return null;

  const layout = MAP_HOLE_LAYOUT[id];

  if (layout.labelSide === "below") {
    return (
      <g className="fingering-map__hole-label" aria-hidden="true">
        {showHoleNumbers ? (
          <text
            className="fingering-map__hole-number"
            x={layout.x}
            y={layout.y + 5}
            textAnchor="middle"
          >
            {HOLE_NUMBER_LABELS[id]}
          </text>
        ) : null}
        {showFingerNames ? (
          <text
            className="fingering-map__finger-name"
            x={layout.x}
            y={layout.y + 48}
            textAnchor="middle"
          >
            {SHORT_FINGER_LABELS[id]}
          </text>
        ) : null}
      </g>
    );
  }

  const isRight = layout.labelSide === "right";
  const numberX = layout.x + (isRight ? 32 : -32);
  const nameX = layout.x + (isRight ? 55 : -55);

  return (
    <g className="fingering-map__hole-label" aria-hidden="true">
      {showHoleNumbers ? (
        <g className="fingering-map__hole-number-badge">
          <circle
            cx={numberX}
            cy={layout.y}
            r="10"
            fill="#e9f1ef"
            stroke="#617578"
            strokeWidth="1.5"
          />
          <text
            className="fingering-map__hole-number"
            x={numberX}
            y={layout.y + 4}
            textAnchor="middle"
          >
            {HOLE_NUMBER_LABELS[id]}
          </text>
        </g>
      ) : null}
      {showFingerNames ? (
        <text
          className="fingering-map__finger-name"
          x={nameX + (showHoleNumbers ? (isRight ? 2 : -2) : 0)}
          y={layout.y + 4}
          textAnchor={isRight ? "start" : "end"}
        >
          {SHORT_FINGER_LABELS[id]}
        </text>
      ) : null}
    </g>
  );
}

function MapHole({
  id,
  state,
  transition,
  phase,
  showHoleNumbers,
  showFingerNames,
}: {
  id: HoleId;
  state: HoleState;
  transition: HoleTransition;
  phase: AnimationPhase;
  showHoleNumbers: boolean;
  showFingerNames: boolean;
}) {
  const highlighted = isHoleTransitionHighlighted(transition, phase);
  const pressed = state !== "open";

  return (
    <g
      className={[
        "fingering-map__hole",
        `fingering-map__hole--${state}`,
        `fingering-map__hole--${transition}`,
        `fingering-map__hole--phase-${phase}`,
        pressed ? "is-pressed" : "is-open",
        highlighted ? "fingering-map__hole--highlighted" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      data-hole-id={id}
      data-hole-state={state}
      data-hole-transition={transition}
      data-finger={id}
      data-finger-state={state}
      data-highlighted={highlighted ? "true" : "false"}
      role="group"
      aria-label={`${HOLE_NUMBER_LABELS[id]}번 구멍, ${FINGER_LABELS[id]}, ${STATE_LABELS[state]}`}
    >
      <title>{`${FINGER_LABELS[id]}: ${STATE_LABELS[state]}`}</title>
      {transition !== "steady" ? (
        <ChangeRing
          id={id}
          transition={transition}
          phase={phase}
          highlighted={highlighted}
        />
      ) : null}
      <HoleDiscs id={id} state={state} />
      <HoleLabel
        id={id}
        showHoleNumbers={showHoleNumbers}
        showFingerNames={showFingerNames}
      />
    </g>
  );
}

/** Compact front/rear recorder map for a note's current and changing fingering. */
export function RecorderFingeringMap({
  holeStates = {},
  currentClosedHoles = [],
  toOpen = [],
  toClose = [],
  phase = "settled",
  showHoleNumbers = true,
  showFingerNames = false,
  title = "현재 리코더 운지 도식",
  description,
  className,
  ...svgProps
}: RecorderFingeringMapProps) {
  const instanceId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const titleId = `fingering-map-title-${instanceId}`;
  const descriptionId = `fingering-map-description-${instanceId}`;
  const closedSet = new Set(currentClosedHoles);
  const states = HOLE_IDS.reduce<Record<HoleId, HoleState>>(
    (result, id) => {
      result[id] = holeStates[id] ?? (closedSet.has(id) ? "closed" : "open");
      return result;
    },
    {} as Record<HoleId, HoleState>,
  );
  const closedHoles = HOLE_IDS.filter((id) => states[id] === "closed");
  const contactedHoles = HOLE_IDS.filter((id) => states[id] !== "open");
  const defaultDescription = contactedHoles.length
    ? `${contactedHoles.map((id) => HOLE_NUMBER_LABELS[id]).join(", ")}번 구멍에 손가락이 닿은 운지입니다.`
    : "모든 구멍을 연 운지입니다.";
  const fingerDescription = showFingerNames
    ? ` 담당 손가락은 ${HOLE_IDS.map(
        (id) => `${HOLE_NUMBER_LABELS[id]}번 ${FINGER_LABELS[id]}`,
      ).join(", ")}입니다.`
    : "";

  return (
    <svg
      {...svgProps}
      className={[
        "fingering-map",
        `fingering-map--phase-${phase}`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      viewBox="0 0 400 620"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-labelledby={`${titleId} ${descriptionId}`}
      focusable="false"
      data-testid="recorder-fingering-map"
      data-phase={phase}
      data-closed-holes={closedHoles.join(" ")}
      data-contacted-holes={contactedHoles.join(" ")}
    >
      <title id={titleId}>{title}</title>
      <desc id={descriptionId}>
        {description ?? `${defaultDescription}${fingerDescription}`}
      </desc>

      <g className="fingering-map__instrument" aria-hidden="true">
        <text className="fingering-map__view-label" x="235" y="25" textAnchor="middle">
          앞면
        </text>
        <path
          className="fingering-map__mouthpiece"
          d="M210 45 Q235 30 260 45 L255 94 H215 Z"
          fill="#e4d4b7"
          stroke="#617578"
          strokeWidth="3"
        />
        <path
          className="fingering-map__body"
          d="M202 91 Q235 78 268 91 L261 547 Q235 558 209 547 Z"
          fill="#f2e8d6"
          stroke="#617578"
          strokeWidth="3"
        />
        <path
          className="fingering-map__windway"
          d="M216 76 H254 M213 111 H257"
          fill="none"
          stroke="#899b9b"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          className="fingering-map__bell"
          d="M208 540 Q235 552 262 540 L278 580 Q235 602 192 580 Z"
          fill="#e4d4b7"
          stroke="#617578"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path
          className="fingering-map__body-highlight"
          d="M219 116 L216 526"
          fill="none"
          stroke="#fffdf7"
          strokeWidth="7"
          strokeLinecap="round"
          opacity="0.72"
        />

        <path
          className="fingering-map__hand-guide fingering-map__hand-guide--left"
          d="M285 160 H297 V312 H285"
          fill="none"
          stroke="#879998"
          strokeWidth="2"
        />
        <text className="fingering-map__hand-label" x="307" y="150">
          왼손
        </text>
        <path
          className="fingering-map__hand-guide fingering-map__hand-guide--right"
          d="M185 344 H173 V543 H185"
          fill="none"
          stroke="#879998"
          strokeWidth="2"
        />
        <text
          className="fingering-map__hand-label"
          x="164"
          y="335"
          textAnchor="end"
        >
          오른손
        </text>
      </g>

      <g className="fingering-map__rear-inset">
        <rect
          className="fingering-map__rear-panel"
          x="18"
          y="108"
          width="128"
          height="190"
          rx="22"
          fill="#f4f8f6"
          stroke="#94aaa7"
          strokeWidth="2"
          aria-hidden="true"
        />
        <text
          className="fingering-map__view-label"
          x="82"
          y="132"
          textAnchor="middle"
          aria-hidden="true"
        >
          뒤쪽 엄지
        </text>
        <path
          className="fingering-map__rear-body"
          d="M67 148 Q82 141 97 148 L94 267 Q82 273 70 267 Z"
          fill="#f2e8d6"
          stroke="#617578"
          strokeWidth="2.5"
          aria-hidden="true"
        />
        <path
          className="fingering-map__rear-connector"
          d="M146 197 C170 197 180 176 198 165"
          fill="none"
          stroke="#94aaa7"
          strokeWidth="2"
          strokeDasharray="5 5"
          aria-hidden="true"
        />
        <MapHole
          id="T0"
          state={states.T0}
          transition={transitionFor("T0", toOpen, toClose)}
          phase={phase}
          showHoleNumbers={showHoleNumbers}
          showFingerNames={showFingerNames}
        />
      </g>

      <g className="fingering-map__front-holes">
        {HOLE_IDS.filter((id) => id !== "T0").map((id) => (
          <MapHole
            key={id}
            id={id}
            state={states[id]}
            transition={transitionFor(id, toOpen, toClose)}
            phase={phase}
            showHoleNumbers={showHoleNumbers}
            showFingerNames={showFingerNames}
          />
        ))}
      </g>

      <g className="fingering-map__legend" aria-hidden="true">
        <circle cx="34" cy="578" r="8" fill="#24343c" stroke="#24343c" strokeWidth="2" />
        <text x="49" y="582">막음</text>
        <circle cx="94" cy="578" r="8" fill="#fffdf7" stroke="#24343c" strokeWidth="2" />
        <text x="109" y="582">열림</text>
        <path d="M 153 578 A 8 8 0 0 0 169 578 L 153 578 Z" fill="#24343c" />
        <circle cx="161" cy="578" r="8" fill="none" stroke="#24343c" strokeWidth="2" />
        <text x="176" y="582">반개방</text>
        <circle cx="256" cy="578" r="8" fill="#fffdf7" stroke="#24343c" strokeWidth="2" />
        <path d="M 256 570 A 8 8 0 0 0 256 586 Z" fill="#24343c" />
        <text x="271" y="582">한쪽만</text>
      </g>
    </svg>
  );
}
