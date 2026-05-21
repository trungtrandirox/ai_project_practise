import Anthropic from "@anthropic-ai/sdk";
import { PLAYWRIGHT_SYSTEM_PROMPT, playwrightPrompt } from "../prompts/playwright.prompt";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Structured output type — Course 1: Tool use for structured output
export interface PlaywrightTestResult {
  test_name: string;
  test_code: string;
  locators: Array<{ element: string; locator: string; strategy: string }>;
  edge_cases: string[];
}

export async function generatePlaywrightTest(
  manualTest: string
): Promise<PlaywrightTestResult> {
  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-latest",
    max_tokens: 4000,
    // Course 1: System prompt tách riêng khỏi user message
    system: PLAYWRIGHT_SYSTEM_PROMPT,
    // Course 1: Tool calling để force structured output thay vì raw text
    tools: [
      {
        name: "output_playwright_test",
        description: "Output the generated Playwright test with analysis",
        input_schema: {
          type: "object" as const,
          properties: {
            test_name: {
              type: "string",
              description: "Descriptive name for the test",
            },
            test_code: {
              type: "string",
              description: "Complete Playwright TypeScript test code",
            },
            locators: {
              type: "array",
              description: "Suggested locators for key UI elements",
              items: {
                type: "object",
                properties: {
                  element: { type: "string", description: "UI element name" },
                  locator: { type: "string", description: "Playwright locator expression" },
                  strategy: { type: "string", description: "Locator strategy used (data-testid, role, label...)" },
                },
                required: ["element", "locator", "strategy"],
              },
            },
            edge_cases: {
              type: "array",
              description: "Edge cases and additional scenarios to consider",
              items: { type: "string" },
            },
          },
          required: ["test_name", "test_code", "locators", "edge_cases"],
        },
      },
    ],
    tool_choice: { type: "tool", name: "output_playwright_test" },
    messages: [
      {
        role: "user",
        content: playwrightPrompt(manualTest),
      },
    ],
  });

  // Parse structured output từ tool_use block
  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Claude did not return structured output");
  }

  return toolUse.input as PlaywrightTestResult;
}