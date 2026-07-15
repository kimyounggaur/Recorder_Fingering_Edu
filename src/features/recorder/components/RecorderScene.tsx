import { useId, type SVGProps } from "react";
import { HOLE_NUMBER_LABELS } from "../data/fingerings";
import {
  FRONT_HOLE_IDS,
  HOLE_IDS,
  HOLE_LAYOUT,
  RECORDER_SCENE_VIEW_BOX,
} from "../data/holeLayout";
import type { AnimationPhase, HoleId, HoleState } from "../model/types";
import { FingerLayer } from "./FingerLayer";
import { Hole, HoleLabel, type HoleTransition } from "./Hole";
import { RearThumbInset } from "./RearThumbInset";
import { RecorderBody } from "./RecorderBody";
import { RecorderDebugOverlay } from "./RecorderDebugOverlay";

export interface RecorderSceneProps
  extends Omit<SVGProps<SVGSVGElement>, "children" | "title"> {
  holeStates?: Partial<Record<HoleId, HoleState>>;
  currentClosedHoles?: readonly HoleId[];
  toOpen?: readonly HoleId[];
  toClose?: readonly HoleId[];
  phase?: AnimationPhase;
  showHoleNumbers?: boolean;
  showFingerNames?: boolean;
  reducedMotion?: boolean;
  debug?: boolean;
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

function MotionEffects({
  toOpen,
  toClose,
  phase,
}: {
  toOpen: readonly HoleId[];
  toClose: readonly HoleId[];
  phase: AnimationPhase;
}) {
  const releaseActive =
    phase === "highlight-release" || phase === "releasing";
  const pressActive =
    phase === "highlight-press" || phase === "pressing" || phase === "contact";

  return (
    <g id="motion-effects" className="recorder-motion-effects" aria-hidden="true">
      {releaseActive
        ? toOpen.map((id) => {
            const { x, y, radius } = HOLE_LAYOUT[id];
            return (
              <g
                key={`open-${id}`}
                className="recorder-motion-effect recorder-motion-effect--release"
                data-effect-hole={id}
              >
                <circle
                  cx={x}
                  cy={y}
                  r={radius + 22}
                  fill="none"
                  stroke="#1f70c1"
                  strokeWidth="7"
                  strokeDasharray="10 7"
                />
                <path
                  d={`M ${x} ${y - radius - 15} V ${y - radius - 63} M ${
                    x - 14
                  } ${y - radius - 49} L ${x} ${y - radius - 65} L ${
                    x + 14
                  } ${y - radius - 49}`}
                  fill="none"
                  stroke="#1f70c1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="7"
                />
              </g>
            );
          })
        : null}

      {pressActive
        ? toClose.map((id) => {
            const { x, y, radius } = HOLE_LAYOUT[id];
            return (
              <g
                key={`close-${id}`}
                className={`recorder-motion-effect recorder-motion-effect--press${
                  phase === "contact" ? " recorder-motion-effect--contact" : ""
                }`}
                data-effect-hole={id}
              >
                <circle
                  cx={x}
                  cy={y}
                  r={radius + (phase === "contact" ? 28 : 22)}
                  fill="none"
                  stroke="#e2a600"
                  strokeWidth={phase === "contact" ? 10 : 7}
                  opacity={phase === "contact" ? 0.82 : 1}
                />
                {phase !== "contact" ? (
                  <path
                    d={`M ${x} ${y - radius - 61} V ${
                      y - radius - 17
                    } M ${x - 14} ${y - radius - 31} L ${x} ${
                      y - radius - 15
                    } L ${x + 14} ${y - radius - 31}`}
                    fill="none"
                    stroke="#b47700"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="7"
                  />
                ) : null}
              </g>
            );
          })
        : null}
    </g>
  );
}

/**
 * One data-driven inline SVG scene. Notes never swap complete images; only the
 * semantic hole states and each independent finger transform change.
 */
export function RecorderScene({
  holeStates = {},
  currentClosedHoles = [],
  toOpen = [],
  toClose = [],
  phase = "settled",
  showHoleNumbers = true,
  showFingerNames = false,
  reducedMotion = false,
  debug = false,
  title = "현재 리코더 운지",
  description,
  className,
  style,
  ...svgProps
}: RecorderSceneProps) {
  const sceneId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const titleId = `recorder-scene-title-${sceneId}`;
  const descriptionId = `recorder-scene-description-${sceneId}`;
  const closedSet = new Set(currentClosedHoles);
  const normalizedStates = HOLE_IDS.reduce<Record<HoleId, HoleState>>(
    (states, id) => {
      states[id] = holeStates[id] ?? (closedSet.has(id) ? "closed" : "open");
      return states;
    },
    {} as Record<HoleId, HoleState>,
  );
  const actualClosed = HOLE_IDS.filter(
    (id) => normalizedStates[id] === "closed",
  );
  const defaultDescription = actualClosed.length
    ? `${actualClosed.map((id) => HOLE_NUMBER_LABELS[id]).join(", ")}번 구멍을 막은 현재 운지입니다.`
    : "모든 구멍을 연 현재 운지입니다.";

  return (
    <svg
      {...svgProps}
      className={[
        "recorder-scene",
        `recorder-scene--phase-${phase}`,
        reducedMotion ? "recorder-scene--reduced-motion" : "",
        debug ? "recorder-scene--debug" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      viewBox={RECORDER_SCENE_VIEW_BOX}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-labelledby={`${titleId} ${descriptionId}`}
      focusable="false"
      data-testid="recorder-scene"
      data-phase={phase}
      data-reduced-motion={reducedMotion ? "true" : "false"}
      data-debug={debug ? "true" : "false"}
      data-closed-holes={actualClosed.join(" ")}
      style={style}
    >
      <title id={titleId}>{title}</title>
      <desc id={descriptionId}>{description ?? defaultDescription}</desc>

      <g id="scene-background" className="recorder-scene__background" aria-hidden="true">
        <rect x="18" y="18" width="964" height="1564" rx="52" fill="#f7fbf8" />
        <path
          d="M74 86 H926 M74 1518 H926"
          fill="none"
          stroke="#d9e9e4"
          strokeWidth="5"
          strokeDasharray="18 16"
        />
        <circle cx="882" cy="142" r="52" fill="#e6f3ef" />
        <circle cx="104" cy="1462" r="74" fill="#eef6dc" />
      </g>

      <RecorderBody instanceId={`recorder-${sceneId}`} />

      <g id="front-holes" className="recorder-scene__front-holes" aria-hidden="true">
        {FRONT_HOLE_IDS.map((id) => (
          <Hole
            key={id}
            id={id}
            state={normalizedStates[id]}
            transition={transitionFor(id, toOpen, toClose)}
            phase={phase}
            showNumber={false}
          />
        ))}
      </g>

      <RearThumbInset
        state={normalizedStates.T0}
        transition={transitionFor("T0", toOpen, toClose)}
        phase={phase}
        showNumber={false}
      />

      <g id="hand-guides" className="recorder-scene__hand-guides" aria-hidden="true">
        <path
          d="M114 789 C210 823 306 806 385 752"
          fill="none"
          stroke="#82a9a5"
          strokeWidth="4"
          strokeDasharray="12 11"
        />
        <text x="146" y="820" fill="#557773" fontSize="23" fontWeight="800">
          왼손 · 위쪽
        </text>
        <path
          d="M616 1328 C706 1370 805 1374 897 1332"
          fill="none"
          stroke="#82a9a5"
          strokeWidth="4"
          strokeDasharray="12 11"
        />
        <text x="746" y="1404" fill="#557773" fontSize="23" fontWeight="800">
          오른손 · 아래쪽
        </text>
      </g>

      <FingerLayer
        holeStates={normalizedStates}
        currentClosedHoles={actualClosed}
        toOpen={toOpen}
        toClose={toClose}
        phase={phase}
        showFingerNames={showFingerNames}
        reducedMotion={reducedMotion}
      />

      <g id="hole-labels" className="recorder-scene__hole-labels" aria-hidden="true">
        {HOLE_IDS.map((id) => (
          <HoleLabel
            key={id}
            id={id}
            state={normalizedStates[id]}
            transition={transitionFor(id, toOpen, toClose)}
            phase={phase}
            showNumber={showHoleNumbers}
          />
        ))}
      </g>

      <MotionEffects toOpen={toOpen} toClose={toClose} phase={phase} />

      {debug ? (
        <RecorderDebugOverlay
          holeStates={normalizedStates}
          currentClosedHoles={actualClosed}
          phase={phase}
        />
      ) : null}
    </svg>
  );
}
