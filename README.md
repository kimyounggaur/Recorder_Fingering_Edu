# 리코더 운지법 배우기

숫자 버튼과 양손 SVG 애니메이션으로 소프라노 리코더의 기본 8음(도, 레, 미, 파, 솔, 라, 시, 높은 도)을 배우는 반응형 웹앱입니다. 바로크식과 독일식을 선택할 수 있고, 현재 운지와 다음 운지의 차이만 움직여 어떤 손가락을 떼거나 눌러야 하는지 보여 줍니다.

주요 기능은 다음과 같습니다.

- 앞면 1–7번 구멍과 뒷면 0번 엄지구멍을 한 SVG 장면에서 표시
- 바로크식/독일식 파 운지 분기
- 보통/느리게/단계별 애니메이션, 빠른 연속 입력 취소
- 음 재생, 음소거, 도부터 높은 도까지 자동 순서 연습
- 숫자 키 1–8, 좌우 화살표, 스페이스바 지원
- 스크린리더 라이브 영역과 `prefers-reduced-motion` 지원
- 360px 모바일부터 태블릿·데스크톱까지 반응형 레이아웃

현재 재생되는 소리는 실제 리코더 녹음이 아니라 Web Audio로 만든 짧은 **합성 연습음**입니다. 샘플 교체 방법은 [오디오 안내](public/audio/recorder/README.md)를 참고하세요.

## 기술 스택과 요구 사항

- Node.js `>=22.13.0` (`package.json`의 `engines` 기준)
- npm 10 이상 권장(Node.js 22에 포함된 npm 사용 권장)
- Next.js App Router 16, React 19, TypeScript 5
- vinext/Vite와 Cloudflare Workers 런타임
- Vitest, Testing Library, Playwright

의존성 버전 재현을 위해 `package-lock.json`과 `npm ci`를 사용합니다.

## 설치와 실행

```bash
npm ci
npm run dev
```

터미널에 표시되는 로컬 주소를 엽니다. 기본 주소는 `http://localhost:3000`이며, 포트가 사용 중이면 3001처럼 다음 포트가 자동 선택될 수 있습니다.

프로덕션 빌드를 로컬에서 확인하려면 다음 명령을 사용합니다.

```bash
npm run build
npm run start
```

처음 E2E 테스트를 실행하는 컴퓨터에서는 Chromium을 한 번 설치합니다.

```bash
npx playwright install chromium
```

## 품질 검증 명령

| 목적 | 명령 |
|---|---|
| TypeScript 타입 검사 | `npm run typecheck` |
| ESLint | `npm run lint` |
| Vitest 단위·컴포넌트 테스트 | `npm test` |
| Vitest 감시 모드 | `npm run test:watch` |
| 프로덕션 빌드 | `npm run build` |
| Playwright Chromium E2E | `npm run test:e2e` |

최종 제출 전에는 아래 순서로 모두 실행합니다.

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

E2E는 기본적으로 `http://127.0.0.1:4173`에 개발 서버를 자동으로 띄웁니다. 이미 실행 중인 서버를 검사하려면 `PLAYWRIGHT_BASE_URL`을 지정할 수 있습니다.

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npm run test:e2e
```

PowerShell에서는 `$env:PLAYWRIGHT_BASE_URL='http://127.0.0.1:3000'`을 먼저 실행합니다.

## 사용 방법

1. 처음 열었을 때 사용하는 리코더의 운지 체계를 선택합니다.
2. 화면의 1–8 버튼이나 키보드 숫자 1–8로 음을 선택합니다.
3. 손가락이 올라간 뒤 필요한 구멍으로 내려가는 과정을 관찰합니다.
4. 학습 설정에서 속도, 단계별 보기, 소리, 구멍 번호, 손가락 이름을 조절합니다.
5. `이전`/`다음`, `다시 보기`, `음 재생`, `순서 연습 시작`으로 반복 연습합니다.

키보드 단축키는 다음과 같습니다.

| 키 | 동작 |
|---|---|
| `1`–`8` | 해당 음 선택 |
| `←` / `→` | 이전/다음 음(끝에서 순환) |
| `Space` | 현재 음 재생(일반 화면 포커스일 때) |
| `Tab`, `Shift+Tab` | 모든 조작 요소 사이 이동 |
| `Enter`, `Space` | 포커스된 버튼 또는 스위치 실행 |

## 두 종류의 숫자

이 앱에는 서로 다른 숫자 체계가 있으므로 데이터 수정 시 섞지 않아야 합니다.

- **UI 버튼 1–8:** 도부터 높은 도까지 여덟 음을 선택하는 번호입니다.
- **물리 구멍 0–7:** `T0`, `L1`, `L2`, `L3`, `R4`, `R5`, `R6`, `R7`에 대응합니다. 0번은 뒷면 왼손 엄지구멍입니다.

## 바로크식과 독일식 파의 차이

기본 8음 중 파만 두 체계의 운지가 다릅니다.

| 체계 | 막는 구멍 | 여는 구멍 | 기억법 |
|---|---|---|---|
| 바로크식 파 | `T0 L1 L2 L3 R4 R6 R7` | `R5` | 5번만 엽니다. |
| 독일식 파 | `T0 L1 L2 L3 R4` | `R5 R6 R7` | 4번까지 막습니다. |

바로크식 파에서 독일식 파로 전환하면 `R6`, `R7`만 추가로 열립니다. 파 이외의 일곱 음은 현재 데이터에서 두 체계가 같습니다.

## 운지와 문구 데이터 수정

운지 배열을 컴포넌트 JSX에 직접 추가하지 않습니다. 데이터의 역할은 다음과 같이 나뉩니다.

| 파일 | 역할 |
|---|---|
| `src/features/recorder/model/types.ts` | `SolfegeId`, `HoleId`, 운지 체계와 상태 타입 |
| `src/features/recorder/data/fingerings.ts` | `FINGERINGS`: 음·체계별 닫힌 구멍의 단일 진실 공급원 |
| `src/features/recorder/data/noteMeta.ts` | 버튼 번호, 계이름, 음 이름, 오디오 키, 짧은 설명 |
| `src/features/recorder/utils/buildInstruction.ts` | 닫는 구멍·손가락과 이전 운지 차이를 조합한 한국어 안내 |

새 음을 추가할 때는 타입, `NOTE_ORDER`, `NOTE_META`, 두 체계의 `FINGERINGS`, 오디오 키, 단위/E2E 테스트를 함께 갱신해야 합니다. `ALL_HOLES`의 물리 순서는 애니메이션 diff와 읽기 순서에도 사용되므로 임의로 바꾸지 않습니다.

## SVG 구멍과 손가락 좌표 조정

SVG 장면은 `0 0 1000 1600` 좌표계를 사용합니다.

- 구멍 중심과 크기: `src/features/recorder/data/holeLayout.ts`의 `HOLE_LAYOUT`
- 손가락의 열린/닫힌/반구멍/부분 자세: `src/features/recorder/data/fingerPoses.ts`의 `FINGER_POSES`
- 손가락 길이와 패드 크기: `src/features/recorder/components/Finger.tsx`의 `FINGER_GEOMETRY`
- 장면 조합: `src/features/recorder/components/RecorderScene.tsx`

닫힌 자세의 손가락 패드 중심 `FINGER_POSES[id].closed.x/y`는 반드시 같은 구멍의 `HOLE_LAYOUT[id].x/y`와 일치해야 합니다. 구멍 위치를 옮겼다면 닫힌 자세도 같은 좌표로 옮기고, 열린 자세와 관절 회전을 별도로 다듬습니다. R6과 R7은 두 개의 작은 구멍으로 그려지지만 각각 하나의 논리 상태와 중심 좌표를 사용합니다.

개발 서버에서 URL 끝에 `?debug=1`을 붙이면 좌표 오버레이를 볼 수 있습니다.

```text
http://localhost:3000/?debug=1
```

초록 십자/점은 구멍 중심, 분홍 점은 현재 손가락 패드 중심입니다. 열린·닫힌 자세 박스와 이동선, 현재 phase와 닫힌 구멍 목록도 함께 표시됩니다. 쿼리를 제거하고 새로 고치면 꺼집니다. 세부 튜닝 순서와 타이밍 표는 [애니메이션 튜닝 가이드](docs/animation-tuning.md)에 있습니다.

## 오디오 조정과 샘플 교체

현재 `src/features/recorder/audio/WebAudioRecorderEngine.ts`는 사용자 클릭으로 `AudioContext`를 연 뒤 triangle oscillator를 600–900ms 범위에서 재생합니다. 새 음이 시작되면 이전 음을 짧게 페이드아웃하며, 음소거·연타·언마운트 시 보류된 재생을 취소합니다.

합성음을 조정하려면 같은 파일의 주파수 표와 `durationMs`, `fadeOutMs`, `transitionFadeMs`, gain envelope를 수정합니다. 실제 샘플로 교체하려면 다음 작업이 모두 필요합니다.

1. 라이선스가 확인된 파일을 `public/audio/recorder/`에 둡니다.
2. `RecorderAudioEngine` 인터페이스를 구현하는 샘플 엔진을 작성합니다.
3. `preload()`에서 파일을 가져와 디코딩하고, `play(noteKey)`에서 현재 음을 페이드아웃한 뒤 대응 샘플을 재생합니다.
4. `useRecorderAudio.ts`의 기본 `engineFactory`를 샘플 엔진 팩토리로 바꾸거나 앱에서 주입합니다.
5. 이 저장소의 [음원 라이선스 표](public/audio/recorder/README.md)를 실제 출처와 조건으로 채웁니다.

**파일만 폴더에 복사해도 현재 구현은 자동으로 샘플을 사용하지 않습니다.** 오디오 실패가 운지 학습 화면을 중단하지 않도록 silent fallback과 취소 규약을 유지하세요.

## 접근성

- 문서 언어가 한국어(`lang="ko"`)로 지정되어 있습니다.
- 학습 무대로 바로 이동하는 skip link와 명확한 제목 구조가 있습니다.
- 음 버튼·운지 체계·토글은 기본 HTML 버튼/라디오 컨트롤을 사용합니다.
- 선택 음과 막는 구멍을 `aria-live="polite"` 영역으로 알립니다.
- 리코더 SVG는 음별 `<title>`과 `<desc>`를 제공하고 장식 요소는 스크린리더에서 숨깁니다.
- 모든 핵심 기능을 키보드로 조작할 수 있고 `:focus-visible` 표시가 있습니다.
- 색상뿐 아니라 구멍 채움, 선, 번호, 문구로 상태를 함께 전달합니다.
- 운영체제의 `prefers-reduced-motion: reduce`를 감지하면 손가락 이동을 즉시 반영하고 CSS 모션을 최소화합니다.
- 모바일의 터치 영역과 safe-area를 고려한 레이아웃을 사용합니다.

접근성 구현은 보조 기술·브라우저 조합에 따라 다르게 동작할 수 있으므로 배포 전 실제 키보드와 사용하는 스크린리더로도 점검하세요.

## 배포

이 저장소는 vinext와 Cloudflare Vite 플러그인으로 Cloudflare Worker 번들을 만듭니다. 먼저 전체 검증과 빌드를 통과시킵니다.

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

Cloudflare 계정에 CLI로 배포하는 기본 절차는 다음과 같습니다. Worker 이름은 계정에서 고유한 값으로 바꿀 수 있습니다.

```bash
npx wrangler login
npx vinext deploy --name recorder-fingering-learning-app
```

미리보기 환경은 설치된 vinext CLI가 제공하는 `--preview` 옵션을 사용할 수 있습니다.

```bash
npx vinext deploy --preview --name recorder-fingering-learning-app-preview
```

Codex Sites에서 호스팅할 때는 저장소의 `.openai/hosting.json`과 `build/sites-vite-plugin.ts`가 빌드 산출물 메타데이터를 준비하며, 게시 작업은 Sites 호스팅 워크플로에서 수행합니다. 현재 D1/R2 바인딩은 모두 `null`이고 앱은 서버 데이터베이스나 비밀 환경 변수를 요구하지 않습니다.

일반 정적 파일 호스팅에 `dist/`만 임의로 복사하는 방식보다 Cloudflare Worker/vinext를 지원하는 배포 경로를 사용하세요. 배포 후에는 1–8 입력, 바로크↔독일식 파 전환, 소리 버튼, 360px 화면, 콘솔 오류를 다시 확인합니다.

## 설계 문서

- [아키텍처](docs/architecture.md): 데이터 → 앱 상태 → 애니메이션/SVG/오디오 흐름과 취소 모델
- [애니메이션 튜닝](docs/animation-tuning.md): `HOLE_LAYOUT`, `FINGER_POSES`, 타이밍을 안전하게 조정하는 방법
- [오디오 샘플과 라이선스](public/audio/recorder/README.md)

## 알려진 제약

- 기본 8개 자연음만 지원합니다. 반음, 높은 레, 실제 반구멍/부분 막기 데이터는 아직 연결되어 있지 않습니다.
- 현재 오디오는 실제 리코더 샘플이 아닌 단일 triangle oscillator 합성음이며, 코드의 주파수 범위도 `C4`–`C5`입니다.
- 브라우저 자동재생 정책 때문에 소리는 반드시 사용자 동작 뒤에 활성화됩니다. 오디오 장치·권한·임베디드 환경에 따라 소리가 나지 않아도 시각 학습은 계속됩니다.
- 설정은 로그인 없이 현재 브라우저 `localStorage`에만 저장됩니다. 단계별 보기와 손가락 이름은 새로 고침 뒤 유지되지 않습니다.
- 오프라인 PWA, 마이크 음정 인식, 계정 동기화는 구현되어 있지 않습니다.
- 자동 E2E 프로젝트는 현재 Chromium 한 종류이며, 좌표의 시각적 접촉 품질은 `?debug=1`과 실제 브라우저 검수가 필요합니다.
- 전체화면은 브라우저 또는 임베디드 프레임 정책에 의해 거부될 수 있습니다.
- `?debug=1` 좌표 오버레이는 개발 빌드에서만 활성화되며 프로덕션 배포에서는 쿼리를 붙여도 표시되지 않습니다.
