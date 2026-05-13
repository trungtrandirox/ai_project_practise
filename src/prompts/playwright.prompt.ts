---
description: Convert manual test cases into Playwright automation. USE when user provides numbered test steps, manual test scenarios, or test case descriptions that need to be automated.
---

# Manual Test to Playwright Converter

## When you receive manual test steps:
1. Identify the actions (click, type, navigate, verify)
2. Map each step to a Playwright command
3. Suggest realistic locators (by role, label, text — NOT by CSS class)
4. Add edge cases the QA may have missed
5. Return clean TypeScript with Playwright Test format

## Locator priority order:
1. `getByRole()`
2. `getByLabel()`
3. `getByText()`
4. `getByTestId()` (only if test-id exists)
5. NEVER use `.css-xyz` dynamic class selectors

## Output format:
- Playwright test block (TypeScript)
- Suggested locators table
- Edge cases list