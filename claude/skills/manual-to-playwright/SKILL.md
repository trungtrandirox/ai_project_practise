---
description: Convert manual test steps into Playwright automation code. USE when user provides numbered test steps, manual test scenarios, or test case descriptions that need to be automated with Playwright. Supports Web UI, API, and Mobile (Appium-style notes). Keywords that trigger this skill: "convert to playwright", "automate this test", "write playwright test", "manual to automation".
allowed-tools: Read, Write, Grep
---

# Manual Test to Playwright Converter

## Detect test type from input
- **Web UI** — steps mention clicking, typing, navigating pages
- **API** — steps mention HTTP methods (GET/POST), endpoints, request/response
- **Mobile** — steps mention tap, swipe, app launch, device

---

## Web UI Tests

### When you receive web manual steps:
1. Identify each action: navigate, click, fill, verify
2. Map to Playwright commands
3. Suggest locators using priority order below
4. Add assertions for each verification step
5. Return clean TypeScript using `@playwright/test`

### Locator priority (most preferred first):
1. `getByRole()` — button, textbox, heading, checkbox
2. `getByLabel()` — for form inputs with a label
3. `getByText()` — for visible text content
4. `getByTestId()` — only if `data-testid` exists in DOM
5. `getByPlaceholder()` — fallback for inputs with placeholder
6. **NEVER** use `.css-xyz` dynamic class selectors

### Web output format:
```typescript
import { test, expect } from '@playwright/test';

test('test name from manual step description', async ({ page }) => {
  // steps here
});
```

### Web example:
Manual: "Go to login page → Enter email → Enter password → Click Login → Verify dashboard"
```typescript
test('user can login with valid credentials', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('user@example.com');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL('/dashboard');
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});
```

---

## API Tests

### When you receive API manual steps:
1. Identify: method, endpoint, headers, request body, expected response
2. Use Playwright `request` context
3. Assert status code AND response body

### API output format:
```typescript
import { test, expect } from '@playwright/test';

test('API test name', async ({ request }) => {
  const response = await request.post('/api/endpoint', {
    data: { key: 'value' }
  });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.field).toBe('expectedValue');
});
```

---

## Mobile Tests

### When you receive mobile manual steps:
1. Note: Playwright does not natively support mobile apps
2. Generate Playwright mobile **viewport** test for mobile web
3. Add a note suggesting Appium for native app automation

### Mobile web output format:
```typescript
import { test, expect, devices } from '@playwright/test';

test.use({ ...devices['iPhone 14'] });

test('mobile test name', async ({ page }) => {
  // steps here
});
```

---

## Output structure (always include all 3 sections)

1. **Playwright test code** — full runnable TypeScript block
2. **Locator suggestions table**

| Step | Suggested Locator | Why |
|------|-------------------|-----|
| Click Login | `getByRole('button', { name: 'Login' })` | Semantic, accessible |

3. **Edge cases to consider** — 3 to 5 bullet points the QA may have missed

---

## Rules
- Always use TypeScript, never JavaScript
- Always use `@playwright/test`, never `playwright` directly
- Group related tests in `test.describe()` blocks if there are 3+ tests
- Never hardcode URLs — use relative paths like `/login`
- If manual steps are ambiguous, note the assumption made