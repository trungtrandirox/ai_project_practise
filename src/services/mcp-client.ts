import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";

// MCP Client — kết nối tới playwright-generator server qua Stdio
// Đây là phần khóa 2 dạy: build client để communicate với MCP server

export async function createMcpClient() {
  const client = new Client(
    { name: "playwright-mcp-client", version: "1.0.0" },
    {
      capabilities: {
        tools: {},
        roots: { listChanged: true }, // Enable roots capability
      },
    }
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

// List tất cả prompts có trong server
export async function listPrompts(client: Client) {
  const result = await client.listPrompts();
  return result.prompts;
}

// Lấy một prompt cụ thể với arguments được interpolate vào
// args: object chứa các biến cần truyền vào prompt, ví dụ { manual_steps: "..." }
// Trả về mảng messages sẵn sàng gửi thẳng cho Claude
export async function getPrompt(
  client: Client,
  promptName: string,
  args: Record<string, string>
) {
  const result = await client.getPrompt({ name: promptName, arguments: args });
  return result.messages;
}

// List tất cả resources (direct) có trong server
export async function listResources(client: Client) {
  const result = await client.listResources();
  return result.resources;
}

// Đọc nội dung một resource theo URI
// Ví dụ: readResource(client, "playwright://skills/manual-to-playwright")
export async function readResource(client: Client, uri: string) {
  const result = await client.readResource({ uri });
  return result.contents;
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
