import type { ReactNode, SVGProps } from "react";
import { HOLE_LAYOUT } from "../data/holeLayout";
import type { AnimationPhase, HoleId, HoleState } from "../model/types";

export type HoleTransition = "steady" | "opening" | "closing";

interface SharedHoleProps {
  id: HoleId;
  state: HoleState;
  transition?: HoleTransition;
  phase?: AnimationPhase;
  showNumber?: boolean;
}

export interface HoleProps
  extends SharedHoleProps,
    Omit<SVGProps<SVGGElement>, "id"> {}

export type HoleLabelProps = SharedHoleProps;

const STATE_SYMBOL: Record<HoleState, string> = {
  open: "○",
  closed: "●",
  half: "◐",
  partial: "◒",
};

export function isHoleTransitionHighlighted(
  transition: HoleTransition,
  phase: AnimationPhase | undefined,
): boolean {
  if (transition === "steady") return false;
  if (!phase) return true;

  if (transition === "opening") {
    return phase === "highlight-release" || phase === "releasing";
  }

  return (
    phase === "highlight-press" ||
    phase === "pressing" ||
    phase === "contact"
  );
}

function HoleDisc({
  cx,
  cy,
  radius,
  state,
}: {
  cx: number;
  cy: number;
  radius: number;
  state: HoleState;
}) {
  const baseClass = `recorder-hole__disc recorder-hole__disc--${state}`;
  const outline = (
    <circle
      className={baseClass}
      cx={cx}
      cy={cy}
      r={radius}
      fill={state === "closed" ? "#24343c" : "#fffdf7"}
      stroke="#24343c"
      strokeWidth="5"
      vectorEffect="non-scaling-stroke"
    />
  );

  if (state === "half") {
    return (
      <>
        {outline}
        <path
          className="recorder-hole__fraction recorder-hole__fraction--half"
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 0 ${
            cx + radius
          } ${cy} L ${cx - radius} ${cy} Z`}
          fill="#24343c"
        />
      </>
    );
  }

  if (state === "partial") {
    return (
      <>
        {outline}
        <circle
          className="recorder-hole__fraction recorder-hole__fraction--partial"
          cx={cx}
          cy={cy}
          r={radius * 0.58}
          fill="#24343c"
        />
      </>
    );
  }

  return outline;
}

function HoleDiscs({ id, state }: Pick<HoleProps, "id" | "state">): ReactNode {
  const layout = HOLE_LAYOUT[id];

  if (!("double" in layout) || !layout.double) {
    return (
      <HoleDisc
        cx={layout.x}
        cy={layout.y}
        radius={layout.radius}
        state={state}
      />
    );
  }

  const gap = layout.subHoleGap;
  const radius = layout.subHoleRadius;
  return (
    <>
      <HoleDisc
        cx={layout.x - gap}
        cy={layout.y}
        radius={radius}
        state={state}
      />
      <HoleDisc
        cx={layout.x + gap}
        cy={layout.y}
        radius={radius}
        state={state}
      />
    </>
  );
}

/** One logical recorder hole, including paired sub-holes for R6/R7. */
export function Hole({
  id,
  state,
  transition = "steady",
  phase,
  showNumber = true,
  className,
  ...groupProps
}: HoleProps) {
  const layout = HOLE_LAYOUT[id];
  const highlighted = isHoleTransitionHighlighted(transition, phase);

  return (
    <g
      {...groupProps}
      id={`hole-${id}`}
      className={[
        "recorder-hole",
        `recorder-hole--${state}`,
        `recorder-hole--${transition}`,
        highlighted ? "recorder-hole--highlighted" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      data-hole-id={id}
      data-hole-state={state}
      data-hole-transition={transition}
      data-phase={phase ?? "settled"}
      data-highlighted={highlighted ? "true" : "false"}
      aria-hidden="true"
    >
      <circle
        className="recorder-hole__touch-ring"
        cx={layout.x}
        cy={layout.y}
        r={layout.radius + 10}
        fill="none"
        stroke={highlighted ? (transition === "opening" ? "#1f70c1" : "#e2a600") : "#52636b"}
        strokeWidth={highlighted ? 7 : 3}
        strokeDasharray={state === "open" ? "8 6" : undefined}
        vectorEffect="non-scaling-stroke"
      />
      <HoleDiscs id={id} state={state} />
      {showNumber ? (
        <HoleLabel
          id={id}
          state={state}
          transition={transition}
          phase={phase}
          showNumber
        />
      ) : null}
    </g>
  );
}

/**
 * Kept in the labels layer so the status remains readable when a finger pad
 * covers the physical hole.
 */
export function HoleLabel({
  id,
  state,
  transition = "steady",
  phase,
  showNumber = true,
}: HoleLabelProps) {
  const layout = HOLE_LAYOUT[id];
  const highlighted = isHoleTransitionHighlighted(transition, phase);
  const direction = id === "T0" || layout.hand === "left" ? 1 : -1;
  const markerX =
    id === "T0"
      ? layout.x + 98
      : layout.x + direction * (layout.radius + 45);
  const numberX = markerX + direction * 42;

  return (
    <g
      className={`recorder-hole-label recorder-hole-label--${state}`}
      data-label-for={id}
      data-highlighted={highlighted ? "true" : "false"}
      aria-hidden="true"
    >
      <circle
        className="recorder-hole-label__status-bg"
        cx={markerX}
        cy={layout.y}
        r="19"
        fill="#fffdf7"
        stroke={highlighted ? (transition === "opening" ? "#1f70c1" : "#e2a600") : "#52636b"}
        strokeWidth={highlighted ? 5 : 3}
      />
      <text
        className="recorder-hole-label__state-symbol"
        x={markerX}
        y={layout.y + 7}
        textAnchor="middle"
        fill="#24343c"
        fontSize="25"
        fontWeight="800"
      >
        {STATE_SYMBOL[state]}
      </text>
      {showNumber ? (
        <g className="recorder-hole-label__number">
          <circle
            cx={numberX}
            cy={layout.y}
            r="18"
            fill="#24343c"
            stroke="#fffdf7"
            strokeWidth="3"
          />
          <text
            x={numberX}
            y={layout.y + 7}
            textAnchor="middle"
            fill="#fffdf7"
            fontSize="22"
            fontWeight="800"
          >
            {layout.label}
          </text>
        </g>
      ) : null}
      {highlighted ? (
        <text
          className={`recorder-hole-label__arrow recorder-hole-label__arrow--${transition}`}
          x={markerX}
          y={layout.y - 34}
          textAnchor="middle"
          fill={transition === "opening" ? "#1f70c1" : "#a56f00"}
          fontSize="30"
          fontWeight="900"
        >
          {transition === "opening" ? "↑" : "↓"}
        </text>
      ) : null}
    </g>
  );
}
