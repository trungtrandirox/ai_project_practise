import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import path from "path";
import fs from "fs";
import { generatePlaywrightTest, refinePlaywrightTest, resetConversation } from "./agents/playwright.agent";
import { playwrightPrompt, PLAYWRIGHT_SYSTEM_PROMPT } from "./prompts/playwright.prompt";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Approved roots — Claude MCP chỉ được access các folder này
const APPROVED_ROOTS = [
  path.resolve(__dirname, "../../tests"),
  path.resolve(__dirname, "../../claude"),
  path.resolve(__dirname, "../../.claude"),
];

// Kiểm tra file path có nằm trong approved roots không
function isPathAllowed(filePath: string): boolean {
  return APPROVED_ROOTS.some((root) =>
    path.resolve(filePath).startsWith(root)
  );
}

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
      output_path: z
        .string()
        .optional()
        .describe("Optional: path to save the generated test file"),
    },
  },
  async ({ manual_steps, output_path }, extra) => {
    // ── Layer 4: Input Guardrail ─────────────────────────────────────────────
    // Chặn input quá dài (có thể là prompt injection hoặc lạm dụng)
    if (manual_steps.length > 10000) {
      return {
        content: [{ type: "text", text: "❌ Input quá dài (>10,000 ký tự). Vui lòng rút gọn manual test steps." }],
        isError: true,
      };
    }
    // Phát hiện prompt injection phổ biến
    const injectionPatterns = [
      /ignore (all |previous |above )?instructions/i,
      /you are now/i,
      /disregard (all |your |previous )?/i,
      /system prompt/i,
      /jailbreak/i,
    ];
    if (injectionPatterns.some((p) => p.test(manual_steps))) {
      return {
        content: [{ type: "text", text: "❌ Input bị từ chối: phát hiện nội dung đáng ngờ (prompt injection)." }],
        isError: true,
      };
    }
    // ── Layer 1: Path check ──────────────────────────────────────────────────
    // Roots check: nếu có output_path, verify nằm trong approved roots
    if (output_path && !isPathAllowed(output_path)) {
      return {
        content: [{
          type: "text",
          text: `❌ Access denied: '${output_path}' is outside approved directories.\nAllowed: tests/, claude/, .claude/`,
        }],
        isError: true,
      };
    }
    // Step 1: Notify start
    await extra.sendNotification({
      method: "notifications/message",
      params: {
        level: "info",
        logger: "playwright-generator",
        data: "📋 Analyzing manual test steps...",
      },
    });

    // Step 2: Notify generating
    await extra.sendNotification({
      method: "notifications/message",
      params: {
        level: "info",
        logger: "playwright-generator",
        data: "🤖 Calling Claude to generate Playwright script...",
      },
    });

    const result = await generatePlaywrightTest(manual_steps);

    // Step 3: Notify done
    await extra.sendNotification({
      method: "notifications/message",
      params: {
        level: "info",
        logger: "playwright-generator",
        data: `✅ Done! Generated test: ${result.test_name}`,
      },
    });

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

// 4. Tool: refine_playwright_test — multi-turn refinement
server.registerTool(
  "refine_playwright_test",
  {
    description:
      "Refine or extend the previously generated Playwright test. Must call generate_playwright_test first.",
    inputSchema: {
      instruction: z
        .string()
        .describe(
          "Refinement instruction, e.g. 'Add mobile viewport test cases' or 'Add edge cases for empty fields'"
        ),
    },
  },
  async ({ instruction }) => {
    // Input guardrail (Layer 4)
    if (instruction.length > 2000) {
      return {
        content: [{ type: "text", text: "❌ Instruction quá dài (>2,000 ký tự)." }],
        isError: true,
      };
    }

    const result = await refinePlaywrightTest(instruction);

    const text = `## ${result.test_name} (refined)

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

// 5. Resource: expose prompt template cho Claude đọc
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

// 6a. Resource (direct): list all available skills
const SKILLS_DIR = path.resolve(__dirname, "../../claude/skills");

server.registerResource(
  "playwright-skills-list",
  "playwright://skills",
  {
    description: "List all available skill IDs that can be fetched via playwright://skills/{skill_id}",
    mimeType: "application/json",
  },
  async () => {
    const skillIds = fs
      .readdirSync(SKILLS_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);

    return {
      contents: [
        {
          uri: "playwright://skills",
          mimeType: "application/json",
          text: JSON.stringify(skillIds),
        },
      ],
    };
  }
);

// 6b. Resource (templated): fetch a specific skill's SKILL.md content
server.registerResource(
  "playwright-skill",
  new ResourceTemplate("playwright://skills/{skill_id}", { list: undefined }),
  {
    description: "Fetch the full SKILL.md content for a given skill ID",
    mimeType: "text/plain",
  },
  async (uri, variables) => {
    const skill_id = variables["skill_id"] as string;
    const skillPath = path.join(SKILLS_DIR, skill_id, "SKILL.md");

    if (!fs.existsSync(skillPath)) {
      throw new Error(`Skill '${skill_id}' not found. Use playwright://skills to list available skills.`);
    }

    const content = fs.readFileSync(skillPath, "utf-8");

    return {
      contents: [
        {
          uri: uri.href,
          mimeType: "text/plain",
          text: content,
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

// 6. Tool: write_prompt — sinh system prompt mới hoặc cải thiện prompt hiện có
server.registerTool(
  "write_prompt",
  {
    description:
      "Generate a new system prompt or improve an existing one. " +
      "Describe what you want the AI to do, and optionally provide an existing prompt to refine.",
    inputSchema: {
      requirements: z
        .string()
        .describe(
          "Describe what the AI should do, what output format to use, and any constraints. " +
          "Example: 'Convert manual test steps to Playwright TypeScript. Must include TC-001 format and security tests.'"
        ),
      existing_prompt: z
        .string()
        .optional()
        .describe("Optional: paste an existing system prompt here to improve it instead of generating from scratch"),
      improvement_goal: z
        .string()
        .optional()
        .describe("Optional: what aspect to improve. Example: 'Make locator rules more specific' or 'Add XML structure'"),
    },
  },
  async ({ requirements, existing_prompt, improvement_goal }) => {
    // Input guardrail
    if (requirements.length > 5000) {
      return {
        content: [{ type: "text", text: "❌ Requirements quá dài (>5,000 ký tự)." }],
        isError: true,
      };
    }

    const PROMPT_WRITER_SYSTEM = `You are an expert prompt engineer specializing in writing high-quality system prompts for AI coding assistants.

Your job is to write clear, structured, and effective system prompts that:
- Define the AI's role and expertise precisely
- Use numbered rules and sections with markdown headers
- Specify output format requirements explicitly  
- Include forbidden patterns (what NOT to do)
- Are specific enough to produce consistent, predictable outputs

A good system prompt should be:
- Detailed but not verbose
- Organized with clear sections
- Actionable (Claude can follow every rule)
- Testable (you can verify compliance with a grader)`;

    const userMessage = existing_prompt
      ? `Improve this existing system prompt.

## Current Prompt
${existing_prompt}

## Improvement Goal
${improvement_goal || "Make it clearer, more specific, and better structured"}

## Additional Requirements
${requirements}

Return the improved prompt only — no explanation, no markdown wrapping.`
      : `Write a new system prompt for an AI assistant with these requirements:

## Requirements
${requirements}

${improvement_goal ? `## Focus On\n${improvement_goal}` : ""}

Return the system prompt only — no explanation, no markdown wrapping.`;

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 2000,
      temperature: 0.3,  // Slightly creative but mostly consistent
      system: PROMPT_WRITER_SYSTEM,
      messages: [{ role: "user", content: userMessage }],
    });

    const firstBlock = response.content[0];
    const generatedPrompt = firstBlock?.type === "text" ? firstBlock.text : "";

    const action = existing_prompt ? "improved" : "generated";
    return {
      content: [{
        type: "text",
        text: `## ✅ System Prompt ${action === "improved" ? "Improved" : "Generated"}\n\n` +
          `> Copy the prompt below into your \`playwright.prompt.ts\` or use it directly.\n\n` +
          `---\n\n${generatedPrompt}\n\n---\n\n` +
          `⚠️ AI-generated — review before using in production. Run eval in section2-prompt-eval.ipynb to measure quality.`,
      }],
    };
  }
);

// 7. Khởi động server với Stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Server is running...");
}

main();
