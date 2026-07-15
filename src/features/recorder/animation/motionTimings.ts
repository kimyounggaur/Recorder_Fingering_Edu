export type AnimationSpeed = "normal" | "slow";

export interface MotionTimings {
  highlightRelease: number;
  release: number;
  highlightPress: number;
  press: number;
  contact: number;
  settle: number;
}

export const MOTION_TIMINGS: Record<AnimationSpeed, MotionTimings> = {
  normal: {
    highlightRelease: 60,
    release: 160,
    highlightPress: 20,
    press: 180,
    contact: 50,
    settle: 50,
  },
  slow: {
    highlightRelease: 150,
    release: 300,
    highlightPress: 100,
    press: 400,
    contact: 100,
    settle: 150,
  },
};

export const STEP_LABELS = [
  "음 이름 확인",
  "열 구멍 강조",
  "손가락 떼기",
  "막을 구멍 강조",
  "손가락 누르기",
  "완성 운지 확인",
  "음 재생",
] as const;
