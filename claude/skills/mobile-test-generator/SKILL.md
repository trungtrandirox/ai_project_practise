---
description: Generate mobile test code or mobile test cases from manual mobile test steps. USE when user provides mobile app test steps mentioning tap, swipe, scroll, pinch, device rotation, app launch, push notification, or specific mobile gestures. Keywords that trigger this skill: "mobile test", "iOS test", "Android test", "test on mobile", "automate mobile", "tap button", "swipe", "mobile app test".
allowed-tools: Read, Write, Grep
---

# Mobile Test Generator

## Detect mobile test type first

| Type | When to use | Tool |
|------|-------------|------|
| **Mobile Web** | App runs in a mobile browser (Chrome/Safari mobile) | Playwright + device emulation |
| **Native App** | App installed from App Store / Google Play | Appium (not Playwright) |

> ⚠️ Playwright does NOT support native apps (iOS/Android). For native apps → generate Appium-style pseudocode + setup guidance.

---

## Mobile Web Tests (Playwright)

### Available devices in Playwright
```typescript
// iOS
devices['iPhone 15']
devices['iPhone 15 Pro']
devices['iPad Pro 11']

// Android
devices['Pixel 7']
devices['Galaxy S23']

// See full list: npx playwright show-devices
```

### Output format — Mobile Web
```typescript
import { test, expect, devices } from '@playwright/test';

// Chọn device để test
test.use({ ...devices['iPhone 15'] });

test.describe('[Module] Mobile Web Tests', () => {

  test('TC-001 [Positive] 🚀 Smoke — test description', async ({ page }) => {
    await page.goto('/login');

    // Tap = click in Playwright mobile emulation
    await page.getByRole('button', { name: 'Login' }).tap();

    // Check mobile viewport
    const viewportSize = page.viewportSize();
    expect(viewportSize?.width).toBe(390); // iPhone 15 width

    await expect(page).toHaveURL('/dashboard');
  });

});
```

### Common mobile gestures in Playwright
```typescript
// Tap (single finger touch)
await element.tap();

// Scroll down
await page.mouse.wheel(0, 500);

// Swipe (using touch events)
await page.touchscreen.tap(200, 400);

// Check element is visible in viewport
await expect(element).toBeInViewport();

// Set responsive layout
await page.setViewportSize({ width: 390, height: 844 }); // iPhone 15
```

---

## Native App Tests (Appium — pseudocode)

> Playwright does not support native apps. Below is Appium pseudocode for reference or to share with a developer.

```typescript
// Appium + WebDriverIO (TypeScript)
// Requires: Appium server + device/emulator + app file (.apk or .ipa)

import { remote } from 'webdriverio';

const driver = await remote({
  capabilities: {
    platformName: 'Android',          // or 'iOS'
    'appium:deviceName': 'Pixel 7',
    'appium:app': '/path/to/app.apk',
    'appium:automationName': 'UiAutomator2'  // iOS: 'XCUITest'
  }
});

// Tap button by accessibility id
const loginBtn = await driver.$('~loginButton');
await loginBtn.click();

// Type text
const emailField = await driver.$('~emailInput');
await emailField.setValue('user@test.com');

// Swipe up
await driver.touchAction([
  { action: 'press', x: 200, y: 600 },
  { action: 'moveTo', x: 200, y: 200 },
  { action: 'release' }
]);
```

---

## Smoke vs Regression for Mobile tests

| Label | When to use |
|-------|-------------|
| 🚀 Smoke | Main screen loads, core features are tappable |
| 🔁 Regression | Responsive layout, gestures, orientation, offline mode |

---

## Example

**Input (manual):**
```
1. Open app on iPhone
2. Tap "Login with Google"
3. Select Google account
4. Verify redirect to Home screen
```

**Output:**
```typescript
import { test, expect, devices } from '@playwright/test';

// Emulate iPhone 15
test.use({ ...devices['iPhone 15'] });

test.describe('[Auth] Mobile Login Tests', () => {

  test('TC-001 [Positive] 🚀 Smoke — Google login succeeds on iPhone', async ({ page }) => {
    // Open login page
    await page.goto('/login');

    // Tap Login with Google button
    await page.getByRole('button', { name: 'Login with Google' }).tap();

    // Verify redirect to Home after login
    await expect(page).toHaveURL('/home');
    await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();
  });

  test('TC-002 [UX] 🔁 Regression — Login button displays correctly on small screen', async ({ page }) => {
    await page.goto('/login');

    // Check button is visible and not clipped by small viewport
    const loginBtn = page.getByRole('button', { name: 'Login with Google' });
    await expect(loginBtn).toBeVisible();
    await expect(loginBtn).toBeInViewport();
  });

  test('TC-003 [Edge] 🔁 Regression — landscape orientation works correctly', async ({ page }) => {
    // Switch to landscape
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto('/login');

    // Layout must still be usable
    await expect(page.getByRole('button', { name: 'Login with Google' })).toBeVisible();
  });

});
```

> 💡 **Note:** For native app testing (not mobile web), use **Appium** instead of Playwright. Ask me for Appium setup guidance.

---

## Rules
- Always ask: "Mobile web or native app?" if unclear
- Mobile web → use Playwright `devices`
- Native app → generate Appium pseudocode + clearly note limitations
- Always test both portrait and landscape orientations for mobile
- Never use CSS class selectors
- Use `tap()` instead of `click()` when testing with mobile emulation
