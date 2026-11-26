import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { afterEach, describe, expect, it } from "vitest";
import { DELETE, GET, POST } from "../../../../app/mcp/route";
import { ALL_HOLES, FINGERING_STATES } from "../data/fingerings";
import { ALL_NOTE_IDS } from "../data/noteMeta";

const endpoint = new URL("https://recorder-fingering-edu.vercel.app/mcp");
const baseHeaders = { Accept: "application/json, text/event-stream", "Content-Type": "application/json" };
const clients: Client[] = [];
afterEach(async () => { await Promise.all(clients.splice(0).map(client => client.close())); });

async function connect() {
  const client = new Client({ name: "recorder-tests", version: "1.0.0" });
  clients.push(client);
  const transport = new StreamableHTTPClientTransport(endpoint, {
    fetch: async (input, init) => {
      const request = new Request(input, init);
      return ({ POST, GET, DELETE } as const)[request.method as "POST" | "GET" | "DELETE"](request);
    },
  });
  await client.connect(transport);
  return client;
}

describe("recorder MCP over Streamable HTTP", () => {
  it("negotiates using the official client and declares only read-only tools", async () => {
    const client = await connect();
    expect(client.getServerVersion()?.name).toBe("recorder-fingering-edu");
    const { tools } = await client.listTools();
    expect(tools.map(tool => tool.name).sort()).toEqual(["get_recorder_app_link", "list_recorder_notes", "lookup_recorder_fingering"]);
    expect(tools.every(tool => tool.annotations?.readOnlyHint && tool.annotations?.destructiveHint === false)).toBe(true);
    const list = await client.callTool({ name: "list_recorder_notes", arguments: {} });
    expect(list.structuredContent).toMatchObject({ notes: expect.arrayContaining(ALL_NOTE_IDS.map(id => expect.objectContaining({ id }))) });
  });

  it("matches every app hole for every note and both systems", async () => {
    const client = await connect();
    for (const system of ["baroque", "german"] as const) for (const note of ALL_NOTE_IDS) {
      const result = await client.callTool({ name: "lookup_recorder_fingering", arguments: { system, note } });
      expect(result.structuredContent).toMatchObject({
        system, id: note,
        holes: ALL_HOLES.map((id, number) => ({ id, number, state: FINGERING_STATES[system][note][id] })),
      });
    }
  });

  it("resolves written aliases and preserves the written/sounding pitch distinction", async () => {
    const client = await connect();
    const lookup = (note: string) => client.callTool({ name: "lookup_recorder_fingering", arguments: { system: "german", note } });
    expect((await lookup("높은 솔")).structuredContent).toMatchObject({
      id: "highSol", writtenPitch: "G5", soundingPitch: "G6",
      holes: expect.arrayContaining([{ id: "T0", number: 0, fingerKo: "왼손 엄지", state: "half" }]),
    });
    expect((await lookup("G5")).structuredContent).toMatchObject({ id: "highSol" });
    expect((await lookup("D♭4")).structuredContent).toMatchObject({ id: "doSharp" });
    expect((await lookup("G6")).isError).toBe(true);
    expect((await lookup("constructor")).isError).toBe(true);
    expect((await client.callTool({ name: "lookup_recorder_fingering", arguments: { system: "bad", note: "F4" } })).isError).toBe(true);
    const link = await client.callTool({ name: "get_recorder_app_link", arguments: { note: "파" } });
    expect(link.structuredContent).toMatchObject({ compareUrl: endpoint.origin + "/compare?note=fa" });
  });

  it("validates cross-origin requests, media type, body size and clean HTTP methods", async () => {
    const send = (body: string, headers = baseHeaders) => POST(new Request(endpoint, { method: "POST", headers, body }));
    expect((await send("{}", { ...baseHeaders, ...{ Origin: "https://untrusted.example" } })).status).toBe(403);
    expect((await send("{}", { ...baseHeaders, "Content-Type": "text/plain" })).status).toBe(415);
    expect((await send("x".repeat(8193))).status).toBe(413);
    expect((await send("{")).status).toBe(400);
    expect((await send("[]")).status).toBe(400);
    expect(GET(new Request(endpoint)).status).toBe(405);
    expect(DELETE(new Request(endpoint, { method: "DELETE" })).status).toBe(405);
    expect(GET(new Request(endpoint, { headers: { Origin: "null" } })).status).toBe(403);
  });
});
