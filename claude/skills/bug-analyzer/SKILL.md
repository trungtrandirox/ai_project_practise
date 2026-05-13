---
description: Analyze a bug description and provide root cause analysis, severity rating, and regression areas. USE when user describes a bug, defect, or unexpected behavior in an app. Keywords that trigger this skill: "bug", "issue", "not working", "broken", "analyze this bug", "root cause", "why is this failing".
allowed-tools: Read, Grep, WebSearch
---

# AI Bug Analyzer

## When you receive a bug description:
1. Restate the bug clearly in one sentence
2. List possible root causes (technical, not vague)
3. Assign severity level with justification
4. List regression areas — what else could be affected
5. Suggest quick verification steps to confirm the bug

---

## Output format

### Bug Summary
One clear sentence describing what is broken.

### Possible Root Causes
List 3–5 technical causes, most likely first.
- Be specific: name the layer (frontend, backend, DB, network, auth)
- Example: "JWT token not being sent in Authorization header"
- NOT vague: "something wrong with login"

### Severity
Choose one and explain why:

| Level | When to use |
|-------|-------------|
| 🔴 **Critical** | App crashes, data loss, security breach, no workaround |
| 🟠 **High** | Core feature broken, affects many users, workaround is painful |
| 🟡 **Medium** | Feature partially broken, workaround exists |
| 🟢 **Low** | UI glitch, minor inconvenience, rare scenario |

### Regression Areas
List 3–6 features or flows that could also be broken.
Think: what shares the same code, API, or component as the broken thing?

### Quick Verification Steps
2–4 steps to reproduce and confirm the bug right now.

---

## Example

**Input:** "Login button does not work on Safari after entering valid credentials"

**Bug Summary:** The login button fails to submit credentials on Safari browser despite valid input.

**Possible Root Causes:**
1. JavaScript compatibility issue — Safari uses WebKit which may block certain JS events
2. Button `disabled` state not being reset after form validation
3. CORS policy blocking the auth API call from Safari's stricter origin rules
4. CSS `pointer-events: none` accidentally applied on Safari via vendor prefix
5. Third-party cookie blocked by Safari ITP (Intelligent Tracking Prevention) affecting session

**Severity:** 🟠 High — Core feature (login) is broken on a major browser. Users on iOS/macOS cannot access the app at all.

**Regression Areas:**
- Sign up flow (uses same form submit logic)
- Forgot password (same auth API)
- Social login / SSO (same session handling)
- Any other form submission in the app
- Mobile Safari (likely same issue on iPhone)

**Quick Verification Steps:**
1. Open app on Safari (macOS or iOS)
2. Enter valid email and password
3. Click Login — observe: button unresponsive or no API call in Network tab
4. Open Safari DevTools → Console → check for JS errors

---

## Rules
- Always give specific root causes, never generic ones
- Regression areas must relate logically to the bug (same code path, API, or component)
- If bug description is too vague, ask: "What browser/device? What error message if any? What did you expect vs what happened?"
- Never blame the user — bugs are always system issues
