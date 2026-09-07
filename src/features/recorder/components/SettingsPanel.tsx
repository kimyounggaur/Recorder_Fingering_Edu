import type { FingeringSystem } from "../model/types";
import type { AnimationSpeed } from "../animation/motionTimings";
import { SegmentedControl } from "./SegmentedControl";
import { ToggleRow } from "./ToggleRow";

interface SettingsPanelProps {
  system: FingeringSystem;
  speed: AnimationSpeed;
  stepMode: boolean;
  muted: boolean;
  showHoleNumbers: boolean;
  showFingerNames: boolean;
  onSystemChange: (system: FingeringSystem) => void;
  onSpeedChange: (speed: AnimationSpeed) => void;
  onStepModeChange: (enabled: boolean) => void;
  onMutedChange: (muted: boolean) => void;
  onShowHoleNumbersChange: (enabled: boolean) => void;
  onShowFingerNamesChange: (enabled: boolean) => void;
  onReplay: () => void;
}

export function SettingsPanel(props: SettingsPanelProps) {
  return (
    <section className="card settings-card" aria-labelledby="settings-heading">
      <div className="section-heading-row compact">
        <div>
          <p className="eyebrow">내가 보기 편하게</p>
          <h2 id="settings-heading">학습 설정</h2>
        </div>
        <button type="button" className="text-button" onClick={props.onReplay}>
          다시 보기
        </button>
      </div>

      <SegmentedControl
        legend="운지 체계"
        name="fingering-system"
        value={props.system}
        onChange={props.onSystemChange}
        options={[
          { value: "baroque", label: "바로크식", description: "파: 5번 열기" },
          { value: "german", label: "독일식", description: "파: 5·6·7번 열기" },
        ]}
      />

      <SegmentedControl
        legend="보기 속도"
        name="animation-speed"
        value={props.speed}
        onChange={props.onSpeedChange}
        options={[
          { value: "normal", label: "보통" },
          { value: "slow", label: "느리게" },
        ]}
      />

      <div className="toggle-list">
        <ToggleRow
          label="단계별 보기"
          description="다음 단계 버튼으로 천천히 살펴봐요."
          checked={props.stepMode}
          onChange={props.onStepModeChange}
          testId="step-mode-toggle"
        />
        <ToggleRow
          label="소리"
          description={props.muted ? "현재 음소거 중이에요." : "손가락이 닿을 때 음을 들어요."}
          checked={!props.muted}
          onChange={(checked) => props.onMutedChange(!checked)}
          testId="sound-toggle"
        />
        <ToggleRow
          label="구멍 번호"
          description="리코더의 0–7번을 표시해요."
          checked={props.showHoleNumbers}
          onChange={props.onShowHoleNumbersChange}
        />
        <ToggleRow
          label="손가락 이름"
          description="엄지, 검지처럼 이름을 표시해요."
          checked={props.showFingerNames}
          onChange={props.onShowFingerNamesChange}
        />
      </div>
    </section>
  );
}
