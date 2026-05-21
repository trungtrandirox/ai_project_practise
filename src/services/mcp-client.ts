import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";

// MCP Client — kết nối tới playwright-generator server qua Stdio
// Đây là phần khóa 2 dạy: build client để communicate với MCP server

export async function createMcpClient() {
  const client = new Client(
    { name: "playwright-mcp-client", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  // StdioClientTransport: spawn server process và kết nối qua stdin/stdout
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["ts-node", path.resolve(__dirname, "../mcp-server.ts")],
  });

  await client.connect(transport);
  return client;
}

// List tất cả tools có trong server
export async function listTools(client: Client) {
  const result = await client.listTools();
  return result.tools;
}

// Gọi tool generate_playwright_test qua MCP protocol
export async function generateTestViaMcp(
  client: Client,
  manualSteps: string
): Promise<string> {
  const result = await client.callTool({
    name: "generate_playwright_test",
    arguments: { manual_steps: manualSteps },
  });

  const content = result.content as Array<{ type: string; text: string }>;
  return content.map((c) => c.text).join("\n");
}
