export const playwrightPrompt = (manualTest: string) => `
You are a senior QA automation engineer.

Convert the following manual test into:
1. Playwright test
2. Suggested locators
3. Edge cases

Manual test:
${manualTest}

Return clean markdown.
`;