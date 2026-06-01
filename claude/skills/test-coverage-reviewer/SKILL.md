---
description: Review a list of test cases and identify gaps in test coverage. USE when user shares existing test cases and wants to know what is missing. Keywords that trigger this skill: "review test cases", "check coverage", "what am I missing", "is my test coverage enough", "find gaps in testing", "missing test cases".
allowed-tools: Read, Grep
---

# AI Test Coverage Reviewer

## When you receive a list of test cases:
1. Understand what feature/module is being tested
2. Categorize existing test cases by type
3. Identify what is missing in each category
4. Score the coverage (rough estimate)
5. List the most critical missing test cases first

---

## Coverage categories to check

| Category | What to look for |
|----------|-----------------|
| ✅ Positive / Happy path | Normal user flows with valid data |
| ❌ Negative | Invalid input, wrong data, user errors |
| ⚠️ Edge cases | Boundaries, empty values, max length, special chars |
| 🔒 Security | Auth bypass, injection, unauthorized access |
| 🎨 UX / UI | Error messages, loading states, empty states, responsive |
| ⚡ Performance | Slow network, large data, concurrent users |
| ♿ Accessibility | Keyboard nav, screen reader, color contrast |
| 🔄 Integration | Interactions with other features, APIs, third-party |

---

## Output format

### Coverage Summary
Brief paragraph: what feature is being tested, what the current test set covers well.

### Coverage Score
Rough estimate per category:

| Category | Coverage | Status |
|----------|----------|--------|
| Positive | 90% | ✅ Good |
| Negative | 40% | ⚠️ Needs work |
| Edge cases | 20% | ❌ Missing |
| Security | 0% | ❌ Not covered |
| UX/UI | 50% | ⚠️ Partial |
| Performance | 0% | ❌ Not covered |

### Missing Test Cases (prioritized)
List the most important missing cases first.
Format: `[Category] Description of missing test case`

### Recommendations
2–3 actionable suggestions to improve the test suite.

---

## Discernment Checklist — Before returning output, verify:
- [ ] All 8 coverage categories are assessed (not skipped even if 0%)
- [ ] Coverage score is given per category with a status indicator
- [ ] Missing test cases are prioritized — most critical gaps listed first
- [ ] Missing cases are formatted as `[Category] Description` consistently
- [ ] Recommendations are actionable (specific, not generic like "add more tests")
- [ ] Positive/Happy path coverage is evaluated first as a baseline
- [ ] Security and Accessibility categories are never marked N/A without justification

---

## Example

**Input:**
```
TC-001: Login with valid email and password → success
TC-002: Login with wrong password → error message shown
TC-003: Login with empty email → error shown
TC-004: Login redirects to dashboard after success
```

**Output:**

**Coverage Summary:**
These 4 test cases cover the basic login happy path and a couple of negative scenarios. The set is minimal and suitable for a first pass but missing critical security, edge, and UX coverage.

**Coverage Score:**

| Category | Coverage | Status |
|----------|----------|--------|
| Positive | 80% | ✅ Good |
| Negative | 30% | ⚠️ Needs work |
| Edge cases | 0% | ❌ Missing |
| Security | 0% | ❌ Not covered |
| UX/UI | 10% | ❌ Missing |
| Performance | 0% | ❌ Not covered |

**Missing Test Cases:**

[Security] Login with SQL injection in email field → should not authenticate
[Security] Brute force: 10+ failed login attempts → account lockout or rate limit
[Security] Login with expired session token → redirect to login page
[Edge] Login with email containing uppercase letters (e.g. User@Example.COM)
[Edge] Login with leading/trailing spaces in email field
[Edge] Very long email address (255+ characters)
[Negative] Login with empty password → error shown
[Negative] Login with unregistered email → appropriate error (not "wrong password")
[UX] Login button shows loading state while API call is in progress
[UX] Login button is disabled to prevent double submission
[UX] Error message is specific and user-friendly (not just "Error 401")
[UX] "Remember me" checkbox behavior tested
[Integration] Login with Google SSO — redirect and token handling

**Recommendations:**
1. Add at least 2 security test cases before going to production — SQL injection and brute force are critical
2. Separate "wrong password" and "unregistered email" errors — they should have different messages
3. Add a loading/disabled state test for the submit button to prevent duplicate API calls

---

## Rules
- Always check all 8 categories, even if some don't apply
- Mark categories as N/A with a reason if truly not applicable (e.g. no UI = no UX tests)
- Prioritize security and negative cases — these are most often skipped by QA
- Be specific: "missing test for X scenario" not just "needs more negative tests"
- If the feature is unclear from test case names, ask what module/feature is being tested
