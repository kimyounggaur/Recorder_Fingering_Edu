# 아키텍처

이 앱의 핵심 원칙은 **운지 데이터는 한 곳에서 관리하고, 손 포즈·구멍 지도·안내 문구·오디오가 같은 상태에서 파생된다**는 것입니다. 화면은 사용자가 제공한 완성 운지 포즈를 주 시각 자료로 사용하되, 논리 상태와 자동 검증은 기능형 SVG 구멍 지도가 담당합니다.

## 런타임 경계

- `app/page.tsx`는 서버 진입점이며 오류 경계 안에 클라이언트 앱을 렌더링합니다.
- `RecorderLearningApp.tsx`는 선택 음, 활성 음역 분류, 운지 체계, 연습 모드, 애니메이션과 오디오 요청을 조정합니다.
- `NoteKeypad.tsx`는 낮은 계이름·높은 계이름·반음 탭과 8/5/5개의 화면 선택 위치를 제공합니다.
- 17개 고유 음높이에 대응하는 20개의 정렬 PNG 포즈는 `public/fingering/poses/`에서 정적 제공됩니다.
- `RecorderPoseStage.tsx`는 캔버스에서 현재 포즈와 목표 포즈를 교차 전환합니다.
- `RecorderFingeringMap.tsx`는 현재 구멍 상태와 떼기·막기 강조를 SVG로 그립니다.
- 서버 데이터베이스나 비밀 환경 변수는 필요하지 않으며 설정은 브라우저 `localStorage`에 저장됩니다.

## 주요 디렉터리

```text
app/
  page.tsx                         # 페이지 진입점
  globals.css                      # 반응형 장면과 모션 스타일
public/fingering/poses/
  *.png                            # 같은 프레임으로 정렬된 완성 운지 포즈
src/features/recorder/
  model/types.ts                   # 도메인 타입
  data/
    fingerings.ts                  # 음·체계별 open/closed/half/partial 상태
    noteMeta.ts                    # 음 메타데이터와 8/5/5 NOTE_BANKS
    poseAssets.ts                  # 음·체계별 포즈 파일 매핑
  animation/
    getFingeringDiff.ts            # 현재/목표 운지 차이
    motionTimings.ts               # 속도별 phase 시간
    useFingeringAnimation.ts       # 취소 가능한 상태 머신
  audio/
    RecorderAudioEngine.ts         # 오디오 추상화
    WebAudioRecorderEngine.ts      # 합성 연습음 구현
    useRecorderAudio.ts            # unlock, 음소거, 요청 취소
  components/
    RecorderLearningApp.tsx        # 상위 상태와 이벤트 조정
    RecorderScene.tsx              # 포즈·지도·변경 칩 조합
    RecorderPoseStage.tsx          # 캔버스 포즈 전환
    RecorderFingeringMap.tsx       # 기능형 앞면/뒷면 구멍 지도
  utils/
    buildInstruction.ts            # 한국어 안내 생성
    resolveNoteShortcut.ts         # 물리 숫자 키와 음역 분류 해석
    storage.ts                     # 설정 직렬화
```

## 도메인 모델

- `UiButtonNumber`: 음 선택 번호 `1 | ... | 8`
- `NoteBank`: `low | high | chromatic`
- `SolfegeId`: 낮은 자연음 8개, 반음 5개, 추가 높은 자연음 4개를 합친 17개 고유 ID
- `HoleId`: `T0 | L1 | L2 | L3 | R4 | R5 | R6 | R7`
- `FingeringSystem`: `baroque | german`
- `HoleState`: `open | closed | half | partial`

`ALL_NOTE_IDS`에는 C4–G5의 17개 고유 음높이가 한 번씩 들어갑니다. `NOTE_BANKS`는 이를 화면 선택 위치로 다시 구성합니다.

- `low`: C4–C5, 숫자 1–8
- `high`: C5–G5, 숫자 1–5
- `chromatic`: C♯4/D♭4–A♯4/B♭4, 숫자 1–5

C5의 `highDo`는 낮은 분류의 8번과 높은 분류의 1번에서 공유되므로 선택 위치는 18개지만 `SolfegeId`와 오디오 음높이는 17개입니다. 활성 탭은 `activeBank`로 관리하며, 탭만 이동할 때 현재 음을 강제로 바꾸지 않습니다.

`FINGERING_STATES[system][note]`가 여덟 구멍 각각의 정확한 상태를 보존하는 단일 진실 공급원입니다. `half`는 높은 미·파·솔의 T0 엄지 반구멍, `partial`은 도♯·레♯·솔♯의 이중 구멍 부분 막기에 사용됩니다. `FINGERINGS[system][note]`는 상태가 `open`이 아닌 모든 구멍을 모은 접촉 배열로, 기존 떼기/누르기 상태 머신을 위한 호환 보기입니다. `ALL_HOLES`의 순서는 상태 지도, diff, 한국어 안내와 라이브 영역의 공통 읽기 순서입니다.

두 운지 체계가 다른 음은 `fa`, `faSharp`, `highFa` 세 개뿐입니다. 이 세 음은 상태 지도와 포즈 파일이 모두 바로크식·독일식으로 분리되고, 나머지 14개 음은 같은 상태와 포즈를 공유합니다.

## 음역 분류와 단축키 resolver

`resolveNoteShortcut`은 `event.key`가 아니라 물리 키 위치인 `event.code`의 `Digit1`–`Digit8`만 해석합니다.

- 수정자 없음 또는 `Ctrl`: 낮은 계이름 1–8
- `Shift`: 높은 계이름 1–5
- `Alt`: 반음 1–5
- `Shift`/`Alt`의 6–8, 숫자패드, 0·9와 문자 키: 미매핑
- 복합 수정자, `Meta`, 키 반복, IME 조합 중 입력과 `AltGraph`: 거부

해결된 단축키는 해당 음과 `activeBank`를 함께 바꿉니다. 도움말이나 입력 컨트롤이 키를 소유한 동안에는 전역 선택을 실행하지 않습니다. 브라우저가 `Ctrl+숫자` 또는 운영체제가 `Alt+숫자`를 먼저 처리할 수 있으므로, 접근 가능한 세 탭과 18개 화면 버튼이 항상 기본 폴백입니다.

## 데이터 흐름

```mermaid
flowchart TD
  A["음역 탭·화면 버튼·단축키·자동 연습"] --> B["RecorderLearningApp"]
  B --> C["activeBank + selectedNote + system"]
  C --> D["NOTE_BANKS + NOTE_META"]
  C --> E["FINGERING_STATES"]
  E --> F["FINGERINGS 접촉 호환 보기"]
  C --> G["poseAssets"]
  F --> H["useFingeringAnimation"]
  H --> I["phase + contact diff"]
  E --> J["정확한 half/partial holeStates"]
  G --> K["RecorderPoseStage"]
  I --> L["RecorderFingeringMap + 변경 칩"]
  J --> L
  D --> M["buildInstruction"]
  H -->|"최신 contact"| N["useRecorderAudio"]
  D -->|"audioKey"| N
```

상위 컴포넌트는 별도의 목표 구멍 사본을 저장하지 않고 선택 음과 체계에서 `targetFingering`, 접촉 호환 배열과 `poseSource`를 파생합니다. 상태 머신은 접촉 여부의 떼기/누르기를 진행하고, 현재 접촉 중인 구멍에는 목표의 `closed`·`half`·`partial` 값을 다시 합성합니다. 그 결과 음 카드, 포즈, 지도, 설명과 오디오가 같은 선택을 바라보면서도 반구멍 정보가 사라지지 않습니다.

## 취소 가능한 운지 전환

`getFingeringDiff(previous, next)`는 `toOpen`, `toClose`, `stayClosed`, `stayOpen`을 만듭니다. `useFingeringAnimation`은 과거 목표가 아니라 현재 화면에 실제로 커밋된 `visualRef.current`를 새 diff의 시작점으로 사용합니다.

기본 phase 흐름은 다음과 같습니다.

```text
highlight-release → releasing → highlight-press → pressing → contact → settled
```

없는 구간은 건너뛰며 단계별 보기에서는 사용자가 phase를 한 단계씩 진행합니다. 새 전환이 시작되면 기존 타이머를 모두 해제하고 단조 증가 request ID를 바꿉니다. 예약 콜백은 실행 직전에 ID를 다시 검사하므로 빠른 `1→8→4→5` 입력에서도 오래된 전환이 마지막 솔 상태나 오디오를 덮어쓰지 못합니다.

## 포즈 캔버스 전환

`RecorderPoseStage`는 마운트 때 모든 포즈의 preload를 시작하고, 현재 목표가 준비되는 대로 다음 규칙으로 표시합니다.

1. 최초 포즈는 즉시 캔버스에 그립니다.
2. 음이 바뀌면 현재 캔버스의 실제 혼합 프레임을 스냅샷합니다.
3. 스냅샷과 목표 포즈를 `easeOutQuint`로 교차 전환합니다.
4. 보통은 260ms, 느리게는 720ms를 사용합니다.
5. 새 입력은 기존 `requestAnimationFrame`을 취소하고 사용자가 보고 있던 프레임에서 다시 시작합니다.
6. reduced motion에서는 목표 포즈를 즉시 그립니다.

20개 포즈는 모두 동일한 `976×1360` 프레임에 정렬되어 있어야 합니다. `fa`, `faSharp`, `highFa`는 체계별 파일을 선택하고 나머지는 공유 파일을 사용합니다. 같은 음을 다시 볼 때는 직전 전환 원점 포즈를 먼저 복원한 뒤 목표 포즈로 재생합니다. 캔버스를 사용할 수 없는 환경에서는 최적화된 이미지가 폴백으로 남습니다.

## 기능형 구멍 지도

`RecorderScene`은 전달받은 상태를 여덟 `HoleId` 전체에 대해 정규화한 뒤 `RecorderFingeringMap`에 전달합니다. 지도는 다음을 보장합니다.

- T0은 별도의 뒤쪽 엄지 인셋으로 표시합니다.
- R6/R7은 각각 두 개의 작은 구멍으로 그리지만 논리 상태는 하나씩입니다.
- 열림/막힘/반구멍/부분 막힘을 한 `HoleState` 모델로 표현합니다.
- `data-hole-id`, `data-hole-state`, `data-hole-transition`으로 상태를 검증할 수 있습니다.
- phase에 맞춰 떼기는 파란 점선 링, 막기는 주황 실선 링으로 강조합니다.

완성 포즈는 실제 손 모양을 빠르게 이해시키고, 지도는 정확한 번호·접촉 상태와 전환 의미를 명시합니다. 접촉 diff는 `FINGERINGS`, 최종 상태 표현은 `FINGERING_STATES`, 포즈 파일은 `poseAssets.ts`가 담당합니다. 따라서 음을 추가하거나 운지를 바꿀 때는 정확한 상태 지도, 접촉 호환 보기, 포즈 PNG와 매핑을 함께 갱신해 수동 동기화 계약을 지켜야 합니다.

## 오디오와 요청 ID

브라우저 자동재생 정책 때문에 `AudioContext` 활성화는 지연된 contact가 아니라 사용자의 음 선택 제스처 안에서 시작합니다. 앱, `useRecorderAudio`, Web Audio 엔진이 각각 최신 요청 ID를 확인하며, 음소거·연타·언마운트에서는 보류 재생을 취소합니다. 합성 엔진 생성이나 재생이 실패해도 silent fallback을 사용하므로 시각 학습은 계속됩니다.

## 접근성과 오류 경계

- 선택 음과 닫힌 번호를 polite live region으로 알립니다.
- 전체 장면은 음별 접근성 이름과 설명을 갖는 하나의 이미지로 노출됩니다.
- 포즈와 내부 지도 장식은 보조 기술에서 중복 낭독되지 않습니다.
- 버튼·라디오·스위치는 기본 HTML 컨트롤이고 키보드로 조작할 수 있습니다.
- reduced-motion 변경을 구독해 상태 머신, 캔버스와 CSS에 함께 반영합니다.
- 저장소, 전체화면, Web Audio와 이미지 로드 실패가 앱 전체 오류로 전파되지 않습니다.

## 테스트 경계

- `domain.test.ts`: 17개 고유 음, 8/5/5 분류와 공유 C5, 모든 상태 지도, half/partial, 세 체계별 음, 20개 포즈의 경로·크기, diff와 안내 문구
- `resolveNoteShortcut.test.ts`: 물리 `Digit` 매핑, 낮은/높은/반음 수정자, 빈 6–8 슬롯과 잘못된 수정자·IME·AltGraph 거부
- `useFingeringAnimation.test.tsx`: 연타 취소, 단계별 보기, reduced motion, cleanup
- `RecorderAudioEngine.test.ts`: C4–G5의 17개 주파수, 합성음과 오디오 요청 취소
- `RecorderLearningApp.test.tsx`: 8/5/5 탭, 시스템별 높은 파, 분류 단축키, half/partial 지도와 포즈·문구 동기화
- `recorder-learning.spec.ts`: 낮은 8음 전체, 파 체계 전환, `Shift+4` 높은 파의 half/체계별 포즈, `Alt+1` 도♯의 partial, `Ctrl+5` 낮은 솔, 연타와 반응형 화면

자동 테스트와 함께 360×800, 844×390, 데스크톱에서 실제 포즈와 구멍 지도의 정렬·가독성을 확인합니다.
