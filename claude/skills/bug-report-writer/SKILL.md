---
description: Write a complete, professional bug report from a rough bug description. USE when user has found a bug and wants to document it properly. Keywords that trigger this skill: "write bug report", "log this bug", "create defect report", "document this issue", "report this bug".
allowed-tools: Read, Write
---

# AI Bug Report Writer

## When you receive a rough bug description:
1. Ask clarifying questions if critical info is missing (see required fields below)
2. Structure all info into the standard bug report format
3. Write clear, professional language — not too technical, not too vague
4. Always include Expected vs Actual result

---

## Required fields (ask if missing)
- **What happened?** — actual behavior
- **What should have happened?** — expected behavior
- **Steps to reproduce** — numbered, specific
- **Environment** — browser, OS, device, app version
- **How often does it happen?** — always / sometimes / once

---

## Bug Report Output Format

### Title
`[Module] Short description of what is broken`
Example: `[Login] Login button unresponsive on Safari after entering valid credentials`

### Environment
| Field | Value |
|-------|-------|
| Browser | e.g. Safari 17.4 |
| OS | e.g. macOS Sonoma 14.4 |
| Device | e.g. MacBook Pro / iPhone 15 |
| App Version | e.g. v2.3.1 |
| Test Environment | e.g. Staging / Production |

### Severity
🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low

### Priority
🔴 Urgent / 🟠 High / 🟡 Normal / 🟢 Low

### Steps to Reproduce
1. Step one (start from the beginning)
2. Step two
3. Step three
...

### Expected Result
What should happen according to requirements or common sense.

### Actual Result
What actually happens — be specific, include error messages if any.

### Attachments
- [ ] Screenshot
- [ ] Screen recording
- [ ] Console log / error log
- [ ] Network request (from DevTools)

### Additional Notes
Any extra context: only happens on certain accounts, started after a deployment, related to a recent change, workaround found, etc.

---

## Example

**Input (rough):** "Login doesn't work on Safari"

**Output:**

**Title:** `[Login] Login button unresponsive on Safari after entering valid credentials`

**Environment:**
| Field | Value |
|-------|-------|
| Browser | Safari 17.4 |
| OS | macOS Sonoma 14.4 |
| Device | MacBook Pro M2 |
| App Version | v2.3.1 |
| Test Environment | Staging |

**Severity:** 🟠 High
**Priority:** 🟠 High

**Steps to Reproduce:**
1. Open `https://staging.app.com/login` in Safari
2. Enter valid email: `testuser@example.com`
3. Enter valid password: `Test@1234`
4. Click the "Login" button

**Expected Result:**
User is redirected to the Dashboard page after successful authentication.

**Actual Result:**
The Login button appears to be clicked (visual press state) but nothing happens. No redirect, no error message, no API call visible in Network tab.

**Attachments:**
- [ ] Screenshot of the login page after clicking
- [ ] Safari console log showing any JS errors
- [ ] Network tab showing no API request was made

**Additional Notes:**
- Works correctly on Chrome and Firefox
- Tested with 3 different valid accounts — same result
- Issue not present on the production environment (v2.3.0)

---

## Rules
- Title must include the module name in brackets
- Steps must be numbered and start from opening the browser/app
- Expected and Actual must never be the same
- Severity = impact on users; Priority = urgency to fix
- If no environment info given, add a placeholder and note "Please verify environment details"
- Never write "it doesn't work" — always describe specifically what happens

---

## Discernment Checklist — Before returning output, verify:
- [ ] Title follows format: `[Module] Short description` — module name is in brackets
- [ ] All required fields are present: Environment, Severity, Priority, Steps, Expected, Actual
- [ ] Steps start from opening the browser/app — not mid-flow
- [ ] Expected Result and Actual Result are clearly different and specific
- [ ] Severity and Priority are both assigned and explained (not just a label)
- [ ] Language is specific — no vague phrases like "doesn't work" or "broken"
- [ ] If any environment field is unknown, placeholder + "Please verify" note is added
- [ ] Attachments checklist is included in output
