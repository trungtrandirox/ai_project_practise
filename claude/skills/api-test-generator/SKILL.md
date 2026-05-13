---
description: Generate Playwright API test code from manual API test steps or API descriptions. USE when user provides API endpoint details, HTTP methods, request/response expectations, or Postman-style test steps that need to be automated. Keywords that trigger this skill: "API test", "test this endpoint", "POST request test", "GET request test", "convert API test", "automate API", "Postman to Playwright".
allowed-tools: Read, Write, Grep
---

# API Test Generator (Playwright)

## When you receive API test input:
1. Identify: HTTP method, endpoint URL, headers, request body, expected response
2. Generate Playwright API test using `request` context
3. Assert both status code AND response body fields
4. Cover happy path + at least 2 error scenarios
5. Return clean TypeScript using `@playwright/test`

---

## What to look for in the input

| Field | Example |
|-------|---------|
| Method | GET, POST, PUT, PATCH, DELETE |
| Endpoint | `/api/v1/users`, `/api/auth/login` |
| Headers | `Authorization: Bearer token`, `Content-Type: application/json` |
| Request body | `{ "email": "...", "password": "..." }` |
| Expected status | 200, 201, 400, 401, 404, 422 |
| Expected response | `{ "token": "...", "user": { "id": 1 } }` |

---

## Output format

### Test file structure
```typescript
import { test, expect } from '@playwright/test';

// Base URL — set in playwright.config.ts as baseURL
const BASE_URL = process.env.BASE_URL ?? 'https://api.example.com';

test.describe('[Module Name] API Tests', () => {

  test('TC-001 [Positive] 🚀 Smoke — description', async ({ request }) => {
    // Send request
    const response = await request.post(`${BASE_URL}/api/endpoint`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.API_TOKEN}`
      },
      data: {
        key: 'value'
      }
    });

    // Assert status code
    expect(response.status()).toBe(200);

    // Assert response body
    const body = await response.json();
    expect(body.field).toBe('expectedValue');
    expect(body).toHaveProperty('id');
  });

});
```

---

## Smoke vs Regression for API tests

| Label | When to use |
|-------|-------------|
| 🚀 Smoke | Happy path — API returns correct 200/201 with valid data |
| 🔁 Regression | Error cases — 400, 401, 404, 422, timeout, missing fields |

---

## Common API test patterns

### Auth header
```typescript
headers: {
  'Authorization': `Bearer ${process.env.API_TOKEN}`
}
```

### Assert array response
```typescript
const body = await response.json();
expect(Array.isArray(body.data)).toBe(true);
expect(body.data.length).toBeGreaterThan(0);
```

### Assert error response
```typescript
expect(response.status()).toBe(422);
const body = await response.json();
expect(body.message).toContain('validation');
```

### Assert response time (performance check)
```typescript
const start = Date.now();
const response = await request.get(`${BASE_URL}/api/users`);
const duration = Date.now() - start;
expect(duration).toBeLessThan(2000); // must respond within 2 seconds
```

---

## Example

**Input (manual):**
```
POST /api/auth/login
Body: { email: "user@test.com", password: "Test@1234" }
Expected: 200, returns { token: "...", user: { id, email } }
```

**Output:**
```typescript
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? 'https://api.example.com';

test.describe('[Auth] Login API Tests', () => {

  test('TC-001 [Positive] 🚀 Smoke — login with valid credentials returns token', async ({ request }) => {
    // Send POST request to login endpoint
    const response = await request.post(`${BASE_URL}/api/auth/login`, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        email: 'user@test.com',
        password: 'Test@1234'
      }
    });

    // Assert status 200
    expect(response.status()).toBe(200);

    // Assert response contains token and user info
    const body = await response.json();
    expect(body).toHaveProperty('token');
    expect(body.user).toHaveProperty('id');
    expect(body.user.email).toBe('user@test.com');
  });

  test('TC-002 [Negative] 🔁 Regression — login with wrong password returns 401', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/auth/login`, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        email: 'user@test.com',
        password: 'WrongPassword'
      }
    });

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.message).toBeTruthy(); // must return an error message
  });

  test('TC-003 [Negative] 🔁 Regression — login with missing password returns 422', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/auth/login`, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        email: 'user@test.com'
        // password is missing
      }
    });

    expect(response.status()).toBe(422);
  });

});
```

---

## Rules
- Always use `process.env` for BASE_URL and token — never hardcode in tests
- Always assert both status code AND response body
- Each test covers exactly 1 scenario
- Name tests clearly: method + endpoint + expected outcome
- If expected response is missing, ask: "What does the API return on success?"
- TypeScript only — never JavaScript
