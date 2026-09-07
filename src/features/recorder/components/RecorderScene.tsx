import { useId, type HTMLAttributes } from "react";
import {
  FINGERING_STATES,
  FINGER_LABELS,
  HOLE_NUMBER_LABELS,
} from "../data/fingerings";
import { HOLE_IDS } from "../data/holeLayout";
import { getRecorderPoseSource } from "../data/poseAssets";
import type {
  AnimationPhase,
  FingeringSystem,
  HoleId,
  HoleState,
  PlaybackSpeed,
  SolfegeId,
} from "../model/types";
import { RecorderFingeringMap } from "./RecorderFingeringMap";
import { RecorderPoseStage } from "./RecorderPoseStage";

export interface RecorderSceneProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "title"> {
  note: SolfegeId;
  system: FingeringSystem;
  speed?: PlaybackSpeed;
  stepMode?: boolean;
  transitionKey?: number;
  transitionFromNote?: SolfegeId | null;
  transitionFromSystem?: FingeringSystem | null;
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
function ChangeList({
  holes,
  kind,
}: {
  holes: readonly HoleId[];
  kind: "release" | "press";
}) {
  if (!holes.length) return null;
  return (
    <div className={`pose-change-list pose-change-list--${kind}`}>
      <span className="pose-change-list__label">
        {kind === "release" ? "떼기" : "막기"}
      </span>
      <div className="pose-change-list__chips">
        {holes.map((hole) => (
          <span key={hole} className="pose-change-chip">
            <strong>{HOLE_NUMBER_LABELS[hole]}</strong>
            <span>{FINGER_LABELS[hole]}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function sameFingeringStates(
  first: Record<HoleId, HoleState>,
  second: Readonly<Record<HoleId, HoleState>>,
): boolean {
  return HOLE_IDS.every((hole) => first[hole] === second[hole]);
}

/**
 * User-provided complete hand poses form the main stage. A compact semantic
 * diagram remains data-driven so every hole, label, transition ring and test
 * reads the same fingering state as the lesson text and audio.
 */
export function RecorderScene({
  note,
  system,
  speed = "normal",
  stepMode = false,
  transitionKey = 0,
  transitionFromNote = null,
  transitionFromSystem = null,
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
  ...divProps
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
  const actualContacted = HOLE_IDS.filter(
    (id) => normalizedStates[id] !== "open",
  );
  const defaultDescription = actualContacted.length
    ? `${actualContacted.map((id) => HOLE_NUMBER_LABELS[id]).join(", ")}번 구멍에 손가락이 닿은 현재 운지입니다.`
    : "모든 구멍을 연 현재 운지입니다.";

  const poseMatchesVisualState = sameFingeringStates(
    normalizedStates,
    FINGERING_STATES[system][note],
  );
  const holdPreviousPose =
    stepMode && !poseMatchesVisualState && transitionFromNote !== null;
  const displayedPoseNote = holdPreviousPose ? transitionFromNote : note;
  const displayedPoseSystem = holdPreviousPose
    ? transitionFromSystem ?? system
    : system;
  const poseSource = getRecorderPoseSource(
    displayedPoseNote,
    displayedPoseSystem,
  );
  const replaySource = transitionFromNote
    ? getRecorderPoseSource(transitionFromNote, transitionFromSystem ?? system)
    : null;
  const poseDuration = reducedMotion ? 0 : speed === "slow" ? 720 : 260;

  return (
    <div
      {...divProps}
      className={[
        "recorder-scene",
        `recorder-scene--phase-${phase}`,
        reducedMotion ? "recorder-scene--reduced-motion" : "",
        debug ? "recorder-scene--debug" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      role="img"
      aria-labelledby={`${titleId} ${descriptionId}`}
      data-testid="recorder-scene"
      data-phase={phase}
      data-reduced-motion={reducedMotion ? "true" : "false"}
      data-debug={debug ? "true" : "false"}
      data-closed-holes={actualClosed.join(" ")}
      data-contacted-holes={actualContacted.join(" ")}
      data-note={note}
      data-fingering-system={system}
    >
      <span id={titleId} className="sr-only">{title}</span>
      <span id={descriptionId} className="sr-only">
        {description ?? defaultDescription}
      </span>

      <section className="recorder-pose-panel" aria-hidden="true">
        <div className="recorder-pose-panel__topline">
          <span className="recorder-pose-panel__kicker">실제 손 모양</span>
          <span className="recorder-pose-panel__open-key">
            <i aria-hidden="true" /> 회색 손가락은 떼어요
          </span>
        </div>
        <RecorderPoseStage
          source={poseSource}
          replaySource={replaySource}
          transitionKey={`${transitionKey}:${poseSource}`}
          duration={poseDuration}
          reducedMotion={reducedMotion}
        />
        <div className="recorder-pose-panel__hand-guide">
          <span><b>왼손</b> 화면 오른쪽 · 위쪽 구멍</span>
          <span><b>오른손</b> 화면 왼쪽 · 아래쪽 구멍</span>
        </div>
      </section>

      <section className="fingering-map-panel" aria-hidden="true">
        <div className="fingering-map-panel__heading">
          <div>
            <span>구멍 지도</span>
            <strong>0–7번 접촉 상태</strong>
          </div>
          <span className="fingering-map-panel__system">
            {system === "baroque" ? "바로크식" : "독일식"}
          </span>
        </div>
        <RecorderFingeringMap
          holeStates={normalizedStates}
          currentClosedHoles={actualClosed}
          toOpen={toOpen}
          toClose={toClose}
          phase={phase}
          showHoleNumbers={showHoleNumbers}
          showFingerNames={showFingerNames}
          title={`${title} 구멍 지도`}
          description={description ?? defaultDescription}
        />
        <div className="fingering-map-panel__legend">
          <span><i className="map-legend-dot map-legend-dot--closed" /> 막음</span>
          <span><i className="map-legend-dot map-legend-dot--open" /> 열림</span>
          <span><i className="map-legend-dot map-legend-dot--half" /> 반개방</span>
          <span><i className="map-legend-dot map-legend-dot--partial" /> 한쪽만</span>
        </div>
      </section>

      <div className="recorder-scene__changes" aria-hidden="true">
        <ChangeList holes={toOpen} kind="release" />
        <ChangeList holes={toClose} kind="press" />
        {!toOpen.length && !toClose.length ? (
          <p className="pose-change-stable">손 모양과 구멍 지도가 일치했어요.</p>
        ) : null}
      </div>

      {debug ? (
        <div className="recorder-scene__debug-readout" aria-hidden="true">
          <strong>POSE</strong>
          <span>{poseSource}</span>
          <span>{actualClosed.join(" ")}</span>
        </div>
      ) : null}
    </div>
  );
}
