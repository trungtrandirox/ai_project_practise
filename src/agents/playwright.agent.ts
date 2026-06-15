import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";
import * as path from "path";
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
  // Claude's reasoning text captured from multi-block responses (may be empty)
  notes: string;
}

// Multi-turn conversation history — Course 1: Multi-turn conversations
// Use proper Anthropic SDK types to support tool_use content blocks
const conversationHistory: Anthropic.MessageParam[] = [];

// ── Tool Definitions — Course 1: Tool Schemas best practices ─────────────────
// Each schema: 3-4 sentence description (what / when to use / what it returns),
// detailed descriptions for every argument so Claude understands exactly how to call them.
const TOOLS: Anthropic.Tool[] = [
  {
    name: "get_project_config",
    // Lesson: description = what it does + when to use it + what it returns (3-4 sentences)
    description:
      "Returns the runtime configuration for the project under test, including the base URL, " +
      "target browser, viewport size, and slow-motion delay. " +
      "Call this first, before generating any test code, so that page.goto() calls use the correct " +
      "base URL instead of a hardcoded guess. " +
      "Returns a JSON object with keys: base_url, base_url_source, browser, viewport, slow_mo.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "read_playwright_config",
    description:
      "Reads the project's playwright.config.ts file and returns its raw content so you can " +
      "extract already-configured settings such as baseURL, timeout, testDir, and reporter. " +
      "Call this after get_project_config — if playwright.config.ts defines baseURL, prefer " +
      "relative paths like '/login' in page.goto() instead of absolute URLs. " +
      "Returns { found: true, path, content } when the file exists, or { found: false, note } " +
      "when it does not — in that case fall back to the base_url from get_project_config.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    // Step 1: Add tool schema — lesson: same pattern for every new tool
    name: "list_existing_tests",
    description:
      "Scans the project's test directories and returns the TC-IDs and test names already in use. " +
      "Call this before generating new tests to avoid duplicating TC-001, TC-002, etc. " +
      "Returns an array of { file, tcIds } objects, or an empty array if no tests exist yet. " +
      "Use the highest existing TC-ID as the starting point for new test numbering.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    // Step 1: batch_tool schema — lesson: workaround to run multiple independent tools in parallel
    // Use this to call get_project_config + read_playwright_config + list_existing_tests together.
    name: "batch_tool",
    description:
      "Invoke multiple independent tool calls simultaneously in a single round-trip. " +
      "Use this when you need to call get_project_config, read_playwright_config, and " +
      "list_existing_tests at the same time — they are all independent and can run in parallel. " +
      "Pass all three as invocations to avoid unnecessary back-and-forth. " +
      "Returns an array of { tool_name, output } objects in the same order as the invocations.",
    input_schema: {
      type: "object" as const,
      properties: {
        invocations: {
          type: "array",
          description: "The tool calls to invoke in parallel.",
          items: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "Name of the tool to invoke (e.g. get_project_config).",
              },
              arguments: {
                type: "object",
                description: "Arguments for the tool (use empty object {} for tools with no params).",
              },
            },
            required: ["name", "arguments"],
          },
        },
      },
      required: ["invocations"],
    },
  },
  {
    name: "output_playwright_test",
    description:
      "Outputs the final generated Playwright TypeScript test suite as structured JSON. " +
      "Call this as the last step, after all config tools have been called and the test code " +
      "is fully written. Do not call this tool until the complete test suite is ready. " +
      "Returns a structured object containing the test name, full TypeScript code, locator " +
      "analysis table, and additional edge-case recommendations.",
    input_schema: {
      type: "object" as const,
      properties: {
        test_name: {
          type: "string",
          // Lesson: detailed per-argument descriptions
          description:
            "A short descriptive title for the test file, e.g. 'Login Feature'. " +
            "Used as the test.describe() label and the output filename.",
        },
        test_code: {
          type: "string",
          description:
            "Complete, runnable Playwright TypeScript code including all imports and test cases. " +
            "Must start with `import { test, expect } from '@playwright/test';` and contain " +
            "at least 4 test cases covering Positive, Negative, Edge, and Security scenarios.",
        },
        locators: {
          type: "array",
          description:
            "A table of key UI elements and their recommended Playwright locators. " +
            "Include one entry per interactive element (inputs, buttons, alerts). " +
            "Follows the locator priority: getByRole > getByLabel > getByText > getByTestId.",
          items: {
            type: "object",
            properties: {
              element: {
                type: "string",
                description: "Human-readable name of the UI element, e.g. 'Email input', 'Login button'.",
              },
              locator: {
                type: "string",
                description: "The exact Playwright locator expression, e.g. `page.getByLabel('Email')`.",
              },
              strategy: {
                type: "string",
                description: "The locator strategy used: 'role', 'label', 'text', or 'testid'.",
              },
            },
            required: ["element", "locator", "strategy"],
          },
        },
        edge_cases: {
          type: "array",
          description:
            "Additional test scenarios worth considering but not included in the generated suite. " +
            "Each string is a one-sentence description of a scenario, e.g. " +
            "'Account lockout after 5 failed login attempts'.",
          items: { type: "string" },
        },
      },
      required: ["test_name", "test_code", "locators", "edge_cases"],
    },
  },
];

// ── Tool Functions — Course 1: Tool Use / Tool Functions best practices ───────
// Each function: descriptive name, validates inputs, returns clear error messages
// so Claude can understand what went wrong and retry with corrected parameters.

function toolGetProjectConfig(): string {
  const baseUrl = process.env.BASE_URL;
  const browser = process.env.BROWSER ?? "chromium";
  const validBrowsers = ["chromium", "firefox", "webkit"];

  // Validate inputs — lesson: "provide meaningful error messages so Claude can retry"
  if (browser && !validBrowsers.includes(browser)) {
    return JSON.stringify({
      error: `Invalid BROWSER value: "${browser}". Must be one of: ${validBrowsers.join(", ")}. ` +
             `Fix the .env file and retry.`,
    });
  }

  return JSON.stringify({
    base_url: baseUrl ?? "http://localhost:3000",
    base_url_source: baseUrl ? "env:BASE_URL" : "default — set BASE_URL in .env to override",
    browser,
    viewport: { width: 1280, height: 720 },
    slow_mo: process.env.SLOW_MO ? parseInt(process.env.SLOW_MO, 10) : 0,
  });
}

function toolReadPlaywrightConfig(): string {
  // Search for playwright.config.ts up to 3 levels from cwd
  const candidates = [
    path.join(process.cwd(), "playwright.config.ts"),
    path.join(process.cwd(), "..", "playwright.config.ts"),
    path.join(process.cwd(), "..", "..", "playwright.config.ts"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      const content = fs.readFileSync(candidate, "utf8");
      if (!content.trim()) {
        return JSON.stringify({
          error: `playwright.config.ts found at "${candidate}" but is empty. Cannot read settings.`,
        });
      }
      return JSON.stringify({ found: true, path: candidate, content });
    }
  }

  // Not an error — just inform Claude to use defaults
  return JSON.stringify({
    found: false,
    note: "playwright.config.ts not found in project. Use base_url from get_project_config instead.",
  });
}

// ── Lesson: Multi-Turn Conversations with Tools ─────────────────────────────
// Claude's responses can contain BOTH text blocks and tool_use blocks.
// text blocks = Claude's reasoning/explanation (e.g. "Let me check your config first")
// tool_use blocks = instructions to call a function
// This helper extracts all text so callers can surface Claude's reasoning to users.
function extractTextBlocks(content: Anthropic.ContentBlock[]): string {
  return content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

// Step 2: Implement the tool function
function toolListExistingTests(): string {
  const testDirs = [
    path.join(process.cwd(), "tests"),
    path.join(process.cwd(), "e2e"),
    path.join(process.cwd(), "test"),
    path.join(process.cwd(), "src", "tests"),
  ];

  const tcIdPattern = /TC-\d{3}/g;
  const results: Array<{ file: string; tcIds: string[] }> = [];

  for (const dir of testDirs) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".ts") || f.endsWith(".js"));
    for (const file of files) {
      const content = fs.readFileSync(path.join(dir, file), "utf8");
      const tcIds = [...new Set(content.match(tcIdPattern) ?? [])];
      if (tcIds.length > 0) results.push({ file, tcIds });
    }
  }

  if (results.length === 0) {
    return JSON.stringify({ found: false, note: "No existing test files found. Start numbering from TC-001." });
  }
  return JSON.stringify({ found: true, tests: results });
}

// Step 2: Implement batch_tool function — executes each invocation and returns combined results
function toolRunBatch(invocations: Array<{ name: string; arguments: Record<string, unknown> }>): string {
  const batchOutput = invocations.map((inv) => ({
    tool_name: inv.name,
    output: JSON.parse(executeTool(inv.name)),  // reuse dispatcher for each sub-call
  }));
  return JSON.stringify(batchOutput);
}

// Step 3: Dispatcher — add a case for every new tool (lesson: consistent pattern)
// Accepts optional parsed input for tools that need arguments (e.g. batch_tool).
function executeTool(name: string, input?: Record<string, unknown>): string {
  if (name === "get_project_config")    return toolGetProjectConfig();
  if (name === "read_playwright_config") return toolReadPlaywrightConfig();
  if (name === "list_existing_tests")   return toolListExistingTests();
  if (name === "batch_tool") {
    const invocations = (input?.invocations ?? []) as Array<{ name: string; arguments: Record<string, unknown> }>;
    return toolRunBatch(invocations);
  }
  // Lesson: clear error message — Claude sees this and won't retry the same unknown tool
  return JSON.stringify({ error: `Unknown tool: "${name}". Available tools: get_project_config, read_playwright_config, list_existing_tests, output_playwright_test.` });
}

// ── Lesson: Built-in Web Search Tool — no implementation needed ───────────────
// Unlike custom tools, Anthropic's servers execute web search automatically.
// We only provide the schema stub; Claude handles search via server_tool_use blocks.
// Restrict to playwright.dev + MDN so Claude only references authoritative docs.
// max_uses: 3 prevents excessive searches per generation.
const WEB_SEARCH_TOOL = {
  type: "web_search_20250305" as const,
  name: "web_search",
  max_uses: 3,
  allowed_domains: ["playwright.dev", "developer.mozilla.org", "testing-library.com"],
};

/** Thêm refinement instruction vào conversation hiện tại rồi gọi lại Claude.
 *  Dùng sau khi đã gọi generatePlaywrightTest() ít nhất 1 lần.
 *  Ví dụ: refinePlaywrightTest("Add mobile viewport test cases")
 */
export async function refinePlaywrightTest(
  instruction: string,
  useThinking  = false,
  thinkingBudget = 8000,
): Promise<PlaywrightTestResult> {
  // Thêm yêu cầu refinement vào history — Claude sẽ nhớ code đã sinh ở turn trước
  conversationHistory.push({ role: "user", content: instruction });
  return callClaude(useThinking, thinkingBudget);
}

/** Reset conversation — bắt đầu session mới */
export function resetConversation(): void {
  conversationHistory.length = 0;
}

// ── Lesson: Vision / Image Support ───────────────────────────────────────────
// Images can be included as base64 alongside text blocks in a user message.
// Limits: max 5 MB per image, 8000px per side (single image), tokens = (w×h)/750.
// Good prompting is just as critical for vision as for text — structured prompts win.
// Practical use: pass a UI screenshot so Claude can see the actual form labels,
// button names, and ARIA roles rather than guessing from text descriptions alone.
// Result: more accurate getByLabel(), getByRole(), getByText() locators.

type SupportedMediaType = "image/png" | "image/jpeg" | "image/gif" | "image/webp";

function detectMediaType(filePath: string): SupportedMediaType {
  const ext = path.extname(filePath).toLowerCase();
  const map: Record<string, SupportedMediaType> = {
    ".png":  "image/png",
    ".jpg":  "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif":  "image/gif",
    ".webp": "image/webp",
  };
  return map[ext] ?? "image/png";
}

export async function generatePlaywrightTest(
  manualTest: string,
  useThinking    = false,
  thinkingBudget = 8000,
  // Lesson: optional screenshot of the UI under test — Claude analyzes it to infer
  // correct locators (labels, roles, button text) instead of guessing from text alone.
  screenshotPath?: string,
): Promise<PlaywrightTestResult> {
  resetConversation();

  // Build user message: plain text, or image + text when screenshot is provided
  // ── Lesson: Cache breakpoints span messages ────────────────────────────────
  // The initial user message (full manual test spec + prompt template) is large
  // and re-sent on every loop turn AND every refinePlaywrightTest() call.
  // Mark it with cache_control so Claude reuses the preprocessed work.
  // Must use longhand content array (not plain string) to add cache_control.
  // Ordering that Anthropic processes: tools → system → messages — our breakpoint
  // on the last tool + system + first user message gives 3 of the 4 allowed breakpoints.
  let userContent: Anthropic.MessageParam["content"];

  if (screenshotPath) {
    const imageBytes = fs.readFileSync(screenshotPath);
    const base64Data = imageBytes.toString("base64");
    const mediaType  = detectMediaType(screenshotPath);

    // Lesson: include image block BEFORE the text block — Claude reads top-to-bottom
    // Use the same structured prompting principles: give Claude a clear analysis task
    // cache_control on the LAST block = cache everything up to and including it
    userContent = [
      {
        type: "image",
        source: { type: "base64", media_type: mediaType, data: base64Data },
      },
      {
        type: "text",
        text:
          "The image above is a screenshot of the UI page under test. " +
          "Use it to identify the exact label text, button names, ARIA roles, " +
          "and any other visible identifiers to build accurate Playwright locators.\n\n" +
          playwrightPrompt(manualTest),
        cache_control: { type: "ephemeral" },   // cache image + text together
      } as Anthropic.TextBlockParam & { cache_control: { type: "ephemeral" } },
    ];
  } else {
    // Longhand required to attach cache_control (shorthand string cannot carry it)
    userContent = [
      {
        type: "text",
        text: playwrightPrompt(manualTest),
        cache_control: { type: "ephemeral" },   // cache the large prompt on every loop turn
      } as Anthropic.TextBlockParam & { cache_control: { type: "ephemeral" } },
    ];
  }

  conversationHistory.push({ role: "user", content: userContent });
  return callClaude(useThinking, thinkingBudget);
}

async function callClaude(
  // Lesson: Extended Thinking — enable only when default quality isn't sufficient.
  // Must test without thinking first, then enable if evaluations fail.
  useThinking  = false,
  thinkingBudget = 8000,  // minimum allowed: 1024; max_tokens must exceed this
): Promise<PlaywrightTestResult> {
  // Local message list for the tool-use loop.
  // conversationHistory is only updated at the start (by callers) and at the end (below).
  const messages: Anthropic.MessageParam[] = [...conversationHistory];

  // ── Lesson: Multi-Turn Conversations with Tools ───────────────────────────
  // Accumulate text blocks across all turns so Claude's reasoning is preserved.
  // Each iteration may add explanatory text (e.g. "Reading your config now...").
  const accumulatedNotes: string[] = [];

  // Loop continues until Claude calls output_playwright_test (or throws on end_turn)
  while (true) {
    // ── Lesson: Extended Thinking ─────────────────────────────────────────────
    // When thinking is enabled:
    //   - temperature MUST be 1 (API rejects other values)
    //   - max_tokens must EXCEED thinking_budget (budget is for reasoning tokens only)
    //   - Response includes a `thinking` block (with signature) + a `text` block
    //   - Redacted thinking: type === "redacted_thinking" — keep in history unchanged
    //     so Claude retains context from its encrypted reasoning in future turns
    //   - thinking blocks are already preserved: we store full response.content in history
    const thinkingConfig = useThinking
      ? { type: "enabled" as const, budget_tokens: thinkingBudget }
      : undefined;

    // ── Lesson: Prompt Caching ────────────────────────────────────────────────
    // Problem: the tool-use loop calls the API on every turn with the same system prompt
    // and tools array. Without caching, Claude re-tokenises + re-embeds them each time.
    // Solution: mark stable content with cache_control: { type: "ephemeral" }.
    //   - system prompt  → identical every turn → always a cache hit on turn 2+
    //   - tools array    → identical every turn → cache the last tool to cover the whole list
    // Benefit: faster responses + lower cost (cached tokens billed at reduced rate).
    // Limitation: cache lives 5 minutes — fine for our tool-use loop (seconds per turn).
    //
    // API shape:
    //   system: [ { type: "text", text: "...", cache_control: { type: "ephemeral" } } ]
    //   tools:  last tool gets  cache_control: { type: "ephemeral" }
    const toolsWithCache = [...TOOLS, WEB_SEARCH_TOOL].map((tool, idx, arr) =>
      idx === arr.length - 1
        ? { ...tool, cache_control: { type: "ephemeral" } }  // cache the whole tools prefix
        : tool
    );

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-latest",
      // thinking needs headroom: budget for reasoning + buffer for the actual response
      max_tokens: useThinking ? thinkingBudget + 2000 : 4000,
      // Lesson: thinking requires temperature=1; otherwise keep 0.1 for deterministic code
      temperature: useThinking ? 1 : 0.1,
      ...(thinkingConfig && { thinking: thinkingConfig }),
      // Cache the system prompt: same text every turn, no need to reprocess it
      system: [
        {
          type: "text",
          text: PLAYWRIGHT_SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      // Spread custom tools + built-in web search tool.
      // Web search is server-side: its server_tool_use blocks require no client response.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: toolsWithCache as any[],
      // "auto" lets Claude choose: call get_project_config first, then output_playwright_test
      tool_choice: { type: "auto" },
      messages,
    });

    // Append Claude's reply to the loop messages
    messages.push({ role: "assistant", content: response.content });

    // ── Lesson: Monitoring cache behavior ────────────────────────────────────
    // response.usage reports token counts for this turn:
    //   cache_creation_input_tokens → tokens written to cache (first request or cache miss)
    //   cache_read_input_tokens     → tokens read from cache (cache hit — cheaper + faster)
    //   input_tokens                → uncached tokens processed normally
    // Log in dev so we can verify caching is actually working as expected.
    if (process.env.NODE_ENV !== "production") {
      const u = response.usage as Record<string, number>;
      const cacheWrite = u["cache_creation_input_tokens"] ?? 0;
      const cacheRead  = u["cache_read_input_tokens"]     ?? 0;
      if (cacheWrite > 0 || cacheRead > 0) {
        console.debug(
          `[cache] turn write=${cacheWrite} read=${cacheRead} uncached=${u["input_tokens"] ?? 0}`
        );
      }
    }

    // Capture any text blocks Claude sent alongside tool calls this turn
    // Lesson: multi-block messages can have BOTH text + tool_use — don't discard the text
    const turnText = extractTextBlocks(response.content);
    if (turnText) accumulatedNotes.push(turnText);

    // ── Lesson: Sending Tool Results ──────────────────────────────────────────
    // Each tool_result must match the tool_use_id from Claude's request.
    // is_error: true tells Claude something went wrong — it won't use bad data to generate tests.
    // Claude can request multiple tool calls in one response; collect all results before replying.
    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    let finalResult: PlaywrightTestResult | null = null;

    for (const block of response.content) {
      if (block.type !== "tool_use") continue;

      if (block.name === "output_playwright_test") {
        // Final structured output — exit the loop
        finalResult = block.input as PlaywrightTestResult;
      } else {
        // Data-fetching tool — execute and send result back with matching tool_use_id
        // Pass block.input so batch_tool receives its invocations list
        let data: string;
        let isError = false;
        try {
          data = executeTool(block.name, block.input as Record<string, unknown>);
          // If the tool itself returned an error JSON, flag it so Claude knows
          const parsed = JSON.parse(data) as Record<string, unknown>;
          if (typeof parsed.error === "string") isError = true;
        } catch (err) {
          data = `Tool execution failed: ${err instanceof Error ? err.message : String(err)}`;
          isError = true;
        }
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,   // must match the ID from Claude's request
          content: data,
          is_error: isError,       // lesson: set true so Claude handles error gracefully
        });
      }
    }

    if (finalResult) {
      // Attach all reasoning text Claude produced across every turn
      finalResult.notes = accumulatedNotes.join("\n\n");
      // ── Lesson: Handling Multi-Block Messages ──────────────────────────────
      // WRONG (old): content: JSON.stringify(finalResult)  — loses block structure
      // CORRECT: save the full response.content array — preserves text + tool_use blocks
      // so future refinePlaywrightTest() calls have valid conversation history.
      conversationHistory.push({ role: "assistant", content: response.content });

      // API requirement: every tool_use block must be followed by a tool_result in the
      // next user turn. Without this, the next API call would return a 400 error.
      const outputBlock = response.content.find(
        (b): b is Anthropic.ToolUseBlock =>
          b.type === "tool_use" && b.name === "output_playwright_test"
      );
      if (outputBlock) {
        conversationHistory.push({
          role: "user",
          content: [{
            type: "tool_result",
            tool_use_id: outputBlock.id,
            content: "Test generated successfully.",
          }],
        });
      }

      return finalResult;
    }

    if (toolResults.length > 0) {
      // Feed all tool results back to Claude in a single user turn, then loop
      messages.push({ role: "user", content: toolResults });
    }

    // ── Lesson: Detecting Tool Requests ──────────────────────────────────────
    // stop_reason === "tool_use"  → Claude wants more tool data, keep looping
    // stop_reason === "end_turn"  → Claude is done but didn't call output_playwright_test
    // Checking stop_reason is the official Anthropic pattern — more reliable than
    // inspecting content blocks, because it handles edge cases like empty tool lists.
    if (response.stop_reason !== "tool_use") {
      throw new Error(
        `Claude stopped (stop_reason: "${response.stop_reason}") without calling output_playwright_test. ` +
        `Notes collected: ${accumulatedNotes.join(" | ") || "(none)"}`
      );
    }
  }
}