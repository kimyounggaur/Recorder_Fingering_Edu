interface PlaybackControlsProps {
  sequencePlaying: boolean;
  sequencePaused: boolean;
  sequencePosition: number;
  onPrevious: () => void;
  onNext: () => void;
  onReplay: () => void;
  onPlaySound: () => void;
  onSequenceToggle: () => void;
  onSequenceReset: () => void;
}

export function PlaybackControls({
  sequencePlaying,
  sequencePaused,
  sequencePosition,
  onPrevious,
  onNext,
  onReplay,
  onPlaySound,
  onSequenceToggle,
  onSequenceReset,
}: PlaybackControlsProps) {
  return (
    <section className="card playback-card" aria-label="학습 이동과 자동 연습">
      <div className="playback-primary">
        <button type="button" className="secondary-button" onClick={onPrevious} aria-label="이전 음">
          ← 이전
        </button>
        <button type="button" className="secondary-button" onClick={onReplay}>
          ↻ 다시 보기
        </button>
        <button type="button" className="primary-button" onClick={onPlaySound}>
          ♪ 음 재생
        </button>
        <button type="button" className="secondary-button" onClick={onNext} aria-label="다음 음">
          다음 →
        </button>
      </div>
      <div className="sequence-controls">
        <div>
          <p className="eyebrow">자동 순서 연습</p>
          <p>
            도부터 높은 도까지 · {sequencePosition >= 0
              ? `${sequencePosition + 1}/8`
              : "기본 음계 8음"}
          </p>
        </div>
        <div className="sequence-buttons">
          <button type="button" className="text-button" onClick={onSequenceReset}>
            처음으로
          </button>
          <button type="button" className="secondary-button" onClick={onSequenceToggle}>
            {sequencePlaying
              ? "일시정지"
              : sequencePaused
                ? "이어서 연습"
                : "순서 연습 시작"}
          </button>
        </div>
      </div>
    </section>
  );
}
