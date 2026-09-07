"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  AnimationPhase,
  HoleId,
  HoleState,
} from "../model/types";
import { ALL_HOLES } from "../data/fingerings";
import { getFingeringDiff } from "./getFingeringDiff";
import {
  MOTION_TIMINGS,
  STEP_LABELS,
  type AnimationSpeed,
} from "./motionTimings";

interface UseFingeringAnimationOptions {
  animationKey: number;
  targetClosedHoles: readonly HoleId[];
  restartFrom: {
    key: number;
    closedHoles: readonly HoleId[];
  } | null;
  speed: AnimationSpeed;
  stepMode: boolean;
  reducedMotion: boolean;
  playOnContact: boolean;
  onContact: () => void;
}

const STEP_PHASES: readonly AnimationPhase[] = [
  "idle",
  "highlight-release",
  "releasing",
  "highlight-press",
  "pressing",
  "contact",
  "settled",
];

function uniqueOrdered(holes: readonly HoleId[]): HoleId[] {
  const set = new Set(holes);
  return ALL_HOLES.filter((hole) => set.has(hole));
}

export function useFingeringAnimation({
  animationKey,
  targetClosedHoles,
  restartFrom,
  speed,
  stepMode,
  reducedMotion,
  playOnContact,
  onContact,
}: UseFingeringAnimationOptions) {
  const targetKey = targetClosedHoles.join("|");
  const restartKey = restartFrom?.key ?? null;
  const restartClosedKey = restartFrom?.closedHoles.join("|") ?? "";
  const [visualClosedHoles, setVisualClosedHoles] = useState<HoleId[]>(() =>
    uniqueOrdered(targetClosedHoles),
  );
  const [phase, setPhase] = useState<AnimationPhase>("settled");
  const [isPreparing, setIsPreparing] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [requestId, setRequestId] = useState(0);
  const [transitionDiff, setTransitionDiff] = useState(() =>
    getFingeringDiff(targetClosedHoles, targetClosedHoles),
  );
  const [transitionStartClosedHoles, setTransitionStartClosedHoles] = useState<
    HoleId[]
  >(() => uniqueOrdered(targetClosedHoles));
  const visualRef = useRef(visualClosedHoles);
  const targetRef = useRef(uniqueOrdered(targetClosedHoles));
  const timersRef = useRef<number[]>([]);
  const framesRef = useRef<number[]>([]);
  const requestRef = useRef(0);
  const mountedRef = useRef(false);
  const consumedRestartKeyRef = useRef<number | null>(null);
  const playOnContactRef = useRef(playOnContact);
  const onContactRef = useRef(onContact);

  useEffect(() => {
    playOnContactRef.current = playOnContact;
    onContactRef.current = onContact;
  }, [onContact, playOnContact]);

  const clearSchedule = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
    framesRef.current.forEach((frame) => window.cancelAnimationFrame(frame));
    framesRef.current = [];
  }, []);

  const commitVisual = useCallback((holes: readonly HoleId[]) => {
    const ordered = uniqueOrdered(holes);
    visualRef.current = ordered;
    setVisualClosedHoles(ordered);
  }, []);

  const schedule = useCallback(
    (delay: number, callback: () => void, activeRequest: number) => {
      const timer = window.setTimeout(() => {
        if (requestRef.current !== activeRequest) return;
        callback();
      }, delay);
      timersRef.current.push(timer);
    },
    [],
  );

  const finishPreparationAfterPaint = useCallback((activeRequest: number) => {
    const firstFrame = window.requestAnimationFrame(() => {
      if (requestRef.current !== activeRequest) return;
      const secondFrame = window.requestAnimationFrame(() => {
        if (requestRef.current !== activeRequest) return;
        setIsPreparing(false);
      });
      framesRef.current.push(secondFrame);
    });
    framesRef.current.push(firstFrame);
  }, []);

  useEffect(() => {
    targetRef.current = uniqueOrdered(targetClosedHoles);
  }, [targetKey, targetClosedHoles]);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      targetRef.current = uniqueOrdered(targetClosedHoles);
      commitVisual(targetClosedHoles);
      setPhase("settled");
      return;
    }

    clearSchedule();
    const activeRequest = requestRef.current + 1;
    requestRef.current = activeRequest;
    setRequestId(activeRequest);
    setStepIndex(0);

    const target = uniqueOrdered(targetClosedHoles);
    targetRef.current = target;
    const shouldRestart =
      restartFrom !== null &&
      restartFrom.key === animationKey &&
      consumedRestartKeyRef.current !== animationKey;
    const transitionStart = shouldRestart
      ? uniqueOrdered(restartFrom.closedHoles)
      : visualRef.current;

    if (shouldRestart) {
      consumedRestartKeyRef.current = animationKey;
      setIsPreparing(true);
      commitVisual(transitionStart);
    } else {
      setIsPreparing(false);
    }

    setTransitionStartClosedHoles(transitionStart);
    const nextDiff = getFingeringDiff(transitionStart, target);
    setTransitionDiff(nextDiff);

    if (stepMode) {
      setPhase("idle");
      if (shouldRestart) finishPreparationAfterPaint(activeRequest);
      return;
    }

    if (reducedMotion) {
      setIsPreparing(false);
      commitVisual(target);
      setPhase("contact");
      if (playOnContactRef.current) onContactRef.current();
      schedule(80, () => setPhase("settled"), activeRequest);
      return;
    }

    const timings = MOTION_TIMINGS[speed];
    let elapsed = 0;
    setPhase(nextDiff.toOpen.length ? "highlight-release" : "highlight-press");
    if (shouldRestart) finishPreparationAfterPaint(activeRequest);

    if (nextDiff.toOpen.length) {
      elapsed += timings.highlightRelease;
      schedule(
        elapsed,
        () => {
          const opening = new Set(nextDiff.toOpen);
          commitVisual(visualRef.current.filter((hole) => !opening.has(hole)));
          setPhase("releasing");
        },
        activeRequest,
      );
      elapsed += timings.release;
      schedule(elapsed, () => setPhase("highlight-press"), activeRequest);
    }

    if (nextDiff.toClose.length) {
      elapsed += timings.highlightPress;
      schedule(
        elapsed,
        () => {
          commitVisual(target);
          setPhase("pressing");
        },
        activeRequest,
      );
      elapsed += timings.press;
    }

    schedule(
      elapsed,
      () => {
        commitVisual(target);
        setPhase("contact");
        if (playOnContactRef.current) onContactRef.current();
      },
      activeRequest,
    );
    elapsed += timings.contact + timings.settle;
    schedule(elapsed, () => setPhase("settled"), activeRequest);

    return clearSchedule;
  }, [
    animationKey,
    targetKey,
    restartFrom,
    restartKey,
    restartClosedKey,
    speed,
    stepMode,
    reducedMotion,
    clearSchedule,
    commitVisual,
    finishPreparationAfterPaint,
    schedule,
    targetClosedHoles,
  ]);

  useEffect(() => clearSchedule, [clearSchedule]);

  const advanceStep = useCallback(() => {
    if (!stepMode || stepIndex >= STEP_PHASES.length - 1) return;
    const nextIndex = stepIndex + 1;
    const nextPhase = STEP_PHASES[nextIndex];
    const currentDiff = getFingeringDiff(visualRef.current, targetRef.current);

    if (nextPhase === "releasing") {
      const opening = new Set(currentDiff.toOpen);
      commitVisual(visualRef.current.filter((hole) => !opening.has(hole)));
    }
    if (nextPhase === "pressing" || nextPhase === "contact") {
      commitVisual(targetRef.current);
    }
    if (nextIndex === STEP_PHASES.length - 1 && playOnContactRef.current) {
      onContactRef.current();
    }
    setPhase(nextPhase);
    setStepIndex(nextIndex);
  }, [commitVisual, stepIndex, stepMode]);

  const getVisualClosedHoles = useCallback(
    () => [...visualRef.current] as HoleId[],
    [],
  );

  const holeStates = useMemo(
    () =>
      Object.fromEntries(
        ALL_HOLES.map((hole) => [
          hole,
          visualClosedHoles.includes(hole) ? "closed" : "open",
        ]),
      ) as Record<HoleId, HoleState>,
    [visualClosedHoles],
  );

  return {
    phase,
    isPreparing,
    visualClosedHoles,
    transitionStartClosedHoles,
    holeStates,
    diff: transitionDiff,
    stepIndex,
    stepLabel: STEP_LABELS[stepIndex],
    stepCount: STEP_LABELS.length,
    canAdvanceStep: stepMode && stepIndex < STEP_LABELS.length - 1,
    advanceStep,
    getVisualClosedHoles,
    isAnimating: phase !== "settled" && phase !== "idle",
    requestId,
  };
}
