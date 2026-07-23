# 리코더 오디오 샘플과 라이선스

이 디렉터리는 향후 로컬 리코더 샘플을 둘 자리입니다. **현재 저장소에는 녹음 샘플이 없으며 이 README 외의 오디오 파일을 사용하지 않습니다.** 앱의 기본 소리는 `src/features/recorder/audio/WebAudioRecorderEngine.ts`가 브라우저에서 실시간으로 만드는 임시 합성 연습음입니다. 세 개의 sine 배음과 짧은 band-pass 치프, 미세한 진폭 변화를 조합하지만 실제 리코더 녹음은 아닙니다. 따라서 현재 오디오 자산에 별도 제3자 음원 라이선스나 저작자 표시는 없습니다.

## 현재 오디오 키

`src/features/recorder/data/noteMeta.ts`가 앱에서 사용하는 `audioKey`를 정하고, `src/features/recorder/audio/frequencies.ts`의 `RECORDER_AUDIO_KEY_TO_PITCH`가 다음 피치 키로 정규화합니다.

| 계이름 | 앱 `audioKey` | 현재 피치 키 | 권장 샘플 파일명 |
|---|---|---|---|
| 도 | `C` | `C4` | `C4.wav` |
| 레 | `D` | `D4` | `D4.wav` |
| 미 | `E` | `E4` | `E4.wav` |
| 파 | `F` | `F4` | `F4.wav` |
| 솔 | `G` | `G4` | `G4.wav` |
| 라 | `A` | `A4` | `A4.wav` |
| 시 | `B` | `B4` | `B4.wav` |
| 높은 도 | `HIGH_C` | `C5` | `C5.wav` |

파일명은 권장 규약일 뿐이며 현재 코드가 이 파일들을 자동으로 읽지는 않습니다. 샘플의 실제 옥타브를 변경한다면 파일명만 바꾸지 말고 `NOTE_META`, 샘플 매핑과 테스트를 함께 맞추세요.

## 권장 파일 사양

- 각 음을 따로 녹음한 모노 WAV
- 44.1kHz 또는 48kHz, 16-bit PCM 이상
- 시작의 과도한 무음을 제거하되 자연스러운 어택은 유지
- 약 0.8–1.2초의 안정된 한 음과 짧은 자연 감쇠
- 모든 파일의 체감 음량과 시작 지점을 비슷하게 정규화
- 클리핑, 배경 음악, 말소리, 메트로놈 소리가 없는 파일

압축 크기가 중요하면 OGG/MP3를 추가할 수 있지만, 대상 브라우저 지원과 디코딩 실패 fallback을 확인해야 합니다. 원본 WAV와 배포용 파일의 관계도 아래 라이선스 표에 기록합니다.

## 샘플 엔진으로 교체하는 방법

파일을 이 디렉터리에 넣는 것만으로는 재생 방식이 바뀌지 않습니다. 다음 계약을 유지하는 샘플 엔진이 필요합니다.

```ts
export interface RecorderAudioEngine {
  unlock(): Promise<boolean>;
  preload(): Promise<void>;
  play(noteKey: string): Promise<void>;
  stop(fadeMs?: number): void;
  setMuted(muted: boolean): void;
  dispose(): void;
}
```

권장 구현 순서는 다음과 같습니다.

1. 예를 들어 `src/features/recorder/audio/SampleRecorderAudioEngine.ts`를 만들고 `RecorderAudioEngine`을 구현합니다.
2. `unlock()`은 사용자 제스처에서 `AudioContext`를 생성 또는 resume하고 성공 여부를 반환합니다. `false`이면 다음 사용자 동작에서 다시 시도하며 자동재생 정책을 우회하지 않습니다.
3. `preload()`은 `/audio/recorder/C4.wav` 같은 URL을 fetch하고 `decodeAudioData`로 버퍼를 준비합니다. 파일 하나가 실패해도 전체 Promise 때문에 앱이 중단되지 않게 합니다.
4. `play(noteKey)`는 앱 키를 샘플 파일에 매핑하고, 이전 source/gain을 짧게 페이드아웃한 뒤 새 `AudioBufferSourceNode`를 시작합니다.
5. `stop()`은 보류 중인 비동기 재생을 request ID로 무효화하고 active source를 페이드아웃합니다.
6. `setMuted(true)`는 즉시 요청을 취소하고 소리를 정리합니다.
7. `dispose()`는 source/gain을 끊고 `AudioContext`를 닫습니다.
8. `useRecorderAudio.ts`의 기본 `engineFactory`를 새 팩토리로 바꾸거나 `RecorderLearningApp`에서 엔진 팩토리를 주입합니다.
9. Web Audio나 샘플 로드가 실패할 때 `createSilentRecorderAudioEngine()`으로 학습 화면이 계속 동작하는지 테스트합니다.

`useRecorderAudio`의 `beginPlaybackRequest()`와 `playAtContact(noteKey, requestId)` 계약은 유지해야 합니다. 이 계층이 빠른 입력에서 지난 음의 지연 재생을 막고, 사용자 제스처 안에서만 오디오 잠금 해제를 시작합니다.

## 합성음으로 되돌리기

샘플 품질이나 라이선스에 문제가 생기면 `useRecorderAudio.ts`의 기본 팩토리를 다시 `createWebAudioRecorderEngine`으로 지정합니다. 합성 엔진은 preload할 파일이 없고 네트워크 요청도 하지 않습니다.

합성음의 주파수와 키 별칭은 `frequencies.ts`, 배음·치프·엔벨로프·길이와 페이드는 `WebAudioRecorderEngine.ts`에서 관리합니다. 기본 길이는 700ms이고 연습·퀴즈용 엔진은 `durationMs: 500`으로 만들 수 있습니다. 합성음은 실제 리코더 녹음으로 표기하지 말고 사용자 화면과 문서에서 계속 “합성 연습음”으로 안내합니다.

## 라이선스 기록 규칙

오디오 파일을 커밋하기 전에 재배포, 수정, 상업적/교육적 사용 가능 여부를 확인합니다. 출처 URL만 있고 명시적 라이선스가 없는 파일, 교과서·유튜브·음원 서비스에서 추출한 파일은 추가하지 않습니다.

샘플을 추가하면 아래 표의 예시 행을 실제 정보로 교체합니다. 한 라이선스 문서가 모든 파일을 포괄하더라도 파일 범위와 버전을 적습니다.

| 파일 | 연주자/제작자 | 원본 출처 URL | 라이선스 | 수정 사항 | 필수 표시 문구 |
|---|---|---|---|---|---|
| `(샘플 추가 시 작성)` |  |  |  | 트림/노멀라이즈/포맷 변환 여부 |  |

필요하면 원문 라이선스 사본을 이 디렉터리에 `LICENSE-audio.txt`처럼 함께 보관하고 이 README에서 연결합니다. CC BY 계열은 저작자, 작품명, 출처, 라이선스 링크와 변경 여부를 모두 기록합니다. CC0 또는 직접 녹음도 출처와 권리자를 남깁니다.

## 교체 후 검수

- 낮은 음·높은 음·반음의 17개 고유 음높이가 모두 올바르게 재생되는가
- 파의 체계 변경은 같은 F 음을 사용하면서 SVG 운지만 달라지는가
- 첫 사용자 클릭 전에 `AudioContext`나 네트워크 재생이 시작되지 않는가
- `1→8→4→5` 연타 뒤 마지막 솔만 들리는가
- 음소거 중 새 source가 생기지 않는가
- 새 음 시작 시 이전 음이 짧게 fade out 되는가
- 파일 누락·404·decode 실패 때 화면과 운지 애니메이션은 정상인가
- 언마운트 뒤 source와 context가 정리되는가
- 배포 응답의 MIME type과 캐시가 대상 브라우저에서 정상인가
- 실제 파일과 이 README의 라이선스 표가 일치하는가

검수 뒤 `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run test:e2e`를 모두 실행합니다.
