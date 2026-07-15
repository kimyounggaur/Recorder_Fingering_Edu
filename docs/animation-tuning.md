# 애니메이션 튜닝 가이드

이 문서는 구멍 위치, 손가락 접촉 자세와 phase 타이밍을 실제 구현 파일 기준으로 조정하는 절차입니다. 튜닝할 때의 우선순위는 **운지 정확성 → 닫힌 패드 접촉 → 열린 자세의 가독성 → 움직임의 자연스러움**입니다.

## 반드시 지킬 불변 조건

1. 장면 좌표계는 `src/features/recorder/data/holeLayout.ts`의 `RECORDER_SCENE_VIEW_BOX`, 즉 `0 0 1000 1600`입니다.
2. 구멍 좌표는 `HOLE_LAYOUT`, 손가락 자세는 `FINGER_POSES`에서만 조정합니다. 음별 JSX나 완성 이미지를 만들지 않습니다.
3. 모든 `id`의 닫힌 패드 중심은 대응 구멍 중심과 정확히 같아야 합니다.

```ts
FINGER_POSES[id].closed.x === HOLE_LAYOUT[id].x;
FINGER_POSES[id].closed.y === HOLE_LAYOUT[id].y;
```

4. `T0`은 뒷면 엄지 인셋 좌표입니다. 앞면 리코더 몸통 중심으로 옮기지 않습니다.
5. `R6`, `R7`은 화면에서 두 개의 작은 구멍으로 보이지만 각각 하나의 `HoleId`, 상태, 손가락 패드 중심을 가집니다.
6. `open`, `closed` 외의 `half`, `partial` 자세는 미래 확장을 위해 유지하되 현재 기본 8음 운지에 임의로 연결하지 않습니다.
7. 빠른 연속 입력을 위해 `useFingeringAnimation`의 request ID 검사와 중앙 `schedule()`을 우회하는 타이머를 추가하지 않습니다.

## 좌표 데이터의 역할

### `HOLE_LAYOUT`

파일: `src/features/recorder/data/holeLayout.ts`

각 항목은 다음 값을 가집니다.

| 필드 | 의미 |
|---|---|
| `x`, `y` | 1000×1600 장면 안의 논리 구멍 중심 |
| `radius` | 논리 구멍의 기본 반지름 |
| `hand`, `finger` | 담당 손과 손가락 |
| `side` | 앞면 또는 뒷면 인셋 |
| `double` | R6/R7의 이중 구멍 여부 |
| `subHoleRadius`, `subHoleGap` | 이중 구멍의 작은 반지름과 중심 간격 |

`Hole`, 번호 라벨, 모션 효과, debug 십자가가 모두 이 좌표를 사용합니다. 실제 구멍 그림이 리코더 몸통과 어긋날 때 먼저 이 파일을 고칩니다.

### `FINGER_POSES`

파일: `src/features/recorder/data/fingerPoses.ts`

각 `HoleId`마다 `open`, `closed`, `half`, `partial` 자세가 있습니다.

| 필드 | 의미 |
|---|---|
| `x`, `y` | 손가락 패드 중심 |
| `rotate` | 패드를 중심으로 한 손가락 전체 회전(도) |
| `scaleX`, `scaleY` | 손가락 전체 비율 보정 |
| `opacity` | 자세별 투명도 |
| `proximalRotate` | 몸쪽 마디 회전 |
| `middleRotate` | 가운데 마디 회전 |
| `distalRotate` | 끝마디 회전 |

`getFingerPose(id, state)`가 이 데이터를 읽고 `Finger.tsx`가 다음 transform으로 렌더링합니다.

```text
translate(x y) rotate(rotate) scale(scaleX scaleY)
```

관절 회전은 손가락 윤곽을 자연스럽게 보정하지만 패드 중심 자체를 바꾸지 않습니다. 먼저 `x/y` 접촉을 맞춘 뒤 전체 회전, 관절 회전, 스케일 순서로 조정하는 편이 안전합니다.

### 손가락 기하

파일: `src/features/recorder/components/Finger.tsx`

`FINGER_GEOMETRY`는 엄지·검지·중지·약지·새끼손가락의 길이, 폭과 패드 반지름을 결정합니다. 특정 음의 접촉 위치가 아니라 모든 같은 종류 손가락의 형태에 영향을 주므로 좌표 튜닝만으로 해결되지 않을 때 마지막으로 조정합니다.

손바닥과 손목 실루엣은 `FingerLayer.tsx`, 리코더 몸통 실루엣은 `RecorderBody.tsx`에 있습니다. 이 경로는 데이터 좌표가 아니라 장면의 공통 그림을 바꿀 때만 수정합니다.

## debug overlay 사용

1. 개발 서버를 실행합니다.

```bash
npm run dev
```

2. 터미널에 표시된 주소에 `?debug=1`을 붙입니다.

```text
http://localhost:3000/?debug=1
```

3. 구멍 번호와 손가락 이름을 켜고 1번부터 8번까지 선택합니다.
4. 파에서는 바로크식과 독일식을 모두 확인합니다.
5. 느리게 보기와 단계별 보기를 사용해 열기·누르기 구간을 따로 관찰합니다.

오버레이 표시는 다음 뜻입니다.

| 표시 | 의미 |
|---|---|
| 초록 십자와 점 | `HOLE_LAYOUT[id].x/y` |
| 분홍 점 | 현재 자세의 `FINGER_POSES[id].x/y` |
| 파란 점선 상자 | 열린 패드 중심 주변 |
| 주황 점선 상자 | 닫힌 패드 중심 주변 |
| 보라 점선 | 열린 중심에서 닫힌 중심까지 이동 경로 |
| 오른쪽 위 패널 | 현재 phase와 닫힌 구멍 목록 |

닫힌 상태에서 초록 점과 분홍 점이 겹쳐야 합니다. 쿼리를 제거하고 새로 고치면 오버레이가 꺼집니다. 이 도구는 개발 빌드 전용이며 프로덕션 배포에서는 `debug=1` 쿼리로도 활성화되지 않습니다.

## 구멍 좌표를 옮기는 절차

예를 들어 `R5`가 리코더 그림에서 너무 아래에 있다면 다음 순서로 작업합니다.

1. `HOLE_LAYOUT.R5.x/y`를 새 구멍 중심으로 바꿉니다.
2. `FINGER_POSES.R5.closed.x/y`를 정확히 같은 값으로 바꿉니다.
3. `half`, `partial`이 새 열린↔닫힌 이동선 위에 있도록 다시 보간하거나 손으로 조정합니다.
4. `open` 자세가 손바닥과 자연스럽게 이어지면서 구멍을 확실히 드러내는지 확인합니다.
5. 번호 라벨, 강조 화살표, 손가락 패드가 같은 구멍을 가리키는지 debug 화면에서 확인합니다.
6. 다른 음에서 R5가 열린 상태와 닫힌 상태를 모두 확인합니다.

R6/R7의 두 작은 구멍 간격만 바꿀 때는 논리 중심 `x/y`를 유지하고 `subHoleGap` 또는 `subHoleRadius`를 조정합니다. 두 작은 원 중 하나에 패드 중심을 맞추면 논리 상태와 시각 중심이 어긋납니다.

## 열린 자세를 조정하는 절차

열린 자세는 담당 구멍이 충분히 보이면서 손가락이 손바닥에서 분리되어 보이지 않아야 합니다.

1. 왼손 앞면 손가락은 대체로 구멍의 왼쪽, 오른손 손가락은 오른쪽으로 이동합니다. T0은 인셋 안에서 위·오른쪽으로 듭니다.
2. `open.x/y`로 패드 이동 경로와 여유를 먼저 정합니다.
3. `rotate`로 손가락 전체 방향을 손바닥에 맞춥니다.
4. `proximalRotate`, `middleRotate`, `distalRotate`를 작은 값으로 조정해 관절 꺾임을 다듬습니다.
5. 필요할 때만 `scaleX/scaleY`를 사용합니다. 큰 스케일 변경은 손가락 두께와 패드 크기까지 바꿉니다.
6. 도→레처럼 한 손가락만 움직이는 전환과 시→높은 도처럼 동시에 열고 닫는 전환을 모두 확인합니다.

현재 자세는 열린 패드가 구멍 중심에서 약 82–97 SVG 단위 떨어지도록 조정되어 있습니다. 정확한 숫자 자체보다 작은 화면에서도 구멍이 가려지지 않는지가 중요합니다.

## 애니메이션 phase와 타이밍

파일: `src/features/recorder/animation/motionTimings.ts`

`MOTION_TIMINGS`의 단위는 밀리초입니다.

| 키 | 보통 | 느리게 | 역할 |
|---|---:|---:|---|
| `highlightRelease` | 60 | 150 | 떼야 할 손가락/구멍을 먼저 강조 |
| `release` | 160 | 300 | 손가락을 열린 자세로 이동 |
| `highlightPress` | 20 | 100 | 누를 손가락/구멍을 강조 |
| `press` | 180 | 400 | 손가락을 닫힌 자세로 이동 |
| `contact` | 50 | 100 | 목표 접촉과 음 재생 phase 유지 |
| `settle` | 50 | 150 | 강조가 안정 상태로 사라지는 여유 |

열기와 누르기가 모두 있는 전환은 보통 420ms에 contact에 도달하고 520ms에 안정됩니다. 느리게는 950ms에 contact, 1,200ms에 안정됩니다. 실제 전환은 diff에 없는 구간을 건너뛰므로 더 짧을 수 있습니다.

상태 머신은 다음 순서로 누적 시간을 계산합니다.

```text
[highlight-release] --highlightRelease-->
[releasing]         --release-->
[highlight-press]   --highlightPress-->
[pressing]          --press-->
[contact]           --contact + settle-->
[settled]
```

오디오의 `playAtContact()`는 최신 요청의 `contact`에서만 호출됩니다. 타이밍을 바꿀 때 `onContact`를 별도 타이머나 `Finger` 컴포넌트의 transition end에 추가하지 않습니다.

## JavaScript 시간과 CSS 시간 맞추기

손가락의 실제 transform transition 시간은 `app/globals.css`의 CSS 변수입니다.

```css
.recorder-app {
  --recorder-finger-duration: 180ms;
}

.recorder-app[data-speed="slow"] {
  --recorder-finger-duration: 400ms;
}
```

`Finger.tsx`는 이 값을 `transitionDuration`에 쓰고 easing은 `--recorder-finger-easing`이 없을 때 `cubic-bezier(.2,.8,.2,1)`을 사용합니다.

- `press`는 현재 CSS duration과 정확히 같은 180/400ms입니다.
- `release`는 160/300ms로 CSS보다 20/100ms 짧아 다음 강조가 약간 겹치도록 되어 있습니다.
- 실제 손가락 이동 시간을 바꿀 때는 `MOTION_TIMINGS.press/release`와 CSS 변수를 함께 검토합니다.
- 강조만 길게 보이게 하려면 `highlightRelease` 또는 `highlightPress`만 조정합니다.
- 접촉 후 소리가 너무 늦게 끝나는 느낌은 `contact/settle`과 오디오 envelope를 구분해서 조정합니다.
- easing을 공통 변경하려면 `.recorder-app`에 `--recorder-finger-easing`을 정의하는 방식이 가장 좁은 변경입니다.

운영체제가 reduced motion을 요청하면 훅은 목표 운지를 즉시 커밋하고 80ms 뒤 `settled`로 이동합니다. `Finger.tsx`의 자체 fallback은 60ms이며, 전역 media query가 animation/transition duration을 `0.01ms`로 더 줄입니다. 이 경로에 긴 타이머를 다시 추가하지 않습니다.

## 단계별 보기

단계별 보기는 자동 스케줄러를 멈추고 `STEP_PHASES`를 한 단계씩 전진시킵니다. 사용자에게 보이는 이름은 `motionTimings.ts`의 `STEP_LABELS`입니다. 자동 모드는 `contact` 진입 시 소리를 재생하고, 단계별 모드는 마지막 “음 재생” 단계에 도달할 때 `onContact`를 호출합니다.

```text
음 이름 확인 → 열 구멍 강조 → 손가락 떼기 → 막을 구멍 강조
→ 손가락 누르기 → 완성 운지 확인 → 음 재생
```

`STEP_PHASES`와 `STEP_LABELS`의 길이와 의미가 대응되어야 합니다. 새 단계를 추가하면 `advanceStep()`의 시각 커밋 조건, 안내 패널, 단위 테스트도 함께 갱신합니다.

## 회귀 검수 체크리스트

좌표나 타이밍 변경 뒤 다음을 순서대로 확인합니다.

- 1번 도: 여덟 구멍의 닫힌 패드가 모두 중심에 닿는가
- 2번 레: R7만 자연스럽게 열리는가
- 3번 미: R6/R7 이중 구멍이 모두 잘 드러나는가
- 4번 바로크식 파: R5만 열리고 R6/R7은 닫히는가
- 4번 독일식 파: R5/R6/R7이 열리는가
- 5–7번: 오른손 열린 자세가 몸통이나 번호를 과하게 가리지 않는가
- 8번 높은 도: L1은 열리고 L2는 닫히며 T0이 닫히는가
- 시→높은 도: L1 열기와 L2 닫기가 올바른 순서로 보이는가
- `1→8→4→5`를 빠르게 눌러 마지막 솔에서만 `contact`/소리가 발생하는가
- 보통, 느리게, 단계별 보기, reduced motion에서 최종 운지가 같은가
- 360×800, 768×1024, 1440×900에서 손·번호·debug 패널이 잘리지 않는가

마지막으로 자동 검증을 실행합니다.

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

자동 테스트는 좌표의 미적 품질을 판정하지 않습니다. 최소한 8개 음과 두 운지 체계를 `?debug=1`로 직접 확인한 뒤 쿼리 없는 기본 화면도 다시 확인합니다.
