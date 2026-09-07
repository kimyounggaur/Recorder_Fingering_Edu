# v3 단계별 개발 기록

설계 기준: `리코더_웹앱_개선보완_바이브코딩_프롬프트_v3(Fable51).md`.
사용자 요청에 따라 기술 선택과 각 단계 진행은 별도 승인 질문 없이 수행한다.
실제 실행 결과만 완료로 기록하며, 실기기 검증과 출처가 모호한 운지는 따로 표시한다.

## P0 진행 기록

- Git 기준선 `6ef85a9` 생성. 기존 임시 클론 원격은 `https://github.com/kimyounggaur/Recorder_Fingering_Edu.git`.
- 서명 파일 및 Play 패키지 폴더를 Git에서 제외하고, 키 두 파일을 프로젝트 상위 `_release-secrets/recorder-fingering/`에 보관했다. 파일 내용은 출력하지 않았다. 기존 클론의 추적 파일에는 서명 키가 없었다. 과거 전체 원격 이력은 아직 검사하지 않았다.
- 기존 임시 클론은 상위 `_recorder-development-archive/`로 이동했고 이동된 Git 상태는 깨끗하다. 원래 위치에 남은 빈 `.git` 폴더 삭제는 자동 승인 검토에 차단되었다. `tmp/`는 Git·ESLint·TypeScript에서 제외한다.
- 미사용 SVG 리그 8개 파일(1,596줄), 미사용 인증 파일(86줄), 전용 CSS 52줄, 중복 OG 이미지, 빈 스타터 폴더를 정리했다. 전환 강조 유틸은 `animation/holeTransition.ts`로 이동했고 실제 앱의 운지 배열은 바꾸지 않았다.
- OG 이미지는 1730×909를 유지하며 137,680바이트로 압축했다. 메타데이터는 17음 범위로 맞췄다.
- 이미지 최적화용 Worker 바인딩이 없을 때 기본 핸들러로 넘기도록 보완했다.
- E2E 최초 두 실행에서 10ms 연타 중 숨겨진 대체 이미지의 요청 취소가 관측됐다. 캔버스가 준비된 뒤 대체 이미지가 완료된 포즈를 사용하도록 수정했다. 기존 테스트는 변경하지 않았다.
- 전체 검증 로그: `output/verification/p0/`. 화면 캡처: `output/screenshots/p0/` (1440·760·470·360·844 가로).
- 1440×900에서 온보딩 포함 키패드 y=1200.4px로 첫 화면 밖에 있다. P2에서 배치 조정 대상으로 확인했다.
- 기존 `.wrangler/codex-dev.err.log`에 multiple-renderers 경고가 있으나 이번 서버 출력에서는 재현되지 않았다.

각 단계의 검증은 `node scripts/verify-phase.mjs pN`으로 여섯 명령을 순차 실행하고 실제 결과·소요 시간·로그를 저장한다.

### P0 검증 완료

typecheck 통과 / lint 오류 0·경고 0 / unit 109 통과·0 실패 / build 통과 / build:vercel 통과 / Chromium E2E 10 통과·0 실패. 기존 테스트 변경 0건. 해소: D-01(로컬 보호), D-03, D-09~D-12, D-22. D-23은 로그에 재현 여부 기록.

## P1 보고

- 높은음자리표 SVG와 8 기호, `106 - step*7` 좌표, 덧줄, 위/아래 기둥과 이명동음 캡션을 구현했다. SVG 음표 회전은 머리 중심 기준으로 보정했다.
- 기본 실음 C5–G6와 기보 높이 옵션, 1000Hz 이상 보호 게인, NOTE_META 실음 표기를 추가했다. 기존 운지 데이터 변경 없음.
- 저장 필드 6개. 소리 높이 변경 시 오디오 엔진·보류 unlock을 세대 번호로 무효화한다.
- typecheck 통과 / lint 오류 0·경고 0 / unit 117 통과·0 실패 / build 통과 / build:vercel 통과 / Chromium E2E 10 통과·0 실패.
- 캡처: `output/screenshots/p1/`의 도·높은 도·도♯·높은 솔 및 360×800·844×390·1440×900.
- 해소: D-04, D-05. 음색 개선은 P4에서 진행한다.

## P2 보고

- 수정자 없는 숫자키는 활성 탭, Ctrl/Shift/Alt는 고정 음역을 선택한다. 탭 자체가 처리한 화살표는 전역 선택에서 다시 처리하지 않는다.
- 단계별 보기·손가락 이름까지 8개 설정을 저장한다. 저장된 단계 모드는 idle에서 시작하고 초기화는 온보딩 완료 여부를 보존한다.
- 범례는 장면 카드 하단 하나로 통일했다. 모바일 헤더는 아이콘과 접근 가능한 라벨을 분리했다.
- 데스크톱 오른쪽 위에 키패드를 배치했다. 1440×900의 장면 크기 622.5×806.6px는 기존과 같다. 1366×768에서 키패드 y=182.7, 높이=518.8, 하단=701.5px로 모든 음 버튼이 첫 화면 안에 있다.
- typecheck 통과 / lint 오류 0·경고 0 / unit 120 통과·0 실패 / build 통과 / build:vercel 통과 / Chromium E2E 통과. 캡처 `output/screenshots/p2/`.
- 해소: D-06~D-08(자동 연습은 안내 문구만), D-14, D-19, D-26.

## P3 보고

- 공개 Android 인증 지문을 원본 assetlinks에서 복사했다. Cloudflare `dist/client/.well-known/assetlinks.json`과 Nitro `.vercel/output/static/.well-known/assetlinks.json` 모두 생성된다.
- 포즈 20장과 아이콘·매니페스트, 빌드된 JS·CSS·폰트를 사전 캐시한다. Git SHA+시각 버전, 사용자 선택 업데이트 토스트, narrow 스크린샷을 추가했다.
- 첫 오프라인 검사에서 Cloudflare 정적 서버의 `Vary: Origin` 때문에 모듈 스크립트 캐시가 일치하지 않았다. 같은 출처의 공개 정적 파일에만 `ignoreVary`를 적용해 해결했다. 내비게이션 캐시 정책은 따로 유지한다.
- typecheck 통과 / lint 오류 0·경고 0 / unit 122 통과·0 실패 / build 통과 / build:vercel 통과 / Chromium E2E 12 통과·0 실패. 오프라인 새로 고침 뒤 세 탭 18개 버튼을 실제 순회했다.
- 해소: D-02(배포 산출물), D-13. 실제 배포 URL·Android 주소창 제거·iOS 실기기 검증은 P13에서 별도 기록한다.
