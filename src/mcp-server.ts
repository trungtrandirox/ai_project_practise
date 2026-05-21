import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { generatePlaywrightTest } from "./agents/playwright.agent";
import { playwrightPrompt, PLAYWRIGHT_SYSTEM_PROMPT } from "./prompts/playwright.prompt";

// 1. Tạo MCP Server instance
const server = new McpServer({
  name: "playwright-generator",
  version: "1.0.0",
});

// 2. Tool: say_hello (hello world giữ lại để học)
server.registerTool(
  "say_hello",
  {
    description: "Say hello to someone",
    inputSchema: {
      name: z.string().describe("The name to greet"),
    },
  },
  async ({ name }) => {
    return {
      content: [
        {
          type: "text",
          text: `Hello, ${name}! This is my first MCP tool 🎉`,
        },
      ],
    };
  }
);

// 3. Tool: generate_playwright_test
server.registerTool(
  "generate_playwright_test",
  {
    description:
      "Convert manual test steps into a Playwright TypeScript test",
    inputSchema: {
      manual_steps: z
        .string()
        .describe(
          "Manual test steps written in plain text, one step per line"
        ),
    },
  },
  async ({ manual_steps }) => {
    const result = await generatePlaywrightTest(manual_steps);

    // Format structured output thành markdown rõ ràng
    const text = `## ${result.test_name}

### Playwright Test Code
\`\`\`typescript
${result.test_code}
\`\`\`

### Suggested Locators
${result.locators.map((l) => `- **${l.element}**: \`${l.locator}\` _(${l.strategy})_`).join("\n")}

### Edge Cases
${result.edge_cases.map((e) => `- ${e}`).join("\n")}`;

    return {
      content: [{ type: "text", text }],
    };
  }
);

// 4. Resource: expose prompt template cho Claude đọc
server.registerResource(
  "playwright-prompt-template",
  "playwright://prompt-template",
  {
    description:
      "The system prompt template used to convert manual tests into Playwright tests",
    mimeType: "text/plain",
  },
  async () => {
    return {
      contents: [
        {
          uri: "playwright://prompt-template",
          mimeType: "text/plain",
          text: `SYSTEM:\n${PLAYWRIGHT_SYSTEM_PROMPT}\n\nUSER:\n${playwrightPrompt("<manual_steps_here>")}`,
        },
      ],
    };
  }
);

// 5. Prompt: reusable prompt template cho Copilot/Claude dùng trực tiếp
server.registerPrompt(
  "generate-playwright-test",
  {
    title: "Generate Playwright Test",
    description:
      "A ready-to-use prompt that asks Claude to convert manual steps into a Playwright test",
    argsSchema: {
      manual_steps: z
        .string()
        .describe("Manual test steps written in plain text"),
    },
  },
  ({ manual_steps }) => {
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: playwrightPrompt(manual_steps),
          },
        },
      ],
    };
  }
);

// 6. Khởi động server với Stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Server is running...");
}

main();
