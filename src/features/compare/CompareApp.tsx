"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getFingeringDiff } from "../recorder/animation/getFingeringDiff";
import { ALL_HOLES, FINGERINGS, FINGERING_STATES, HOLE_NUMBER_LABELS } from "../recorder/data/fingerings";
import { ALL_NOTE_IDS, NOTE_META } from "../recorder/data/noteMeta";
import { getNoteBank } from "../recorder/data/practiceCourses";
import { LessonPageShell } from "../recorder/components/LessonPageShell";
import { RecorderScene } from "../recorder/components/RecorderScene";
import { SegmentedControl } from "../recorder/components/SegmentedControl";
import { useReducedMotion } from "../recorder/hooks/useReducedMotion";
import { getRequestedSelection } from "../recorder/hooks/usePreferences";
import { loadPreferences, savePreferences } from "../recorder/utils/storage";
import { describeFingeringForLive } from "../recorder/utils/liveMessage";
import { formatFingerNames } from "../recorder/utils/buildInstruction";
import type { FingeringSystem, SolfegeId } from "../recorder/model/types";

export const DIFFERENT_NOTES = ALL_NOTE_IDS.filter(note => ALL_HOLES.some(hole => FINGERING_STATES.baroque[note][hole] !== FINGERING_STATES.german[note][hole]));
export function CompareApp() {
  const [note, setNote] = useState<SolfegeId>("fa");
  const [ready, setReady] = useState(false);
  const reducedMotion = useReducedMotion();
  const router = useRouter();
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      const requested = getRequestedSelection(new URLSearchParams(window.location.search));
      if (cancelled) return;
      if (requested) setNote(requested.note);
      setReady(true);
    });
    return () => { cancelled = true; };
  }, []);
  const different = DIFFERENT_NOTES.includes(note);
  const diff = getFingeringDiff(FINGERINGS.baroque[note], FINGERINGS.german[note]);
  const diffCopy = [diff.toOpen.length ? `${diff.toOpen.map(id => HOLE_NUMBER_LABELS[id]).join("·")}번을 열어요 (${formatFingerNames(diff.toOpen)})` : "", diff.toClose.length ? `${diff.toClose.map(id => HOLE_NUMBER_LABELS[id]).join("·")}번을 막아요 (${formatFingerNames(diff.toClose)})` : ""].filter(Boolean).join(". ");
  const choose = (system: FingeringSystem) => {
    savePreferences({ ...loadPreferences(), fingeringSystem: system, onboardingCompleted: true });
    router.push(`/?note=${note}&bank=${getNoteBank(note)}`);
  };
  return <LessonPageShell title="운지 체계 비교">
    <SegmentedControl legend="비교할 음" name="compare-note" value={note} onChange={setNote} disabled={!ready}
      options={DIFFERENT_NOTES.map(id => ({ value: id, label: NOTE_META[id].solfegeKo }))} />
    <h2 className="compare-note-name">{NOTE_META[note].solfegeKo} · {NOTE_META[note].noteName}</h2>
    <p className="comparison-summary" aria-live="polite">{different ? `바로크식에서 독일식으로: ${diffCopy}` : "이 음은 두 방식이 같아요"}</p>
    <div className="comparison-grid" data-same={!different}>
      {(different ? ["german", "baroque"] as const : ["baroque"] as const).map(system => <section className="comparison-column" key={system} aria-label={system === "german" ? "독일식 운지" : "바로크식 운지"}>
        <h2>{different ? system === "german" ? "독일식" : "바로크식" : "두 체계 공통"}</h2>
        <RecorderScene note={note} system={system} readonly compact reducedMotion={reducedMotion}
          holeStates={FINGERING_STATES[system][note]} currentClosedHoles={FINGERINGS[system][note]} transitionKey={ALL_NOTE_IDS.indexOf(note)}
          title={`${system === "german" ? "독일식" : "바로크식"} ${NOTE_META[note].solfegeKo}`} />
        <p className="comparison-holes">{describeFingeringForLive(FINGERING_STATES[system][note])}</p>
      </section>)}
    </div>
    <section className="comparison-explanation" aria-label="체계 안내">
      <p>독일식: 파를 쉽게 불 수 있어 학교에서 많이 써요.</p>
      <p>바로크식: 반음(올림·내림) 연주에 유리하고 세계적으로 널리 써요.</p>
      <p>내 리코더 뒷면에 B(바로크)나 G(독일) 표시를 확인해 보세요!</p>
      <div className="comparison-actions">
        <button className="secondary-button" type="button" disabled={!ready} onClick={() => choose("german")} aria-label="독일식으로 배우기">독일식 · 이 체계로 배우기</button>
        <button className="primary-button" type="button" disabled={!ready} onClick={() => choose("baroque")} aria-label="바로크식으로 배우기">바로크식 · 이 체계로 배우기</button>
      </div>
    </section>
  </LessonPageShell>;
}
