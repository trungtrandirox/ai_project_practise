Run an eval for the skill named in $ARGUMENTS.

Supported skills: `manual-to-playwright`, `test-case-generator`, `bug-analyzer`, `bug-report-writer`, `test-coverage-reviewer`, `api-test-generator`, `mobile-test-generator`

If no skill name is given, ask: "Which skill do you want to eval? (manual-to-playwright / test-case-generator / bug-analyzer / bug-report-writer / test-coverage-reviewer / api-test-generator / mobile-test-generator)"

---

## How to run the eval

### Step 1 — Select the right eval suite

**manual-to-playwright** — run these 3 test prompts:
- **Prompt A (Typical):** "Convert these steps to Playwright: 1. Go to /login 2. Enter email testuser@example.com 3. Enter password Test@123456 4. Click Login 5. Verify dashboard heading is visible"
- **Prompt B (Edge — vague steps):** "Convert these steps: 1. Open the app 2. Login 3. Go to profile 4. Change the name 5. Save"
- **Prompt C (Negative flow):** "Convert these steps: 1. Go to /login 2. Enter wrong password 3. Verify error message appears"

**test-case-generator** — run these 3 test prompts:
- **Prompt A (Typical):** "Generate test cases for a user registration form with email, password, and confirm password fields"
- **Prompt B (Edge — minimal info):** "Generate test cases for search"
- **Prompt C (Complex):** "Generate test cases for a checkout flow with cart, shipping, payment, and order confirmation steps"

**bug-analyzer** — run these 3 test prompts:
- **Prompt A (Typical):** "Analyze this bug: On the login page, clicking Login with valid credentials shows a 500 error. Steps: 1. Go to /login 2. Enter valid email/password 3. Click Login. Expected: redirect to dashboard. Actual: 500 Internal Server Error."
- **Prompt B (Edge — no steps):** "The app crashes sometimes when I click Save"
- **Prompt C (Severity edge):** "Button color is slightly off on the homepage"

**bug-report-writer** — run these 3 test prompts:
- **Prompt A (Typical):** "Write a bug report: The forgot password link on /login does nothing when clicked in Firefox"
- **Prompt B (Edge — missing info):** "Write a bug report: Payment fails"
- **Prompt C (Critical):** "Write a bug report: Users can log in with an expired password — the system accepts it and grants access"

**test-coverage-reviewer** — run these 3 test prompts:
- **Prompt A (Typical):** "Review coverage for the login feature. Current tests: valid login, invalid password, empty fields"
- **Prompt B (Edge — single test):** "Review coverage for checkout. Current test: happy path purchase"
- **Prompt C (Complex):** "Review coverage for user profile feature: view profile, edit name, edit email, change password, upload avatar, delete account"

**api-test-generator** — run these 3 test prompts:
- **Prompt A (Typical):** "Generate API tests for POST /api/login with body {email, password} — should return 200 with token on success"
- **Prompt B (Edge):** "Generate API tests for GET /api/users"
- **Prompt C (Auth):** "Generate API tests for DELETE /api/users/:id — requires Bearer token, returns 204 on success, 403 if not owner"

**mobile-test-generator** — run these 3 test prompts:
- **Prompt A (Typical):** "Generate mobile tests for login screen on iOS — tap email field, type credentials, tap Login button, verify home screen"
- **Prompt B (Edge — no platform):** "Generate mobile tests for the search feature"
- **Prompt C (Gesture):** "Generate mobile tests for swipe-to-delete on the notifications list"

---

### Step 2 — For each prompt, generate and score the output

Run each prompt through the skill, then score the output against the skill's Discernment Checklist.

Show results in this format for each prompt:

---
**Prompt [A/B/C] — [case type]**

Input: `[the prompt used]`

Output: [the generated output]

Score vs Discernment Checklist:
| Criterion | Pass/Fail | Note |
|-----------|-----------|------|
| [criterion 1] | ✅ / ❌ | [brief note] |
| [criterion 2] | ✅ / ❌ | [brief note] |
| ... | | |

**Result: X/N passed**
**Verdict:** ✅ Ship it / ⚠️ Fix before sharing / ❌ Needs rework

What to fix: [one concrete sentence if verdict is not ✅]

---

### Step 3 — Overall eval summary

After all 3 prompts, show:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EVAL SUMMARY — [skill name]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Prompt A (Typical):   ✅ / ⚠️ / ❌
Prompt B (Edge):      ✅ / ⚠️ / ❌
Prompt C ([type]):    ✅ / ⚠️ / ❌

Overall: X/3 passed
Ready to share: YES / NOT YET

Top issue to fix: [one line, or "None — skill is ready"]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If overall is 3/3: "Skill passes all eval cases. Ready to share with teammates."
If 2/3: "Skill handles typical cases well. Fix the edge case before sharing."
If 1/3 or 0/3: "Skill needs rework. Address the top issue and re-run eval."

---

### Step 4 — Ask for iteration

After the summary, ask:
"Do you want me to revise the skill based on these results? If yes, tell me which prompt's failure matters most — I'll update the SKILL.md to fix it and we can re-run."
