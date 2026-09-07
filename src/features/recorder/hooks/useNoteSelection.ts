import {
  useCallback,
  useMemo,
  useRef,
  useState
} from "react";
import { useFingeringAnimation } from "../animation/useFingeringAnimation";
import type { ClassroomSnapshot } from "./useClassroom";
import type { RecorderAudioRequestId, UseRecorderAudioResult } from "../audio/useRecorderAudio";
import {
  ALL_HOLES,
  FINGERING_STATES,
  FINGERINGS
} from "../data/fingerings";
import {
  NOTE_BANK_MODIFIERS,
  NOTE_BANKS,
  NOTE_META,
  NOTE_ORDER,
} from "../data/noteMeta";
import type {
  FingeringSystem,
  HoleId,
  HoleState,
  NoteBank,
  SolfegeId
} from "../model/types";
import { buildInstruction } from "../utils/buildInstruction";
import { describeFingeringForLive, withKoreanSubjectParticle } from "../utils/liveMessage";
import {
  DEFAULT_PREFERENCES,
  type RecorderPreferences
} from "../utils/storage";
interface TransitionOrigin {
  note: SolfegeId;
  system: FingeringSystem;
  closedHoles: HoleId[];
}
interface AnimationRestart {
  key: number;
  closedHoles: HoleId[];
}
export function useNoteSelection({ preferences, updatePreferences, reducedMotion, audio, onStopSequence }: {
  preferences: RecorderPreferences; updatePreferences: (patch: Partial<RecorderPreferences>) => void;
  reducedMotion: boolean; audio: UseRecorderAudioResult; onStopSequence: () => void;
}) {
  const stepMode = preferences.stepMode;
  const setStepMode = useCallback((stepMode: boolean) => updatePreferences({ stepMode }), [updatePreferences]);
  const { beginPlaybackRequest, playAtContact, setMuted: setAudioMuted, stop: stopAudio } = audio;
  const [selectedNote, setSelectedNote] = useState<SolfegeId>("do");

  const [activeBank, setActiveBank] = useState<NoteBank>("low");

  const [transitionOrigin, setTransitionOrigin] =
    useState<TransitionOrigin | null>(null);

  const [animationKey, setAnimationKey] = useState(0);

  const [animationRestart, setAnimationRestart] =
    useState<AnimationRestart | null>(null);

  const [playOnContact, setPlayOnContact] = useState(false);

  const activeAudioRequestRef = useRef<RecorderAudioRequestId | null>(null);

  const animationCounterRef = useRef(0);

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
        onStopSequence();
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
      onStopSequence,
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
      onStopSequence();
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
    [beginAudioRequest, getReplayStart, requestAnimation, setStepMode, stopAudio, onStopSequence],
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
  const cancelAudio = useCallback(() => { stopAudio(); activeAudioRequestRef.current = null; setPlayOnContact(false); }, [stopAudio]);
  const prepareReset = useCallback(() => {
    cancelAudio(); onStopSequence();
    setTransitionOrigin({ note: selectedNote, system, closedHoles: getVisualClosedHoles() });
    setAudioMuted(DEFAULT_PREFERENCES.isMuted); requestAnimation();
  }, [cancelAudio, onStopSequence, selectedNote, system, getVisualClosedHoles, setAudioMuted, requestAnimation]);
  const restoreSelection = useCallback((snapshot: ClassroomSnapshot) => {
    cancelAudio(); onStopSequence();
    setTransitionOrigin({ note: selectedNote, system, closedHoles: getVisualClosedHoles() });
    setSelectedNote(snapshot.note); setActiveBank(snapshot.bank);
    updatePreferences({ fingeringSystem: snapshot.system, speed: snapshot.speed, stepMode: snapshot.stepMode });
    requestAnimation();
  }, [cancelAudio, onStopSequence, selectedNote, system, getVisualClosedHoles, updatePreferences, requestAnimation]);
  return { selectedNote, setSelectedNote, activeBank, setActiveBank, transitionOrigin, animationKey, system, currentNote, currentShortcutLabel, displayAnimation, displayedHoleStates, selectNote, playCurrentNote, replay, changeSystem, chooseOnboardingSystem, changeMuted, changeStepMode, currentIndex, goPrevious, goNext, instruction, liveMessage, cancelAudio, prepareReset, setStepMode, restoreSelection };
}
