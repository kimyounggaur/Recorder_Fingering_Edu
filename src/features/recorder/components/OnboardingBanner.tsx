import type { FingeringSystem } from "../model/types";

interface OnboardingBannerProps {
  onChoose: (system: FingeringSystem) => void;
}

export function OnboardingBanner({ onChoose }: OnboardingBannerProps) {
  return (
    <section className="onboarding-banner" aria-labelledby="onboarding-heading">
      <div>
        <p className="eyebrow">처음 한 번만 골라요</p>
        <h2 id="onboarding-heading">내 리코더의 운지 체계는 무엇인가요?</h2>
        <p>두 체계는 파 음의 손가락 모양만 달라요. 나중에 설정에서 언제든 바꿀 수 있어요.</p>
      </div>
      <div className="onboarding-actions">
        <button type="button" className="choice-button" onClick={() => onChoose("baroque")}>
          <strong>바로크식</strong>
          <span>4번 구멍 아래에 작은 구멍이 있어요</span>
        </button>
        <button type="button" className="choice-button" onClick={() => onChoose("german")}>
          <strong>독일식</strong>
          <span>파 운지가 더 단순해요</span>
        </button>
      </div>
    </section>
  );
}
