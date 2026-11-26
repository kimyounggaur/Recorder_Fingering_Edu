import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ALL_HOLES, FINGER_LABELS, FINGERING_STATES, HOLE_NUMBER_LABELS } from "../data/fingerings";
import { ALL_NOTE_IDS, NOTE_META } from "../data/noteMeta";

const appUrl = "https://recorder-fingering-edu.vercel.app/";
const systemSchema = z.enum(["baroque", "german"]);
const noteSchema = z.string().trim().min(1).max(40);
const readOnly = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
const normalize = (note: string) => note.normalize("NFKC").toLowerCase()
  .replaceAll("♯", "#").replaceAll("♭", "b").replace(/\s+/g, "");

const notes = ALL_NOTE_IDS.map((id) => {
  const { solfegeKo, noteName, soundingPitch } = NOTE_META[id];
  return { id, solfegeKo, writtenPitch: noteName, soundingPitch };
});
const noteIndex = new Map(notes.flatMap((note) => [
  note.id, note.solfegeKo, ...note.solfegeKo.split("/"), ...note.writtenPitch.split("/"),
].map((alias) => [normalize(alias), note] as const)));

function compareUrl(noteId: string) {
  const url = new URL("compare", appUrl);
  url.searchParams.set("note", noteId);
  return url.href;
}

function result<T extends Record<string, unknown>>(data: T) {
  return { structuredContent: data, content: [{ type: "text" as const, text: JSON.stringify(data) }] };
}

export function createRecorderMcpServer() {
  const server = new McpServer({ name: "recorder-fingering-edu", version: "1.0.0" }, {
    instructions: "소프라노 리코더 학습 앱의 공개 운지 데이터입니다. 기보 음(예: G5)과 실제 소리(예: G6)를 구분하고, 바로크식과 독일식을 명시해 조회하세요. 앱을 원격 조작하거나 사용자 상태를 저장하지 않습니다.",
  });

  server.registerTool("lookup_recorder_fingering", {
    title: "리코더 운지 조회",
    description: "선택한 소프라노 리코더 운지 체계에서 0~7번 구멍 상태를 확인합니다. note에는 높은 솔, G5, highSol처럼 계이름·기보 음 또는 앱 음 ID를 넣습니다. 기보 음과 실제 소리의 옥타브를 혼용하지 마세요.",
    inputSchema: z.strictObject({
      system: systemSchema.describe("baroque: 바로크식, german: 독일식"),
      note: noteSchema.describe("기보 음 C4–G5 중 지원하는 음, 한국어 계이름 또는 앱 note ID"),
    }),
    annotations: readOnly,
  }, ({ system, note }) => {
    const match = noteIndex.get(normalize(note));
    if (!match) {
      return { isError: true, content: [{
        type: "text",
        text: "이 앱에 없는 음입니다. list_recorder_notes에서 지원하는 기보 음(C4–G5)을 확인하세요. 예: 높은 솔, G5, highSol.",
      }] };
    }
    const fingering = FINGERING_STATES[system][match.id];
    return result({
      instrument: "soprano recorder", system, ...match,
      holes: ALL_HOLES.map(id => ({ id, number: Number(HOLE_NUMBER_LABELS[id]), fingerKo: FINGER_LABELS[id], state: fingering[id] })),
      appUrl, compareUrl: compareUrl(match.id),
    });
  });

  server.registerTool("list_recorder_notes", {
    title: "지원하는 리코더 음 목록",
    description: "바로크식/독일식 양쪽에서 조회할 수 있는 기보 음, 실제 소리, 한글 이름과 앱 음 ID를 반환합니다.",
    inputSchema: z.strictObject({}), annotations: readOnly,
  }, () => result({ instrument: "soprano recorder", systems: ["baroque", "german"], notes, appUrl }));

  server.registerTool("get_recorder_app_link", {
    title: "리코더 학습 앱 링크",
    description: "학습 앱 주소를 반환합니다. 음을 지정하면 해당 음의 바로크식·독일식 비교 화면 주소도 반환합니다.",
    inputSchema: z.strictObject({ note: noteSchema.optional() }), annotations: readOnly,
  }, ({ note }) => {
    if (note === undefined) return result({ appUrl });
    const match = noteIndex.get(normalize(note));
    if (!match) return { isError: true, content: [{ type: "text", text: "지원하지 않는 음입니다. list_recorder_notes에서 확인하세요." }] };
    return result({ appUrl, compareUrl: compareUrl(match.id), noteId: match.id });
  });
  return server;
}
