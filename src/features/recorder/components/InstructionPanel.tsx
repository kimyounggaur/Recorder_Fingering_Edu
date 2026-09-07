import type { AnimationPhase, HoleId } from "../model/types";
import { FINGER_LABELS, HOLE_NUMBER_LABELS } from "../data/fingerings";

interface InstructionPanelProps {
  text: string;
  phase: AnimationPhase;
  toOpen: readonly HoleId[];
  toClose: readonly HoleId[];
  stepMode: boolean;
  stepIndex: number;
  stepCount: number;
  stepLabel: string;
  canAdvanceStep: boolean;
  onAdvanceStep: () => void;
}

function FingerChips({ holes, kind }: { holes: readonly HoleId[]; kind: "open" | "close" }) {
  if (!holes.length) return null;
  return (
    <div className={`finger-chip-row ${kind}`}>
      <span className="finger-chip-action">{kind === "open" ? "↑ 떼기" : "↓ 막기"}</span>
      {holes.map((hole) => (
        <span className="finger-chip" key={hole}>
          {HOLE_NUMBER_LABELS[hole]}번 · {FINGER_LABELS[hole]}
        </span>
      ))}
    </div>
  );
}

export function InstructionPanel({
  text,
  phase,
  toOpen,
  toClose,
  stepMode,
  stepIndex,
  stepCount,
  stepLabel,
  canAdvanceStep,
  onAdvanceStep,
}: InstructionPanelProps) {
  return (
    <section className="card instruction-card" aria-labelledby="instruction-heading">
      <div className="section-heading-row compact">
        <div>
          <p className="eyebrow">손가락 안내</p>
          <h2 id="instruction-heading">이렇게 잡아 보세요</h2>
        </div>
        <span className="phase-badge" data-phase={phase}>
          {stepMode ? `${stepIndex + 1}/${stepCount}` : phase === "settled" ? "완성" : "움직이는 중"}
        </span>
      </div>
      <p className="instruction-copy">{text}</p>
      <div className="finger-chips" aria-label="이번에 움직일 손가락">
        <FingerChips holes={toOpen} kind="open" />
        <FingerChips holes={toClose} kind="close" />
        {!toOpen.length && !toClose.length ? (
          <p className="steady-message">지금 자세를 그대로 유지해요.</p>
        ) : null}
      </div>
      {stepMode ? (
        <div className="step-controls">
          <p>
            <strong>이번 단계:</strong> {stepLabel}
          </p>
          <button
            type="button"
            className="primary-button"
            onClick={onAdvanceStep}
            disabled={!canAdvanceStep}
          >
            {canAdvanceStep ? "다음 단계" : "운지 완성"}
          </button>
        </div>
      ) : null}
    </section>
  );
}
