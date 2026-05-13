---
description: Generate comprehensive test cases from a requirement or user story. USE when user provides a requirement, feature description, user story, or acceptance criteria that needs test cases generated. Keywords that trigger this skill: "generate test cases", "write test cases", "test this requirement", "create test scenarios".
allowed-tools: Read, Write, WebSearch
---

# AI Test Case Generator

## When you receive a requirement or user story:
1. Understand the feature from a user's perspective
2. Identify all actors, actions, and expected results
3. Generate test cases grouped by category
4. Classify each test case as Smoke or Regression
5. Number each test case clearly
6. Keep language simple — no code, just steps

---

## Output format

### Requirement
Restate the requirement in one sentence for clarity.

### Test Classification — Smoke vs Regression

| Type | When to run | Goal | Volume |
|------|-------------|------|--------|
| 🚀 **Smoke Test** | After every build/deploy | Verify core features are working | Small — only the most critical happy paths |
| 🔁 **Regression Test** | Before release, after bug fixes | Ensure nothing is broken after changes | Full — all categories |

**Classification rules:**
- `Smoke` = Positive cases of core features (can the app be used at all?)
- `Regression` = All Negative + Edge + Security + UX cases + secondary Positive cases

---

### Test Cases

#### ✅ Positive Cases (Happy Path)
Test cases where everything works as expected.
- Valid inputs, normal user behavior
- Most common use cases

#### ❌ Negative Cases
Test cases where user does something wrong.
- Invalid inputs
- Missing required fields
- Wrong format (e.g. email without @)

#### ⚠️ Edge Cases
Boundary and unusual but valid situations.
- Empty values, very long text, special characters
- Min/max values
- Slow network, timeout

#### 🔒 Security Cases
Test cases to catch security vulnerabilities.
- SQL injection in input fields
- Brute force attempts
- Access without authentication
- Expired tokens / sessions

#### 🎨 UX Cases
Test cases for user experience quality.
- Error messages are clear and helpful
- Loading states are shown
- Button states (disabled, loading, success)
- Responsive on mobile vs desktop

---

## Example

**Requirement:** User can reset password via email OTP

**TC-001 [Positive] 🚀 Smoke** — Reset password with valid email and correct OTP
- Steps: Enter registered email → Click Send OTP → Receive OTP → Enter OTP → Enter new password → Confirm
- Expected: Password changed successfully, redirected to login page

**TC-002 [Negative] 🔁 Regression** — Enter unregistered email
- Steps: Enter email not in the system → Click Send OTP
- Expected: Error message "Email not found"

**TC-003 [Negative] 🔁 Regression** — Enter wrong OTP
- Steps: Enter valid email → Enter incorrect OTP
- Expected: Error message "Invalid OTP"

**TC-004 [Edge] 🔁 Regression** — OTP expires
- Steps: Request OTP → Wait until expired → Enter OTP
- Expected: Error message "OTP expired. Please request a new one."

**TC-005 [Edge] 🔁 Regression** — Use OTP twice
- Steps: Request OTP → Use it successfully → Try to use the same OTP again
- Expected: Second use is rejected

**TC-006 [Security] 🔁 Regression** — Brute force OTP
- Steps: Enter random OTPs repeatedly
- Expected: Account locked or rate limited after N failed attempts

**TC-007 [UX] 🔁 Regression** — Send OTP button shows countdown
- Steps: Click Send OTP
- Expected: Button shows "Resend in 60s" and is disabled until timer ends

---

### Smoke Test Suite (run after every deploy)
Summary of TCs marked 🚀 Smoke — fast to run, covers core features.

### Regression Test Suite (run before release)
All TCs above, including Smoke.

---

## Rules
- Always cover all 5 categories: Positive, Negative, Edge, Security, UX
- Number test cases as TC-001, TC-002...
- Each test case must have: Steps + Expected Result
- Every TC must be labeled either 🚀 Smoke or 🔁 Regression
- Smoke is only for Positive cases of core features — maximum 20% of total TCs
- Use plain language — no technical jargon unless necessary
- If the requirement is vague, ask 1-2 clarifying questions before generating
