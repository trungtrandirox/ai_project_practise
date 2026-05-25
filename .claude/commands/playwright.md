Convert the following manual test steps into a Playwright TypeScript test: $ARGUMENTS

Rules to follow:
- Use TypeScript, never JavaScript
- Use `@playwright/test` imports
- Locator priority: `getByRole` → `getByLabel` → `getByText` → `getByTestId` → `getByPlaceholder`
- NEVER use CSS class selectors like `.btn-primary`
- Add `await expect()` assertions for every verification step
- Add a short comment above each block explaining what it does
- Wrap everything in a `test()` block with a descriptive name

Output format:
```typescript
import { test, expect } from '@playwright/test';

test('descriptive test name here', async ({ page }) => {
  // your generated code
});
```
