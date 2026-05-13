import Anthropic = require("@anthropic-ai/sdk");
import { playwrightPrompt } = require("../prompts/playwright.prompt");

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function generatePlaywrightTest(
  manualTest: string
) {
  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-latest",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: playwrightPrompt(manualTest),
      },
    ],
  });

  return response.content[0];
}