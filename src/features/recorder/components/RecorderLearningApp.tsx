"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  FingeringStateMap,
  FingeringSystem,
  HoleId,
  HoleState,
  NoteBank,
  SolfegeId,
} from "../model/types";
import {
  ALL_HOLES,
  FINGERINGS,
  FINGERING_STATES,
  HOLE_NUMBER_LABELS,
} from "../data/fingerings";
import {
  NOTE_BANK_MODIFIERS,
  NOTE_BANKS,
  NOTE_META,
  NOTE_ORDER,
} from "../data/noteMeta";
import { buildInstruction } from "../utils/buildInstruction";
import { resolveNoteShortcut } from "../utils/resolveNoteShortcut";
import {
  DEFAULT_PREFERENCES,
  loadPreferences,
  savePreferences,
  type RecorderPreferences,
} from "../utils/storage";
import { useFingeringAnimation } from "../animation/useFingeringAnimation";
import { BASIC_RECORDER_DEMO_AUDIO_KEYS } from "../audio/frequencies";
import { useRecorderAudio } from "../audio/useRecorderAudio";
import type { RecorderAudioRequestId } from "../audio/useRecorderAudio";
import { NoteCard } from "./NoteCard";
import { NoteKeypad } from "./NoteKeypad";
import { SettingsPanel } from "./SettingsPanel";
import { InstructionPanel } from "./InstructionPanel";
import { FingeringLegend } from "./FingeringLegend";
import { PlaybackControls } from "./PlaybackControls";
import { OnboardingBanner } from "./OnboardingBanner";
import { HelpDialog } from "./HelpDialog";
import { RecorderScene } from "./RecorderScene";

interface TransitionOrigin {
  note: SolfegeId;
  system: FingeringSystem;
  closedHoles: HoleId[];
}

interface AnimationRestart {
  key: number;
  closedHoles: HoleId[];
}

const DEBUG_ASCENDING_DEMO_INTERVAL_MS = 900;

type DebugAudioDemoStatus =
  | { phase: "idle" | "stopped" | "complete" }
  | { phase: "playing"; noteIndex: number };

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  );
}

function withKoreanSubjectParticle(value: string): string {
  const lastCharacter = value.trim().at(-1);
  if (!lastCharacter) return value;
  const codePoint = lastCharacter.charCodeAt(0);
  const hasFinalConsonant =
    codePoint >= 0xac00 && codePoint <= 0xd7a3 && (codePoint - 0xac00) % 28 !== 0;
  return `${value}${hasFinalConsonant ? "이" : "가"}`;
}

function describeFingeringForLive(fingering: FingeringStateMap): string {
  const closed = ALL_HOLES.filter((hole) => fingering[hole] === "closed");
  const half = ALL_HOLES.filter((hole) => fingering[hole] === "half");
  const partial = ALL_HOLES.filter((hole) => fingering[hole] === "partial");
  const clauses = [
    closed.length
      ? `${closed.map((hole) => HOLE_NUMBER_LABELS[hole]).join(", ")}번 구멍을 막습니다.`
      : null,
    half.length
      ? `${half.map((hole) => HOLE_NUMBER_LABELS[hole]).join(", ")}번 엄지구멍은 반만 엽니다.`
      : null,
    partial.length
      ? `${partial.map((hole) => HOLE_NUMBER_LABELS[hole]).join(", ")}번 이중 구멍은 한쪽만 막습니다.`
      : null,
  ].filter((clause): clause is string => clause !== null);

  return clauses.join(" ");
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return reduced;
}

export function RecorderLearningApp() {
  const [preferences, setPreferences] = useState<RecorderPreferences>(() => ({
    ...DEFAULT_PREFERENCES,
  }));
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [selectedNote, setSelectedNote] = useState<SolfegeId>("do");
  const [activeBank, setActiveBank] = useState<NoteBank>("low");
  const [transitionOrigin, setTransitionOrigin] =
    useState<TransitionOrigin | null>(null);
  const [animationKey, setAnimationKey] = useState(0);
  const [animationRestart, setAnimationRestart] =
    useState<AnimationRestart | null>(null);
  const [playOnContact, setPlayOnContact] = useState(false);
  const [showFingerNames, setShowFingerNames] = useState(false);
  const [stepMode, setStepMode] = useState(false);
  const [sequencePlaying, setSequencePlaying] = useState(false);
  const [sequencePaused, setSequencePaused] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [debug, setDebug] = useState(false);
  const [debugAudioDemoStatus, setDebugAudioDemoStatus] =
    useState<DebugAudioDemoStatus>({ phase: "idle" });
  const activeAudioRequestRef = useRef<RecorderAudioRequestId | null>(null);
  const animationCounterRef = useRef(0);
  const debugAudioDemoRequestRef =
    useRef<RecorderAudioRequestId | null>(null);
  const debugAudioDemoRunRef = useRef(0);
  const debugAudioDemoTimerRef = useRef<number | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  const audio = useRecorderAudio({
    initialMuted: DEFAULT_PREFERENCES.isMuted,
    persistMuted: false,
  });
  const {
    beginPlaybackRequest,
    playAtContact,
    setMuted: setAudioMuted,
    stop: stopAudio,
  } = audio;

  const updatePreferences = useCallback(
    (patch: Partial<RecorderPreferences>) => {
      setPreferences((current) => ({ ...current, ...patch }));
    },
    [],
  );

  const cancelDebugAudioDemo = useCallback(() => {
    debugAudioDemoRunRef.current += 1;
    if (debugAudioDemoTimerRef.current !== null) {
      window.clearTimeout(debugAudioDemoTimerRef.current);
      debugAudioDemoTimerRef.current = null;
    }
    debugAudioDemoRequestRef.current = null;
    stopAudio();
  }, [stopAudio]);

  const stopDebugAudioDemo = useCallback(() => {
    cancelDebugAudioDemo();
    setDebugAudioDemoStatus({ phase: "stopped" });
  }, [cancelDebugAudioDemo]);

  const startDebugAudioDemo = useCallback(() => {
    cancelDebugAudioDemo();
    const runId = debugAudioDemoRunRef.current;

    setSequencePlaying(false);
    setSequencePaused(false);
    activeAudioRequestRef.current = null;
    setPlayOnContact(false);

    if (preferences.isMuted) {
      setAudioMuted(false);
      updatePreferences({ isMuted: false });
    }

    // This must stay in the click handler so Web Audio unlock begins during
    // the initiating user gesture. The resulting request guards all 9 notes.
    const requestId = beginPlaybackRequest();
    debugAudioDemoRequestRef.current = requestId;

    const playNote = async (noteIndex: number): Promise<void> => {
      if (
        debugAudioDemoRunRef.current !== runId ||
        debugAudioDemoRequestRef.current !== requestId
      ) {
        return;
      }

      setDebugAudioDemoStatus({ phase: "playing", noteIndex });
      const played = await playAtContact(
        BASIC_RECORDER_DEMO_AUDIO_KEYS[noteIndex],
        requestId,
      );

      if (
        debugAudioDemoRunRef.current !== runId ||
        debugAudioDemoRequestRef.current !== requestId
      ) {
        return;
      }

      if (!played) {
        debugAudioDemoRequestRef.current = null;
        setDebugAudioDemoStatus({ phase: "stopped" });
        return;
      }

      debugAudioDemoTimerRef.current = window.setTimeout(() => {
        debugAudioDemoTimerRef.current = null;
        if (
          debugAudioDemoRunRef.current !== runId ||
          debugAudioDemoRequestRef.current !== requestId
        ) {
          return;
        }

        if (noteIndex === BASIC_RECORDER_DEMO_AUDIO_KEYS.length - 1) {
          debugAudioDemoRequestRef.current = null;
          setDebugAudioDemoStatus({ phase: "complete" });
          return;
        }

        void playNote(noteIndex + 1);
      }, DEBUG_ASCENDING_DEMO_INTERVAL_MS);
    };

    void playNote(0);
  }, [
    beginPlaybackRequest,
    cancelDebugAudioDemo,
    playAtContact,
    preferences.isMuted,
    setAudioMuted,
    updatePreferences,
  ]);

  useEffect(
    () => () => {
      cancelDebugAudioDemo();
    },
    [cancelDebugAudioDemo],
  );

  useEffect(() => {
    const stored = loadPreferences();
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setPreferences(stored);
      setAudioMuted(stored.isMuted);
      setPreferencesLoaded(true);
      setDebug(
        process.env.NODE_ENV !== "production" &&
          new URLSearchParams(window.location.search).get("debug") === "1",
      );
    });
    return () => {
      cancelled = true;
    };
  }, [setAudioMuted]);

  useEffect(() => {
    if (preferencesLoaded) savePreferences(preferences);
  }, [preferences, preferencesLoaded]);

  const system = preferences.fingeringSystem;
  const currentNote = NOTE_META[selectedNote];
  const targetFingering = FINGERING_STATES[system][selectedNote];
  const targetClosedHoles = FINGERINGS[system][selectedNote];
  const activeBankEntry = NOTE_BANKS[activeBank].find(
    (entry) => entry.note === selectedNote,
  );
  const shortcutBank: NoteBank = activeBankEntry
    ? activeBank
    : NOTE_BANKS.low.some((entry) => entry.note === selectedNote)
      ? "low"
      : NOTE_BANKS.high.some((entry) => entry.note === selectedNote)
        ? "high"
        : "chromatic";
  const shortcutEntry = NOTE_BANKS[shortcutBank].find(
    (entry) => entry.note === selectedNote,
  )!;
  const currentShortcutLabel = `${NOTE_BANK_MODIFIERS[shortcutBank]} + ${shortcutEntry.digit}`;

  const playCurrentAtContact = useCallback(() => {
    const requestId = activeAudioRequestRef.current;
    if (requestId === null) return;
    activeAudioRequestRef.current = null;
    setPlayOnContact(false);
    void playAtContact(NOTE_META[selectedNote].audioKey, requestId);
  }, [playAtContact, selectedNote]);

  const animation = useFingeringAnimation({
    animationKey,
    targetClosedHoles,
    restartFrom: animationRestart,
    speed: preferences.speed,
    stepMode,
    reducedMotion,
    playOnContact,
    onContact: playCurrentAtContact,
  });
  const displayAnimation = animation;
  const { getVisualClosedHoles } = animation;
  const displayedHoleStates = useMemo(
    () =>
      Object.fromEntries(
        ALL_HOLES.map((hole) => {
          if (displayAnimation.holeStates[hole] === "open") {
            return [hole, "open"];
          }

          const targetState = targetFingering[hole];
          return [hole, targetState === "open" ? "closed" : targetState];
        }),
      ) as Record<HoleId, HoleState>,
    [displayAnimation.holeStates, targetFingering],
  );

  const requestAnimation = useCallback((restartClosedHoles?: readonly HoleId[]) => {
    const key = animationCounterRef.current + 1;
    animationCounterRef.current = key;
    setAnimationRestart(
      restartClosedHoles === undefined
        ? null
        : { key, closedHoles: [...restartClosedHoles] },
    );
    setAnimationKey(key);
  }, []);

  const getReplayStart = useCallback(
    (): readonly HoleId[] =>
      transitionOrigin?.closedHoles ?? getVisualClosedHoles(),
    [getVisualClosedHoles, transitionOrigin],
  );

  const beginAudioRequest = useCallback(() => {
    const requestId = beginPlaybackRequest();
    activeAudioRequestRef.current = requestId;
    setPlayOnContact(true);
  }, [beginPlaybackRequest]);

  const selectNote = useCallback(
    (
      note: SolfegeId,
      options: {
        stopSequence?: boolean;
        play?: boolean;
        bank?: NoteBank;
      } = {},
    ) => {
      const { stopSequence = true, play = true, bank } = options;
      if (bank) setActiveBank(bank);
      if (stopSequence) {
        setSequencePlaying(false);
        setSequencePaused(false);
      }
      if (play) beginAudioRequest();
      else {
        stopAudio();
        activeAudioRequestRef.current = null;
        setPlayOnContact(false);
      }

      if (note === selectedNote) {
        requestAnimation(getReplayStart());
        return;
      }

      setTransitionOrigin({
        note: selectedNote,
        system,
        closedHoles: getVisualClosedHoles(),
      });
      setSelectedNote(note);
      requestAnimation();
    },
    [
      beginAudioRequest,
      getVisualClosedHoles,
      getReplayStart,
      requestAnimation,
      selectedNote,
      stopAudio,
      system,
    ],
  );

  const playCurrentNote = useCallback(() => {
    if (preferences.isMuted) {
      setAudioMuted(false);
      updatePreferences({ isMuted: false });
    }
    const requestId = beginPlaybackRequest();
    activeAudioRequestRef.current = null;
    setPlayOnContact(false);
    void playAtContact(NOTE_META[selectedNote].audioKey, requestId);
  }, [
    beginPlaybackRequest,
    playAtContact,
    preferences.isMuted,
    selectedNote,
    setAudioMuted,
    updatePreferences,
  ]);

  const replay = useCallback(() => {
    beginAudioRequest();
    requestAnimation(getReplayStart());
  }, [beginAudioRequest, getReplayStart, requestAnimation]);

  const changeSystem = useCallback(
    (nextSystem: FingeringSystem) => {
      if (nextSystem === system) return;
      stopAudio();
      activeAudioRequestRef.current = null;
      setPlayOnContact(false);
      setTransitionOrigin({
        note: selectedNote,
        system,
        closedHoles: getVisualClosedHoles(),
      });
      updatePreferences({ fingeringSystem: nextSystem });
      requestAnimation();
    },
    [
      getVisualClosedHoles,
      requestAnimation,
      selectedNote,
      stopAudio,
      system,
      updatePreferences,
    ],
  );

  const chooseOnboardingSystem = useCallback(
    (nextSystem: FingeringSystem) => {
      if (nextSystem !== system) changeSystem(nextSystem);
      updatePreferences({
        fingeringSystem: nextSystem,
        onboardingCompleted: true,
      });
    },
    [changeSystem, system, updatePreferences],
  );

  const changeMuted = useCallback(
    (muted: boolean) => {
      setAudioMuted(muted);
      if (muted) activeAudioRequestRef.current = null;
      updatePreferences({ isMuted: muted });
    },
    [setAudioMuted, updatePreferences],
  );

  const changeStepMode = useCallback(
    (enabled: boolean) => {
      setSequencePlaying(false);
      setSequencePaused(false);
      stopAudio();
      activeAudioRequestRef.current = null;
      setPlayOnContact(false);
      setStepMode(enabled);
      if (enabled) {
        beginAudioRequest();
        requestAnimation(getReplayStart());
      } else {
        requestAnimation();
      }
    },
    [beginAudioRequest, getReplayStart, requestAnimation, stopAudio],
  );

  const currentIndex = NOTE_ORDER.indexOf(selectedNote);
  const activeBankNotes = useMemo(
    () => NOTE_BANKS[activeBank].map((entry) => entry.note),
    [activeBank],
  );
  const activeBankIndex = activeBankNotes.indexOf(selectedNote);
  const goPrevious = useCallback(() => {
    const index = activeBankIndex < 0 ? 0 : activeBankIndex;
    const note = activeBankNotes[
      (index - 1 + activeBankNotes.length) % activeBankNotes.length
    ];
    selectNote(note, { bank: activeBank });
  }, [activeBank, activeBankIndex, activeBankNotes, selectNote]);
  const goNext = useCallback(() => {
    const index = activeBankIndex < 0 ? -1 : activeBankIndex;
    const note = activeBankNotes[(index + 1) % activeBankNotes.length];
    selectNote(note, { bank: activeBank });
  }, [activeBank, activeBankIndex, activeBankNotes, selectNote]);

  const toggleSequence = useCallback(() => {
    if (sequencePlaying) {
      setSequencePlaying(false);
      setSequencePaused(true);
      stopAudio();
      activeAudioRequestRef.current = null;
      setPlayOnContact(false);
      return;
    }

    setStepMode(false);
    if (sequencePaused) {
      selectNote(selectedNote, {
        stopSequence: false,
        play: true,
        bank: "low",
      });
      setSequencePaused(false);
      setSequencePlaying(true);
      return;
    }

    selectNote("do", { stopSequence: false, play: true, bank: "low" });
    setSequencePaused(false);
    setSequencePlaying(true);
  }, [selectNote, selectedNote, sequencePaused, sequencePlaying, stopAudio]);

  const resetSequence = useCallback(() => {
    setSequencePlaying(false);
    setSequencePaused(false);
    selectNote("do", { stopSequence: false, play: false, bank: "low" });
  }, [selectNote]);

  useEffect(() => {
    if (!sequencePlaying) return;
    const interval = preferences.speed === "slow" ? 2000 : 1500;
    const timer = window.setTimeout(() => {
      const index = NOTE_ORDER.indexOf(selectedNote);
      if (index >= NOTE_ORDER.length - 1) {
        setSequencePlaying(false);
        setSequencePaused(false);
        return;
      }
      selectNote(NOTE_ORDER[index + 1], {
        stopSequence: false,
        play: true,
        bank: "low",
      });
    }, interval);
    return () => window.clearTimeout(timer);
  }, [preferences.speed, selectNote, selectedNote, sequencePlaying]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (helpOpen) return;
      if (isTypingTarget(event.target) || event.isComposing) return;

      const shortcutNote = resolveNoteShortcut(event);
      if (shortcutNote) {
        const bank: NoteBank = event.shiftKey
          ? "high"
          : event.altKey
            ? "chromatic"
            : "low";
        event.preventDefault();
        selectNote(shortcutNote, { bank });
        return;
      }

      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrevious();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      } else if (event.key === " " && !(event.target instanceof HTMLButtonElement)) {
        event.preventDefault();
        playCurrentNote();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrevious, helpOpen, playCurrentNote, selectNote]);

  const instruction = useMemo(
    () =>
      buildInstruction({
        note: selectedNote,
        system,
        previousNote: transitionOrigin?.note ?? null,
        previousSystem: transitionOrigin?.system,
        actualStartClosedHoles: displayAnimation.transitionStartClosedHoles,
      }),
    [
      displayAnimation.transitionStartClosedHoles,
      selectedNote,
      system,
      transitionOrigin,
    ],
  );

  const liveMessage = `${withKoreanSubjectParticle(currentNote.solfegeKo)} 선택되었습니다. ${currentNote.noteName}. ${describeFingeringForLive(targetFingering)}`;
  const debugAudioDemoPlaying = debugAudioDemoStatus.phase === "playing";
  const debugAudioDemoStatusText =
    debugAudioDemoStatus.phase === "playing"
      ? `재생 중 ${debugAudioDemoStatus.noteIndex + 1}/${BASIC_RECORDER_DEMO_AUDIO_KEYS.length} · ${BASIC_RECORDER_DEMO_AUDIO_KEYS[debugAudioDemoStatus.noteIndex]}`
      : debugAudioDemoStatus.phase === "complete"
        ? "재생 완료"
        : debugAudioDemoStatus.phase === "stopped"
          ? "재생 중지"
          : "대기";

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      // Fullscreen is optional and may be blocked by an embedded browser.
    }
  }, []);

  const closeHelp = useCallback(() => setHelpOpen(false), []);

  if (!preferencesLoaded) {
    return (
      <div className="recorder-app loading-shell" aria-busy="true" aria-live="polite">
        <div className="loading-mark" aria-hidden="true">♪</div>
        <p>리코더 교실을 준비하고 있어요…</p>
      </div>
    );
  }

  return (
    <div
      className="recorder-app"
      data-reduced-motion={reducedMotion}
      data-speed={preferences.speed}
      data-animation-preparing={displayAnimation.isPreparing}
      onContextMenu={(event) => event.preventDefault()}
      onDragStart={(event) => event.preventDefault()}
    >
      <a className="skip-link" href="#learning-stage">학습 무대로 건너뛰기</a>
      <header className="app-header">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">♪</span>
          <div>
            <p className="eyebrow">손가락이 움직이는 음악 교실</p>
            <h1>리코더 운지법 배우기</h1>
            <p>낮은 음·높은 음·반음을 고르고 손가락 움직임을 살펴보세요.</p>
          </div>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="secondary-button"
            aria-label="도움말"
            onClick={() => setHelpOpen(true)}
          >
            ? 도움말
          </button>
          <button type="button" className="secondary-button" onClick={toggleFullscreen}>
            ⛶ 전체화면
          </button>
        </div>
      </header>

      {!preferences.onboardingCompleted ? (
        <OnboardingBanner onChoose={chooseOnboardingSystem} />
      ) : null}

      <main id="learning-stage" className="learning-grid">
        <div className="note-area">
          <NoteCard
            note={currentNote}
            system={system}
            onPlay={playCurrentNote}
            muted={preferences.isMuted}
            shortcutLabel={currentShortcutLabel}
          />
        </div>

        <section className="card scene-card" aria-labelledby="scene-heading">
          <div className="section-heading-row scene-heading">
            <div>
              <p className="eyebrow">앞면 1–7 · 뒷면 엄지 0</p>
              <h2 id="scene-heading">손가락 학습 무대</h2>
            </div>
            <div className="scene-status" aria-hidden="true">
              <span className="scene-status-dot" data-phase={displayAnimation.phase} />
              {displayAnimation.phase === "settled" ? "운지 완성" : stepMode ? displayAnimation.stepLabel : "손가락 이동 중"}
            </div>
          </div>
          <div className="recorder-stage-frame">
            <RecorderScene
              className="recorder-scene"
              note={selectedNote}
              system={system}
              speed={preferences.speed}
              stepMode={stepMode}
              transitionKey={animationKey}
              transitionFromNote={transitionOrigin?.note ?? null}
              transitionFromSystem={transitionOrigin?.system ?? null}
              holeStates={displayedHoleStates}
              currentClosedHoles={displayAnimation.visualClosedHoles}
              toOpen={displayAnimation.diff.toOpen}
              toClose={displayAnimation.diff.toClose}
              phase={displayAnimation.phase}
              showHoleNumbers={preferences.showHoleNumbers}
              showFingerNames={showFingerNames}
              reducedMotion={reducedMotion}
              debug={debug}
              title={`${currentNote.solfegeKo}의 현재 리코더 운지`}
              description={liveMessage}
            />
          </div>
          <FingeringLegend />
        </section>

        <div className="instruction-area">
          <InstructionPanel
            text={instruction}
            phase={displayAnimation.phase}
            toOpen={displayAnimation.diff.toOpen}
            toClose={displayAnimation.diff.toClose}
            stepMode={stepMode}
            stepIndex={displayAnimation.stepIndex}
            stepCount={displayAnimation.stepCount}
            stepLabel={displayAnimation.stepLabel}
            canAdvanceStep={displayAnimation.canAdvanceStep}
            onAdvanceStep={displayAnimation.advanceStep}
          />
        </div>

        <div className="keypad-area">
          <NoteKeypad
            selectedNote={selectedNote}
            activeBank={activeBank}
            onBankChange={setActiveBank}
            onSelect={(note, bank) => selectNote(note, { bank })}
          />
        </div>

        <div className="settings-area">
          <SettingsPanel
            system={system}
            speed={preferences.speed}
            stepMode={stepMode}
            muted={preferences.isMuted}
            showHoleNumbers={preferences.showHoleNumbers}
            showFingerNames={showFingerNames}
            onSystemChange={changeSystem}
            onSpeedChange={(speed) => updatePreferences({ speed })}
            onStepModeChange={changeStepMode}
            onMutedChange={changeMuted}
            onShowHoleNumbersChange={(showHoleNumbers) => updatePreferences({ showHoleNumbers })}
            onShowFingerNamesChange={setShowFingerNames}
            onReplay={replay}
          />
        </div>
      </main>
      <PlaybackControls
        sequencePlaying={sequencePlaying}
        sequencePaused={sequencePaused}
        sequencePosition={currentIndex}
        onPrevious={goPrevious}
        onNext={goNext}
        onReplay={replay}
        onPlaySound={playCurrentNote}
        onSequenceToggle={toggleSequence}
        onSequenceReset={resetSequence}
      />

      <footer className="app-footer">
        <p>입술에는 힘을 빼고, 구멍은 손가락 끝의 넓은 부분으로 가볍게 막아요.</p>
        <p>합성 연습음 · 로그인 없이 이 기기에 설정만 저장됩니다.</p>
      </footer>

      <p className="sr-only" aria-live="polite" aria-atomic="true" data-testid="live-region">
        {liveMessage}
      </p>
      <HelpDialog open={helpOpen} onClose={closeHelp} />
      {debug ? (
        <aside className="debug-panel" aria-label="개발용 상태 정보">
          <strong>DEBUG</strong>
          <span>{selectedNote} / {system}</span>
          <span>{displayAnimation.phase}</span>
          <span>{displayAnimation.visualClosedHoles.join(" ")}</span>
          <div className="debug-panel__audio-demo">
            <span className="debug-panel__audio-demo-title">U2 합성음 점검</span>
            <button
              type="button"
              className="debug-panel__audio-demo-button"
              aria-describedby="debug-audio-demo-status"
              onClick={
                debugAudioDemoPlaying
                  ? stopDebugAudioDemo
                  : startDebugAudioDemo
              }
            >
              {debugAudioDemoPlaying
                ? "9음 상승 데모 중지"
                : "9음 상승 데모 재생"}
            </button>
            <span
              id="debug-audio-demo-status"
              className="debug-panel__audio-demo-status"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              {debugAudioDemoStatusText}
            </span>
          </div>
        </aside>
      ) : null}
    </div>
  );
}
