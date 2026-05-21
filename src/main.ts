import "dotenv/config";
import { createMcpClient, listTools, generateTestViaMcp } from "./services/mcp-client";

const manualTest = `
1. Go to https://example.com/login
2. Enter username "admin@test.com" in the email field
3. Enter password "Password123" in the password field
4. Click the Login button
5. Verify the dashboard page is displayed with welcome message
`;

async function run() {
  // Tạo MCP client và kết nối tới server
  const client = await createMcpClient();

  // List tools — thấy được những gì server expose
  const tools = await listTools(client);
  console.log("Available tools:", tools.map((t) => t.name));

  // Gọi tool qua MCP protocol (client → server → Claude API → response)
  console.log("\nGenerating Playwright test...\n");
  const output = await generateTestViaMcp(client, manualTest);
  console.log(output);

  await client.close();
}

run();