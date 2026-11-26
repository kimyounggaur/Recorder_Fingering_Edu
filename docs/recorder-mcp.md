# 리코더 운지 앱 MCP 연결

기존 학습 화면에서 사용하는 공개 소프라노 리코더 운지 자료를 AI에서 조회할 수 있습니다. 요청은 학생 계정·진도·녹음·기기 설정에 접근하지 않으며 기존 화면 상태를 변경하지 않습니다. 특정 음의 링크를 열면 두 운지 체계를 비교할 수 있습니다.

## 주소와 도구

배포가 확인된 웹앱 원점에 `/mcp`를 붙입니다. 브라우저 주소창에서 열면 GET이므로 405가 정상입니다. MCP 클라이언트는 같은 주소에 JSON-RPC를 POST하는 Streamable HTTP 전송을 사용합니다. 기존 HTTP+SSE 방식은 지원하지 않습니다.

| 도구 | 예시 입력 | 반환 |
| --- | --- | --- |
| `lookup_recorder_fingering` | `{"system":"german","note":"높은 솔"}` | 높은 솔의 기보 G5/실음 G6, 0–7번 구멍 상태, 비교 화면 링크 |
| `list_recorder_notes` | `{}` | 지원하는 17개 음, 두 운지 체계, 기보 음·실음 |
| `get_recorder_app_link` | `{"note":"F4"}` 또는 `{}` | 기본 앱 주소, 음을 지정하면 해당 음 비교 주소 |

`system`은 `baroque` 또는 `german`입니다. 음에는 한국어 계이름, 기보 음(`G5`, `D♭4`, `Db4`), 앱 ID(`highSol`)를 사용할 수 있습니다. 실음으로 검색하지 않습니다. 지원 범위 밖이면 음 목록을 먼저 확인하세요.

## 연결과 확인

- [ChatGPT Custom MCP 안내](https://help.openai.com/en/articles/12584461-connecting-custom-mcp-servers-in-chatgpt)에서 계정의 커스텀 MCP 추가 가능 여부를 확인한 뒤 검증된 주소를 입력합니다.
- [Claude Custom Connector 안내](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp)의 Customize → Connectors에서 검증된 HTTPS 주소를 등록합니다. 공개 운지 전용 서버는 별도 로그인 없음으로 구성됩니다.
- [Gemini CLI MCP 안내](https://geminicli.com/docs/tools/mcp-server/)에서는 Streamable HTTP를 사용하는 `httpUrl`에 검증된 주소를 설정합니다. Gemini CLI 설정과 일반 Gemini 앱의 커넥터 이용 가능 여부는 별개입니다.
- “독일식 리코더의 높은 솔 운지와 양식 비교 링크를 알려줘”를 요청한 후 G5(기보)/G6(실음), 엄지 반막음, 비교 URL을 확인합니다. 파(F4)를 두 체계로 호출해 결과가 달라지는지도 확인합니다.
- Vercel 인증으로 보호된 미리보기는 외부 클라이언트에서 연결되지 않을 수 있습니다. 보호를 끄거나 우회 토큰을 공개하지 말고, 승인된 접근 조건에서만 테스트합니다.

## 운영 경계

공개 앱 데이터만 반환하는 읽기 전용·무상태 서버입니다. 8 KiB 입력 한도, JSON 및 도구 입력 검증을 적용하고 브라우저가 보내는 Origin은 앱의 주소 또는 관리자가 명시한 `RECORDER_MCP_ALLOWED_ORIGINS`와 정확히 일치할 때만 허용합니다. Origin 검사는 인증이나 호출량 제한이 아닙니다. 공개 운영 전에 호스팅 쪽 요청 제한과 비용·오류 모니터링을 적용할지 검토하세요. 향후 개인 데이터나 쓰기 기능이 필요하면 OAuth·권한·감사 정책을 별도 설계합니다.

로컬 검수: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build:vercel`. MCP 테스트는 공식 SDK 클라이언트로 초기화부터 도구 호출까지 검증하고, 앱의 17음 × 2체계 × 8구멍 결과를 대조합니다.
