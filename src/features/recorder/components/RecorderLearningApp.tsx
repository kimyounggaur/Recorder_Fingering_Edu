"use client";
import { BookOpen, CircleHelp, ClipboardCheck, Maximize } from "lucide-react";
import Link from "next/link";
import { useRecorderLesson } from "../hooks/useRecorderLesson";
import { AudioDebugDemo } from "./AudioDebugDemo";
import { FingeringLegend } from "./FingeringLegend";
import { HelpDialog } from "./HelpDialog";
import { InstructionPanel } from "./InstructionPanel";
import { NoteCard } from "./NoteCard";
import { NoteKeypad } from "./NoteKeypad";
import { OnboardingBanner } from "./OnboardingBanner";
import { CoursePanel } from "./CoursePanel";
import { RecorderScene } from "./RecorderScene";
import { SettingsPanel } from "./SettingsPanel";
import { ClassroomControls } from "./ClassroomControls";
export function RecorderLearningApp() {
  const lesson = useRecorderLesson();
  const { preferences, preferencesLoaded, updatePreferences, resetPreferences, reducedMotion, audio, statusMessage, helpOpen, setHelpOpen, closeHelp, debug, classroom, stepMode, showFingerNames, setShowFingerNames, selectedNote, activeBank, setActiveBank, transitionOrigin, animationKey, system, currentNote, currentShortcutLabel, displayAnimation, displayedHoleStates, selectNote, playCurrentNote, replay, changeSystem, chooseOnboardingSystem, changeMuted, changeStepMode, goPrevious, goNext, instruction, liveMessage, coursePractice } = lesson;
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
      data-classroom={classroom.active || undefined}
      data-theme={preferences.theme}
      data-reduced-motion={reducedMotion}
      data-speed={preferences.speed}
      data-animation-preparing={displayAnimation.isPreparing}
      onContextMenu={(event) => event.preventDefault()}
      onDragStart={(event) => event.preventDefault()}
    >
      <a className="skip-link" href="#learning-stage">학습 무대로 건너뛰기</a>
      <header className="app-header" hidden={classroom.active}>
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">♪</span>
          <div>
            <p className="eyebrow">손가락이 움직이는 음악 교실</p>
            <h1>리코더 운지법 배우기</h1>
            <p>낮은 음·높은 음·반음을 고르고 손가락 움직임을 살펴보세요.</p>
          </div>
        </div>
        <div className="header-actions">
          <Link className="secondary-button" href="/quiz" aria-label="퀴즈" title="퀴즈"><ClipboardCheck size={20} aria-hidden="true" /><span className="button-label">퀴즈</span></Link>
          <Link className="secondary-button" href="/basics" aria-label="기초 배우기" title="기초 배우기"><BookOpen size={20} aria-hidden="true" /><span className="button-label">기초 배우기</span></Link>
          <button
            type="button"
            className="secondary-button"
            aria-label="도움말"
            onClick={() => setHelpOpen(true)}
          >
            <CircleHelp size={20} aria-hidden="true" /><span className="button-label">도움말</span>
          </button>
          <button type="button" className="secondary-button" onClick={classroom.toggle} aria-label="수업 모드" title="수업 모드">
            <Maximize size={20} aria-hidden="true" /><span className="button-label">수업 모드</span>
          </button>
        </div>
      </header>

      {!preferences.onboardingCompleted ? (
        <div hidden={classroom.active}><OnboardingBanner onChoose={chooseOnboardingSystem} /></div>
      ) : null}

      <main id="learning-stage" className="learning-grid">
        <div className="note-area" hidden={classroom.active}>
          <NoteCard
            note={currentNote}
            system={system}
            onPlay={playCurrentNote}
            muted={preferences.isMuted}
            shortcutLabel={currentShortcutLabel}
          />
        </div>

        <section className="card scene-card" aria-labelledby="scene-heading">
          <div className="section-heading-row scene-heading" hidden={classroom.active}>
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
          <div hidden={classroom.active}><FingeringLegend /></div>
        </section>

        <div className="instruction-area" hidden={classroom.active}>
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
        </div>

        <div className="keypad-area" hidden={classroom.active}>
          <NoteKeypad
            selectedNote={selectedNote}
            activeBank={activeBank}
            onBankChange={setActiveBank}
            onSelect={(note, bank) => selectNote(note, { bank })}
          />
        </div>

        <div className="settings-area" hidden={classroom.active}>
          <SettingsPanel
            theme={preferences.theme}
            onThemeChange={(theme) => updatePreferences({ theme })}
            system={system}
            speed={preferences.speed}
            stepMode={stepMode}
            muted={preferences.isMuted}
            showHoleNumbers={preferences.showHoleNumbers}
            showFingerNames={showFingerNames}
            onSystemChange={changeSystem}
            pitchMode={preferences.pitchMode}
            onPitchModeChange={(pitchMode) => updatePreferences({ pitchMode })}
            onSpeedChange={(speed) => updatePreferences({ speed, courseIntervalMs: speed === "slow" ? 2000 : 1500 })}
            onStepModeChange={changeStepMode}
            onMutedChange={changeMuted}
            onShowHoleNumbersChange={(showHoleNumbers) => updatePreferences({ showHoleNumbers })}
            onShowFingerNamesChange={setShowFingerNames}
            onReplay={replay}
            onReset={resetPreferences}
          />
        </div>
        {classroom.active ? <ClassroomControls lesson={lesson} /> : null}
      </main>
      <div hidden={classroom.active}>
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
      </div>

      <footer className="app-footer" hidden={classroom.active}>
        <p>입술에는 힘을 빼고, 구멍은 손가락 끝의 넓은 부분으로 가볍게 막아요.</p>
        <p>합성 연습음 · 로그인 없이 이 기기에 설정만 저장됩니다.</p>
      </footer>
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
