import type { SVGProps } from "react";
import { getFingerPose } from "../data/fingerPoses";
import { HOLE_IDS, HOLE_LAYOUT } from "../data/holeLayout";
import type { AnimationPhase, HoleId, HoleState } from "../model/types";

export interface RecorderDebugOverlayProps
  extends Omit<SVGProps<SVGGElement>, "id"> {
  holeStates?: Partial<Record<HoleId, HoleState>>;
  currentClosedHoles?: readonly HoleId[];
  phase?: AnimationPhase;
  showPoseBounds?: boolean;
}

/** Development-only coordinate and pose inspection layer. */
export function RecorderDebugOverlay({
  holeStates = {},
  currentClosedHoles = [],
  phase = "settled",
  showPoseBounds = true,
  className,
  ...groupProps
}: RecorderDebugOverlayProps) {
  const stateFor = (id: HoleId): HoleState =>
    holeStates[id] ?? (currentClosedHoles.includes(id) ? "closed" : "open");
  const closed = HOLE_IDS.filter((id) => stateFor(id) === "closed");

  return (
    <g
      {...groupProps}
      id="recorder-debug-overlay"
      className={["recorder-debug-overlay", className]
        .filter(Boolean)
        .join(" ")}
      data-phase={phase}
      pointerEvents="none"
      aria-hidden="true"
    >
      {HOLE_IDS.map((id) => {
        const layout = HOLE_LAYOUT[id];
        const openPose = getFingerPose(id, "open");
        const closedPose = getFingerPose(id, "closed");
        const currentPose = getFingerPose(id, stateFor(id));

        return (
          <g key={id} className="recorder-debug-overlay__item" data-debug-for={id}>
            {showPoseBounds ? (
              <>
                <line
                  x1={openPose.x}
                  y1={openPose.y}
                  x2={closedPose.x}
                  y2={closedPose.y}
                  stroke="#8a48c7"
                  strokeWidth="3"
                  strokeDasharray="7 7"
                />
                <rect
                  x={openPose.x - 36}
                  y={openPose.y - 30}
                  width="72"
                  height="60"
                  fill="none"
                  stroke="#1f70c1"
                  strokeWidth="3"
                  strokeDasharray="5 5"
                />
                <rect
                  x={closedPose.x - 36}
                  y={closedPose.y - 30}
                  width="72"
                  height="60"
                  fill="none"
                  stroke="#d18800"
                  strokeWidth="3"
                  strokeDasharray="5 5"
                />
              </>
            ) : null}

            <circle
              cx={layout.x}
              cy={layout.y}
              r="5"
              fill="#00a167"
              stroke="#ffffff"
              strokeWidth="2"
            />
            <path
              d={`M ${layout.x - 12} ${layout.y} H ${layout.x + 12} M ${
                layout.x
              } ${layout.y - 12} V ${layout.y + 12}`}
              fill="none"
              stroke="#00a167"
              strokeWidth="2"
            />
            <circle
              cx={currentPose.x}
              cy={currentPose.y}
              r="7"
              fill="#ec3e6a"
              stroke="#ffffff"
              strokeWidth="2"
            />
            <text
              x={layout.x + 13}
              y={layout.y - 13}
              fill="#006342"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              fontSize="17"
              fontWeight="800"
            >
              {id} ({layout.x},{layout.y})
            </text>
          </g>
        );
      })}

      <g className="recorder-debug-overlay__status" transform="translate(638 58)">
        <rect
          width="322"
          height="126"
          rx="18"
          fill="#17252a"
          fillOpacity="0.92"
          stroke="#59e6bb"
          strokeWidth="3"
        />
        <text
          x="18"
          y="35"
          fill="#92f4d7"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          fontSize="18"
          fontWeight="800"
        >
          DEBUG · phase: {phase}
        </text>
        <text
          x="18"
          y="70"
          fill="#ffffff"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          fontSize="18"
        >
          closed: [{closed.join(", ")}]
        </text>
        <text
          x="18"
          y="103"
          fill="#c5d5d4"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          fontSize="16"
        >
          green=hole · pink=pad
        </text>
      </g>
    </g>
  );
}

