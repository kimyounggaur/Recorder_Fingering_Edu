# 리코더 운지법 배우기 애니메이션 웹앱
## 바이브코딩 마스터 프롬프트 · 단계별 구현 명세서

> 이 문서는 코딩 에이전트(Cursor, Claude Code, Codex, Windsurf, Copilot Agent, Bolt, Lovable 등)에 **파일 전체를 컨텍스트로 제공한 뒤 그대로 실행시키는 개발 프롬프트**다.  
> 목표는 단순한 시안이 아니라, 실제 브라우저에서 동작하고 테스트를 통과하며 모바일·태블릿·PC에서 사용할 수 있는 완성도 높은 교육용 웹앱을 만드는 것이다.

---

# 0. 사용 방법

## 권장 사용법

1. 이 파일을 프로젝트 루트에 `VIBE_CODING_PROMPT.md`라는 이름으로 넣는다.
2. 코딩 에이전트에게 이 파일 전체를 읽게 한다.
3. 새 프로젝트라면 다음 한 문장으로 시작한다.

```text
VIBE_CODING_PROMPT.md를 프로젝트의 최상위 요구사항으로 읽고, Phase 0부터 순서대로 실제 구현을 진행해. 계획만 제시하지 말고 파일을 생성·수정하며, 각 Phase가 끝날 때 검증 명령을 실행하고 결과를 보고해.
```

4. 기존 프로젝트를 개선하는 경우에는 다음 문장으로 시작한다.

```text
현재 저장소를 먼저 감사한 뒤 VIBE_CODING_PROMPT.md의 요구사항과 비교해. 기존 구조를 최대한 존중하면서 누락·오류·접근성·애니메이션 충돌을 수정하고, Phase별 검증을 모두 수행해.
```

5. 한 번에 너무 많은 변경이 생기는 환경이라면 이 문서의 **Phase별 실행 프롬프트**를 한 단계씩 전달한다.

## 에이전트 응답 원칙

각 Phase가 끝날 때 반드시 다음 형식으로 보고한다.

```text
[완료한 Phase]
- 구현 내용
- 변경한 파일
- 실행한 명령
- 테스트/빌드 결과
- 현재 남은 위험 또는 다음 Phase 주의사항
```

검증 명령을 실제로 실행하지 않았다면 “통과했다”고 말하지 않는다.

---

# 1. 통합 마스터 프롬프트

## 1.1 역할

당신은 다음 역할을 동시에 수행하는 시니어 제품 개발자다.

- 시니어 프런트엔드 엔지니어
- TypeScript 도메인 모델 설계자
- SVG 인터랙션 및 모션 그래픽 엔지니어
- 초등 음악교육 UX 디자이너
- 웹 접근성 전문가
- 테스트 자동화 및 품질보증 엔지니어

당신의 임무는 **소프라노 리코더의 기본 8음 운지법을 숫자 버튼과 양손 손가락 SVG 애니메이션으로 가르치는 웹앱**을 실제로 구현하는 것이다.

## 1.2 최종 제품 목표

학생이 숫자 버튼 1–8 중 하나를 누르면 다음 일이 정확하고 자연스럽게 일어나야 한다.

```text
숫자 버튼 선택
→ 계이름과 음 이름 표시
→ 현재 운지와 목표 운지 비교
→ 떼야 하는 손가락이 먼저 올라감
→ 막아야 하는 손가락이 해당 구멍으로 내려감
→ 구멍이 막히거나 열리는 상태가 명확하게 보임
→ 선택한 음의 소리 재생
→ 한국어 운지 설명 표시
```

제품은 정적인 운지 그림 8장을 교체하는 앱이 아니다. 반드시 **한 개의 데이터 모델과 한 개의 SVG 손가락 리그가 상태에 따라 움직이는 구조**로 구현한다.

## 1.3 반드시 지켜야 할 작업 원칙

1. 먼저 저장소를 확인한다. `package.json`, 잠금 파일, 기존 프레임워크, 코드 스타일, 테스트 환경을 조사한 뒤 구현한다.
2. 기존 프로젝트라면 무관한 의존성 업그레이드나 전체 재작성부터 하지 않는다.
3. 빈 프로젝트라면 유지보수하기 쉬운 React + TypeScript 기반으로 시작한다.
4. 계획만 작성하고 멈추지 않는다. 실제 파일을 생성·수정하고 실행 가능한 결과를 만든다.
5. 운지 데이터는 UI 컴포넌트에 하드코딩하지 않는다. 별도의 도메인 데이터 파일을 단일 진실 공급원으로 사용한다.
6. SVG에서 손가락 위치를 음마다 복제하지 않는다. 각 손가락의 열린 자세와 닫힌 자세를 데이터로 정의한다.
7. 빠르게 여러 버튼을 눌러도 이전 타이머나 애니메이션이 남지 않게 한다.
8. 바로크식과 독일식의 파(F) 차이를 반드시 구현한다.
9. 앞면 구멍과 뒷면 엄지구멍을 혼동하지 않는다.
10. 색만으로 열린 구멍과 막힌 구멍을 구분하지 않는다.
11. 자동재생 오디오는 사용하지 않는다. 첫 사용자 제스처 이후에만 소리를 낸다.
12. 키보드와 터치 모두 지원한다.
13. `prefers-reduced-motion`을 존중한다.
14. 구현 후 타입 검사, 린트, 단위 테스트, 빌드, 핵심 E2E 테스트를 실행한다.
15. 사용자에게 보이는 문구는 자연스러운 한국어로 작성한다.

## 1.4 기술 스택 원칙

빈 프로젝트 기준 권장 구성을 사용한다.

- React
- TypeScript strict mode
- Vite 또는 저장소에 이미 존재하는 동등한 빌드 시스템
- CSS 변수 기반 디자인 토큰 + Tailwind CSS 또는 기존 스타일 시스템
- Motion for React 또는 저장소에 이미 있는 Framer Motion 계열 라이브러리
- 상태 관리는 우선 `useReducer`와 작은 Context로 해결
- Vitest + React Testing Library
- Playwright
- ESLint + Prettier 또는 저장소의 기존 규칙

주의사항:

- 동일한 목적의 애니메이션 라이브러리를 두 개 설치하지 않는다.
- 이 규모의 앱에 불필요한 전역 상태 라이브러리를 억지로 추가하지 않는다.
- 손가락 장면은 Canvas나 WebGL보다 **접근성과 정밀 조정이 쉬운 인라인 SVG**를 우선한다.
- 외부 CDN에 의존하지 않는다.
- 상용 교과서 스캔 이미지를 제품 화면에 그대로 삽입하지 않는다. 참고 자료가 제공되더라도 교육 정보와 구도만 참고해 독창적인 SVG와 UI를 제작한다.

---

# 2. 제품 범위

## 2.1 핵심 사용자

- 초등학생 또는 리코더 입문자
- 수업 중 전자칠판을 사용하는 교사
- 집에서 태블릿이나 휴대전화로 연습하는 학생
- 바로크식과 독일식 운지 차이를 비교해야 하는 학습자

## 2.2 MVP에 반드시 포함할 기능

1. 숫자 버튼 1–8
2. 각 버튼의 계이름 표시
3. 도, 레, 미, 파, 솔, 라, 시, 높은 도 지원
4. 바로크식/독일식 선택
5. 파(F) 운지 자동 분기
6. 앞면 리코더 SVG
7. 뒷면 엄지구멍 보조 뷰 또는 투명 인셋
8. 왼손과 오른손의 개별 손가락 SVG
9. 구멍 막기/떼기 모션
10. 현재 운지에서 다음 운지로의 차이 기반 애니메이션
11. 일반 속도, 느리게 보기, 단계별 보기
12. 음 재생과 음소거
13. 한국어 운지 설명
14. 모바일, 태블릿, 데스크톱 반응형
15. 키보드 조작
16. 접근성 라이브 영역
17. 단위 테스트와 핵심 E2E 테스트
18. 사용 방법이 포함된 README

## 2.3 핵심 안정화 후 추가할 확장 기능

- 1→8 자동 순차 연습
- 사용자가 만든 계이름 순서 재생
- 랜덤 운지 퀴즈
- 정답 확인 애니메이션
- 반음과 높은 음 확장
- 엄지 반구멍과 겹구멍 일부 막기
- 교사용 전체화면 모드
- 오프라인 사용을 위한 PWA
- 마이크 음정 인식

마이크 음정 인식, 로그인, 서버, 사용자 계정, 분석 대시보드는 MVP를 방해하지 않도록 후순위로 둔다.

---

# 3. 음악·운지 도메인 명세

## 3.1 절대로 혼동하지 말아야 할 두 종류의 숫자

### UI 숫자 버튼

학생이 누르는 버튼 번호다.

```text
1=도, 2=레, 3=미, 4=파, 5=솔, 6=라, 7=시, 8=높은 도
```

### 리코더 구멍 번호

실제 운지 번호다.

```text
0 = 뒷면 엄지구멍, 왼손 엄지
1 = 앞면 첫째 구멍, 왼손 검지
2 = 앞면 둘째 구멍, 왼손 가운데손가락
3 = 앞면 셋째 구멍, 왼손 약지
4 = 앞면 넷째 구멍, 오른손 검지
5 = 앞면 다섯째 구멍, 오른손 가운데손가락
6 = 앞면 여섯째 구멍, 오른손 약지
7 = 앞면 일곱째 구멍, 오른손 새끼손가락
```

UI 버튼 번호를 구멍 번호로 사용하지 않는다.

## 3.2 고정 타입

```ts
export type FingeringSystem = "baroque" | "german";

export type HoleId =
  | "T0"
  | "L1"
  | "L2"
  | "L3"
  | "R4"
  | "R5"
  | "R6"
  | "R7";

export type HoleState = "open" | "closed" | "half" | "partial";

export type UiButtonNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type SolfegeId =
  | "do"
  | "re"
  | "mi"
  | "fa"
  | "sol"
  | "la"
  | "si"
  | "highDo";
```

기본 8음에서는 `open`과 `closed`만 사용하더라도 `half`, `partial` 타입을 남겨 두어 확장 가능성을 확보한다.

## 3.3 구멍과 손가락 매핑

```ts
export const FINGER_LABELS: Record<HoleId, string> = {
  T0: "왼손 엄지",
  L1: "왼손 검지",
  L2: "왼손 가운데손가락",
  L3: "왼손 약지",
  R4: "오른손 검지",
  R5: "오른손 가운데손가락",
  R6: "오른손 약지",
  R7: "오른손 새끼손가락",
};

export const HOLE_NUMBER_LABELS: Record<HoleId, string> = {
  T0: "0",
  L1: "1",
  L2: "2",
  L3: "3",
  R4: "4",
  R5: "5",
  R6: "6",
  R7: "7",
};
```

## 3.4 버튼·계이름 메타데이터

음 이름과 운지법을 분리한다. 계이름 정보는 한 번만 정의한다.

```ts
export interface NoteMeta {
  id: SolfegeId;
  button: UiButtonNumber;
  solfegeKo: string;
  noteName: string;
  staffStep: number;
  audioKey: string;
  shortInstruction: string;
}

export const NOTE_ORDER: readonly SolfegeId[] = [
  "do",
  "re",
  "mi",
  "fa",
  "sol",
  "la",
  "si",
  "highDo",
];

export const NOTE_META: Record<SolfegeId, NoteMeta> = {
  do: {
    id: "do",
    button: 1,
    solfegeKo: "도",
    noteName: "C",
    staffStep: 0,
    audioKey: "C",
    shortInstruction: "모든 구멍을 막아요.",
  },
  re: {
    id: "re",
    button: 2,
    solfegeKo: "레",
    noteName: "D",
    staffStep: 1,
    audioKey: "D",
    shortInstruction: "오른손 새끼손가락만 떼어요.",
  },
  mi: {
    id: "mi",
    button: 3,
    solfegeKo: "미",
    noteName: "E",
    staffStep: 2,
    audioKey: "E",
    shortInstruction: "오른손 약지와 새끼손가락을 떼어요.",
  },
  fa: {
    id: "fa",
    button: 4,
    solfegeKo: "파",
    noteName: "F",
    staffStep: 3,
    audioKey: "F",
    shortInstruction: "선택한 운지 체계에 맞게 파를 잡아요.",
  },
  sol: {
    id: "sol",
    button: 5,
    solfegeKo: "솔",
    noteName: "G",
    staffStep: 4,
    audioKey: "G",
    shortInstruction: "왼손 엄지, 검지, 가운데손가락, 약지만 막아요.",
  },
  la: {
    id: "la",
    button: 6,
    solfegeKo: "라",
    noteName: "A",
    staffStep: 5,
    audioKey: "A",
    shortInstruction: "왼손 엄지, 검지, 가운데손가락만 막아요.",
  },
  si: {
    id: "si",
    button: 7,
    solfegeKo: "시",
    noteName: "B",
    staffStep: 6,
    audioKey: "B",
    shortInstruction: "왼손 엄지와 검지만 막아요.",
  },
  highDo: {
    id: "highDo",
    button: 8,
    solfegeKo: "높은 도",
    noteName: "C′",
    staffStep: 7,
    audioKey: "HIGH_C",
    shortInstruction: "왼손 엄지와 가운데손가락만 막아요.",
  },
};
```

`staffStep`은 오선보 컴포넌트가 계단식으로 음표를 배치하기 위한 추상 인덱스다. UI와 오디오의 옥타브 표기를 한 필드에 억지로 합치지 않는다.

## 3.5 운지 데이터의 단일 진실 공급원

다음 데이터는 임의로 바꾸지 않는다.

```ts
export const FINGERINGS: Record<
  FingeringSystem,
  Record<SolfegeId, readonly HoleId[]>
> = {
  baroque: {
    do: ["T0", "L1", "L2", "L3", "R4", "R5", "R6", "R7"],
    re: ["T0", "L1", "L2", "L3", "R4", "R5", "R6"],
    mi: ["T0", "L1", "L2", "L3", "R4", "R5"],
    fa: ["T0", "L1", "L2", "L3", "R4", "R6", "R7"],
    sol: ["T0", "L1", "L2", "L3"],
    la: ["T0", "L1", "L2"],
    si: ["T0", "L1"],
    highDo: ["T0", "L2"],
  },
  german: {
    do: ["T0", "L1", "L2", "L3", "R4", "R5", "R6", "R7"],
    re: ["T0", "L1", "L2", "L3", "R4", "R5", "R6"],
    mi: ["T0", "L1", "L2", "L3", "R4", "R5"],
    fa: ["T0", "L1", "L2", "L3", "R4"],
    sol: ["T0", "L1", "L2", "L3"],
    la: ["T0", "L1", "L2"],
    si: ["T0", "L1"],
    highDo: ["T0", "L2"],
  },
};
```

핵심 검증점:

- 바로크식 파: `T0 L1 L2 L3 R4 R6 R7`
- 독일식 파: `T0 L1 L2 L3 R4`
- 높은 도: `T0 L2`
- 파를 제외한 기본 8음은 두 체계에서 동일

## 3.6 운지 설명 생성 규칙

설명 문구를 모든 컴포넌트에 중복 입력하지 않는다. 다음 정보를 조합해 자동 생성한다.

- 현재 계이름
- 막는 구멍 번호
- 막는 손가락 이름
- 직전 운지에서 새로 떼는 손가락
- 직전 운지에서 새로 막는 손가락
- 파(F)의 운지 체계 안내

예시:

```text
솔은 0, 1, 2, 3번 구멍을 막아요.
왼손 엄지, 검지, 가운데손가락, 약지를 리코더에 가볍게 붙이고 오른손은 구멍에서 떼어요.
```

```text
바로크식 파예요.
5번 구멍은 열고 6번과 7번 구멍은 막아요.
```

```text
도에서 레로 바뀌어요.
오른손 새끼손가락만 천천히 들어 올리세요.
```

문장은 어린 학습자가 이해하기 쉽게 짧고 긍정적으로 작성한다. “실패”, “틀림”보다 “한 번 더 확인해요” 같은 표현을 사용한다.

---

# 4. 정보 구조와 화면 설계

## 4.1 기본 화면 구성

화면을 다음 영역으로 구성한다.

```text
┌────────────────────────────────────────────┐
│ 헤더: 제목 · 도움말 · 전체화면             │
├────────────────────────────────────────────┤
│ 현재 음 카드 │ 리코더 SVG 학습 무대 │ 설정 │
│ 오선보/계이름│ 앞면+엄지 뒷면 인셋   │ 체계 │
│ 설명 문장    │ 손가락 애니메이션      │ 속도 │
├────────────────────────────────────────────┤
│ 1 도 · 2 레 · 3 미 · 4 파                  │
│ 5 솔 · 6 라 · 7 시 · 8 높은 도             │
├────────────────────────────────────────────┤
│ 이전/다음 · 다시 보기 · 음 재생 · 단계 안내│
└────────────────────────────────────────────┘
```

데스크톱에서는 학습 무대를 가장 크게 배치한다. 모바일에서는 세로 흐름으로 재배치하고 숫자 버튼을 4×2 그리드로 보여 준다.

## 4.2 페이지 첫 진입

첫 진입 시 다음을 제공한다.

- 제목: `리코더 운지법 배우기`
- 부제: `숫자 버튼을 눌러 손가락의 움직임을 살펴보세요.`
- 첫 사용자의 경우 운지 체계 선택 카드
  - `바로크식`
  - `독일식`
  - “파 운지가 달라요”라는 짧은 안내
- 선택은 로컬 저장소에 기억
- 언제든 설정에서 변경 가능
- 기본 선택을 강제로 숨기지 않음

온보딩은 전체 앱을 가리는 긴 튜토리얼이 아니라 1–2단계의 간단한 선택과 안내로 끝낸다.

## 4.3 현재 음 카드

다음 정보를 포함한다.

- 큰 계이름: `솔`
- 음 이름: `G`
- 선택된 숫자: `5`
- 간단한 오선보 SVG
- 핵심 문장
- 현재 운지 체계 배지
- 재생 버튼

오선보는 장식이 아니라 현재 음의 높낮이를 시각적으로 보여 주어야 한다. 8개 음이 순서대로 한 칸씩 올라가는 일관된 데이터 매핑을 사용한다.

## 4.4 숫자 버튼

버튼 표시 예:

```text
[1  도] [2  레] [3  미] [4  파]
[5  솔] [6  라] [7  시] [8  높은 도]
```

버튼 요구사항:

- 최소 터치 영역 52×52 CSS px
- 숫자와 계이름을 동시에 표시
- 선택 상태는 배경색, 테두리, 체크/음표 아이콘, `aria-pressed`로 중복 표현
- 키보드 숫자 1–8 지원
- 좌우 화살표로 이전/다음 음 이동
- `Enter` 또는 `Space`로 선택
- 선택 중인 버튼에 눈에 띄는 포커스 링
- 빠르게 연속 입력해도 최종 선택이 정확히 반영

## 4.5 설정 패널

필수 설정:

- 운지 체계: 바로크식 / 독일식
- 보기 속도: 보통 / 느리게
- 단계별 보기 켜기/끄기
- 소리 켜기/끄기
- 구멍 번호 표시 켜기/끄기
- 손가락 이름 표시 켜기/끄기
- 다시 보기

운지 체계를 변경할 때 현재 음이 파라면 실제 운지 차이를 애니메이션으로 보여 준다. 다른 음이라면 불필요한 손가락 움직임을 만들지 않는다.

## 4.6 학습 모드

### 자유 탐색

숫자 버튼을 누르면 즉시 해당 음으로 이동한다.

### 느리게 보기

손가락 동작 시간을 늘리고, 새로 떼는 손가락과 새로 막는 손가락을 더 오래 강조한다.

### 단계별 보기

다음 단계 버튼으로 진행한다.

```text
1. 음 이름 확인
2. 열 구멍 강조
3. 손가락 떼기
4. 막을 구멍 강조
5. 손가락 누르기
6. 완성 운지 확인
7. 음 재생
```

### 자동 순서 연습

핵심 기능 안정화 후 구현한다.

- 도→레→미→파→솔→라→시→높은 도
- 재생/일시정지/처음으로
- 각 음 사이 1.2–2.0초
- 사용자가 다른 버튼을 누르면 자동 재생을 안전하게 중지

---

# 5. 시각 디자인 시스템

## 5.1 디자인 방향

다음 분위기를 목표로 한다.

- 한국 초등 음악교과서처럼 명료하고 따뜻함
- 유아용 장난감처럼 과도하게 유치하지 않음
- 넓은 여백과 큰 정보 계층
- 둥근 카드와 부드러운 그림자
- 리코더와 손가락이 항상 화면의 주인공
- 장식보다 학습 상태를 먼저 보여 줌

## 5.2 디자인 토큰 예시

프로젝트의 기존 디자인 시스템이 없다면 다음과 유사한 토큰을 정의한다. 실제 대비는 브라우저에서 검증한다.

```css
:root {
  --color-bg: #f7f9fc;
  --color-surface: #ffffff;
  --color-text: #172033;
  --color-text-muted: #5f6b7a;
  --color-primary: #315fd5;
  --color-primary-soft: #e9efff;
  --color-accent: #f5a623;
  --color-accent-soft: #fff4d8;
  --color-open: #ffffff;
  --color-closed: #1f2937;
  --color-release: #2f80ed;
  --color-press: #f2b134;
  --color-success: #16845b;
  --color-danger: #c2413b;
  --radius-sm: 10px;
  --radius-md: 18px;
  --radius-lg: 28px;
  --shadow-card: 0 12px 30px rgb(27 39 71 / 10%);
}
```

색상은 상태를 보조할 뿐이다. 열린 구멍에는 빈 원, 막힌 구멍에는 채운 원, 이동 방향에는 화살표나 텍스트를 함께 제공한다.

## 5.3 타이포그래피

- 한국어가 선명한 시스템 폰트 스택 사용
- 로컬에 없는 폰트 파일을 강제 다운로드하지 않음
- 본문 최소 16px
- 버튼 계이름 18–22px
- 현재 계이름 40px 이상
- 지나치게 얇은 글꼴 두께 금지
- 숫자와 계이름의 위계가 명확해야 함

## 5.4 모션 디자인 원칙

- 손가락 움직임은 교육 정보이며 장식이 아니다.
- 너무 탄력적인 스프링이나 과도한 흔들림을 사용하지 않는다.
- 구멍을 누를 때 약한 접촉 피드백만 준다.
- 화면 전체가 흔들리거나 카드가 계속 튀지 않게 한다.
- 기본적으로 transform과 opacity만 애니메이션하여 레이아웃 재계산을 줄인다.

---

# 6. SVG 리코더 장면 명세

## 6.1 전체 구조

인라인 SVG를 사용하고 다음 레이어 순서를 유지한다.

```xml
<svg
  viewBox="0 0 1000 1600"
  role="img"
  aria-labelledby="recorder-scene-title recorder-scene-description"
>
  <title id="recorder-scene-title">현재 리코더 운지</title>
  <desc id="recorder-scene-description">
    선택한 계이름에 맞춰 손가락이 구멍을 막거나 떼는 모습
  </desc>

  <g id="scene-background" />
  <g id="recorder-body" />
  <g id="front-holes" />
  <g id="thumb-rear-inset" />
  <g id="hand-guides" />
  <g id="fingers" />
  <g id="hole-labels" />
  <g id="motion-effects" />
</svg>
```

## 6.2 앞면과 뒷면 표현

엄지구멍 `T0`은 리코더 뒷면에 있다. 앞면 구멍 사이에 억지로 배치하지 않는다.

권장 표현:

- 중앙: 리코더 앞면과 1–7번 구멍
- 좌측 상단 인셋: 리코더 뒷면의 0번 엄지구멍
- 인셋의 엄지 모션은 메인 손가락 모션과 동기화
- 메인 장면에는 “0번은 뒤쪽”이라는 작은 안내 배지
- 필요하면 본체에 반투명 점선 연결선 추가

엄지 상태가 열린 경우 인셋에서 엄지 패드가 구멍에서 명확히 떨어져 있어야 한다. 닫힌 경우 패드 중심이 엄지구멍 중심과 일치해야 한다.

## 6.3 리코더 본체

- 원본 상표나 특정 제조사 디자인을 복제하지 않는 일반적인 교육용 리코더 형태
- 마우스피스, 몸통, 풋 조인트를 단순한 벡터로 표현
- 본체 폭과 구멍 크기는 작은 화면에서도 구별 가능해야 함
- 하단 6, 7번은 겹구멍 형태를 시각적으로 표현할 수 있음
- 기본 8음에서는 R6/R7을 하나의 논리 상태로 닫고 열어도 되지만, SVG 내부에는 부분막음 확장에 필요한 하위 원을 둘 수 있음

## 6.4 구멍 레이아웃 데이터

좌표는 JSX 곳곳에 흩어 놓지 않고 한 파일에서 관리한다.

```ts
export const HOLE_LAYOUT = {
  T0: {
    label: "0",
    hand: "left",
    finger: "thumb",
    side: "back",
    x: 180,
    y: 330,
    radius: 24,
  },
  L1: {
    label: "1",
    hand: "left",
    finger: "index",
    side: "front",
    x: 500,
    y: 430,
    radius: 22,
  },
  L2: {
    label: "2",
    hand: "left",
    finger: "middle",
    side: "front",
    x: 500,
    y: 560,
    radius: 22,
  },
  L3: {
    label: "3",
    hand: "left",
    finger: "ring",
    side: "front",
    x: 500,
    y: 690,
    radius: 22,
  },
  R4: {
    label: "4",
    hand: "right",
    finger: "index",
    side: "front",
    x: 500,
    y: 870,
    radius: 22,
  },
  R5: {
    label: "5",
    hand: "right",
    finger: "middle",
    side: "front",
    x: 500,
    y: 1000,
    radius: 22,
  },
  R6: {
    label: "6",
    hand: "right",
    finger: "ring",
    side: "front",
    x: 500,
    y: 1130,
    radius: 20,
    double: true,
  },
  R7: {
    label: "7",
    hand: "right",
    finger: "little",
    side: "front",
    x: 500,
    y: 1260,
    radius: 20,
    double: true,
  },
} as const;
```

이 좌표는 시작값이다. 실제 렌더링을 보며 손가락 패드가 정확히 닿도록 조정하되, 모든 좌표 변경은 `HOLE_LAYOUT` 또는 `FINGER_POSES`에서만 한다.

## 6.5 구멍 컴포넌트

각 구멍에는 테스트 가능한 식별자를 둔다.

```tsx
<Hole
  id="L1"
  state="closed"
  data-hole-id="L1"
  data-hole-state="closed"
/>
```

시각 규칙:

- 열린 구멍: 흰 내부 + 진한 테두리 + `○` 의미
- 막힌 구멍: 진한 내부 또는 손가락 접촉 표시 + `●` 의미
- 새로 열 구멍: 파란 외곽 링 + 위쪽 화살표
- 새로 막을 구멍: 노란 외곽 링 + 아래쪽 접촉 표시
- 유지 상태: 불필요한 깜빡임 없음

손가락이 위를 덮더라도 상태를 확인할 수 있도록 구멍 외곽 링이나 작은 상태 배지를 남긴다.

## 6.6 손가락 SVG 리그

각 손가락을 독립적인 `<g>`로 만든다.

```xml
<g id="finger-L1" data-finger="L1">
  <g class="finger-root">
    <path class="finger-proximal" />
    <path class="finger-middle" />
    <path class="finger-distal" />
    <ellipse class="finger-pad" />
  </g>
</g>
```

권장 구조:

- 손바닥은 고정 또는 아주 작게만 이동
- 손가락마다 관절 기준점과 회전축 정의
- 열린 자세와 닫힌 자세를 수동 조정한 데이터로 저장
- 전체 손가락을 단순 평행이동하는 것보다 중첩 `<g>` 회전으로 굽힘을 표현
- 손가락 패드 중심이 구멍 중심에 정확히 도달
- 왼손은 위쪽, 오른손은 아래쪽에 자연스럽게 배치
- 손가락이 본체를 뚫고 지나가거나 서로 비정상적으로 겹치지 않게 함

## 6.7 손가락 자세 데이터

모든 손가락에 동일한 오프셋 공식을 강요하지 않는다. 손가락별로 튜닝된 열린/닫힌 자세를 둔다.

```ts
export interface FingerPose {
  x: number;
  y: number;
  rotate: number;
  scaleX?: number;
  scaleY?: number;
  opacity?: number;
}

export const FINGER_POSES: Record<
  HoleId,
  Record<"open" | "closed" | "half" | "partial", FingerPose>
> = {
  // 각 손가락을 실제 SVG에 맞춰 수동 튜닝한다.
};
```

닫힌 자세 품질 기준:

- 손가락 패드 중심과 구멍 중심의 오차가 SVG 좌표 기준 약 3단위 이내
- 구멍이 손가락 패드 밖으로 과도하게 노출되지 않음
- 패드가 인접 구멍을 잘못 덮지 않음

열린 자세 품질 기준:

- 구멍이 완전히 보임
- 손가락이 몸통에서 자연스럽게 50–110 SVG 단위 떨어짐
- 왼손과 오른손이 서로 다른 방향으로 자연스럽게 열림
- 손가락이 화면 밖으로 잘리지 않음

## 6.8 개발용 디버그 오버레이

개발 모드에서 `?debug=1` 또는 단축키로 다음을 켤 수 있게 한다.

- 모든 구멍 중심점
- 구멍 ID
- 손가락 패드 중심점
- 열린/닫힌 자세 경계 상자
- 현재 운지 배열
- 현재 애니메이션 단계

프로덕션 기본 UI에는 노출하지 않는다.

---

# 7. 애니메이션 시스템 명세

## 7.1 차이 계산

현재 운지와 목표 운지를 비교한다.

```ts
export const ALL_HOLES: readonly HoleId[] = [
  "T0",
  "L1",
  "L2",
  "L3",
  "R4",
  "R5",
  "R6",
  "R7",
];

export function getFingeringDiff(
  previous: readonly HoleId[],
  next: readonly HoleId[],
) {
  const previousSet = new Set(previous);
  const nextSet = new Set(next);

  return {
    toOpen: ALL_HOLES.filter(
      (id) => previousSet.has(id) && !nextSet.has(id),
    ),
    toClose: ALL_HOLES.filter(
      (id) => !previousSet.has(id) && nextSet.has(id),
    ),
    stayClosed: ALL_HOLES.filter(
      (id) => previousSet.has(id) && nextSet.has(id),
    ),
    stayOpen: ALL_HOLES.filter(
      (id) => !previousSet.has(id) && !nextSet.has(id),
    ),
  };
}
```

예:

```text
도 → 레
toOpen = [R7]
toClose = []
```

```text
솔 → 바로크식 파
toOpen = []
toClose = [R4, R6, R7]
```

```text
바로크식 파 → 독일식 파
toOpen = [R6, R7]
toClose = []
```

## 7.2 상태 머신

단순한 여러 `setTimeout`을 흩어 놓지 않는다. 최소한 다음 상태를 명시적으로 관리한다.

```ts
type AnimationPhase =
  | "idle"
  | "highlight-release"
  | "releasing"
  | "highlight-press"
  | "pressing"
  | "contact"
  | "settled";
```

권장 상태:

```ts
interface FingeringAnimationState {
  selectedNote: SolfegeId;
  previousNote: SolfegeId | null;
  system: FingeringSystem;
  phase: AnimationPhase;
  targetClosedHoles: readonly HoleId[];
  visualHoleStates: Record<HoleId, HoleState>;
  requestId: number;
  isPlayingSequence: boolean;
}
```

## 7.3 기본 타임라인

보통 속도:

| 시간 | 동작 |
|---:|---|
| 0ms | 숫자 버튼 눌림 및 새 음 선택 |
| 0–80ms | 현재 음 카드와 안내 문장 전환 |
| 80–140ms | 열 구멍 강조 |
| 100–300ms | `toOpen` 손가락 올리기 |
| 160–230ms | 막을 구멍 강조 |
| 180–420ms | `toClose` 손가락 내리기 |
| 420ms | 접촉 링 및 음 재생 |
| 420–520ms | 약한 접촉 피드백 |
| 520ms | 안정된 최종 운지 유지 |

느리게 보기:

- 전체 약 1.1–1.5초
- 강조 단계를 더 길게 유지
- 떼기와 누르기의 시간 차이를 더 분명하게 보여 줌

단계별 보기:

- 자동 타임라인을 멈추고 사용자가 `다음 단계`를 누를 때마다 phase를 전환
- 이전 단계로 돌아가기 제공 가능

## 7.4 빠른 연속 입력 처리

반드시 해결해야 할 시나리오:

```text
사용자가 1번을 누른 직후 8번, 4번, 5번을 빠르게 누른다.
```

요구사항:

- 오래된 애니메이션 콜백이 최신 상태를 덮어쓰지 않음
- 오래된 음이 뒤늦게 재생되지 않음
- 최종 버튼의 운지에서 안정적으로 멈춤
- 이전 애니메이션의 현재 시각 자세에서 새 목표로 자연스럽게 전환
- 컴포넌트 언마운트 후 상태 업데이트 없음

구현 방법 예:

- 증가하는 `requestId` 사용
- 애니메이션 컨트롤의 `stop()` 사용
- `AbortController` 또는 정리 가능한 타이머 래퍼 사용
- 오디오 소스 중지
- 모든 effect에 cleanup 구현

`setTimeout`을 사용해야 한다면 반드시 중앙 스케줄러에 모으고 취소 가능하게 만든다.

## 7.5 애니메이션 접근성

`prefers-reduced-motion: reduce` 환경에서는:

- 손가락 이동 시간을 0–100ms로 축소
- 반복되는 반짝임 제거
- 상태 변화는 즉시 또는 짧은 페이드로 표시
- 기능과 설명은 그대로 유지

앱 내부에서도 `동작 줄이기` 옵션을 제공할 수 있다.

---

# 8. 오디오 명세

## 8.1 기본 원칙

- 브라우저 자동재생 정책을 우회하려 하지 않는다.
- 사용자가 버튼을 누른 뒤 AudioContext를 활성화한다.
- 손가락이 구멍에 닿는 contact 단계에서 음을 재생한다.
- 연속 입력 시 이전 음을 짧게 페이드아웃한다.
- 음소거 상태를 로컬에 기억한다.
- 오디오가 실패해도 운지 학습 기능은 정상 동작한다.

## 8.2 오디오 추상화

```ts
export interface RecorderAudioEngine {
  unlock(): Promise<void>;
  preload(): Promise<void>;
  play(noteKey: string): Promise<void>;
  stop(fadeMs?: number): void;
  setMuted(muted: boolean): void;
  dispose(): void;
}
```

## 8.3 음원 전략

우선순위:

1. 라이선스가 명확한 로컬 리코더 샘플
2. 개발 중에는 Web Audio 기반의 짧은 합성음 폴백
3. 음원이 없을 때 앱 전체를 실패시키지 않음

합성음 폴백을 사용할 경우 실제 리코더 녹음으로 오해하게 하지 않는다. README에 임시 음색임을 적는다.

## 8.4 재생 UX

- 현재 음 카드와 컨트롤 바에 재생 버튼 제공
- 버튼 선택 시 자동 재생 여부를 설정 가능하게 할 수 있음
- 기본은 사용자 클릭에 반응해 한 번 재생
- 음 길이 약 600–900ms
- 끝부분에 짧은 페이드아웃
- 한꺼번에 여러 음이 겹치지 않음

---

# 9. 코드 구조

빈 프로젝트라면 다음과 유사하게 구성한다.

```text
src/
  app/
    App.tsx
    AppShell.tsx
    routes.tsx                 # 라우팅이 필요할 때만
  components/
    ui/
      Button.tsx
      Card.tsx
      SegmentedControl.tsx
      Switch.tsx
      Tooltip.tsx
  features/
    recorder/
      components/
        RecorderLearningApp.tsx
        RecorderScene.tsx
        RecorderBody.tsx
        RearThumbInset.tsx
        Hole.tsx
        Finger.tsx
        FingerLayer.tsx
        HoleLabels.tsx
        NoteCard.tsx
        StaffNote.tsx
        NoteKeypad.tsx
        FingeringSystemToggle.tsx
        PlaybackControls.tsx
        InstructionPanel.tsx
        FingeringLegend.tsx
        RecorderDebugOverlay.tsx
      data/
        noteMeta.ts
        fingerings.ts
        holeLayout.ts
        fingerPoses.ts
      model/
        types.ts
        fingeringReducer.ts
        selectors.ts
        animationStateMachine.ts
      animation/
        getFingeringDiff.ts
        getFingerPose.ts
        useFingeringAnimation.ts
        motionTimings.ts
      audio/
        RecorderAudioEngine.ts
        WebAudioRecorderEngine.ts
        useRecorderAudio.ts
      utils/
        buildInstruction.ts
        storage.ts
      tests/
        fingerings.test.ts
        getFingeringDiff.test.ts
        buildInstruction.test.ts
        RecorderLearningApp.test.tsx
  styles/
    globals.css
    tokens.css
  test/
    setup.ts

public/
  audio/
    recorder/
      README.md

e2e/
  recorder-learning.spec.ts

docs/
  architecture.md
  animation-tuning.md

README.md
```

기존 저장소에 비슷한 구조가 있으면 그 구조를 따른다. 폴더 이름을 맞추는 것보다 역할 분리와 단일 데이터 원칙이 중요하다.

---

# 10. 상태 관리와 이벤트 설계

## 10.1 핵심 앱 상태

```ts
interface RecorderAppState {
  selectedNote: SolfegeId;
  fingeringSystem: FingeringSystem;
  speed: "normal" | "slow";
  mode: "explore" | "step" | "sequence";
  phase: AnimationPhase;
  isMuted: boolean;
  showHoleNumbers: boolean;
  showFingerNames: boolean;
  reduceMotion: boolean;
}
```

## 10.2 이벤트 예시

```ts
type RecorderAction =
  | { type: "NOTE_SELECTED"; note: SolfegeId }
  | { type: "SYSTEM_CHANGED"; system: FingeringSystem }
  | { type: "SPEED_CHANGED"; speed: "normal" | "slow" }
  | { type: "MODE_CHANGED"; mode: RecorderAppState["mode"] }
  | { type: "PHASE_CHANGED"; phase: AnimationPhase }
  | { type: "MUTE_TOGGLED" }
  | { type: "REPLAY_REQUESTED" }
  | { type: "SEQUENCE_STARTED" }
  | { type: "SEQUENCE_STOPPED" };
```

## 10.3 파생 상태

저장하지 않고 계산할 값:

- 현재 막힌 구멍 목록
- 열린 구멍 목록
- 현재 손가락 상태
- 운지 차이
- 현재 설명 문장
- 현재 버튼의 선택 상태

동일 정보를 여러 상태 변수에 중복 저장하지 않는다.

## 10.4 로컬 저장

다음만 저장한다.

- 운지 체계
- 음소거 여부
- 보기 속도
- 구멍 번호 표시 여부
- 온보딩 완료 여부

현재 애니메이션 phase나 임시 타이머는 저장하지 않는다. 저장 데이터 파싱 실패 시 안전한 기본값으로 복구한다.

---

# 11. 접근성 명세

## 11.1 키보드

- `1`–`8`: 해당 음 선택
- `ArrowLeft`, `ArrowRight`: 이전/다음 음
- `Space` 또는 명시적 재생 버튼: 현재 음 다시 재생
- `Escape`: 열린 설정 패널이나 도움말 닫기
- 모든 제어 요소는 자연스러운 Tab 순서

입력창에 포커스가 있을 때 숫자 단축키가 오작동하지 않게 한다.

## 11.2 스크린리더

- 숫자 버튼에 `aria-label="5번, 솔"`
- 선택 버튼에 `aria-pressed="true"`
- 운지 체계는 라디오 그룹 또는 시맨틱한 세그먼트 컨트롤
- 현재 음과 설명을 `aria-live="polite"` 영역에 알림
- 장식용 SVG 요소는 접근성 트리에서 숨김
- 전체 SVG에는 짧은 title과 현재 상태 desc 제공

라이브 영역 예:

```text
솔이 선택되었습니다. 0, 1, 2, 3번 구멍을 막습니다.
```

## 11.3 시각 접근성

- 텍스트 대비 충분히 확보
- 선택 상태를 색 하나에만 의존하지 않음
- 포커스 링을 제거하지 않음
- 작은 화면에서도 확대 가능
- 최소 본문 16px
- 버튼 사이 충분한 간격
- 열린 구멍과 닫힌 구멍에 도형 차이 제공

## 11.4 모션 접근성

- 시스템의 reduced-motion 반영
- 단계별 모드 제공
- 반복 모션은 사용자가 중지 가능
- 화면 번쩍임 금지

---

# 12. 반응형 명세

## 모바일

- 한 열 레이아웃
- 현재 음 카드 → 리코더 장면 → 설명 → 숫자 버튼 → 설정
- 숫자 버튼 4×2
- 하단 고정 버튼을 사용할 경우 콘텐츠를 가리지 않음
- `env(safe-area-inset-bottom)` 고려
- SVG는 가로 폭에 맞춰 축소하되 손가락과 구멍이 식별 가능

## 태블릿

- 장면을 가장 크게 유지
- 현재 음 카드와 설정을 2열 또는 상·하 카드로 배치
- 전자칠판에서 1–8 버튼을 한 줄로 표시할 수 있음

## 데스크톱

- 중앙 SVG 학습 무대가 전체 시선의 중심
- 좌측 현재 음 카드, 우측 설정/설명 패널
- 넓은 화면에서도 장면 폭을 과도하게 늘리지 않고 최대 너비 설정

## 가로 모드

- 세로 스크롤을 최소화
- 리코더 장면과 버튼이 동시에 보이게 우선순위 조정

필수 확인 해상도 예:

- 360×800
- 390×844
- 768×1024
- 1024×768
- 1440×900

---

# 13. 테스트 명세

## 13.1 운지 데이터 단위 테스트

반드시 작성한다.

```ts
expect(FINGERINGS.baroque.do).toEqual([
  "T0",
  "L1",
  "L2",
  "L3",
  "R4",
  "R5",
  "R6",
  "R7",
]);

expect(FINGERINGS.baroque.fa).toEqual([
  "T0",
  "L1",
  "L2",
  "L3",
  "R4",
  "R6",
  "R7",
]);

expect(FINGERINGS.german.fa).toEqual([
  "T0",
  "L1",
  "L2",
  "L3",
  "R4",
]);

expect(FINGERINGS.baroque.highDo).toEqual(["T0", "L2"]);
```

추가 검증:

- 모든 체계에 8개 음이 존재
- 모든 배열에 유효한 HoleId만 존재
- 중복 구멍 없음
- UI 버튼 1–8이 중복 없이 배정
- 파를 제외한 두 운지 체계 데이터가 동일

## 13.2 차이 계산 테스트

```ts
expect(getFingeringDiff(FINGERINGS.baroque.do, FINGERINGS.baroque.re).toOpen)
  .toEqual(["R7"]);

expect(getFingeringDiff(FINGERINGS.baroque.sol, FINGERINGS.baroque.fa).toClose)
  .toEqual(["R4", "R6", "R7"]);

expect(getFingeringDiff(FINGERINGS.baroque.fa, FINGERINGS.german.fa).toOpen)
  .toEqual(["R6", "R7"]);
```

## 13.3 컴포넌트 테스트

- 1–8 버튼이 모두 표시됨
- 5번 클릭 시 `솔`, `G` 표시
- 선택 버튼에 `aria-pressed=true`
- 4번 선택 후 체계 변경 시 파 설명이 바뀜
- 높은 도 선택 시 T0와 L2만 closed 상태
- 음소거 토글 작동
- reduced motion에서 장시간 애니메이션을 사용하지 않음
- 라이브 영역 문구 업데이트

## 13.4 빠른 입력 회귀 테스트

가짜 타이머 또는 제어 가능한 애니메이션 환경을 사용해 다음을 검증한다.

```text
1 클릭 → 8 클릭 → 4 클릭 → 5 클릭
```

최종 상태:

- selectedNote = sol
- 닫힌 구멍 = T0 L1 L2 L3
- 오래된 contact 콜백이 다른 음을 재생하지 않음
- unhandled promise rejection 없음
- cleanup 누락 경고 없음

## 13.5 E2E 테스트

Playwright로 최소 다음 시나리오를 작성한다.

1. 앱 로드
2. 운지 체계 선택
3. 1–8 모든 버튼 클릭
4. 각 버튼의 계이름 확인
5. 파에서 체계 전환 후 R6/R7 상태 확인
6. 키보드 숫자 5로 솔 선택
7. 느리게 보기 토글
8. 모바일 뷰에서 가로 스크롤 없음
9. 재생 버튼이 사용자 동작 후 호출됨
10. 연속 입력 후 마지막 음이 유지됨

## 13.6 시각 검수

자동 테스트만으로 손가락이 실제 구멍 중앙에 닿는지 완전히 보장할 수 없다. 개발용 디버그 오버레이와 스크린샷을 사용해 수동 검수한다.

모든 음에 대해 확인:

- 닫힌 손가락의 패드가 목표 구멍 중심에 있음
- 열린 손가락이 목표 구멍을 가리지 않음
- 손가락이 이상하게 꼬이지 않음
- 엄지 인셋이 메인 운지와 동기화됨
- 작은 화면에서 잘리지 않음

---

# 14. 성능과 품질 기준

- 손가락 모션은 transform/opacity 중심
- 불필요한 전체 SVG 리렌더 최소화
- `React.memo`는 측정 후 필요한 부분에만 사용
- 애니메이션 중 레이아웃 이동 없음
- 장면 로딩 시 큰 누적 레이아웃 이동 없음
- 오디오 파일은 필요한 시점에 효율적으로 로드
- 콘솔 오류·경고 없음
- TypeScript `any` 남용 없음
- `@ts-ignore`로 문제를 숨기지 않음
- 테스트를 통과시키기 위해 실제 요구사항을 삭제하지 않음
- SVG ID 충돌 방지
- 여러 인스턴스가 렌더링될 가능성을 고려해 클립패스/그라디언트 ID를 안정적으로 생성

권장 품질 목표:

- 접근성 검사에서 심각한 오류 0개
- 핵심 경로 E2E 통과
- 프로덕션 빌드 성공
- 모바일 가로 스크롤 0
- 8개 음과 2개 체계의 데이터 검증 100%

---

# 15. 금지 사항

다음을 하지 않는다.

1. 음마다 서로 다른 완성 이미지 8장을 교체하는 방식
2. 손가락 없이 검은 점만 바꾸는 방식으로 “애니메이션 완료”라고 주장
3. 엄지구멍을 앞면 1번 위에 그려 놓는 오류
4. 바로크식 파와 독일식 파를 같은 데이터로 처리
5. UI 버튼 번호와 구멍 번호를 같은 타입으로 사용
6. 여러 컴포넌트에 운지 배열을 복사
7. 취소 불가능한 타이머를 여러 곳에 배치
8. 버튼을 빠르게 누를 때 이전 음이 뒤늦게 재생되는 구현
9. 오디오 자동재생 강제
10. 색상만으로 정답·열림·닫힘 표시
11. 포커스 아웃라인 제거
12. 의미 없는 과도한 캐릭터·색종이·반짝임
13. 저작권이 불명확한 교과서 이미지나 음원을 제품에 포함
14. 테스트 없이 “완성” 처리
15. 로컬에서 실행되지 않는 의사코드만 제공

---

# 16. 단계별 구현 계획

각 Phase를 순서대로 수행한다. 한 Phase의 검증이 실패하면 다음 Phase로 넘어가기 전에 원인을 해결한다.

## Phase 0 — 저장소 감사와 실행 계획

### 목표

현재 프로젝트 상태를 파악하고 최소 변경 경로를 결정한다.

### 작업

- 파일 트리 확인
- `package.json`과 잠금 파일 확인
- 사용 중인 프레임워크, 패키지 매니저, 테스트 도구 확인
- 기존 디자인 시스템과 라우팅 확인
- 실행 명령 확인
- 충돌 가능성이 있는 의존성 확인
- 이 문서 요구사항과 현재 구현의 차이 표 작성

### 산출물

- 짧은 구현 계획
- 유지할 기존 구조
- 추가할 파일 목록
- 위험 요소

### 금지

- 감사 전에 전체 프로젝트 삭제 또는 재생성
- 실행되지 않은 상태에서 대규모 변경

### 검증

기존 프로젝트의 dev 또는 build 명령을 최소 한 번 실행한다.

---

## Phase 1 — 프로젝트 기반과 디자인 토큰

### 목표

앱이 실행되고 빈 학습 화면 골격이 반응형으로 보이게 한다.

### 작업

- 필요한 경우 React + TypeScript 프로젝트 초기화
- strict TypeScript 설정
- 전역 스타일과 디자인 토큰
- AppShell
- 헤더
- 메인 반응형 그리드
- 빈 NoteCard, RecorderScene, NoteKeypad, SettingsPanel 배치
- 기본 오류 경계 또는 안전한 폴백

### 완료 기준

- 모바일과 데스크톱에서 레이아웃이 깨지지 않음
- 가로 스크롤 없음
- 타입 검사와 빌드 성공

### 검증 명령

```bash
npm run typecheck
npm run lint
npm run build
```

실제 패키지 매니저에 맞게 변경한다.

---

## Phase 2 — 운지 도메인 데이터와 단위 테스트

### 목표

UI와 독립적인 정확한 운지 데이터 계층을 만든다.

### 작업

- `types.ts`
- `noteMeta.ts`
- `fingerings.ts`
- `FINGER_LABELS`
- `HOLE_NUMBER_LABELS`
- `getFingeringDiff`
- `buildInstruction`
- 데이터 검증 테스트
- 파 운지 차이 테스트
- 높은 도 테스트

### 완료 기준

- 모든 운지 데이터 단위 테스트 통과
- UI 컴포넌트에 운지 배열 하드코딩 없음
- TypeScript가 잘못된 HoleId를 거부

### 검증 명령

```bash
npm run test -- --run
npm run typecheck
```

---

## Phase 3 — 정적 리코더 SVG와 구멍

### 목표

손가락 없이도 앞면 1–7번과 뒷면 0번이 정확히 이해되는 SVG 장면을 만든다.

### 작업

- RecorderBody
- 앞면 구멍 1–7
- 뒷면 엄지 인셋 0
- 열린/닫힌/강조 상태
- 구멍 번호 라벨
- 반응형 viewBox
- 접근성 title/desc
- 개발용 디버그 좌표

### 완료 기준

- 8개 구멍이 모두 식별 가능
- T0가 뒷면 인셋에 있음
- 열린 원과 닫힌 원이 색 없이도 구분 가능
- 모바일에서 SVG가 잘리지 않음

### 검증

- 정적 스크린샷 저장
- 브라우저에서 360px와 1440px 확인
- 컴포넌트 테스트에서 8개 hole 식별자 확인

---

## Phase 4 — 양손 손가락 SVG 리그

### 목표

각 손가락이 독립적으로 열린 자세와 닫힌 자세를 가질 수 있게 한다.

### 작업

- 왼손 손바닥과 손가락
- 오른손 손바닥과 손가락
- 엄지 인셋의 손가락
- finger pad 중심 좌표
- `FINGER_POSES`
- open/closed 정적 전환
- 손가락 이름 표시 옵션
- 디버그 오버레이

### 완료 기준

- 각 HoleId를 대응하는 한 손가락 그룹이 있음
- 닫힌 자세에서 패드가 구멍 중심에 위치
- 열린 자세에서 구멍이 보임
- 손가락이 서로 부자연스럽게 겹치지 않음

### 검증

8개 손가락을 각각 open/closed로 강제 표시하는 개발용 갤러리를 잠시 만들어 시각 점검하거나 Storybook이 있으면 스토리로 작성한다.

---

## Phase 5 — 운지 전환 애니메이션

### 목표

현재 운지에서 목표 운지로 정확하고 취소 가능한 모션을 구현한다.

### 작업

- animation state machine
- `useFingeringAnimation`
- release → press → contact 순서
- normal/slow 타이밍
- 접촉 링
- 빠른 입력 취소
- 언마운트 cleanup
- reduced motion

### 완료 기준

- 도→레에서 R7만 올라감
- 솔→바로크식 파에서 R4/R6/R7만 내려감
- 바로크식 파→독일식 파에서 R6/R7만 올라감
- 연속 클릭 후 마지막 음에서 멈춤
- stale timer 없음

### 검증

- 차이 계산 테스트
- 빠른 입력 회귀 테스트
- 브라우저에서 1→8→4→5 연속 입력
- 콘솔 오류 없음

---

## Phase 6 — 숫자 버튼과 현재 음 카드

### 목표

학생이 숫자, 계이름, 오선보, 손가락 동작을 하나의 흐름으로 이해하게 한다.

### 작업

- NoteKeypad 1–8
- NoteCard
- StaffNote
- 선택 상태
- 키보드 단축키
- 이전/다음 음
- 다시 보기
- 한국어 라이브 영역
- 파 체계 배지

### 완료 기준

- 모든 버튼 클릭 가능
- 숫자 1–8 키 작동
- 계이름과 음 이름 정확
- `aria-pressed` 정확
- 현재 음 카드와 SVG가 항상 동기화

---

## Phase 7 — 운지 체계와 학습 모드

### 목표

바로크식/독일식과 보통/느리게/단계별 모드를 완성한다.

### 작업

- 첫 진입 체계 선택
- 체계 토글
- 로컬 저장
- 느리게 보기
- 단계별 보기
- 구멍 번호 표시 토글
- 손가락 이름 표시 토글
- 설명 문장 생성

### 완료 기준

- 파 선택 중 체계 변경 시 실제 손가락 변화
- 다른 음에서 체계 변경 시 불필요한 모션 없음
- 새로고침 후 설정 유지
- 단계별 모드에서 자동으로 다음 단계로 넘어가지 않음

---

## Phase 8 — 오디오

### 목표

사용자 제스처 이후 안정적으로 현재 음을 재생한다.

### 작업

- AudioEngine 인터페이스
- AudioContext unlock
- 로컬 샘플 또는 합성 폴백
- contact 타이밍 연동
- 음소거
- 이전 음 페이드아웃
- 오류 폴백
- cleanup

### 완료 기준

- 자동재생 경고 없음
- 빠른 입력 시 오래된 음이 뒤늦게 재생되지 않음
- 음소거 작동
- 오디오 실패 시 UI 정상

---

## Phase 9 — 자동 순서 연습

### 목표

기본 8음을 순서대로 관찰하고 반복할 수 있게 한다.

### 작업

- 도→높은 도 자동 진행
- 재생/일시정지/처음으로
- 현재 단계 표시
- 사용자 직접 선택 시 안전한 중지
- reduced motion과 음소거 반영

### 완료 기준

- 시퀀스 중 중복 타이머 없음
- 앱을 떠나거나 모드를 바꾸면 cleanup
- 마지막 높은 도에서 안정적으로 종료

핵심 품질이 떨어진다면 이 Phase는 생략 가능하지만, 앞선 Phase는 생략하지 않는다.

---

## Phase 10 — 접근성·반응형·교실 사용성

### 목표

키보드, 스크린리더, 모바일, 태블릿, 전자칠판에서 사용할 수 있게 한다.

### 작업

- Tab 순서
- focus-visible
- aria-live
- reduced motion
- 모바일 4×2 키패드
- 태블릿/데스크톱 레이아웃
- 전체화면 버튼 선택 구현
- 도움말
- 터치 영역 확인
- 색상 대비 점검

### 완료 기준

- 마우스 없이 핵심 기능 사용 가능
- 모바일 가로 스크롤 없음
- 화면 확대 시 핵심 기능 손실 없음
- 장식 SVG가 스크린리더를 방해하지 않음

---

## Phase 11 — 테스트 자동화와 회귀 검수

### 목표

운지 정확성, 상호작용, 애니메이션 취소, 반응형을 자동 검증한다.

### 작업

- 단위 테스트 보완
- 컴포넌트 테스트
- E2E
- 빠른 입력 시나리오
- 파 체계 전환
- 키보드
- 모바일 viewport
- console error 감시

### 완료 기준

- 모든 필수 테스트 통과
- flaky timer 테스트 없음
- 프로덕션 빌드 성공

### 최종 검증 명령 예

```bash
npm run typecheck
npm run lint
npm run test -- --run
npm run build
npm run test:e2e
```

---

## Phase 12 — 최종 폴리시와 문서화

### 목표

다른 개발자가 이어받을 수 있고 수업에서 바로 사용할 수 있는 상태로 마무리한다.

### 작업

- UI 문구 교정
- 미세한 SVG 좌표 조정
- 모든 음 시각 검수
- README 작성
- architecture 문서
- animation tuning 문서
- 음원 라이선스 기록
- 알려진 제약 기록
- 불필요한 디버그 코드 제거 또는 dev 전용 처리

### README 필수 내용

- 프로젝트 소개
- 설치/실행
- 테스트
- 운지 체계 차이
- 데이터 수정 위치
- 손가락 좌표 조정 방법
- 오디오 파일 교체 방법
- 접근성 기능
- 배포 방법

### 완료 기준

- 처음 받은 사람이 README만 보고 실행 가능
- 모든 필수 명령 통과
- 콘솔 오류 없음
- 디버그 UI가 프로덕션 기본 화면에 노출되지 않음

---

# 17. Phase별 실행 프롬프트

아래 프롬프트는 이 파일 전체를 이미 컨텍스트로 제공했다는 전제에서 사용한다.

## Phase 0 실행

```text
이 문서의 Phase 0만 수행해. 저장소를 먼저 감사하고 현재 기술 스택, 실행 가능 여부, 요구사항과의 차이, 최소 변경 계획을 보고해. 기존 파일을 아직 대규모로 수정하지 말고, 현재 상태의 실행 또는 빌드를 실제로 확인해.
```

## Phase 1 실행

```text
Phase 0 결과를 바탕으로 Phase 1을 실제 구현해. 반응형 AppShell, 디자인 토큰, 현재 음 카드·리코더 장면·숫자 키패드·설정 패널의 골격을 만들고 타입 검사·린트·빌드를 실행해. 기존 디자인 시스템이 있으면 재사용해.
```

## Phase 2 실행

```text
Phase 2를 구현해. UI 숫자 1–8과 구멍 0–7을 완전히 분리한 TypeScript 도메인 모델, 바로크식/독일식 운지 데이터, 파 운지 분기, 높은 도 운지, 차이 계산, 설명 생성기와 단위 테스트를 만들어. 운지 배열을 컴포넌트에 하드코딩하지 마.
```

## Phase 3 실행

```text
Phase 3을 구현해. 1000×1600 viewBox의 독창적인 교육용 리코더 SVG를 만들고 앞면 1–7번 구멍과 뒷면 0번 엄지 인셋을 표현해. open/closed/highlight 상태와 번호 라벨, 접근성 title/desc, debug 좌표 표시를 구현하고 모바일/데스크톱에서 확인해.
```

## Phase 4 실행

```text
Phase 4를 구현해. 왼손과 오른손을 SVG 리그로 만들고 각 손가락을 독립 그룹으로 분리해. 모든 HoleId에 open/closed 자세를 지정하고 닫힌 패드 중심이 구멍 중심에 맞도록 튜닝해. 음별 완성 이미지를 교체하는 방식은 금지야. 개발용 pose 갤러리 또는 debug overlay로 시각 검수해.
```

## Phase 5 실행

```text
Phase 5를 구현해. 운지 diff 기반의 release→press→contact 상태 머신과 취소 가능한 애니메이션을 만들어. normal/slow/reduced-motion을 지원하고, 1→8→4→5를 빠르게 눌러도 마지막 솔에서 멈추도록 회귀 테스트를 작성해. stale timer와 오래된 오디오 콜백이 남지 않게 해.
```

## Phase 6 실행

```text
Phase 6을 구현해. 1–8 숫자 키패드, 계이름·음 이름·오선보가 있는 NoteCard, 키보드 단축키, 이전/다음, 다시 보기, aria-pressed, aria-live를 연결해. 선택된 버튼·카드·SVG 상태가 항상 같은 음을 가리키는지 테스트해.
```

## Phase 7 실행

```text
Phase 7을 구현해. 바로크식/독일식 선택, 첫 진입 안내, 설정 로컬 저장, 보통/느리게/단계별 보기, 번호·손가락 이름 토글을 완성해. 파 선택 중 운지 체계를 바꾸면 R6/R7 차이가 실제 애니메이션으로 보여야 하고, 다른 음에서는 불필요한 움직임이 없어야 해.
```

## Phase 8 실행

```text
Phase 8을 구현해. 사용자 제스처 후 활성화되는 AudioEngine을 만들고 contact 단계에서 현재 음을 재생해. 이전 음 페이드아웃, 음소거, 빠른 연속 입력 취소, 오디오 실패 폴백, cleanup을 구현하고 테스트해. 자동재생을 우회하지 마.
```

## Phase 9 실행

```text
앞선 핵심 기능과 테스트가 안정적일 때 Phase 9를 구현해. 도부터 높은 도까지 자동 순서 연습, 재생·일시정지·처음으로, 사용자 직접 선택 시 자동 중지, 타이머 cleanup을 구현해. 불안정해지면 기능 수보다 핵심 운지 정확성을 우선해.
```

## Phase 10 실행

```text
Phase 10을 수행해. 키보드 전용 사용, 스크린리더 문구, focus-visible, reduced motion, 터치 영역, 360×800·768×1024·1440×900 반응형, 전체화면/도움말을 점검하고 수정해. 색만으로 상태를 구분하지 말고 모바일 가로 스크롤을 제거해.
```

## Phase 11 실행

```text
Phase 11을 수행해. 데이터·diff·설명 생성·컴포넌트·빠른 입력·파 체계 전환·키보드·모바일 E2E를 완성하고 typecheck, lint, unit test, build, E2E를 실제 실행해. 실패를 숨기지 말고 원인을 수정한 뒤 결과를 보고해.
```

## Phase 12 실행

```text
Phase 12를 수행해. 8개 음과 두 운지 체계를 모두 시각 검수하고 SVG 접촉 좌표, 한국어 문구, 반응형을 다듬어. README, architecture, animation-tuning 문서를 작성하고 디버그 기능을 dev 전용으로 정리해. 최종 검증 명령 결과와 남은 제약을 정확히 보고해.
```

---

# 18. 최종 인수 테스트 표

아래 표를 모두 통과해야 “완료”로 간주한다.

| 항목 | 기대 결과 |
|---|---|
| 1번 도 | T0 L1 L2 L3 R4 R5 R6 R7 모두 닫힘 |
| 2번 레 | R7만 열림 |
| 3번 미 | R6 R7 열림 |
| 4번 바로크식 파 | T0 L1 L2 L3 R4 R6 R7 닫힘, R5 열림 |
| 4번 독일식 파 | T0 L1 L2 L3 R4 닫힘, R5 R6 R7 열림 |
| 5번 솔 | T0 L1 L2 L3 닫힘 |
| 6번 라 | T0 L1 L2 닫힘 |
| 7번 시 | T0 L1 닫힘 |
| 8번 높은 도 | T0 L2만 닫힘 |
| 파 체계 전환 | 바로크→독일에서 R6/R7만 열림 |
| 도→레 | 오른손 새끼손가락만 올라감 |
| 연속 입력 | 마지막 선택의 운지·계이름·오디오만 유지 |
| 엄지 표현 | 0번이 뒷면 인셋에서 동기화됨 |
| 키보드 | 숫자 1–8과 좌우 화살표 작동 |
| 스크린리더 | 선택 음과 막는 구멍을 알림 |
| reduced motion | 긴 손가락 모션 없이 상태 전달 |
| 모바일 | 360px 폭에서 가로 스크롤 없음 |
| 오디오 | 사용자 동작 전에 자동재생하지 않음 |
| 테스트 | typecheck, lint, unit, build, E2E 통과 |

---

# 19. 최종 완료 보고서 템플릿

코딩 에이전트는 전체 작업이 끝나면 다음 형식으로 보고한다.

```text
# 리코더 운지법 배우기 웹앱 완료 보고

## 구현한 핵심 기능
- ...

## 운지 데이터 검증
- 바로크식 파: ...
- 독일식 파: ...
- 높은 도: ...

## SVG/애니메이션 구조
- ...

## 접근성
- ...

## 테스트 결과
- typecheck: 통과/실패
- lint: 통과/실패
- unit: 통과/실패, 테스트 수
- build: 통과/실패
- E2E: 통과/실패, 테스트 수

## 실행 방법
- ...

## 변경한 주요 파일
- ...

## 남아 있는 제약
- ...
```

---

# 20. Definition of Done

다음 조건을 전부 만족해야 한다.

- 실제 브라우저에서 실행된다.
- 1–8 버튼이 정확한 계이름과 연결된다.
- 운지 데이터가 단일 파일에서 관리된다.
- 바로크식/독일식 파 차이가 정확하다.
- 엄지구멍이 뒷면으로 표현된다.
- 양손 손가락이 열린 자세와 닫힌 자세 사이를 실제로 움직인다.
- 현재 운지와 목표 운지의 차이만 움직인다.
- 빠른 연속 입력에 안전하다.
- 오디오가 사용자 제스처 뒤에 재생된다.
- 단계별 보기와 reduced motion을 지원한다.
- 키보드와 스크린리더로 핵심 기능을 사용할 수 있다.
- 모바일·태블릿·데스크톱에서 레이아웃이 안정적이다.
- 타입 검사, 린트, 단위 테스트, 빌드, 핵심 E2E가 통과한다.
- README만 보고 다른 개발자가 실행하고 운지 데이터를 수정할 수 있다.

---

# 21. 구현 우선순위 요약

시간이 부족할 때도 다음 순서는 바꾸지 않는다.

```text
1. 운지 데이터 정확성
2. 앞면/뒷면 구멍 구조
3. 손가락과 구멍의 정확한 접촉
4. 취소 가능한 운지 전환 애니메이션
5. 바로크식/독일식 파 분기
6. 숫자 버튼·계이름·설명 동기화
7. 접근성과 모바일
8. 오디오
9. 자동 연습과 확장 기능
```

화려한 장식보다 **정확한 운지, 이해하기 쉬운 움직임, 안정적인 입력 처리**를 우선한다.

---

# 22. 기반 설계의 핵심 요약

이 프롬프트는 다음 핵심 원칙을 제품 수준의 구현 지시로 확장한 것이다.

1. `숫자 버튼 → 계이름 → 운지 데이터 → SVG 손가락 상태 → 모션 실행`
2. UI 숫자 버튼 1–8과 리코더 구멍 0–7의 분리
3. 바로크식과 독일식 파(F)의 분기
4. 손가락 상태를 `open`, `closed`, `half`, `partial`로 확장 가능하게 설계
5. 현재 운지와 다음 운지의 차이만 애니메이션
6. 일반·느리게·단계별 학습 모드
7. 오디오와 한국어 설명을 손가락 contact 시점에 연동
8. 모바일과 태블릿을 포함한 교육 현장 대응

## 참고 링크

- Yamaha, Recorder fingering guide: https://www.yamaha.com/en/musical_instrument_guide/recorder/play/play002.html
- Mollenhauer, Recorder fingerings: https://www.mollenhauer.com/en/catalog/recorders/recorder-fingerings
