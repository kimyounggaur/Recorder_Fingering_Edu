# Changelog

이 문서는 Keep a Changelog 형식과 Semantic Versioning을 따른다.

## [0.2.0] - 2026-09-07

### Added

- 자동/수동 연습 코스 6종, 바로크식·독일식 비교 화면.
- 10문제 퀴즈 2종과 교차 체계 채점·오답 복습.
- 기초 배우기 5카드, 80bpm 텅잉, 수업 확대 모드와 고대비.
- 실음/기보 피치 선택과 12개 설정 저장.
- 오프라인 자산 사전 캐시, 사용자 선택 SW 업데이트, 공개 TWA 연결 파일.
- 3브라우저 프로젝트, axe, 포즈 시각 회귀 20장, GitHub Actions.

### Changed

- 소프라노 리코더 기본 실음을 C5–G6로 보정하고 배음·치프 합성음을 적용.
- 학습 화면 상태를 소유권별 훅으로 분리하고 활성 뱅크 우선 이미지 로딩.
- 키패드 첫 화면 배치, 단일 범례, 명시적 한국어 시스템 폰트.
- Next/React/Vite와 호환 패치 의존성 갱신.

### Fixed

- 오선보 C4 덧줄·높은음자리표+8, 활성 탭 숫자키 불일치.
- 설정 미저장, 빠른 입력의 이미지 요청 취소, 오디오·연습 타이머 정리.
- 모바일 대비, 포즈 프레임 높이 흔들림, WebKit 도움말 포커스 복원.
- lint 산출물 검사, Worker 이미지 바인딩 누락, 두 출력의 assetlinks 복사.

### Security

- 서명 키·비밀번호·배포 패키지를 프로젝트 밖으로 분리하고 Git에서 제외.
- 프로덕션 의존성 audit 0건. 개발 도구 의존성의 남은 경고는 인수 문서에 명시.

### Deferred

- 높은 라 이상·높은 반음: 두 출처 일치 및 엄지 상태 미확정으로 기존 17음 유지.
- 실제 iOS Safari, Android TWA, 스피커 음색·프로젝터 검수는 자동 테스트로 대체하지 않음.
- vinext 개발 HMR multiple-renderers 경고.

## [0.1.0] - 2026-07-28

### Added

- 17음, 3분류 탭, 바로크식·독일식 운지와 20개 정렬 손 포즈.
- 단계별 애니메이션·합성 연습음·기본 PWA 매니페스트와 설치 아이콘.

[0.2.0]: https://github.com/kimyounggaur/Recorder_Fingering_Edu
[0.1.0]: https://github.com/kimyounggaur/Recorder_Fingering_Edu/commit/62525dd93b235b555d8052508d752e95744cb8b2
