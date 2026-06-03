/**
 * REFERENCE EXAMPLE — This is the quality bar for manual-to-playwright conversions.
 * Source: Login feature — converted from manual test steps
 * Convention: follows CLAUDE.md + SKILL.md standards
 */

import { test, expect } from '@playwright/test';

test.describe('Login Feature', () => {

  // ── TC-001 [Positive] 🚀 Smoke ──────────────────────────────────────────────
  test('TC-001 [Positive] Smoke — login with valid credentials redirects to dashboard', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');

    // Fill in credentials using semantic locators
    await page.getByLabel('Email').fill('testuser@example.com');      // getByLabel preferred for form inputs
    await page.getByLabel('Password').fill('Test@123456');             // never use real passwords

    // Submit the form
    await page.getByRole('button', { name: 'Login' }).click();        // getByRole preferred for buttons

    // Verify successful login
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  // ── TC-002 [Negative] 🔁 Regression ────────────────────────────────────────
  test('TC-002 [Negative] Regression — login with wrong password shows error message', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Email').fill('testuser@example.com');
    await page.getByLabel('Password').fill('WrongPassword123');

    await page.getByRole('button', { name: 'Login' }).click();

    // Verify error is shown — do NOT assert URL changed
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('alert')).toContainText('Invalid');   // Assumed: error text contains "Invalid"
  });

  // ── TC-003 [Negative] 🔁 Regression ────────────────────────────────────────
  test('TC-003 [Negative] Regression — login with empty email shows validation error', async ({ page }) => {
    await page.goto('/login');

    // Leave email empty, fill password only
    await page.getByLabel('Password').fill('Test@123456');
    await page.getByRole('button', { name: 'Login' }).click();

    // Assumed: HTML5 validation or inline error message shown
    await expect(page.getByLabel('Email')).toBeFocused();
  });

  // ── TC-004 [Security] 🔁 Regression ────────────────────────────────────────
  test('TC-004 [Security] Regression — SQL injection in email field does not authenticate', async ({ page }) => {
    await page.goto('/login');

    // Attempt SQL injection — should NOT login
    await page.getByLabel('Email').fill("' OR '1'='1");
    await page.getByLabel('Password').fill('anything');
    await page.getByRole('button', { name: 'Login' }).click();

    // Should NOT redirect to dashboard
    await expect(page).not.toHaveURL('/dashboard');
    await expect(page.getByRole('alert')).toBeVisible();
  });

  // ── TC-005 [Edge] 🔁 Regression ─────────────────────────────────────────────
  test('TC-005 [Edge] Regression — login button is disabled while request is in progress', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Email').fill('testuser@example.com');
    await page.getByLabel('Password').fill('Test@123456');

    // Click and immediately check button is disabled (prevents double-submit)
    const loginButton = page.getByRole('button', { name: 'Login' });
    await loginButton.click();
    await expect(loginButton).toBeDisabled();                          // Assumed: button disables on submit
  });

});

/**
 * Locator suggestions table (reference)
 *
 * | Element        | Locator used                              | Why                          |
 * |----------------|-------------------------------------------|------------------------------|
 * | Email input    | getByLabel('Email')                       | Semantic, tied to label text |
 * | Password input | getByLabel('Password')                    | Semantic, tied to label text |
 * | Login button   | getByRole('button', { name: 'Login' })    | Role + name = most reliable  |
 * | Error message  | getByRole('alert')                        | ARIA role for error regions  |
 *
 * Edge cases to consider:
 * - Account lockout after N failed attempts (brute force protection)
 * - Remember me / persistent session behavior
 * - Redirect to originally requested URL after login
 * - Session expiry handling while on dashboard
 * - Login on mobile viewport (Safari/WebKit quirks)
 */
