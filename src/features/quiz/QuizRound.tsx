import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Check, RotateCcw, Volume2 } from "lucide-react";
import Link from "next/link";
import { ALL_HOLES, FINGERING_STATES } from "../recorder/data/fingerings";
import { NOTE_META } from "../recorder/data/noteMeta";
import { getNoteBank } from "../recorder/data/practiceCourses";
import { getRecorderPoseSource } from "../recorder/data/poseAssets";
import { RecorderScene } from "../recorder/components/RecorderScene";
import { RecorderFingeringMap } from "../recorder/components/RecorderFingeringMap";
import { RecorderPoseStage } from "../recorder/components/RecorderPoseStage";
import { useCompletionCue } from "../recorder/hooks/useCompletionCue";
import { useShortTone } from "../recorder/hooks/useShortTone";
import type { UseRecorderAudioResult } from "../recorder/audio/useRecorderAudio";
import type { FingeringStateMap, FingeringSystem, HoleId, HoleState, SolfegeId } from "../recorder/model/types";
import { createQuestions, pickDistractors, scoreFingering, shuffle } from "./scoring";

const openHoles = () => Object.fromEntries(ALL_HOLES.map(hole => [hole, "open"])) as Record<HoleId, HoleState>;
interface Feedback { choice?: SolfegeId; detail?: ReturnType<typeof scoreFingering>; accepted: boolean; }
export function QuizRound({ kind, pool, system, muted, reducedMotion, audio, onRetry, onSetup }: {
  kind: "identify" | "build"; pool: readonly SolfegeId[]; system: FingeringSystem; muted: boolean;
  reducedMotion: boolean; audio: UseRecorderAudioResult; onRetry: () => void; onSetup: () => void;
}) {
  const [questions] = useState(() => createQuestions(pool).map(note => ({ note, options: shuffle([note, ...pickDistractors(note, pool, 3, system)]) })));
  const [index, setIndex] = useState(0);
  const [points, setPoints] = useState(0);
  const [mistakes, setMistakes] = useState<SolfegeId[]>([]);
  const [holes, setHoles] = useState(openHoles);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const locked = useRef(false);
  const optionsRef = useRef<Array<HTMLButtonElement | null>>([]);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const question = questions[Math.min(index, questions.length - 1)];
  const { play, stop } = useShortTone(audio);
  useCompletionCue(kind === "build" && feedback?.accepted === true, muted, audio);
  const submit = useCallback((choice?: SolfegeId) => {
    if (locked.current || index >= questions.length) return;
    locked.current = true;
    const detail = kind === "build" ? scoreFingering(holes as FingeringStateMap, question.note, system) : undefined;
    const accepted = detail ? detail.exact || detail.crossSystemMatch !== null : choice === question.note;
    setFeedback({ choice, detail, accepted });
    setPoints(score => score + (accepted ? 10 : detail ? detail.correctCount / 8 * 10 : 0));
    if (!accepted) setMistakes(current => current.includes(question.note) ? current : [...current, question.note]);
    if (!muted && !(kind === "build" && accepted)) play(NOTE_META[question.note].audioKey, 500);
  }, [holes, index, kind, muted, play, question, questions.length, system]);
  const next = useCallback(() => {
    if (!locked.current) return;
    stop(); setFeedback(null); setHoles(openHoles()); locked.current = false; setIndex(current => current + 1);
  }, [stop]);
  useEffect(() => {
    if (kind !== "identify" || !feedback) return;
    const timer = window.setTimeout(next, 1000);
    return () => window.clearTimeout(timer);
  }, [kind, feedback, next]);
  useEffect(() => { headingRef.current?.focus(); }, [index]);
  useEffect(() => {
    if (kind !== "identify" || feedback || index >= questions.length) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (event.target instanceof HTMLElement && (event.target.isContentEditable || ["INPUT", "SELECT", "TEXTAREA"].includes(event.target.tagName))) return;
      if (/^[1-4]$/.test(event.key)) { event.preventDefault(); submit(question.options[Number(event.key) - 1]); }
      if (["ArrowLeft", "ArrowUp", "ArrowRight", "ArrowDown"].includes(event.key)) {
        event.preventDefault();
        const current = optionsRef.current.indexOf(document.activeElement as HTMLButtonElement);
        const direction = event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1;
        optionsRef.current[(Math.max(0, current) + direction + 4) % 4]?.focus();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [feedback, index, kind, question.options, questions.length, submit]);

  if (index >= questions.length) return <section className="quiz-result" aria-labelledby="quiz-result-title">
    <h2 id="quiz-result-title" ref={headingRef} tabIndex={-1}>{points >= 90 ? "리코더 박사!" : points >= 70 ? "잘했어요!" : "조금만 더 연습해요!"}</h2>
    <p className="quiz-score">{Math.round(points)}점</p><p>10문제 완료</p>
    {mistakes.length ? <><h3>헷갈린 음</h3><ul className="quiz-review-list">{mistakes.map(note => <li key={note}><strong>{NOTE_META[note].solfegeKo}</strong><Link className="text-link" href={`/?note=${note}&bank=${getNoteBank(note)}`}>이 음 복습하기</Link></li>)}</ul></> : null}
    <div className="quiz-actions"><button type="button" className="primary-button" onClick={onRetry}><RotateCcw size={18} />다시 도전</button><button type="button" className="secondary-button" onClick={onSetup}>퀴즈 선택</button></div>
  </section>;
  const cross = feedback?.detail?.crossSystemMatch;
  return <section className="quiz-round" aria-label={kind === "identify" ? "계이름 맞히기" : "구멍 막기"}>
    <div className="quiz-progress"><h2 ref={headingRef} tabIndex={-1}>문제 {index + 1}/10</h2><span>{Math.round(points)}점 · {system === "baroque" ? "바로크식" : "독일식"}</span></div>
    <div className={`quiz-workspace quiz-workspace--${kind}`}>
      {kind === "identify" ? <RecorderScene note={question.note} system={system} readonly compact reducedMotion={reducedMotion}
        holeStates={FINGERING_STATES[system][question.note]} title="문제 운지" description="문제 운지" /> : <div className="quiz-build-stage">
        <div className="quiz-note-prompt"><h3>{NOTE_META[question.note].solfegeKo}</h3><button type="button" className="secondary-button" disabled={!!feedback}
          onClick={() => { if (!muted) play(NOTE_META[question.note].audioKey, 500); }}><Volume2 size={18} />들어보기</button></div>
        <RecorderFingeringMap interactive locked={!!feedback} holeStates={holes} showFingerNames={false} title="구멍을 막아 보세요"
          onHoleChange={(hole, state) => { if (!locked.current) setHoles(current => ({ ...current, [hole]: state })); }}
          feedback={feedback?.detail?.perHole} targetStates={FINGERING_STATES[system][question.note]} />
      </div>}
      <div className="quiz-answer-panel">
        {kind === "identify" ? <div className="quiz-options" aria-label="정답 보기">{question.options.map((note, position) => <button type="button" key={note}
          ref={element => { optionsRef.current[position] = element; }} className="quiz-option" disabled={!!feedback} data-testid={`quiz-option-${position + 1}`}
          data-result={feedback ? note === question.note ? "correct" : note === feedback.choice ? "wrong" : undefined : undefined} onClick={() => submit(note)}>
          <span className="quiz-option-number">{position + 1}</span><strong>{NOTE_META[note].solfegeKo}</strong>{feedback && note === question.note ? <Check size={22} aria-label="정답" /> : null}
        </button>)}</div> : <button type="button" className="primary-button" onClick={() => submit()} disabled={!!feedback}><Check size={20} />확인</button>}
        {feedback ? <div className="quiz-feedback" aria-live="polite" data-accepted={feedback.accepted}>
          {feedback.detail ? <p>8개 중 {feedback.detail.correctCount}개!</p> : null}
          <p>{cross ? `그건 ${cross === "german" ? "독일" : "바로크"}식 ${NOTE_META[question.note].solfegeKo}예요! 둘 다 맞아요` : feedback.accepted ? "딩동댕!" : `한 번 더 확인해요. 정답은 ${NOTE_META[question.note].solfegeKo}예요`}</p>
          {kind === "build" ? <><div className="quiz-correct-pose"><RecorderPoseStage source={getRecorderPoseSource(question.note, system)} transitionKey={index} duration={0} reducedMotion={reducedMotion} /></div>
            <button className="primary-button" type="button" onClick={next}>{index === 9 ? "결과 보기" : "다음 문제"}<ArrowRight size={18} /></button></> : null}
        </div> : null}
      </div>
    </div>
  </section>;
}
