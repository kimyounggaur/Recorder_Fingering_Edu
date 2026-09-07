import { ArrowLeft, ArrowRight, LogOut, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef } from "react";
import { NOTE_BANKS, NOTE_META } from "../data/noteMeta";
import type { useRecorderLesson } from "../hooks/useRecorderLesson";
import { StaffNote } from "./StaffNote";
import { SegmentedControl } from "./SegmentedControl";

export function ClassroomControls({ lesson }: { lesson: ReturnType<typeof useRecorderLesson> }) {
  const region = useRef<HTMLElement>(null);
  useEffect(() => { region.current?.focus(); }, []);
  const { currentNote, activeBank, setActiveBank, selectNote, selectedNote, preferences, coursePractice } = lesson;
  return <aside className="classroom-controls" ref={region} tabIndex={-1} aria-label="수업 모드 조작">
    <div className="classroom-topline"><span>{preferences.fingeringSystem === "baroque" ? "바로크식" : "독일식"}</span><button type="button" className="secondary-button" onClick={lesson.classroom.exit}><LogOut size={20} />나가기</button></div>
    <h2 className="classroom-solfege">{currentNote.solfegeKo}</h2>
    <p className="classroom-note-name">{currentNote.noteName} · 실음 {currentNote.soundingPitch}</p>
    <StaffNote step={currentNote.staffStep} label={currentNote.solfegeKo} accidental={currentNote.accidental} enharmonicLabel={currentNote.accidental ? currentNote.solfegeKo : undefined} />
    <SegmentedControl legend="음역" name="classroom-bank" value={activeBank} onChange={setActiveBank} options={[{ value: "low", label: "낮은 음" }, { value: "high", label: "높은 음" }, { value: "chromatic", label: "반음" }]} />
    <div className="classroom-digits" aria-label="수업 음 선택">{NOTE_BANKS[activeBank].map(entry => <button type="button" key={entry.note} aria-label={NOTE_META[entry.note].solfegeKo} aria-pressed={entry.note === selectedNote} onClick={() => selectNote(entry.note, { bank: activeBank })}>{entry.digit}</button>)}</div>
    <div className="classroom-actions">
      <button type="button" className="secondary-button" onClick={lesson.goPrevious} aria-label="이전 음" title="이전 음"><ArrowLeft size={24} /></button>
      <button type="button" className="primary-button" onClick={lesson.playCurrentNote} aria-label="음 재생" title="음 재생"><Volume2 size={24} /></button>
      <button type="button" className="secondary-button" onClick={lesson.goNext} aria-label="다음 음" title="다음 음"><ArrowRight size={24} /></button>
      <button type="button" className="secondary-button" onClick={lesson.toggleMuted} aria-label={preferences.isMuted ? "소리 켜기" : "음소거"} title={preferences.isMuted ? "소리 켜기" : "음소거"}>{preferences.isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}</button>
    </div>
    <div className="classroom-course"><button type="button" className="secondary-button" aria-pressed={preferences.speed === "slow"} onClick={lesson.toggleSpeed}>느리게</button><button type="button" className="primary-button" onClick={coursePractice.toggleSequence}>{coursePractice.sequencePlaying ? <Pause size={20} /> : <Play size={20} />}{coursePractice.course.titleKo}</button></div>
    <p>{coursePractice.sequencePlaying ? `${coursePractice.index + 1}/${coursePractice.course.steps.length}` : coursePractice.completed ? "코스 완주!" : ""}</p>
  </aside>;
}
