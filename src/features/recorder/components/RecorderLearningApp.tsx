"use client";
import { useCallback, useState, type ComponentProps } from "react";
import { useRecorderLesson } from "../hooks/useRecorderLesson";
import { AudioDebugDemo } from "./AudioDebugDemo";
import { FingeringLegend } from "./FingeringLegend";
import { HelpDialog } from "./HelpDialog";
import { InstructionPanel } from "./InstructionPanel";
import { NoteCard } from "./NoteCard";
import { StaffNote } from "./StaffNote";
import { NoteKeypad } from "./NoteKeypad";
import { OnboardingBanner } from "./OnboardingBanner";
import { CoursePanel } from "./CoursePanel";
import { RecorderScene } from "./RecorderScene";
import { AdvancedSettingsPanel, SettingsPanel } from "./SettingsPanel";
import { TeacherToolbar, type TeacherPanel } from "./TeacherToolbar";
import { TeacherDialog } from "./TeacherDialog";
import { useStageFullscreen } from "../hooks/useStageFullscreen";
import { ClassroomControls } from "./ClassroomControls";
export function RecorderLearningApp() {
  const stageFullscreen = useStageFullscreen();
  const [panel, setPanel] = useState<TeacherPanel | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const lesson = useRecorderLesson(panel !== null || menuOpen, stageFullscreen.active, stageFullscreen.toggle);
  const { preferences, preferencesLoaded, updatePreferences, resetPreferences, reducedMotion, audio, statusMessage, helpOpen, setHelpOpen, closeHelp, debug, classroom, stepMode, showFingerNames, setShowFingerNames, selectedNote, activeBank, setActiveBank, transitionOrigin, animationKey, system, currentNote, currentShortcutLabel, displayAnimation, displayedHoleStates, selectNote, playCurrentNote, replay, changeSystem, chooseOnboardingSystem, changeMuted, changeStepMode, goPrevious, goNext, instruction, liveMessage, coursePractice } = lesson;
  const closePanel = useCallback(() => setPanel(null), []);
  const openPanel = (nextPanel: TeacherPanel) => {
    if (nextPanel.startsWith("notes-")) {
      const bank = nextPanel === "notes-high" ? "high" : nextPanel === "notes-chromatic" ? "chromatic" : "low";
      setActiveBank(bank);
    }
    setPanel(nextPanel);
  };
  const settingsProps: ComponentProps<typeof SettingsPanel> = {
    theme: preferences.theme,
    onThemeChange: (theme) => updatePreferences({ theme }),
    system,
    speed: preferences.speed,
    stepMode,
    muted: preferences.isMuted,
    showHoleNumbers: preferences.showHoleNumbers,
    showFingerNames,
    onSystemChange: changeSystem,
    pitchMode: preferences.pitchMode,
    onPitchModeChange: (pitchMode) => updatePreferences({ pitchMode }),
    onSpeedChange: (speed) => updatePreferences({ speed, courseIntervalMs: speed === "slow" ? 2000 : 1500 }),
    onStepModeChange: changeStepMode,
    onMutedChange: changeMuted,
    onShowHoleNumbersChange: (showHoleNumbers) => updatePreferences({ showHoleNumbers }),
    onShowFingerNamesChange: setShowFingerNames,
    onReplay: replay,
    onReset: resetPreferences,
  };
  const panelTitle = panel?.startsWith("notes-") ? "음 선택"
    : panel === "courses" ? "연습 코스"
    : panel === "instructions" ? "손가락 안내"
    : panel === "display" ? "화면·소리 설정"
    : "리코더 체계 안내";

  if (!preferencesLoaded) {
    return (
      <div className="recorder-app loading-shell" aria-busy="true" aria-live="polite">
        <div className="loading-mark" aria-hidden="true">♪</div>
        <p>리코더 교실을 준비하고 있어요…</p>
      </div>
    );
  }

  const showFingerChanges = displayAnimation.phase !== "settled"
    && (displayAnimation.diff.toOpen.length > 0 || displayAnimation.diff.toClose.length > 0);

  return (
    <div
      className="recorder-app"
      data-classroom={classroom.active || undefined}
      data-theme={preferences.theme}
      data-reduced-motion={reducedMotion}
      data-speed={preferences.speed}
      data-animation-preparing={displayAnimation.isPreparing}
      onContextMenu={(event) => event.preventDefault()}
      onDragStart={(event) => event.preventDefault()}
    >
      <a className="skip-link" href="#learning-stage">학습 무대로 건너뛰기</a>
      <header className="app-header teacher-header" hidden={classroom.active}>
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">♪</span>
          <div>
            <p className="eyebrow">선생님을 위한 리코더 교실</p>
            <h1>리코더 운지법 배우기</h1>
          </div>
        </div>
        <TeacherToolbar
          onOpenPanel={openPanel}
          onClassroom={classroom.toggle}
          onHelp={() => setHelpOpen(true)}
          onOpenChange={setMenuOpen}
        />
      </header>

      <main id="learning-stage" className="learning-grid">
        <section ref={stageFullscreen.stageRef} className="card scene-card" data-stage-fullscreen={stageFullscreen.active || undefined} data-fullscreen-fallback={stageFullscreen.fallback || undefined} aria-labelledby="scene-heading">
          <div className="section-heading-row scene-heading" hidden={classroom.active}>
            <div className="scene-heading__title">
              <p className="eyebrow">앞면 1–7 · 뒷면 엄지 0</p>
              <h2 id="scene-heading">손가락 학습 무대</h2>
            </div>
            <div className="scene-heading__legend">
              <FingeringLegend />
            </div>
            <div className="scene-heading__status">
              {!classroom.active && <button ref={stageFullscreen.buttonRef} type="button" className="secondary-button stage-fullscreen-button" title="단축키: 0" onClick={stageFullscreen.toggle} aria-pressed={stageFullscreen.active}>{stageFullscreen.active ? "전체화면 종료" : "전체화면"}</button>}
              {!showFingerChanges ? (
                <p className="scene-match-status">손 모양과 구멍 지도가 일치했어요.</p>
              ) : null}
              <div className="scene-status">
                <span className="scene-status-dot" data-phase={displayAnimation.phase} />
                {displayAnimation.phase === "settled" ? "운지 완성" : stepMode ? displayAnimation.stepLabel : "손가락 이동 중"}
              </div>
            </div>
          </div>
          <div className="recorder-stage-frame">
            {stageFullscreen.active && (
              <aside className="fullscreen-note" aria-label="현재 음 정보" aria-live="polite">
                <div className="fullscreen-note__text">
                  <strong className="fullscreen-note__solfege">{currentNote.solfegeKo}</strong>
                  <p>음 이름 {currentNote.noteName}</p>
                  <p>실제 소리 {currentNote.soundingPitch}</p>
                </div>
                <StaffNote step={currentNote.staffStep} label={currentNote.solfegeKo} accidental={currentNote.accidental} enharmonicLabel={currentNote.accidental ? currentNote.solfegeKo.replace(" / ", " = ") : undefined} />
                <p className="fullscreen-note__instruction">{currentNote.shortInstruction}</p>
              </aside>
            )}
            <RecorderScene
              bank={activeBank}
              className="recorder-scene"
              classroom={classroom.active}
              compact={classroom.active}
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
              showHoleNumbers={classroom.active || preferences.showHoleNumbers}
              showFingerNames={!classroom.active && showFingerNames}
              reducedMotion={reducedMotion}
              debug={debug}
              title={`${currentNote.solfegeKo}의 현재 리코더 운지`}
              description={liveMessage}
            />
          </div>
        </section>

        <div className="settings-area" hidden={classroom.active}>
          <SettingsPanel {...settingsProps}>
            <NoteCard
              embedded
              note={currentNote}
              system={system}
              onPlay={playCurrentNote}
              muted={preferences.isMuted}
              shortcutLabel={currentShortcutLabel}
            />
          </SettingsPanel>
        </div>
        {classroom.active ? <ClassroomControls lesson={lesson} /> : null}
      </main>
      <TeacherDialog open={panel !== null} title={panelTitle} onClose={closePanel}>
        {panel?.startsWith("notes-") ? (
          <NoteKeypad
            selectedNote={selectedNote}
            activeBank={activeBank}
            onBankChange={setActiveBank}
            onSelect={(note, bank) => selectNote(note, { bank })}
          />
        ) : null}
        {panel === "courses" ? (
          <CoursePanel
            practice={coursePractice}
            activeBank={activeBank}
            reducedMotion={reducedMotion}
            update={updatePreferences}
            onPrevious={goPrevious}
            onNext={goNext}
            onReplay={replay}
            onPlaySound={playCurrentNote}
          />
        ) : null}
        {panel === "instructions" ? (
          <InstructionPanel
            handHint={coursePractice.sequencePlaying || coursePractice.sequencePaused ? coursePractice.course.handHint : undefined}
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
        ) : null}
        {panel === "display" ? <AdvancedSettingsPanel {...settingsProps} /> : null}
        {panel === "onboarding" ? (
          <OnboardingBanner onChoose={(value) => { chooseOnboardingSystem(value); closePanel(); }} />
        ) : null}
      </TeacherDialog>
      {classroom.active ? <p className="classroom-hints">1–8 음 · ←→ 이전/다음 · Space 소리 · S 느리게 · M 소리 켜기/끄기 · C 코스 · Esc 나가기</p> : null}

      <p className="sr-only" aria-live="polite" aria-atomic="true" data-testid="live-region">
        {liveMessage}
      </p>
      <HelpDialog open={helpOpen} onClose={closeHelp} />
      <p className="sr-only" role="status">{statusMessage}</p>
      {debug ? (
        <aside className="debug-panel" aria-label="개발용 상태 정보">
          <strong>DEBUG</strong>
          <AudioDebugDemo key={animationKey} audio={audio} />
          <span>{selectedNote} / {system}</span>
          <span>{displayAnimation.phase}</span>
          <span>{displayAnimation.visualClosedHoles.join(" ")}</span>
        </aside>
      ) : null}
    </div>
  );
}
