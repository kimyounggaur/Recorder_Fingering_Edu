import { ArrowLeft, ArrowRight, Check, Pause, Play, RotateCcw, Star, Volume2 } from "lucide-react";
import { useRef } from "react";
import { NOTE_META } from "../data/noteMeta";
import { PRACTICE_COURSES } from "../data/practiceCourses";
import type { useSequencePractice } from "../hooks/useSequencePractice";
import type { NoteBank } from "../model/types";
import type { RecorderPreferences } from "../utils/storage";

export function CoursePanel({ practice, activeBank, reducedMotion, update, onPrevious, onNext, onReplay, onPlaySound }: {
  practice: ReturnType<typeof useSequencePractice>; activeBank: NoteBank; reducedMotion: boolean;
  update: (patch: Partial<RecorderPreferences>) => void;
  onPrevious: () => void; onNext: () => void; onReplay: () => void; onPlaySound: () => void;
}) {
  const { course, index, completed, sequencePlaying, sequencePaused, mode, intervalMs } = practice;
  const choices = useRef<HTMLDivElement>(null);
  return (
    <section className="course-panel" aria-labelledby="course-heading" data-testid="course-panel">
      <div className="playback-primary">
        <button type="button" className="secondary-button" onClick={onPrevious} aria-label="이전 음" title="이전 음"><ArrowLeft size={20} /></button>
        <button type="button" className="secondary-button" onClick={onReplay} aria-label="다시 보기" title="다시 보기"><RotateCcw size={20} /></button>
        <button type="button" className="primary-button" onClick={onPlaySound}><Volume2 size={20} />음 재생</button>
        <button type="button" className="secondary-button" onClick={onNext} aria-label="다음 음" title="다음 음"><ArrowRight size={20} /></button>
      </div>
      <h2 id="course-heading">연습 코스</h2>
      <div className="course-choices" ref={choices}>
        {PRACTICE_COURSES.map(item => (
          <button type="button" className="course-choice" key={item.id} aria-pressed={course.id === item.id}
            data-testid={`course-${item.id}`} onClick={() => practice.selectCourse(item.id)}>
            <span className="course-choice-title">{item.titleKo}{course.id === item.id ? <Check size={18} aria-hidden="true" /> : null}</span>
            <span>{item.steps.length}음 · {NOTE_META[item.steps[0]].solfegeKo} ~ {NOTE_META[item.steps.at(-1)!].solfegeKo}</span>
            {item.id === ({ low: "lowScale", high: "highScale", chromatic: "chromatic" })[activeBank] ? <small>현재 음역 추천</small> : null}
          </button>
        ))}
      </div>
      <div className="course-options">
        <label className="toggle-row"><span>수동 진행</span><input type="checkbox" role="switch" checked={mode === "manual"}
          onChange={event => update({ courseMode: event.target.checked ? "manual" : "auto" })} /></label>
        <label className="course-interval">음 사이 간격 <span>{(intervalMs / 1000).toFixed(1)}초</span>
          <input type="range" min={1200} max={3000} step={100} value={intervalMs} aria-valuetext={`${(intervalMs / 1000).toFixed(1)}초`}
            disabled={mode === "manual"} onChange={event => update({ courseIntervalMs: Number(event.target.value) })} />
        </label>
        <button type="button" className="text-button" onClick={practice.resetSequence}><RotateCcw size={18} />처음으로</button>
        <button type="button" className="primary-button" onClick={practice.toggleSequence}>
          {sequencePlaying ? <Pause size={18} /> : <Play size={18} />}
          {sequencePlaying ? "일시정지" : sequencePaused ? "이어서 연습" : "순서 연습 시작"}
        </button>
        {mode === "manual" && sequencePlaying ? <button type="button" className="primary-button" onClick={practice.advance}>다 했어요! 다음<ArrowRight size={18} /></button> : null}
      </div>
      <div className="course-progress" role="progressbar" aria-label={`${course.titleKo} 진행`} aria-valuemin={0}
        aria-valuemax={course.steps.length} aria-valuenow={completed ? course.steps.length : index + 1}>
        <span style={{ width: `${(index + 1) / course.steps.length * 100}%` }} />
      </div>
      <p className="course-position">{index + 1}/{course.steps.length} · {NOTE_META[course.steps[index]].solfegeKo}</p>
      {completed ? <div className="course-completion" aria-live="polite" data-reduced-motion={reducedMotion}>
        <div className="completion-stars" aria-label="별 세 개">{[0, 1, 2].map(value => <Star key={value} size={32} aria-hidden="true" style={{ animationDelay: `${value * 300}ms` }} />)}</div>
        <h3>{course.titleKo}{course.titleKo.endsWith("코스") ? "" : " 코스"} 완주!</h3>
        <button type="button" className="secondary-button" onClick={() => { practice.stopSequence(); choices.current?.querySelector("button")?.focus(); }}>다른 코스</button>
        <button type="button" className="primary-button" onClick={practice.toggleSequence}>한 번 더</button>
      </div> : null}
    </section>
  );
}
