"use client";
import { CircleHelp, Maximize } from "lucide-react";
import { useRecorderLesson } from "../hooks/useRecorderLesson";
import { AudioDebugDemo } from "./AudioDebugDemo";
import { FingeringLegend } from "./FingeringLegend";
import { HelpDialog } from "./HelpDialog";
import { InstructionPanel } from "./InstructionPanel";
import { NoteCard } from "./NoteCard";
import { NoteKeypad } from "./NoteKeypad";
import { OnboardingBanner } from "./OnboardingBanner";
import { PlaybackControls } from "./PlaybackControls";
import { RecorderScene } from "./RecorderScene";
import { SettingsPanel } from "./SettingsPanel";
export function RecorderLearningApp() {
  const { preferences, preferencesLoaded, updatePreferences, resetPreferences, reducedMotion, audio, statusMessage, helpOpen, setHelpOpen, closeHelp, debug, toggleFullscreen, stepMode, showFingerNames, setShowFingerNames, selectedNote, activeBank, setActiveBank, transitionOrigin, animationKey, system, currentNote, currentShortcutLabel, displayAnimation, displayedHoleStates, selectNote, playCurrentNote, replay, changeSystem, chooseOnboardingSystem, changeMuted, changeStepMode, currentIndex, goPrevious, goNext, instruction, liveMessage, sequencePlaying, sequencePaused, toggleSequence, resetSequence } = useRecorderLesson();
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
            <CircleHelp size={20} aria-hidden="true" /><span className="button-label">도움말</span>
          </button>
          <button type="button" className="secondary-button" onClick={toggleFullscreen} aria-label="전체화면" title="전체화면">
            <Maximize size={20} aria-hidden="true" /><span className="button-label">전체화면</span>
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
            pitchMode={preferences.pitchMode}
            onPitchModeChange={(pitchMode) => updatePreferences({ pitchMode })}
            onSpeedChange={(speed) => updatePreferences({ speed })}
            onStepModeChange={changeStepMode}
            onMutedChange={changeMuted}
            onShowHoleNumbersChange={(showHoleNumbers) => updatePreferences({ showHoleNumbers })}
            onShowFingerNamesChange={setShowFingerNames}
            onReplay={replay}
            onReset={resetPreferences}
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
