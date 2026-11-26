import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createRecorderMcpServer } from "../../src/features/recorder/mcp/tools";

const MAX_BODY_BYTES = 8192;
const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };

function allowedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin === null) return true; // Remote MCP clients make server-to-server calls.
  const extraOrigins = (process.env.RECORDER_MCP_ALLOWED_ORIGINS ?? "").split(",").map(v => v.trim()).filter(Boolean);
  return new Set(["https://recorder-fingering-edu.vercel.app", ...extraOrigins]).has(origin);
}

const fail = (status: number, code: number, message: string) =>
  Response.json({ jsonrpc: "2.0", id: null, error: { code, message } }, { status, headers });

async function readBoundedJson(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new SyntaxError("Missing request body");
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let size = 0;
  let text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        void reader.cancel().catch(() => undefined);
        throw new RangeError("Request too large");
      }
      text += decoder.decode(value, { stream: true });
    }
    return JSON.parse(text + decoder.decode()) as unknown;
  } finally {
    reader.releaseLock();
  }
}

export async function POST(request: Request): Promise<Response> {
  if (!allowedOrigin(request)) return fail(403, -32000, "Origin not allowed");
  const contentType = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  if (contentType !== "application/json") return fail(415, -32600, "Expected application/json");
  const declared = request.headers.get("content-length");
  if (declared !== null && Number(declared) > MAX_BODY_BYTES) return fail(413, -32600, "Request too large");
  let message: unknown;
  try {
    message = await readBoundedJson(request);
  } catch (error) {
    return error instanceof RangeError ? fail(413, -32600, "Request too large") : fail(400, -32700, "Invalid JSON");
  }
  if (Array.isArray(message)) return fail(400, -32600, "A single JSON-RPC message is required");
  const server = createRecorderMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  try {
    await server.connect(transport);
    const response = await transport.handleRequest(request, { parsedBody: message });
    const responseHeaders = new Headers(response.headers);
    for (const [key, value] of Object.entries(headers)) responseHeaders.set(key, value);
    return new Response(response.body, { status: response.status, headers: responseHeaders });
  } finally {
    await server.close();
  }
}

function unsupported(request: Request) {
  if (!allowedOrigin(request)) return fail(403, -32000, "Origin not allowed");
  return new Response(null, { status: 405, headers: { ...headers, Allow: "POST" } });
}

// Streamable HTTP permits 405 when no server-initiated SSE stream or session termination is offered.
export const GET = unsupported;
export const DELETE = unsupported;
