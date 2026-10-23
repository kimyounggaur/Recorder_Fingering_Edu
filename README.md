# 리코더 운지법 배우기

소프라노 리코더의 **17개 고유 음높이**를 손 포즈 애니메이션과 구멍 지도로 배우는 한국어 웹앱입니다. 기보는 C4–G5, 기본 실음은 한 옥타브 높은 C5–G6입니다. 낮은 8음·높은 5음·반음 5음에 높은 도가 중복되어 선택 버튼은 18개입니다. 바로크식·독일식의 파, 파♯, 높은 파를 구분합니다.

## 기능과 화면

선생님이 수업 중 운지를 크게 보여 줄 수 있도록 메인은 **손가락 학습 무대 · 지금 배울 음 · 학습 설정** 세 영역으로 구성합니다. 학습 설정에는 운지 체계, 보기 속도, 소리 높이만 기본 표시하고 비교해 보기와 다시 보기를 제공합니다. 그 밖의 기능은 다음 상위·하위 메뉴에서 엽니다.

넓은 화면에서는 운지 학습 무대가 왼쪽을 넓게 사용하고, 오른쪽에는 학습 설정과 지금 배울 음이 위아래로 정렬됩니다. 휴대폰에서는 학습 무대 → 학습 설정 → 지금 배울 음 순서로 표시됩니다.

| 상위 메뉴 | 하위 메뉴 |
|---|---|
| 음 선택 | 낮은 계이름 · 높은 계이름 · 반음 |
| 수업 도구 | 수업 모드 · 연습 코스 · 손가락 안내 |
| 학습 자료 | 기초 배우기 · 운지 체계 비교 · 퀴즈 |
| 환경 설정 | 화면·소리 설정 · 리코더 체계 안내 · 도움말 |

[메인 화면 미리보기](docs/screenshots/teacher/main.png) · [모바일 화면 미리보기](docs/screenshots/teacher/mobile.png)

처음 접속할 때 체계 선택 안내를 자동으로 띄우지 않습니다. 필요한 때 **환경 설정 → 리코더 체계 안내**에서 확인할 수 있습니다. 구멍 번호·손가락 이름·단계별 보기·고대비·음소거·초기화 등 기존 기능도 메뉴에서 계속 사용할 수 있습니다.

| 경로 | 내용 |
|---|---|
| `/` | 20개 정렬 포즈, 8구멍 상태, 높은음자리표+8, 단계별 보기, 음 재생, 설정 |
| `/compare` | 파·파♯·높은 파의 두 체계 비교와 선택한 체계로 학습 복귀 |
| `/quiz` | 계이름 맞히기·구멍 막기 퀴즈, 10문제, 교차 체계 정답, 오답 복습 |
| `/basics` | 자세·잡는 법·입 모양·텅잉·손가락 위치 5카드, 80bpm 텅잉 연습 |

- 왼손·오른손·낮은 계이름·높은 계이름·반음·한 옥타브 반의 6코스, 자동/수동, 일시정지와 완주.
- 수업 모드 확대 화면과 원래 선택 복원, 고대비 테마, 모션 감소, 키보드·스크린리더 지원.
- 기본 실음과 기보 높이 선택. 소리는 실제 녹음이 아닌 Web Audio **합성 연습음**입니다.
- PWA 설치, 첫 온라인 방문 뒤 오프라인 학습, 사용자 선택 업데이트.
- 이미지 우클릭·드래그 저장을 억제합니다. 개발자 도구·화면 캡처 등을 통한 복사까지 막는 DRM은 아닙니다.

## 실행

Node.js **22.13.0 이상**, npm과 Git이 필요합니다. 앱 기능에는 데이터베이스나 비밀 환경 변수가 필요하지 않습니다.

```bash
npm ci
npm run dev
```

터미널에 표시된 로컬 주소를 엽니다. 지정 포트로 실행하려면 `npm run dev -- --hostname 127.0.0.1 --port 4173`을 사용합니다.

```bash
npm run build
npm run start
```

`build`는 vinext/Cloudflare, `build:vercel`은 Nitro/Vercel 산출물을 만듭니다. Next.js App Router 16, React 19, TypeScript 5, Vite 8 기반이며 설치 버전은 `package-lock.json`으로 고정합니다.

## 검증

```bash
npx playwright install chromium webkit
npm run typecheck
npm run lint
npm test
npm run build
npm run build:vercel
npm run test:e2e
```

`node scripts/verify-phase.mjs p13`으로 위 여섯 검증을 순서대로 실행하고 `output/verification/p13/`에 로그를 저장할 수도 있습니다. 테스트는 4173 개발 서버와 4174 프로덕션 미리보기를 자동으로 시작합니다. 4174 포트는 비워 두세요.

전체 E2E는 Desktop Chromium, iPhone 14 WebKit(390×844), Pixel 7 Chromium을 실행합니다. SW 오프라인 검사는 Chromium만, 20장 시각 기준선은 Windows Desktop Chromium만 검사합니다. Windows WebKit에는 AudioContext가 없어 오디오 오류 폴백만 검사하며 실제 iOS 음 재생 검사를 대신하지 않습니다.

외부 서버 기능 검사 예시(PowerShell):

```powershell
$env:PLAYWRIGHT_BASE_URL='https://your-preview.example'
npx playwright test e2e/recorder-learning.spec.ts --project=chromium
Remove-Item Env:PLAYWRIGHT_BASE_URL
```

이 설정은 자동 서버 시작을 끕니다. `offline.spec.ts`는 재현 가능한 로컬 4174를 사용하므로 외부 URL 검사 명령에 포함하지 않습니다. GitHub Actions는 main push/PR에서 Node 22, 두 빌드와 Chromium E2E를 검사합니다.

## 단축키

| 키 | 동작 |
|---|---|
| `1`–`8` | 활성 음역의 음. 높은 음/반음에서는 1–5만 사용 |
| `Ctrl+1`–`Ctrl+8` | 활성 탭과 무관하게 낮은 계이름 |
| `Shift+1`–`Shift+5` | 높은 계이름 |
| `Alt+1`–`Alt+5` | 반음 |
| `←` / `→` | 현재 음역의 이전/다음 |
| `Space` | 현재 음 재생. 일반 화면의 버튼 포커스에서는 해당 버튼 실행 |
| `T` | 수업 모드 진입/종료 |
| `Esc` | 열린 메뉴·대화상자 닫기, 또는 수업 모드 종료·원래 상태 복원 |
| 수업 중 `S` / `M` / `C` | 속도 전환 / 음소거 / 코스 시작·중지 |
| `Tab` / `Shift+Tab` | 포커스 이동. 도움말 안에서는 순환 |
| 퀴즈 중 `1`–`4` | 계이름 맞히기 선택지 |

입력 필드·IME 조합 중이거나 메뉴·대화상자가 열려 있으면 배경 학습 단축키가 동작하지 않습니다. 운영체제/브라우저가 Ctrl/Alt 숫자키를 먼저 처리할 수 있으므로 **음 선택** 메뉴의 음역과 버튼을 함께 제공합니다.

## 저장되는 설정

현재 브라우저의 `recorder-learning.preferences.v1` 키에 허용된 **12개 필드만** 저장합니다. 퀴즈 점수·오답·연습 이력·계정 정보는 저장하지 않습니다.

| 필드 | 기본값과 역할 |
|---|---|
| `fingeringSystem` | `baroque`, 바로크식/독일식 |
| `isMuted` | `false`, 음소거 |
| `speed` | `normal`, 보통/느리게 |
| `showHoleNumbers` | `true`, 구멍 번호 |
| `onboardingCompleted` | `false`, 첫 안내 완료 |
| `pitchMode` | `sounding`, 실음/기보 높이 |
| `stepMode` | `false`, 단계별 보기 |
| `showFingerNames` | `false`, 손가락 이름 |
| `lastCourseId` | `lowScale`, 마지막 코스 |
| `courseIntervalMs` | `1500`, 1200–3000ms, 100ms 간격 |
| `courseMode` | `auto`, 자동/수동 |
| `theme` | `default`, 기본/고대비 |

설정 초기화는 온보딩 완료 여부만 보존합니다. localStorage가 차단되어도 메모리 상태로 학습할 수 있습니다. 수업 종료는 음·음역·체계·속도·단계 상태·포커스를 복원하고 테마/음소거 변경은 유지합니다.

## PWA 설치와 업데이트

HTTPS 배포본에서 브라우저의 설치 메뉴를 사용합니다. iOS에서는 Safari 공유 메뉴의 홈 화면 추가를 사용합니다. 최초 온라인 방문에서 서비스 워커 준비와 자산 저장을 마친 뒤 오프라인으로 전환하세요.

20개 포즈, 4개 경로, 아이콘·매니페스트와 실제 JS/CSS를 빌드 시 사전 캐시합니다. 새 워커는 바로 이전 화면을 강제 교체하지 않고 “새 버전이 준비되었어요”의 새로 고침 선택을 기다립니다. 개발 모드에서는 워커를 등록하지 않습니다. 브라우저의 저장 공간 정리·비공개 모드·인증 만료는 오프라인 사용을 제한할 수 있습니다.

매니페스트에는 실제 192/512 PNG, 화면 이미지, 6개 바로가기가 있습니다. PWABuilder의 파일 처리·프로토콜 처리·위젯 등 보라색 항목은 선택 기능이므로 실제 기능 없이 선언만 추가하지 않습니다.

## 배포와 Android TWA

GitHub main에 연결된 Vercel 배포의 빌드 명령은 `npm run build:vercel`입니다. `.openai/hosting.json`의 Sites 배포는 Cloudflare 빌드를 사용합니다. 공개 Vercel과 소유자 전용 Sites는 접근 대상이 다르므로 배포 시 기존 접근 정책을 유지합니다.

1. 전체 검증과 배포를 완료합니다.
2. 배포 도메인의 `/.well-known/assetlinks.json`이 HTTP 200, JSON이며 로그인/리다이렉트 없이 응답하는지 확인합니다.
3. `public/.well-known/assetlinks.json`의 패키지 `app.vercel.recorder_fingering_edu.twa`와 Play Console 앱 서명 인증서 SHA-256을 대조합니다. 업로드 키 지문과 Play 앱 서명 키 지문을 혼동하지 않습니다.
4. 도메인·패키지를 실제 TWA 설정과 일치시키고 외부 보관 키로 패키지를 서명합니다. Play 내부 테스트에 배포해 실제 Android에서 주소창 제거와 오프라인 재실행을 확인합니다.
5. 실제 iOS Safari에서도 최초 사용자 클릭 후 음 재생·다시 열기를 확인합니다.

```bash
curl -i https://recorder-fingering-edu.vercel.app/.well-known/assetlinks.json
```

공개 연결 JSON은 두 산출물 `dist/client/.well-known/`, `.vercel/output/static/.well-known/`에 복사됩니다. 키스토어·비밀번호·APK/AAB는 저장소에 넣지 않습니다. 이 작업 공간의 기존 서명 파일은 프로젝트 밖 `../_release-secrets/recorder-fingering/`에 보관합니다. 소유자 인증이 필요한 Sites 주소는 공개 TWA 검증 도메인으로 사용하지 않습니다.

## 데이터와 자산 수정

| 위치 | 책임 |
|---|---|
| `src/features/recorder/model/types.ts` | 음·음역·체계·8개 HoleId 타입 |
| `data/noteMeta.ts` | 17개 ID, 8/5/5 탭, 기보/실음·오선 위치·라벨 |
| `data/fingerings.ts` | 2체계 × 17음 × 8구멍의 정확한 상태 |
| `data/poseAssets.ts` | 20개 포즈 파일 매핑 |
| `data/practiceCourses.ts` | 6개 코스의 순서와 음역 |
| `audio/WebAudioRecorderEngine.ts` | 두 피치 모드와 오디오 키 |
| `audio/recorderTimbre.ts` | 배음·치프·어택·비브라토 |
| `utils/buildInstruction.ts` | 데이터 기반 한국어 안내 |
| `src/features/quiz/scoring.ts` | 선택지·문제 생성과 구멍별 채점 |
| `src/features/basics/` | 기초 문구·그림·텅잉 |

축약 경로는 `src/features/recorder/` 아래입니다. `FINGERING_STATES`의 `open/closed/half/partial`이 정답입니다. `FINGERINGS`는 열린 구멍을 제외한 접촉 애니메이션용 파생 배열이므로 half/partial 판정에 쓰지 않습니다.

새 음은 [설계서 부록 A 계약](<리코더_웹앱_개선보완_바이브코딩_프롬프트_v3(Fable51).md#부록-a-새-음-추가-계약-체크리스트>) 전체를 같은 변경에서 충족해야 합니다. 출처 두 곳의 일치와 엄지 상태가 확인되기 전에는 추측한 음을 추가하지 않습니다. 이번 릴리스의 신규 음은 0개입니다.

포즈는 모두 976×1360, 동일 크롭 창과 악기 위치를 유지합니다. [20개 자산 매핑](public/fingering/poses/README.md)과 [시각 회귀 갱신 절차](docs/animation-tuning.md)를 따르세요. 원본 `02 Fingering`을 콘텐츠 경계로 자동 크롭하지 않습니다. 오디오 샘플 교체는 [라이선스·엔진 계약](public/audio/recorder/README.md)을 확인하세요.

## 결과와 제약

- [구조와 취소 모델](docs/architecture.md)
- [단계별 구현·검증 기록](docs/implementation-v3.md)
- [v3 인수 결과와 4개 화면](docs/acceptance-v3.md)
- [미사용 11개 자산 조사·음역 확장 보류](docs/range-investigation.md)
- [변경 이력](CHANGELOG.md)

기존 17음과 운지는 유지했습니다. 높은 라 이상·높은 반음 확장은 검증 자료 부족으로 보류했습니다. 실제 녹음·마이크 음정 인식·계정 동기화는 제공하지 않습니다. iOS Safari/Android TWA 실기기와 실물 프로젝터 검수는 자동 테스트와 구분해 인수 문서에 남깁니다. 전체화면 거절 시 동일한 수업 레이아웃을 제공합니다.

next/font의 실제 로드가 vinext에서 확인되지 않아 한국어 시스템 폰트를 사용합니다. 개발 HMR의 multiple-renderers 경고와 개발 도구 의존성 보안 경고는 남아 있으며, 프로덕션 의존성 audit는 0건입니다. 수치는 검사 시점의 결과이며 [인수 문서](docs/acceptance-v3.md)에 범위를 기록합니다.
