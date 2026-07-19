# 리코더 운지법 배우기

숫자 버튼과 실제 손 모양 운지 애니메이션으로 소프라노 리코더의 기본 8음(도, 레, 미, 파, 솔, 라, 시, 높은 도)을 배우는 반응형 웹앱입니다. `02 Fingering` 원본에서 만든 정렬된 고해상도 포즈와 기능형 SVG 구멍 지도를 함께 보여 주며, 바로크식과 독일식 파 운지를 모두 지원합니다.

주요 기능은 다음과 같습니다.

- 음이 바뀔 때 현재 화면에서 다음 완성 포즈로 부드럽게 전환
- 앞면 1–7번과 뒷면 0번 엄지구멍을 기능형 SVG 지도에서 표시
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
3. 실제 손 모양 포즈와 오른쪽 구멍 지도의 떼기·막기 변화를 함께 관찰합니다.
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
| `src/features/recorder/data/poseAssets.ts` | 음·체계별 고해상도 손 포즈 파일 매핑 |
| `src/features/recorder/utils/buildInstruction.ts` | 닫는 구멍·손가락과 이전 운지 차이를 조합한 한국어 안내 |

새 음을 추가할 때는 타입, `NOTE_ORDER`, `NOTE_META`, 두 체계의 `FINGERINGS`, 포즈 PNG와 `poseAssets.ts`, 오디오 키, 단위/E2E 테스트를 함께 갱신해야 합니다. `ALL_HOLES`의 물리 순서는 애니메이션 diff와 읽기 순서에도 사용되므로 임의로 바꾸지 않습니다.

## 손 포즈와 구멍 지도 조정

- 웹용 포즈: `public/fingering/poses/*.png`
- 음·체계별 매핑: `src/features/recorder/data/poseAssets.ts`
- 포즈 전환: `src/features/recorder/components/RecorderPoseStage.tsx`
- 기능형 구멍 지도: `src/features/recorder/components/RecorderFingeringMap.tsx`
- 전체 장면 조합: `src/features/recorder/components/RecorderScene.tsx`

모든 포즈는 같은 `976×1360` 프레임과 악기 위치를 사용해야 합니다. 그래야 음을 빠르게 바꿔도 악기가 튀지 않고 현재 화면의 혼합 프레임에서 자연스럽게 다음 포즈로 이어집니다. 바로크식·독일식은 파 포즈만 다르고 나머지 일곱 음은 파일을 공유합니다. 소스 매핑과 검수 절차는 [애니메이션 튜닝 가이드](docs/animation-tuning.md)를 참고하세요.

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
- 손 포즈·구멍 지도 장면은 음별 접근성 이름과 설명을 제공하고 장식 요소는 스크린리더에서 숨깁니다.
- 모든 핵심 기능을 키보드로 조작할 수 있고 `:focus-visible` 표시가 있습니다.
- 색상뿐 아니라 구멍 채움, 선, 번호, 문구로 상태를 함께 전달합니다.
- 운영체제의 `prefers-reduced-motion: reduce`를 감지하면 목표 포즈를 즉시 반영하고 CSS 모션을 최소화합니다.
- 모바일의 터치 영역과 safe-area를 고려한 레이아웃을 사용합니다.

접근성 구현은 보조 기술·브라우저 조합에 따라 다르게 동작할 수 있으므로 배포 전 실제 키보드와 사용하는 스크린리더로도 점검하세요.

## 배포

GitHub `main` 브랜치는 연결된 Vercel 프로젝트에 자동 배포됩니다. 게시 전에 전체 검증과 Vercel용 빌드를 통과시킵니다.

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run build:vercel
npm run test:e2e
```

`npm run build`는 vinext/Cloudflare 호환 번들도 계속 검증합니다. 앱은 서버 데이터베이스나 비밀 환경 변수를 요구하지 않습니다. 배포 후에는 1–8 입력, 바로크↔독일식 파 전환, 소리 버튼, 360px 화면과 브라우저 오류를 다시 확인합니다.

## 설계 문서

- [아키텍처](docs/architecture.md): 데이터 → 앱 상태 → 포즈/구멍 지도/오디오 흐름과 취소 모델
- [애니메이션 튜닝](docs/animation-tuning.md): 정렬된 포즈, 캔버스 전환과 구멍 지도 타이밍 조정 방법
- [오디오 샘플과 라이선스](public/audio/recorder/README.md)

## 알려진 제약

- 기본 8개 자연음만 지원합니다. 반음, 높은 레, 실제 반구멍/부분 막기 데이터는 아직 연결되어 있지 않습니다.
- 현재 오디오는 실제 리코더 샘플이 아닌 단일 triangle oscillator 합성음이며, 코드의 주파수 범위도 `C4`–`C5`입니다.
- 브라우저 자동재생 정책 때문에 소리는 반드시 사용자 동작 뒤에 활성화됩니다. 오디오 장치·권한·임베디드 환경에 따라 소리가 나지 않아도 시각 학습은 계속됩니다.
- 설정은 로그인 없이 현재 브라우저 `localStorage`에만 저장됩니다. 단계별 보기와 손가락 이름은 새로 고침 뒤 유지되지 않습니다.
- 오프라인 PWA, 마이크 음정 인식, 계정 동기화는 구현되어 있지 않습니다.
- 자동 E2E 프로젝트는 현재 Chromium 한 종류이며, 손 포즈의 시각적 품질은 실제 브라우저 검수가 필요합니다.
- 전체화면은 브라우저 또는 임베디드 프레임 정책에 의해 거부될 수 있습니다.
