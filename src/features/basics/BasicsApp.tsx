"use client";

import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle, Pause, Play, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { LessonPageShell } from "../recorder/components/LessonPageShell";
import { RecorderFingeringMap } from "../recorder/components/RecorderFingeringMap";
import { SegmentedControl } from "../recorder/components/SegmentedControl";
import { useActivityAudio } from "../recorder/hooks/useActivityAudio";
import type { UseRecorderAudioResult } from "../recorder/audio/useRecorderAudio";
import { BASICS_COPY, BASICS_TITLES } from "./content";
import { FingerIllustration, MouthIllustration, PostureIllustration } from "./BasicsIllustration";
import { useTonguing } from "./useTonguing";

function CopyList({ lines }: { lines: readonly string[] }) { return <ul className="basics-copy">{lines.map(line => <li key={line}>{line}</li>)}</ul>; }
function TonguingPractice({ audio, muted, reducedMotion }: { audio: UseRecorderAudioResult; muted: boolean; reducedMotion: boolean }) {
  const { playing, beat, toggle } = useTonguing(audio, muted);
  return <div className="tonguing-practice" data-reduced-motion={reducedMotion}>
    <div className="tonguing-beats" aria-hidden="true">{[0, 1, 2, 3].map(index => <span key={index} data-active={playing && beat === index}>두<span className="beat-dash"> - </span></span>)}</div>
    <p className="sr-only" aria-live="polite">{playing ? `${beat + 1}박, 두` : "텅잉 정지"}</p>
    <button type="button" className="primary-button" onClick={toggle}>{playing ? <Pause size={20} /> : <Play size={20} />}{playing ? "정지" : "따라해 보기"}</button>
  </div>;
}
export function BasicsApp() {
  const { preferences, loaded, audio, reducedMotion } = useActivityAudio();
  const [index, setIndex] = useState(0);
  const [posture, setPosture] = useState<"sitting" | "standing">("sitting");
  const touch = useRef<{ x: number; y: number } | null>(null);
  const move = (delta: number) => setIndex(current => (current + delta + 5) % 5);
  return <LessonPageShell title="기초 배우기">
    <div className="basics-progress"><span aria-live="polite">{index + 1}/5 · {BASICS_TITLES[index]}</span><div className="slide-dots" aria-label="기초 카드 선택">
      {BASICS_TITLES.map((title, position) => <button type="button" key={title} aria-label={`${position + 1}/5 ${title}`} aria-current={index === position ? "step" : undefined} onClick={() => setIndex(position)} disabled={!loaded}><span /></button>)}
    </div></div>
    <section className="basics-slide" aria-labelledby="basics-slide-title" onTouchStart={event => { touch.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }; }}
      onTouchEnd={event => { if (!touch.current || !loaded) return; const dx = event.changedTouches[0].clientX - touch.current.x; const dy = event.changedTouches[0].clientY - touch.current.y; if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? 1 : -1); touch.current = null; }}>
      <h2 id="basics-slide-title">{BASICS_TITLES[index]}</h2>
      {index === 0 ? <><SegmentedControl legend="자세" name="posture" value={posture} onChange={setPosture} disabled={!loaded} options={[{ value: "sitting", label: "앉아서" }, { value: "standing", label: "서서" }]} />
        <div className="basics-content"><PostureIllustration standing={posture === "standing"} /><CopyList lines={BASICS_COPY[posture]} /></div></> : null}
      {index === 1 ? <><p className="basics-emphasis">{BASICS_COPY.grip[0]}</p><div className="basics-content"><div className="basics-grip-map"><RecorderFingeringMap handColors title="왼손과 오른손의 구멍 위치" /><div className="hand-color-legend"><span>○ 왼손 0·1·2·3</span><span>○ 오른손 4·5·6·7</span></div></div><CopyList lines={BASICS_COPY.grip.slice(1)} /></div></> : null}
      {index === 2 ? <><div className="mouth-examples"><div><h3><CheckCircle size={22} />이렇게 해요 ○</h3><MouthIllustration /></div><div><h3><TriangleAlert size={22} />주의해요 △</h3><MouthIllustration caution /><p>이로 깨물기 · 너무 깊게 물기 · 입술에 힘주기</p></div></div><CopyList lines={BASICS_COPY.embouchure} /></> : null}
      {index === 3 ? <><CopyList lines={BASICS_COPY.tonguing} />{loaded ? <TonguingPractice audio={audio} muted={preferences.isMuted} reducedMotion={reducedMotion} /> : null}</> : null}
      {index === 4 ? <><div className="basics-content"><FingerIllustration /><CopyList lines={BASICS_COPY.fingers} /></div><Link className="primary-button" href="/">운지 배우러 가기<ArrowRight size={20} /></Link></> : null}
    </section>
    <nav className="basics-navigation" aria-label="카드 이동"><button type="button" className="secondary-button" disabled={!loaded} onClick={() => move(-1)} aria-label="이전 카드" title="이전 카드"><ArrowLeft size={20} /></button><span>{index + 1}/5</span><button type="button" className="primary-button" disabled={!loaded} onClick={() => move(1)} aria-label="다음 카드" title="다음 카드"><ArrowRight size={20} /></button></nav>
  </LessonPageShell>;
}
