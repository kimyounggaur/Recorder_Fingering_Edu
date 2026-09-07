"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { ALL_NOTE_IDS, NOTE_BANKS } from "../recorder/data/noteMeta";
import { LessonPageShell } from "../recorder/components/LessonPageShell";
import { SegmentedControl } from "../recorder/components/SegmentedControl";
import { useActivityAudio } from "../recorder/hooks/useActivityAudio";
import type { NoteBank } from "../recorder/model/types";
import { QuizRound } from "./QuizRound";

export function QuizApp() {
  const { preferences, loaded, audio, reducedMotion } = useActivityAudio();
  const [kind, setKind] = useState<"identify" | "build">("identify");
  const [range, setRange] = useState<NoteBank | "all">("low");
  const [run, setRun] = useState<number | null>(null);
  const pool = range === "all" ? ALL_NOTE_IDS : NOTE_BANKS[range].map(entry => entry.note);
  return <LessonPageShell title="운지 퀴즈">
    {run === null ? <section className="quiz-setup" aria-label="퀴즈 선택">
      <SegmentedControl legend="퀴즈 종류" name="quiz-kind" value={kind} onChange={setKind} disabled={!loaded} options={[
        { value: "identify", label: "운지 보고 계이름 맞히기" }, { value: "build", label: "계이름 보고 구멍 막기" },
      ]} />
      <SegmentedControl legend="출제 범위" name="quiz-range" value={range} onChange={setRange} disabled={!loaded} options={[
        { value: "low", label: "낮은 음" }, { value: "high", label: "높은 음" }, { value: "chromatic", label: "반음" }, { value: "all", label: "전체" },
      ]} />
      <p className="quiz-system">{preferences.fingeringSystem === "baroque" ? "바로크식" : "독일식"} · 10문제</p>
      <button className="primary-button" type="button" disabled={!loaded} onClick={() => { void audio.unlock(); setRun(0); }}><Play size={18} />퀴즈 시작</button>
    </section> : <QuizRound key={run} kind={kind} pool={pool} system={preferences.fingeringSystem} muted={preferences.isMuted}
      reducedMotion={reducedMotion} audio={audio} onRetry={() => setRun(run + 1)} onSetup={() => setRun(null)} />}
  </LessonPageShell>;
}
